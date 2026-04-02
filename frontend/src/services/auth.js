import apiClient from './api';
export const authService = {
    register: async (userData) => {
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    },
    login: async (user_name, password) => {
        const response = await apiClient.post('/auth/login', { user_name, password });
        return response.data;
    },
    getMe: async () => {
        const response = await apiClient.get('/auth/me');
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
    },
};
