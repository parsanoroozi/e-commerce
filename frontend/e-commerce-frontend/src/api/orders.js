import { apiRequest } from './client';

export const ordersApi = {
  paymentConfig: () => apiRequest('/api/orders/payment-config'),
  initiateCheckout: (data) =>
    apiRequest('/api/orders/checkout/initiate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  confirmPayment: (orderId) =>
    apiRequest(`/api/orders/${orderId}/confirm-payment`, { method: 'POST' }),
  myOrders: (page = 0) => apiRequest(`/api/orders?page=${page}&size=10`),
  get: (id) => apiRequest(`/api/orders/${id}`),
  adminAll: (page = 0) =>
    apiRequest(`/api/orders/admin/all?page=${page}&size=10`),
  updateStatus: (id, data) =>
    apiRequest(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(typeof data === 'string' ? { status: data } : data),
    }),
  cancel: (id) => apiRequest(`/api/orders/${id}/cancel`, { method: 'POST' }),
  refund: (id, data) =>
    apiRequest(`/api/orders/${id}/refunds`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
