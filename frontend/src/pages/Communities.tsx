import { Modal } from '../components/Modal';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Users, 
  Lock, 
  Globe, 
  Plus, 
  Clock, 
  
  X
} from 'lucide-react';
import { communityService } from '../services/community';
import type { Community } from '../types/community';

const CATEGORIES = ["All", "Engineering", "Career", "Clubs & Arts", "General"];

export const Communities: React.FC = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('Engineering');
  const [rules, setRules] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCommunitiesList = async () => {
    setLoading(true);
    try {
      const data = await communityService.getCommunities({
        search: search || undefined,
        category: category !== 'All' ? category : undefined,
        my_communities: activeTab === 'my'
      });
      setCommunities(data.items);
    } catch {
      // Handled silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunitiesList();
  }, [category, activeTab]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCommunitiesList();
  };

  const handleJoin = async (communityId: string) => {
    setActionLoading(communityId);
    try {
      await communityService.joinCommunity(communityId);
      await fetchCommunitiesList();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to join community.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeave = async (communityId: string) => {
    if (!confirm('Are you sure you want to leave this community?')) return;
    setActionLoading(communityId);
    try {
      await communityService.leaveCommunity(communityId);
      await fetchCommunitiesList();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to leave community.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    try {
      await communityService.createCommunity({
        name,
        description: desc,
        category: cat,
        rules,
        is_private: isPrivate
      });
      setIsModalOpen(false);
      setName('');
      setDesc('');
      setRules('');
      setIsPrivate(false);
      await fetchCommunitiesList();
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to create community.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Header Banner */}
      <header className="page-heading"><div><h1>Communities</h1><p>Find a study group, a department, or a club to call your own.</p></div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create Community</span>
        </button>
      </header>

      {/* Search and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        {/* All vs My Communities Tabs */}
        <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200/80 w-fit">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'all'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Communities
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'my'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            My Communities
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search communities by name or topic..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white"
          />
        </form>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border ${
              category === c
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Communities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-3xl border border-slate-200 p-6 animate-pulse h-64">
              <div className="w-12 h-12 bg-slate-200 rounded-2xl mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-100 rounded w-full mb-1"></div>
              <div className="h-3 bg-slate-100 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : communities.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No communities found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            {activeTab === 'my' 
              ? "You haven't joined any communities in this category yet. Explore public communities!" 
              : "Try adjusting your search terms or category filter to discover groups."}
          </p>
          <button
            onClick={() => { setSearch(''); setCategory('All'); setActiveTab('all'); }}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((comm) => (
            <div 
              key={comm.id} 
              className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
            >
              {/* Community Banner Top */}
              <div className="h-28 relative overflow-hidden bg-slate-100">
                <img 
                  src={comm.banner_url || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80"} 
                  alt={comm.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 right-3 flex items-center space-x-1 px-2.5 py-1 rounded-full text-[0.75rem] font-bold bg-white/90 backdrop-blur-sm shadow-sm text-slate-700">
                  {comm.is_private ? (
                    <>
                      <Lock className="w-3 h-3 text-amber-600 mr-0.5" />
                      <span>Private</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3 h-3 text-emerald-600 mr-0.5" />
                      <span>Public</span>
                    </>
                  )}
                </div>
              </div>

              {/* Community Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between relative">
                {/* Floating Icon */}
                <div className="-mt-12 mb-3">
                  <img 
                    src={comm.icon_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${comm.slug}`} 
                    alt={comm.name}
                    className="w-14 h-14 rounded-2xl bg-white border-2 border-white shadow-md object-cover"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[0.75rem] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {comm.category}
                    </span>
                    {comm.user_role && (
                      <span className="text-[0.75rem] uppercase font-bold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {comm.user_role}
                      </span>
                    )}
                  </div>

                  <Link 
                    to={`/communities/${comm.slug}`}
                    className="text-lg font-bold text-slate-900 hover:text-indigo-600 transition block line-clamp-1"
                  >
                    {comm.name}
                  </Link>

                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {comm.description}
                  </p>
                </div>

                {/* Footer with Member Count & Action Button */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{comm.member_count} {comm.member_count === 1 ? 'member' : 'members'}</span>
                  </div>

                  <div>
                    {comm.is_member ? (
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/communities/${comm.slug}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleLeave(comm.id)}
                          disabled={actionLoading === comm.id}
                          className="px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-xs font-semibold text-rose-600 transition"
                          title="Leave community"
                        >
                          Leave
                        </button>
                      </div>
                    ) : comm.membership_status === 'PENDING' ? (
                      <span className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoin(comm.id)}
                        disabled={actionLoading === comm.id}
                        className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                      >
                        <span>{comm.is_private ? 'Request to Join' : 'Join'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Community Modal */}
      {isModalOpen && (
        <Modal title="Create community" onClose={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Create New Community</h3>
                  <p className="text-xs text-slate-500">Establish a campus academic hub or club space</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div>
                <label htmlFor="Communities-field-1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Community Name
                </label>
                <input id="Communities-field-1"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cloud Architecture Circle"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div>
                <label htmlFor="Communities-field-2" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select id="Communities-field-2"
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Career">Career</option>
                  <option value="Clubs & Arts">Clubs & Arts</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label htmlFor="Communities-field-3" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea id="Communities-field-3"
                  required
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Describe the primary focus, learning topics, and target members..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div>
                <label htmlFor="Communities-field-4" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Community Rules (Optional)
                </label>
                <textarea id="Communities-field-4"
                  rows={2}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="1. Keep discussions academic&#10;2. Be constructive"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-mono text-xs"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Make Community Private</span>
                    <span className="text-[0.75rem] text-slate-500 block">
                      New students must request approval from community moderators before joining.
                    </span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Community'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
};
