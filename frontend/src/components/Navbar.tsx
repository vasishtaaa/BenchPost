import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, Bookmark, CircleUserRound, LogOut, Orbit, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notification';

const sections = [
  ['/dashboard', 'Feed'], ['/communities', 'Communities'], ['/discussions', 'Discussions'],
  ['/events', 'Events'], ['/announcements', 'Notices'],
];

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const { data } = useQuery({
    queryKey: ['notifications-unread', user?.id],
    queryFn: () => notificationService.getNotifications(true),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!panel.current?.contains(event.target as Node)) setOpenOn(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpenOn(null); trigger.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  const links = user?.role === 'ADMIN' ? [...sections, ['/admin', 'Admin']] : sections;
  const navLinks = links.map(([to, title]) => <NavLink key={to} to={to} onClick={() => setOpenOn(null)}>{title}</NavLink>);
  const unread = data?.unread_count ?? 0;
  return <header className="masthead"><div className="masthead-inner">
    <Link to={isAuthenticated ? '/dashboard' : '/'} className="wordmark" aria-label="Benchpost home"><Orbit aria-hidden="true" />Benchpost</Link>
    {isAuthenticated ? <>
      <nav className="desktop-nav" aria-label="Campus">{navLinks}</nav>
      <div className="account-tools">
        <NavLink to="/notifications" className="bell-link" aria-label={`Notifications, ${unread} unread`}><Bell size={21} />{unread > 0 && <i />}</NavLink>
        <div ref={panel} className="menu-wrap" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpenOn(null); }}>
          <button ref={trigger} type="button" className="menu-button" aria-label="Campus menu and account" aria-expanded={open} aria-controls="account-panel" onClick={() => setOpenOn(open ? null : pathname)}>{open ? <X size={20} /> : <Menu size={20} />}<span>Menu</span></button>
          {open && <div id="account-panel" className="account-panel">
            <strong>{user?.profile?.full_name || user?.email}</strong>
            <nav aria-label="Mobile campus navigation" className="mobile-nav">{navLinks}</nav>
            <NavLink to="/profile" onClick={() => setOpenOn(null)}><CircleUserRound />My profile</NavLink>
            <NavLink to="/bookmarks" onClick={() => setOpenOn(null)}><Bookmark />Saved discussions</NavLink>
            <button onClick={() => { setOpenOn(null); logout(); navigate('/login'); }}><LogOut />Sign out</button>
          </div>}
        </div>
      </div>
    </> : <nav className="guest-nav" aria-label="Account"><Link to="/login">Sign in</Link><Link className="action-primary" to="/register">Join campus</Link></nav>}
  </div></header>;
}
