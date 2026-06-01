import { apiRequest } from './client';

export const couponsApi = {
  validate: (code, subtotal) =>
    apiRequest('/api/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    }),
  adminList: () => apiRequest('/api/admin/coupons'),
  create: (data) =>
    apiRequest('/api/admin/coupons', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/api/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/api/admin/coupons/${id}`, { method: 'DELETE' }),
};
