import { apiRequest } from './client';

export const authApi = {
  register: (data) =>
    apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiRequest('/api/auth/me'),
};
