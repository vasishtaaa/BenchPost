import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate(typeof state?.from === 'string' && /^\/(?!\/)/.test(state.from) ? state.from : '/dashboard', { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Failed to sign in. Please check your credentials.';
      setError(typeof msg === 'string' ? msg : 'Please check the form and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="auth-shell">
      <div className="auth-card space-y-6">
        <div><h1>Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to access your communities, discussions, and campus events.
          </p>
        </div>

        {error && (
          <div role="alert" className="flex items-center space-x-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
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
                placeholder="student@campusloop.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm transition"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                id="password" autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100 disabled:opacity-50 transition"
          >
            <span>{loading ? 'Signing in...' : 'Sign In'}</span>

          </button>
        </form>

        {/* Demo Account Quick-Fill Pills (Ideal for University Reviews) */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Try a demo account</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => fillDemoAccount('student@campusloop.edu', 'Student@123456')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 text-xs font-semibold text-slate-700 transition"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('faculty@campusloop.edu', 'Faculty@123456')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-xs font-semibold text-slate-700 transition"
            >
              🏛️ Faculty
            </button>
            <button
              type="button"
              onClick={() => fillDemoAccount('admin@campusloop.edu', 'Admin@123456')}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 text-xs font-semibold text-slate-700 transition"
            >
              ⚡ Admin
            </button>
          </div>
        </div>



        <p className="text-center text-xs text-slate-600 mt-6">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};
