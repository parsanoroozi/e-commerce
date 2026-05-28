import { apiRequest } from './client';

export const authApi = {
  register: (data) =>
    apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiRequest('/api/auth/me'),
  updateProfile: (data) =>
    apiRequest('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data) =>
    apiRequest('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  forgotPassword: (email) =>
    apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (data) =>
    apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
};
