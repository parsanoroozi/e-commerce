import { apiRequest } from './client';

export const productsApi = {
  adminList: (page = 0, size = 100) =>
    apiRequest(`/api/products/admin/all?page=${page}&size=${size}`),
  list: ({ categoryId, search, page = 0, size = 12, sort } = {}, options = {}) => {
    const params = new URLSearchParams({ page, size });
    if (categoryId) params.set('categoryId', categoryId);
    if (search) params.set('search', search);
    if (sort) params.set('sort', sort);
    return apiRequest(`/api/products?${params}`, options);
  },
  get: (id, options = {}) => apiRequest(`/api/products/${id}`, options),
  create: (data) =>
    apiRequest('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/api/products/${id}`, { method: 'DELETE' }),
  related: (id, options = {}) => apiRequest(`/api/products/${id}/related?size=4`, options),
};
