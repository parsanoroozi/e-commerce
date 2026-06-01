import { apiRequest } from './client';
import { emitAppAction } from '../utils/appEvents';

export const cartApi = {
  get: (options = {}) => apiRequest('/api/cart', options),
  addItem: async (data) => {
    const result = await apiRequest('/api/cart/items', { method: 'POST', body: JSON.stringify(data) });
    emitAppAction('cart:item-added', {
      productId: Number(data.productId),
      quantity: Number(data.quantity || 1),
      totalItems: result?.totalItems,
    });
    return result;
  },
  updateItem: async (productId, data) => {
    const result = await apiRequest(data.id ? `/api/cart/line-items/${data.id}` : `/api/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    emitAppAction('cart:item-updated', {
      productId: Number(productId),
      quantity: Number(data.quantity || 0),
      totalItems: result?.totalItems,
    });
    return result;
  },
  removeItem: async (productId) => {
    const result = await apiRequest(`/api/cart/items/${productId}`, { method: 'DELETE' });
    emitAppAction('cart:item-removed', {
      productId: Number(productId),
      totalItems: result?.totalItems,
    });
    return result;
  },
  removeLineItem: async (itemId) => {
    const result = await apiRequest(`/api/cart/line-items/${itemId}`, { method: 'DELETE' });
    emitAppAction('cart:item-removed', { totalItems: result?.totalItems });
    return result;
  },
  clear: async () => {
    const result = await apiRequest('/api/cart', { method: 'DELETE' });
    emitAppAction('cart:cleared', { totalItems: 0 });
    return result;
  },
  summary: () => apiRequest('/api/cart/summary', { cache: false }),
};
