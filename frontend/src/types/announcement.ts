import type { AuthorBrief, CommunityBrief } from './discussion';

export type AnnouncementPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type AnnouncementScope = 'GLOBAL' | 'DEPARTMENT' | 'COMMUNITY';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  scope: AnnouncementScope;
  target_department?: string | null;
  community_id?: string | null;
  community?: CommunityBrief | null;
  author: AuthorBrief;
  is_pinned: boolean;
  is_read: boolean;
  expires_at?: string | null;
  created_at: string;
}

export interface AnnouncementListResponse {
  items: Announcement[];
  total: number;
  unread_count: number;
}

export interface CreateAnnouncementInput {
  title: string;
  content: string;
  priority?: string;
  scope?: string;
  target_department?: string | null;
  community_id?: string | null;
  is_pinned?: boolean;
  expires_at?: string | null;
}
