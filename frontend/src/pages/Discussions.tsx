import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame,
  MessageSquare, 
  BookOpen, 
  Bookmark, 
   
  Bell, 
  Plus, 
  Search, 
   
   
  
  Edit3
} from 'lucide-react';
import { discussionService } from '../services/discussion';
import { communityService } from '../services/community';
import type { Post } from '../types/discussion';
import type { Community } from '../types/community';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Questions', 'Project Showcase', 'Academic Resources', 'Career Prep'];

interface DiscussionsProps {
  initialSavedOnly?: boolean;
}

export const Discussions: React.FC<DiscussionsProps> = ({ initialSavedOnly = false }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<'newest' | 'popular' | 'most_discussed'>('newest');
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [savedOnly, setSavedOnly] = useState(initialSavedOnly);

  useEffect(() => {
    setSavedOnly(initialSavedOnly);
  }, [initialSavedOnly]);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [feedError, setFeedError] = useState(false);
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setFeedError(false);
    const request = savedOnly
      ? discussionService.getSavedBookmarks()
      : discussionService.getPosts({ search: query || undefined, category: category === 'All' ? undefined : category, sort });
    request.then(result => { if (current) setPosts(result.items); })
      .catch(() => { if (current) setFeedError(true); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [query, category, sort, savedOnly, attempt]);

  useEffect(() => {
    communityService.getCommunities({ my_communities: true })
      .then((res) => setMyCommunities(res.items))
      .catch(() => {});
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search.trim());
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
      <header className="page-heading"><div><h1>{savedOnly ? 'Saved discussions' : 'Discussions'}</h1><p>{savedOnly ? 'Posts you bookmarked for later.' : 'Ask questions and share what you are working on.'}</p></div></header>
      <div className="feed-layout grid grid-cols-12 gap-6 items-start">
        {/* ========================================== */}
        {/* COLUMN 1: LEFT NAVIGATION SIDEBAR (3 COLS) */}
        {/* ========================================== */}
        <aside className="col-span-12 lg:col-span-3 space-y-6 lg:sticky lg:top-20">
          {/* Primary Navigation Card */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-sm">
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setSavedOnly(false)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  !savedOnly
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-indigo-600" />
                  <span>Campus Feed</span>
                </div>
                {!savedOnly && <span className="w-1.5 h-4 rounded-full bg-indigo-600"></span>}
              </button>

              <Link
                to="/communities"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>My Communities</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[0.75rem] font-bold">
                  {myCommunities.length}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setSavedOnly(true)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  savedOnly
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-amber-500" />
                  <span>Saved Topics</span>
                </div>
                {savedOnly && <span className="w-1.5 h-4 rounded-full bg-indigo-600"></span>}
              </button>

              <Link
                to="/announcements"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Official Notices</span>
                </div>
              </Link>
            </nav>
          </div>

          {/* Joined Communities Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                My Communities
              </span>
              <Link
                to="/communities"
                className="text-indigo-600 hover:text-indigo-700 text-xs font-bold transition"
              >
                + Discover
              </Link>
            </div>

            <div className="space-y-1">
              {myCommunities.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  to={`/communities/${c.slug}`}
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={c.icon_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${c.slug}`}
                      alt={c.name}
                      className="w-6 h-6 rounded-lg object-cover shrink-0"
                    />
                    <span className="text-xs font-medium text-slate-700 truncate group-hover:text-indigo-600 transition">
                      {c.name}
                    </span>
                  </div>
                  <span className="text-[0.75rem] text-slate-400 font-semibold shrink-0">
                    {c.member_count}
                  </span>
                </Link>
              ))}

              {myCommunities.length === 0 && (
                <p className="text-xs text-slate-400 py-2">
                  No joined communities yet. Discover groups to participate!
                </p>
              )}
            </div>
          </div>

        </aside>

        {/* ========================================== */}
        {/* COLUMN 2: MAIN CONTENT FEED (6 COLS)       */}
        {/* ========================================== */}
        <section className="col-span-12 lg:col-span-9 space-y-5">
          {/* Quick Post Composer Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
            <div className="flex items-center gap-3">
              <img
                src={user?.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.profile?.full_name || 'User'}`}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
              />
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 px-4 py-2.5 rounded-xl text-xs font-medium text-left transition flex items-center justify-between border border-slate-200/80"
              >
                <span>Start an academic discussion, ask a question, or share research notes...</span>
                <Edit3 className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {!savedOnly && <>
          <div className="flex flex-col gap-3 bg-white rounded-2xl p-3 border border-slate-200/90 shadow-sm">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search discussions" placeholder="Search discussions or questions..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 text-xs text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </form>

            <div className="flex items-center gap-2 flex-wrap justify-between">
              <div className="flex items-center gap-1.5 flex-wrap pb-1 sm:pb-0">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                      category === cat
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <select
                aria-label="Sort discussions" value={sort}
                onChange={(e) => setSort(e.target.value as any)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 focus:outline-none shrink-0"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="most_discussed">Discussed</option>
              </select>
            </div>
          </div>

          {/* Posts Stream */}
          </>}
          {feedError ? <div role="alert" className="feedback-box"><p>Discussions could not be loaded.</p><button onClick={() => setAttempt(value => value + 1)}>Try again</button></div> : loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-48">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                  <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No discussions found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Be the first to ask a question or initiate a technical topic in this category!
              </p>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Start Discussion</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostUpdated={(updated) => {
                    setPosts(posts.map((p) => (p.id === updated.id ? updated : p)));
                  }}
                />
              ))}
            </div>
          )}
        </section>


      </div>

      {/* Post Creator Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};
