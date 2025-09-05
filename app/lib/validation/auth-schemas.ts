import { z } from 'zod';

// Password validation schema with security requirements
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

// Email validation schema
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .max(254, 'Email address is too long')
  .toLowerCase()
  .trim();

// Name validation schema
const nameSchema = z
  .string()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .trim()
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Login form validation schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Register form validation schema
export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

// Password confirmation schema for registration
export const registerWithConfirmSchema = registerSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Type exports
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type RegisterWithConfirmData = z.infer<typeof registerWithConfirmSchema>;

// Validation helper functions
export function validateLogin(data: unknown) {
  return loginSchema.safeParse(data);
}

export function validateRegister(data: unknown) {
  return registerSchema.safeParse(data);
}

export function validateRegisterWithConfirm(data: unknown) {
  return registerWithConfirmSchema.safeParse(data);
}

// Sanitize user input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[match] || match;
    });
}