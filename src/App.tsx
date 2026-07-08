import React, { useState, useEffect, useRef } from 'react';
import { 
  db, 
  auth, 
  handleFirestoreError 
} from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  writeBatch,
  increment,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  UserProfile, 
  Seminar, 
  Session, 
  Registration, 
  Attendance, 
  UserRole, 
  OperationType 
} from './types';
import { RoleSwitcher } from './components/RoleSwitcher';
import { SeminarForm } from './components/SeminarForm';
import { CheckinScanner } from './components/CheckinScanner';
import { ReportDashboard } from './components/ReportDashboard';
import { MyTicketsPage } from './components/MyTicketsPage';
import { PlannerCalendarPage } from './components/PlannerCalendarPage';
import { ProfileBadgePage } from './components/ProfileBadgePage';
import { OrganizerPage } from './components/OrganizerPage';
import { AuthModal } from './components/AuthModal';
import { DeleteSeminarModal } from './components/DeleteSeminarModal';
import QRCode from 'qrcode';
import {
  INITIAL_MOCK_SEMINARS,
  INITIAL_MOCK_REGISTRATIONS,
  INITIAL_MOCK_SESSIONS,
  INITIAL_MOCK_ATTENDANCES,
  getLocalMockData,
  saveLocalMockData,
  clearLocalMockData
} from './mockData';
import { 
  Calendar, 
  Users, 
  MapPin, 
  Tag, 
  Check, 
  Clock, 
  QrCode, 
  Search, 
  Sparkles, 
  Shield, 
  User, 
  LogOut, 
  LogIn,
  ChevronRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Loader2, 
  Info, 
  Ticket, 
  CheckSquare, 
  AlertTriangle,
  X,
  XCircle,
  HelpCircle,
  ChevronDown,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

// STYLIZED CATEGORY GRAPHICS & DESIGN SCHEMES
const getCategoryVisuals = (category: string) => {
  switch (category) {
    case 'Technology':
      return {
        gradient: 'from-slate-900 via-indigo-950 to-indigo-900',
        textColor: 'text-indigo-200',
        badgeBg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
        glowColor: 'shadow-indigo-500/10',
        pattern: (
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="tech-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="#fff" />
                <path d="M20 0H0V20" fill="none" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tech-pattern)" />
          </svg>
        )
      };
    case 'Business & Finance':
      return {
        gradient: 'from-slate-900 via-emerald-950 to-emerald-900',
        textColor: 'text-emerald-200',
        badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
        glowColor: 'shadow-emerald-500/10',
        pattern: (
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="biz-pattern" width="16" height="16" patternUnits="userSpaceOnUse">
                <path d="M16 0L0 16" stroke="#fff" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#biz-pattern)" />
          </svg>
        )
      };
    case 'Health & Science':
      return {
        gradient: 'from-slate-900 via-rose-950 to-rose-900',
        textColor: 'text-rose-200',
        badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
        glowColor: 'shadow-rose-500/10',
        pattern: (
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="health-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="12" cy="12" r="6" fill="none" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#health-pattern)" />
          </svg>
        )
      };
    case 'Art & Design':
      return {
        gradient: 'from-slate-900 via-purple-950 to-fuchsia-900',
        textColor: 'text-purple-200',
        badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
        glowColor: 'shadow-purple-500/10',
        pattern: (
          <svg className="absolute inset-0 w-full h-full opacity-15" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="art-pattern" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M0 10 Q 7.5 5, 15 10 T 30 10" fill="none" stroke="#fff" strokeWidth="0.5" />
                <path d="M0 20 Q 7.5 15, 15 20 T 30 20" fill="none" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#art-pattern)" />
          </svg>
        )
      };
    case 'Personal Development':
      return {
        gradient: 'from-slate-900 via-amber-950 to-amber-900',
        textColor: 'text-amber-200',
        badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
        glowColor: 'shadow-amber-500/10',
        pattern: (
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pd-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="none" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pd-pattern)" />
          </svg>
        )
      };
    default:
      return {
        gradient: 'from-slate-900 via-neutral-900 to-neutral-800',
        textColor: 'text-neutral-300',
        badgeBg: 'bg-neutral-500/15 text-neutral-300 border-neutral-500/20',
        glowColor: 'shadow-neutral-500/10',
        pattern: (
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="other-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="10" y2="10" stroke="#fff" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#other-pattern)" />
          </svg>
        )
      };
  }
};

export default function App() {
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    return localStorage.getItem('seminar_demo_mode') === 'true';
  });

  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('Attendee');
  
  // Data State
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [sessionsMap, setSessionsMap] = useState<Record<string, Session[]>>({});
  const [attendancesMap, setAttendancesMap] = useState<Record<string, Attendance[]>>({}); // Key: sessionId
  
  // App navigation / viewing states
  const [activeTab, setActiveTab] = useState<string>('browse');
  const [viewingSeminarId, setViewingSeminarId] = useState<string | null>(null);
  const [isCreatingSeminar, setIsCreatingSeminar] = useState<boolean>(false);
  const [editingSeminar, setEditingSeminar] = useState<Seminar | null>(null);
  const [deletingSeminarId, setDeletingSeminarId] = useState<string | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // UI states
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);

  // Auto-clear feedback alerts
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Handle Firebase Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (isDemoMode) {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          // Try to fetch profile from Firestore, but do not write to Firestore if it doesn't exist
          const profileRef = doc(db, 'users', firebaseUser.uid);
          try {
            const profileSnap = await getDoc(profileRef);
            if (profileSnap.exists()) {
              const data = profileSnap.data() as UserProfile;
              setUserProfile(data);
              setActiveRole(data.role);
            } else {
              const defaultRole: UserRole = firebaseUser.email === 'emmanuelnnadi097@gmail.com' 
                ? 'Admin' 
                : 'Attendee';
              const newProfile: UserProfile = {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                role: defaultRole,
                createdAt: new Date().toISOString()
              };
              setUserProfile(newProfile);
              setActiveRole(defaultRole);
            }
          } catch (error) {
            console.warn("Unable to fetch Firestore profile in Demo Mode; using fallback", error);
            const defaultRole: UserRole = firebaseUser.email === 'emmanuelnnadi097@gmail.com' ? 'Admin' : 'Attendee';
            setUserProfile({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: defaultRole,
              createdAt: new Date().toISOString()
            });
            setActiveRole(defaultRole);
          }
        } else {
          // Check if there is a simulated user in localStorage
          const demoActiveRaw = localStorage.getItem('seminar_demo_active_user');
          if (demoActiveRaw) {
            try {
              const { user: dUser, profile: dProfile } = JSON.parse(demoActiveRaw);
              setUser(dUser);
              setUserProfile(dProfile);
              setActiveRole(dProfile.role);
            } catch (e) {
              localStorage.removeItem('seminar_demo_active_user');
            }
          } else {
            const isLoggedOut = localStorage.getItem('seminar_demo_logged_out') === 'true';
            if (isLoggedOut) {
              setUser(null);
              setUserProfile(null);
              setActiveRole('Attendee');
            } else {
              // No user logged in, use the offline demo identity
              const demoUserIdentity = {
                uid: 'demo_user_123',
                displayName: 'Jane Doe (Demo)',
                email: 'janedoe@example.com',
                photoURL: null
              } as FirebaseUser;

              const demoUserProfile: UserProfile = {
                uid: 'demo_user_123',
                name: 'Jane Doe (Demo)',
                email: 'janedoe@example.com',
                role: activeRole,
                createdAt: new Date().toISOString()
              };

              setUser(demoUserIdentity);
              setUserProfile(demoUserProfile);
            }
          }
        }
        setAuthLoading(false);
        return;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Fetch or create profile in Firestore
        const profileRef = doc(db, 'users', firebaseUser.uid);
        try {
          const profileSnap = await getDoc(profileRef);
          
          if (profileSnap.exists()) {
            const data = profileSnap.data() as UserProfile;
            setUserProfile(data);
            setActiveRole(data.role);
          } else {
            // Default role mapping: Check if they are the special owner email
            const defaultRole: UserRole = firebaseUser.email === 'emmanuelnnadi097@gmail.com' 
              ? 'Admin' 
              : 'Attendee';
              
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: defaultRole,
              createdAt: new Date().toISOString()
            };
            
            await setDoc(profileRef, newProfile);
            setUserProfile(newProfile);
            setActiveRole(defaultRole);
          }
        } catch (error) {
          console.error("Error managing user profile", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setActiveRole('Attendee'); // Public attendee state
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode]);

  // Handle Demo Mode synchronization & initial state loading
  useEffect(() => {
    if (isDemoMode) {
      const sems = getLocalMockData<Seminar[]>('seminars', INITIAL_MOCK_SEMINARS);
      const regs = getLocalMockData<Registration[]>('registrations', INITIAL_MOCK_REGISTRATIONS);
      const sess = getLocalMockData<Record<string, Session[]>>('sessions', INITIAL_MOCK_SESSIONS);
      const atts = getLocalMockData<Record<string, Attendance[]>>('attendances', INITIAL_MOCK_ATTENDANCES);

      setSeminars(sems);
      setRegistrations(regs);
      setSessionsMap(sess);
      setAttendancesMap(atts);

      // Pre-fill demo user identity if no actual Firebase user is logged in
      if (!auth.currentUser) {
        const demoActiveRaw = localStorage.getItem('seminar_demo_active_user');
        if (demoActiveRaw) {
          try {
            const { user: dUser, profile: dProfile } = JSON.parse(demoActiveRaw);
            setUser(dUser);
            setUserProfile(dProfile);
            setActiveRole(dProfile.role);
          } catch (e) {
            localStorage.removeItem('seminar_demo_active_user');
          }
        } else {
          const isLoggedOut = localStorage.getItem('seminar_demo_logged_out') === 'true';
          if (isLoggedOut) {
            setUser(null);
            setUserProfile(null);
            setActiveRole('Attendee');
          } else {
            const demoUserIdentity = {
              uid: 'demo_user_123',
              displayName: 'Jane Doe (Demo)',
              email: 'janedoe@example.com',
              photoURL: null
            } as FirebaseUser;

            const demoUserProfile: UserProfile = {
              uid: 'demo_user_123',
              name: 'Jane Doe (Demo)',
              email: 'janedoe@example.com',
              role: activeRole,
              createdAt: new Date().toISOString()
            };

            setUser(demoUserIdentity);
            setUserProfile(demoUserProfile);
          }
        }
      }
      setAuthLoading(false);
    } else {
      // Return to real Firebase state or clear if no user exists
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setUser(null);
        setUserProfile(null);
        setActiveRole('Attendee');
        setSeminars([]);
        setRegistrations([]);
        setSessionsMap({});
        setAttendancesMap({});
      }
    }
  }, [isDemoMode]);

  // Tracking active subcollection listeners to prevent memory leaks and duplicate listeners
  const unsubscribeSessionsRef = useRef<Record<string, () => void>>({});
  const unsubscribeAttendancesRef = useRef<Record<string, () => void>>({});

  // Clean up all active listeners on unmount or when role changes
  useEffect(() => {
    return () => {
      Object.keys(unsubscribeSessionsRef.current).forEach(key => {
        const unsub = unsubscribeSessionsRef.current[key];
        if (unsub) {
          try { unsub(); } catch (e) { /* ignore */ }
        }
      });
      Object.keys(unsubscribeAttendancesRef.current).forEach(key => {
        const unsub = unsubscribeAttendancesRef.current[key];
        if (unsub) {
          try { unsub(); } catch (e) { /* ignore */ }
        }
      });
      unsubscribeSessionsRef.current = {};
      unsubscribeAttendancesRef.current = {};
    };
  }, []);

  // Sync Seminars in real-time
  useEffect(() => {
    if (isDemoMode) return;

    const seminarsCol = collection(db, 'seminars');
    const q = query(seminarsCol, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const seminarList: Seminar[] = [];
      snapshot.forEach(docSnap => {
        seminarList.push({ id: docSnap.id, ...docSnap.data() } as Seminar);
      });
      setSeminars(seminarList);
      
      // Load sessions and attendances for these seminars
      seminarList.forEach(sem => {
        loadSessions(sem.id);
      });
    }, (error) => {
      console.error("Error syncing seminars", error);
    });

    return () => {
      unsubscribe();
      // Also clean up all session/attendance subcollection listeners when this effect is torn down/re-run
      Object.keys(unsubscribeSessionsRef.current).forEach(key => {
        const unsub = unsubscribeSessionsRef.current[key];
        if (unsub) {
          try { unsub(); } catch (e) { /* ignore */ }
        }
      });
      Object.keys(unsubscribeAttendancesRef.current).forEach(key => {
        const unsub = unsubscribeAttendancesRef.current[key];
        if (unsub) {
          try { unsub(); } catch (e) { /* ignore */ }
        }
      });
      unsubscribeSessionsRef.current = {};
      unsubscribeAttendancesRef.current = {};
    };
  }, [activeRole, isDemoMode]);

  // Sync Registrations in real-time
  useEffect(() => {
    if (isDemoMode) return;

    const registrationsCol = collection(db, 'registrations');
    let q = query(registrationsCol, orderBy('createdAt', 'desc'));

    // Secure scoping: restrict registration sync if the user is a standard attendee
    if (user && activeRole === 'Attendee') {
      q = query(registrationsCol, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regList: Registration[] = [];
      snapshot.forEach(docSnap => {
        regList.push({ id: docSnap.id, ...docSnap.data() } as Registration);
      });
      setRegistrations(regList);
    }, (error) => {
      console.error("Error syncing registrations", error);
    });

    return () => unsubscribe();
  }, [user, activeRole, isDemoMode]);

  // Load Sessions for a specific seminar
  const loadSessions = (seminarId: string) => {
    if (isDemoMode) return;

    if (unsubscribeSessionsRef.current[seminarId]) {
      try { unsubscribeSessionsRef.current[seminarId](); } catch (e) {}
    }

    const sessionsCol = collection(db, 'seminars', seminarId, 'sessions');
    const unsub = onSnapshot(sessionsCol, (snapshot) => {
      const sessionList: Session[] = [];
      snapshot.forEach(docSnap => {
        sessionList.push({ id: docSnap.id, ...docSnap.data() } as Session);
        // Load attendances for each session ONLY if authorized (Admin/Organizer)
        if (activeRole === 'Admin' || activeRole === 'Organizer') {
          loadAttendances(seminarId, docSnap.id);
        }
      });
      setSessionsMap(prev => ({ ...prev, [seminarId]: sessionList }));
    });

    unsubscribeSessionsRef.current[seminarId] = unsub;
  };

  // Load Attendances for a specific session
  const loadAttendances = (seminarId: string, sessionId: string) => {
    if (isDemoMode) return;

    if (unsubscribeAttendancesRef.current[sessionId]) {
      try { unsubscribeAttendancesRef.current[sessionId](); } catch (e) {}
    }

    const attendancesCol = collection(db, 'seminars', seminarId, 'sessions', sessionId, 'attendances');
    const unsub = onSnapshot(attendancesCol, (snapshot) => {
      const attList: Attendance[] = [];
      snapshot.forEach(docSnap => {
        attList.push({ id: docSnap.id, ...docSnap.data() } as Attendance);
      });
      setAttendancesMap(prev => ({ ...prev, [sessionId]: attList }));
    }, (error) => {
      console.warn(`Silently skipped attendance syncing for session ${sessionId} due to permissions.`, error);
    });

    unsubscribeAttendancesRef.current[sessionId] = unsub;
  };

  // Google Login popup
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
      setFeedback({ success: false, message: 'Google authentication failed. Please try again.' });
    }
  };

  // Logout
  const handleSignOut = async () => {
    try {
      if (isDemoMode) {
        localStorage.removeItem('seminar_demo_active_user');
        localStorage.setItem('seminar_demo_logged_out', 'true');
        setUser(null);
        setUserProfile(null);
        setActiveRole('Attendee');
        setViewingSeminarId(null);
        setIsCreatingSeminar(false);
        setEditingSeminar(null);
        setFeedback({ success: true, message: 'Simulated Sign-Out successful.' });
        return;
      }

      await signOut(auth);
      setViewingSeminarId(null);
      setIsCreatingSeminar(false);
      setEditingSeminar(null);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Role simulation handler (Allows switching simulated roles easily)
  const handleRoleChange = async (newRole: UserRole) => {
    setActiveRole(newRole);
    if (isDemoMode) {
      setUserProfile(prev => prev ? { ...prev, role: newRole } : {
        uid: 'demo_user_123',
        name: 'Jane Doe (Demo)',
        email: 'janedoe@example.com',
        role: newRole,
        createdAt: new Date().toISOString()
      });
      return;
    }
    // Also update profile in DB for complete evaluation persistence
    if (user && userProfile) {
      const profileRef = doc(db, 'users', user.uid);
      try {
        await setDoc(profileRef, { ...userProfile, role: newRole }, { merge: true });
        setUserProfile(prev => prev ? { ...prev, role: newRole } : null);
      } catch (error) {
        console.error("Failed to sync role change to Firestore", error);
      }
    }
  };

  // --- CRUD Seminars (Admin/Organizer) ---
  const handleSaveSeminar = async (
    seminarData: Omit<Seminar, 'id' | 'organizerId' | 'registeredCount' | 'createdAt'>,
    sessionsData: Omit<Session, 'id' | 'seminarId'>[]
  ) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (isDemoMode) {
        const seminarId = editingSeminar ? editingSeminar.id : `sem_${Date.now()}`;
        const finalSeminar: Seminar = {
          ...seminarData,
          id: seminarId,
          organizerId: editingSeminar ? editingSeminar.organizerId : user.uid,
          registeredCount: editingSeminar ? editingSeminar.registeredCount : 0,
          createdAt: editingSeminar ? editingSeminar.createdAt : new Date().toISOString()
        };

        // Update seminars
        let updatedSeminars = [...seminars];
        if (editingSeminar) {
          updatedSeminars = updatedSeminars.map(s => s.id === editingSeminar.id ? finalSeminar : s);
        } else {
          updatedSeminars.unshift(finalSeminar);
        }

        // Save sessions
        const finalSessions: Session[] = sessionsData.map((sess, i) => ({
          ...sess,
          id: `sess_${seminarId}_${i}_${Date.now()}`,
          seminarId
        }));

        const updatedSessionsMap = { ...sessionsMap, [seminarId]: finalSessions };

        setSeminars(updatedSeminars);
        setSessionsMap(updatedSessionsMap);
        saveLocalMockData('seminars', updatedSeminars);
        saveLocalMockData('sessions', updatedSessionsMap);

        setFeedback({ 
          success: true, 
          message: editingSeminar ? 'Demo Seminar updated successfully!' : 'Demo Seminar created successfully!' 
        });
        setIsCreatingSeminar(false);
        setEditingSeminar(null);
        setIsSubmitting(false);
        return;
      }

      const seminarId = editingSeminar ? editingSeminar.id : `sem_${Date.now()}`;
      const seminarRef = doc(db, 'seminars', seminarId);

      const batch = writeBatch(db);

      // 1. Save Seminar
      const finalSeminar: Seminar = {
        ...seminarData,
        id: seminarId,
        organizerId: editingSeminar ? editingSeminar.organizerId : user.uid,
        registeredCount: editingSeminar ? editingSeminar.registeredCount : 0,
        createdAt: editingSeminar ? editingSeminar.createdAt : new Date().toISOString()
      };
      batch.set(seminarRef, finalSeminar);

      // For edits, we delete existing sessions and write new ones to avoid stale records
      if (editingSeminar) {
        const existingSessions = sessionsMap[editingSeminar.id] || [];
        existingSessions.forEach(sess => {
          const sessRef = doc(db, 'seminars', editingSeminar.id, 'sessions', sess.id);
          batch.delete(sessRef);
        });
      }

      // 2. Save Sessions
      sessionsData.forEach((sess, i) => {
        const sessionId = `sess_${seminarId}_${i}_${Date.now()}`;
        const sessionRef = doc(db, 'seminars', seminarId, 'sessions', sessionId);
        const finalSession: Session = {
          ...sess,
          id: sessionId,
          seminarId
        };
        batch.set(sessionRef, finalSession);
      });

      await batch.commit();

      setFeedback({ 
        success: true, 
        message: editingSeminar ? 'Seminar updated successfully!' : 'Seminar created successfully!' 
      });
      setIsCreatingSeminar(false);
      setEditingSeminar(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seminars');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSeminar = async (seminarId: string) => {
    setDeletingSeminarId(seminarId);
  };

  const executeDeleteSeminar = async () => {
    if (!deletingSeminarId) return;
    const seminarId = deletingSeminarId;
    try {
      if (isDemoMode) {
        const updatedSeminars = seminars.filter(s => s.id !== seminarId);
        const updatedSessionsMap = { ...sessionsMap };
        delete updatedSessionsMap[seminarId];

        // Clean up registrations & attendances for this seminar
        const updatedRegistrations = registrations.filter(r => r.seminarId !== seminarId);
        const updatedAttendancesMap = { ...attendancesMap };
        const sessionsToDelete = sessionsMap[seminarId] || [];
        sessionsToDelete.forEach(sess => {
          delete updatedAttendancesMap[sess.id];
        });

        setSeminars(updatedSeminars);
        setSessionsMap(updatedSessionsMap);
        setRegistrations(updatedRegistrations);
        setAttendancesMap(updatedAttendancesMap);

        saveLocalMockData('seminars', updatedSeminars);
        saveLocalMockData('sessions', updatedSessionsMap);
        saveLocalMockData('registrations', updatedRegistrations);
        saveLocalMockData('attendances', updatedAttendancesMap);

        setFeedback({ success: true, message: 'Demo Seminar deleted successfully.' });
        if (viewingSeminarId === seminarId) {
          setViewingSeminarId(null);
        }
        return;
      }

      const batch = writeBatch(db);
      
      // Delete sessions
      const sessions = sessionsMap[seminarId] || [];
      sessions.forEach(sess => {
        const sessRef = doc(db, 'seminars', seminarId, 'sessions', sess.id);
        batch.delete(sessRef);
      });

      // Delete seminar
      batch.delete(doc(db, 'seminars', seminarId));

      await batch.commit();
      setFeedback({ success: true, message: 'Seminar deleted successfully.' });
      if (viewingSeminarId === seminarId) {
        setViewingSeminarId(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `seminars/${seminarId}`);
      throw error;
    }
  };

  // --- Capacity Enforcement & Waitlist Promotion Flow ---
  const handleRegisterSeminar = async (seminar: Seminar) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isDemoMode) {
        // Double check if user is already registered to avoid duplicates
        const alreadyRegistered = registrations.some(r => r.seminarId === seminar.id && r.userId === user.uid && r.status !== 'cancelled');
        if (alreadyRegistered) {
          setFeedback({ success: false, message: 'You are already registered for this seminar.' });
          setIsSubmitting(false);
          return;
        }

        // Check capacity utilization
        const activeRegsForSeminar = registrations.filter(r => r.seminarId === seminar.id && r.status === 'registered').length;
        const isFull = activeRegsForSeminar >= seminar.capacity;

        const registrationId = `reg_${user.uid}_${seminar.id}_${Date.now()}`;
        const newReg: Registration = {
          id: registrationId,
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'Attendee',
          userEmail: user.email || '',
          seminarId: seminar.id,
          seminarTitle: seminar.title,
          code: `REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          status: isFull ? 'waitlisted' : 'registered',
          createdAt: new Date().toISOString(),
          organizerId: seminar.organizerId
        };

        const updatedRegistrations = [newReg, ...registrations];
        
        let updatedSeminars = [...seminars];
        if (!isFull) {
          updatedSeminars = seminars.map(s => s.id === seminar.id ? { ...s, registeredCount: (s.registeredCount || 0) + 1 } : s);
        }

        setRegistrations(updatedRegistrations);
        setSeminars(updatedSeminars);

        saveLocalMockData('registrations', updatedRegistrations);
        saveLocalMockData('seminars', updatedSeminars);

        setFeedback({ 
          success: true, 
          message: isFull 
            ? 'Seminar is currently full. You have been added to the waitlist!' 
            : 'Registration successful! Your ticket code is ready.' 
        });
        setIsSubmitting(false);
        return;
      }

      // 1. Fetch live seminar state directly from DB to prevent concurrent booking race conditions
      const semRef = doc(db, 'seminars', seminar.id);
      const semSnap = await getDoc(semRef);
      if (!semSnap.exists()) throw new Error("Seminar not found.");
      
      const liveSeminar = semSnap.data() as Seminar;

      // 2. Double check if user is already registered to avoid duplicates
      const alreadyRegistered = registrations.some(r => r.seminarId === seminar.id && r.userId === user.uid && r.status !== 'cancelled');
      if (alreadyRegistered) {
        setFeedback({ success: false, message: 'You are already registered for this seminar.' });
        return;
      }

      // 3. Check capacity utilization
      const activeRegsForSeminar = registrations.filter(r => r.seminarId === seminar.id && r.status === 'registered').length;
      const isFull = activeRegsForSeminar >= liveSeminar.capacity;

      const registrationId = `reg_${user.uid}_${seminar.id}_${Date.now()}`;
      const regRef = doc(db, 'registrations', registrationId);

      const batch = writeBatch(db);

      const newReg: Registration = {
        id: registrationId,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Attendee',
        userEmail: user.email || '',
        seminarId: seminar.id,
        seminarTitle: seminar.title,
        code: `REG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        status: isFull ? 'waitlisted' : 'registered',
        createdAt: new Date().toISOString(),
        organizerId: seminar.organizerId
      };

      batch.set(regRef, newReg);

      // Increment seminar count if registered successfully
      if (!isFull) {
        batch.update(semRef, { registeredCount: increment(1) });
      }

      await batch.commit();

      setFeedback({ 
        success: true, 
        message: isFull 
          ? 'Seminar is currently full. You have been added to the waitlist!' 
          : 'Registration successful! Your ticket code is ready.' 
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'registrations');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRegistration = async (reg: Registration) => {
    if (!window.confirm("Are you sure you want to cancel your registration?")) return;
    setIsSubmitting(true);
    try {
      if (isDemoMode) {
        let updatedRegistrations = registrations.map(r => r.id === reg.id ? { ...r, status: 'cancelled' as const } : r);
        let updatedSeminars = [...seminars];

        if (reg.status === 'registered') {
          // Decrement registered count
          updatedSeminars = seminars.map(s => s.id === reg.seminarId ? { ...s, registeredCount: Math.max(0, (s.registeredCount || 1) - 1) } : s);

          // Find oldest waitlisted user for this seminar
          const waitlistedUsers = updatedRegistrations
            .filter(r => r.seminarId === reg.seminarId && r.status === 'waitlisted')
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

          if (waitlistedUsers.length > 0) {
            const oldestWaitlist = waitlistedUsers[0];
            // Promote oldest waitlist
            updatedRegistrations = updatedRegistrations.map(r => r.id === oldestWaitlist.id ? { ...r, status: 'registered' as const } : r);
            // Re-increment registeredCount
            updatedSeminars = updatedSeminars.map(s => s.id === reg.seminarId ? { ...s, registeredCount: (s.registeredCount || 0) + 1 } : s);

            setFeedback({ 
              success: true, 
              message: `Registration cancelled. Waitlisted attendee "${oldestWaitlist.userName}" has been promoted to a secure seat!` 
            });
          } else {
            setFeedback({ success: true, message: 'Registration cancelled successfully.' });
          }
        } else {
          setFeedback({ success: true, message: 'Waitlist entry cancelled successfully.' });
        }

        setRegistrations(updatedRegistrations);
        setSeminars(updatedSeminars);

        saveLocalMockData('registrations', updatedRegistrations);
        saveLocalMockData('seminars', updatedSeminars);
        setIsSubmitting(false);
        return;
      }

      const regRef = doc(db, 'registrations', reg.id);
      const semRef = doc(db, 'seminars', reg.seminarId);

      const batch = writeBatch(db);

      // 1. Cancel active registration
      batch.update(regRef, { status: 'cancelled' });

      // 2. If it was active registered (not waitlisted), decrement seminar and promote the oldest waitlisted user
      if (reg.status === 'registered') {
        batch.update(semRef, { registeredCount: increment(-1) });

        // Query the oldest waitlisted user
        const regsCol = collection(db, 'registrations');
        const q = query(
          regsCol, 
          where('seminarId', '==', reg.seminarId), 
          where('status', '==', 'waitlisted'), 
          orderBy('createdAt', 'asc'), 
          limit(1)
        );
        const waitlistSnap = await getDocs(q);

        if (!waitlistSnap.empty) {
          const oldestWaitlistDoc = waitlistSnap.docs[0];
          const oldestWaitlistData = oldestWaitlistDoc.data() as Registration;
          
          // Promote to registered
          batch.update(oldestWaitlistDoc.ref, { status: 'registered' });
          // Increment seminar count back
          batch.update(semRef, { registeredCount: increment(1) });

          setFeedback({ 
            success: true, 
            message: `Registration cancelled. Waitlisted attendee "${oldestWaitlistData.userName}" has been promoted to a secure seat!` 
          });
        } else {
          setFeedback({ success: true, message: 'Registration cancelled successfully.' });
        }
      } else {
        setFeedback({ success: true, message: 'Waitlist entry cancelled successfully.' });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `registrations/${reg.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Live Attendance Check-In (Admin/Organizer) ---
  const handleSessionCheckIn = async (seminarId: string, sessionId: string, code: string) => {
    try {
      if (isDemoMode) {
        // Find registration by ticket code
        const reg = registrations.find(r => r.seminarId === seminarId && r.code.toUpperCase() === code.trim().toUpperCase());

        if (!reg) {
          return { success: false, message: `No active registration ticket found with code "${code}".` };
        }

        if (reg.status === 'cancelled') {
          return { success: false, message: `Ticket is cancelled.` };
        }
        if (reg.status === 'waitlisted') {
          return { success: false, message: `Attendee is waitlisted and does not have a secure seat for check-in.` };
        }

        // Check if already checked in for this session
        const sessionAtts = attendancesMap[sessionId] || [];
        const alreadyCheckedIn = sessionAtts.some(att => att.registrationId === reg.id);

        if (alreadyCheckedIn) {
          return { 
            success: false, 
            message: `Attendee is already checked into this session.`, 
            attendeeName: reg.userName 
          };
        }

        // Register Attendance Log
        const attendanceId = `att_${reg.id}_${sessionId}_${Date.now()}`;
        const newAttendance: Attendance = {
          id: attendanceId,
          registrationId: reg.id,
          sessionId,
          seminarId,
          checkedInAt: new Date().toISOString()
        };

        const updatedSessionAtts = [...sessionAtts, newAttendance];
        const updatedAttendancesMap = { ...attendancesMap, [sessionId]: updatedSessionAtts };

        setAttendancesMap(updatedAttendancesMap);
        saveLocalMockData('attendances', updatedAttendancesMap);

        return { 
          success: true, 
          message: `Checked in successfully!`, 
          attendeeName: reg.userName 
        };
      }

      // Find registration by ticket code
      const regsCol = collection(db, 'registrations');
      const q = query(regsCol, where('seminarId', '==', seminarId), where('code', '==', code.toUpperCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        return { success: false, message: `No active registration ticket found with code "${code}".` };
      }

      const regDoc = snap.docs[0];
      const reg = regDoc.data() as Registration;

      if (reg.status === 'cancelled') {
        return { success: false, message: `Ticket is cancelled.` };
      }
      if (reg.status === 'waitlisted') {
        return { success: false, message: `Attendee is waitlisted and does not have a secure seat for check-in.` };
      }

      // Check if already checked in for this session
      const attCol = collection(db, 'seminars', seminarId, 'sessions', sessionId, 'attendances');
      const attSnap = await getDocs(query(attCol, where('registrationId', '==', reg.id)));

      if (!attSnap.empty) {
        return { 
          success: false, 
          message: `Attendee is already checked into this session.`, 
          attendeeName: reg.userName 
        };
      }

      // Register Attendance Log
      const attendanceId = `att_${reg.id}_${sessionId}_${Date.now()}`;
      const attRef = doc(db, 'seminars', seminarId, 'sessions', sessionId, 'attendances', attendanceId);
      
      const newAttendance: Attendance = {
        id: attendanceId,
        registrationId: reg.id,
        sessionId,
        seminarId,
        checkedInAt: new Date().toISOString()
      };

      await setDoc(attRef, newAttendance);

      return { 
        success: true, 
        message: `Checked in successfully!`, 
        attendeeName: reg.userName 
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `seminars/${seminarId}/sessions/${sessionId}/attendances`);
      return { success: false, message: 'An internal error occurred while registering check-in.' };
    }
  };

  // Filter Seminars based on selected Category and Search query
  const filteredSeminars = seminars.filter(sem => {
    const categoryMatches = selectedCategory === 'All' || sem.category === selectedCategory;
    const searchMatches = sem.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          sem.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sem.venue.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Standard attendees can only browse Published or Closed seminars
    const visibleToAttendee = sem.status === 'Published' || sem.status === 'Closed';
    const isAuthorizedOrganizer = sem.organizerId === user?.uid;
    
    if (activeRole === 'Attendee') {
      return categoryMatches && searchMatches && visibleToAttendee;
    } else if (activeRole === 'Organizer') {
      return categoryMatches && searchMatches && (visibleToAttendee || isAuthorizedOrganizer);
    }
    
    return categoryMatches && searchMatches; // Admin sees everything
  });

  // Active seminar being viewed in details panel
  const activeSeminar = seminars.find(s => s.id === viewingSeminarId);
  const activeSeminarSessions = viewingSeminarId ? (sessionsMap[viewingSeminarId] || []) : [];
  const userActiveTicket = activeSeminar ? registrations.find(r => r.seminarId === activeSeminar.id && r.userId === user?.uid && r.status !== 'cancelled') : null;

  return (
    <div className="min-h-screen bg-neutral-50/50 flex flex-col font-sans">
      
      {/* 1. APP HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-neutral-100 shadow-sm bg-opacity-95 backdrop-blur-md">
        <div className="max-w-[1580px] mx-auto px-6 sm:px-8 lg:px-12 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5 cursor-pointer" onClick={() => { setViewingSeminarId(null); setIsCreatingSeminar(false); setEditingSeminar(null); }}>
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow shadow-indigo-600/20">
              <Calendar className="w-6.5 h-6.5" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-lg sm:text-xl tracking-tight text-neutral-900">SeminarHub</h1>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest block mt-0.5">Registration & Tracking</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Demo Mode Toggle Button */}
            <button
              onClick={() => {
                const nextMode = !isDemoMode;
                setIsDemoMode(nextMode);
                localStorage.setItem('seminar_demo_mode', String(nextMode));
                if (nextMode) {
                  localStorage.removeItem('seminar_demo_logged_out');
                }
                setFeedback({
                  success: true,
                  message: nextMode 
                    ? 'Switched to Demo Mode (using offline mock data). Enjoy interactive testing!' 
                    : 'Switched to Live Mode (connected to Firestore database).'
                });
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isDemoMode 
                  ? 'bg-amber-50 text-amber-800 border-amber-200 shadow-sm shadow-amber-100' 
                  : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{isDemoMode ? 'Demo: Active' : 'Use Demo Mode'}</span>
            </button>
            {authLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2.5 p-2 pr-4 hover:bg-neutral-50 border border-neutral-100 rounded-2xl transition-all cursor-pointer text-left focus:outline-none"
                  id="user-menu-button"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-xl border border-neutral-200 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 border border-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-indigo-500/20">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col">
                    <span className="font-extrabold text-sm text-neutral-850 leading-none">{user.displayName || 'Authorized User'}</span>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mt-1">{activeRole}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-neutral-100/80 shadow-2xl shadow-neutral-200/50 z-50 py-3 divide-y divide-neutral-100 text-left">
                      <div className="px-4 py-2.5">
                        <p className="text-sm font-bold text-neutral-850 truncate">{user.displayName || 'Authorized User'}</p>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">{user.email}</p>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={() => { setActiveTab('profile'); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-700 hover:bg-neutral-50 text-sm font-semibold cursor-pointer text-left"
                        >
                          <User className="w-4.5 h-4.5 text-neutral-400" />
                          <span>My ID Pass Badge</span>
                        </button>
                        <button
                          onClick={() => { setActiveTab('tickets'); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-neutral-700 hover:bg-neutral-50 text-sm font-semibold cursor-pointer text-left"
                        >
                          <Ticket className="w-4.5 h-4.5 text-neutral-400" />
                          <span>My Reserved Tickets</span>
                        </button>
                      </div>
                      
                      <div className="py-2.5 px-4">
                        <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-widest mb-2">
                          <span>Institutional Role</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {(['Attendee', 'Organizer', 'Admin'] as const).map((r) => (
                            <button
                              key={r}
                              onClick={() => {
                                handleRoleChange(r);
                                setIsUserMenuOpen(false);
                              }}
                              className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                                activeRole === r
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-600 border-neutral-200'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={() => { handleSignOut(); setIsUserMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 text-sm font-bold cursor-pointer text-left"
                        >
                          <LogOut className="w-4.5 h-4.5 text-red-400" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                id="header-sign-in-button"
              >
                <LogIn className="w-4.5 h-4.5" />
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 2. DUAL LAYOUT: SIDEBAR + CONTENT AREA */}
      <div className="max-w-[1580px] mx-auto w-full px-6 sm:px-8 lg:px-12 py-8 flex-1 flex flex-col lg:flex-row gap-10">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full lg:w-80 shrink-0 space-y-8">
          <div className="bg-white p-5 rounded-3xl border border-neutral-100/80 shadow-2xl shadow-neutral-100/50 space-y-1.5 text-left">
            <h3 className="text-xs font-bold text-neutral-450 uppercase tracking-widest px-3 mb-4">
              Event Navigation
            </h3>
            
            {/* 1. Browse Seminars */}
            <button
              onClick={() => { setActiveTab('browse'); setViewingSeminarId(null); setIsCreatingSeminar(false); }}
              className={`w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'browse'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5" />
                <span>Browse Seminars</span>
              </div>
            </button>

            {/* 2. My Tickets */}
            <button
              onClick={() => { setActiveTab('tickets'); setViewingSeminarId(null); setIsCreatingSeminar(false); }}
              className={`w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'tickets'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5" />
                <span>My Tickets</span>
              </div>
              {user && registrations.filter(r => r.userId === user.uid && r.status !== 'cancelled').length > 0 && (
                <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold ${activeTab === 'tickets' ? 'bg-white text-indigo-600' : 'bg-indigo-100 text-indigo-700'}`}>
                  {registrations.filter(r => r.userId === user.uid && r.status !== 'cancelled').length}
                </span>
              )}
            </button>

            {/* 3. Planner */}
            <button
              onClick={() => { setActiveTab('planner'); setViewingSeminarId(null); setIsCreatingSeminar(false); }}
              className={`w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'planner'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5" />
                <span>Visual Planner</span>
              </div>
            </button>

            {/* 4. Organizer Console */}
            {(activeRole === 'Organizer' || activeRole === 'Admin') && (
              <button
                onClick={() => { setActiveTab('organizer'); setViewingSeminarId(null); setIsCreatingSeminar(false); }}
                className={`w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'organizer'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Organizer Workspace</span>
                </div>
              </button>
            )}

            {/* 5. Check-In Gate */}
            {(activeRole === 'Organizer' || activeRole === 'Admin') && (
              <button
                onClick={() => { setActiveTab('checkin'); setViewingSeminarId(null); setIsCreatingSeminar(false); }}
                className={`w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                  activeTab === 'checkin'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckSquare className="w-5 h-5" />
                  <span>Check-In Gate</span>
                </div>
              </button>
            )}

            {/* 6. Performance Reports */}
            <button
              onClick={() => { setActiveTab('analytics'); setViewingSeminarId(null); setIsCreatingSeminar(false); }}
              className={`w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5" />
                <span>Analytics & Reports</span>
              </div>
            </button>

            {/* 7. Profile & ID Badge */}
            <button
              onClick={() => { setActiveTab('profile'); setViewingSeminarId(null); setIsCreatingSeminar(false); }}
              className={`w-full flex items-center justify-between px-4.5 py-3.5 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-semibold'
              }`}
            >
              <div className="flex items-center gap-3">
                <User className="w-5 h-5" />
                <span>My Profile & Badge</span>
              </div>
            </button>
          </div>

          {/* Institutional Badge Preview in Sidebar */}
          {user && (
            <div className="bg-neutral-950 p-5 rounded-3xl text-white space-y-4 hidden lg:block border border-neutral-800 shadow-xl text-left">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-sm font-extrabold text-white uppercase">
                  {user.email?.charAt(0) || 'D'}
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-none">{user.displayName || 'Demo Profile'}</h4>
                  <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1 block">{activeRole} PASS</span>
                </div>
              </div>
              <div className="flex items-stretch h-5 gap-[0.7px] opacity-70">
                <div className="w-[1.5px] bg-white" /><div className="w-[2.5px] bg-white" /><div className="w-[1px] bg-transparent" /><div className="w-[4px] bg-white" /><div className="w-[1px] bg-white" /><div className="w-[2px] bg-transparent" /><div className="w-[1px] bg-white" /><div className="w-[5px] bg-white" />
              </div>
              <button 
                onClick={() => setActiveTab('profile')}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-750 rounded-xl text-xs font-bold transition-all cursor-pointer text-center"
              >
                View ID Badge Pass
              </button>
            </div>
          )}
        </aside>

        {/* Right Workspace Panel */}
        <main className="flex-1 space-y-8">
        
        {/* Dynamic Alerts */}
        {feedback && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 shadow-sm transition-all duration-300 ${
            feedback.success 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-amber-50 border-amber-100 text-amber-800'
          }`}>
            {feedback.success ? (
              <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-sm font-medium flex-1">{feedback.message}</div>
            <button onClick={() => setFeedback(null)} className="p-1 hover:bg-black/5 rounded-lg shrink-0 transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* --- CREATING / EDITING SEMINAR FORM VIEW --- */}
        {isCreatingSeminar ? (
          <SeminarForm
            initialSeminar={editingSeminar || undefined}
            initialSessions={editingSeminar ? sessionsMap[editingSeminar.id] : []}
            onSubmit={handleSaveSeminar}
            onCancel={() => { setIsCreatingSeminar(false); setEditingSeminar(null); }}
            isSubmitting={isSubmitting}
          />
        ) : viewingSeminarId && activeSeminar ? (
          
          /* --- SEMINAR DETAILS VIEW (DETAIL VIEW) --- */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Details & Agenda (2 cols wide) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-5">
                <button
                  onClick={() => setViewingSeminarId(null)}
                  className="inline-flex items-center text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors mb-2 cursor-pointer"
                >
                  ← Back to Seminars
                </button>

                <div className="space-y-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xxs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                    {activeSeminar.category}
                  </span>
                  <h2 className="font-display font-bold text-2xl text-neutral-900 leading-tight">
                    {activeSeminar.title}
                  </h2>
                </div>

                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                  {activeSeminar.description}
                </p>

                {/* Logistics Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-neutral-100 pt-5 text-neutral-700">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4.5 h-4.5 text-neutral-400" />
                    <div className="text-xs">
                      <div className="font-bold">Schedule</div>
                      <div className="text-neutral-500 text-xxs mt-0.5">
                        {new Date(activeSeminar.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4.5 h-4.5 text-neutral-400" />
                    <div className="text-xs truncate max-w-full">
                      <div className="font-bold">Venue</div>
                      <div className="text-neutral-500 text-xxs mt-0.5 truncate" title={activeSeminar.venue}>
                        {activeSeminar.venue}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Users className="w-4.5 h-4.5 text-neutral-400" />
                    <div className="text-xs">
                      <div className="font-bold">Capacity</div>
                      <div className="text-neutral-500 text-xxs mt-0.5">
                        {activeSeminar.registeredCount} / {activeSeminar.capacity} Seats Filled
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sessions & Speakers List */}
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm space-y-4">
                <h3 className="font-display font-semibold text-base text-neutral-800 border-b border-neutral-50 pb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  Seminar Agenda & Speaker Lineup
                </h3>

                {activeSeminarSessions.length === 0 ? (
                  <div className="text-center py-6 text-neutral-400 text-sm">
                    No individual sessions scheduled for this seminar.
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-neutral-100">
                    {activeSeminarSessions.map((sess, idx) => (
                      <div key={sess.id} className="relative pl-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Bullet point node */}
                        <div className="absolute left-1.5 top-2.5 w-4 h-4 rounded-full border-2 border-indigo-600 bg-white shadow-sm flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                        </div>

                        <div>
                          <h4 className="font-bold text-sm text-neutral-800">{sess.title}</h4>
                          <span className="text-xxs text-neutral-500 font-medium block mt-0.5">
                            Speaker: <strong className="text-neutral-700 font-semibold">{sess.speakerName}</strong>
                          </span>
                        </div>

                        <div className="text-left sm:text-right shrink-0">
                          <span className="inline-flex items-center gap-1 text-xxs font-medium text-neutral-500 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-100">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(sess.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(sess.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Ticket / Waitlist & Action Widget */}
            <div className="space-y-6">
              
              {/* Registration Widget */}
              <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm text-center space-y-4 relative overflow-hidden">
                <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-neutral-500">
                  Registration Ticket
                </h3>

                {userActiveTicket ? (
                  <div className="space-y-4">
                    {/* Render registration ticket details */}
                    <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl relative space-y-4">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-indigo-600 font-display">TICKET</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          userActiveTicket.status === 'registered' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {userActiveTicket.status}
                        </span>
                      </div>

                      <div className="text-center font-mono font-bold text-lg tracking-widest text-neutral-800 bg-white py-2 rounded-xl border border-neutral-200 shadow-inner">
                        {userActiveTicket.code}
                      </div>

                      {/* Render live QR code! */}
                      <div className="flex justify-center">
                        <QrCodeGenerator code={userActiveTicket.code} />
                      </div>

                      <p className="text-xxs text-neutral-500 text-center leading-relaxed">
                        Present this registration code or QR code at the venue check-in desk.
                      </p>
                    </div>

                    <button
                      onClick={() => handleCancelRegistration(userActiveTicket)}
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                    >
                      Cancel Registration
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      Reserve your seat for this seminar. Capacity is strictly limited to{' '}
                      <strong className="text-neutral-700 font-bold">{activeSeminar.capacity}</strong> attendees.
                    </p>

                    <div className="flex justify-between items-center text-xs border-y border-neutral-50 py-3">
                      <span className="text-neutral-500">Available Seats:</span>
                      <strong className="font-bold text-neutral-800">
                        {Math.max(activeSeminar.capacity - activeSeminar.registeredCount, 0)} Left
                      </strong>
                    </div>

                    {activeSeminar.status === 'Closed' ? (
                      <div className="p-3 bg-neutral-100 text-neutral-500 font-semibold rounded-xl text-xs text-center">
                        Seminar Closed / Ended
                      </div>
                    ) : activeSeminar.registeredCount >= activeSeminar.capacity ? (
                      <div className="space-y-2">
                        <div className="p-2 bg-amber-50 border border-amber-100 rounded-xl text-xxs font-medium text-amber-700 flex items-center justify-center gap-1">
                          <Info className="w-3.5 h-3.5" />
                          Seats full. Registering enters the waitlist.
                        </div>
                        <button
                          onClick={() => handleRegisterSeminar(activeSeminar)}
                          disabled={isSubmitting}
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 cursor-pointer"
                        >
                          {isSubmitting ? 'Processing...' : 'Join Waitlist'}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleRegisterSeminar(activeSeminar)}
                        disabled={isSubmitting}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 cursor-pointer"
                      >
                        {isSubmitting ? 'Booking...' : 'Book Your Seat'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* --- PRIMARY WORKSPACES ROUTER --- */
          <div className="space-y-6">
            
            {/* PAGE: BROWSE SEMINARS */}
            {activeTab === 'browse' && (
              <div className="space-y-6 text-left">
                
                {/* STUNNING CAMPUS HERO GREETING DASHBOARD BANNER */}
                <div className="relative rounded-[32px] overflow-hidden bg-indigo-950 text-white p-8 sm:p-12 border border-indigo-900 shadow-2xl">
                  {/* Subtle vector background art */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-indigo-800/30 via-transparent to-transparent opacity-70 pointer-events-none" />
                  <div className="absolute -right-8 -top-8 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -left-8 -bottom-8 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest backdrop-blur-md">
                        <Sparkles className="w-4 h-4 text-indigo-450" />
                        <span>Institutional Seminar Network</span>
                      </div>
                      <h2 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-white tracking-tight leading-tight">
                        {user ? `Welcome back, ${user.displayName?.split(' ')[0] || 'Scholar'}!` : 'Empower Your Academic Journey'}
                      </h2>
                      <p className="text-sm sm:text-base text-indigo-100/90 max-w-2xl leading-relaxed font-medium">
                        Discover academic workshops, guest speaker panels, and professional masterclasses scheduled across our university departments. Register for free to secure your attendance certificate.
                      </p>
                    </div>
                    
                    {/* Live Department/Date Pill */}
                    <div className="flex flex-col bg-white/10 border border-white/15 backdrop-blur-lg rounded-2xl p-5.5 shrink-0 text-left min-w-[240px] shadow-lg">
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest block mb-1.5">DEPARTMENT DATE</span>
                      <span className="text-base sm:text-lg font-extrabold text-white block leading-snug">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-xs text-indigo-200/80 block mt-2 font-medium">Campus Status: Active & Operational</span>
                    </div>
                  </div>
                </div>

                {/* BENTO STATISTICS STRIP */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/40 flex flex-col justify-between hover:shadow-2xl hover:border-neutral-200 transition-all duration-300">
                    <span className="text-xs font-bold text-neutral-450 uppercase tracking-wider block">Total Seminars</span>
                    <div className="flex items-baseline gap-2.5 mt-3">
                      <span className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-800 leading-none">{seminars.length}</span>
                       <span className="text-xs text-emerald-600 font-bold leading-none bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Active</span>
                    </div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/40 flex flex-col justify-between hover:shadow-2xl hover:border-neutral-200 transition-all duration-300">
                    <span className="text-xs font-bold text-neutral-450 uppercase tracking-wider block">My Bookings</span>
                    <div className="flex items-baseline gap-2.5 mt-3">
                      <span className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-800 leading-none">
                        {user ? registrations.filter(r => r.userId === user.uid && r.status === 'registered').length : '0'}
                      </span>
                      <span className="text-xs text-neutral-500 font-bold leading-none">Confirmed</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/40 flex flex-col justify-between hover:shadow-2xl hover:border-neutral-200 transition-all duration-300">
                    <span className="text-xs font-bold text-neutral-450 uppercase tracking-wider block">Waitlisted</span>
                    <div className="flex items-baseline gap-2.5 mt-3">
                      <span className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-800 leading-none">
                        {user ? registrations.filter(r => r.userId === user.uid && r.status === 'waitlisted').length : '0'}
                      </span>
                      <span className="text-xs text-amber-600 font-bold leading-none bg-amber-50 px-2 py-1 rounded border border-amber-100">Pending</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-neutral-100/80 shadow-xl shadow-neutral-100/40 flex flex-col justify-between hover:shadow-2xl hover:border-neutral-200 transition-all duration-300">
                    <span className="text-xs font-bold text-neutral-450 uppercase tracking-wider block">Checked-In</span>
                    <div className="flex items-baseline gap-2.5 mt-3">
                      <span className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-800 leading-none">
                        {user ? (Object.values(attendancesMap).flat() as Attendance[]).filter(att => {
                          const reg = registrations.find(r => r.id === att.registrationId);
                          return reg && reg.userId === user.uid;
                        }).length : '0'}
                      </span>
                      <span className="text-xs text-indigo-600 font-bold leading-none bg-indigo-50 px-2 py-1 rounded border border-indigo-100">Attended</span>
                    </div>
                  </div>
                </div>

                {/* SEMINAR LISTING FILTER BAR */}
                <div className="bg-white rounded-3xl border border-neutral-100/80 p-6 sm:p-8 shadow-2xl shadow-neutral-100/50 space-y-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="font-display font-bold text-lg sm:text-xl text-neutral-850 flex items-center gap-2.5">
                        <TrendingUp className="w-6 h-6 text-indigo-600" />
                        {activeRole === 'Attendee' ? 'Available Seminars' : activeRole === 'Organizer' ? 'My Managed Seminars' : 'System Seminars'}
                      </h2>
                      <p className="text-xs sm:text-sm font-semibold text-neutral-450 mt-1">
                        Browse scheduled seminars, guest lectures, and institutional workshops.
                      </p>
                    </div>

                    {/* Create Seminar Button for Organizer / Admin */}
                    {(activeRole === 'Organizer' || activeRole === 'Admin') && (
                      <button
                        onClick={() => { setIsCreatingSeminar(true); setEditingSeminar(null); }}
                        className="inline-flex items-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md hover:shadow-lg cursor-pointer shrink-0"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Create Seminar</span>
                      </button>
                    )}
                  </div>

                  {/* Filtering Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1.5">
                    {/* Search Bar */}
                    <div className="relative md:col-span-2">
                      <Search className="absolute left-4 top-4 w-4.5 h-4.5 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search by title, description, speaker, or venue..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-5 py-3.5 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-neutral-50/50 text-xs sm:text-sm text-neutral-750 font-medium"
                      />
                    </div>

                    {/* Category selector */}
                    <div>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-neutral-50/50 text-xs sm:text-sm text-neutral-750 font-bold appearance-none cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        <option value="Technology">Technology</option>
                        <option value="Business & Finance">Business & Finance</option>
                        <option value="Health & Science">Health & Science</option>
                        <option value="Art & Design">Art & Design</option>
                        <option value="Personal Development">Personal Development</option>
                        <option value="Other">Other Category</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* SEMINAR GRID DISPLAY */}
                {filteredSeminars.length === 0 ? (
                  <div className="text-center py-24 bg-white border border-neutral-100/80 rounded-3xl shadow-xl shadow-neutral-100/40">
                    <Search className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
                    <h3 className="font-bold text-base text-neutral-800">No Seminars Found</h3>
                    <p className="text-xs sm:text-sm text-neutral-450 mt-1 max-w-sm mx-auto leading-relaxed">
                      We couldn't find any seminars matching your category or keywords. Try checking other categories.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSeminars.map((sem) => {
                      const semSessions = sessionsMap[sem.id] || [];
                      const userBooking = registrations.find(r => r.seminarId === sem.id && r.userId === user?.uid && r.status !== 'cancelled');
                      const visuals = getCategoryVisuals(sem.category);

                      return (
                        <div 
                          key={sem.id} 
                          className="bg-white rounded-3xl border border-neutral-100/85 shadow-xl shadow-neutral-100/40 hover:shadow-2xl hover:border-neutral-200 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden group text-left"
                        >
                          {/* STYLISH CATEGORY COVER OVERLAY */}
                          <div className={`h-36 relative bg-gradient-to-br ${visuals.gradient} p-5.5 flex flex-col justify-between overflow-hidden shrink-0`}>
                            {/* Abstract decorative graphic pattern */}
                            {visuals.pattern}
                            
                            <div className="relative z-10 flex justify-between items-start">
                              <span className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-bold border ${visuals.badgeBg} uppercase tracking-widest backdrop-blur-md`}>
                                {sem.category}
                              </span>
                              
                              {(activeRole === 'Organizer' || activeRole === 'Admin') && (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-[10px] font-bold border backdrop-blur-md ${
                                  sem.status === 'Published' 
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' 
                                    : sem.status === 'Closed' 
                                    ? 'bg-neutral-500/15 text-neutral-300 border-neutral-500/20' 
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/20'
                                }`}>
                                  {sem.status}
                                </span>
                              )}

                              {activeRole === 'Attendee' && userBooking && (
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-bold border backdrop-blur-md ${
                                  userBooking.status === 'registered' 
                                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' 
                                    : 'bg-amber-500/15 text-amber-300 border-amber-500/20'
                                }`}>
                                  <Ticket className="w-3 h-3" />
                                  <span>{userBooking.status === 'registered' ? 'Booked' : 'Waitlisted'}</span>
                                </span>
                              )}
                            </div>

                            <div className="relative z-10">
                              <span className="text-[10px] font-extrabold text-white/50 uppercase tracking-widest block">VENUE</span>
                              <span className="text-sm font-extrabold text-white truncate max-w-full block mt-0.5">{sem.venue}</span>
                            </div>
                          </div>

                          <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                            <div className="space-y-2">
                              <h3 
                                onClick={() => setViewingSeminarId(sem.id)}
                                className="font-display font-extrabold text-base sm:text-lg text-neutral-850 line-clamp-1 hover:text-indigo-600 cursor-pointer transition-colors leading-snug"
                              >
                                {sem.title}
                              </h3>
                              <p className="text-xs sm:text-sm text-neutral-500 line-clamp-2 leading-relaxed">
                                {sem.description}
                              </p>
                            </div>

                            <div className="space-y-2 text-xs text-neutral-600 border-t border-neutral-100 pt-4">
                              <div className="flex items-center gap-2.5">
                                <Calendar className="w-4 h-4 text-neutral-450 shrink-0" />
                                <span className="font-semibold text-neutral-550">
                                  {new Date(sem.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(sem.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5">
                                <Users className="w-4 h-4 text-neutral-450 shrink-0" />
                                <span className="font-extrabold text-neutral-700">{sem.registeredCount} / {sem.capacity} Slots Booked</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-neutral-50/50 px-6 py-4.5 border-t border-neutral-100 flex items-center justify-between">
                            <span className="text-xs font-bold text-neutral-450">
                              {semSessions.length} Scheduled {semSessions.length === 1 ? 'Session' : 'Sessions'}
                            </span>

                            <div className="flex items-center gap-2.5">
                              {(activeRole === 'Organizer' || activeRole === 'Admin') && (
                                <>
                                  <button
                                    onClick={() => { setEditingSeminar(sem); setIsCreatingSeminar(true); }}
                                    className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-neutral-200 transition-all cursor-pointer"
                                    title="Edit Seminar"
                                  >
                                    <Edit3 className="w-4.5 h-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSeminar(sem.id)}
                                    className="p-2 text-neutral-500 hover:text-red-600 hover:bg-white rounded-xl border border-transparent hover:border-neutral-200 transition-all cursor-pointer"
                                    title="Delete Seminar"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => setViewingSeminarId(sem.id)}
                                className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-neutral-250 hover:border-indigo-500 hover:text-indigo-600 rounded-xl text-xs font-bold text-neutral-700 transition-all cursor-pointer shadow-sm hover:shadow"
                              >
                                <span>View Details</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* PAGE: MY TICKETS WALLET */}
            {activeTab === 'tickets' && (
              <MyTicketsPage
                user={user}
                registrations={registrations}
                seminars={seminars}
                sessionsMap={sessionsMap}
                attendancesMap={attendancesMap}
                onCancelRegistration={handleCancelRegistration}
                isSubmitting={isSubmitting}
                onViewSeminarDetails={(semId) => { setViewingSeminarId(semId); }}
              />
            )}

            {/* PAGE: VISUAL PLANNER CALENDAR */}
            {activeTab === 'planner' && (
              <PlannerCalendarPage
                seminars={seminars}
                onViewSeminarDetails={(semId) => { setViewingSeminarId(semId); }}
              />
            )}

            {/* PAGE: ORGANIZER WORKSPACE */}
            {activeTab === 'organizer' && (
              <OrganizerPage
                user={user}
                activeRole={activeRole}
                seminars={seminars}
                registrations={registrations}
                sessionsMap={sessionsMap}
                onTriggerCreateSeminar={() => { setIsCreatingSeminar(true); setEditingSeminar(null); }}
                onTriggerEditSeminar={(sem) => { setEditingSeminar(sem); setIsCreatingSeminar(true); }}
                onDeleteSeminar={handleDeleteSeminar}
              />
            )}

            {/* PAGE: CHECK-IN SCANNING GATE */}
            {activeTab === 'checkin' && (
              <div>
                {(activeRole === 'Organizer' || activeRole === 'Admin') ? (
                  <CheckinScanner 
                    seminars={activeRole === 'Admin' ? seminars : seminars.filter(s => s.organizerId === user?.uid)} 
                    sessionsMap={sessionsMap} 
                    onCheckIn={handleSessionCheckIn} 
                  />
                ) : (
                  <div className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm text-center">
                    <h3 className="font-bold text-sm text-neutral-800">Access Denied</h3>
                    <p className="text-xs text-neutral-400 mt-1">This checkpoint is reserved for institutional event coordinators and supervisors.</p>
                  </div>
                )}
              </div>
            )}

            {/* PAGE: ANALYTICS & REPORTS */}
            {activeTab === 'analytics' && (
              <ReportDashboard 
                seminars={seminars} 
                sessionsMap={sessionsMap} 
                registrations={registrations} 
                attendancesMap={attendancesMap} 
              />
            )}

            {/* PAGE: USER PROFILE & ID BADGE */}
            {activeTab === 'profile' && (
              <ProfileBadgePage
                user={user}
                userProfile={userProfile}
                activeRole={activeRole}
                onRoleChange={handleRoleChange}
                isSubmitting={isSubmitting}
                registrations={registrations}
                attendancesMap={attendancesMap}
              />
            )}

          </div>
        )}

      </main>
    </div>

      {/* FOOTER */}
      <footer className="bg-white border-t border-neutral-100 py-8 mt-16">
        <div className="max-w-[1580px] mx-auto px-6 sm:px-8 lg:px-12 text-center text-xs sm:text-sm text-neutral-450 font-bold">
          SeminarHub Event Registration Platform © 2026. Powered by React, Tailwind & Cloud Firestore.
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isDemoMode={isDemoMode}
        onAuthSuccess={(u, p) => {
          setUser(u);
          setUserProfile(p);
          setActiveRole(p.role);
        }}
        setFeedback={setFeedback}
      />

      <DeleteSeminarModal
        isOpen={deletingSeminarId !== null}
        onClose={() => setDeletingSeminarId(null)}
        onConfirm={executeDeleteSeminar}
        seminar={seminars.find(s => s.id === deletingSeminarId) || null}
        sessions={deletingSeminarId ? (sessionsMap[deletingSeminarId] || []) : []}
        registrations={deletingSeminarId ? registrations.filter(r => r.seminarId === deletingSeminarId) : []}
      />

    </div>
  );
}

// Sub-Component to dynamically generate QR codes client side
interface QrCodeGeneratorProps {
  code: string;
}

const QrCodeGenerator: React.FC<QrCodeGeneratorProps> = ({ code }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && code) {
      QRCode.toCanvas(
        canvasRef.current, 
        code, 
        { 
          width: 140, 
          margin: 1,
          color: {
            dark: '#1e1b4b', // Deep indigo
            light: '#ffffff'
          }
        }, 
        (err) => {
          if (err) console.error("Failed to render QR Code on Canvas", err);
        }
      );
    }
  }, [code]);

  return (
    <div className="p-2 bg-white rounded-xl border border-neutral-100 shadow-sm">
      <canvas ref={canvasRef} className="rounded-lg" />
    </div>
  );
};
