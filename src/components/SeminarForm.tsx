import React, { useState } from 'react';
import { Seminar, Session } from '../types';
import { Plus, Trash2, Calendar, MapPin, Users, Tag, AlertTriangle, FileText, ArrowRight } from 'lucide-react';

interface SeminarFormProps {
  initialSeminar?: Seminar;
  initialSessions?: Session[];
  onSubmit: (seminarData: Omit<Seminar, 'id' | 'organizerId' | 'registeredCount' | 'createdAt'>, sessions: Omit<Session, 'id' | 'seminarId'>[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const SeminarForm: React.FC<SeminarFormProps> = ({
  initialSeminar,
  initialSessions = [],
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [title, setTitle] = useState(initialSeminar?.title || '');
  const [description, setDescription] = useState(initialSeminar?.description || '');
  const [startDate, setStartDate] = useState(initialSeminar?.startDate ? initialSeminar.startDate.slice(0, 16) : '');
  const [endDate, setEndDate] = useState(initialSeminar?.endDate ? initialSeminar.endDate.slice(0, 16) : '');
  const [venue, setVenue] = useState(initialSeminar?.venue || '');
  const [capacity, setCapacity] = useState<number>(initialSeminar?.capacity || 50);
  const [status, setStatus] = useState<'Draft' | 'Published' | 'Closed'>(initialSeminar?.status || 'Draft');
  const [category, setCategory] = useState(initialSeminar?.category || 'Technology');

  // Sessions list
  const [sessions, setSessions] = useState<Omit<Session, 'id' | 'seminarId'>[]>(
    initialSessions.map(s => ({
      title: s.title,
      speakerName: s.speakerName,
      startTime: s.startTime.slice(0, 16),
      endTime: s.endTime.slice(0, 16),
    }))
  );

  const [error, setError] = useState<string | null>(null);

  const handleAddSession = () => {
    setSessions([
      ...sessions,
      {
        title: '',
        speakerName: '',
        startTime: startDate || '',
        endTime: endDate || '',
      },
    ]);
  };

  const handleRemoveSession = (index: number) => {
    setSessions(sessions.filter((_, i) => i !== index));
  };

  const handleSessionChange = (index: number, field: keyof Omit<Session, 'id' | 'seminarId'>, value: string) => {
    const updated = [...sessions];
    updated[index] = {
      ...updated[index],
      [field]: field === 'startTime' || field === 'endTime' ? value : value,
    };
    setSessions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !venue.trim() || !category.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please provide seminar start and end times.');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError('Seminar start date must be before the end date.');
      return;
    }

    if (capacity <= 0) {
      setError('Seminar capacity must be greater than zero.');
      return;
    }

    // Validate sessions
    for (let i = 0; i < sessions.length; i++) {
      const sess = sessions[i];
      if (!sess.title.trim() || !sess.speakerName.trim()) {
        setError(`Please complete all details for Session #${i + 1}.`);
        return;
      }
      if (!sess.startTime || !sess.endTime) {
        setError(`Please specify start and end times for Session #${i + 1}.`);
        return;
      }
      if (new Date(sess.startTime) >= new Date(sess.endTime)) {
        setError(`Session #${i + 1} start time must be before its end time.`);
        return;
      }
    }

    try {
      await onSubmit(
        {
          title,
          description,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          venue,
          capacity,
          status,
          category,
        },
        sessions.map(s => ({
          title: s.title,
          speakerName: s.speakerName,
          startTime: new Date(s.startTime).toISOString(),
          endTime: new Date(s.endTime).toISOString(),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while saving.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl flex items-start gap-4 shadow-sm">
          <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          <div className="text-base text-red-700 font-bold">{error}</div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-6">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-neutral-800 border-b border-neutral-100 pb-4 flex items-center gap-2.5">
          <FileText className="w-6 h-6 text-indigo-600" />
          {initialSeminar ? 'Edit Seminar Details' : 'Create New Seminar'}
        </h2>

        {/* Seminar Title */}
        <div>
          <label className="block text-sm font-bold text-neutral-600 uppercase tracking-wider mb-2.5">Seminar Title *</label>
          <input
            type="text"
            required
            placeholder="e.g., Modern Web Architecture with React & Firebase"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors bg-white text-sm sm:text-base font-medium"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-neutral-600 uppercase tracking-wider mb-2.5">Detailed Description *</label>
          <textarea
            required
            rows={5}
            placeholder="Describe what attendees will learn, topics covered, and who should attend..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors bg-white text-sm sm:text-base font-medium resize-none leading-relaxed"
          />
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-bold text-neutral-600 uppercase tracking-wider mb-2.5">Category *</label>
            <div className="relative">
              <Tag className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-neutral-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors bg-white text-sm sm:text-base font-semibold appearance-none"
              >
                <option value="Technology">Technology</option>
                <option value="Business & Finance">Business & Finance</option>
                <option value="Health & Science">Health & Science</option>
                <option value="Art & Design">Art & Design</option>
                <option value="Personal Development">Personal Development</option>
                <option value="Other">Other Category</option>
              </select>
            </div>
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-sm font-bold text-neutral-600 uppercase tracking-wider mb-2.5">Capacity (Max Attendees) *</label>
            <div className="relative">
              <Users className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-neutral-400" />
              <input
                type="number"
                required
                min={1}
                max={10000}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors bg-white text-sm sm:text-base font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Venue / Link */}
        <div>
          <label className="block text-sm font-bold text-neutral-600 uppercase tracking-wider mb-2.5">Venue or Link (Online) *</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-neutral-400" />
            <input
              type="text"
              required
              placeholder="e.g., Grand Hall (Room 403) or https://zoom.us/j/123456"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors bg-white text-sm sm:text-base font-medium"
            />
          </div>
        </div>

        {/* Start / End Times */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-neutral-600 uppercase tracking-wider mb-2.5">Seminar Start Date & Time *</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-neutral-400" />
              <input
                type="datetime-local"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors bg-white text-sm sm:text-base font-medium text-neutral-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-neutral-600 uppercase tracking-wider mb-2.5">Seminar End Date & Time *</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-neutral-400" />
              <input
                type="datetime-local"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors bg-white text-sm sm:text-base font-medium text-neutral-700"
              />
            </div>
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-bold text-neutral-600 uppercase tracking-wider mb-2.5">Status</label>
          <div className="flex flex-wrap gap-5">
            {(['Draft', 'Published', 'Closed'] as const).map((s) => (
              <label key={s} className="flex items-center gap-2.5 cursor-pointer text-sm sm:text-base font-bold text-neutral-700">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  checked={status === s}
                  onChange={() => setStatus(s)}
                  className="w-4.5 h-4.5 text-sky-600 focus:ring-sky-500"
                />
                {s === 'Draft' ? 'Draft (Private)' : s === 'Published' ? 'Published (Public)' : 'Closed (Completed)'}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Multi-Session Agenda Section */}
      <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <h3 className="font-display font-bold text-base sm:text-lg text-neutral-800 flex items-center gap-2.5">
              <Calendar className="w-5.5 h-5.5 text-indigo-500" />
              Multi-Session Agenda & Speakers
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              Specify the itinerary/topics and speaker assignments for this seminar.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSession}
            className="inline-flex items-center gap-1.5 text-sm font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4.5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Session
          </button>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50/50">
            <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-2.5" />
            <p className="text-base font-bold text-neutral-600">No sessions added yet</p>
            <p className="text-sm text-neutral-400 mt-1">Add sessions to build a multi-speaker agenda.</p>
            <button
              type="button"
              onClick={handleAddSession}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Add First Session
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {sessions.map((sess, index) => (
              <div key={index} className="p-5 border border-neutral-150 rounded-xl bg-neutral-50/30 relative space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm sm:text-base text-neutral-800">
                    Session #{index + 1}
                  </h4>
                  <button
                    type="button"
                    onClick={() => handleRemoveSession(index)}
                    className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                    title="Remove Session"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Session Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Keynote: The Future of Cloud Services"
                      value={sess.title}
                      onChange={(e) => handleSessionChange(index, 'title', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Speaker Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Dr. Jane Smith"
                      value={sess.speakerName}
                      onChange={(e) => handleSessionChange(index, 'speakerName', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Session Start *</label>
                    <input
                      type="datetime-local"
                      required
                      value={sess.startTime}
                      onChange={(e) => handleSessionChange(index, 'startTime', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Session End *</label>
                    <input
                      type="datetime-local"
                      required
                      value={sess.endTime}
                      onChange={(e) => handleSessionChange(index, 'endTime', e.target.value)}
                      className="w-full px-3.5 py-2 rounded-lg border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3.5 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-xl border border-neutral-200 hover:border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 text-sm font-bold transition-all disabled:opacity-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-7 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold shadow-sm hover:shadow transition-all disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? 'Saving...' : 'Save Seminar'}
          <ArrowRight className="w-4.5 h-4.5" />
        </button>
      </div>
    </form>
  );
};
