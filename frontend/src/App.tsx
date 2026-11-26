import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Register } from './pages/Register';











import { LandingPage } from './pages/LandingPage';

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Unauthorized = lazy(() => import('./pages/Unauthorized').then(module => ({ default: module.Unauthorized })));
const Communities = lazy(() => import('./pages/Communities').then(module => ({ default: module.Communities })));
const CommunityDetail = lazy(() => import('./pages/CommunityDetail').then(module => ({ default: module.CommunityDetail })));
const Discussions = lazy(() => import('./pages/Discussions').then(module => ({ default: module.Discussions })));
const DiscussionDetail = lazy(() => import('./pages/DiscussionDetail').then(module => ({ default: module.DiscussionDetail })));
const Events = lazy(() => import('./pages/Events').then(module => ({ default: module.Events })));
const Announcements = lazy(() => import('./pages/Announcements').then(module => ({ default: module.Announcements })));
const Notifications = lazy(() => import('./pages/Notifications').then(module => ({ default: module.Notifications })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(module => ({ default: module.AdminDashboard })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteFocus() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById('content')?.focus({ preventScroll: true });
    const section = pathname.split('/')[1];
    document.title = section ? `${section[0].toUpperCase()}${section.slice(1)} | Benchpost` : 'Benchpost | Campus life, together';
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AuthProvider>
        <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
          <a className="skip-link" href="#content">Skip to content</a>
          <RouteFocus />
          <Navbar />
          <main id="content" tabIndex={-1} className="flex-1 flex flex-col">
            <Suspense fallback={<p role="status" className="p-8 text-center">Loading page?</p>}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Communities Routes */}
              <Route
                path="/communities"
                element={
                  <ProtectedRoute>
                    <Communities />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/communities/:slug"
                element={
                  <ProtectedRoute>
                    <CommunityDetail />
                  </ProtectedRoute>
                }
              />

              {/* Discussions & Posts Routes (Module D) */}
              <Route
                path="/discussions"
                element={
                  <ProtectedRoute>
                    <Discussions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discussions/:id"
                element={
                  <ProtectedRoute>
                    <DiscussionDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookmarks"
                element={
                  <ProtectedRoute>
                    <Discussions initialSavedOnly={true} />
                  </ProtectedRoute>
                }
              />

              {/* Events & RSVPs Route (Module F) */}
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <Events />
                  </ProtectedRoute>
                }
              />

              {/* Official Announcements Center (Module G) */}
              <Route
                path="/announcements"
                element={
                  <ProtectedRoute>
                    <Announcements />
                  </ProtectedRoute>
                }
              />

              {/* Notifications Center (Module H) */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Admin & Moderation Console (Modules I, J) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </Suspense>
          </main>

          <footer className="site-footer">
            <Link to="/">Benchpost</Link><span>University community network</span>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);
}
