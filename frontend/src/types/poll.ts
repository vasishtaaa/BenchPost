import type { AuthorBrief } from './discussion';

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  order: number;
  vote_count: number;
  percentage: number;
}

export interface Poll {
  id: string;
  post_id?: string | null;
  community_id?: string | null;
  question: string;
  is_multiple_choice: boolean;
  expires_at?: string | null;
  is_expired: boolean;
  total_votes: number;
  created_at: string;
  created_by: AuthorBrief;
  options: PollOption[];
  user_voted_option_ids: string[];
}

export interface CreatePollInput {
  question: string;
  options: string[];
  is_multiple_choice?: boolean;
  expires_at?: string | null;
  post_id?: string | null;
  community_id?: string | null;
}
