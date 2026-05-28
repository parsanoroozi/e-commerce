import { apiRequest } from './client';

export const adminApi = {
  dashboard: () => apiRequest('/api/admin/dashboard'),
  auditLogs: (page = 0) => apiRequest(`/api/admin/audit-logs?page=${page}&size=20`),
};
