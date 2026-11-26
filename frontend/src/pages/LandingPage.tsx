import { Navigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { CalendarDays, MessagesSquare, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';

const spaces = [
  { icon: UsersRound, label: 'Communities', to: '/communities', title: 'Find a group you’ll come back to.', detail: 'Join a club or study group. Once you’re a member, you can start a discussion of your own.', example: 'Photography & Media Club', kind: 'Student community', action: 'Find a community' },
  { icon: MessagesSquare, label: 'Discussions', to: '/discussions', title: 'Ask the question on your mind.', detail: 'Read what classmates are working on, reply with an idea, or save a conversation for later.', example: 'Anyone up for a study group on Friday?', kind: 'Student question', action: 'Browse discussions' },
  { icon: CalendarDays, label: 'Events', to: '/events', title: 'Make room for something new.', detail: 'Find a workshop or meetup, check the venue, and reserve a seat. Your bookings stay together under My reservations.', example: 'Weekend photography walk', kind: 'Campus event', action: 'Explore events' },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const [selected, setSelected] = useState(0);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const stop = tourStep === null ? null : spaces[tourStep];
  const space = spaces[selected];
  const Icon = space.icon;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <div className="welcome">
    <section className="welcome-hero" aria-labelledby="welcome-title">
      <img className="hero-photo" src={`${import.meta.env.BASE_URL}campus-courtyard.webp`} width="1536" height="1024" alt="" fetchPriority="high" />
      <div className="welcome-intro">
        <h1 id="welcome-title">Campus life<br /><em>after class.</em></h1>
        <p className="welcome-summary">Meet people in your department, ask classmates a question, or find a workshop worth staying for.</p>
        <div className="welcome-actions"><Link className="action-primary" to="/register">Create an account</Link><button type="button" className="hero-explore" aria-haspopup="dialog" onClick={() => setTourStep(0)}>Take a look around</button></div>
      </div>
    </section>
    <section id="explore" className="explore" aria-labelledby="explore-title" tabIndex={-1}>
      <div className="explore-header"><h2 id="explore-title">Around campus</h2>
        <div className="space-switch" role="group" aria-label="Choose a campus activity">
          {spaces.map(({ label, icon: ItemIcon }, index) => <button type="button" key={label} aria-pressed={selected === index}
            aria-controls="space-preview" onClick={() => setSelected(index)}><ItemIcon size={17} aria-hidden="true" />{label}</button>)}
        </div>
      </div>
      <div id="space-preview" className="space-preview" aria-live="polite">
        <div className="space-story"><h3>{space.title}</h3><p>{space.detail}</p><Link className="action-primary" to={space.to}>{space.action}</Link></div>
        <div className="space-sample"><Icon aria-hidden="true" size={30} strokeWidth={1.5} /><div><small>Example · {space.kind}</small><p>{space.example}</p></div></div>
      </div>
    </section>
    {stop && tourStep !== null && <Modal title="Campus preview" onClose={() => setTourStep(null)}>
      <div className="bg-white p-6 sm:p-8 space-y-5">
        <div className="flex items-center justify-between gap-3"><h2 className="text-xl font-semibold">Campus preview</h2>
          <button className="action-secondary" onClick={() => setTourStep(null)}>Close</button>
        </div>
        <div aria-live="polite" aria-atomic="true" className="space-y-3">
          <p className="text-sm text-slate-600">{tourStep + 1} of {spaces.length} · {stop.label}</p>
          <h3 className="text-2xl font-semibold">{stop.title}</h3><p>{stop.detail}</p>
          <div className="space-sample"><stop.icon aria-hidden="true" /><div><small>Example · {stop.kind}</small><p>{stop.example}</p></div></div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {tourStep > 0 && <button className="action-secondary" onClick={() => setTourStep(tourStep - 1)}>Back</button>}
          {tourStep < spaces.length - 1
            ? <button className="action-primary" onClick={() => setTourStep(tourStep + 1)}>Next · {spaces[tourStep + 1].label}</button>
            : <button className="action-primary" onClick={() => setTourStep(null)}>Finish tour</button>}
        </div>
      </div>
    </Modal>}
  </div>;
}
