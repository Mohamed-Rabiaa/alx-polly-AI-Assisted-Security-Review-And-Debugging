'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { validateLogin, validateRegister, sanitizeInput } from '../validation/auth-schemas';
import { LoginFormData, RegisterFormData } from '../types';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { attempts: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }
  
  // Reset if lockout period has passed
  if (now - record.lastAttempt > LOCKOUT_DURATION) {
    rateLimitStore.set(identifier, { attempts: 1, lastAttempt: now });
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - 1 };
  }
  
  if (record.attempts >= MAX_ATTEMPTS) {
    return { allowed: false };
  }
  
  record.attempts++;
  record.lastAttempt = now;
  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.attempts };
}

function resetRateLimit(identifier: string) {
  rateLimitStore.delete(identifier);
}

export async function login(data: LoginFormData) {
  try {
    // Validate input data
    const validation = validateLogin(data);
    if (!validation.success) {
      return { 
        error: 'Invalid input data. Please check your email and password.',
        details: validation.error.issues.map(issue => issue.message)
      };
    }

    const { email, password } = validation.data;
    
    // Check rate limiting
    const rateCheck = checkRateLimit(email);
    if (!rateCheck.allowed) {
      return { 
        error: 'Too many failed attempts. Please try again in 15 minutes.',
        rateLimited: true
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: sanitizeInput(email),
      password, // Don't sanitize password as it may contain special chars
    });

    if (error) {
      // Generic error message to prevent information disclosure
      return { 
        error: 'Invalid email or password. Please try again.',
        remainingAttempts: rateCheck.remainingAttempts
      };
    }

    // Reset rate limit on successful login
    resetRateLimit(email);
    
    // Server-side redirect
    redirect('/polls');
  } catch (error) {
    console.error('Login error:', error);
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

export async function register(data: RegisterFormData) {
  try {
    // Validate input data
    const validation = validateRegister(data);
    if (!validation.success) {
      return { 
        error: 'Invalid input data. Please check all fields.',
        details: validation.error.issues.map(issue => issue.message)
      };
    }

    const { name, email, password } = validation.data;
    
    // Check rate limiting for registration
    const rateCheck = checkRateLimit(`register_${email}`);
    if (!rateCheck.allowed) {
      return { 
        error: 'Too many registration attempts. Please try again in 15 minutes.',
        rateLimited: true
      };
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email: sanitizeInput(email),
      password, // Don't sanitize password
      options: {
        data: {
          name: sanitizeInput(name),
        },
      },
    });

    if (error) {
      // Handle specific registration errors
      if (error.message.includes('already registered')) {
        return { error: 'An account with this email already exists.' };
      }
      return { error: 'Registration failed. Please try again.' };
    }

    // Reset rate limit on successful registration
    resetRateLimit(`register_${email}`);
    
    // Server-side redirect
    redirect('/polls');
  } catch (error) {
    console.error('Registration error:', error);
    return { error: 'An unexpected error occurred. Please try again later.' };
  }
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}
