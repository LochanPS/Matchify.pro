import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, Globe, Building2,
  ChevronLeft, ChevronRight, BadgeCheck, Clock, Plus,
  IndianRupee, Calendar
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const B = {
  bg: '#07071a',
  card: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.09)',
  green: '#00ff88',
  cyan: '#00d4ff',
  purple: '#a855f7',
  amber: '#fbbf24',
};

const SPORT_META = {
  Badminton:      { emoji: '🏸', color: '#00ff88', bg: 'rgba(0,255,136,0.12)',    border: 'rgba(0,255,136,0.25)',   unit: 'Courts' },
  Tennis:         { emoji: '🎾', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)',    border: 'rgba(0,212,255,0.25)',   unit: 'Courts' },
  'Table Tennis': { emoji: '🏓', color: '#a855f7', bg: 'rgba(168,85,247,0.12)',   border: 'rgba(168,85,247,0.25)',  unit: 'Tables' },
  Squash:         { emoji: '🎱', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',   border: 'rgba(251,191,36,0.25)',  unit: 'Courts' },
  Basketball:     { emoji: '🏀', color: '#f97316', bg: 'rgba(249,115,22,0.12)',   border: 'rgba(249,115,22,0.25)',  unit: 'Courts' },
  Volleyball:     { emoji: '🏐', color: '#ec4899', bg: 'rgba(236,72,153,0.12)',   border: 'rgba(236,72,153,0.25)',  unit: 'Courts' },
  Swimming:       { emoji: '🏊', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   border: 'rgba(56,189,248,0.25)',  unit: '' },
  Cricket:        { emoji: '🏏', color: '#a3e635', bg: 'rgba(163,230,53,0.12)',   border: 'rgba(163,230,53,0.25)',  unit: '' },
  Football:       { emoji: '⚽', color: '#34d399', bg: 'rgba(52,211,153,0.12)',   border: 'rgba(52,211,153,0.25)',  unit: '' },
  Gym:            { emoji: '💪', color: '#fb7185', bg: 'rgba(251,113,133,0.12)',  border: 'rgba(251,113,133,0.25)', unit: '' },
  Yoga:           { emoji: '🧘', color: '#c084fc', bg: 'rgba(192,132,252,0.12)',  border: 'rgba(192,132,252,0.25)', unit: '' },
  Athletics:      { emoji: '🏃', color: '#fdba74', bg: 'rgba(253,186,116,0.12)', border: 'rgba(253,186,116,0.25)', unit: '' },
};

const SPORT_GRADIENT = {
  Badminton:      'linear-gradient(135deg,rgba(0,255,136,0.22),rgba(0,212,255,0.1))',
  Tennis:         'linear-gradient(135deg,rgba(0,212,255,0.22),rgba(168,85,247,0.1))',
  'Table Tennis': 'linear-gradient(135deg,rgba(168,85,247,0.22),rgba(0,212,255,0.1))',
  Squash:         'linear-gradient(135deg,rgba(251,191,36,0.22),rgba(249,115,22,0.1))',
  Basketball:     'linear-gradient(135deg,rgba(249,115,22,0.22),rgba(251,191,36,0.1))',
  Volleyball:     'linear-gradient(135deg,rgba(236,72,153,0.22),rgba(168,85,247,0.1))',
  Swimming:       'linear-gradient(135deg,rgba(56,189,248,0.22),rgba(0,212,255,0.1))',
  Cricket:        'linear-gradient(135deg,rgba(163,230,53,0.22),rgba(52,211,153,0.1))',
  Football:       'linear-gradient(135deg,rgba(52,211,153,0.22),rgba(163,230,53,0.1))',
  Gym:            'linear-gradient(135deg,rgba(251,113,133,0.22),rgba(168,85,247,0.1))',
  Yoga:           'linear-gradient(135deg,rgba(192,132,252,0.22),rgba(56,189,248,0.1))',
  Athletics:      'linear-gradient(135deg,rgba(253,186,116,0.22),rgba(251,113,133,0.1))',
  default:        'linear-gradient(135deg,rgba(0,212,255,0.15),rgba(168,85,247,0.1))',
};

const AMENITY_LABELS = {
  parking: '🅿️ Parking', changing_room: '🚿 Changing Rooms',
  water: '💧 Water Dispenser', cafeteria: '🍽️ Cafeteria',
  ac: '❄️ AC Courts', shuttle_shop: '🛍️ Shuttle Shop',
  first_aid: '🩺 First Aid', wifi: '📶 WiFi',
  spectator: '👥 Spectator Seating', coaching: '🏆 Coaching Available',
};

function formatFacilityDetail(sport, raw) {
  if (!raw) return null;
  const m = SPORT_META[sport];
  const unit = m?.unit || '';
  // If raw is a number or numeric string and unit exists, append it
  if (unit && /^\d+$/.test(String(raw).trim())) {
    return `${raw} ${unit}`;
  }
  return raw;
}

export default function AcademyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [academy, setAcademy] = useState(null);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [acadRes, courtsRes] = await Promise.allSettled([
          api.get(`/academies/${id}`),
          api.get(`/academies/${id}/courts`)
        ]);
        const raw = acadRes.value?.data?.data?.academy;
        if (!raw) throw new Error('Not found');
        setAcademy({
          ...raw,
          sports: Array.isArray(raw.sports) ? raw.sports
            : JSON.parse(raw.sports || '[]'),
          sportDetails: typeof raw.sportDetails === 'object' && !Array.isArray(raw.sportDetails)
            ? raw.sportDetails : JSON.parse(raw.sportDetails || '{}'),
          photos: Array.isArray(raw.photos) ? raw.photos
            : JSON.parse(raw.photos || '[]'),
          amenities: Array.isArray(raw.amenities) ? raw.amenities
            : JSON.parse(raw.amenities || '[]'),
        });
        if (courtsRes.value?.data?.data?.courts) {
          setCourts(courtsRes.value.data.data.courts);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: B.bg }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          border: '3px solid rgba(0,212,255,0.15)',
          borderTopColor: '#00d4ff',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (error || !academy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
        style={{ background: B.bg }}>
        <span style={{ fontSize: 52 }}>😕</span>
        <p className="text-lg font-black text-white mt-5 mb-2">Academy not found</p>
        <p className="text-sm font-semibold mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          It may have been removed or the link is incorrect.
        </p>
        <button onClick={() => navigate('/academies')}
          className="px-6 py-3 rounded-xl text-sm font-black"
          style={{ background: 'rgba(0,255,136,0.12)', color: B.green, border: '1px solid rgba(0,255,136,0.25)' }}>
          Back to Academies
        </button>
      </div>
    );
  }

  const photos = academy.photos || [];
  const sports = academy.sports || [];
  const primarySport = sports[0];
  const gradient = SPORT_GRADIENT[primarySport] || SPORT_GRADIENT.default;
  const whatsappNum = academy.phone?.replace(/\D/g, '').replace(/^0/, '').replace(/^91/, '');

  // ── Section wrapper ────────────────────────────────────────────────────────
  const Section = ({ title, accent = B.cyan, children }) => (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: B.card, border: `1px solid ${B.border}` }}>
      <div className="px-4 py-3 flex items-center gap-2.5"
        style={{ borderBottom: `1px solid ${B.border}`, background: `${accent}08` }}>
        <div className="w-1 h-4 rounded-full" style={{ background: accent }} />
        <p className="text-sm font-black text-white">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: B.bg, paddingBottom: courts.length > 0 ? 88 : 32 }}>

      {/* ── Hero photo / gradient ── */}
      <div className="relative w-full overflow-hidden" style={{ height: 220 }}>
        {photos.length > 0 ? (
          <>
            <img
              src={photos[photoIndex]}
              alt={academy.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {/* bottom fade */}
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, rgba(7,7,26,0.25) 0%, transparent 35%, rgba(7,7,26,0.75) 100%)' }} />

            {photos.length > 1 && (
              <>
                <button onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIndex(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: i === photoIndex ? 18 : 6, height: 6,
                        background: i === photoIndex ? B.green : 'rgba(255,255,255,0.4)',
                      }} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          /* No photo — rich gradient with large emoji */
          <div className="w-full h-full flex flex-col items-center justify-center"
            style={{ background: gradient }}>
            <span style={{ fontSize: 68, filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.4))' }}>
              {SPORT_META[primarySport]?.emoji || '🏢'}
            </span>
          </div>
        )}

        {/* Back button */}
        <button onClick={() => navigate('/academies')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Verified badge */}
        {academy.isVerified && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(0,255,136,0.92)', backdropFilter: 'blur(6px)' }}>
            <BadgeCheck className="w-3.5 h-3.5" style={{ color: '#07071a' }} />
            <span className="text-xs font-black" style={{ color: '#07071a' }}>Verified</span>
          </div>
        )}
      </div>

      {/* ── Name + meta ── */}
      <div className="px-4 pt-5 pb-4"
        style={{ borderBottom: `1px solid ${B.border}` }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <h1 className="text-xl font-black text-white leading-tight flex-1">{academy.name}</h1>
          {academy.type && (
            <span className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-black mt-0.5"
              style={{ background: 'rgba(168,85,247,0.15)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.25)' }}>
              {academy.type}
            </span>
          )}
        </div>

        {/* Sport tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {sports.map(s => {
            const m = SPORT_META[s] || {};
            return (
              <span key={s}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black"
                style={{ background: m.bg || 'rgba(255,255,255,0.06)', color: m.color || '#fff', border: `1px solid ${m.border || B.border}` }}>
                {m.emoji} {s}
              </span>
            );
          })}
        </div>

        {/* Opening hours inline */}
        {academy.openingHours && (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: B.amber }} />
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {academy.openingHours}
            </span>
          </div>
        )}
      </div>

      {/* ── Sections ── */}
      <div className="px-4 pt-4 space-y-3">

        {/* Location */}
        <Section title="Location" accent={B.cyan}>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)' }}>
              <MapPin className="w-4 h-4" style={{ color: B.cyan }} />
            </div>
            <div>
              {academy.address && (
                <p className="text-sm font-bold text-white leading-snug capitalize mb-1">
                  {academy.address.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </p>
              )}
              <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {[academy.city, academy.state, academy.pincode].filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        </Section>

        {/* Facilities */}
        {sports.length > 0 && (
          <Section title="Facilities" accent={B.green}>
            <div className="space-y-1">
              {sports.map((sport, idx) => {
                const m = SPORT_META[sport] || {};
                const detail = formatFacilityDetail(sport, academy.sportDetails?.[sport]);
                return (
                  <div key={sport}
                    className="flex items-center gap-3 py-3"
                    style={{ borderBottom: idx < sports.length - 1 ? `1px solid ${B.border}` : 'none' }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: m.bg || 'rgba(255,255,255,0.06)', border: `1px solid ${m.border || B.border}` }}>
                      <span style={{ fontSize: 20 }}>{m.emoji || '🏢'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-white">{sport}</p>
                      {detail && (
                        <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {detail}
                        </p>
                      )}
                    </div>
                    {m.color && (
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: m.color }} />
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Amenities */}
        {academy.amenities?.length > 0 && (
          <Section title="Amenities" accent={B.purple}>
            <div className="flex flex-wrap gap-2">
              {academy.amenities.map(a => (
                <span key={a}
                  className="px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)' }}>
                  {AMENITY_LABELS[a] || a}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* About */}
        {academy.description && (
          <Section title="About" accent={B.amber}>
            <p className="text-sm font-semibold leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {academy.description}
            </p>
          </Section>
        )}

        {/* Courts — Book a Court */}
        {courts.length > 0 && (
          <Section title="Book a Court" accent={B.cyan}>
            <div className="space-y-3">
              {courts.map(court => (
                <div key={court.id}
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)' }}>
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                      style={{ background: SPORT_META[court.sport]?.bg || 'rgba(255,255,255,0.06)' }}>
                      {SPORT_META[court.sport]?.emoji || '🏟️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white">{court.name}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{court.sport}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black" style={{ color: B.cyan }}>₹{court.pricePerHour}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>per hour</p>
                    </div>
                  </div>
                  <div className="px-3 pb-3">
                    <button
                      onClick={() => {
                        if (!user) { navigate('/login'); return; }
                        navigate(`/academies/${id}/courts/${court.id}/book`);
                      }}
                      className="w-full py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
                      style={{ background: 'rgba(0,212,255,0.15)', color: B.cyan, border: '1px solid rgba(0,212,255,0.25)' }}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Check Availability & Book
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Contact */}
        <Section title="Contact" accent={B.green}>
          <div className="space-y-2.5">
            {academy.phone && (
              <a href={`tel:${academy.phone}`}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]"
                style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,255,136,0.15)' }}>
                  <Phone className="w-4 h-4" style={{ color: B.green }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold mb-0.5" style={{ color: 'rgba(0,255,136,0.6)' }}>Phone</p>
                  <p className="text-sm font-black text-white">{academy.phone}</p>
                </div>
              </a>
            )}

            {whatsappNum && (
              <a href={`https://wa.me/91${whatsappNum}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]"
                style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(37,211,102,0.15)' }}>
                  <span style={{ fontSize: 18 }}>💬</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold mb-0.5" style={{ color: 'rgba(37,211,102,0.6)' }}>WhatsApp</p>
                  <p className="text-sm font-black text-white">Send a message</p>
                </div>
              </a>
            )}

            {academy.email && (
              <a href={`mailto:${academy.email}`}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]"
                style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,212,255,0.15)' }}>
                  <Mail className="w-4 h-4" style={{ color: B.cyan }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold mb-0.5" style={{ color: 'rgba(0,212,255,0.6)' }}>Email</p>
                  <p className="text-sm font-black text-white">{academy.email}</p>
                </div>
              </a>
            )}

            {academy.website && (
              <a href={academy.website.startsWith('http') ? academy.website : `https://${academy.website}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]"
                style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(168,85,247,0.15)' }}>
                  <Globe className="w-4 h-4" style={{ color: B.purple }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold mb-0.5" style={{ color: 'rgba(168,85,247,0.6)' }}>Website</p>
                  <p className="text-sm font-black text-white truncate">
                    {academy.website.replace(/^https?:\/\//, '')}
                  </p>
                </div>
              </a>
            )}

            {academy.instagram && (
              <a href={`https://instagram.com/${academy.instagram}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:scale-[0.98]"
                style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.2)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(251,113,133,0.15)' }}>
                  <span style={{ fontSize: 16 }}>📸</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold mb-0.5" style={{ color: 'rgba(251,113,133,0.7)' }}>Instagram</p>
                  <p className="text-sm font-black text-white">@{academy.instagram}</p>
                </div>
              </a>
            )}
          </div>
        </Section>

        {/* List your academy promo */}
        <button
          onClick={() => navigate('/academies/add')}
          className="w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,255,136,0.18)', color: B.green }}>
          <Building2 className="w-4 h-4" />
          Own an academy? List it for ₹300
        </button>

      </div>

      {/* Sticky Book CTA */}
      {courts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-3 z-40"
          style={{ background: 'linear-gradient(to top, rgba(7,7,26,0.98) 60%, transparent)' }}>
          <button
            onClick={() => {
              if (!user) { navigate('/login'); return; }
              navigate(`/academies/${id}/courts/${courts[0].id}/book`);
            }}
            className="w-full py-4 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${B.cyan}, #0099bb)`, color: '#000' }}
          >
            <Calendar className="w-4 h-4" />
            Book a Court
            {courts.length > 1 && <span className="text-xs opacity-70">· {courts.length} courts</span>}
          </button>
        </div>
      )}
    </div>
  );
}
