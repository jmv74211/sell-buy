import apiClient from './api';
export const purchaseService = {
    getAll: async () => {
        const response = await apiClient.get('/purchases/');
        return response.data;
    },
    getOne: async (id) => {
        const response = await apiClient.get(`/purchases/${id}`);
        return response.data;
    },
    create: async (purchase) => {
        const response = await apiClient.post('/purchases/', purchase);
        return response.data;
    },
    update: async (id, purchase) => {
        const response = await apiClient.put(`/purchases/${id}`, purchase);
        return response.data;
    },
    delete: async (id) => {
        await apiClient.delete(`/purchases/${id}`);
    },
};
