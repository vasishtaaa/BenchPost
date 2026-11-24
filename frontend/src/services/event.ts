import { apiClient } from './api';
import type { Event, EventListResponse, CreateEventInput, EventAttendee } from '../types/event';

export const eventService = {
  getEvents: async (params?: {
    category?: string;
    upcoming_only?: boolean;
    registered_only?: boolean;
    community_id?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<EventListResponse> => {
    const res = await apiClient.get('/events', { params });
    return res.data;
  },

  getEvent: async (id: string): Promise<Event> => {
    const res = await apiClient.get(`/events/${id}`);
    return res.data;
  },

  createEvent: async (data: CreateEventInput): Promise<Event> => {
    const res = await apiClient.post('/events', data);
    return res.data;
  },

  registerForEvent: async (id: string): Promise<Event> => {
    const res = await apiClient.post(`/events/${id}/register`);
    return res.data;
  },

  cancelRegistration: async (id: string): Promise<Event> => {
    const res = await apiClient.delete(`/events/${id}/register`);
    return res.data;
  },

  getAttendees: async (id: string): Promise<EventAttendee[]> => {
    const res = await apiClient.get(`/events/${id}/attendees`);
    return res.data;
  },
};
