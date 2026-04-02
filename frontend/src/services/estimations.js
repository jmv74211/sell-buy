import apiClient from './api';
export const estimationService = {
    getAll: async () => {
        const response = await apiClient.get('/estimations/');
        return response.data;
    },
    getOne: async (id) => {
        const response = await apiClient.get(`/estimations/${id}`);
        return response.data;
    },
    create: async (estimation) => {
        const response = await apiClient.post('/estimations/', estimation);
        return response.data;
    },
    update: async (id, estimation) => {
        const response = await apiClient.put(`/estimations/${id}`, estimation);
        return response.data;
    },
    delete: async (id) => {
        await apiClient.delete(`/estimations/${id}`);
    },
};
