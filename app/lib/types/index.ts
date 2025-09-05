// User types
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Poll types
export interface PollOption {
  id: string;
  option_text: string;
  votes: number;
  poll_id: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  options?: PollOption[];
}

export interface PollSettings {
  allowMultipleVotes: boolean;
  requireAuthentication: boolean;
}

// Vote types
export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id?: string; // Optional if anonymous voting is allowed
  created_at: Date;
}

// Form types
export interface CreatePollFormData {
  title: string;
  description?: string;
  options: string[];
  settings?: PollSettings;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}