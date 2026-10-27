import apiClient from './api'
import type { Expense } from '@/types/api'

export const expenseService = {
  getAll: async (): Promise<Expense[]> => {
    const response = await apiClient.get('/expenses/')
    return response.data
  },
  create: async (expense: Partial<Expense>): Promise<Expense> => {
    const response = await apiClient.post('/expenses/', expense)
    return response.data
  },
  update: async (id: number, expense: Partial<Expense>): Promise<Expense> => {
    const response = await apiClient.put(`/expenses/${id}`, expense)
    return response.data
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`)
  },
}