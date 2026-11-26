import { Modal } from './Modal';
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { moderationService } from '../services/moderation';
import type { ReportTargetType } from '../types/moderation';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
}

const REPORT_REASONS = [
  { id: 'SPAM', label: 'Spam or advertising', desc: 'Promotional links, repetitive posts, or unsolicited ads' },
  { id: 'HARASSMENT', label: 'Harassment or hate speech', desc: 'Bullying, offensive language, or targeted abuse' },
  { id: 'ACADEMIC_MISCONDUCT', label: 'Academic dishonesty', desc: 'Cheating, sharing exam questions, or plagiarism' },
  { id: 'INAPPROPRIATE', label: 'Inappropriate content', desc: 'Content violating campus community code of conduct' },
  { id: 'OTHER', label: 'Other violation', desc: 'Any other policy or guideline concern' },
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
}) => {
  const [selectedReason, setSelectedReason] = useState<string>('SPAM');
  const [details, setDetails] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const reportMutation = useMutation({
    mutationFn: () =>
      moderationService.createReport({
        target_type: targetType,
        target_id: targetId,
        reason: selectedReason,
        details: details.trim() || undefined,
      }),
    onSuccess: () => {
      setSubmitted(true);
      setErrorMsg(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || 'Failed to submit report. Please try again.';
      setErrorMsg(msg);
    },
  });

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedReason('SPAM');
    setDetails('');
    setSubmitted(false);
    setErrorMsg(null);
    onClose();
  };

  return (
    <Modal title="Report content" onClose={handleClose}>
      <div 
        className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
         aria-label="Close dialog">
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Report Submitted
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed mb-6">
              Thank you for keeping Benchpost safe and respectful. Our community moderators and administrators have received your report and will review it promptly.
            </p>
            <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Report Content
                </h3>
                <p className="text-xs text-slate-500">
                  Reporting {targetType.toLowerCase()} {targetTitle ? `"${targetTitle.slice(0, 30)}..."` : ''}
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Reasons List */}
            <div className="space-y-2 mb-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Select a Reason
              </label>
              {REPORT_REASONS.map((r) => (
                <label
                  key={r.id}
                  onClick={() => setSelectedReason(r.id)}
                  className={`flex items-start space-x-3 p-3 rounded-xl border cursor-pointer transition ${
                    selectedReason === r.id
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="report_reason"
                    checked={selectedReason === r.id}
                    onChange={() => setSelectedReason(r.id)}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{r.label}</p>
                    <p className="text-[0.75rem] text-slate-500 leading-tight mt-0.5">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            {/* Additional details */}
            <div className="mb-6">
              <label htmlFor="ReportModal-field-1" className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Additional Context (Optional)
              </label>
              <textarea id="ReportModal-field-1"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Explain why this content violates community guidelines..."
                rows={3}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => reportMutation.mutate()}
                disabled={reportMutation.isPending}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 transition shadow-xs"
              >
                {reportMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
