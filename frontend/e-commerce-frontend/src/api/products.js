import { apiRequest } from './client';

export const productsApi = {
  adminList: (page = 0, size = 100) =>
    apiRequest(`/api/products/admin/all?page=${page}&size=${size}`),
  list: ({ categoryId, search, minPrice, maxPrice, inStock, minRating, page = 0, size = 12, sort } = {}, options = {}) => {
    const params = new URLSearchParams({ page, size });
    if (categoryId) params.set('categoryId', categoryId);
    if (search) params.set('search', search);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (inStock) params.set('inStock', 'true');
    if (minRating) params.set('minRating', minRating);
    if (sort) params.set('sort', sort);
    return apiRequest(`/api/products?${params}`, options);
  },
  get: (id, options = {}) => {
    const path = /^\d+$/.test(String(id))
      ? `/api/products/${id}`
      : `/api/products/slug/${encodeURIComponent(id)}`;
    return apiRequest(path, options);
  },
  featured: (options = {}) => apiRequest('/api/products/featured?size=8', options),
  create: (data) =>
    apiRequest('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/api/products/${id}`, { method: 'DELETE' }),
  related: (id, options = {}) => apiRequest(`/api/products/${id}/related?size=4`, options),
  addImage: (id, data) =>
    apiRequest(`/api/products/${id}/images`, { method: 'POST', body: JSON.stringify(data) }),
  updateImage: (id, imageId, data) =>
    apiRequest(`/api/products/${id}/images/${imageId}`, { method: 'PUT', body: JSON.stringify(data) }),
  reorderImages: (id, images) =>
    apiRequest(`/api/products/${id}/images/order`, { method: 'PUT', body: JSON.stringify({ images }) }),
  deleteImage: (id, imageId) =>
    apiRequest(`/api/products/${id}/images/${imageId}`, { method: 'DELETE' }),
};
