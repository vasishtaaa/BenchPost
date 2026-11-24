import type { AuthorBrief, CommunityBrief } from './discussion';

export type EventCategory = 
  | 'HACKATHON'
  | 'WORKSHOP'
  | 'SEMINAR'
  | 'CULTURAL'
  | 'SPORTS'
  | 'CAREER'
  | 'OTHER';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  start_time: string;
  end_time: string;
  registration_deadline?: string | null;
  max_capacity: number;
  current_registrations: number;
  remaining_capacity: number;
  is_full: boolean;
  is_registration_open: boolean;
  banner_url?: string | null;
  community_id?: string | null;
  organizer: AuthorBrief;
  community?: CommunityBrief | null;
  status: string;
  is_registered: boolean;
  created_at: string;
}

export interface EventAttendee {
  user: AuthorBrief;
  status: string;
  registered_at: string;
}

export interface EventListResponse {
  items: Event[];
  total: number;
}

export interface CreateEventInput {
  title: string;
  description: string;
  category: string;
  venue: string;
  start_time: string;
  end_time: string;
  registration_deadline?: string | null;
  max_capacity: number;
  banner_url?: string | null;
  community_id?: string | null;
}
