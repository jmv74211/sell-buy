import apiClient from './api'
import type { AuthToken, User } from '@/types/api'

export const authService = {
  register: async (userData: {
    user_name: string
    name: string
    email: string
    password: string
  }): Promise<User> => {
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  },

  login: async (user_name: string, password: string): Promise<AuthToken> => {
    const response = await apiClient.post('/auth/login', { user_name, password })
    return response.data
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },

  logout: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  },
}
