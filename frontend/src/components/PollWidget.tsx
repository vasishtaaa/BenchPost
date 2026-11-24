import React, { useState } from 'react';
import { CheckCircle2, Clock, BarChart2, AlertCircle } from 'lucide-react';
import type { Poll } from '../types/poll';
import { pollService } from '../services/poll';

interface PollWidgetProps {
  poll: Poll;
  onPollUpdated?: (updated: Poll) => void;
}

export const PollWidget: React.FC<PollWidgetProps> = ({ poll, onPollUpdated }) => {
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(poll.user_voted_option_ids || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptionClick = (optionId: string) => {
    if (poll.is_expired) return;

    if (poll.is_multiple_choice) {
      if (selectedOptionIds.includes(optionId)) {
        setSelectedOptionIds(selectedOptionIds.filter((id) => id !== optionId));
      } else {
        setSelectedOptionIds([...selectedOptionIds, optionId]);
      }
    } else {
      setSelectedOptionIds([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptionIds.length === 0 || submitting || poll.is_expired) return;
    setSubmitting(true);
    setError(null);

    try {
      const updated = await pollService.vote(poll.id, selectedOptionIds);
      if (onPollUpdated) {
        onPollUpdated(updated);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to submit vote.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasVoted = poll.user_voted_option_ids && poll.user_voted_option_ids.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold uppercase tracking-wider">
          <BarChart2 className="w-4 h-4 text-indigo-600" />
          <span>Campus Poll {poll.is_multiple_choice ? '(Select Multiple)' : '(Single Choice)'}</span>
        </div>
        {poll.is_expired ? (
          <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Closed</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>Active</span>
          </span>
        )}
      </div>

      <h3 className="text-sm font-bold text-slate-900 leading-snug mb-3">
        {poll.question}
      </h3>

      {error && (
        <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Options List */}
      <div className="space-y-2.5">
        {poll.options.map((opt) => {
          const isSelected = selectedOptionIds.includes(opt.id);
          const isUserVote = poll.user_voted_option_ids?.includes(opt.id);

          return (
            <button
              key={opt.id}
              type="button"
              disabled={poll.is_expired}
              onClick={() => handleOptionClick(opt.id)}
              className={`w-full text-left relative overflow-hidden rounded-xl border p-3 transition ${
                isSelected
                  ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60'
              } ${poll.is_expired ? 'cursor-default' : 'cursor-pointer'}`}
            >
              {/* Vote Percentage Progress Fill */}
              {hasVoted && (
                <div
                  className="absolute inset-y-0 left-0 bg-indigo-100/60 transition-all duration-500 pointer-events-none"
                  style={{ width: `${opt.percentage}%` }}
                ></div>
              )}

              <div className="relative z-10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                  </span>
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    {opt.text}
                  </span>
                  {isUserVote && (
                    <span className="inline-flex items-center text-[0.75rem] font-bold text-indigo-700 bg-indigo-100/80 px-1.5 py-0.2 rounded">
                      Your vote
                    </span>
                  )}
                </div>

                {hasVoted && (
                  <span className="text-xs font-bold text-slate-700 shrink-0">
                    {opt.percentage}% <span className="text-[0.75rem] font-normal text-slate-400">({opt.vote_count})</span>
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Actions & Counts */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="font-medium">
          {poll.total_votes} {poll.total_votes === 1 ? 'student vote' : 'student votes'}
        </span>

        {!poll.is_expired && (
          <button
            type="button"
            disabled={selectedOptionIds.length === 0 || submitting}
            onClick={handleVote}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{hasVoted ? 'Change Vote' : 'Submit Vote'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
