import { useRoles } from '@/hooks/useRoles';
export const RoleGuard = ({ children, allowedRoles, fallback = null }) => {
    const { hasAnyRole, isLoading } = useRoles();
    if (isLoading) {
        return null;
    }
    if (!hasAnyRole(allowedRoles)) {
        return <>{fallback}</>;
    }
    return <>{children}</>;
};
// Permission constants for different features
export const PERMISSIONS = {
    // Dashboard
    VIEW_DASHBOARD: ['admin', 'manager', 'cashier'],
    // POS
    USE_POS: ['admin', 'manager', 'cashier'],
    APPLY_DISCOUNTS: ['admin', 'manager'],
    // Products
    VIEW_PRODUCTS: ['admin', 'manager', 'cashier'],
    MANAGE_PRODUCTS: ['admin', 'manager'],
    // Inventory
    VIEW_INVENTORY: ['admin', 'manager', 'cashier'],
    MANAGE_INVENTORY: ['admin', 'manager'],
    // Sales
    VIEW_SALES: ['admin', 'manager'],
    VIEW_OWN_SALES: ['admin', 'manager', 'cashier'],
    // Reports
    VIEW_REPORTS: ['admin', 'manager'],
    VIEW_FINANCIAL_REPORTS: ['admin'],
    // Suppliers
    VIEW_SUPPLIERS: ['admin', 'manager'],
    MANAGE_SUPPLIERS: ['admin', 'manager'],
    // Customers
    VIEW_CUSTOMERS: ['admin', 'manager', 'cashier'],
    MANAGE_CUSTOMERS: ['admin', 'manager'],
    // Users
    MANAGE_USERS: ['admin'],
    // Settings
    MANAGE_SETTINGS: ['admin'],
};
