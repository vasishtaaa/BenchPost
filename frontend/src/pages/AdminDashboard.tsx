import { Modal } from '../components/Modal';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ShieldCheck, 
  Users, 
  MessageSquare, 
  Calendar, 
  CheckCircle2, 
  BarChart3, 
  FileText, 
  Search, 
  Filter, 
  ShieldAlert, 
  UserCheck, 
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import { adminService } from '../services/admin';
import { moderationService } from '../services/moderation';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import type { ReportAction, Report } from '../types/moderation';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'moderation' | 'audit'>('analytics');
  
  // User tab state
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [selectedUserForRole, setSelectedUserForRole] = useState<{ id: string; email: string; currentRole: UserRole } | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('STUDENT');

  // Moderation tab state
  const [reportStatusFilter, setReportStatusFilter] = useState('PENDING');
  const [reportTypeFilter, setReportTypeFilter] = useState('All');
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // 1. Analytics Query
  const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminService.getAnalytics(),
    enabled: user?.role === 'ADMIN',
  });

  // 2. Users Query
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users', userSearch, roleFilter],
    queryFn: () => adminService.listUsers(userSearch, roleFilter),
    enabled: user?.role === 'ADMIN' && activeTab === 'users',
  });

  // 3. Moderation Reports Query
  const { data: reportsData, isLoading: reportsLoading, refetch: refetchReports } = useQuery({
    queryKey: ['admin-reports', reportStatusFilter, reportTypeFilter],
    queryFn: () => moderationService.listReports(reportStatusFilter, reportTypeFilter),
    enabled: user?.role === 'ADMIN' && activeTab === 'moderation',
  });

  // 4. Audit Trail Query
  const { data: auditData, isLoading: auditLoading, refetch: refetchAudit } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => adminService.getAuditLogs(),
    enabled: user?.role === 'ADMIN' && activeTab === 'audit',
  });

  // Role Update Mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      adminService.updateUserRole(userId, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setSelectedUserForRole(null);
    },
  });

  // Moderation Resolution Mutation
  const resolveReportMutation = useMutation({
    mutationFn: ({ reportId, action, notes }: { reportId: string; action: ReportAction; notes?: string }) =>
      moderationService.resolveReport(reportId, { action, review_notes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      setResolvingReportId(null);
      setReviewNotes('');
    },
  });

  if (user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Restricted</h2>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            The CampusLoop Administration Console is reserved strictly for certified university administrators. Contact system administration if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  const handleResolve = (reportId: string, action: ReportAction) => {
    resolveReportMutation.mutate({
      reportId,
      action,
      notes: reviewNotes.trim() || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/70 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Admin Header Banner */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-200 shrink-0">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    CampusLoop Admin Console
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[0.75rem] font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wider">
                    Super Admin
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Manage accounts, review reports, and track campus activity.
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  refetchAnalytics();
                  refetchUsers();
                  refetchReports();
                  refetchAudit();
                }}
                className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Platform Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>User Directory & Roles</span>
            </button>

            <button
              onClick={() => setActiveTab('moderation')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'moderation'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Moderation Queue</span>
              {analytics && analytics.pending_reports > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[0.75rem] bg-rose-500 text-white">
                  {analytics.pending_reports}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'audit'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Audit Trail</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Platform Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {analyticsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 p-5"></div>
                ))}
              </div>
            ) : analytics ? (
              <>
                {/* KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Users */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</span>
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600"><Users className="w-4 h-4" /></div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{analytics.total_users}</p>
                    <div className="flex items-center gap-2 mt-2 text-[0.75rem] text-slate-500">
                      <span className="text-indigo-600 font-semibold">{analytics.role_distribution.students} Students</span>
                      <span>•</span>
                      <span className="text-amber-600 font-semibold">{analytics.role_distribution.faculty} Faculty</span>
                      <span>•</span>
                      <span className="text-purple-600 font-semibold">{analytics.role_distribution.admins} Admins</span>
                    </div>
                  </div>

                  {/* Communities */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Communities</span>
                      <div className="p-2 rounded-xl bg-sky-50 text-sky-600"><Sparkles className="w-4 h-4" /></div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{analytics.total_communities}</p>
                    <div className="flex items-center gap-2 mt-2 text-[0.75rem] text-slate-500">
                      <span>{analytics.public_communities} Public</span>
                      <span>•</span>
                      <span>{analytics.private_communities} Private</span>
                    </div>
                  </div>

                  {/* Discussions & Comments */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Discussions</span>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600"><MessageSquare className="w-4 h-4" /></div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{analytics.total_posts}</p>
                    <div className="flex items-center gap-2 mt-2 text-[0.75rem] text-slate-500">
                      <span>{analytics.total_comments} Total Comments</span>
                    </div>
                  </div>

                  {/* Pending Reports */}
                  <div className={`p-5 rounded-2xl border shadow-xs ${
                    analytics.pending_reports > 0
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-white border-slate-200/90'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Moderation Queue</span>
                      <div className={`p-2 rounded-xl ${
                        analytics.pending_reports > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                    </div>
                    <p className={`text-3xl font-extrabold tracking-tight ${
                      analytics.pending_reports > 0 ? 'text-rose-600' : 'text-slate-900'
                    }`}>
                      {analytics.pending_reports}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[0.75rem] text-slate-500">
                      <span>{analytics.pending_reports === 0 ? 'All content clean' : 'Action required'}</span>
                    </div>
                  </div>
                </div>

                {/* Secondary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Events & RSVPs */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Campus Events & Participation</h3>
                        <p className="text-xs text-slate-500">Confirmed seats and RSVP engagement</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-around py-4 bg-slate-50/70 rounded-2xl border border-slate-100 text-center">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{analytics.total_events}</p>
                        <p className="text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Total Events</p>
                      </div>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div>
                        <p className="text-2xl font-bold text-emerald-600">{analytics.total_rsvps}</p>
                        <p className="text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Confirmed RSVPs</p>
                      </div>
                      <div className="h-8 w-px bg-slate-200"></div>
                      <div>
                        <p className="text-2xl font-bold text-amber-600">{analytics.total_announcements}</p>
                        <p className="text-[0.75rem] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Announcements</p>
                      </div>
                    </div>
                  </div>

                  {/* Demographic Breakdown */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">Institutional Role Distribution</h3>
                        <p className="text-xs text-slate-500">Student, faculty, and administrator split</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-indigo-700">Students</span>
                          <span className="text-slate-600">{analytics.role_distribution.students} ({analytics.total_users > 0 ? Math.round((analytics.role_distribution.students / analytics.total_users) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${analytics.total_users > 0 ? (analytics.role_distribution.students / analytics.total_users) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-amber-700">Faculty Members</span>
                          <span className="text-slate-600">{analytics.role_distribution.faculty} ({analytics.total_users > 0 ? Math.round((analytics.role_distribution.faculty / analytics.total_users) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-amber-500 h-2 rounded-full"
                            style={{ width: `${analytics.total_users > 0 ? (analytics.role_distribution.faculty / analytics.total_users) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-purple-700">Administrators</span>
                          <span className="text-slate-600">{analytics.role_distribution.admins} ({analytics.total_users > 0 ? Math.round((analytics.role_distribution.admins / analytics.total_users) * 100) : 0}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${analytics.total_users > 0 ? (analytics.role_distribution.admins / analytics.total_users) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* TAB 2: User Directory & Role Assignment */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email or student ID..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                />
              </div>

              <div className="flex items-center space-x-2 self-start sm:self-center">
                <Filter className="w-4 h-4 text-slate-400" />
                {['All', 'STUDENT', 'FACULTY', 'ADMIN'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRoleFilter(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      roleFilter === r
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* User Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[0.75rem] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">User / Student</th>
                    <th className="py-3.5 px-6">Department & ID</th>
                    <th className="py-3.5 px-6">Role</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {usersLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">Loading user roster...</td>
                    </tr>
                  ) : usersData?.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">No users match your search criteria.</td>
                    </tr>
                  ) : (
                    usersData?.items.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <img
                              src={u.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${u.full_name || u.email}`}
                              alt={u.full_name}
                              className="w-9 h-9 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <p className="font-bold text-slate-900 leading-tight">{u.full_name}</p>
                              <p className="text-[0.75rem] text-slate-400">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-600">
                          <p className="font-medium text-slate-800">{u.department || 'General'}</p>
                          <p className="text-[0.75rem] text-slate-400 font-mono">{u.student_id ? `ID: ${u.student_id}` : 'Staff / Admin'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[0.75rem] font-bold border uppercase ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'FACULTY'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 text-[0.75rem] font-semibold text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Active</span>
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => {
                              setSelectedUserForRole({ id: u.id, email: u.email, currentRole: u.role });
                              setNewRole(u.role);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
                          >
                            Change Role
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Role Change Modal */}
            {selectedUserForRole && (
              <Modal title="Change account role" onClose={() => setSelectedUserForRole(null)}>
                <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-xl">
                  <h3 className="text-base font-bold text-slate-900 mb-1">Update User Role</h3>
                  <p className="text-xs text-slate-500 mb-4 truncate">User: {selectedUserForRole.email}</p>

                  <div className="space-y-2 mb-6">
                    {(['STUDENT', 'FACULTY', 'ADMIN'] as UserRole[]).map((r) => (
                      <label
                        key={r}
                        onClick={() => setNewRole(r)}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          newRole === r
                            ? 'border-purple-600 bg-purple-50/50 ring-1 ring-purple-600'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-xs font-bold text-slate-800">{r}</span>
                        <input
                          type="radio"
                          name="role_select"
                          checked={newRole === r}
                          onChange={() => setNewRole(r)}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setSelectedUserForRole(null)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() =>
                        updateRoleMutation.mutate({
                          userId: selectedUserForRole.id,
                          role: newRole,
                        })
                      }
                      disabled={updateRoleMutation.isPending}
                      className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-xs disabled:opacity-50"
                    >
                      {updateRoleMutation.isPending ? 'Saving...' : 'Confirm Role'}
                    </button>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}

        {/* TAB 3: Moderation Queue */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Status:</span>
                {['PENDING', 'RESOLVED', 'DISMISSED', 'All'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setReportStatusFilter(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      reportStatusFilter === s
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Target:</span>
                {['All', 'POST', 'COMMENT', 'USER'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setReportTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      reportTypeFilter === t
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Reports List */}
            {reportsLoading ? (
              <div className="py-12 text-center text-slate-400">Loading moderation queue...</div>
            ) : reportsData?.items.length === 0 ? (
              <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Queue is Clear</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  No reports currently match the selected status filters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reportsData?.items.map((report: Report) => (
                  <div
                    key={report.id}
                    className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[0.75rem] font-bold uppercase bg-slate-100 text-slate-700">
                          {report.target_type}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[0.75rem] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                          {report.reason}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[0.75rem] font-bold uppercase ${
                          report.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : report.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      <span className="text-[0.75rem] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(report.created_at).toLocaleString()}</span>
                      </span>
                    </div>

                    <div className="py-4 space-y-2">
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">Reported by:</span> {report.reporter.full_name} ({report.reporter.email})
                      </p>
                      <p className="text-xs text-slate-500 font-mono">
                        <span className="font-semibold font-sans text-slate-700">Target ID:</span> {report.target_id}
                      </p>
                      {report.details && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                          <span className="font-bold block text-[0.75rem] uppercase tracking-wider text-slate-400 mb-1">Details:</span>
                          {report.details}
                        </div>
                      )}

                      {report.status !== 'PENDING' && (
                        <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 text-xs text-purple-900 mt-2">
                          <p className="font-bold text-[0.75rem] uppercase tracking-wider text-purple-700 mb-0.5">
                            Resolution: {report.action_taken}
                          </p>
                          <p className="text-xs">{report.review_notes || 'No review notes recorded.'}</p>
                          {report.reviewer && (
                            <p className="text-[0.75rem] text-purple-600 mt-1">
                              Reviewed by {report.reviewer.full_name} on {report.reviewed_at ? new Date(report.reviewed_at).toLocaleDateString() : ''}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pending Action Controls */}
                    {report.status === 'PENDING' && (
                      <div className="pt-4 border-t border-slate-100 space-y-3">
                        {resolvingReportId === report.id ? (
                          <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
                            <textarea
                              rows={2}
                              value={reviewNotes}
                              onChange={(e) => setReviewNotes(e.target.value)}
                              placeholder="Add reviewer notes for the audit trail..."
                              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                            />
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <button
                                onClick={() => setResolvingReportId(null)}
                                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleResolve(report.id, 'DISMISS')}
                                disabled={resolveReportMutation.isPending}
                                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition"
                              >
                                Dismiss Report
                              </button>
                              <button
                                onClick={() => handleResolve(report.id, 'USER_WARNED')}
                                disabled={resolveReportMutation.isPending}
                                className="px-3.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition"
                              >
                                Warn User
                              </button>
                              <button
                                onClick={() => handleResolve(report.id, 'REMOVE_CONTENT')}
                                disabled={resolveReportMutation.isPending}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs"
                              >
                                Remove Content
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-end">
                            <button
                              onClick={() => {
                                setResolvingReportId(report.id);
                                setReviewNotes('');
                              }}
                              className="px-4 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition"
                            >
                              Review & Take Action
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900">Immutable Administrative Audit Log</h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Every moderation action, user role update, and system security event is permanently written to the database for university defense inspection.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[0.75rem] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-6">Administrator</th>
                    <th className="py-3.5 px-6">Action</th>
                    <th className="py-3.5 px-6">Target</th>
                    <th className="py-3.5 px-6">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {auditLoading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">Loading audit trail...</td>
                    </tr>
                  ) : auditData?.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">No audit records found.</td>
                    </tr>
                  ) : (
                    auditData?.items.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-4 px-6 text-slate-400 font-mono text-[0.75rem] whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {log.actor.full_name}
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[0.75rem] font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase">
                            {log.action}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-medium">
                          {log.target_type} ({log.target_id.slice(0, 8)}...)
                        </td>
                        <td className="py-4 px-6 text-slate-600 max-w-md">
                          {log.details || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
