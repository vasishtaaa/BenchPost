import { SearchForm } from '../components/SearchForm';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
 
  BookOpen, 
  MessageSquare, 
  Calendar, 
  Bell, 
 
  Flame,
  Bookmark,
  Plus,

  Edit3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

import { discussionService } from '../services/discussion';
import { communityService } from '../services/community';
import { eventService } from '../services/event';
import { announcementService } from '../services/announcement';
import { pollService } from '../services/poll';
import type { Post } from '../types/discussion';
import type { Community } from '../types/community';
import type { Event } from '../types/event';
import type { Announcement } from '../types/announcement';
import type { Poll } from '../types/poll';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { PollWidget } from '../components/PollWidget';

const CATEGORIES = ['All', 'Questions', 'Project Showcase', 'Academic Resources', 'Career Prep'];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [feedError, setFeedError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [myCommunities, setMyCommunities] = useState<Community[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [notices, setNotices] = useState<Announcement[]>([]);
  const [featuredPoll, setFeaturedPoll] = useState<Poll | null>(null);
  
  // Feed Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState<'newest' | 'popular' | 'most_discussed'>('newest');
  const [feedView, setFeedView] = useState<'all' | 'my' | 'bookmarks'>('all');
  
  // Post Creator Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let current = true;
    setLoadingPosts(true);
    setFeedError(false);
    const request = feedView === 'bookmarks'
      ? discussionService.getSavedBookmarks()
      : discussionService.getPosts({ search: query || undefined, category: category === 'All' ? undefined : category, sort });
    request.then(result => { if (current) setPosts(result.items); })
      .catch(() => { if (current) setFeedError(true); })
      .finally(() => { if (current) setLoadingPosts(false); });
    return () => { current = false; };
  }, [query, category, sort, feedView, attempt]);

  useEffect(() => {
    communityService.getCommunities({ my_communities: true })
      .then((res) => setMyCommunities(res.items))
      .catch(() => {});

    eventService.getEvents({ limit: 2, upcoming_only: true })
      .then((res) => setUpcomingEvents(res.items))
      .catch(() => {});

    announcementService.getAnnouncements({ limit: 2 })
      .then((res) => setNotices(res.items))
      .catch(() => {});

    pollService.getPolls({ limit: 1 })
      .then((res) => {
        if (res && res.length > 0) setFeaturedPoll(res[0]);
      })
      .catch(() => {});
  }, []);

  const handleSearchSubmit = () => {
    setQuery(search.trim());
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
      <header className="page-heading">
        <div><p className="kicker"><span />{new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
          <h1>The campus feed</h1><p>Welcome back, {user?.profile?.full_name?.split(' ')[0] || 'campus member'}.</p>
        </div>
        <button className="action-primary" onClick={() => setIsModalOpen(true)}><Plus size={17} /> New discussion</button>
      </header>
      <details className="start-guide" open={localStorage.getItem('campusloop-guide-' + user?.id) !== 'closed'}
        onToggle={event => localStorage.setItem('campusloop-guide-' + user?.id, event.currentTarget.open ? 'open' : 'closed')}>
        <summary>Getting started on campus</summary>
        <nav aria-label="Getting started">
          <Link to="/communities"><strong>Join a community</strong><small>Pick a club or study group so you can post there.</small></Link>
          <Link to="/discussions"><strong>Read a discussion</strong><small>Browse questions and save useful posts for later.</small></Link>
          <Link to="/events"><strong>Find an event</strong><small>See what’s coming up and reserve a seat.</small></Link>
        </nav>
      </details>
      <div className="feed-layout grid grid-cols-12 gap-6 items-start">
        {/* ========================================== */}
        {/* COLUMN 1: LEFT NAVIGATION & CONTEXT (3 COLS)*/}
        {/* ========================================== */}
        <aside className="col-span-12 lg:col-span-3 space-y-6 lg:sticky lg:top-20">
          {/* Feed View Switcher */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-sm">
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setFeedView('all')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  feedView === 'all'
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="w-4 h-4 text-indigo-600" />
                  <span>Campus Feed</span>
                </div>
                {feedView === 'all' && <span className="w-1.5 h-4 rounded-full bg-indigo-600"></span>}
              </button>

              <Link
                to="/communities"
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-slate-400" />
                  <span>Find communities</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[0.75rem] font-bold">
                  {myCommunities.length}
                </span>
              </Link>

              <button
                type="button"
                onClick={() => setFeedView('bookmarks')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  feedView === 'bookmarks'
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bookmark className="w-4 h-4 text-indigo-600" />
                  <span>Saved discussions</span>
                </div>
                {feedView === 'bookmarks' && <span className="w-1.5 h-4 rounded-full bg-indigo-600"></span>}
              </button>
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
                  Groups you join will appear here.
                </p>
              )}
            </div>
          </div>

          {/* Featured Campus Poll Widget */}
          {featuredPoll && (
            <PollWidget
              poll={featuredPoll}
              onPollUpdated={(updated) => setFeaturedPoll(updated)}
            />
          )}
        </aside>

        {/* ========================================== */}
        {/* COLUMN 2: CENTER DISCUSSION STREAM (6 COLS)*/}
        {/* ========================================== */}
        <section className="col-span-12 lg:col-span-6 space-y-5">
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
                <span>Share a question or start a discussion</span>
                <Edit3 className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Feed Control Toolbar */}
          {feedView !== 'bookmarks' && <div className="flex flex-col gap-3 bg-white rounded-2xl p-3 border border-slate-200/90 shadow-sm">
            {/* Search Input */}
            <SearchForm label="Search discussions" value={search} onChange={setSearch} onSearch={handleSearchSubmit} />

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

          }
          {/* Posts Stream */}
          {feedError ? <div role="alert" className="feedback-box"><p>Discussions could not be loaded.</p><button onClick={() => setAttempt(value => value + 1)}>Try again</button></div> : loadingPosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-44">
                  <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
                  <div className="h-3 bg-slate-100 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {feedView === 'bookmarks' ? 'No saved bookmarks yet' : 'No discussions found'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4 max-w-sm mx-auto">
                {feedView === 'bookmarks'
                  ? 'Bookmark useful academic guides, answers, or code snippets to review them here.'
                  : 'Be the first to ask an academic question or share a guide in this category!'}
              </p>
              {feedView !== 'bookmarks' && (
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start Discussion</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onPostUpdated={handlePostUpdated}
                />
              ))}
            </div>
          )}
        </section>

        {/* ========================================== */}
        {/* COLUMN 3: RIGHT WIDGETS SIDEBAR (3 COLS)  */}
        {/* ========================================== */}
        <aside className="col-span-12 lg:col-span-3 space-y-6 lg:sticky lg:top-20">
          {/* Official Faculty Announcements Widget */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Bell className="w-4 h-4 text-indigo-600" />
                <span>Official Notices</span>
              </div>
              <Link to="/announcements" className="text-indigo-600 hover:text-indigo-700 text-xs font-bold">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {notices.map((ann) => (
                <Link
                  key={ann.id}
                  to="/announcements"
                  className="block p-3 rounded-xl bg-slate-50 hover:bg-amber-50/40 border border-slate-100 transition"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[0.75rem] font-bold uppercase ${
                      ann.priority === 'URGENT' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-amber-50 border border-amber-200 text-amber-800'
                    }`}>
                      {ann.priority}
                    </span>
                    <span className="text-[0.75rem] text-slate-400">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">
                    {ann.title}
                  </p>
                  <p className="text-[0.75rem] text-slate-500 mt-1">{ann.author.full_name} • {ann.author.department || 'Administration'}</p>
                </Link>
              ))}

              {notices.length === 0 && (
                <p className="text-xs text-slate-400 py-2 text-center">No active notices.</p>
              )}
            </div>
          </div>

          {/* Upcoming Campus Events Widget */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Upcoming Events</span>
              </div>
              <Link to="/events" className="text-indigo-600 hover:text-indigo-700 text-xs font-bold">
                All Events
              </Link>
            </div>

            <div className="space-y-3.5">
              {upcomingEvents.map((ev) => {
                const sDate = new Date(ev.start_time);
                const month = sDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
                const day = sDate.getDate();

                return (
                  <Link
                    key={ev.id}
                    to="/events"
                    className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center font-bold shrink-0 border border-indigo-100">
                      <span className="text-[0.75rem] uppercase leading-none">{month}</span>
                      <span className="text-base leading-tight">{day}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 leading-tight truncate group-hover:text-indigo-600 transition">
                        {ev.title}
                      </p>
                      <p className="text-[0.75rem] text-slate-500 mt-0.5 truncate">{ev.venue}</p>
                      <div className="mt-1.5 flex items-center justify-between text-[0.75rem] text-slate-500">
                        <span>{ev.current_registrations} / {ev.max_capacity} Seats</span>
                        <span className={`font-bold ${ev.is_full ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {ev.is_full ? 'Full' : 'Open'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}

              {upcomingEvents.length === 0 && (
                <p className="text-xs text-slate-400 py-2 text-center">No upcoming events.</p>
              )}
            </div>
          </div>

        </aside>
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
