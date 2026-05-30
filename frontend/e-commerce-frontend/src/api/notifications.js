import { apiRequest } from './client';
import { emitAppAction } from '../utils/appEvents';

export const notificationsApi = {
  list: () => apiRequest('/api/notifications', { cache: false }),
  unreadCount: () => apiRequest('/api/notifications/unread-count', { cache: false }),
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
};
