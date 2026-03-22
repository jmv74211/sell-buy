import apiClient from './api'
import type { Estimation } from '@/types/api'

export const estimationService = {
  getAll: async (): Promise<Estimation[]> => {
    const response = await apiClient.get('/estimations/')
    return response.data
  },

  getOne: async (id: number): Promise<Estimation> => {
    const response = await apiClient.get(`/estimations/${id}`)
    return response.data
  },

  create: async (estimation: Partial<Estimation>): Promise<Estimation> => {
    const response = await apiClient.post('/estimations/', estimation)
    return response.data
  },

  update: async (id: number, estimation: Partial<Estimation>): Promise<Estimation> => {
    const response = await apiClient.put(`/estimations/${id}`, estimation)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/estimations/${id}`)
  },
}
