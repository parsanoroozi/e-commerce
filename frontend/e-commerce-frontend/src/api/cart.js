import { apiRequest } from './client';

export const cartApi = {
  get: () => apiRequest('/api/cart'),
  addItem: (data) =>
    apiRequest('/api/cart/items', { method: 'POST', body: JSON.stringify(data) }),
  updateItem: (productId, data) =>
    apiRequest(`/api/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  removeItem: (productId) =>
    apiRequest(`/api/cart/items/${productId}`, { method: 'DELETE' }),
  clear: () => apiRequest('/api/cart', { method: 'DELETE' }),
};
