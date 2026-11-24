import type { AuthorBrief } from './discussion';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
  actor?: AuthorBrief | null;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  unread_count: number;
}
