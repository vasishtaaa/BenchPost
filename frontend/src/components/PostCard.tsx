import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Pin, 
  CheckCircle2, 
  Eye, 
  Clock,
  Flag
} from 'lucide-react';
import type { Post } from '../types/discussion';
import { ReactionPicker } from './ReactionPicker';
import { discussionService } from '../services/discussion';
import { ReportModal } from './ReportModal';

interface PostCardProps {
  post: Post;
  onPostUpdated?: (updated: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostUpdated }) => {
  const [isBookmarked, setIsBookmarked] = useState(post.is_bookmarked);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const handleBookmarkToggle = async () => {
    try {
      const res = await discussionService.toggleBookmark(post.id);
      setIsBookmarked(res.is_bookmarked);
      if (onPostUpdated) {
        onPostUpdated({ ...post, is_bookmarked: res.is_bookmarked });
      }
    } catch {
      // Handled
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/discussions/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const isFacultyAuthor = post.author?.role === 'FACULTY';
  const isAdminAuthor = post.author?.role === 'ADMIN';

  return (
    <article className={`bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
      post.is_pinned ? 'border-l-4 border-l-amber-500' : ''
    }`}>
      {/* Header: Author Info, Time, Community & Category */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <img
            src={post.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author?.full_name || 'Author'}`}
            alt={post.author?.full_name || 'Author'}
            className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200 bg-slate-100"
          />
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 leading-tight">
                {post.author?.full_name || 'Campus Member'}
              </span>

              {/* Role Badge */}
              {isFacultyAuthor && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[0.75rem] font-bold uppercase">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Faculty</span>
                </span>
              )}

              {isAdminAuthor && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[0.75rem] font-bold uppercase">
                  <span>Admin</span>
                </span>
              )}

              {post.author?.department && (
                <span className="text-slate-400 text-xs hidden sm:inline">
                  • {post.author.department}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-xs mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>{new Date(post.created_at).toLocaleDateString()}</span>
              </span>
              <span>•</span>
              {post.community && (
                <Link
                  to={`/communities/${post.community.slug}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-700 transition"
                >
                  {post.community.name}
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Category Pill & Pinned Badge */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
            {post.category}
          </span>
          {post.is_pinned && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <Pin className="w-3 h-3 text-amber-600 fill-amber-600" />
              <span>Pinned</span>
            </span>
          )}
        </div>
      </div>

      {/* Post Title & Content */}
      <div className="space-y-2 mb-4">
        <Link to={`/discussions/${post.id}`}>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 hover:text-indigo-600 transition leading-snug">
            {post.title}
          </h2>
        </Link>
        <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">
          {post.content}
        </p>
      </div>

      {/* Bottom Action Bar: Reactions, Comments, Bookmark, Share */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
        <ReactionPicker
          postId={post.id}
          reactions={post.reactions}
          userReaction={post.user_reaction}
          onReactionChange={(newReaction, newCounts) => {
            if (onPostUpdated) {
              onPostUpdated({
                ...post,
                user_reaction: newReaction,
                reactions: newCounts,
              });
            }
          }}
        />

        <div className="flex flex-wrap items-center gap-2 text-slate-500 text-xs font-semibold">
          <Link
            to={`/discussions/${post.id}`}
            className="flex items-center gap-1 hover:text-indigo-600 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{post.comments_count} {post.comments_count === 1 ? 'comment' : 'comments'}</span>
          </Link>

          <span className="flex items-center gap-1 text-slate-400">
            <Eye className="w-4 h-4" />
            <span>{post.views_count}</span>
          </span>

          <button
            type="button"
            onClick={handleBookmarkToggle}
            aria-pressed={isBookmarked}
            className={`p-2 rounded-lg transition ${
              isBookmarked ? 'text-amber-500 hover:text-amber-600' : 'text-slate-400 hover:text-slate-600'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Discussion'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 transition"
            title="Copy link to discussion"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 transition"
            title="Report this discussion"
          >
            <Flag className="w-4 h-4" />
          </button>
          {copyFeedback && (
            <span role="status" className="text-[0.75rem] font-bold text-emerald-600">Copied!</span>
          )}
        </div>
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        targetType="POST"
        targetId={post.id}
        targetTitle={post.title}
      />
    </article>
  );
};
