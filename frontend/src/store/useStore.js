import { useAppSelector } from './hooks';

/**
 * Custom hook to easily access common store state
 */
export const useStore = () => {
    const auth = useAppSelector((state) => state.auth);
    const shops = useAppSelector((state) => state.shops);
    const products = useAppSelector((state) => state.products);
    const inventory = useAppSelector((state) => state.inventory);
    const ui = useAppSelector((state) => state.ui);

    return {
        // Auth state
        user: auth?.user,
        isAuthenticated: auth?.isAuthenticated,
        loading: auth?.loading,

        // Shop state
        shops: shops?.shops || [],
        activeShop: shops?.activeShop,
        shopLoading: shops?.loading,
        shopError: shops?.error,

        // Inventory state
        inventory: inventory?.items || [],

        // Product state
        products: products?.items || [],

        // UI state
        sidebarOpen: ui?.sidebarOpen,
    };
};
