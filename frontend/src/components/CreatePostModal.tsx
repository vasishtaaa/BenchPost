import { Modal } from './Modal';
import React, { useState, useEffect } from 'react';
import { X, MessageSquare, AlertCircle } from 'lucide-react';
import { communityService } from '../services/community';
import { discussionService } from '../services/discussion';
import type { Community } from '../types/community';
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
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunity, setSelectedCommunity] = useState(defaultCommunityId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      communityService.getCommunities({ limit: 100 })
        .then((res) => {
          setCommunities(res.items);
          if (!selectedCommunity && res.items.length > 0) {
            setSelectedCommunity(defaultCommunityId || res.items[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, defaultCommunityId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommunity) {
      setError('Please select a community for this post.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const newPost = await discussionService.createPost({
        community_id: selectedCommunity,
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
      setError(err.response?.data?.detail || 'Failed to create discussion.');
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
              <h3 className="text-lg font-bold text-slate-900">Start an Academic Discussion</h3>
              <p className="text-xs text-slate-500">Ask questions, share projects, or publish resources</p>
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
          <div className="flex items-center space-x-2 p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Community Selector */}
          <div>
            <label htmlFor="CreatePostModal-field-1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Select Community
            </label>
            <div className="relative">
              <select id="CreatePostModal-field-1"
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white"
              >
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
                  onClick={() => setCategory(cat)}
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Understanding Loss Convergence in Transformer Multi-Head Self Attention"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="CreatePostModal-field-3" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Discussion Content / Question Details
            </label>
            <textarea id="CreatePostModal-field-3"
              required
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Provide background context, code snippets, or specific inquiry for peers and faculty..."
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
        </form>
      </div>
    </Modal>
  );
};
