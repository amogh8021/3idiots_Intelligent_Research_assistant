import { api } from './api';
import { AuthResponse, User } from '../types';

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/register', payload);
    return res.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await api.post<AuthResponse>('/api/auth/login', payload);
    return res.data;
  },

  async getMe(): Promise<User> {
    const res = await api.get<User>('/api/auth/me');
    return res.data;
  },
};
