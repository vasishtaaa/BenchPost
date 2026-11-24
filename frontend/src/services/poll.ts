import { apiClient } from './api';
import type { Poll, CreatePollInput } from '../types/poll';

export const pollService = {
  getPolls: async (params?: { community_id?: string; limit?: number }): Promise<Poll[]> => {
    const res = await apiClient.get('/polls', { params });
    return res.data;
  },

  createPoll: async (data: CreatePollInput): Promise<Poll> => {
    const res = await apiClient.post('/polls', data);
    return res.data;
  },

  getPoll: async (id: string): Promise<Poll> => {
    const res = await apiClient.get(`/polls/${id}`);
    return res.data;
  },

  getPollByPost: async (postId: string): Promise<Poll | null> => {
    const res = await apiClient.get(`/polls/by-post/${postId}`);
    return res.data;
  },

  vote: async (pollId: string, optionIds: string[]): Promise<Poll> => {
    const res = await apiClient.post(`/polls/${pollId}/vote`, { option_ids: optionIds });
    return res.data;
  },
};
