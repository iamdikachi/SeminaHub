import React, { useState } from 'react';
import { FileSpreadsheet, Plus, Edit3, Trash2, Users, Search, AlertCircle, RefreshCw } from 'lucide-react';
import { Seminar, Registration, Session, UserRole } from '../types';

interface OrganizerPageProps {
  user: { uid: string } | null;
  activeRole: UserRole;
  seminars: Seminar[];
  registrations: Registration[];
  sessionsMap: Record<string, Session[]>;
  onTriggerCreateSeminar: () => void;
  onTriggerEditSeminar: (sem: Seminar) => void;
  onDeleteSeminar: (seminarId: string) => Promise<void>;
}

export const OrganizerPage: React.FC<OrganizerPageProps> = ({
  user,
  activeRole,
  seminars,
  registrations,
  sessionsMap,
  onTriggerCreateSeminar,
  onTriggerEditSeminar,
  onDeleteSeminar
}) => {
  // Filter seminars: Admins see everything, Organizers see only what they own
  const managedSeminars = seminars.filter(
    sem => activeRole === 'Admin' || sem.organizerId === user?.uid
  );

  const [selectedSeminarId, setSelectedSeminarId] = useState<string>(() => {
    return managedSeminars.length > 0 ? managedSeminars[0].id : '';
  });

  const [rosterSearchQuery, setRosterSearchQuery] = useState('');

  // If selectedSeminarId is empty, try to fill it
  if (selectedSeminarId === '' && managedSeminars.length > 0) {
    setSelectedSeminarId(managedSeminars[0].id);
  }

  const selectedSeminar = seminars.find(s => s.id === selectedSeminarId);
  
  // Registrations for the selected seminar
  const selectedRegistrants = registrations.filter(
    r => r.seminarId === selectedSeminarId && r.status !== 'cancelled'
  );

  // Apply search query to registrants roster
  const filteredRegistrants = selectedRegistrants.filter(r => {
    const q = rosterSearchQuery.toLowerCase();
    return (
      r.userName.toLowerCase().includes(q) ||
      r.userEmail.toLowerCase().includes(q) ||
      r.code.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-100/80 shadow-xl shadow-neutral-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-neutral-800 flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            Seminar Management Workspace
          </h2>
          <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
            Administer scheduling options, customize agendas, track attendance records, and review roster charts.
          </p>
        </div>

        <button
          onClick={onTriggerCreateSeminar}
          className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer shrink-0"
        >
          <Plus className="w-4.5 h-4.5" />
          Create New Seminar
        </button>
      </div>

      {managedSeminars.length === 0 ? (
        <div className="text-center py-20 bg-white border border-neutral-100/80 rounded-2xl shadow-xl shadow-neutral-100/50 space-y-4">
          <div className="w-14 h-14 rounded-full bg-neutral-50 flex items-center justify-center mx-auto text-neutral-400">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-base text-neutral-800">No Managed Seminars Found</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">
              You haven't scheduled or imported any workshops. Click the "Create New Seminar" button to launch your first workshop space!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Managed Seminar Listing Grid (5 columns) */}
          <div className="xl:col-span-5 space-y-4">
            <h3 className="font-bold text-sm text-neutral-400 uppercase tracking-wider px-1">
              Active Management Roster ({managedSeminars.length})
            </h3>

            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {managedSeminars.map(sem => {
                const sessions = sessionsMap[sem.id] || [];
                const isSelected = sem.id === selectedSeminarId;
                const percentFull = Math.min(Math.round((sem.registeredCount / sem.capacity) * 100), 100);

                return (
                  <div
                    key={sem.id}
                    onClick={() => setSelectedSeminarId(sem.id)}
                    className={`p-5 rounded-xl border transition-all cursor-pointer text-left space-y-4 ${
                      isSelected
                        ? 'bg-indigo-50/30 border-indigo-200 ring-2 ring-indigo-500/10'
                        : 'bg-white border-neutral-100 hover:bg-neutral-50/50 shadow-sm hover:shadow-md hover:border-neutral-200'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-neutral-100 text-neutral-600">
                        {sem.category}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                        sem.status === 'Published' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : sem.status === 'Closed' 
                          ? 'bg-neutral-100 text-neutral-700' 
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {sem.status}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-bold text-sm sm:text-base text-neutral-800 line-clamp-1">
                        {sem.title}
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-1">
                        Venue: {sem.venue} | {sessions.length} sessions
                      </p>
                    </div>

                    {/* Progress Fill Indicator */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold text-neutral-500">
                        <span>Slots filled</span>
                        <span>{sem.registeredCount} / {sem.capacity} ({percentFull}%)</span>
                      </div>
                      <div className="w-full bg-neutral-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            percentFull >= 100 
                              ? 'bg-amber-500' 
                              : percentFull >= 80 
                              ? 'bg-indigo-500' 
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percentFull}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-neutral-100/60 pt-2.5 text-xs">
                      <span className="text-neutral-400">Created: {new Date(sem.createdAt).toLocaleDateString()}</span>
                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onTriggerEditSeminar(sem)}
                          className="p-1.5 text-neutral-500 hover:text-indigo-600 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Edit Seminar parameters"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteSeminar(sem.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-600 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                          title="Delete Seminar entirely"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registrants Roster Board (7 columns) */}
          <div className="xl:col-span-7">
            {selectedSeminar && (
              <div className="bg-white p-6 rounded-2xl border border-neutral-100/80 shadow-2xl shadow-neutral-100/50 space-y-5">
                <div className="border-b border-neutral-100 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">
                      Seminar Registrants Roster
                    </span>
                    <h4 className="font-display font-bold text-base text-neutral-800 line-clamp-1">
                      {selectedSeminar.title}
                    </h4>
                  </div>
                  
                  {/* Summary badges */}
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-100">
                      <Users className="w-4 h-4" />
                      {selectedRegistrants.filter(r => r.status === 'registered').length} Booked
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">
                      <AlertCircle className="w-4 h-4" />
                      {selectedRegistrants.filter(r => r.status === 'waitlisted').length} Waitlisted
                    </span>
                  </div>
                </div>

                {/* Filter and Search */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search roster by attendee name, email address or ticket code..."
                    value={rosterSearchQuery}
                    onChange={e => setRosterSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-colors bg-neutral-50/50 text-sm text-neutral-700 font-medium"
                  />
                </div>

                {/* Attendees Table */}
                <div className="overflow-x-auto border border-neutral-100 rounded-xl">
                  {filteredRegistrants.length === 0 ? (
                    <div className="text-center py-12 text-neutral-400 text-sm">
                      No matching registrants found on this roster.
                    </div>
                  ) : (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-neutral-50/70 border-b border-neutral-100 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                          <th className="px-4 py-3.5">Attendee Name</th>
                          <th className="px-4 py-3.5">Email</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-4 py-3.5">Ticket Code</th>
                          <th className="px-4 py-3.5">Registered At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50 text-xs font-medium text-neutral-600">
                        {filteredRegistrants.map(reg => (
                          <tr key={reg.id} className="hover:bg-neutral-50/30 transition-colors">
                            <td className="px-4 py-4 font-bold text-neutral-800">{reg.userName}</td>
                            <td className="px-4 py-4 font-mono text-neutral-500 text-xs">{reg.userEmail}</td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2.5 py-1 rounded text-xs font-bold uppercase ${
                                reg.status === 'registered'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {reg.status}
                              </span>
                            </td>
                            <td className="px-4 py-4 font-mono font-bold text-indigo-600">{reg.code}</td>
                            <td className="px-4 py-4 text-neutral-400">
                              {new Date(reg.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
