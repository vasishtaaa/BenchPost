import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Users, 
  Lock, 
  Globe, 
  MessageSquare, 
  Calendar, 
  ArrowLeft, 
  Clock, 
  Check, 
  X, 
  Plus, 
  Search
} from 'lucide-react';
import { communityService } from '../services/community';
import { discussionService } from '../services/discussion';
import type { Community, CommunityMember } from '../types/community';
import type { Post } from '../types/discussion';
import { PostCard } from '../components/PostCard';
import { CreatePostModal } from '../components/CreatePostModal';
import { useAuth } from '../context/AuthContext';

export const CommunityDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [pendingMembers, setPendingMembers] = useState<CommunityMember[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discussions' | 'about' | 'members' | 'requests'>('discussions');

  const [actionLoading, setActionLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');

  const fetchCommunityData = async () => {
    if (!slug) return;
    try {
      const commData = await communityService.getCommunity(slug);
      setCommunity(commData);

      // Fetch members
      const activeMembers = await communityService.getMembers(commData.id, 'ACTIVE');
      setMembers(activeMembers);

      // Check if user is admin or moderator of this community
      const isLeader = user?.role === 'ADMIN' || 
        commData.user_role === 'ADMIN' || 
        commData.user_role === 'MODERATOR';

      if (isLeader) {
        const pending = await communityService.getMembers(commData.id, 'PENDING');
        setPendingMembers(pending);
      }

      // Fetch community discussions
      try {
        setLoadingPosts(true);
        const postsRes = await discussionService.getPosts({ community_id: commData.id });
        setPosts(postsRes.items);
      } catch {
        // Handled
      } finally {
        setLoadingPosts(false);
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
  }, [slug]);

  const handleJoin = async () => {
    if (!community) return;
    setActionLoading(true);
    try {
      await communityService.joinCommunity(community.id);
      await fetchCommunityData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to join community.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!community) return;
    if (!confirm('Are you sure you want to leave this community?')) return;
    setActionLoading(true);
    try {
      await communityService.leaveCommunity(community.id);
      await fetchCommunityData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to leave community.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  };

  const handleApprove = async (userId: string) => {
    if (!community) return;
    try {
      await communityService.approveMember(community.id, userId);
      await fetchCommunityData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve member.');
    }
  };

  const handleReject = async (userId: string) => {
    if (!community) return;
    if (!confirm('Decline this membership request?')) return;
    try {
      await communityService.removeMember(community.id, userId);
      await fetchCommunityData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject member.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading community spaces...</p>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-900">Community Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The community you requested does not exist or has been removed.</p>
        <Link to="/communities" className="inline-block mt-4 text-xs font-bold text-indigo-600">
          Back to Communities Directory
        </Link>
      </div>
    );
  }

  const isLeader = user?.role === 'ADMIN' || 
    community.user_role === 'ADMIN' || 
    community.user_role === 'MODERATOR';

  const filteredMembers = members.filter((m) => {
    const name = m.user?.full_name?.toLowerCase() || '';
    const dept = m.user?.department?.toLowerCase() || '';
    const id = m.user?.student_id?.toLowerCase() || '';
    const q = memberSearch.toLowerCase();
    return name.includes(q) || dept.includes(q) || id.includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Back button */}
      <Link 
        to="/communities" 
        className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Communities</span>
      </Link>

      {/* Community Banner & Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden mb-8">
        <div className="h-44 sm:h-56 relative bg-slate-100">
          <img 
            src={community.banner_url || "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&auto=format&fit=crop&q=80"} 
            alt={community.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
        </div>

        <div className="px-6 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 mb-4 gap-4">
            <div className="flex items-end space-x-4">
              <img 
                src={community.icon_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${community.slug}`} 
                alt={community.name}
                className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg object-cover"
              />
              <div className="pb-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {community.category}
                  </span>
                  <span className={`inline-flex items-center space-x-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                    community.is_private ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {community.is_private ? <Lock className="w-3 h-3 mr-0.5" /> : <Globe className="w-3 h-3 mr-0.5" />}
                    <span>{community.is_private ? 'Private Community' : 'Public Community'}</span>
                  </span>
                  {community.user_role && (
                    <span className="text-xs uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {community.user_role}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {community.name}
                </h1>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3 pb-1">
              {community.is_member ? (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Member</span>
                  </span>
                  <button
                    onClick={handleLeave}
                    disabled={actionLoading}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold transition"
                  >
                    Leave
                  </button>
                </div>
              ) : community.membership_status === 'PENDING' ? (
                <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Request Pending Approval</span>
                </span>
              ) : (
                <button
                  onClick={handleJoin}
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {community.is_private ? 'Request to Join' : 'Join Community'}
                </button>
              )}
            </div>
          </div>

          <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mt-2">
            {community.description}
          </p>

          <div className="flex items-center space-x-6 text-xs text-slate-500 font-semibold mt-4 pt-4 border-t border-slate-100">
            <span className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-slate-400" />
              <span>{community.member_count} Members</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Created {new Date(community.created_at).toLocaleDateString()}</span>
            </span>
          </div>
        </div>

        {/* Tab navigation bar */}
        <div className="flex border-t border-slate-200 px-6 sm:px-8 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('discussions')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'discussions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Discussions
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'about'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            About & Rules
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
              activeTab === 'members'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Members ({members.length})
          </button>
          {isLeader && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition relative ${
                activeTab === 'requests'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Pending Requests</span>
              {pendingMembers.length > 0 && (
                <span className="ml-2 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[0.75rem] font-bold">
                  {pendingMembers.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tab Contents */}
      {/* Tab 1: Discussions (Live Module D Feed) */}
      {activeTab === 'discussions' && (
        <div className="space-y-6">
          {/* Header bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Community Discussions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {posts.length} active academic threads and questions
              </p>
            </div>

            {(community.is_member || user?.role === 'FACULTY' || user?.role === 'ADMIN') ? (
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-100 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Start Discussion</span>
              </button>
            ) : (
              <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                Join community to participate in discussions
              </span>
            )}
          </div>

          {/* Posts list */}
          {loadingPosts ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse h-36"></div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center max-w-xl mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900">No discussions yet</h3>
              <p className="text-xs text-slate-500 mt-2 mb-6 max-w-sm mx-auto">
                Be the first to share an academic question, study resource, or project update in {community.name}!
              </p>
              {(community.is_member || user?.role === 'FACULTY' || user?.role === 'ADMIN') && (
                <button
                  onClick={() => setIsPostModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start First Discussion</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} onPostUpdated={handlePostUpdated} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: About & Rules */}
      {activeTab === 'about' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3">Community Mission</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {community.description}
              </p>

              <h3 className="text-base font-bold text-slate-900 mt-8 mb-3">Community Rules & Guidelines</h3>
              {community.rules ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 font-mono text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                  {community.rules}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Standard university code of conduct applies to all interactions.</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4">Community Details</h3>
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Category</span>
                  <span className="font-semibold text-slate-800">{community.category}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Access Type</span>
                  <span className="font-semibold text-slate-800">
                    {community.is_private ? 'Private (Approval Required)' : 'Public (Instant Join)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Total Members</span>
                  <span className="font-semibold text-slate-800">{community.member_count} enrolled</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Members Roster */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Enrolled Members</h3>
              <p className="text-xs text-slate-500">Verified campus members participating in this community</p>
            </div>

            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder="Filter members..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-xs bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((m) => (
              <div key={m.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center space-x-3">
                <img
                  src={m.user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${m.user?.full_name || 'Member'}`}
                  alt={m.user?.full_name}
                  className="w-10 h-10 rounded-xl bg-slate-200 object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {m.user?.full_name || 'Campus Student'}
                    </p>
                  </div>
                  <p className="text-[0.75rem] text-slate-500 truncate">
                    {m.user?.department || m.user?.email}
                  </p>
                  <div className="mt-1 flex items-center space-x-1">
                    <span className={`text-[0.75rem] font-bold px-1.5 py-0.2 rounded border ${
                      m.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                      m.role === 'MODERATOR' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                      'bg-slate-200/80 text-slate-600 border-slate-300'
                    }`}>
                      {m.role}
                    </span>
                    {m.user?.student_id && (
                      <span className="text-[0.75rem] font-mono text-slate-400">
                        {m.user.student_id}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Pending Requests (Moderators Only) */}
      {activeTab === 'requests' && isLeader && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="pb-4 border-b border-slate-100 mb-6">
            <h3 className="text-lg font-bold text-slate-900">Pending Membership Requests</h3>
            <p className="text-xs text-slate-500">Students awaiting moderator approval to access this private community</p>
          </div>

          {pendingMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No pending membership requests at this time.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {pendingMembers.map((pm) => (
                <div key={pm.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={pm.user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${pm.user?.full_name || 'Applicant'}`}
                      alt={pm.user?.full_name}
                      className="w-10 h-10 rounded-xl bg-slate-200 object-cover"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{pm.user?.full_name}</p>
                      <p className="text-[0.75rem] text-slate-500">{pm.user?.department} • ID: {pm.user?.student_id || 'N/A'}</p>
                      <span className="text-[0.75rem] text-slate-400">Requested on {new Date(pm.joined_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApprove(pm.user_id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(pm.user_id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Create Post Modal */}
      {community && (
        <CreatePostModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
          defaultCommunityId={community.id}
          onPostCreated={(newPost) => {
            setPosts((prev) => [newPost, ...prev]);
            setIsPostModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
