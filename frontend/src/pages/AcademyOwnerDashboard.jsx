import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Calendar, TrendingUp, Clock,
  CheckCircle, XCircle, AlertCircle, ChevronRight,
  IndianRupee, Users, Layers, Settings, ArrowLeft
} from 'lucide-react';
import api from '../utils/api';

const B = {
  bg: '#0a0a0f',
  card: '#12121a',
  card2: '#1a1a26',
  border: 'rgba(255,255,255,0.07)',
  cyan: '#00d4ff',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#a855f7',
  text: 'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.45)',
};

const StatCard = ({ icon: Icon, label, value, color = B.cyan, sub }) => (
  <div className="rounded-2xl p-4" style={{ background: B.card, border: `1px solid ${B.border}` }}>
    <div className="flex items-center gap-3 mb-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon size={18} color={color} />
      </div>
      <p className="text-xs font-bold" style={{ color: B.muted }}>{label}</p>
    </div>
    <p className="text-2xl font-black text-white">{value}</p>
    {sub && <p className="text-xs mt-0.5" style={{ color: B.muted }}>{sub}</p>}
  </div>
);

const QuickAction = ({ icon: Icon, label, desc, color, onClick }) => (
  <button
    onClick={onClick}
    className="w-full rounded-2xl p-4 text-left flex items-center gap-4 transition-all active:scale-95"
    style={{ background: B.card, border: `1px solid ${B.border}` }}
  >
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
      <Icon size={20} color={color} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-black text-white">{label}</p>
      <p className="text-xs mt-0.5" style={{ color: B.muted }}>{desc}</p>
    </div>
    <ChevronRight size={16} color={B.muted} />
  </button>
);

export default function AcademyOwnerDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      const res = await api.get('/owner/dashboard');
      setData(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: B.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid rgba(0,212,255,0.15)', borderTopColor: B.cyan, animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: B.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: 16 }}>
        <XCircle size={48} color={B.red} />
        <p className="text-white font-black text-lg">{error}</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl font-black text-white" style={{ background: B.cyan + '20', border: `1px solid ${B.cyan}40` }}>
          Go Back
        </button>
      </div>
    );
  }

  // No academy yet
  if (!data?.hasAcademy) {
    return (
      <div style={{ minHeight: '100vh', background: B.bg, display: 'flex', flexDirection: 'column', padding: '0 0 40px' }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-12 pb-6">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <ArrowLeft size={16} color={B.text} />
          </button>
          <h1 className="text-xl font-black text-white">My Academy</h1>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-6">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: `${B.cyan}15`, border: `1px solid ${B.cyan}30` }}>
            <Building2 size={36} color={B.cyan} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white mb-2">No Academy Yet</h2>
            <p style={{ color: B.muted }} className="text-sm leading-relaxed">
              List your academy on Matchify to reach players, manage court bookings and grow your business.
            </p>
          </div>
          <button
            onClick={() => navigate('/academies/add')}
            className="w-full max-w-xs py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${B.cyan}, #0099bb)`, color: '#000' }}
          >
            <Plus size={18} />
            List My Academy
          </button>
          <button
            onClick={() => navigate('/academies')}
            className="text-sm font-bold"
            style={{ color: B.muted }}
          >
            Browse Academies →
          </button>
        </div>
      </div>
    );
  }

  const { academies, stats } = data;
  const academy = academies[0]; // Primary academy

  return (
    <div style={{ minHeight: '100vh', background: B.bg, paddingBottom: 40 }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4">
        <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <ArrowLeft size={16} color={B.text} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-black text-white">My Academy</h1>
          <p className="text-xs" style={{ color: B.muted }}>{academy.name}</p>
        </div>
        <button
          onClick={() => navigate(`/owner/academies/${academy.id}/edit`)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: B.card, border: `1px solid ${B.border}` }}
        >
          <Settings size={16} color={B.cyan} />
        </button>
      </div>

      <div className="px-4 space-y-4">
        {/* Academy card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${B.border}` }}>
            <div className="flex items-center gap-2">
              <Building2 size={16} color={B.cyan} />
              <p className="text-sm font-black text-white">Academy Status</p>
            </div>
            <span className="text-xs font-black px-2.5 py-1 rounded-full" style={{
              background: academy.status === 'approved' ? `${B.green}20` : `${B.amber}20`,
              color: academy.status === 'approved' ? B.green : B.amber
            }}>
              {academy.status === 'approved' ? '✓ Live' : academy.status.toUpperCase()}
            </span>
          </div>
          <div className="p-4">
            <p className="font-black text-white">{academy.name}</p>
            <p className="text-xs mt-0.5" style={{ color: B.muted }}>{academy.city}, {academy.state}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {academy.sports?.map(s => (
                <span key={s} className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${B.cyan}15`, color: B.cyan }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Calendar} label="Total Bookings" value={stats.totalBookings} color={B.cyan} />
          <StatCard icon={AlertCircle} label="Pending" value={stats.pendingBookings} color={B.amber} sub="awaiting verification" />
          <StatCard icon={CheckCircle} label="Confirmed" value={stats.confirmedBookings} color={B.green} />
          <StatCard icon={IndianRupee} label="Revenue" value={`₹${(stats.totalRevenue || 0).toLocaleString('en-IN')}`} color={B.purple} sub="confirmed bookings" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Layers} label="Courts" value={stats.totalCourts} color={B.cyan} sub="active courts" />
          <StatCard icon={Clock} label="Today" value={stats.todayBookings} color={B.green} sub="bookings today" />
        </div>

        {/* Quick actions */}
        <div className="space-y-2">
          <p className="text-xs font-black px-1" style={{ color: B.muted }}>MANAGE</p>

          {stats.pendingBookings > 0 && (
            <button
              onClick={() => navigate(`/owner/academies/${academy.id}/bookings`)}
              className="w-full rounded-2xl p-4 flex items-center gap-4"
              style={{ background: `${B.amber}10`, border: `1px solid ${B.amber}30` }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${B.amber}20` }}>
                <AlertCircle size={20} color={B.amber} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white">{stats.pendingBookings} Booking{stats.pendingBookings > 1 ? 's' : ''} Need Verification</p>
                <p className="text-xs mt-0.5" style={{ color: B.amber }}>Tap to verify payments</p>
              </div>
              <ChevronRight size={16} color={B.amber} />
            </button>
          )}

          <QuickAction
            icon={Layers}
            label="Manage Courts"
            desc={`${stats.totalCourts} active court${stats.totalCourts !== 1 ? 's' : ''} · Add, edit, set availability`}
            color={B.cyan}
            onClick={() => navigate(`/owner/academies/${academy.id}/courts`)}
          />

          <QuickAction
            icon={Calendar}
            label="All Bookings"
            desc="View and manage all court bookings"
            color={B.green}
            onClick={() => navigate(`/owner/academies/${academy.id}/bookings`)}
          />

          <QuickAction
            icon={Settings}
            label="Edit Academy Details"
            desc="Update photos, UPI, hours, amenities"
            color={B.purple}
            onClick={() => navigate(`/owner/academies/${academy.id}/edit`)}
          />
        </div>

        {/* Multiple academies */}
        {academies.length > 1 && (
          <div className="space-y-2">
            <p className="text-xs font-black px-1" style={{ color: B.muted }}>OTHER ACADEMIES</p>
            {academies.slice(1).map(a => (
              <button
                key={a.id}
                onClick={() => navigate(`/owner/academies/${a.id}/courts`)}
                className="w-full rounded-2xl p-4 flex items-center gap-3"
                style={{ background: B.card, border: `1px solid ${B.border}` }}
              >
                <Building2 size={16} color={B.muted} />
                <div className="flex-1 text-left">
                  <p className="text-sm font-black text-white">{a.name}</p>
                  <p className="text-xs" style={{ color: B.muted }}>{a.city}</p>
                </div>
                <ChevronRight size={14} color={B.muted} />
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate('/academies/add')}
          className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
          style={{ background: B.card, border: `1px solid ${B.border}`, color: B.muted }}
        >
          <Plus size={16} />
          List Another Academy
        </button>
      </div>
    </div>
  );
}
