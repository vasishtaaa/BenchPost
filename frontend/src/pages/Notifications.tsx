import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  MessageSquare, 
  Calendar, 
  Megaphone, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  CheckCircle2,
  Filter,
  Sparkles
} from 'lucide-react';
import { notificationService } from '../services/notification';
import type { Notification } from '../types/notification';

export const Notifications: React.FC = () => {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', unreadOnly],
    queryFn: () => notificationService.getNotifications(unreadOnly),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_COMMENT':
      case 'COMMENT_REPLY':
        return <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100"><MessageSquare className="w-5 h-5" /></div>;
      case 'EVENT_RSVP':
      case 'EVENT_REMINDER':
        return <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100"><Calendar className="w-5 h-5" /></div>;
      case 'ANNOUNCEMENT':
        return <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100"><Megaphone className="w-5 h-5" /></div>;
      case 'COMMUNITY_JOIN':
      case 'COMMUNITY_INVITE':
        return <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100"><Users className="w-5 h-5" /></div>;
      case 'REPORT_RESOLVED':
        return <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100"><ShieldCheck className="w-5 h-5" /></div>;
      default:
        return <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-slate-200"><Bell className="w-5 h-5" /></div>;
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const notifications = data?.items || [];
  const unreadCount = data?.unread_count || 0;

  return (
    <div className="min-h-screen bg-slate-50/60 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Bell className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500">
                Replies, event updates, and notices for your account.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending || unreadCount === 0}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <CheckCheck className="w-4 h-4 text-slate-500" />
                <span>Mark all as read</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 mr-1" />
            <button
              onClick={() => setUnreadOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                !unreadOnly
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Notifications ({data?.total || 0})
            </button>
            <button
              onClick={() => setUnreadOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                unreadOnly
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread Only ({unreadCount})
            </button>
          </div>
        </div>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse flex items-start space-x-4">
                <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  <div className="h-3 bg-slate-100 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center text-rose-600">
            Failed to load notifications. Please try again.
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-500 mx-auto mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {unreadOnly ? 'No unread notifications' : 'All caught up!'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {unreadOnly
                ? 'You have read all pending notifications. Switch to "All" to view previous notifications.'
                : 'Activity related to your posts, comments, events, and community approvals will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item: Notification) => (
              <div
                key={item.id}
                className={`group bg-white border rounded-2xl p-4 sm:p-5 transition flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  !item.is_read
                    ? 'border-indigo-200 shadow-xs ring-1 ring-indigo-50/50 bg-indigo-50/15'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  {getNotificationIcon(item.type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition">
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center space-x-2 mt-2 text-[0.75rem] text-slate-400">
                      {item.actor && (
                        <span className="font-medium text-slate-600">
                          {item.actor.full_name}
                        </span>
                      )}
                      <span>•</span>
                      <span>{formatTimestamp(item.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center shrink-0">
                  {item.link && (
                    <Link
                      to={item.link}
                      onClick={() => {
                        if (!item.is_read) markReadMutation.mutate(item.id);
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  {!item.is_read && (
                    <button
                      onClick={() => markReadMutation.mutate(item.id)}
                      title="Mark as read"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
