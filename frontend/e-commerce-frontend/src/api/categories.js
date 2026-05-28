import { apiRequest } from './client';

export const categoriesApi = {
  list: () => apiRequest('/api/categories'),
  create: (data) =>
    apiRequest('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    apiRequest(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => apiRequest(`/api/categories/${id}`, { method: 'DELETE' }),
};
