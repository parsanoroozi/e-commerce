import { apiRequest } from './client';

export const productsApi = {
  adminList: (page = 0, size = 100) =>
    apiRequest(`/api/products/admin/all?page=${page}&size=${size}`),
  list: ({ categoryId, search, page = 0, size = 12 } = {}) => {
    const params = new URLSearchParams({ page, size });
    if (categoryId) params.set('categoryId', categoryId);
    if (search) params.set('search', search);
    return apiRequest(`/api/products?${params}`);
  },
  get: (id) => apiRequest(`/api/products/${id}`),
  create: (data) =>
    apiRequest('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/api/products/${id}`, { method: 'DELETE' }),
};
