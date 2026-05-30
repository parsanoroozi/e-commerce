import { apiRequest } from './client';

export const adminApi = {
  dashboard: () => apiRequest('/api/admin/dashboard'),
  settings: () => apiRequest('/api/admin/settings'),
  updateLowStockThreshold: (lowStockThreshold) =>
    apiRequest('/api/admin/settings/low-stock-threshold', {
      method: 'PATCH',
      body: JSON.stringify({ lowStockThreshold }),
    }),
  auditLogs: (page = 0) => apiRequest(`/api/admin/audit-logs?page=${page}&size=20`),
};
