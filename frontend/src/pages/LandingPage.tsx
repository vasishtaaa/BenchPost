import { Navigate, Link } from 'react-router-dom';
import { CalendarDays, MessagesSquare, UsersRound, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const spaces = [
  { icon: UsersRound, title: 'Communities', detail: 'Find your department, join a club, or meet people who share your interests.' },
  { icon: MessagesSquare, title: 'Discussions', detail: 'Ask a question, share your work, and learn from people across campus.' },
  { icon: CalendarDays, title: 'Events', detail: 'Discover workshops, lectures, and meetups. Reserve a seat before you go.' },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <div className="welcome">
    <section className="welcome-hero" aria-labelledby="welcome-title">
      <div className="welcome-intro">
        <p className="kicker"><span /> University community network</p>
        <h1 id="welcome-title">Campus life,<br /><em>together.</em></h1>
        <p className="welcome-summary">Find your people, join the conversation, and see what’s happening around campus.</p>
        <div className="welcome-actions"><Link className="action-primary" to="/register">Join CampusLoop</Link><Link className="action-secondary" to="/login">Sign in</Link></div>
      </div>
      <figure className="campus-photo">
        <img src="/campus-courtyard.webp" alt="Students walking between brick academic buildings in a sunlit courtyard" fetchPriority="high" />
        <figcaption><MapPin size={15} /> Campus courtyard</figcaption>
      </figure>
    </section>
    <section id="explore" className="explore"><h2>Explore campus life</h2>
      <div className="space-grid">{spaces.map(({ icon: Icon, title, detail }) =>
        <div className="space-entry" key={title}><Icon size={25} strokeWidth={1.6} /><div><h3>{title}</h3><p>{detail}</p></div></div>)}</div>
    </section>
  </div>;
}
