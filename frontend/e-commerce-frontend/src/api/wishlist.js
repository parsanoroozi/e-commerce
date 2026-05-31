import { apiRequest } from './client';
import { emitAppAction } from '../utils/appEvents';

export const wishlistApi = {
  list: (page = 0, size = 12) => apiRequest(`/api/wishlist?page=${page}&size=${size}`),
  listAll: () => apiRequest('/api/wishlist/all'),
  count: () => apiRequest('/api/wishlist/count', { cache: false }),
  add: async (productId) => {
    const result = await apiRequest(`/api/wishlist/${productId}`, { method: 'POST' });
    emitAppAction('wishlist:item-added', { productId: Number(productId) });
    return result;
  },
  remove: async (productId) => {
    const result = await apiRequest(`/api/wishlist/${productId}`, { method: 'DELETE' });
    emitAppAction('wishlist:item-removed', { productId: Number(productId) });
    return result;
  },
};
