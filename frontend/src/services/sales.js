import apiClient from './api';
export const saleService = {
    getAll: async () => {
        const response = await apiClient.get('/sales/');
        return response.data;
    },
    getOne: async (id) => {
        const response = await apiClient.get(`/sales/${id}`);
        return response.data;
    },
    create: async (sale) => {
        const response = await apiClient.post('/sales/', sale);
        return response.data;
    },
    update: async (id, sale) => {
        const response = await apiClient.put(`/sales/${id}`, sale);
        return response.data;
    },
    delete: async (id) => {
        await apiClient.delete(`/sales/${id}`);
    },
};
