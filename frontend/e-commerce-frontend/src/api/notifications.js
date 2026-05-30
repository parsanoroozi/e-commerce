import { apiRequest } from './client';

export const notificationsApi = {
  list: () => apiRequest('/api/notifications', { cache: false }),
  unreadCount: () => apiRequest('/api/notifications/unread-count', { cache: false }),
  markRead: (id) => apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead: () => apiRequest('/api/notifications/read-all', { method: 'PATCH' }),
};
