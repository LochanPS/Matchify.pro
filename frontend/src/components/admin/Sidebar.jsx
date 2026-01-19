import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const Sidebar = () => {
  const location = useLocation();
  const [pendingPayments, setPendingPayments] = useState(0);

  useEffect(() => {
    fetchPendingPayments();
    // Poll every 30 seconds
    const interval = setInterval(fetchPendingPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await api.get('/kyc/admin/payments', {
        params: { status: 'PENDING' }
      });
      setPendingPayments(response.data.payments?.length || 0);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
    }
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
    { path: '/admin/users', icon: '👥', label: 'User Management' },
    { path: '/admin/kyc', icon: '🛡️', label: 'KYC Management' },
    { path: '/admin/kyc/phone-verifications', icon: '📱', label: 'Phone Verifications' },
    { path: '/admin/kyc/payments', icon: '💰', label: 'Payment Verification', badge: pendingPayments },
    { path: '/admin/invites', icon: '✉️', label: 'Admin Invites' },
    { path: '/admin/academies', icon: '🏢', label: 'Academy Approvals' },
    { path: '/admin/audit-logs', icon: '📋', label: 'Audit Logs' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400">Matchify.pro</h1>
        <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                    {item.badge}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link
          to="/"
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition"
        >
          <span className="text-xl">🏠</span>
          <span className="font-medium">Back to Site</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
