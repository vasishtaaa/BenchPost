import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PollWidget } from './PollWidget';
import { pollService } from '../services/poll';
import type { Poll } from '../types/poll';

vi.mock('../services/poll', () => ({
  pollService: {
    vote: vi.fn(),
  },
}));

const basePoll: Poll = {
  id: 'poll-1',
  question: 'Preferred workshop time for Docker & FastAPI?',
  is_multiple_choice: false,
  is_expired: false,
  total_votes: 10,
  created_at: '2026-11-20T10:00:00Z',
  created_by: {
    id: 'fac-1',
    email: 'faculty@campusloop.edu',
    role: 'FACULTY',
    full_name: 'Prof. Sharma',
  },
  options: [
    { id: 'opt-1', poll_id: 'poll-1', text: 'Friday 4:00 PM', order: 1, vote_count: 6, percentage: 60 },
    { id: 'opt-2', poll_id: 'poll-1', text: 'Saturday 10:00 AM', order: 2, vote_count: 4, percentage: 40 },
  ],
  user_voted_option_ids: [],
};

describe('PollWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders poll question, active badge, and options', () => {
    render(<PollWidget poll={basePoll} />);

    expect(screen.getByText(basePoll.question)).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Friday 4:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Saturday 10:00 AM')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit vote/i })).toBeDisabled();
  });

  it('allows selecting an option and submitting a vote', async () => {
    const user = userEvent.setup();
    const updatedPoll: Poll = {
      ...basePoll,
      total_votes: 11,
      user_voted_option_ids: ['opt-1'],
    };
    vi.mocked(pollService.vote).mockResolvedValueOnce(updatedPoll);
    const onPollUpdated = vi.fn();

    render(<PollWidget poll={basePoll} onPollUpdated={onPollUpdated} />);

    await user.click(screen.getByText('Friday 4:00 PM'));
    const submitBtn = screen.getByRole('button', { name: /submit vote/i });
    expect(submitBtn).toBeEnabled();

    await user.click(submitBtn);

    await waitFor(() => {
      expect(pollService.vote).toHaveBeenCalledWith('poll-1', ['opt-1']);
      expect(onPollUpdated).toHaveBeenCalledWith(updatedPoll);
    });
  });

  it('displays vote percentages and closed badge for expired polls', () => {
    const votedExpiredPoll: Poll = {
      ...basePoll,
      is_expired: true,
      user_voted_option_ids: ['opt-2'],
    };

    render(<PollWidget poll={votedExpiredPoll} />);

    expect(screen.getByText('Closed')).toBeInTheDocument();
    expect(screen.getByText('Your vote')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /submit vote/i })).not.toBeInTheDocument();
  });
});
