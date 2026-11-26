import { Modal } from './Modal';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React, { useState } from 'react';
import { X, MessageSquare, AlertCircle } from 'lucide-react';
import { communityService } from '../services/community';
import { discussionService } from '../services/discussion';
import type { Post } from '../types/discussion';

const CATEGORIES = [
  'General',
  'Questions',
  'Project Showcase',
  'Academic Resources',
  'Career Prep',
];

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (newPost: Post) => void;
  defaultCommunityId?: string;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onPostCreated,
  defaultCommunityId,
}) => {
  const { user } = useAuth();
  const [selectedCommunity, setSelectedCommunity] = useState(defaultCommunityId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups = useQuery({
    queryKey: ['posting-communities', user?.id, user?.role],
    enabled: isOpen && !!user,
    staleTime: 0,
    queryFn: async () => {
      const params = { my_communities: user?.role !== 'ADMIN', limit: 100 };
      const first = await communityService.getCommunities(params);
      const items = [...first.items];
      while (items.length < first.total) {
        const next = await communityService.getCommunities({ ...params, skip: items.length });
        if (!next.items.length) break;
        items.push(...next.items);
      }
      return items;
    },
  });
  const communities = groups.data ?? [];
  const destination = communities.some(group => group.id === selectedCommunity)
    ? selectedCommunity : communities.length === 1 ? communities[0].id : '';

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!destination) {
      setError('Please select a community for this post.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const newPost = await discussionService.createPost({
        community_id: destination,
        title,
        content,
        category,
      });
      onPostCreated(newPost);
      onClose();
      setTitle('');
      setContent('');
      setCategory('General');
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Your discussion could not be posted. Check your entries and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="New discussion" onClose={onClose}>
      <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Start a discussion</h3>
              <p className="text-xs text-slate-500">Your post will appear in the community you choose.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
           aria-label="Close dialog">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-center space-x-2 p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {groups.isPending ? <p role="status">Loading your communities…</p>
          : groups.isError ? <div role="alert" className="feedback-box"><p>Your communities could not be loaded.</p><button onClick={() => groups.refetch()}>Try again</button></div>
          : !communities.length ? <div className="space-y-3"><p>Join a community before starting your first discussion. For a private group, wait until your request is approved.</p><Link to="/communities" className="action-primary" onClick={onClose}>Find a community</Link></div>
          : <form onSubmit={handleSubmit} className="space-y-4">
          {/* Community Selector */}
          <div>
            <label htmlFor="CreatePostModal-field-1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Community
            </label>
            <div className="relative">
              <select id="CreatePostModal-field-1"
                value={destination}
                onChange={(e) => setSelectedCommunity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white"
              >
                <option value="" disabled>Choose a community</option>
                {communities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.is_private ? '(Private)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Pills */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={category === cat} onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    category === cat
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="CreatePostModal-field-2" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Discussion Title
            </label>
            <input id="CreatePostModal-field-2"
              type="text"
              required
              minLength={3} maxLength={255} value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Anyone interested in a study group this Friday?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="CreatePostModal-field-3" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              What would you like to share?
            </label>
            <textarea id="CreatePostModal-field-3"
              required
              rows={6}
              minLength={5} maxLength={20000} value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="For example, share the time you can meet and what you want to study."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm leading-relaxed"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Discussion'}
            </button>
          </div>
        </form>}
      </div>
    </Modal>
  );
};
