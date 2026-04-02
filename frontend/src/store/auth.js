import { create } from 'zustand';
export const useAuthStore = create((set) => ({
    user: null,
    token: null,
    isLoading: true,
    setAuth: (user, token) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('accessToken', token);
        set({ user, token, isLoading: false });
    },
    clearAuth: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
        set({ user: null, token: null, isLoading: false });
    },
    setLoading: (loading) => set({ isLoading: loading }),
    initializeAuth: () => {
        const user = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');
        if (user && token) {
            set({ user: JSON.parse(user), token, isLoading: false });
        }
        else {
            set({ isLoading: false });
        }
    },
}));
