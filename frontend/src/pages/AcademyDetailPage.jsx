import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, MapPin, Phone, Mail, Globe, Building2,
  ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import api from '../utils/api';

const B = {
  bg: '#07071a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#00ff88',
  cyan: '#00d4ff',
  purple: '#a855f7',
  amber: '#fbbf24',
};

const SPORT_EMOJIS = {
  Badminton: '🏸', Tennis: '🎾', 'Table Tennis': '🏓',
  Squash: '🎱', Basketball: '🏀', Volleyball: '🏐',
  Swimming: '🏊', Cricket: '🏏', Football: '⚽',
  Gym: '💪', Yoga: '🧘', Athletics: '🏃',
};

const SPORT_COLORS = {
  Badminton: '#00ff88', Tennis: '#00d4ff', 'Table Tennis': '#a855f7',
  Squash: '#fbbf24', Basketball: '#f97316', Volleyball: '#ec4899',
  Swimming: '#38bdf8', Cricket: '#a3e635', Football: '#34d399',
  Gym: '#fb7185', Yoga: '#c084fc', Athletics: '#fdba74',
};

function FacilityDetail({ sport, detail }) {
  const color = SPORT_COLORS[sport] || B.green;
  return (
    <div className="flex items-center gap-3 py-3"
      style={{ borderBottom: `1px solid ${B.border}` }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
        <span style={{ fontSize: 18 }}>{SPORT_EMOJIS[sport] || '🏢'}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-white">{sport}</p>
        {detail && (
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{detail}</p>
        )}
      </div>
    </div>
  );
}

export default function AcademyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [academy, setAcademy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/academies/${id}`);
        const raw = res.data?.data?.academy;
        if (!raw) throw new Error('Not found');
        setAcademy({
          ...raw,
          sports: Array.isArray(raw.sports) ? raw.sports : JSON.parse(raw.sports || '[]'),
          sportDetails: typeof raw.sportDetails === 'object' && !Array.isArray(raw.sportDetails)
            ? raw.sportDetails : JSON.parse(raw.sportDetails || '{}'),
          photos: Array.isArray(raw.photos) ? raw.photos : JSON.parse(raw.photos || '[]'),
        });
      } catch {
        setError('Could not load this academy');
      } finally {
        setLoading(false);
      }
    };
    fetch();
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
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !academy) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
        style={{ background: B.bg }}>
        <span style={{ fontSize: 52 }}>😕</span>
        <p className="text-base font-black text-white mt-4 mb-2">Academy not found</p>
        <button onClick={() => navigate('/academies')}
          className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold"
          style={{ background: 'rgba(0,255,136,0.12)', color: B.green, border: '1px solid rgba(0,255,136,0.25)' }}>
          Back to Academies
        </button>
      </div>
    );
  }

  const photos = academy.photos || [];
  const hasPhotos = photos.length > 0;
  const primarySport = academy.sports?.[0];

  const whatsappNumber = academy.phone?.replace(/\D/g, '').replace(/^0/, '').replace(/^91/, '');

  return (
    <div className="min-h-screen pb-28" style={{ background: B.bg }}>

      {/* Photo gallery / hero */}
      <div className="relative w-full h-52 overflow-hidden">
        {hasPhotos ? (
          <>
            <img
              src={photos[photoIndex]}
              alt={academy.name}
              className="w-full h-full object-cover transition-all duration-300"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, rgba(7,7,26,0.35) 0%, transparent 40%, rgba(7,7,26,0.6) 100%)' }} />

            {/* Photo nav arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIndex(i => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setPhotoIndex(i => (i + 1) % photos.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.5)' }}>
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {photos.map((_, i) => (
                    <button key={i} onClick={() => setPhotoIndex(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: i === photoIndex ? 16 : 6,
                        height: 6,
                        background: i === photoIndex ? B.green : 'rgba(255,255,255,0.4)',
                      }} />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.08), rgba(0,212,255,0.06))' }}>
            <span style={{ fontSize: 60 }}>{SPORT_EMOJIS[primarySport] || '🏢'}</span>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate('/academies')}
          className="absolute top-4 left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}>
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Verified badge */}
        {academy.isVerified && (
          <div className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black"
            style={{ background: 'rgba(0,255,136,0.9)', color: '#07071a' }}>
            ✓ Verified
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="px-4 pt-4 space-y-4">

        {/* Name + sport tags */}
        <div>
          <h1 className="text-xl font-black text-white mb-2">{academy.name}</h1>
          <div className="flex flex-wrap gap-1.5">
            {academy.sports.map(s => (
              <span key={s}
                className="px-2.5 py-1 rounded-full text-xs font-bold"
                style={{
                  background: `${SPORT_COLORS[s] || B.green}18`,
                  color: SPORT_COLORS[s] || B.green,
                  border: `1px solid ${SPORT_COLORS[s] || B.green}33`,
                }}>
                {SPORT_EMOJIS[s]} {s}
              </span>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 px-3 py-3 rounded-xl"
          style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: B.cyan }} />
          <div>
            {academy.address && (
              <p className="text-sm text-white font-semibold">{academy.address}</p>
            )}
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {[academy.city, academy.state, academy.pincode].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

        {/* Facilities */}
        {academy.sports.length > 0 && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <div className="px-4 py-3"
              style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(0,212,255,0.04)' }}>
              <p className="text-sm font-black text-white">Facilities</p>
            </div>
            <div className="px-4">
              {academy.sports.map((sport, i) => (
                <FacilityDetail
                  key={sport}
                  sport={sport}
                  detail={academy.sportDetails?.[sport]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {academy.description && (
          <div className="rounded-2xl p-4"
            style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <p className="text-sm font-black text-white mb-2">About</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {academy.description}
            </p>
          </div>
        )}

        {/* Contact */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <div className="px-4 py-3"
            style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(0,255,136,0.04)' }}>
            <p className="text-sm font-black text-white">Contact</p>
          </div>
          <div className="p-4 space-y-2">
            {academy.phone && (
              <a href={`tel:${academy.phone}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: B.green }}>
                <Phone className="w-4 h-4" />
                {academy.phone}
              </a>
            )}
            {academy.phone && whatsappNumber && (
              <a href={`https://wa.me/91${whatsappNumber}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.25)', color: '#25d366' }}>
                <span style={{ fontSize: 16 }}>💬</span>
                WhatsApp
              </a>
            )}
            {academy.email && (
              <a href={`mailto:${academy.email}`}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', color: B.cyan }}>
                <Mail className="w-4 h-4" />
                {academy.email}
              </a>
            )}
            {academy.website && (
              <a href={academy.website.startsWith('http') ? academy.website : `https://${academy.website}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: B.purple }}>
                <Globe className="w-4 h-4" />
                {academy.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>

        {/* List your academy promo */}
        <button
          onClick={() => navigate('/academies/add')}
          className="w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid rgba(0,255,136,0.2)`,
            color: B.green,
          }}
        >
          <Building2 className="w-4 h-4" />
          Own an academy? List it for ₹200
        </button>

      </div>
    </div>
  );
}
