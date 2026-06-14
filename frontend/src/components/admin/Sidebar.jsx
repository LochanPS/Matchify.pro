import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import MatchifyLogo from '../MatchifyLogo';
import { getPaymentVerificationStats } from '../../api/payment';

const Sidebar = ({ onClose, isMobile = false }) => {
  const location = useLocation();
  const [pendingPayments, setPendingPayments] = useState(0);

  useEffect(() => {
    getPaymentVerificationStats()
      .then(data => setPendingPayments(data?.pendingVerifications ?? data?.pending ?? 0))
      .catch(() => {});
  }, []);

  const menuItems = [
    { path: '/admin-dashboard', icon: '📊', label: 'Dashboard' },
    {
      section: 'PAYMENTS',
      items: [
        { path: '/admin/payment-verifications', icon: '💳', label: 'Payment Verification', badge: pendingPayments },
        { path: '/admin/refund-requests', icon: '💸', label: 'Refund Requests' },
        { path: '/admin/tournament-payments', icon: '🏆', label: 'Tournament Payments' },
        { path: '/admin/organizer-payouts', icon: '💰', label: 'Organizer Payouts' },
        { path: '/admin/revenue', icon: '📊', label: 'Revenue Analytics' },
        { path: '/admin/qr-settings', icon: '📱', label: 'QR Settings' },
      ]
    },
    {
      section: 'MANAGEMENT',
      items: [
        { path: '/admin/users', icon: '👥', label: 'User Management' },
        { path: '/admin/academies', icon: '🏢', label: 'Academy Approvals' },
        { path: '/admin/academies/manage', icon: '🏬', label: 'All Academies' },
        { path: '/admin/invites', icon: '✉️', label: 'Admin Invites' },
        { path: '/admin/audit-logs', icon: '📋', label: 'Audit Logs' },
      ]
    },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLinkClick = () => {
    if (isMobile && onClose) onClose();
  };

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 text-white h-full flex flex-col"
      style={{ minHeight: isMobile ? '100vh' : undefined }}>

      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between gap-2 flex-shrink-0">
        <div className="flex flex-col gap-0.5">
          <MatchifyLogo size={36} variant="full" />
          <p className="text-xs text-gray-400">Admin Panel</p>
        </div>
        {isMobile && (
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-gray-400 hover:text-white ml-auto flex-shrink-0"
            aria-label="Close menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3">
        {menuItems.map((item, index) => {
          if (item.section) {
            return (
              <div key={index} className="mt-4 first:mt-0">
                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {item.section}
                </p>
                <ul className="mt-1 space-y-0.5">
                  {item.items.map((sub) => (
                    <li key={sub.path}>
                      <Link
                        to={sub.path}
                        onClick={handleLinkClick}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                          isActive(sub.path)
                            ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30'
                            : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <span className="text-base leading-none">{sub.icon}</span>
                        <span className="font-medium flex-1">{sub.label}</span>
                        {sub.badge > 0 && (
                          <span style={{
                            minWidth: 20, height: 20,
                            padding: '0 6px',
                            borderRadius: 999,
                            background: '#ef4444',
                            color: '#fff',
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            lineHeight: 1,
                            flexShrink: 0,
                          }}>
                            {sub.badge > 99 ? '99+' : sub.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          }
          // Top-level item (Dashboard)
          return (
            <li key={item.path} className="list-none">
              <Link
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm ${
                  isActive(item.path)
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/30'
                    : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
