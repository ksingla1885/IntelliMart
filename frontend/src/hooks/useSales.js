import { useState, useCallback } from 'react';
import api from '@/lib/api';
import { useAppSelector } from '@/store/hooks';
import { toast } from 'sonner';

export function useSales() {
    const [loading, setLoading] = useState(false);
    const { activeShop } = useAppSelector((state) => state.shops);

    const createSale = async (data) => {
        if (!activeShop) throw new Error("No active shop");
        setLoading(true);
        try {
            // Map frontend payment methods to backend schema
            const paymentModeMap = {
                'cash': 'CASH',
                'card': 'NET_BANKING',
                'mobile': 'UPI',
                'other': 'CASH'
            };

            const payload = {
                shopId: activeShop.id,
                // customerId removed from here to add conditionally
                customerName: data.customer?.name || "Walk-in Customer",
                customerMobile: data.customer?.phone || "",
                paymentMode: paymentModeMap[data.payment_method] || 'CASH',
                notes: data.notes,
                items: data.items.map(item => ({
                    productId: item.product_id || item.productId,
                    quantity: item.quantity,
                    price: item.unit_price || item.price,
                    taxRate: 18 // Default 18% as used in frontend calculations
                }))
            };

            // Only add customerId if it exists to avoid backend errors
            if (data.customer?.id) {
                payload.customerId = data.customer.id;
            }

            // FORCE LOCALHOST: If running on localhost, prefer local backend to avoid hitting stale Vercel deployment
            const requestConfig = {};
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                // Check if the current configured API URL is pointing to Vercel (incorrectly)
                if (api.defaults.baseURL && api.defaults.baseURL.includes('vercel.app')) {
                    console.warn("Detected localhost frontend using production backend. Forcing local backend for billing.");
                    requestConfig.baseURL = 'http://localhost:5000/api';
                }
            }

            const { data: sale } = await api.post('/billing', payload, requestConfig);

            toast.success("Sale completed successfully", {
                description: `Invoice #${sale.billNumber} created`
            });

            return sale;
        } catch (error) {
            console.error('Error creating sale:', error);
            const errorMessage = error.response?.data?.error || "Failed to process sale";

            // Add helpful hint if 500 error on Vercel
            if (error.response?.status === 500 && error.config?.url?.includes('vercel.app')) {
                toast.error("Backend Error (500)", {
                    description: "Your frontend is connected to the outdated Vercel backend. useSales.js attempted to fix this but failed. Please restart your frontend server."
                });
            } else {
                toast.error(errorMessage);
            }
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const fetchSales = useCallback(async (filters = {}) => {
        if (!activeShop) return [];
        setLoading(true);
        try {
            const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
                if (value !== undefined && value !== null) acc[key] = value;
                return acc;
            }, {});
            const params = new URLSearchParams({
                shopId: activeShop.id,
                ...cleanFilters
            });
            const { data } = await api.get(`/billing?${params.toString()}`);
            return data;
        } catch (error) {
            console.error('Error fetching sales:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, [activeShop]);

    const cancelSale = async (saleId) => {
        setLoading(true);
        try {
            const { data } = await api.post(`/billing/${saleId}/cancel`);
            toast.success("Sale cancelled successfully");
            return data;
        } catch (error) {
            console.error('Error cancelling sale:', error);
            toast.error("Failed to cancel sale");
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        createSale,
        fetchSales,
        cancelSale,
    };
}
