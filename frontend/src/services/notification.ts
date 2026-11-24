import { apiClient } from './api';
import type { Notification, NotificationListResponse } from '../types/notification';

export const notificationService = {
  async getNotifications(unreadOnly: boolean = false, limit: number = 50, offset: number = 0): Promise<NotificationListResponse> {
    const res = await apiClient.get<NotificationListResponse>('/notifications', {
      params: {
        unread_only: unreadOnly,
        limit,
        offset,
      },
    });
    return res.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const res = await apiClient.patch<Notification>(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllAsRead(): Promise<{ success: boolean; marked_count: number }> {
    const res = await apiClient.post<{ success: boolean; marked_count: number }>('/notifications/mark-all-read');
    return res.data;
  },
};
