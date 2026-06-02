import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../../components/admin/Sidebar';
import Spinner from '../../components/Spinner';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate('/login');
      else if (!user.isAdmin && user.role !== 'ADMIN') navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Spinner size="lg" className="mx-auto" />
      </div>
    );
  }

  if (!user || (!user.isAdmin && user.role !== 'ADMIN')) return null;

  // Page title from route
  const routeTitles = {
    '/admin/users': 'User Management',
    '/admin/invites': 'Admin Invites',
    '/admin/audit-logs': 'Audit Logs',
    '/admin/academies': 'Academy Approvals',
    '/admin/academies/manage': 'All Academies',
    '/admin/payment-verifications': 'Payment Verification',
    '/admin/refund-requests': 'Refund Requests',
    '/admin/tournament-payments': 'Tournament Payments',
    '/admin/organizer-payouts': 'Organizer Payouts',
    '/admin/revenue': 'Revenue Analytics',
    '/admin/qr-settings': 'QR Code Settings',
  };
  const pageTitle = routeTitles[location.pathname] || 'Admin Panel';

  return (
    <div className="flex min-h-screen bg-slate-900">

      {/* ── Desktop sidebar ── */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* ── Mobile sidebar drawer overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] z-50 shadow-2xl"
            style={{ animation: 'slideInLeft 0.22s ease-out' }}>
            <Sidebar onClose={() => setSidebarOpen(false)} isMobile />
          </div>
        </div>
      )}

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-900 border-b border-slate-700 sticky top-0 z-40">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-white"
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <span className="text-white font-bold text-base truncate flex-1">{pageTitle}</span>
          <span className="text-xs font-bold text-teal-400 bg-teal-400/10 px-2 py-1 rounded-full">ADMIN</span>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-auto bg-slate-900">
          <Outlet />
        </div>
      </div>

      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
