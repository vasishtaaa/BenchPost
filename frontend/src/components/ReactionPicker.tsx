import React, { useState } from 'react';
import type { ReactionType, ReactionCounts } from '../types/discussion';
import { discussionService } from '../services/discussion';

interface ReactionPickerProps {
  postId: string;
  reactions: ReactionCounts;
  userReaction?: ReactionType | null;
  onReactionChange?: (newReaction: ReactionType | null, newCounts: ReactionCounts) => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({
  postId,
  reactions: initialReactions,
  userReaction: initialUserReaction,
  onReactionChange,
}) => {
  const [reactions, setReactions] = useState<ReactionCounts>(initialReactions);
  const [userReaction, setUserReaction] = useState<ReactionType | null | undefined>(initialUserReaction);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (type: ReactionType) => {
    if (loading) return;
    setLoading(true);

    try {
      const res = await discussionService.toggleReaction(postId, type);
      setUserReaction(res.current_reaction);
      setReactions(res.reactions);
      if (onReactionChange) {
        onReactionChange(res.current_reaction || null, res.reactions);
      }
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update reaction.');
    } finally {
      setLoading(false);
    }
  };

  const reactionConfigs: { type: ReactionType; emoji: string; label: string; count: number }[] = [
    { type: 'HELPFUL', emoji: '💡', label: 'Helpful', count: reactions.helpful },
    { type: 'LIKE', emoji: '👍', label: 'Like', count: reactions.like },
    { type: 'CELEBRATE', emoji: '🎉', label: 'Celebrate', count: reactions.celebrate },
    { type: 'INTERESTING', emoji: '🤔', label: 'Interesting', count: reactions.interesting },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {reactionConfigs.map((r) => {
        const isActive = userReaction === r.type;
        return (
          <button
            key={r.type}
            type="button"
            onClick={() => handleToggle(r.type)}
            disabled={loading}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all ${
              isActive
                ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600'
            }`}
          >
            <span className="text-sm leading-none">{r.emoji}</span>
            <span className="text-[0.75rem] font-medium">{r.label}</span>
            {r.count > 0 && <span className="font-bold text-[0.75rem]">{r.count}</span>}
          </button>
        );
      })}
    </div>
  );
};
