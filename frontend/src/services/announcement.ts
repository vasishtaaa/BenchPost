import { apiClient } from './api';
import type { 
  Announcement, 
  AnnouncementListResponse, 
  CreateAnnouncementInput 
} from '../types/announcement';

export const announcementService = {
  getAnnouncements: async (params?: {
    scope?: string;
    priority?: string;
    community_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<AnnouncementListResponse> => {
    const res = await apiClient.get('/announcements', { params });
    return res.data;
  },

  createAnnouncement: async (data: CreateAnnouncementInput): Promise<Announcement> => {
    const res = await apiClient.post('/announcements', data);
    return res.data;
  },

  markAsRead: async (id: string): Promise<Announcement> => {
    const res = await apiClient.post(`/announcements/${id}/read`);
    return res.data;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    await apiClient.delete(`/announcements/${id}`);
  },
};
