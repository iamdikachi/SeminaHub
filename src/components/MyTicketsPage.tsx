import React, { useState, useEffect, useRef } from 'react';
import { Ticket, Calendar, MapPin, Clock, QrCode, XCircle, AlertTriangle, CheckSquare } from 'lucide-react';
import { Registration, Seminar, Session, Attendance } from '../types';
import QRCode from 'qrcode';

interface MyTicketsPageProps {
  user: { uid: string; email?: string | null } | null;
  registrations: Registration[];
  seminars: Seminar[];
  sessionsMap: Record<string, Session[]>;
  attendancesMap: Record<string, Attendance[]>;
  onCancelRegistration: (reg: Registration) => Promise<void>;
  isSubmitting: boolean;
  onViewSeminarDetails: (seminarId: string) => void;
}

export const MyTicketsPage: React.FC<MyTicketsPageProps> = ({
  user,
  registrations,
  seminars,
  sessionsMap,
  attendancesMap,
  onCancelRegistration,
  isSubmitting,
  onViewSeminarDetails
}) => {
  const [selectedRegId, setSelectedRegId] = useState<string | null>(null);

  const myRegistrations = registrations.filter(
    r => r.userId === user?.uid && r.status !== 'cancelled'
  );

  // Auto-select first registration if nothing is selected yet
  useEffect(() => {
    if (myRegistrations.length > 0 && !selectedRegId) {
      setSelectedRegId(myRegistrations[0].id);
    }
  }, [myRegistrations, selectedRegId]);

  const activeReg = myRegistrations.find(r => r.id === selectedRegId) || myRegistrations[0];
  const activeSeminar = activeReg 
    ? seminars.find(s => s.id === activeReg.seminarId) 
    : null;
  const activeSessions = activeSeminar 
    ? sessionsMap[activeSeminar.id] || [] 
    : [];

  // Check if there are checkins for this user in active sessions
  const checkinCount = activeSessions.reduce((count, session) => {
    const sessionCheckins = attendancesMap[session.id] || [];
    const hasUserCheckedIn = sessionCheckins.some(a => a.userId === user?.uid);
    return count + (hasUserCheckedIn ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-neutral-800 flex items-center gap-2.5">
          <Ticket className="w-6 h-6 text-indigo-600" />
          My Registrations & Ticket Wallet
        </h2>
        <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed font-semibold">
          Access your digital admission passes, monitor waitlists, and review your session check-in logs.
        </p>
      </div>

      {myRegistrations.length === 0 ? (
        <div className="text-center py-20 bg-white border border-neutral-100/80 rounded-2xl shadow-xl shadow-neutral-100/50 space-y-4">
          <div className="w-14 h-14 rounded-full bg-neutral-50 flex items-center justify-center mx-auto text-neutral-400">
            <Ticket className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-base text-neutral-800">No Registrations Found</h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto leading-relaxed">
              You haven't registered for any seminars yet. Go to the Browse Seminars page to book your slot!
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Side: List of Registrations (5 columns) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-bold text-xs sm:text-sm text-neutral-450 uppercase tracking-widest px-1">
              Registered Events ({myRegistrations.length})
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {myRegistrations.map(reg => {
                const sem = seminars.find(s => s.id === reg.seminarId);
                const isSelected = reg.id === activeReg?.id;
                
                return (
                  <div
                    key={reg.id}
                    onClick={() => setSelectedRegId(reg.id)}
                    className={`p-6 rounded-2xl border transition-all cursor-pointer text-left space-y-4 ${
                      isSelected
                        ? 'bg-indigo-50/30 border-indigo-200 ring-2 ring-indigo-500/10'
                        : 'bg-white border-neutral-100/80 shadow-sm hover:shadow-md hover:border-neutral-200'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                        reg.status === 'registered' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {reg.status}
                      </span>
                      
                      {sem && (
                        <span className="text-xs text-neutral-400 font-bold uppercase">
                          {sem.category}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-bold text-base text-neutral-850 line-clamp-1">
                        {reg.seminarTitle}
                      </h4>
                      {sem && (
                        <div className="flex items-center gap-1.5 text-xs text-neutral-500">
                          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{new Date(sem.startDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-400 font-mono border-t border-neutral-100/60 pt-2.5">
                      <span>Code: {reg.code}</span>
                      <span className="text-indigo-600 font-bold hover:underline">
                        View Ticket →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Side: Active Ticket Wallet Details (7 columns) */}
          <div className="lg:col-span-7">
            {activeReg && (
              <div className="bg-white rounded-3xl border border-neutral-100/80 p-8 shadow-2xl shadow-neutral-100/50 space-y-6">
                {/* Visual Digital Ticket */}
                <div className="relative border-none rounded-3xl overflow-hidden shadow-xl bg-gradient-to-br from-indigo-900 via-slate-900 to-neutral-900 text-white">
                  {/* Decorative circle cuts */}
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-r border-neutral-200 z-10 hidden sm:block" />
                  <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-l border-neutral-200 z-10 hidden sm:block" />
                  
                  {/* Ticket Header */}
                  <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-indigo-400 uppercase tracking-widest">
                        Seminar Admission Ticket
                      </span>
                      <div className="text-lg font-extrabold tracking-tight">SeminarHub</div>
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      activeReg.status === 'registered' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {activeReg.status}
                    </span>
                  </div>

                  {/* Ticket Body Layout */}
                  <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                    {/* QR Code Container */}
                    <div className="sm:col-span-1 flex flex-col items-center justify-center space-y-2.5">
                      <QrCodeRenderer code={activeReg.code} />
                      <span className="text-xs font-mono font-bold tracking-wider text-neutral-300">
                        {activeReg.code}
                      </span>
                    </div>

                    {/* Information Grid */}
                    <div className="sm:col-span-2 space-y-4">
                      <div className="space-y-1">
                        <span className="text-xs uppercase font-extrabold text-indigo-300 tracking-wider">
                          Seminar Topic
                        </span>
                        <h3 className="font-display font-bold text-base sm:text-lg leading-snug line-clamp-2">
                          {activeReg.seminarTitle}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-0.5">
                          <span className="text-neutral-400 font-semibold block uppercase text-[10px]">DATE & TIME</span>
                          <span className="font-bold text-neutral-200">
                            {activeSeminar 
                              ? new Date(activeSeminar.startDate).toLocaleDateString()
                              : 'TBD'}
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-neutral-400 font-semibold block uppercase text-[10px]">VENUE</span>
                          <span className="font-bold text-neutral-200 truncate block">
                            {activeSeminar ? activeSeminar.venue : 'TBD'}
                          </span>
                        </div>
                        <div className="space-y-0.5 col-span-2">
                          <span className="text-neutral-400 font-semibold block uppercase text-[10px]">ATTENDEE</span>
                          <span className="font-bold text-neutral-100 uppercase">
                            {activeReg.userName} ({activeReg.userEmail})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Stats and Schedule Agenda for this seminar */}
                {activeSeminar && (
                  <div className="space-y-5 pt-2">
                    <h4 className="font-extrabold text-xs sm:text-sm text-neutral-450 uppercase tracking-widest">
                      Event Agenda & Verification
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Booking Info Box */}
                      <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                        <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Booking Age</div>
                        <div className="text-sm sm:text-base text-neutral-750 font-bold">
                          Registered on {new Date(activeReg.createdAt).toLocaleDateString()}
                        </div>
                        <p className="text-xs text-neutral-500 leading-normal font-medium">
                          This reservation binds 1 seat for you. Please check in on-time.
                        </p>
                      </div>

                      {/* Check-In Progress Box */}
                      <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                        <div className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Check-In Status</div>
                        <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-neutral-750">
                          <CheckSquare className="w-5 h-5 text-indigo-600" />
                          <span>
                            {checkinCount} / {activeSessions.length} Sessions Checked In
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 leading-normal font-medium">
                          Ask event supervisors to scan your QR code at the entrance of individual sessions.
                        </p>
                      </div>
                    </div>

                    {/* Quick navigation or Cancellation */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-3">
                      <button
                        onClick={() => onViewSeminarDetails(activeSeminar.id)}
                        className="flex-1 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-2xl text-sm font-bold transition-all cursor-pointer"
                      >
                        View Full Seminar Page
                      </button>
                      <button
                        onClick={() => onCancelRegistration(activeReg)}
                        disabled={isSubmitting}
                        className="flex-1 py-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-2xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Cancel Registration Pass
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Internal sub-component to render the canvas based QR code
interface QrCodeRendererProps {
  code: string;
}

const QrCodeRenderer: React.FC<QrCodeRendererProps> = ({ code }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && code) {
      QRCode.toCanvas(
        canvasRef.current,
        code,
        {
          width: 130,
          margin: 1,
          color: {
            dark: '#0f172a', // deep charcoal slate
            light: '#ffffff'
          }
        },
        (err) => {
          if (err) console.error("QR rendering failed in Tickets page", err);
        }
      );
    }
  }, [code]);

  return (
    <div className="p-1.5 bg-white rounded-xl border border-white/20 shadow-sm shrink-0">
      <canvas ref={canvasRef} className="rounded-lg w-28 h-28" />
    </div>
  );
};
