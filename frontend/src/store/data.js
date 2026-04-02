import { create } from 'zustand';
export const useDataStore = create((set) => ({
    purchases: [],
    sales: [],
    setPurchases: (purchases) => set({ purchases }),
    setSales: (sales) => set({ sales }),
    addPurchase: (purchase) => set((state) => ({ purchases: [...state.purchases, purchase] })),
    addSale: (sale) => set((state) => ({ sales: [...state.sales, sale] })),
    updatePurchase: (purchase) => set((state) => ({
        purchases: state.purchases.map((p) => p.id === purchase.id ? purchase : p),
    })),
    updateSale: (sale) => set((state) => ({
        sales: state.sales.map((s) => (s.id === sale.id ? sale : s)),
    })),
    removePurchase: (id) => set((state) => ({
        purchases: state.purchases.filter((p) => p.id !== id),
    })),
    removeSale: (id) => set((state) => ({
        sales: state.sales.filter((s) => s.id !== id),
    })),
}));
