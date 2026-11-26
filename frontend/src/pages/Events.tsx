import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SearchForm } from '../components/SearchForm';
import React, { useState } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 

  CheckCircle2, 
  Clock, 
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { eventService } from '../services/event';
import type { Event } from '../types/event';
import { useAuth } from '../context/AuthContext';
import { CreateEventModal } from '../components/CreateEventModal';

const CATEGORIES = ['All', 'HACKATHON', 'WORKSHOP', 'SEMINAR', 'CULTURAL', 'CAREER'];

export const Events: React.FC = () => {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [registeredOnly, setRegisteredOnly] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ id: string; text: string; error?: boolean } | null>(null);

  const listKey = ['events', user?.id];
  const results = useQuery({
    queryKey: [...listKey, category, query, registeredOnly],
    queryFn: () => eventService.getEvents({ category, search: query || undefined, registered_only: registeredOnly, upcoming_only: true }),
    staleTime: 0,
  });
  const events = results.data?.items ?? [];
  const handleSearchSubmit = () => setQuery(search.trim());

  const handleRSVP = async (event: Event) => {
    setActionLoadingId(event.id);
    setFeedbackMsg(null);
    try {
      if (event.is_registered) {
        // Cancel registration
        await eventService.cancelRegistration(event.id);
        await queryClient.invalidateQueries({ queryKey: listKey });
        setFeedbackMsg({ id: event.id, text: 'Your reservation was cancelled.' });
      } else {
        // Register atomically
        await eventService.registerForEvent(event.id);
        await queryClient.invalidateQueries({ queryKey: listKey });
        setFeedbackMsg({ id: event.id, text: 'Seat successfully reserved!' });
      }
    } catch (err: any) {
      setFeedbackMsg({
        id: event.id,
        text: err.response?.data?.detail || 'Registration failed.',
        error: true
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const isOrganizer = user?.role === 'FACULTY' || user?.role === 'ADMIN';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* ========================================================= */}
      {/* HEADER BANNER                                             */}
      {/* ========================================================= */}
      <header className="page-heading"><div><h1>Campus events</h1><p>Find workshops, lectures, and meetups. Choose an event to reserve a seat.</p></div>
        {isOrganizer && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="action-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Organize Event</span>
          </button>
        )}

      </header>

      {/* ========================================================= */}
      {/* CONTROLS TOOLBAR                                          */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <SearchForm label="Search events" value={search} onChange={setSearch} onSearch={handleSearchSubmit} />

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((c) => (
              <button
                key={c[0] + c.slice(1).toLowerCase()}
                type="button"
                aria-pressed={category === c} onClick={() => setCategory(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                  category === c
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Registered Only Filter */}
          <button
            type="button"
            aria-pressed={registeredOnly} onClick={() => setRegisteredOnly(!registeredOnly)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              registeredOnly
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>My reservations</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* EVENTS STREAM                                             */}
      {/* ========================================================= */}
      {results.isError ? <div className="feedback-box" role="alert"><p>We couldn’t load the events.</p><button onClick={() => results.refetch()}>Try again</button></div> : results.isPending ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-3xl p-6 border border-slate-200 animate-pulse h-80"></div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No events found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {registeredOnly
              ? "You haven't reserved seats for any upcoming events yet."
              : 'No upcoming campus events matching your active filter.'}
          </p>
          {(registeredOnly || query || category !== 'All') && (
            <button
              onClick={() => { setRegisteredOnly(false); setQuery(''); setSearch(''); setCategory('All'); }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Show all upcoming events
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => {
            const startDate = new Date(event.start_time);
            const month = startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase();
            const day = startDate.getDate();
            const timeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            const capacityPercent = Math.min(
              100,
              Math.round((event.current_registrations / event.max_capacity) * 100)
            );
            const isFull = event.is_full;
            const actionLoading = actionLoadingId === event.id;
            const hasFeedback = feedbackMsg && feedbackMsg.id === event.id;

            return (
              <div
                key={event.id}
                className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden relative ${
                  event.is_registered ? 'ring-2 ring-emerald-500/30' : ''
                }`}
              >
                {/* Banner / Category Header */}
                <div className="h-32 bg-gradient-to-r from-slate-800 to-indigo-900 relative p-4 flex items-start justify-between">
                  {event.banner_url && (
                    <img
                      src={event.banner_url}
                      alt={event.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-40"
                    />
                  )}
                  <span className="relative z-10 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[0.75rem] font-bold tracking-wider uppercase border border-white/20">
                    {event.category}
                  </span>

                  {event.is_registered && (
                    <span className="relative z-10 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[0.75rem] font-bold flex items-center gap-1 shadow-xs">
                      <Check className="w-3 h-3" />
                      <span>Seat reserved</span>
                    </span>
                  )}
                </div>

                {/* Content body */}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start gap-3.5 mb-3">
                    {/* Date Block */}
                    <div className="w-12 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex flex-col items-center justify-center font-bold shrink-0">
                      <span className="text-[0.75rem] uppercase leading-none">{month}</span>
                      <span className="text-lg leading-tight mt-0.5">{day}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                        {event.title}
                      </h3>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{timeStr}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {event.description}
                  </p>

                  <div className="mt-auto space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{event.venue}</span>
                    </div>

                    {/* Capacity Meter */}
                    <div>
                      <div className="flex items-center justify-between text-[0.75rem] font-semibold text-slate-600 mb-1">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>Seats Reserved</span>
                        </span>
                        <span className={isFull ? 'text-rose-600 font-bold' : 'text-slate-800'}>
                          {event.current_registrations} / {event.max_capacity} ({capacityPercent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isFull ? 'bg-rose-500' : capacityPercent > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${capacityPercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Feedback alert */}
                    {hasFeedback && (
                      <div
                        role="status" className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                          feedbackMsg.error
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {feedbackMsg.error ? (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Check className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{feedbackMsg.text}</span>
                      </div>
                    )}

                    {/* RSVP Action Button */}
                    <div className="pt-1">
                      {event.is_registered ? (
                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() => handleRSVP(event)}
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-700 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{actionLoading ? 'Updating...' : 'Cancel reservation'}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isFull || !event.is_registration_open || actionLoading}
                          onClick={() => handleRSVP(event)}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs ${
                            isFull
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {actionLoading
                              ? 'Reserving...'
                              : isFull
                              ? 'Event full'
                              : !event.is_registration_open ? 'Registration closed' : 'Reserve a seat'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onEventCreated={() => queryClient.invalidateQueries({ queryKey: listKey })}
      />
    </div>
  );
};
