// Deterministic star particles — no Math.random()
const MGMT_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  w: (i * 5 + 2) % 3 + 1,
  x: (i * 37 + 11) % 97, y: (i * 53 + 7) % 93,
  o: ((i * 13) % 35) / 100 + 0.15,
  dur: (i * 7) % 8 + 4, delay: (i * 3) % 5,
  c: ['#00ff88', '#00d4ff', '#a855f7', '#10b981'][i % 4],
}));

import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getTournamentRegistrations,
  exportParticipants,
  updateTournamentStatus,
  removeRegistration,
  completeRefund,
} from '../api/organizer';
import { formatDateIndian } from '../utils/dateFormat';
import {
  Users,
  Download,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Trash2,
  Check,
  X,
  Image,
  Eye,
  ZoomIn,
  AlertTriangle,
  CreditCard,
  QrCode,
  RefreshCw,
  Filter,
  FileJson,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';

// Helper to get proper image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  }
  return url;
};

export default function TournamentManagementPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  // Check URL params for tab (e.g., ?tab=refunds)
  const tabParam = searchParams.get('tab');
  const [filter, setFilter] = useState(tabParam === 'refunds' ? 'cancellation_requested' : 'all');
  const [exporting, setExporting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [screenshotModal, setScreenshotModal] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [refundQrModal, setRefundQrModal] = useState(null);
  const [completeRefundModal, setCompleteRefundModal] = useState(null); // { registrationId, playerName, amount }
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentScreenshotError, setPaymentScreenshotError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchRegistrations();
  }, [id]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching registrations for tournament:', id);
      const data = await getTournamentRegistrations(id);
      console.log('✅ Registrations data received:', data);
      console.log('📊 Number of registrations:', data.registrations?.length || 0);
      setRegistrations(data.registrations || []);
    } catch (error) {
      console.error('❌ Error fetching registrations:', error);
      console.error('Error response:', error.response?.data);
      setErrorMessage('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (registrationId) => {
    try {
      setActionLoading(registrationId);
      setConfirmModal(null);
      await removeRegistration(registrationId);
      await fetchRegistrations();
    } catch (error) {
      console.error('Error removing registration:', error);
      setErrorMessage('Failed to remove registration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompleteRefund = async () => {
    if (!completeRefundModal) return;
    
    if (!paymentScreenshot) {
      setPaymentScreenshotError('Please upload payment screenshot as proof');
      return;
    }

    try {
      setActionLoading(completeRefundModal.registrationId);
      
      const formData = new FormData();
      formData.append('paymentScreenshot', paymentScreenshot);
      
      await completeRefund(completeRefundModal.registrationId, formData);
      
      setCompleteRefundModal(null);
      setPaymentScreenshot(null);
      setPaymentScreenshotError('');
      await fetchRegistrations();
    } catch (error) {
      console.error('Error completing refund:', error);
      setErrorMessage(error.response?.data?.error || 'Failed to complete refund');
    } finally {
      setActionLoading(null);
    }
  };

  const openCompleteRefundModal = (registration) => {
    setCompleteRefundModal({
      registrationId: registration.id,
      playerName: registration.displayName || registration.user?.name || 'Unknown',
      amount: registration.amountTotal,
      upiId: registration.refundUpiId
    });
    setPaymentScreenshot(null);
    setPaymentScreenshotError('');
  };

  const handlePaymentScreenshotChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setPaymentScreenshotError('Please upload an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setPaymentScreenshotError('File size must be less than 5MB');
        return;
      }
      setPaymentScreenshot(file);
      setPaymentScreenshotError('');
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      const data = await exportParticipants(id, format);

      if (format === 'csv') {
        const blob = new Blob([data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament-${id}-participants.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament-${id}-participants.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
      setErrorMessage('Failed to export participants');
    } finally {
      setExporting(false);
    }
  };

  const filteredRegistrations = registrations.filter((reg) => {
    if (filter === 'all') return true;
    return reg.status === filter;
  });
  
  console.log('🔍 Filter:', filter);
  console.log('📊 Total registrations:', registrations.length);
  console.log('📊 Filtered registrations:', filteredRegistrations.length);
  if (registrations.length > 0) {
    console.log('📋 First registration:', registrations[0]);
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-amber-400" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'cancellation_requested':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      confirmed: 'badge-success',
      pending: 'badge-warning',
      cancelled: 'badge-error',
      cancellation_requested: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    };
    return styles[status] || 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 50%, #0a0a1f 100%)' }}>
        <div className="text-center">
          <div className="w-14 h-14 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'rgba(0,255,136,0.3)', borderTopColor: '#00ff88' }}></div>
          <p className="font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 40%, #0d1a2a 70%, #07071a 100%)' }}>
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(0,255,136,0.4) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, transparent 70%)' }} />
        {MGMT_PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${p.w}px`, height: `${p.w}px`,
              left: `${p.x}%`, top: `${p.y}%`,
              background: p.c, opacity: p.o,
              animation: `floatMgmt ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 4px ${p.c}`,
            }} />
        ))}
      </div>
      <style>{`
        @keyframes floatMgmt {
          0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)}
        }
      `}</style>

      {/* Header */}
      <div className="relative sticky top-0 z-20" style={{ background: 'rgba(7,7,26,0.95)', borderBottom: '1px solid rgba(0,255,136,0.15)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-3 group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          
          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-300">{errorMessage}</span>
              <button onClick={() => setErrorMessage('')} className="ml-auto text-red-400 hover:text-red-300">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #00ff88, #00c853)' }}>
                <Users className="w-6 h-6" style={{ color: '#07071a' }} />
              </div>
              <div>
                <h1 className="text-xl font-black text-white">Tournament Registrations</h1>
                <p className="text-sm font-medium" style={{ color: '#00ff88' }}>
                  {filteredRegistrations.length} registration{filteredRegistrations.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }}
              >
                <FileJson className="h-4 w-4" />
                JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #00ff88, #00c853)', color: '#07071a' }}
              >
                <FileSpreadsheet className="h-4 w-4" />
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">

        {/* Filters */}
        <div className="mb-5 flex gap-2 items-center overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <div className="flex items-center gap-2 mr-1 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <Filter className="w-4 h-4" />
            <span className="text-sm font-semibold">Filter:</span>
          </div>
          {['all', 'confirmed', 'pending', 'cancellation_requested', 'cancelled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className="px-3 py-2 rounded-xl text-sm font-bold transition-all flex-shrink-0"
              style={{
                background: filter === status
                  ? status === 'cancellation_requested'
                    ? 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(245,158,11,0.2))'
                    : 'linear-gradient(135deg, rgba(0,255,136,0.25), rgba(0,200,83,0.15))'
                  : 'rgba(255,255,255,0.05)',
                border: filter === status
                  ? status === 'cancellation_requested' ? '1px solid rgba(249,115,22,0.5)' : '1px solid rgba(0,255,136,0.4)'
                  : '1px solid rgba(255,255,255,0.1)',
                color: filter === status
                  ? status === 'cancellation_requested' ? '#fb923c' : '#00ff88'
                  : 'rgba(255,255,255,0.5)',
              }}
            >
              {status === 'cancellation_requested' ? 'Refund Requests' : status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">
                ({status === 'all' ? registrations.length : registrations.filter((r) => r.status === status).length})
              </span>
            </button>
          ))}
        </div>

        {/* Registrations — mobile cards + desktop table */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(0,255,136,0.12)', background: 'rgba(7,7,26,0.7)', backdropFilter: 'blur(20px)' }}>
          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <Users className="h-10 w-10" style={{ color: '#00ff88' }} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No registrations found</h3>
              <p style={{ color: 'rgba(255,255,255,0.4)' }}>
                {filter === 'all'
                  ? 'No one has registered for this tournament yet'
                  : `No ${filter === 'cancellation_requested' ? 'refund requests' : filter} registrations`}
              </p>
            </div>
          ) : (
            <div>
            {/* Mobile: Compact collapsible cards */}
            <div className="block md:hidden divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
              {filteredRegistrations.map((registration) => {
                const name = registration.displayName || registration.user?.name || 'Unknown';
                const isOpen = expandedId === registration.id;
                const statusColor = registration.status === 'confirmed' ? '#00ff88'
                  : registration.status === 'pending' ? '#fbbf24'
                  : registration.status === 'cancellation_requested' ? '#fb923c'
                  : 'rgba(255,255,255,0.4)';
                return (
                  <div key={registration.id}>
                    {/* ── Compact row (always visible, tap to expand) ── */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all"
                      style={{ background: isOpen ? 'rgba(0,255,136,0.03)' : 'transparent' }}
                      onClick={() => setExpandedId(isOpen ? null : registration.id)}
                    >
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,rgba(0,255,136,0.2),rgba(0,200,83,0.1))', border: '1px solid rgba(0,255,136,0.25)', color: '#00ff88' }}>
                        {name.charAt(0).toUpperCase()}
                      </div>

                      {/* Name + badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-bold text-white text-sm truncate">{name}</span>
                          {registration.isGuest && (
                            <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                              style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>Guest</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-semibold" style={{ color: '#00ff88' }}>{registration.category?.name}</span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>·</span>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{registration.category?.format}</span>
                        </div>
                      </div>

                      {/* Amount + status + chevron */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className="font-black text-sm text-white">₹{registration.amountTotal}</p>
                          <p className="text-xs font-bold" style={{ color: statusColor }}>
                            {registration.status === 'cancellation_requested' ? 'Refund' : registration.status}
                          </p>
                        </div>
                        <ChevronDown className="w-4 h-4 transition-transform flex-shrink-0"
                          style={{ color: 'rgba(255,255,255,0.35)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </div>
                    </button>

                    {/* ── Expanded details ── */}
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        {/* Contact info */}
                        {(registration.displayEmail || registration.user?.email) && (
                          <div className="flex items-center gap-2 pt-3">
                            <Mail className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
                              {registration.displayEmail || registration.user?.email}
                            </span>
                          </div>
                        )}
                        {(registration.displayPhone || registration.user?.phone) && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>
                              {registration.displayPhone || registration.user?.phone}
                            </span>
                          </div>
                        )}

                        {/* Partner */}
                        {registration.partner && (
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
                              Partner: {registration.partner.name}
                              <span style={{ color: registration.partnerConfirmed ? '#00ff88' : '#fbbf24' }}>
                                {registration.partnerConfirmed ? ' ✓ confirmed' : ' (pending)'}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* Quick Added tag */}
                        {registration.isQuickAdded && (
                          <span className="inline-block text-xs px-2 py-1 rounded-lg font-semibold"
                            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7' }}>
                            Quick Added
                          </span>
                        )}

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {registration.paymentScreenshot && (
                            <button
                              onClick={() => setScreenshotModal({ url: getImageUrl(registration.paymentScreenshot), playerName: name, amount: registration.amountTotal })}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.25)', color: '#00d4ff' }}>
                              <ZoomIn className="h-3.5 w-3.5" /> Screenshot
                            </button>
                          )}
                          {registration.status === 'cancellation_requested' && (
                            <button
                              onClick={() => setRefundQrModal({ url: getImageUrl(registration.refundQrCode), playerName: name, upiId: registration.refundUpiId, reason: registration.cancellationReason, amount: registration.refundAmount || registration.amountTotal })}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                              style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', color: '#fb923c' }}>
                              <Eye className="h-3.5 w-3.5" /> Refund Details
                            </button>
                          )}
                          {registration.status === 'cancelled' && registration.refundStatus === 'approved' && (
                            <button
                              onClick={() => openCompleteRefundModal(registration)}
                              disabled={actionLoading === registration.id}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50"
                              style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)', color: '#00ff88' }}>
                              <CreditCard className="h-3.5 w-3.5" /> Complete Refund
                            </button>
                          )}
                          {registration.status === 'cancelled' && registration.refundStatus === 'completed' && (
                            <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#00ff88' }}>
                              <CheckCircle className="h-3.5 w-3.5" /> Refund Done
                            </span>
                          )}
                          {actionLoading === registration.id && (
                            <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                              style={{ borderColor: 'rgba(0,255,136,0.3)', borderTopColor: '#00ff88' }} />
                          )}
                        </div>

                        {/* Date */}
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{formatDateIndian(registration.createdAt)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop: Table */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="min-w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,255,136,0.1)', background: 'rgba(0,255,136,0.04)' }}>
                    {['Player', 'Category', 'Partner', 'Amount', 'Payment', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-black uppercase tracking-wider" style={{ color: 'rgba(0,255,136,0.7)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((registration) => (
                    <tr key={registration.id} className="transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,255,136,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                            style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88' }}>
                            {(registration.displayName || registration.user?.name || '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <div className="text-white font-bold text-sm">{registration.displayName || registration.user?.name || 'Unknown'}</div>
                              {registration.isGuest && <span className="text-xs px-1 py-0.5 rounded" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>Guest</span>}
                            </div>
                            <div className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              <Mail className="h-3 w-3" />{registration.displayEmail || registration.user?.email || '—'}
                            </div>
                            {(registration.displayPhone || registration.user?.phone) && (
                              <div className="text-xs flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                <Phone className="h-3 w-3" />{registration.displayPhone || registration.user?.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-white text-sm font-semibold">{registration.category.name}</div>
                        <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{registration.category.format} · {registration.category.gender}</div>
                      </td>
                      <td className="px-5 py-4">
                        {registration.partner ? (
                          <div>
                            <div className="text-white text-sm">{registration.partner.name}</div>
                            <div className="text-xs">
                              {registration.partnerConfirmed
                                ? <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Confirmed</span>
                                : <span className="text-amber-400 flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>}
                            </div>
                          </div>
                        ) : registration.partnerEmail ? (
                          <div>
                            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{registration.partnerEmail}</div>
                            <span className="text-amber-400 text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                          </div>
                        ) : <span style={{ color: 'rgba(255,255,255,0.25)' }}>N/A</span>}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-black text-white">₹{registration.amountTotal}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{registration.paymentStatus}</span>
                          {registration.isQuickAdded && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>Quick</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        {registration.paymentScreenshot ? (
                          <button onClick={() => setScreenshotModal({ url: getImageUrl(registration.paymentScreenshot), playerName: registration.displayName || registration.user?.name || 'Unknown', amount: registration.amountTotal })} className="group relative">
                            <img src={getImageUrl(registration.paymentScreenshot)} alt="Payment"
                              className="w-12 h-12 object-cover rounded-xl transition-all group-hover:ring-2"
                              style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-xl flex items-center justify-center transition-all">
                              <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            <Image className="w-4 h-4" /><span className="text-xs">None</span>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(registration.status)}
                          <span className={`badge ${getStatusBadge(registration.status)} text-xs`}>
                            {registration.status === 'cancellation_requested' ? 'Refund' : registration.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {formatDateIndian(registration.createdAt)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          {registration.status === 'pending' && <span className="text-amber-400 text-xs flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Pending Admin</span>}
                          {registration.status === 'confirmed' && <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />Registered</span>}
                          {registration.status === 'rejected' && <span className="text-red-400 text-xs flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />Rejected</span>}
                          {registration.status === 'cancelled' && !registration.refundStatus && <span className="text-xs italic" style={{ color: 'rgba(255,255,255,0.3)' }}>No actions</span>}
                          {registration.status === 'cancellation_requested' && (
                            <>
                              <button onClick={() => setRefundQrModal({ url: getImageUrl(registration.refundQrCode), playerName: registration.displayName || registration.user?.name || 'Unknown', upiId: registration.refundUpiId, reason: registration.cancellationReason, amount: registration.refundAmount || registration.amountTotal })}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all w-full justify-center"
                                style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' }}>
                                <Eye className="h-3.5 w-3.5" /> Details
                              </button>
                              <span className="text-orange-400 text-xs flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" />Awaiting Admin</span>
                            </>
                          )}
                          {registration.status === 'cancelled' && registration.refundStatus === 'approved' && (
                            <button onClick={() => openCompleteRefundModal(registration)} disabled={actionLoading === registration.id}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 disabled:opacity-50 transition-all w-full justify-center"
                              style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88' }}>
                              <CreditCard className="h-3.5 w-3.5" /> Refund
                            </button>
                          )}
                          {registration.status === 'cancelled' && registration.refundStatus === 'completed' && (
                            <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" />Done</span>
                          )}
                          {actionLoading === registration.id && <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(0,255,136,0.3)', borderTopColor: '#00ff88' }}></div>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </div>
          )}
        </div>
      </div>


      {/* Screenshot Modal */}
      {screenshotModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setScreenshotModal(null)}>
          <div className="rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-scale-in"
            style={{ background: '#0d1117', border: '1px solid rgba(0,255,136,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div>
                <h3 className="text-base font-black text-white">Payment Screenshot</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  From <span style={{ color: '#00ff88' }}>{screenshotModal.playerName}</span> · ₹{screenshotModal.amount}
                </p>
              </div>
              <button onClick={() => setScreenshotModal(null)} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-4 max-h-[65vh] overflow-auto" style={{ background: 'rgba(0,0,0,0.3)' }}>
              <img src={screenshotModal.url} alt="Payment Screenshot" className="w-full h-auto rounded-xl shadow-lg" />
            </div>
            <div className="p-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Verify amount matches ₹{screenshotModal.amount}</p>
              <button onClick={() => setScreenshotModal(null)} className="px-4 py-2 rounded-xl text-white font-bold text-sm transition-all" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div 
          className="modal-overlay"
          onClick={() => setConfirmModal(null)}
        >
          <div 
            className="modal-content max-w-md animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Remove Modal */}
            {confirmModal.type === 'remove' && (
              <>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
                    <Trash2 className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Remove Registration?</h3>
                  <p className="text-gray-400">
                    Remove <span className="text-red-400 font-medium">{confirmModal.registration.displayName || confirmModal.registration.user?.name || 'Unknown'}</span>'s registration permanently.
                  </p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
                  <p className="text-sm text-red-300 font-medium mb-2">This will:</p>
                  <ul className="text-sm text-red-200/80 space-y-1">
                    <li>• Permanently delete the registration</li>
                    <li>• Cannot be undone</li>
                  </ul>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 py-3 px-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRemove(confirmModal.registration.id)}
                    disabled={actionLoading}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Remove
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Refund Details Modal */}
      {refundQrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setRefundQrModal(null)}>
          <div className="rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-scale-in"
            style={{ background: '#0d1117', border: '1px solid rgba(249,115,22,0.3)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(249,115,22,0.08)' }}>
              <div>
                <h3 className="text-base font-black text-white">Refund Request Details</h3>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  From <span style={{ color: '#fb923c' }}>{refundQrModal.playerName}</span>
                </p>
              </div>
              <button onClick={() => setRefundQrModal(null)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="rounded-xl p-4" style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <div className="flex items-center gap-2 mb-1" style={{ color: '#00ff88' }}>
                  <CreditCard className="w-4 h-4" /><span className="text-sm font-bold">Refund Amount</span>
                </div>
                <p className="text-2xl font-black text-white">₹{refundQrModal.amount}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                <div className="flex items-center gap-2 mb-1" style={{ color: '#00d4ff' }}>
                  <QrCode className="w-4 h-4" /><span className="text-sm font-bold">Player's UPI ID</span>
                </div>
                <p className="text-base font-mono text-white">{refundQrModal.upiId || 'Not provided'}</p>
              </div>
              <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  <AlertTriangle className="w-4 h-4" /><span className="text-sm font-bold">Cancellation Reason</span>
                </div>
                <p className="text-white text-sm">{refundQrModal.reason || 'No reason provided'}</p>
              </div>
              {refundQrModal.url && (
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-bold text-center mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Player's Payment QR Code</p>
                  <img src={refundQrModal.url} alt="Refund QR Code" className="w-full max-w-xs mx-auto rounded-xl shadow-lg block" />
                </div>
              )}
            </div>
            <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setRefundQrModal(null)} className="w-full px-4 py-3 rounded-xl text-white font-bold transition-all" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Refund Modal - Upload Payment Screenshot */}
      {completeRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full my-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">Complete Refund</h2>
                    <p className="text-green-100 text-sm mt-1">Upload payment proof</p>
                  </div>
                </div>
                <button
                  onClick={() => setCompleteRefundModal(null)}
                  disabled={actionLoading}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
                  <p className="text-gray-300 mb-2">
                    You are completing the refund for <span className="font-semibold text-white">{completeRefundModal.playerName}</span>
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Refund Amount:</span>
                    <span className="text-2xl font-bold text-white">₹{completeRefundModal.amount}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-gray-400">UPI ID:</span>
                    <span className="text-white font-mono">{completeRefundModal.upiId}</span>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
                  <p className="text-amber-300 text-sm">
                    <strong>Important:</strong> Please send ₹{completeRefundModal.amount} to the player's UPI ID via your UPI app (Google Pay, PhonePe, Paytm, etc.), then upload the payment screenshot as proof.
                  </p>
                </div>

                {/* Payment Screenshot Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    Payment Screenshot <span className="text-red-400">*</span>
                  </label>
                  <p className="text-gray-500 text-sm mb-3">
                    Upload a screenshot of the successful payment from your UPI app
                  </p>
                  
                  <input
                    type="file"
                    id="payment-screenshot-input"
                    onChange={handlePaymentScreenshotChange}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  <label
                    htmlFor="payment-screenshot-input"
                    className={`w-full px-4 py-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                      paymentScreenshot 
                        ? 'border-green-500/50 bg-green-500/10' 
                        : 'border-white/20 hover:border-white/30 hover:bg-slate-700/30'
                    }`}
                  >
                    {paymentScreenshot ? (
                      <>
                        <CheckCircle className="h-10 w-10 text-green-400" />
                        <span className="text-green-300 font-medium text-center">{paymentScreenshot.name}</span>
                        <span className="text-green-400/80 text-sm">Click to change</span>
                      </>
                    ) : (
                      <>
                        <Image className="h-10 w-10 text-gray-500" />
                        <span className="text-gray-400 font-medium">Upload Payment Screenshot</span>
                        <span className="text-gray-500 text-sm">PNG, JPG up to 5MB</span>
                      </>
                    )}
                  </label>
                  
                  {paymentScreenshotError && (
                    <p className="text-red-400 text-sm mt-2">{paymentScreenshotError}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setCompleteRefundModal(null)}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-300 hover:bg-slate-700/50 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCompleteRefund}
                  disabled={actionLoading || !paymentScreenshot}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Mark as Completed
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

