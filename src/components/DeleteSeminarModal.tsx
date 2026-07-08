import React from 'react';
import { X, AlertTriangle, Trash2, Calendar, Users, ListFilter } from 'lucide-react';
import { Seminar, Session, Registration } from '../types';

interface DeleteSeminarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  seminar: Seminar | null;
  sessions: Session[];
  registrations: Registration[];
}

export const DeleteSeminarModal: React.FC<DeleteSeminarModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  seminar,
  sessions,
  registrations,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (!isOpen || !seminar) return null;

  const bookedCount = registrations.filter(r => r.status === 'registered').length;
  const waitlistCount = registrations.filter(r => r.status === 'waitlisted').length;

  const handleConfirm = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await onConfirm();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to delete seminar. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-neutral-900/70 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-neutral-100 relative flex flex-col text-left animate-in fade-in zoom-in-95 duration-200"
        id="delete-seminar-modal"
      >
        {/* Banner header */}
        <div className="bg-red-600 p-8 text-white relative">
          <button 
            onClick={onClose}
            disabled={isDeleting}
            className="absolute right-5 top-5 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5.5 h-5.5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 rounded-xl text-white">
              <AlertTriangle className="w-6.5 h-6.5 text-red-100" />
            </div>
            <h3 className="font-display font-extrabold text-xl sm:text-2xl tracking-tight">
              Delete Seminar Workspace?
            </h3>
          </div>
          <p className="text-sm text-red-100 mt-2.5 leading-relaxed font-medium max-w-xl">
            You are about to permanently delete this seminar. This action is irreversible and will purge all underlying records.
          </p>
        </div>

        {/* Content body */}
        <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-800 text-sm font-bold leading-relaxed">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Seminar Title Spot */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest block">Seminar Selected</span>
            <h4 className="text-lg sm:text-xl font-extrabold text-neutral-800 leading-snug">
              {seminar.title}
            </h4>
            <div className="flex flex-wrap gap-2 text-xs text-neutral-500 font-semibold">
              <span className="px-2.5 py-0.5 bg-neutral-100 rounded-md">{seminar.category}</span>
              <span>•</span>
              <span>Capacity: {seminar.capacity} seats</span>
              <span>•</span>
              <span>Created: {new Date(seminar.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Warning summary statistics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Registrations Warning Card */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-150 flex items-start gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Registrations to be Purged</div>
                <div className="text-xl font-extrabold text-neutral-800">
                  {registrations.length} Total
                </div>
                <div className="text-xs text-neutral-500 font-medium leading-normal">
                  <span className="font-semibold text-amber-600">{bookedCount}</span> booked seats and <span className="font-semibold text-amber-600">{waitlistCount}</span> waitlisted attendees will lose their tickets.
                </div>
              </div>
            </div>

            {/* Sessions Warning Card */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-150 flex items-start gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Sessions to be Purged</div>
                <div className="text-xl font-extrabold text-neutral-800">
                  {sessions.length} {sessions.length === 1 ? 'Session' : 'Sessions'}
                </div>
                <div className="text-xs text-neutral-500 font-medium leading-normal">
                  The scheduled timeline, speakers, and live attendance gate records for this workshop will be deleted.
                </div>
              </div>
            </div>
          </div>

          {/* Associated Sessions list */}
          {sessions.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                <ListFilter className="w-4 h-4" />
                Impacted Sessions Checklist
              </h5>
              <div className="border border-neutral-150 rounded-2xl divide-y divide-neutral-150 overflow-hidden bg-neutral-50/20">
                {sessions.map((sess, idx) => (
                  <div key={sess.id} className="p-3.5 flex items-center justify-between text-xs sm:text-sm font-semibold text-neutral-700">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate text-neutral-800">{sess.title}</span>
                    </div>
                    <span className="text-neutral-400 shrink-0 font-medium text-xs">
                      Spkr: {sess.speakerName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm Alert Banner */}
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs sm:text-sm font-semibold leading-relaxed">
            By confirming below, you acknowledge that <strong>all student/attendee ticket codes will immediately become invalid</strong> and all attendance scan histories for these sessions will be destroyed. This operation cannot be undone.
          </div>
        </div>

        {/* Action buttons footer */}
        <div className="bg-neutral-50 px-8 py-5 border-t border-neutral-150 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 text-sm font-bold transition-all disabled:opacity-50 cursor-pointer text-center"
          >
            Cancel, Keep Seminar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto px-7 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 inline-flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4.5 h-4.5" />
                <span>Permanently Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
