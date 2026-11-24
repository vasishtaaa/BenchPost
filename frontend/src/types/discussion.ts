import type { UserRole } from './auth';

export type ReactionType = 'LIKE' | 'HELPFUL' | 'CELEBRATE' | 'INTERESTING';

export interface AuthorBrief {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  department?: string | null;
  course?: string | null;
  student_id?: string | null;
  avatar_url?: string | null;
}

export interface CommunityBrief {
  id: string;
  name: string;
  slug: string;
  icon_url?: string | null;
  is_private: boolean;
}

export interface ReactionCounts {
  like: number;
  helpful: number;
  celebrate: number;
  interesting: number;
  total: number;
}

export interface Post {
  id: string;
  community_id: string;
  author_id: string;
  title: string;
  content: string;
  category: string;
  is_pinned: boolean;
  views_count: number;
  created_at: string;
  updated_at: string;
  author?: AuthorBrief | null;
  community?: CommunityBrief | null;
  comments_count: number;
  reactions: ReactionCounts;
  user_reaction?: ReactionType | null;
  is_bookmarked: boolean;
}

export interface PostListResponse {
  total: number;
  items: Post[];
}

export interface PostCreateInput {
  community_id: string;
  title: string;
  content: string;
  category: string;
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  parent_id?: string | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author?: AuthorBrief | null;
  replies: Comment[];
}

export interface CommentCreateInput {
  content: string;
  parent_id?: string | null;
}

export interface ReactionToggleResponse {
  message: string;
  current_reaction?: ReactionType | null;
  reactions: ReactionCounts;
}
