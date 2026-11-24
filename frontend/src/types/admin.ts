import type { UserRole } from './auth';
import type { AuthorBrief } from './discussion';

export interface RoleDistribution {
  students: number;
  faculty: number;
  admins: number;
}

export interface PlatformAnalytics {
  total_users: number;
  role_distribution: RoleDistribution;
  total_communities: number;
  public_communities: number;
  private_communities: number;
  total_posts: number;
  total_comments: number;
  total_events: number;
  total_rsvps: number;
  total_announcements: number;
  pending_reports: number;
}

export interface AdminUser extends AuthorBrief {
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface UserRoleUpdateInput {
  role: UserRole;
}
