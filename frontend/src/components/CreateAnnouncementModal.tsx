import { Modal } from './Modal';
import React, { useState } from 'react';
import { X, Bell, AlertCircle } from 'lucide-react';
import { announcementService } from '../services/announcement';
import type { Announcement } from '../types/announcement';

interface CreateAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnnouncementCreated: (newAnn: Announcement) => void;
}

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  isOpen,
  onClose,
  onAnnouncementCreated
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('NORMAL');
  const [scope, setScope] = useState('GLOBAL');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [isPinned, setIsPinned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError('Title and content are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const created = await announcementService.createAnnouncement({
        title,
        content,
        priority,
        scope,
        target_department: scope === 'DEPARTMENT' ? department : null,
        is_pinned: isPinned
      });

      onAnnouncementCreated(created);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to publish official announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Publish notice" onClose={onClose}>
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Broadcast Notice</h2>
              <p className="text-xs text-slate-500">Official academic announcement from verified authority</p>
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
            <label htmlFor="CreateAnnouncementModal-field-1" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notice Title *
            </label>
            <input id="CreateAnnouncementModal-field-1"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Examination Schedule & Review Pods"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="CreateAnnouncementModal-field-2" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Priority Tier
              </label>
              <select id="CreateAnnouncementModal-field-2"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label htmlFor="CreateAnnouncementModal-field-3" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Audience Scope
              </label>
              <select id="CreateAnnouncementModal-field-3"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="GLOBAL">Global (Campus-wide)</option>
                <option value="DEPARTMENT">Departmental</option>
              </select>
            </div>
          </div>

          {scope === 'DEPARTMENT' && (
            <div>
              <label htmlFor="CreateAnnouncementModal-field-4" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Department
              </label>
              <input id="CreateAnnouncementModal-field-4"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="CreateAnnouncementModal-field-5" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Notice Content *
            </label>
            <textarea id="CreateAnnouncementModal-field-5"
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="State the instructions, deadlines, and guidelines clearly..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="pinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
            />
            <label htmlFor="pinned" className="text-xs font-semibold text-slate-700 cursor-pointer">
              Pin this notice to top of announcements board
            </label>
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
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-100 transition disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Broadcast Notice'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
