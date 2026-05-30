import { apiRequest } from './client';
import { emitAppAction } from '../utils/appEvents';

export const wishlistApi = {
  list: () => apiRequest('/api/wishlist'),
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
