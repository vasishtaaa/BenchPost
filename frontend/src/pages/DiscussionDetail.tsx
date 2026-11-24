import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  MessageSquare, 
  Bookmark, 
  Share2, 
  Pin, 
  CheckCircle2, 
  Send, 
  CornerDownRight, 
  Trash2,
  Flag
} from 'lucide-react';
import { discussionService } from '../services/discussion';
import type { Post, Comment } from '../types/discussion';
import { ReactionPicker } from '../components/ReactionPicker';
import { useAuth } from '../context/AuthContext';
import { ReportModal } from '../components/ReportModal';

export const DiscussionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);

  // New Comment state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Reply state
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: 'POST' | 'COMMENT'; id: string; title?: string } | null>(null);

  const fetchPostAndComments = async () => {
    if (!id) return;
    try {
      const [postData, commentData] = await Promise.all([
        discussionService.getPost(id),
        discussionService.getComments(id),
      ]);
      setPost(postData);
      setIsBookmarked(postData.is_bookmarked);
      setComments(commentData);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostAndComments();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await discussionService.addComment(id, { content: newComment.trim() });
      setNewComment('');
      const updatedComments = await discussionService.getComments(id);
      setComments(updatedComments);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAddReply = async (parentId: string) => {
    if (!id || !replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      await discussionService.addComment(id, {
        content: replyContent.trim(),
        parent_id: parentId,
      });
      setReplyContent('');
      setReplyParentId(null);
      const updatedComments = await discussionService.getComments(id);
      setComments(updatedComments);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to post reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id || !confirm('Delete this comment?')) return;
    try {
      await discussionService.deleteComment(commentId);
      const updatedComments = await discussionService.getComments(id);
      setComments(updatedComments);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete comment.');
    }
  };

  const handleBookmarkToggle = async () => {
    if (!post) return;
    try {
      const res = await discussionService.toggleBookmark(post.id);
      setIsBookmarked(res.is_bookmarked);
    } catch {
      // Handled
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading discussion thread...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Discussion Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The discussion topic you requested does not exist or has been removed.</p>
        <Link to="/discussions" className="inline-block mt-4 text-xs font-bold text-indigo-600">
          Back to Discussions
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Back button */}
      <Link 
        to="/discussions" 
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Campus Feed</span>
      </Link>

      {/* Main Discussion Thread Container */}
      <article className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 mb-8">
        {/* Author Header */}
        <div className="flex items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="flex items-start gap-3.5">
            <img
              src={post.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${post.author?.full_name || 'Author'}`}
              alt={post.author?.full_name || 'Author'}
              className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 bg-slate-100"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-base text-slate-900 leading-tight">
                  {post.author?.full_name || 'Campus Member'}
                </span>

                {post.author?.role === 'FACULTY' && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[0.75rem] font-bold uppercase">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Faculty</span>
                  </span>
                )}

                {post.author?.role === 'ADMIN' && (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 text-[0.75rem] font-bold uppercase">
                    <span>Admin</span>
                  </span>
                )}

                {post.author?.department && (
                  <span className="text-slate-400 text-xs">
                    • {post.author.department}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(post.created_at).toLocaleString()}</span>
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

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
              {post.category}
            </span>
            {post.is_pinned && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
                <span>Pinned</span>
              </span>
            )}
          </div>
        </div>

        {/* Discussion Title & Full Content */}
        <div className="py-6 space-y-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {post.title}
          </h1>

          <div className="text-base text-slate-700 leading-relaxed whitespace-pre-line font-normal">
            {post.content}
          </div>
        </div>

        {/* Reaction & Action Bar */}
        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <ReactionPicker
            postId={post.id}
            reactions={post.reactions}
            userReaction={post.user_reaction}
          />

          <div className="flex items-center gap-4 text-slate-500 text-xs font-semibold">
            <button
              type="button"
              onClick={handleBookmarkToggle}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition ${
                isBookmarked 
                  ? 'bg-amber-50 border-amber-200 text-amber-700' 
                  : 'border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500 text-amber-500' : ''}`} />
              <span>{isBookmarked ? 'Bookmarked' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>{copyFeedback ? 'Copied Link!' : 'Share'}</span>
            </button>

            <button
              type="button"
              onClick={() => setReportTarget({ type: 'POST', id: post.id, title: post.title })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-600 hover:text-rose-600 transition"
              title="Report discussion"
            >
              <Flag className="w-4 h-4" />
              <span>Report</span>
            </button>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">
              Discussion Comments ({comments.length})
            </h3>
          </div>
        </div>

        {/* Add Top-Level Comment */}
        <form onSubmit={handleAddComment} className="mb-8">
          <div className="flex items-start gap-3">
            <img
              src={user?.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.profile?.full_name || 'User'}`}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-slate-200"
            />
            <div className="flex-1 space-y-2">
              <textarea
                rows={3}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a constructive response or reply to this academic topic..."
                required
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm leading-relaxed"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Comment Tree */}
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              {/* Top-Level Comment Card */}
              <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={comment.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${comment.author?.full_name || 'User'}`}
                      alt={comment.author?.full_name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">
                          {comment.author?.full_name || 'Member'}
                        </span>
                        {comment.author?.role === 'FACULTY' && (
                          <span className="px-1.5 py-0.2 rounded text-[0.75rem] font-bold uppercase bg-emerald-100 text-emerald-800">
                            Faculty
                          </span>
                        )}
                      </div>
                      <span className="text-[0.75rem] text-slate-400 block">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1">
                    {!comment.is_deleted && (
                      <button
                        onClick={() => setReportTarget({ type: 'COMMENT', id: comment.id, title: comment.content })}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Report comment"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {user?.id === comment.author_id && !comment.is_deleted && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <p className={`text-xs leading-relaxed ${comment.is_deleted ? 'italic text-slate-400' : 'text-slate-700'}`}>
                  {comment.content}
                </p>

                {/* Reply Trigger */}
                {!comment.is_deleted && (
                  <div className="mt-3 pt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setReplyParentId(replyParentId === comment.id ? null : comment.id)}
                      className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>{replyParentId === comment.id ? 'Cancel Reply' : 'Reply'}</span>
                    </button>
                  </div>
                )}

                {/* Inline Reply Box */}
                {replyParentId === comment.id && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-start gap-2">
                    <textarea
                      rows={2}
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${comment.author?.full_name}...`}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddReply(comment.id)}
                      disabled={submittingReply || !replyContent.trim()}
                      className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50"
                    >
                      {submittingReply ? 'Sending...' : 'Reply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Nested Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="pl-6 sm:pl-10 space-y-3 border-l-2 border-indigo-100 ml-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={reply.author?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${reply.author?.full_name || 'User'}`}
                            alt={reply.author?.full_name}
                            className="w-6 h-6 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">
                              {reply.author?.full_name || 'Member'}
                            </span>
                            <span className="text-[0.75rem] text-slate-400">
                              {new Date(reply.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {user?.id === reply.author_id && !reply.is_deleted && (
                          <button
                            onClick={() => handleDeleteComment(reply.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 transition"
                            title="Delete reply"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      <p className={`text-xs leading-relaxed ${reply.is_deleted ? 'italic text-slate-400' : 'text-slate-700'}`}>
                        {reply.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {comments.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No comments yet. Share your thoughts or answer the question above!
            </div>
          )}
        </div>
      </div>

      {reportTarget && (
        <ReportModal
          isOpen={!!reportTarget}
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          targetTitle={reportTarget.title}
        />
      )}
    </div>
  );
};
