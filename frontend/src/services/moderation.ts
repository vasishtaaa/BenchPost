import { apiClient } from './api';
import type {
  ReportCreateInput,
  ReportResolveInput,
  Report,
  ReportListResponse,
  AuditLogListResponse,
} from '../types/moderation';

export const moderationService = {
  async createReport(data: ReportCreateInput): Promise<Report> {
    const res = await apiClient.post<Report>('/moderation/reports', data);
    return res.data;
  },

  async listReports(status?: string, targetType?: string, limit: number = 50, offset: number = 0): Promise<ReportListResponse> {
    const res = await apiClient.get<ReportListResponse>('/moderation/reports', {
      params: {
        status: status && status !== 'All' ? status : undefined,
        target_type: targetType && targetType !== 'All' ? targetType : undefined,
        limit,
        offset,
      },
    });
    return res.data;
  },

  async resolveReport(id: string, data: ReportResolveInput): Promise<Report> {
    const res = await apiClient.post<Report>(`/moderation/reports/${id}/resolve`, data);
    return res.data;
  },

  async getAuditLogs(limit: number = 50, offset: number = 0): Promise<AuditLogListResponse> {
    const res = await apiClient.get<AuditLogListResponse>('/admin/audit-logs', {
      params: { limit, offset },
    });
    return res.data;
  },
};
