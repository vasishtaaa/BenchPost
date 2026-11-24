import type { UserRole } from './auth';

export type CommunityRole = 'MEMBER' | 'MODERATOR' | 'ADMIN';
export type MembershipStatus = 'ACTIVE' | 'PENDING';

export interface MemberUserBrief {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  student_id?: string | null;
  department?: string | null;
  avatar_url?: string | null;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: CommunityRole;
  status: MembershipStatus;
  joined_at: string;
  user?: MemberUserBrief | null;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  rules?: string | null;
  is_private: boolean;
  creator_id?: string | null;
  icon_url?: string | null;
  banner_url?: string | null;
  created_at: string;
  updated_at: string;
  member_count: number;
  is_member: boolean;
  membership_status?: MembershipStatus | null;
  user_role?: CommunityRole | null;
}

export interface CommunityListResponse {
  total: number;
  items: Community[];
}

export interface CommunityCreateInput {
  name: string;
  description: string;
  category: string;
  rules?: string;
  is_private: boolean;
  icon_url?: string;
  banner_url?: string;
}
