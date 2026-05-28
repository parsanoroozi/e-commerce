import { apiRequest } from './client';

export const shippingAddressesApi = {
  list: () => apiRequest('/api/shipping-addresses'),
  create: (data) =>
    apiRequest('/api/shipping-addresses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/api/shipping-addresses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/api/shipping-addresses/${id}`, { method: 'DELETE' }),
  setDefault: (id) =>
    apiRequest(`/api/shipping-addresses/${id}/default`, { method: 'PATCH' }),
};
