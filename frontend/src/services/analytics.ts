import apiClient from './api'
import type { SummaryStats } from '@/types/api'

export const analyticsService = {
  getSummary: async (): Promise<SummaryStats> => {
    const response = await apiClient.get('/analytics/summary')
    return response.data
  },

  getMonthly: async () => {
    const response = await apiClient.get('/analytics/monthly')
    return response.data
  },

  getProfitByArticle: async () => {
    const response = await apiClient.get('/analytics/profit-by-article')
    return response.data
  },
}
