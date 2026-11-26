import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ReactionPicker } from './ReactionPicker';
import { discussionService } from '../services/discussion';
import type { ReactionCounts } from '../types/discussion';

vi.mock('../services/discussion', () => ({
  discussionService: {
    toggleReaction: vi.fn(),
  },
}));

const initialCounts: ReactionCounts = {
  like: 3,
  helpful: 5,
  celebrate: 1,
  interesting: 0,
  total: 9,
};

describe('ReactionPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders reaction buttons with non-zero counts', () => {
    render(<ReactionPicker postId="post-1" reactions={initialCounts} userReaction="HELPFUL" />);

    expect(screen.getByText('Helpful')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Like')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Celebrate')).toBeInTheDocument();
    expect(screen.getByText('Interesting')).toBeInTheDocument();
  });

  it('toggles a reaction and notifies parent on click', async () => {
    const user = userEvent.setup();
    const updatedCounts: ReactionCounts = {
      ...initialCounts,
      like: 4,
      total: 10,
    };
    vi.mocked(discussionService.toggleReaction).mockResolvedValueOnce({
      message: 'Reaction updated',
      current_reaction: 'LIKE',
      reactions: updatedCounts,
    });
    const onReactionChange = vi.fn();

    render(
      <ReactionPicker
        postId="post-1"
        reactions={initialCounts}
        userReaction={null}
        onReactionChange={onReactionChange}
      />
    );

    await user.click(screen.getByRole('button', { name: /like/i }));

    await waitFor(() => {
      expect(discussionService.toggleReaction).toHaveBeenCalledWith('post-1', 'LIKE');
      expect(onReactionChange).toHaveBeenCalledWith('LIKE', updatedCounts);
      expect(screen.getByText('4')).toBeInTheDocument();
    });
  });
});
