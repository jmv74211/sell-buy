import { create } from 'zustand'
import type { User } from '@/types/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user: User, token: string) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('accessToken', token)
    set({ user, token, isLoading: false })
  },

  clearAuth: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('accessToken')
    set({ user: null, token: null, isLoading: false })
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  initializeAuth: () => {
    const user = localStorage.getItem('user')
    const token = localStorage.getItem('accessToken')
    if (user && token) {
      set({ user: JSON.parse(user), token, isLoading: false })
    } else {
      set({ isLoading: false })
    }
  },
}))
