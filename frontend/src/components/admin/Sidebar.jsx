import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin-dashboard', icon: '📊', label: 'Dashboard' },
    { 
      section: 'PAYMENT SYSTEM',
      items: [
        { path: '/admin/payments', icon: '💼', label: 'Payment Dashboard' },
        { path: '/admin/user-ledger', icon: '📊', label: 'User Ledger' },
        { path: '/admin/payment-verifications', icon: '💳', label: 'Payment Verification' },
        { path: '/admin/tournament-payments', icon: '🏆', label: 'Tournament Payments' },
        { path: '/admin/organizer-payouts', icon: '💸', label: 'Organizer Payouts' },
        { path: '/admin/revenue', icon: '💰', label: 'Revenue Analytics' },
        { path: '/admin/qr-settings', icon: '📱', label: 'QR Code Settings' },
      ]
    },
    { path: '/admin/users', icon: '👥', label: 'User Management' },
    { path: '/admin/invites', icon: '✉️', label: 'Admin Invites' },
    { path: '/admin/academies', icon: '🏢', label: 'Academy Approvals' },
    { path: '/admin/audit-logs', icon: '📋', label: 'Audit Logs' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">MATCHIFY<span className="text-teal-400">.PRO</span></h1>
        <p className="text-sm text-gray-400 mt-1">Admin Panel</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            // Section header with sub-items
            if (item.section) {
              return (
                <li key={index} className="mt-6">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {item.section}
                  </div>
                  <ul className="mt-2 space-y-1">
                    {item.items.map((subItem) => (
                      <li key={subItem.path}>
                        <Link
                          to={subItem.path}
                          className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg transition text-sm ${
                            isActive(subItem.path)
                              ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50'
                              : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className="text-lg">{subItem.icon}</span>
                          <span className="font-medium">{subItem.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            }
            
            // Regular menu item
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition ${
                    isActive(item.path)
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-500/50'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
