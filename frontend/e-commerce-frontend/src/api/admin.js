import { apiRequest } from './client';

export const adminApi = {
  dashboard: () => apiRequest('/api/admin/dashboard'),
  settings: () => apiRequest('/api/admin/settings'),
  updateLowStockThreshold: (lowStockThreshold) =>
    apiRequest('/api/admin/settings/low-stock-threshold', {
      method: 'PATCH',
      body: JSON.stringify({ lowStockThreshold }),
    }),
  updateSettings: (data) =>
    apiRequest('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  auditLogs: (page = 0) => apiRequest(`/api/admin/audit-logs?page=${page}&size=20`),
  users: (page = 0, size = 20) => apiRequest(`/api/admin/users?page=${page}&size=${size}`),
  user: (id) => apiRequest(`/api/admin/users/${id}`),
  updateUser: (id, data) =>
    apiRequest(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  sendUserPasswordReset: (id) =>
    apiRequest(`/api/admin/users/${id}/password-reset`, { method: 'POST' }),
  deleteUser: (id) => apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' }),
  adjustInventory: (data) =>
    apiRequest('/api/admin/inventory/adjustments', { method: 'POST', body: JSON.stringify(data) }),
  inventoryHistory: (page = 0, size = 10) =>
    apiRequest(`/api/admin/inventory/adjustments?page=${page}&size=${size}`),
};
