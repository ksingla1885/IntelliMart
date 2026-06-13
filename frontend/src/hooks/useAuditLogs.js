import { useState, useCallback } from 'react';
import api from '@/lib/api';

export function useAuditLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const fetchLogs = useCallback(async (filters = {}, page = 1, pageSize = 50) => {
        setLoading(true);
        try {
            const params = {
                page,
                pageSize,
                ...filters
            };
            const { data } = await api.get('/audit-logs', { params });
            setLogs(data.logs || []);
            setTotalCount(data.totalCount || 0);
        }
        catch (error) {
            console.error('Error fetching audit logs:', error);
        }
        finally {
            setLoading(false);
        }
    }, []);

    const getTableNames = useCallback(async () => {
        try {
            const { data } = await api.get('/audit-logs/tables');
            return data || [];
        }
        catch (error) {
            console.error('Error fetching table names:', error);
            return [];
        }
    }, []);

    return {
        logs,
        loading,
        totalCount,
        fetchLogs,
        getTableNames
    };
}
