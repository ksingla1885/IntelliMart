import { useCallback } from 'react';
import { useAppSelector } from '@/store/hooks';

export const useRoles = () => {
    // Get role from Redux state (populated during login)
    const { user } = useAppSelector((state) => state.auth);

    // Normalize role
    let role = (user?.role || 'user').toLowerCase();

    // Allow 'user' role (default for new signups) to act as 'admin' so they can see all features
    if (role === 'user') {
        role = 'admin';
    }

    const roles = [role]; // API returns single role, treat as array for compatibility

    // Memoize role checks
    const hasRole = useCallback((r) => role === r.toLowerCase(), [role]);
    const hasAnyRole = useCallback((checkRoles) => {
        if (!checkRoles) return true;
        return checkRoles.some((r) => role === r.toLowerCase());
    }, [role]);

    return {
        roles,
        isAdmin: role === 'admin',
        isManager: role === 'manager',
        isCashier: role === 'cashier',
        hasRole,
        hasAnyRole,
        isLoading: false,
        refetch: () => { }, // No-op since we use Redux state
    };
};

// Hook for managing users and their roles (admin only)
// TODO: Refactor to use Express backend API instead of Supabase
export const useUserManagement = () => {
    return {
        users: [],
        isLoading: false,
        fetchUsers: async () => { },
        assignRole: async () => ({ success: false, error: "Not implemented" }),
        removeRole: async () => ({ success: false, error: "Not implemented" }),
    };
};
