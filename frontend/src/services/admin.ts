import { apiClient } from './api';
import type { PlatformAnalytics, AdminUser, UserRoleUpdateInput } from '../types/admin';
import type { AuditLogListResponse } from '../types/moderation';

export const adminService = {
  async getAnalytics(): Promise<PlatformAnalytics> {
    const res = await apiClient.get<PlatformAnalytics>('/admin/analytics');
    return res.data;
  },

  async listUsers(search?: string, role?: string, limit: number = 50, offset: number = 0): Promise<{ items: AdminUser[]; total: number }> {
    const res = await apiClient.get<{ items: AdminUser[]; total: number }>('/admin/users', {
      params: {
        search: search || undefined,
        role: role && role !== 'All' ? role : undefined,
        limit,
        offset,
      },
    });
    return res.data;
  },

  async updateUserRole(userId: string, data: UserRoleUpdateInput): Promise<{ message: string }> {
    const res = await apiClient.put<{ message: string }>(`/admin/users/${userId}/role`, data);
    return res.data;
  },

  async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLogListResponse> {
    const res = await apiClient.get<AuditLogListResponse>('/admin/audit-logs', {
      params: { limit, offset },
    });
    return res.data;
  },
};
