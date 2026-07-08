import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile, UserRole } from '../types';
import { 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus,
  Loader2
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDemoMode: boolean;
  onAuthSuccess: (user: any, profile: UserProfile) => void;
  setFeedback: (feedback: { success: boolean; message: string } | null) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  isDemoMode,
  onAuthSuccess,
  setFeedback
}) => {
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      if (isDemoMode) {
        // Simulate Google Auth
        const mockUid = 'demo_google_' + Math.random().toString(36).substring(2, 9);
        const mockUser = {
          uid: mockUid,
          displayName: 'Google Demo User',
          email: 'google.demo@example.com',
          photoURL: null
        };
        const mockProfile: UserProfile = {
          uid: mockUid,
          name: 'Google Demo User',
          email: 'google.demo@example.com',
          role: 'Attendee',
          createdAt: new Date().toISOString()
        };

        // Save demo active user
        localStorage.setItem('seminar_demo_active_user', JSON.stringify({ user: mockUser, profile: mockProfile }));
        onAuthSuccess(mockUser, mockProfile);
        setFeedback({ success: true, message: 'Simulated Google Sign-In Successful!' });
        onClose();
        return;
      }

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check / Create profile
      const profileRef = doc(db, 'users', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);
      let profile: UserProfile;

      if (profileSnap.exists()) {
        profile = profileSnap.data() as UserProfile;
      } else {
        const defaultRole: UserRole = firebaseUser.email === 'emmanuelnnadi097@gmail.com' ? 'Admin' : 'Attendee';
        profile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          email: firebaseUser.email || '',
          role: defaultRole,
          createdAt: new Date().toISOString()
        };
        await setDoc(profileRef, profile);
      }

      onAuthSuccess(firebaseUser, profile);
      setFeedback({ success: true, message: 'Google Sign-In Successful!' });
      onClose();
    } catch (error: any) {
      console.error("Google Auth failed", error);
      setErrorMsg(error.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Basic Validation
    if (!email || !password) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (isRegister) {
      if (!fullName) {
        setErrorMsg('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);

    try {
      if (isDemoMode) {
        // --- OFFLINE DEMO MODE SIMULATION ---
        const demoUsersRaw = localStorage.getItem('seminar_demo_users_list');
        const demoUsers = demoUsersRaw ? JSON.parse(demoUsersRaw) : [];

        if (isRegister) {
          // Check if email already registered in demo list
          const exists = demoUsers.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
          if (exists) {
            setErrorMsg('This email is already registered in offline Demo Mode.');
            setLoading(false);
            return;
          }

          // Register Demo User
          const mockUid = 'demo_user_' + Math.random().toString(36).substring(2, 9);
          const newMockUser = {
            uid: mockUid,
            displayName: fullName,
            email: email,
            photoURL: null
          };
          const defaultRole: UserRole = email.toLowerCase() === 'emmanuelnnadi097@gmail.com' ? 'Admin' : 'Attendee';
          const newMockProfile: UserProfile = {
            uid: mockUid,
            name: fullName,
            email: email,
            role: defaultRole,
            createdAt: new Date().toISOString()
          };

          // Save to simulated list of users
          demoUsers.push({
            uid: mockUid,
            name: fullName,
            email: email,
            password: password, // For simulation purposes only
            profile: newMockProfile
          });
          localStorage.setItem('seminar_demo_users_list', JSON.stringify(demoUsers));

          // Set active user
          localStorage.setItem('seminar_demo_active_user', JSON.stringify({ user: newMockUser, profile: newMockProfile }));
          onAuthSuccess(newMockUser, newMockProfile);
          setFeedback({ success: true, message: 'Demo Registration Successful! Account simulated.' });
          onClose();
        } else {
          // Login Demo User
          // Pre-populate with Jane Doe demo credentials if empty or matching default
          const defaultDemoJane = {
            uid: 'demo_user_123',
            name: 'Jane Doe (Demo)',
            email: 'janedoe@example.com',
            password: 'password',
            profile: {
              uid: 'demo_user_123',
              name: 'Jane Doe (Demo)',
              email: 'janedoe@example.com',
              role: 'Attendee' as UserRole,
              createdAt: new Date().toISOString()
            }
          };

          const allDemoUsers = [defaultDemoJane, ...demoUsers];
          const matchedUser = allDemoUsers.find(
            (u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
          );

          if (!matchedUser) {
            setErrorMsg('Invalid simulated credentials. Try "janedoe@example.com" / "password" or create a new mock account.');
            setLoading(false);
            return;
          }

          const mockUser = {
            uid: matchedUser.uid,
            displayName: matchedUser.name,
            email: matchedUser.email,
            photoURL: null
          };

          localStorage.setItem('seminar_demo_active_user', JSON.stringify({ user: mockUser, profile: matchedUser.profile }));
          onAuthSuccess(mockUser, matchedUser.profile);
          setFeedback({ success: true, message: 'Demo Sign-In Successful!' });
          onClose();
        }
        return;
      }

      // --- LIVE FIREBASE AUTH ---
      if (isRegister) {
        // Register User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Update display name
        await updateProfile(firebaseUser, { displayName: fullName });

        // Save profile in Firestore
        const defaultRole: UserRole = email.toLowerCase() === 'emmanuelnnadi097@gmail.com' ? 'Admin' : 'Attendee';
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          name: fullName,
          email: email,
          role: defaultRole,
          createdAt: new Date().toISOString()
        };

        await setDoc(profileRef, newProfile);
        onAuthSuccess(firebaseUser, newProfile);
        setFeedback({ success: true, message: 'Account registered and logged in successfully!' });
      } else {
        // Sign In User
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // Fetch profile
        const profileRef = doc(db, 'users', firebaseUser.uid);
        const profileSnap = await getDoc(profileRef);
        let profile: UserProfile;

        if (profileSnap.exists()) {
          profile = profileSnap.data() as UserProfile;
        } else {
          const defaultRole: UserRole = firebaseUser.email === 'emmanuelnnadi097@gmail.com' ? 'Admin' : 'Attendee';
          profile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            email: firebaseUser.email || '',
            role: defaultRole,
            createdAt: new Date().toISOString()
          };
          await setDoc(profileRef, profile);
        }

        onAuthSuccess(firebaseUser, profile);
        setFeedback({ success: true, message: 'Signed in successfully!' });
      }

      onClose();
    } catch (error: any) {
      console.error("Authentication Error", error);
      let readableError = 'Authentication failed. Please verify your details.';
      if (error.code === 'auth/email-already-in-use') {
        readableError = 'This email address is already registered.';
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
        readableError = 'Invalid email or password combination.';
      } else if (error.code === 'auth/invalid-email') {
        readableError = 'Please enter a valid email address.';
      }
      setErrorMsg(readableError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity duration-300">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-neutral-100/40 relative flex flex-col text-left">
        
        {/* Banner header */}
        <div className="bg-indigo-600 p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute right-5 top-5 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            id="auth-modal-close"
          >
            <X className="w-5.5 h-5.5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl text-white">
              <Sparkles className="w-6 h-6 text-indigo-200" />
            </div>
            <h3 className="font-display font-bold text-xl sm:text-2xl">
              {isRegister ? 'Join SeminarHub' : 'Welcome Back'}
            </h3>
          </div>
          <p className="text-sm text-indigo-100 mt-2.5 leading-relaxed">
            {isRegister 
              ? 'Create an institutional account to book seminars and track attendance.' 
              : 'Sign in to access your registered tickets, schedules, and ID pass.'}
          </p>
        </div>

        {/* Demo Mode Notice */}
        {isDemoMode && (
          <div className="bg-amber-50 border-b border-amber-100 px-8 py-3.5 flex items-start gap-3 text-amber-805 text-sm font-semibold leading-relaxed">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Demo Simulator Active:</strong> Accounts and logins will be simulated offline inside local storage.
            </span>
          </div>
        )}

        <div className="p-8 space-y-6 flex-1">
          {errorMsg && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-850 text-sm font-bold leading-relaxed">
              <AlertCircle className="w-5.5 h-5.5 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4.5">
            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm sm:text-base text-neutral-850 font-medium"
                    id="auth-input-name"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  required
                  placeholder="name@institution.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm sm:text-base text-neutral-850 font-medium"
                  id="auth-input-email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={isRegister ? 'At least 6 characters' : 'Enter password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm sm:text-base text-neutral-850 font-medium"
                  id="auth-input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-neutral-400 hover:text-neutral-600 cursor-pointer p-1"
                  id="auth-password-toggle"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 w-5 h-5 text-neutral-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-neutral-250 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm sm:text-base text-neutral-850 font-medium"
                    id="auth-input-confirm-password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-md hover:shadow-lg disabled:opacity-50 cursor-pointer"
              id="auth-submit-btn"
            >
              {loading ? (
                <Loader2 className="w-5.5 h-5.5 animate-spin" />
              ) : isRegister ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Register Account</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          {/* Social login divider */}
          <div className="relative flex items-center justify-center py-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-150"></div>
            </div>
            <span className="relative px-4 bg-white text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Or connect via
            </span>
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-900 font-bold rounded-xl text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
            id="auth-google-btn"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" width="20" height="20">
              <g transform="matrix(1, 0, 0, 1, 0, 0)">
                <path fill="#EA4335" d="M20.6,10.2C20.6,10.2,20.6,10.2,20.6,10.2c0.2,0,0.4,0,0.6,0.1c1.2,0.1,2.3,0.7,3.1,1.5l3.4-3.4c-2-1.9-4.7-3-7.7-3c-5.2,0-9.6,3.4-11.2,8.1l3.9,3C13.8,12.8,16.9,10.2,20.6,10.2z"/>
                <path fill="#4285F4" d="M31.5,16.3c0-0.7-0.1-1.3-0.2-2c-0.2-1.3-0.8-2.6-1.7-3.6c-0.2-0.2-0.3-0.4-0.5-0.6C29,10,28.8,9.9,28.6,9.8c-2.4-1.7-5.5-2.2-8.3-1.4c-0.1,0-0.1,0-0.2,0.1c-0.1,0-0.2,0.1-0.2,0.1c-1.3,0.5-2.4,1.4-3.3,2.5l-3.9-3C10,12,8.4,15.8,8.4,20c0,4.2,1.6,8,4.3,11.2l3.9-3c-0.8-1-1.3-2.1-1.6-3.4c-0.1-0.4-0.1-0.8-0.1-1.3C15,20.2,17.2,17.3,20.6,16.8c1.1-0.2,2.2-0.1,3.2,0.2c1.1,0.3,2.1,0.9,2.9,1.7c0,0,0,0,0,0L31.5,16.3z" transform="translate(0.5, -0.5)"/>
                <path fill="#FBBC05" d="M12.7,28.2c-0.3-0.9-0.5-1.9-0.5-2.9c0-1,0.2-2,0.5-2.9l-3.9-3C8,21.1,7.5,23.5,7.5,26c0,2.5,0.5,4.9,1.3,6.7L12.7,28.2z" transform="translate(-0.5, -0.5)"/>
                <path fill="#34A853" d="M20.6,31.8c-3.7,0-6.8-2.6-7.9-6.2l-3.9,3c1.6,4.7,6,8.1,11.2,8.1c3,0,5.7-1.1,7.7-3l-3.4-3.4C23.4,31.1,22.1,31.7,20.6,31.8z" transform="translate(0, -0.5)"/>
              </g>
            </svg>
            <span>Google Single Sign-On</span>
          </button>
        </div>

        {/* Footer switch state */}
        <div className="bg-neutral-50 px-8 py-5 text-center border-t border-neutral-100">
          <p className="text-sm text-neutral-500 font-bold">
            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}{' '}
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setErrorMsg(null);
              }}
              className="text-indigo-600 hover:text-indigo-800 font-extrabold hover:underline cursor-pointer"
              id="auth-toggle-mode"
            >
              {isRegister ? 'Sign In' : 'Create Account'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
