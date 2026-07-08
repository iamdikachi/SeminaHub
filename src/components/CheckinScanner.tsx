import React, { useState, useEffect, useRef } from 'react';
import { Seminar, Session, Registration, Attendance } from '../types';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, Keyboard, CheckCircle2, AlertCircle, ArrowRight, Loader2, StopCircle } from 'lucide-react';

interface CheckinScannerProps {
  seminars: Seminar[];
  sessionsMap: Record<string, Session[]>;
  onCheckIn: (seminarId: string, sessionId: string, code: string) => Promise<{ success: boolean; message: string; attendeeName?: string }>;
}

export const CheckinScanner: React.FC<CheckinScannerProps> = ({
  seminars,
  sessionsMap,
  onCheckIn
}) => {
  const [selectedSeminarId, setSelectedSeminarId] = useState<string>('');
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  
  // Input methods
  const [useCamera, setUseCamera] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState<string>('');
  
  // Status states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; attendeeName?: string } | null>(null);

  // HTML5 Qrcode references
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Available sessions for selected seminar
  const availableSessions = useMemoSessions();

  function useMemoSessions() {
    return React.useMemo(() => {
      if (!selectedSeminarId) return [];
      return sessionsMap[selectedSeminarId] || [];
    }, [selectedSeminarId, sessionsMap]);
  }

  // Pre-select seminar and session if they change
  useEffect(() => {
    if (seminars.length > 0 && !selectedSeminarId) {
      setSelectedSeminarId(seminars[0].id);
    }
  }, [seminars, selectedSeminarId]);

  useEffect(() => {
    if (availableSessions.length > 0) {
      setSelectedSessionId(availableSessions[0].id);
    } else {
      setSelectedSessionId('');
    }
  }, [availableSessions]);

  // Handle active camera scanning
  useEffect(() => {
    if (useCamera && selectedSessionId && selectedSeminarId) {
      // Small timeout to let element render
      const timer = setTimeout(() => {
        try {
          const scanner = new Html5QrcodeScanner(
            "qr-reader-view",
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              rememberLastUsedCamera: true
            },
            /* verbose= */ false
          );

          scanner.render(
            async (decodedText) => {
              // Successfully decoded code
              scanner.clear();
              setUseCamera(false);
              await triggerCheckIn(decodedText);
            },
            (errorMessage) => {
              // Log error silently to avoid spam
            }
          );

          qrScannerRef.current = scanner;
        } catch (err) {
          console.error("Html5QrcodeScanner failed to start", err);
        }
      }, 200);

      return () => {
        clearTimeout(timer);
        if (qrScannerRef.current) {
          qrScannerRef.current.clear().catch(e => console.error("Scanner clean error", e));
          qrScannerRef.current = null;
        }
      };
    }
  }, [useCamera, selectedSessionId, selectedSeminarId]);

  const triggerCheckIn = async (codeToSubmit: string) => {
    if (!selectedSeminarId || !selectedSessionId || !codeToSubmit.trim()) return;
    
    setIsProcessing(true);
    setScanResult(null);
    try {
      const result = await onCheckIn(selectedSeminarId, selectedSessionId, codeToSubmit.trim());
      setScanResult(result);
      if (result.success) {
        setManualCode('');
      }
    } catch (err) {
      setScanResult({
        success: false,
        message: err instanceof Error ? err.message : 'An error occurred during check-in.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerCheckIn(manualCode);
  };

  const handleStopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.clear().then(() => {
        setUseCamera(false);
      }).catch(err => {
        console.error(err);
        setUseCamera(false);
      });
    } else {
      setUseCamera(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-6">
      <div>
        <h2 className="font-display font-bold text-xl text-neutral-800 flex items-center gap-2.5">
          <QrCode className="w-6.5 h-6.5 text-indigo-600" />
          Real-time Attendance Gate
        </h2>
        <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed">
          Scan registration tickets via camera or input codes manually to mark check-ins.
        </p>
      </div>

      {/* Select active seminar & session */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-neutral-50/50 p-5 rounded-xl border border-neutral-100">
        <div>
          <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">1. Select Seminar</label>
          <select
            value={selectedSeminarId}
            onChange={(e) => setSelectedSeminarId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white text-sm font-semibold text-neutral-700"
          >
            {seminars.length === 0 ? (
              <option value="">No published seminars</option>
            ) : (
              seminars.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-600 uppercase tracking-wider mb-2">2. Select Active Session</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            disabled={availableSessions.length === 0}
            className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-white text-sm font-semibold text-neutral-700 disabled:bg-neutral-100 disabled:opacity-50"
          >
            {availableSessions.length === 0 ? (
              <option value="">-- No sessions created --</option>
            ) : (
              availableSessions.map(s => (
                <option key={s.id} value={s.id}>{s.title} ({s.speakerName})</option>
              ))
            )}
          </select>
        </div>
      </div>

      {availableSessions.length === 0 ? (
        <div className="text-center py-8 text-neutral-450 text-sm border border-dashed border-neutral-200 rounded-2xl">
          Please select a seminar with sessions before scanning check-ins.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scan result notifier */}
          {scanResult && (
            <div className={`p-5 rounded-xl border flex items-start gap-4 transition-all duration-300 ${
              scanResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {scanResult.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-bold text-base">
                  {scanResult.success ? 'Attendance Registered!' : 'Check-In Failed'}
                </h4>
                <p className="text-sm mt-1.5 font-semibold">{scanResult.message}</p>
                {scanResult.attendeeName && (
                  <p className="text-xs mt-2 opacity-90">
                    Attendee: <strong className="font-extrabold">{scanResult.attendeeName}</strong>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Toggle scan method */}
          <div className="flex justify-center border-b border-neutral-150 pb-1">
            <button
              onClick={() => { setUseCamera(false); setScanResult(null); }}
              className={`pb-3 px-5 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                !useCamera ? 'border-sky-500 text-sky-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Keyboard className="w-4.5 h-4.5" />
              Manual Code Entry
            </button>
            <button
              onClick={() => { setUseCamera(true); setScanResult(null); }}
              className={`pb-3 px-5 text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${
                useCamera ? 'border-sky-500 text-sky-600' : 'border-transparent text-neutral-400 hover:text-neutral-600'
              }`}
            >
              <Camera className="w-4.5 h-4.5" />
              Live Camera Scan
            </button>
          </div>

          {/* Rendering active tool view */}
          {useCamera ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-950 p-2 shadow-inner relative">
                {/* Visual Camera Guide */}
                <div id="qr-reader-view" className="w-full overflow-hidden" />
              </div>
              <button
                onClick={handleStopScanning}
                className="inline-flex items-center gap-2 text-sm font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-600 px-5 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                <StopCircle className="w-4.5 h-4.5 text-red-500" />
                Stop Camera Stream
              </button>
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="max-w-md mx-auto space-y-4 py-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2.5 text-center">
                  Enter Ticket Registration Code
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    required
                    placeholder="e.g., REG-8FA1B2"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    className="flex-1 px-4 py-3 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-colors text-sm sm:text-base uppercase font-mono tracking-wider text-center"
                  />
                  <button
                    type="submit"
                    disabled={isProcessing || !manualCode.trim()}
                    className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all disabled:opacity-50 inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <>
                        Check In
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
