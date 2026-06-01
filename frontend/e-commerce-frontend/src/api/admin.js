import { API_BASE, ApiError, apiRequest } from './client';

async function downloadAdminFile(path, fallbackName) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    let message = 'Download failed';
    try {
      const body = await response.json();
      message = body.detail || body.title || message;
    } catch {
      // Keep the generic message when the server returned a non-JSON error.
    }
    throw new ApiError(response.status, message);
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackName;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function reportQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set('from', new Date(filters.from).toISOString());
  if (filters.to) params.set('to', new Date(filters.to).toISOString());
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  const query = params.toString();
  return query ? `?${query}` : '';
}

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
  exportOrdersCsv: (filters) =>
    downloadAdminFile(`/api/admin/reports/orders.csv${reportQuery(filters)}`, 'orders.csv'),
  exportCustomersCsv: (filters) =>
    downloadAdminFile(`/api/admin/reports/customers.csv${reportQuery(filters)}`, 'customers.csv'),
  exportProductsCsv: (filters) =>
    downloadAdminFile(`/api/admin/reports/products.csv${reportQuery(filters)}`, 'products-inventory.csv'),
  downloadInvoicePdf: (orderId) =>
    downloadAdminFile(`/api/admin/reports/orders/${orderId}/invoice.pdf`, `invoice-${orderId}.pdf`),
};
