import React from 'react';
import { UserRole } from '../types';
import { Shield, Sparkles, User, HelpCircle } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  isRealProfileSyncing: boolean;
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentRole,
  onRoleChange,
  isRealProfileSyncing
}) => {
  const roles: { value: UserRole; label: string; icon: React.ReactNode; color: string; desc: string }[] = [
    {
      value: 'Attendee',
      label: 'Attendee',
      icon: <User className="w-4 h-4" />,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      desc: 'Browse seminars, register, check-in, and view your active registration tickets.'
    },
    {
      value: 'Organizer',
      label: 'Organizer',
      icon: <Sparkles className="w-4 h-4" />,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      desc: 'Create recurring seminars, manage speaker-led sessions, and monitor live check-ins.'
    },
    {
      value: 'Admin',
      label: 'System Admin',
      icon: <Shield className="w-4 h-4" />,
      color: 'bg-sky-50 text-sky-700 border-sky-200',
      desc: 'Oversee all platform operations, manage registered seminars, and export system-wide analytics.'
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-display font-bold text-neutral-800 text-lg sm:text-xl flex items-center gap-2">
            <Shield className="w-5.5 h-5.5 text-sky-500" />
            Evaluation Sandbox
          </h3>
          <p className="text-sm text-neutral-500 mt-1">
            Switch roles instantly to test different workflows of the platform.
          </p>
        </div>
        {isRealProfileSyncing && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-100 text-neutral-600 animate-pulse">
            Syncing...
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const isActive = currentRole === role.value;
          return (
            <button
              key={role.value}
              onClick={() => onRoleChange(role.value)}
              className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
                isActive
                  ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/10'
                  : 'border-neutral-200 hover:border-neutral-300 bg-neutral-50/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg border ${
                    isActive ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-neutral-500 border-neutral-200 group-hover:border-neutral-300'
                  }`}
                >
                  {role.icon}
                </div>
                <span className="font-bold text-base text-neutral-800">
                  {role.label}
                </span>
              </div>
              <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
                {role.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
