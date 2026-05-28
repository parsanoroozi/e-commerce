import { apiRequest } from './client';

export const wishlistApi = {
  list: () => apiRequest('/api/wishlist'),
  count: () => apiRequest('/api/wishlist/count'),
  add: (productId) => apiRequest(`/api/wishlist/${productId}`, { method: 'POST' }),
  remove: (productId) => apiRequest(`/api/wishlist/${productId}`, { method: 'DELETE' }),
};
