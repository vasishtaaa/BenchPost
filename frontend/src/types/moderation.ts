import type { AuthorBrief } from './discussion';

export type ReportTargetType = 'POST' | 'COMMENT' | 'USER' | 'COMMUNITY';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';
export type ReportAction = 'DISMISS' | 'REMOVE_CONTENT' | 'USER_WARNED';

export interface ReportCreateInput {
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details?: string;
}

export interface ReportResolveInput {
  action: ReportAction;
  review_notes?: string;
}

export interface Report {
  id: string;
  reporter: AuthorBrief;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details?: string | null;
  status: ReportStatus;
  action_taken: string;
  reviewer?: AuthorBrief | null;
  review_notes?: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export interface ReportListResponse {
  items: Report[];
  total: number;
  pending_count: number;
}

export interface AuditLog {
  id: string;
  actor: AuthorBrief;
  action: string;
  target_type: string;
  target_id: string;
  details?: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  items: AuditLog[];
  total: number;
}
