import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, IdCard, Building2, BookMarked, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';

export const Register: React.FC = () => {
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
        student_id: role === 'STUDENT' ? studentId.trim() || undefined : undefined,
        department: department.trim() || undefined,
        course: course.trim() || undefined,
        academic_year: role === 'STUDENT' && academicYear ? Number(academicYear) : undefined,
        role,
      });
      navigate(typeof state?.from === 'string' && /^\/(?!\/)/.test(state.from) ? state.from : '/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Registration failed. Please check your inputs.';
      setError(typeof msg === 'string' ? msg : 'Please check the form and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card space-y-6">
        <div><h1>Join Benchpost</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create an account to join groups and take part in campus life.
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200">
          <button
            type="button"
            aria-pressed={role === 'STUDENT'} onClick={() => setRole('STUDENT')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              role === 'STUDENT' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎓 Student Account
          </button>
          <button
            type="button"
            aria-pressed={role === 'FACULTY'} onClick={() => setRole('FACULTY')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition ${
              role === 'FACULTY' 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏛️ Faculty Member
          </button>
        </div>

        {error && (
          <div role="alert" className="flex items-center space-x-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  minLength={2} maxLength={255}
                  id="fullName" autoComplete="name" value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                University Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  id="email" autoComplete="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>
            </div>
          </div>

          <p id="password-help" className="text-sm text-slate-600">Choose a password with at least 8 characters.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={8} aria-describedby="password-help" id="password" autoComplete="new-password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Repeat password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  id="confirmPassword" autoComplete="new-password" value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>
            </div>
          </div>

          <details className="optional-profile"><summary>Add academic details (optional)</summary><div className="space-y-4 mt-4">
          {/* Student ID & Academic Year (If Student) */}
          {role === 'STUDENT' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="studentId" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Student Roll / ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <IdCard className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="studentId" value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. 21CS042"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="academicYear" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Year
                </label>
                <select
                  id="academicYear" value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white"
                >
                  <option value="">Choose a year</option>
                  <option value={1}>1st Year</option>
                  <option value={2}>2nd Year</option>
                  <option value={3}>3rd Year</option>
                  <option value={4}>4th Year</option>
                  <option value={5}>5th Year</option>
                </select>
              </div>
            </div>
          )}

          {/* Department & Course */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="department" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="department" value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science & Engg"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="course" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Course / Program
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <BookMarked className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="course" value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="e.g. B.Tech CSE"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm"
                />
              </div>
            </div>
          </div>

          </div></details>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 disabled:opacity-50 transition"
          >
            <span>{loading ? 'Creating Account...' : 'Create account'}</span>

          </button>
        </form>

        <p className="text-center text-xs text-slate-600">
          Already registered?{' '}
          <Link to="/login" state={state} className="font-semibold text-indigo-600 hover:text-indigo-700">
            Sign in to your account
          </Link>
        </p>
      </div>
    </div>
  );
};
