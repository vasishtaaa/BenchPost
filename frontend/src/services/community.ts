import { apiClient } from './api';
import type { 
  Community, 
  CommunityListResponse, 
  CommunityCreateInput, 
  CommunityMember 
} from '../types/community';

export const communityService = {
  async getCommunities(params?: {
    search?: string;
    category?: string;
    my_communities?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<CommunityListResponse> {
    const res = await apiClient.get<CommunityListResponse>('/communities', { params });
    return res.data;
  },

  async getCommunity(slugOrId: string): Promise<Community> {
    const res = await apiClient.get<Community>(`/communities/${slugOrId}`);
    return res.data;
  },

  async createCommunity(data: CommunityCreateInput): Promise<Community> {
    const res = await apiClient.post<Community>('/communities', data);
    return res.data;
  },

  async updateCommunity(id: string, data: Partial<CommunityCreateInput>): Promise<Community> {
    const res = await apiClient.put<Community>(`/communities/${id}`, data);
    return res.data;
  },

  async joinCommunity(id: string): Promise<{ message: string; status: 'ACTIVE' | 'PENDING' }> {
    const res = await apiClient.post<{ message: string; status: 'ACTIVE' | 'PENDING' }>(`/communities/${id}/join`);
    return res.data;
  },

  async leaveCommunity(id: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`/communities/${id}/leave`);
    return res.data;
  },

  async getMembers(id: string, statusFilter?: string): Promise<CommunityMember[]> {
    const params = statusFilter ? { status_filter: statusFilter } : {};
    const res = await apiClient.get<CommunityMember[]>(`/communities/${id}/members`, { params });
    return res.data;
  },

  async approveMember(communityId: string, userId: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`/communities/${communityId}/members/${userId}/approve`);
    return res.data;
  },

  async removeMember(communityId: string, userId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<{ message: string }>(`/communities/${communityId}/members/${userId}`);
    return res.data;
  },
};
