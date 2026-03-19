import axiosClient from './axiosClient';
import type { AuthResponse } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    axiosClient.post<AuthResponse>('/auth/login', { email, password }),

  register: (data: { name: string; email: string; password: string }) =>
    axiosClient.post<AuthResponse>('/auth/register', data),

  getProfile: () =>
    axiosClient.get('/auth/profile'),
};
