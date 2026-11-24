import { apiClient } from './api';
import type { 
  AuthResponse, 
  LoginInput, 
  RegisterInput, 
  User, 
  UserProfile, 
  ProfileUpdateInput, 
  PasswordChangeInput 
} from '../types/auth';

export const authService = {
  async register(data: RegisterInput): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },

  async login(data: LoginInput): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', data);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await apiClient.get<User>('/auth/me');
    return res.data;
  },

  async updateProfile(data: ProfileUpdateInput): Promise<UserProfile> {
    const res = await apiClient.put<UserProfile>('/users/profile', data);
    return res.data;
  },

  async changePassword(data: PasswordChangeInput): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>('/auth/change-password', data);
    return res.data;
  },
};
