export type UserRole = 'STUDENT' | 'FACULTY' | 'ADMIN';

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  student_id?: string | null;
  department?: string | null;
  course?: string | null;
  academic_year?: number | null;
  avatar_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  profile?: UserProfile | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  student_id?: string;
  department?: string;
  course?: string;
  academic_year?: number;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ProfileUpdateInput {
  full_name?: string;
  department?: string;
  course?: string;
  academic_year?: number;
  avatar_url?: string;
  bio?: string;
}

export interface PasswordChangeInput {
  old_password: string;
  new_password: string;
}
