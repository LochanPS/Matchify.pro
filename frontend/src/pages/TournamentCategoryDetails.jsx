import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingScreen from '../components/LoadingScreen';
import {
  ArrowLeft, Trophy, Users, Swords, CheckCircle, Clock,
  Download, Star, TrendingUp
} from 'lucide-react';

// Deterministic star particles
const CAT_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  w: (i * 7 + 3) % 4 + 1,
  x: (i * 37 + 11) % 97,
  y: (i * 53 + 7) % 93,
  o: ((i * 13) % 40) / 100 + 0.2,
  dur: (i * 7) % 8 + 4,
  delay: (i * 3) % 5,
  c: ['#06b6d4', '#00d4ff', '#a855f7', '#06b6d4'][i % 4],
}));

export default function TournamentCategoryDetails() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategoryDetails();
  }, [categoryId]);

  const fetchCategoryDetails = async () => {
    try {
      const response = await api.get(`/organizer/categories/${categoryId}/details`);
      if (response.data.success) {
        setCategory(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch category details:', err);
      setError('Failed to load category details');
    } finally {
      setLoading(false);
    }
  };

  const downloadParticipants = () => {
    if (!category) return;
    const csv = [
      ['#', 'Name', 'Email', 'Phone', 'City', 'State', 'Partner', 'Registered At'].join(','),
      ...category.participants.map((p, i) => [
        i + 1,
        p.player.name,
        p.player.email,
        p.player.phone || '',
        p.player.city || '',
        p.player.state || '',
        p.partner?.name || '-',
        new Date(p.registeredAt).toLocaleDateString('en-IN'),
      ].join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category.category.name}_participants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <LoadingScreen message="Loading category..." />;
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #050810 50%, #0a0a1f 100%)' }}>
        <div className="text-center p-8 rounded-2xl border border-red-500/30" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <p className="text-red-400 text-lg font-semibold mb-4">{error || 'Category not found'}</p>
          <button
            onClick={() => navigate('/dashboard?role=ORGANIZER')}
            className="px-6 py-3 rounded-xl font-bold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #06b6d4, #00d4ff)', color: '#050810' }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Participants', value: category.stats.totalParticipants, icon: Users, color: '#06b6d4', glow: 'rgba(6,182,212,0.2)' },
    { label: 'Total Matches', value: category.stats.totalMatches, icon: Swords, color: '#00d4ff', glow: 'rgba(0,212,255,0.2)' },
    { label: 'Completed', value: category.stats.completedMatches, icon: CheckCircle, color: '#a855f7', glow: 'rgba(168,85,247,0.2)' },
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #050810 40%, #0d1a2a 70%, #050810 100%)' }}>
      {/* Animated star particles */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.4) 0%, transparent 70%)' }} />
        <div className="absolute bottom-1/4 left-0 w-64 h-64 rounded-full blur-3xl opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.4) 0%, transparent 70%)' }} />
        {CAT_PARTICLES.map((p, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${p.w}px`, height: `${p.w}px`,
              left: `${p.x}%`, top: `${p.y}%`,
              background: p.c, opacity: p.o,
              animation: `float ${p.dur}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
              boxShadow: `0 0 6px ${p.c}`,
            }} />
        ))}
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>

      {/* Sticky Header */}
      <div className="relative sticky top-0 z-20" style={{ background: 'rgba(7,7,26,0.95)', borderBottom: '1px solid rgba(6,182,212,0.15)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => navigate(category?.category?.tournament?.id ? `/tournaments/${category.category.tournament.id}` : '/dashboard')} className="flex items-center gap-2 mb-3 text-sm font-medium transition-colors" style={{ color: 'rgba(255,255,255,0.6)' }}
            onMouseEnter={e => e.currentTarget.style.color = '#06b6d4'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #06b6d4, #00d4ff)' }}>
                <Trophy className="w-6 h-6" style={{ color: '#050810' }} />
              </div>
              <div>
                <h1 className="text-lg font-black text-white leading-tight">{category.category.name}</h1>
                <p className="text-xs font-medium mt-0.5" style={{ color: '#06b6d4' }}>
                  {category.category.tournament.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {category.category.format.toUpperCase()} · ₹{category.category.entryFee} entry
                </p>
              </div>
            </div>
            <button
              onClick={downloadParticipants}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-105 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.15))', border: '1px solid rgba(6,182,212,0.4)', color: '#06b6d4' }}
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          </div>
        </div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl p-4 text-center transition-all hover:scale-[1.02]"
              style={{ background: `linear-gradient(135deg, ${s.glow}, rgba(7,7,26,0.8))`, border: `1px solid ${s.color}30` }}>
              <s.icon className="w-5 h-5 mx-auto mb-2" style={{ color: s.color }} />
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Winner */}
        {category.winner && (
          <div className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(255,193,7,0.15), rgba(255,152,0,0.1))', border: '2px solid rgba(255,193,7,0.3)' }}>
            <div className="absolute top-3 right-3">
              <Star className="w-6 h-6 text-yellow-400 opacity-50" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(255,193,7,0.3), rgba(255,152,0,0.2))' }}>
                🏆
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(255,193,7,0.7)' }}>Champion</p>
                <p className="text-lg font-black text-white">
                  {Array.isArray(category.winner)
                    ? `${category.winner[0]?.name} & ${category.winner[1]?.name}`
                    : category.winner.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Participants */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(6,182,212,0.15)', background: 'rgba(7,7,26,0.6)', backdropFilter: 'blur(20px)' }}>
          {/* Header */}
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
                <TrendingUp className="w-4 h-4" style={{ color: '#06b6d4' }} />
              </div>
              <div>
                <h2 className="text-base font-black text-white">All Participants</h2>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{category.participants.length} registered</p>
              </div>
            </div>
          </div>

          {/* Mobile-first card list */}
          <div className="p-4 space-y-3">
            {category.participants.length === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>No participants yet</p>
              </div>
            ) : (
              category.participants.map((participant, index) => (
                <div key={participant.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'; e.currentTarget.style.background = 'rgba(6,182,212,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  {/* Rank badge */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0"
                    style={{
                      background: index === 0 ? 'linear-gradient(135deg, #ffd700, #ff9800)' :
                        index === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' :
                        index === 2 ? 'linear-gradient(135deg, #cd7f32, #b45309)' :
                        'rgba(255,255,255,0.08)',
                      color: index < 3 ? '#fff' : 'rgba(255,255,255,0.5)',
                    }}>
                    {index + 1}
                  </div>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm leading-tight truncate">{participant.player.name}</p>
                    {participant.partner && (
                      <p className="text-xs font-medium mt-0.5 truncate" style={{ color: '#06b6d4' }}>
                        & {participant.partner.name}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {participant.player.city && (
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {participant.player.city}
                        </span>
                      )}
                      {participant.player.phone && (
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {participant.player.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {new Date(participant.registeredAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
