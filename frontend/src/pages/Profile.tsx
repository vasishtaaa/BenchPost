import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  KeyRound 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth';

export const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth();

  // Profile details state
  const [fullName, setFullName] = useState(user?.profile?.full_name || '');
  const [department, setDepartment] = useState(user?.profile?.department || '');
  const [course, setCourse] = useState(user?.profile?.course || '');
  const [academicYear, setAcademicYear] = useState<number>(user?.profile?.academic_year || 1);
  const [bio, setBio] = useState(user?.profile?.bio || '');
  
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChanging, setPasswordChanging] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);
    setProfileSaving(true);

    try {
      await updateProfile({
        full_name: fullName,
        department,
        course,
        academic_year: user?.role === 'STUDENT' ? Number(academicYear) : undefined,
        bio,
      });
      setProfileSuccess('Profile details updated successfully!');
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    setPasswordChanging(true);

    try {
      await authService.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password changed successfully.');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to update password. Check your current password.');
    } finally {
      setPasswordChanging(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 mb-8 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
        <img
          src={user.profile?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${user.profile?.full_name || user.email}`}
          alt={user.profile?.full_name || user.email}
          className="w-24 h-24 rounded-2xl bg-indigo-50 border-2 border-indigo-100 object-cover shadow-sm"
        />
        <div className="flex-1 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{user.profile?.full_name || 'CampusLoop Member'}</h1>
            <span className={`inline-block mt-1 sm:mt-0 text-xs uppercase font-bold px-2.5 py-0.5 rounded-full border ${
              user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border-purple-200' :
              user.role === 'FACULTY' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {user.role}
            </span>
          </div>

          <p className="text-sm text-slate-600 mt-1 flex items-center justify-center sm:justify-start space-x-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user.email}</span>
            {user.profile?.student_id && (
              <>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-xs text-slate-500">ID: {user.profile.student_id}</span>
              </>
            )}
          </p>

          <p className="text-xs text-slate-500 mt-2 max-w-2xl">
            {user.profile?.bio || 'No biography provided yet. Edit your details below to share your academic interests.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Academic & Personal Profile Editor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-6">
              <User className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Academic & Profile Details</h2>
            </div>

            {profileSuccess && (
              <div className="flex items-center space-x-2 p-3.5 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {profileError && (
              <div className="flex items-center space-x-2 p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
                <span>{profileError}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label htmlFor="Profile-field-1" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input id="Profile-field-1"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="Profile-field-2" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Department
                  </label>
                  <input id="Profile-field-2"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Computer Science & Engg"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="Profile-field-3" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Course / Program
                  </label>
                  <input id="Profile-field-3"
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    placeholder="e.g. B.Tech CSE"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                  />
                </div>
              </div>

              {user.role === 'STUDENT' && (
                <div>
                  <label htmlFor="Profile-field-4" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Academic Year
                  </label>
                  <select id="Profile-field-4"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white"
                  >
                    <option value={1}>1st Year (Freshman)</option>
                    <option value={2}>2nd Year (Sophomore)</option>
                    <option value={3}>3rd Year (Junior)</option>
                    <option value={4}>4th Year (Senior)</option>
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="Profile-field-5" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Bio & Academic Interests
                </label>
                <textarea id="Profile-field-5"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell campus members about your technical interests, projects, or study groups..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm disabled:opacity-50 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{profileSaving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security & Password Change */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8">
            <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100 mb-6">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">Security & Password</h2>
            </div>

            {passwordSuccess && (
              <div className="flex items-center space-x-2 p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="flex items-center space-x-2 p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label htmlFor="Profile-field-6" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Current Password
                </label>
                <input id="Profile-field-6"
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div>
                <label htmlFor="Profile-field-7" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input id="Profile-field-7"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div>
                <label htmlFor="Profile-field-8" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input id="Profile-field-8"
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordChanging}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{passwordChanging ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
