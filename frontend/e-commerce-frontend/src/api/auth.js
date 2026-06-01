import { apiRequest } from './client';

export const authApi = {
  sendEmailVerification: (email) =>
    apiRequest('/api/auth/email-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  register: (data) =>
    apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) =>
    apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  verifyTwoFactor: (data) =>
    apiRequest('/api/auth/login/2fa', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiRequest('/api/auth/me'),
  updateProfile: (data) =>
    apiRequest('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data) =>
    apiRequest('/api/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST', notify: false }),
  sessions: () => apiRequest('/api/auth/sessions'),
  revokeSession: (id) => apiRequest(`/api/auth/sessions/${id}`, { method: 'DELETE' }),
  updateTwoFactor: (enabled) =>
    apiRequest('/api/auth/2fa', { method: 'PATCH', body: JSON.stringify({ enabled }) }),
  forgotPassword: (email) =>
    apiRequest('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (data) =>
    apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(data) }),
};
