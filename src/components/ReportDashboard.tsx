import React, { useMemo } from 'react';
import { Seminar, Session, Registration, Attendance } from '../types';
import { Download, Users, CheckCircle, Clock, AlertCircle, BarChart3, TrendingUp } from 'lucide-react';

interface ReportDashboardProps {
  seminars: Seminar[];
  sessionsMap: Record<string, Session[]>;
  registrations: Registration[];
  attendancesMap: Record<string, Attendance[]>; // Key: sessionId
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({
  seminars,
  sessionsMap,
  registrations,
  attendancesMap
}) => {
  // 1. Calculate high level stats
  const stats = useMemo(() => {
    const totalSeminars = seminars.length;
    const activeRegistrations = registrations.filter(r => r.status === 'registered');
    const waitlistedRegistrations = registrations.filter(r => r.status === 'waitlisted');
    const totalRegCount = registrations.length;

    // Calculate total sessions and check-ins
    let totalSessions = 0;
    let totalCheckins = 0;
    
    (Object.values(sessionsMap) as Session[][]).forEach(sessList => {
      totalSessions += sessList.length;
      sessList.forEach(s => {
        const checkins = attendancesMap[s.id] || [];
        totalCheckins += checkins.length;
      });
    });

    // Calculate overall attendance rate:
    // Attendance rate = checkins / (registered registrations for seminar * sessions)
    let totalPossibleAttendance = 0;
    seminars.forEach(sem => {
      const semSessionsCount = (sessionsMap[sem.id] || []).length;
      const semRegCount = registrations.filter(r => r.seminarId === sem.id && r.status === 'registered').length;
      totalPossibleAttendance += semRegCount * semSessionsCount;
    });

    const attendanceRate = totalPossibleAttendance > 0 
      ? Math.round((totalCheckins / totalPossibleAttendance) * 100) 
      : 0;

    const noShowRate = totalPossibleAttendance > 0 ? 100 - attendanceRate : 0;

    return {
      totalSeminars,
      activeRegs: activeRegistrations.length,
      waitlistedRegs: waitlistedRegistrations.length,
      totalCheckins,
      attendanceRate,
      noShowRate
    };
  }, [seminars, sessionsMap, registrations, attendancesMap]);

  // 2. CSV Exporter for Registrations
  const handleExportRegistrationsCSV = () => {
    if (registrations.length === 0) return;
    
    const headers = ['Registration ID', 'User Name', 'User Email', 'Seminar ID', 'Seminar Title', 'Ticket Code', 'Status', 'Registered At', 'Organizer ID'];
    const rows = registrations.map(r => [
      r.id,
      r.userName,
      r.userEmail,
      r.seminarId,
      r.seminarTitle,
      r.code,
      r.status,
      r.createdAt,
      r.organizerId
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `seminar_registrations_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. CSV Exporter for Seminar Performance
  const handleExportSeminarsCSV = () => {
    if (seminars.length === 0) return;

    const headers = ['Seminar ID', 'Title', 'Category', 'Capacity', 'Registered Count', 'Waitlisted Count', 'Status', 'Start Date', 'End Date', 'Sessions Count', 'Total Checkins'];
    const rows = seminars.map(sem => {
      const semRegs = registrations.filter(r => r.seminarId === sem.id);
      const registered = semRegs.filter(r => r.status === 'registered').length;
      const waitlisted = semRegs.filter(r => r.status === 'waitlisted').length;
      const semSessions = sessionsMap[sem.id] || [];
      
      let checkinsCount = 0;
      semSessions.forEach(s => {
        checkinsCount += (attendancesMap[s.id] || []).length;
      });

      return [
        sem.id,
        sem.title,
        sem.category,
        sem.capacity,
        registered,
        waitlisted,
        sem.status,
        sem.startDate,
        sem.endDate,
        semSessions.length,
        checkinsCount
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `seminar_performance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-white p-8 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/40">
        <div>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-neutral-800 flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-sky-500" />
            Performance & Attendance Analytics
          </h2>
          <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed font-semibold">
            Evaluate seminar capacity trends, active waitlists, and session check-in percentages.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleExportSeminarsCSV}
            disabled={seminars.length === 0}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border border-neutral-200 text-sm font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Export Seminars CSV
          </button>
          <button
            onClick={handleExportRegistrationsCSV}
            disabled={registrations.length === 0}
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-2xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            Export Registrations CSV
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-neutral-100/70 shadow-xl shadow-neutral-100/40 flex items-center gap-6 hover:shadow-2xl hover:border-neutral-200 transition-all duration-355">
          <div className="p-5 bg-sky-50 text-sky-600 rounded-2xl">
            <TrendingUp className="w-6.5 h-6.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-450 uppercase tracking-widest">Total Seminars</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-neutral-800 mt-1 leading-none">{stats.totalSeminars}</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-100/70 shadow-xl shadow-neutral-100/40 flex items-center gap-6 hover:shadow-2xl hover:border-neutral-200 transition-all duration-355">
          <div className="p-5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Users className="w-6.5 h-6.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-450 uppercase tracking-widest">Active Bookings</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-neutral-800 mt-1 leading-none">
              {stats.activeRegs} <span className="text-sm font-bold text-neutral-400">({stats.waitlistedRegs} wait)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-100/70 shadow-xl shadow-neutral-100/40 flex items-center gap-6 hover:shadow-2xl hover:border-neutral-200 transition-all duration-355">
          <div className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl">
            <CheckCircle className="w-6.5 h-6.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-450 uppercase tracking-widest">Attendance Rate</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-neutral-800 mt-1 leading-none">{stats.attendanceRate}%</div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-neutral-100/70 shadow-xl shadow-neutral-100/40 flex items-center gap-6 hover:shadow-2xl hover:border-neutral-200 transition-all duration-355">
          <div className="p-5 bg-amber-50 text-amber-600 rounded-2xl">
            <Clock className="w-6.5 h-6.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-neutral-450 uppercase tracking-widest">No-Show Rate</div>
            <div className="text-3xl sm:text-4xl font-extrabold text-neutral-800 mt-1 leading-none">{stats.noShowRate}%</div>
          </div>
        </div>
      </div>

      {/* Main Charts & Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Capacity Utilization (2 cols width on desktop) */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-neutral-100/80 p-8 shadow-2xl shadow-neutral-100/50 space-y-6">
          <h3 className="font-display font-bold text-sm sm:text-base text-neutral-450 uppercase tracking-widest border-b border-neutral-100 pb-4">
            Capacity & Seat Booking Trends
          </h3>

          {seminars.length === 0 ? (
            <div className="text-center py-14 text-neutral-400 text-sm">
              No seminars registered in the system yet.
            </div>
          ) : (
            <div className="space-y-6">
              {seminars.map(sem => {
                const semRegs = registrations.filter(r => r.seminarId === sem.id);
                const activeCount = semRegs.filter(r => r.status === 'registered').length;
                const waitlistedCount = semRegs.filter(r => r.status === 'waitlisted').length;
                const pct = Math.min(Math.round((activeCount / sem.capacity) * 100), 100);
                
                let barColor = 'bg-sky-500';
                if (pct >= 100) barColor = 'bg-red-500';
                else if (pct >= 85) barColor = 'bg-amber-500';
                else if (pct > 0) barColor = 'bg-emerald-500';

                return (
                  <div key={sem.id} className="space-y-3 border-b border-neutral-100 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-display font-extrabold text-base sm:text-lg text-neutral-850 line-clamp-1 leading-tight">{sem.title}</h4>
                        <div className="flex gap-2.5 text-xs text-neutral-400 mt-2 font-medium">
                          <span>{sem.category}</span>
                          <span>•</span>
                          <span className={sem.status === 'Published' ? 'text-emerald-600 font-bold' : sem.status === 'Closed' ? 'text-neutral-500' : 'text-amber-600'}>
                            {sem.status}
                          </span>
                        </div>
                      </div>
                      <div className="text-right text-xs sm:text-sm">
                        <span className="font-extrabold text-neutral-850">{activeCount}</span>
                        <span className="text-neutral-400 font-bold"> / {sem.capacity} seats</span>
                        {waitlistedCount > 0 && (
                          <div className="text-xs text-amber-600 font-extrabold mt-1">+{waitlistedCount} waitlisted</div>
                        )}
                      </div>
                    </div>

                    <div className="h-3 w-full bg-neutral-100 rounded-full overflow-hidden relative">
                      <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Sessions Attendance Rate detail */}
        <div className="bg-white rounded-3xl border border-neutral-100/80 p-8 shadow-2xl shadow-neutral-100/50 space-y-5">
          <h3 className="font-display font-bold text-sm sm:text-base text-neutral-450 uppercase tracking-widest border-b border-neutral-100 pb-4">
            Session-by-Session Check-ins
          </h3>

          <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
            {seminars.every(sem => (sessionsMap[sem.id] || []).length === 0) ? (
              <div className="text-center py-14 text-neutral-400 text-sm">
                No active session check-ins registered.
              </div>
            ) : (
              seminars.map(sem => {
                const semSessions = sessionsMap[sem.id] || [];
                const activeRegsCount = registrations.filter(r => r.seminarId === sem.id && r.status === 'registered').length;
                
                return semSessions.map(session => {
                  const checkins = attendancesMap[session.id] || [];
                  const rate = activeRegsCount > 0 
                    ? Math.min(Math.round((checkins.length / activeRegsCount) * 100), 100) 
                    : 0;

                  return (
                    <div key={session.id} className="p-5 border border-neutral-100 rounded-2xl hover:border-neutral-200 hover:shadow-sm transition-all bg-neutral-50/10 space-y-2">
                      <div className="font-bold text-sm sm:text-base text-neutral-800 truncate leading-snug">{session.title}</div>
                      <div className="text-xs text-neutral-450 mt-0.5 font-medium">Speaker: {session.speakerName}</div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-xs text-neutral-500 font-bold">
                          Checked-in: <strong className="text-neutral-750 font-extrabold">{checkins.length}</strong> / {activeRegsCount}
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          rate >= 80 ? 'bg-emerald-50 text-emerald-700' : rate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                        }`}>
                          {rate}% attended
                        </span>
                      </div>
                    </div>
                  );
                });
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
