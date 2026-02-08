import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Trophy, Clipboard, Scale } from 'lucide-react';

const RoleSwitcher = () => {
  const { user, currentRole, switchRole } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  // Parse roles from comma-separated string
  const userRoles = user.roles ? user.roles.split(',') : [];

  // If user only has one role, don't show switcher
  if (userRoles.length <= 1) return null;

  const roleConfig = {
    PLAYER: {
      icon: Trophy,
      label: 'Player',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
    },
    ORGANIZER: {
      icon: Clipboard,
      label: 'Organizer',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
    },
    UMPIRE: {
      icon: Scale,
      label: 'Umpire',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
    },
    ADMIN: {
      icon: User,
      label: 'Admin',
      color: 'bg-red-500',
      hoverColor: 'hover:bg-red-600',
    },
  };

  const CurrentIcon = roleConfig[currentRole]?.icon || User;
  const currentConfig = roleConfig[currentRole] || roleConfig.PLAYER;

  const handleRoleSwitch = (role) => {
    switchRole(role);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Current Role Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${currentConfig.color} ${currentConfig.hoverColor} transition-colors`}
      >
        <CurrentIcon className="w-5 h-5" />
        <span className="font-medium">{currentConfig.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-200">
              Switch Role
            </div>
            {userRoles.map((role) => {
              const config = roleConfig[role];
              const Icon = config.icon;
              const isActive = role === currentRole;

              return (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={isActive}
                >
                  <div className={`p-1.5 rounded ${config.color} text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-medium">{config.label}</span>
                  {isActive && (
                    <svg
                      className="w-4 h-4 ml-auto text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default RoleSwitcher;
