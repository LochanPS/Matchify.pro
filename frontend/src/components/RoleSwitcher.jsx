import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoleSwitcher() {
  const [currentRole, setCurrentRole] = useState('PLAYER');
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.roles) {
      setRoles(user.roles);
      setCurrentRole(user.currentRole || user.roles[0]);
    }
  }, []);

  const switchRole = (role) => {
    setCurrentRole(role);
    const user = JSON.parse(localStorage.getItem('user'));
    user.currentRole = role;
    localStorage.setItem('user', JSON.stringify(user));

    const routes = { 
      PLAYER: '/dashboard', 
      ORGANIZER: '/organizer/dashboard', 
      UMPIRE: '/umpire/dashboard' 
    };
    navigate(routes[role]);
  };

  if (roles.length <= 1) return null;

  return (
    <div className="flex gap-2 bg-gray-100 p-2 rounded-lg">
      <span className="text-sm text-gray-600 px-2 py-1">Switch Role:</span>
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => switchRole(role)}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            currentRole === role 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {role}
        </button>
      ))}
    </div>
  );
}