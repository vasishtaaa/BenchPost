import { Modal } from './Modal';
import React, { useState } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { eventService } from '../services/event';
import type { Event } from '../types/event';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (newEvent: Event) => void;
}

const CATEGORIES = [
  'HACKATHON',
  'WORKSHOP',
  'SEMINAR',
  'CULTURAL',
  'SPORTS',
  'CAREER',
  'OTHER'
];

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('WORKSHOP');
  const [venue, setVenue] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxCapacity, setMaxCapacity] = useState(100);
  const [bannerUrl, setBannerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !venue || !startDate || !endDate) {
      setError('Please fill in all mandatory fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await eventService.createEvent({
        title,
        description,
        category,
        venue,
        start_time: new Date(startDate).toISOString(),
        end_time: new Date(endDate).toISOString(),
        registration_deadline: deadline ? new Date(deadline).toISOString() : null,
        max_capacity: Number(maxCapacity),
        banner_url: bannerUrl || null
      });

      onEventCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create campus event.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create event" onClose={onClose}>
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Publish Campus Event</h2>
              <p className="text-xs text-slate-500">Official seminar, workshop, or hackathon organization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
           aria-label="Close dialog">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="CreateEventModal-field-1" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Event Title *
            </label>
            <input id="CreateEventModal-field-1"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HackCampus 2026: 24h University Hackathon"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="CreateEventModal-field-2" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select id="CreateEventModal-field-2"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="CreateEventModal-field-3" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Max Seat Capacity *
              </label>
              <input id="CreateEventModal-field-3"
                type="number"
                min="1"
                max="5000"
                required
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="CreateEventModal-field-4" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Campus Venue / Location *
            </label>
            <input id="CreateEventModal-field-4"
              type="text"
              required
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. Auditorium 1, Block B / Innovation Lab"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="CreateEventModal-field-5" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Start Time *
              </label>
              <input id="CreateEventModal-field-5"
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="CreateEventModal-field-6" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                End Time *
              </label>
              <input id="CreateEventModal-field-6"
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="CreateEventModal-field-7" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              RSVP Deadline (Optional)
            </label>
            <input id="CreateEventModal-field-7"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="CreateEventModal-field-8" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Banner Image URL (Optional)
            </label>
            <input id="CreateEventModal-field-8"
              type="url"
              value={bannerUrl}
              onChange={(e) => setBannerUrl(e.target.value)}
              placeholder="https://images.unsplash.com/photo-..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="CreateEventModal-field-9" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Detailed Description *
            </label>
            <textarea id="CreateEventModal-field-9"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide agenda, prerequisites, mentor bios, and event schedule..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition disabled:opacity-50"
            >
              {loading ? 'Publishing Event...' : 'Publish Event'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
