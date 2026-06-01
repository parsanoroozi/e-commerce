import { API_BASE, apiRequest } from './client';
import { emitAppAction } from '../utils/appEvents';

export const notificationsApi = {
  list: (page = 0, size = 10) => apiRequest(`/api/notifications?page=${page}&size=${size}`, { cache: false }),
  recent: () => apiRequest('/api/notifications/recent', { cache: false }),
  unreadCount: () => apiRequest('/api/notifications/unread-count', { cache: false }),
  settings: () => apiRequest('/api/notifications/settings', { cache: false }),
  updateSettings: (data) => apiRequest('/api/notifications/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  streamUrl: () => `${API_BASE}/api/notifications/stream`,
  markRead: async (id) => {
    const result = await apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' });
    emitAppAction('notifications:item-read', { id: Number(id) });
    return result;
  },
  markAllRead: async () => {
    const result = await apiRequest('/api/notifications/read-all', { method: 'PATCH' });
    emitAppAction('notifications:all-read');
    return result;
  },
  clear: async () => {
    const result = await apiRequest('/api/notifications', { method: 'DELETE' });
    emitAppAction('notifications:cleared');
    return result;
  },
};
