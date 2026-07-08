import React from 'react';
import { User, Shield, Key, FileText, CheckCircle2, Ticket } from 'lucide-react';
import { UserProfile, Registration, Attendance } from '../types';
import { RoleSwitcher } from './RoleSwitcher';

interface ProfileBadgePageProps {
  user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
  userProfile: UserProfile | null;
  activeRole: string;
  onRoleChange: (role: any) => void;
  isSubmitting: boolean;
  registrations: Registration[];
  attendancesMap: Record<string, Attendance[]>;
}

export const ProfileBadgePage: React.FC<ProfileBadgePageProps> = ({
  user,
  userProfile,
  activeRole,
  onRoleChange,
  isSubmitting,
  registrations,
  attendancesMap
}) => {
  const myRegs = registrations.filter(r => r.userId === user?.uid && r.status !== 'cancelled');
  const myRegIds = new Set(myRegs.map(r => r.id));
  const checkedInCount = (Object.values(attendancesMap) as Attendance[][]).reduce((acc: number, list) => {
    return acc + (list || []).filter((a: Attendance) => myRegIds.has(a.registrationId)).length;
  }, 0);

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-xl shadow-neutral-100/50">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-neutral-800 flex items-center gap-2.5">
          <User className="w-6 h-6 text-indigo-600" />
          My Profile & Institutional ID Badge
        </h2>
        <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed font-semibold">
          Review your account attributes, generate a scan-ready security access badge, and customize system permissions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side: Role switcher and Details (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Account Profile Details */}
          <div className="bg-white p-8 rounded-3xl border border-neutral-100/80 shadow-2xl shadow-neutral-100/50 space-y-6">
            <h3 className="font-display font-extrabold text-sm sm:text-base text-neutral-450 uppercase tracking-widest border-b border-neutral-100 pb-3">
              Account Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                <span className="text-neutral-400 font-bold text-xs block uppercase tracking-wider">Display Name</span>
                <span className="font-extrabold text-neutral-850 text-sm sm:text-base">{user?.displayName || 'Jane Doe (Demo)'}</span>
              </div>

              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                <span className="text-neutral-400 font-bold text-xs block uppercase tracking-wider">Email Address</span>
                <span className="font-extrabold text-neutral-850 text-sm sm:text-base truncate block">{user?.email || 'janedoe@example.com'}</span>
              </div>

              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                <span className="text-neutral-400 font-bold text-xs block uppercase tracking-wider">Assigned System Role</span>
                <span className="font-extrabold text-indigo-600 text-sm sm:text-base">{userProfile?.role || activeRole}</span>
              </div>

              <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-2">
                <span className="text-neutral-400 font-bold text-xs block uppercase tracking-wider">Registration Date</span>
                <span className="font-extrabold text-neutral-850 text-sm sm:text-base">
                  {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Role Switching Control Panel (Embedded RoleSwitcher) */}
          <div className="bg-white p-8 rounded-3xl border border-neutral-100/80 shadow-2xl shadow-neutral-100/50 space-y-6">
            <div>
              <h3 className="font-display font-extrabold text-sm sm:text-base text-neutral-450 uppercase tracking-widest">
                Persona Role Customizer
              </h3>
              <p className="text-xs sm:text-sm text-neutral-500 mt-1.5 font-semibold">
                Switch permissions below to experience SeminarHub as an Attendee, Organizer, or System Admin.
              </p>
            </div>

            <RoleSwitcher 
              currentRole={activeRole as any} 
              onRoleChange={onRoleChange} 
              isRealProfileSyncing={isSubmitting} 
            />
          </div>
        </div>

        {/* Right Side: Visual RFID Access Badge Card (5 columns) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-[340px] bg-white border border-neutral-100/80 rounded-3xl shadow-2xl shadow-neutral-100/50 p-8 flex flex-col items-center text-center space-y-6 overflow-hidden">
            {/* Top Lanyard attachment block */}
            <div className="w-20 h-3 bg-neutral-850 rounded-full mb-1 opacity-80" />
            
            {/* Colored header band based on role */}
            <div className={`absolute top-0 left-0 right-0 h-5 ${
              activeRole === 'Admin' 
                ? 'bg-rose-500' 
                : activeRole === 'Organizer' 
                ? 'bg-indigo-600' 
                : 'bg-emerald-500'
            }`} />

            {/* Avatar or ID Display */}
            <div className="relative pt-2">
              <div className={`w-28 h-28 rounded-3xl overflow-hidden border-2 flex items-center justify-center bg-neutral-50 ${
                activeRole === 'Admin' 
                  ? 'border-rose-400 ring-4 ring-rose-50' 
                  : activeRole === 'Organizer' 
                  ? 'border-indigo-400 ring-4 ring-indigo-50' 
                  : 'border-emerald-400 ring-4 ring-emerald-50'
              }`}>
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Badge Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-neutral-400" />
                )}
              </div>
              
              {/* Floating Shield Lock badge */}
              <div className={`absolute -bottom-1.5 -right-1.5 p-2 rounded-xl text-white ${
                activeRole === 'Admin' 
                  ? 'bg-rose-500' 
                  : activeRole === 'Organizer' 
                  ? 'bg-indigo-600' 
                  : 'bg-emerald-500'
              }`}>
                <Shield className="w-4 h-4" />
              </div>
            </div>

            {/* Badge Identity details */}
            <div className="space-y-1.5">
              <h4 className="font-display font-extrabold text-xl text-neutral-855 leading-tight">
                {user?.displayName || 'Jane Doe (Demo)'}
              </h4>
              <span className="text-xs text-neutral-450 font-mono tracking-wide block font-semibold">
                UID: {user?.uid ? `${user.uid.substring(0, 8)}...${user.uid.substring(user.uid.length - 4)}` : 'DEMO_IDENTITY'}
              </span>
            </div>

            {/* Access Role Tag */}
            <div className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider ${
              activeRole === 'Admin' 
                ? 'bg-rose-100 text-rose-700' 
                : activeRole === 'Organizer' 
                ? 'bg-indigo-100 text-indigo-700' 
                : 'bg-emerald-100 text-emerald-700'
            }`}>
              {activeRole} Access Pass
            </div>

            {/* Barcode graphic */}
            <div className="w-full bg-neutral-50/50 p-5 rounded-2xl border border-neutral-100 space-y-2">
              <div className="font-mono text-[10px] text-neutral-450 font-extrabold uppercase tracking-widest text-center">
                RFID-CHIP ENCODING
              </div>
              
              {/* Simulated barcode bars */}
              <div className="flex justify-center items-stretch h-10 gap-[1px] opacity-85 px-4 overflow-hidden">
                <div className="w-[1.5px] bg-black" />
                <div className="w-[2.5px] bg-black" />
                <div className="w-[1.5px] bg-transparent" />
                <div className="w-[1.5px] bg-black" />
                <div className="w-[5px] bg-black" />
                <div className="w-[1.5px] bg-black" />
                <div className="w-[2.5px] bg-transparent" />
                <div className="w-[3.5px] bg-black" />
                <div className="w-[1.5px] bg-black" />
                <div className="w-[1.5px] bg-transparent" />
                <div className="w-[2.5px] bg-black" />
                <div className="w-[1.5px] bg-black" />
                <div className="w-[5px] bg-black" />
                <div className="w-[2.5px] bg-transparent" />
                <div className="w-[1.5px] bg-black" />
                <div className="w-[3.5px] bg-black" />
                <div className="w-[1.5px] bg-transparent" />
                <div className="w-[2.5px] bg-black" />
                <div className="w-[5px] bg-black" />
                <div className="w-[1.5px] bg-black" />
                <div className="w-[1.5px] bg-transparent" />
                <div className="w-[3.5px] bg-black" />
              </div>
              
              <div className="text-[11px] font-mono font-bold tracking-widest text-neutral-500 uppercase text-center">
                *{user?.uid ? user.uid.substring(0, 10).toUpperCase() : 'DEMOUSER123'}*
              </div>
            </div>

            {/* Mini Stat counters */}
            <div className="w-full grid grid-cols-2 gap-2 border-t border-neutral-100 pt-5 text-center text-sm">
              <div className="space-y-1.5 border-r border-neutral-100">
                <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider block">Seminars</span>
                <span className="font-extrabold text-neutral-800 flex items-center justify-center gap-1.5 text-lg">
                  <Ticket className="w-5 h-5 text-indigo-500" />
                  {myRegs.length}
                </span>
              </div>
              <div className="space-y-1.5">
                <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider block">Check-ins</span>
                <span className="font-extrabold text-neutral-800 flex items-center justify-center gap-1.5 text-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  {checkedInCount}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
