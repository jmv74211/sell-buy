import apiClient from './api'
import type { Sale } from '@/types/api'

export const saleService = {
  getAll: async (): Promise<Sale[]> => {
    const response = await apiClient.get('/sales/')
    return response.data
  },

  getOne: async (id: number): Promise<Sale> => {
    const response = await apiClient.get(`/sales/${id}`)
    return response.data
  },

  create: async (sale: Partial<Sale>): Promise<Sale> => {
    const response = await apiClient.post('/sales/', sale)
    return response.data
  },

  update: async (id: number, sale: Partial<Sale>): Promise<Sale> => {
    const response = await apiClient.put(`/sales/${id}`, sale)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/sales/${id}`)
  },
}
