import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { toast } from 'sonner';

export const useCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const { activeShop } = useAppSelector((state) => state.shops);

    const fetchCustomers = useCallback(async () => {
        if (!activeShop) return;
        setIsLoading(true);
        try {
            const { data } = await api.get(`/customers?shopId=${activeShop.id}`);
            setCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
            // toast.error('Failed to load customers');
        } finally {
            setIsLoading(false);
        }
    }, [activeShop]);

    const createCustomer = {
        mutateAsync: async (customerData) => {
            if (!activeShop) throw new Error("No active shop");
            try {
                const { data } = await api.post('/customers', { ...customerData, shopId: activeShop.id });
                await fetchCustomers();
                return data;
            } catch (error) {
                console.error('Error creating customer:', error);
                throw error;
            }
        }
    };

    const updateCustomer = {
        mutateAsync: async ({ id, ...updates }) => {
            try {
                const { data } = await api.put(`/customers/${id}`, updates);
                await fetchCustomers();
                return data;
            } catch (error) {
                console.error('Error updating customer:', error);
                throw error;
            }
        }
    };

    const deleteCustomer = {
        mutateAsync: async (id) => {
            try {
                await api.delete(`/customers/${id}`);
                await fetchCustomers();
            } catch (error) {
                console.error('Error deleting customer:', error);
                throw error;
            }
        }
    };

    return {
        customers,
        isLoading,
        fetchCustomers,
        createCustomer,
        updateCustomer,
        deleteCustomer,
    };
};

export const useCustomerPricing = (customerId) => {
    const [pricing, setPricing] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchPricing = useCallback(async () => {
        if (!customerId) return;
        setIsLoading(true);
        try {
            const { data } = await api.get(`/customers/${customerId}/pricing`);
            setPricing(data || []);
        } catch (error) {
            console.error('Error fetching customer pricing:', error);
        } finally {
            setIsLoading(false);
        }
    }, [customerId]);

    const upsertPricing = {
        mutateAsync: async (data) => {
            try {
                const result = await api.post(`/customers/${customerId}/pricing`, data);
                await fetchPricing();
                return result.data;
            } catch (error) {
                console.error('Error upserting pricing:', error);
                throw error;
            }
        }
    };

    return {
        pricing,
        isLoading,
        fetchPricing,
        upsertPricing,
    };
};

export const useCustomerHistory = (customerId) => {
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchHistory = useCallback(async () => {
        if (!customerId) return;
        setIsLoading(true);
        try {
            const { data } = await api.get(`/customers/${customerId}/history`);
            setHistory(data || []);
        } catch (error) {
            console.error('Error fetching customer history:', error);
        } finally {
            setIsLoading(false);
        }
    }, [customerId]);

    // Calculate stats from history
    const totalSpent = (history || []).reduce((sum, sale) => sum + parseFloat(sale.totalAmount || sale.grandTotal || 0), 0);
    const totalOrders = (history || []).length;

    return {
        history,
        isLoading,
        fetchHistory,
        totalSpent,
        totalOrders,
    };
};
