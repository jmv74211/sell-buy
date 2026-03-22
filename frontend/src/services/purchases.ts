import apiClient from './api'
import type { Purchase } from '@/types/api'

export const purchaseService = {
  getAll: async (): Promise<Purchase[]> => {
    const response = await apiClient.get('/purchases/')
    return response.data
  },

  getOne: async (id: number): Promise<Purchase> => {
    const response = await apiClient.get(`/purchases/${id}`)
    return response.data
  },

  create: async (purchase: Partial<Purchase>): Promise<Purchase> => {
    const response = await apiClient.post('/purchases/', purchase)
    return response.data
  },

  update: async (id: number, purchase: Partial<Purchase>): Promise<Purchase> => {
    const response = await apiClient.put(`/purchases/${id}`, purchase)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/purchases/${id}`)
  },
}
