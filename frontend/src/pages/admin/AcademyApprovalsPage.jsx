import { useState, useEffect } from 'react';
import {
  Building2, CheckCircle, XCircle, Eye, MapPin, Phone,
  Mail, Globe, Loader2, ChevronDown, ChevronUp, BadgeCheck,
  Clock, AlertCircle, Instagram
} from 'lucide-react';
import api from '../../utils/api';

const LISTING_FEE = 300;

const SPORT_EMOJIS = {
  Badminton: '🏸', Tennis: '🎾', 'Table Tennis': '🏓', Squash: '🎱',
  Basketball: '🏀', Volleyball: '🏐', Swimming: '🏊', Cricket: '🏏',
  Football: '⚽', Gym: '💪', Yoga: '🧘', Athletics: '🏃',
};

const AMENITY_LABELS = {
  parking: 'Parking', changing_room: 'Changing Rooms', water: 'Water Dispenser',
  cafeteria: 'Cafeteria', ac: 'AC Courts', shuttle_shop: 'Shuttle Shop',
  first_aid: 'First Aid', wifi: 'WiFi', spectator: 'Spectator Seating', coaching: 'Coaching',
};

export default function AcademyApprovalsPage() {
  const [tab, setTab] = useState('pending');
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null); // expanded card id
  const [rejectReasons, setRejectReasons] = useState({});
  const [actionLoading, setActionLoading] = useState(null); // id being actioned
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAcademies = async () => {
    try {
      setLoading(true);
      let res;
      if (tab === 'pending') {
        res = await api.get('/academies/admin/pending');
        setAcademies(
          (res.data?.data?.academies || []).map(a => ({
            ...a,
            sports: typeof a.sports === 'string' ? JSON.parse(a.sports || '[]') : a.sports,
            sportDetails: typeof a.sportDetails === 'string' ? JSON.parse(a.sportDetails || '{}') : a.sportDetails,
            amenities: typeof a.amenities === 'string' ? JSON.parse(a.amenities || '[]') : (a.amenities || []),
            photos: typeof a.photos === 'string' ? JSON.parse(a.photos || '[]') : (a.photos || []),
          }))
        );
      } else {
        res = await api.get(`/academies/admin/all?status=${tab}`);
        setAcademies(
          (res.data?.data?.academies || []).map(a => ({
            ...a,
            sports: typeof a.sports === 'string' ? JSON.parse(a.sports || '[]') : a.sports,
            sportDetails: typeof a.sportDetails === 'string' ? JSON.parse(a.sportDetails || '{}') : a.sportDetails,
            amenities: typeof a.amenities === 'string' ? JSON.parse(a.amenities || '[]') : (a.amenities || []),
            photos: typeof a.photos === 'string' ? JSON.parse(a.photos || '[]') : (a.photos || []),
          }))
        );
      }
    } catch (err) {
      showToast('Failed to load academies', false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAcademies(); setExpanded(null); }, [tab]);

  const approve = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/academies/admin/${id}/approve`);
      setAcademies(p => p.filter(a => a.id !== id));
      setExpanded(null);
      showToast('Academy approved ✓');
    } catch { showToast('Failed to approve', false); }
    finally { setActionLoading(null); }
  };

  const reject = async (id) => {
    const reason = rejectReasons[id] || '';
    setActionLoading(id + '_reject');
    try {
      await api.post(`/academies/admin/${id}/reject`, { reason: reason || 'Payment verification failed' });
      setAcademies(p => p.filter(a => a.id !== id));
      setExpanded(null);
      showToast('Academy rejected');
    } catch { showToast('Failed to reject', false); }
    finally { setActionLoading(null); }
  };

  const TabBtn = ({ id, label, count }) => (
    <button
      onClick={() => setTab(id)}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all"
      style={{
        background: tab === id ? 'rgba(255,255,255,0.1)' : 'transparent',
        color: tab === id ? '#fff' : 'rgba(255,255,255,0.4)',
        border: tab === id ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
      }}
    >
      {label}
      {count != null && (
        <span className="px-1.5 py-0.5 rounded-full text-xs"
          style={{
            background: id === 'pending' ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.08)',
            color: id === 'pending' ? '#fbbf24' : 'rgba(255,255,255,0.5)',
          }}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen p-6" style={{ background: '#07071a' }}>

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-bold shadow-lg"
          style={{
            background: toast.ok ? 'rgba(0,255,136,0.9)' : 'rgba(239,68,68,0.9)',
            color: '#07071a',
          }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-3">
            <Building2 className="w-6 h-6" style={{ color: '#a855f7' }} />
            Academy Listings
          </h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Listing fee: ₹{LISTING_FEE} per academy
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <TabBtn id="pending" label="Pending" count={tab === 'pending' ? academies.length : null} />
        <TabBtn id="approved" label="Approved" />
        <TabBtn id="rejected" label="Rejected" />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-7 h-7 animate-spin" style={{ color: '#a855f7' }} />
        </div>
      ) : academies.length === 0 ? (
        <div className="text-center py-16 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
          <p className="text-base font-bold text-white">No {tab} academies</p>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {tab === 'pending' ? 'All submissions reviewed' : `No ${tab} academies yet`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {academies.map(academy => {
            const isExpanded = expanded === academy.id;
            const isActioning = actionLoading === academy.id || actionLoading === academy.id + '_reject';
            return (
              <div key={academy.id} className="rounded-2xl overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>

                {/* Card header — always visible */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-base font-black text-white truncate">{academy.name}</h3>
                        {academy.isVerified && (
                          <BadgeCheck className="w-4 h-4 flex-shrink-0" style={{ color: '#00ff88' }} />
                        )}
                        {tab === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                            Awaiting
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs mb-2"
                        style={{ color: 'rgba(255,255,255,0.45)' }}>
                        <MapPin className="w-3 h-3" />
                        {academy.city}, {academy.state}
                        {academy.phone && <>
                          <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                          <Phone className="w-3 h-3" />
                          {academy.phone}
                        </>}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {academy.sports?.slice(0, 4).map(s => (
                          <span key={s} className="px-2 py-0.5 rounded-full text-xs font-bold"
                            style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc' }}>
                            {SPORT_EMOJIS[s]} {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons — pending only */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {tab === 'pending' && (
                        <>
                          <button onClick={() => approve(academy.id)} disabled={isActioning}
                            className="px-3 py-1.5 rounded-xl text-xs font-black transition-all disabled:opacity-50"
                            style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>
                            {actionLoading === academy.id
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : '✓ Approve'}
                          </button>
                          <button onClick={() => reject(academy.id)} disabled={isActioning}
                            className="px-3 py-1.5 rounded-xl text-xs font-black transition-all disabled:opacity-50"
                            style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                            {actionLoading === academy.id + '_reject'
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : '✗ Reject'}
                          </button>
                        </>
                      )}
                      <button onClick={() => setExpanded(isExpanded ? null : academy.id)}
                        className="p-1.5 rounded-xl transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t"
                    style={{ borderColor: 'rgba(255,255,255,0.07)' }}>

                    {/* ── Payment Screenshot — MOST IMPORTANT ── */}
                    <div className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                          style={{ background: 'rgba(251,191,36,0.15)' }}>
                          <span style={{ fontSize: 14 }}>₹</span>
                        </div>
                        <p className="text-sm font-black text-white">
                          Payment Screenshot — ₹{LISTING_FEE}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                          style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                          Verify this first
                        </span>
                      </div>
                      {academy.paymentScreenshot ? (
                        <a href={academy.paymentScreenshot} target="_blank" rel="noopener noreferrer">
                          <img src={academy.paymentScreenshot} alt="Payment"
                            className="w-full max-h-96 object-contain rounded-xl cursor-zoom-in"
                            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }} />
                          <p className="text-xs mt-1 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                            Tap to open full size
                          </p>
                        </a>
                      ) : (
                        <div className="rounded-xl p-6 text-center"
                          style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)' }}>
                          <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: '#f87171' }} />
                          <p className="text-sm font-bold" style={{ color: '#f87171' }}>No payment screenshot</p>
                        </div>
                      )}
                    </div>

                    {/* Academy photos */}
                    {academy.photos?.length > 0 && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide mb-2"
                          style={{ color: 'rgba(255,255,255,0.35)' }}>Academy Photos</p>
                        <div className="grid grid-cols-4 gap-2">
                          {academy.photos.map((p, i) => (
                            <a key={i} href={p} target="_blank" rel="noopener noreferrer">
                              <img src={p} alt="" className="w-full aspect-square object-cover rounded-xl cursor-zoom-in" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Address', val: academy.address },
                        { label: 'Type', val: academy.type },
                        { label: 'Opening Hours', val: academy.openingHours },
                        { label: 'Monthly Fee', val: academy.monthlyFee },
                        { label: 'Email', val: academy.email || academy.submittedByEmail },
                        { label: 'Website', val: academy.website },
                        { label: 'Instagram', val: academy.instagram ? `@${academy.instagram}` : null },
                        { label: 'Submitted by', val: academy.submittedByName || academy.submittedByEmail },
                      ].filter(r => r.val).map(({ label, val }) => (
                        <div key={label} className="rounded-xl p-3"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-xs mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
                          <p className="font-bold text-white truncate">{val}</p>
                        </div>
                      ))}
                    </div>

                    {/* Sports + facilities */}
                    {academy.sports?.length > 0 && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide mb-2"
                          style={{ color: 'rgba(255,255,255,0.35)' }}>Sports & Facilities</p>
                        <div className="space-y-1.5">
                          {academy.sports.map(sport => (
                            <div key={sport} className="flex justify-between items-center px-3 py-2 rounded-xl"
                              style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
                              <span className="text-sm font-bold" style={{ color: '#c084fc' }}>
                                {SPORT_EMOJIS[sport]} {sport}
                              </span>
                              <span className="text-sm font-bold text-white">
                                {academy.sportDetails?.[sport] || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Amenities */}
                    {academy.amenities?.length > 0 && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide mb-2"
                          style={{ color: 'rgba(255,255,255,0.35)' }}>Amenities</p>
                        <div className="flex flex-wrap gap-2">
                          {academy.amenities.map(a => (
                            <span key={a} className="px-2.5 py-1 rounded-full text-xs font-bold"
                              style={{ background: 'rgba(0,212,255,0.1)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.2)' }}>
                              {AMENITY_LABELS[a] || a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {academy.description && (
                      <div className="rounded-xl p-3"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>About</p>
                        <p className="text-sm text-white leading-relaxed">{academy.description}</p>
                      </div>
                    )}

                    {/* Reject reason input */}
                    {tab === 'pending' && (
                      <div>
                        <p className="text-xs font-black uppercase tracking-wide mb-2"
                          style={{ color: 'rgba(239,68,68,0.7)' }}>Rejection Reason (optional)</p>
                        <textarea
                          value={rejectReasons[academy.id] || ''}
                          onChange={e => setRejectReasons(p => ({ ...p, [academy.id]: e.target.value }))}
                          placeholder="Payment not received / blurry screenshot / mismatch..."
                          rows={2}
                          className="w-full px-3 py-2.5 text-sm text-white rounded-xl resize-none focus:outline-none"
                          style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}
                        />
                      </div>
                    )}

                    {/* Action buttons (full width in expanded) */}
                    {tab === 'pending' && (
                      <div className="flex gap-3 pt-1">
                        <button onClick={() => reject(academy.id)} disabled={isActioning}
                          className="flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}>
                          {actionLoading === academy.id + '_reject'
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <XCircle className="w-4 h-4" />}
                          Reject
                        </button>
                        <button onClick={() => approve(academy.id)} disabled={isActioning}
                          className="flex-[2] py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
                          style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', color: '#07071a' }}>
                          {actionLoading === academy.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <CheckCircle className="w-4 h-4" />}
                          Approve ₹{LISTING_FEE} Received
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
