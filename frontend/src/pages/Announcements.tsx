import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Pin, 
  CheckCircle2, 
  Plus, 
  Clock, 
  Trash2, 
  Building2, 
  Globe
} from 'lucide-react';
import { announcementService } from '../services/announcement';
import type { Announcement } from '../types/announcement';
import { useAuth } from '../context/AuthContext';
import { CreateAnnouncementModal } from '../components/CreateAnnouncementModal';

export const Announcements: React.FC = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [priority, setPriority] = useState('All');
  const [scope, setScope] = useState('All');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await announcementService.getAnnouncements({
        priority: priority !== 'All' ? priority : undefined,
        scope: scope !== 'All' ? scope : undefined
      });
      setAnnouncements(res.items);
      setUnreadCount(res.unread_count);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [priority, scope]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const updated = await announcementService.markAsRead(id);
      setAnnouncements((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Handled
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this official announcement?')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      // Handled
    }
  };

  const isPublisher = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* ========================================================= */}
      {/* HEADER BANNER                                             */}
      {/* ========================================================= */}
      <header className="page-heading"><div><h1>Notice board</h1><p>Updates from your faculty, departments, and university.</p></div>
        {isPublisher && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="action-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Broadcast Notice</span>
          </button>
        )}

      </header>

      {/* ========================================================= */}
      {/* FILTERS & UNREAD STATUS BAR                               */}
      {/* ========================================================= */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
            Priority:
          </span>
          {['All', 'URGENT', 'HIGH', 'NORMAL'].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                priority === p
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none"
          >
            <option value="All">All Audiences</option>
            <option value="GLOBAL">Global Campus</option>
            <option value="DEPARTMENT">Departmental</option>
          </select>

          {unreadCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
              {unreadCount} Unread
            </span>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* ANNOUNCEMENTS STREAM                                      */}
      {/* ========================================================= */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse h-40"></div>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No notices found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            No official announcements currently match your selected priority or audience filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => {
            const isAuthor = user?.id === ann.author.id || user?.role === 'ADMIN';

            return (
              <article
                key={ann.id}
                className={`bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm transition-all relative ${
                  ann.is_pinned ? 'border-l-4 border-l-amber-500 bg-amber-50/10' : ''
                } ${!ann.is_read ? 'ring-1 ring-amber-400/30' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Priority badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[0.75rem] font-bold uppercase tracking-wider border ${getPriorityBadge(ann.priority)}`}>
                      {ann.priority}
                    </span>

                    {/* Scope badge */}
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[0.75rem] font-semibold flex items-center gap-1">
                      {ann.scope === 'GLOBAL' ? <Globe className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                      <span>{ann.target_department || ann.scope}</span>
                    </span>

                    {ann.is_pinned && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[0.75rem] font-bold flex items-center gap-1">
                        <Pin className="w-3 h-3" />
                        <span>Pinned Notice</span>
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2.5">
                  {ann.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-6">
                  {ann.content}
                </p>

                {/* Footer metadata & actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={ann.author.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${ann.author.full_name}`}
                      alt={ann.author.full_name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{ann.author.full_name}</p>
                      <p className="text-[0.75rem] text-slate-500 font-medium">
                        {ann.author.department || 'University Administration'} &bull; <span className="text-indigo-600 font-bold uppercase">{ann.author.role}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!ann.is_read ? (
                      <button
                        onClick={() => handleMarkAsRead(ann.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Acknowledge Notice</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[0.75rem] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Acknowledged</span>
                      </span>
                    )}

                    {isAuthor && (
                      <button
                        onClick={() => handleDelete(ann.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAnnouncementCreated={(newAnn) => {
          setAnnouncements([newAnn, ...announcements]);
        }}
      />
    </div>
  );
};
