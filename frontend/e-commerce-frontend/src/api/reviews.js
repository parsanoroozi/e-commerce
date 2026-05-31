import { apiRequest } from './client';

export const reviewsApi = {
  list: (productId, page = 0, options = {}) =>
    apiRequest(`/api/products/${productId}/reviews?page=${page}&size=10`, options),
  create: (productId, data) =>
    apiRequest(`/api/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
