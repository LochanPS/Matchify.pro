import { getErrorMessage } from '../utils/errorMessage';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { ArrowLeft, AlertTriangle, X, Clock } from 'lucide-react';

export default function RefundIssuePage() {
  const { registrationId } = useParams();
  const navigate = useNavigate();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { fetchRegistration(); }, [registrationId]);

  const fetchRegistration = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/registrations/${registrationId}`);
      setRegistration(response.data.registration);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load registration'));
    } finally {
      setLoading(false);
    }
  };

  const BG = 'linear-gradient(180deg,#0a0a1f 0%,#07071a 50%,#0a0a1f 100%)';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'rgba(239,68,68,0.3)', borderTopColor: '#ef4444' }} />
          <p className="mt-4 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: BG }}>
        <div className="rounded-2xl p-8 text-center w-full" style={{ maxWidth: '400px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.15)' }}>
            <X className="w-7 h-7 text-red-400" />
          </div>
          <h2 className="text-lg font-black text-white mb-2">Error</h2>
          <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.6)' }}>{error}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2.5 rounded-xl font-bold text-sm" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.12)' }}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: BG }}>
      {/* Fixed bg glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle,rgba(239,68,68,0.5) 0%,transparent 70%)' }} />
        <div className="absolute bottom-1/3 left-0 w-56 h-56 rounded-full blur-3xl opacity-10" style={{ background: 'radial-gradient(circle,rgba(251,191,36,0.5) 0%,transparent 70%)' }} />
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-20" style={{ background: 'rgba(7,7,26,0.95)', borderBottom: '1px solid rgba(239,68,68,0.2)', backdropFilter: 'blur(20px)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 ml-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-black text-white">Refund Issue</span>
          </div>
        </div>
      </div>

      <div className="relative px-4 py-5 space-y-4">
        {/* Hero banner */}
        <div className="rounded-2xl p-5 flex items-center gap-4" style={{ background: 'linear-gradient(135deg,rgba(239,68,68,0.2),rgba(251,191,36,0.1))', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }}>
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Refund Not Received?</h1>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.55)' }}>Report your issue to the organizer</p>
          </div>
        </div>

        {/* Refund details card */}
        {registration && (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)' }}>
              <h2 className="text-sm font-black text-white">Refund Details</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Tournament', value: registration.tournament?.name },
                { label: 'Refund Amount', value: `₹${registration.refundAmount || registration.amountTotal}`, highlight: true },
                { label: 'Your UPI ID', value: registration.refundUpiId || 'N/A', mono: true },
              ].map(({ label, value, highlight, mono }) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-xs flex-shrink-0" style={{ color: 'rgba(255,255,255,0.45)' }}>{label}</span>
                  <span
                    className={`text-sm font-bold truncate text-right ${mono ? 'font-mono' : ''}`}
                    style={{ color: highlight ? '#00ff88' : 'white' }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coming soon notice */}
        <div className="rounded-2xl p-4 flex items-start gap-3" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
          <Clock className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#fbbf24' }} />
          <div>
            <p className="text-sm font-bold" style={{ color: '#fbbf24' }}>Feature Coming Soon</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(251,191,36,0.7)' }}>
              More options to report and track your refund issue will be available here. Contact your tournament organizer directly for now.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full py-3 rounded-2xl font-bold text-sm transition-all"
          style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
