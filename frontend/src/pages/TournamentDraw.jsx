import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon, 
  TrophyIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const TournamentDraw = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedRound, setSelectedRound] = useState(1);
  const [umpires, setUmpires] = useState([]);
  const [showUmpireModal, setShowUmpireModal] = useState(null);

  useEffect(() => {
    fetchTournamentDraw();
    fetchUmpires();
  }, [tournamentId]);

  const fetchTournamentDraw = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockTournament = {
        id: tournamentId,
        name: 'ACE BADMINTON TOURNAMENT',
        status: 'ongoing',
        categories: [
          { id: '1', name: 'MEN\'S SINGLES', format: 'singles' },
          { id: '2', name: 'MEN\'S DOUBLES', format: 'doubles' }
        ]
      };

      const mockMatches = [
        {
          id: '1',
          round: 1,
          matchNumber: 1,
          categoryId: '1',
          player1: { id: '1', name: 'Slot 1' },
          player2: { id: '2', name: 'Slot 2' },
          status: 'PENDING',
          umpireId: null,
          umpire: null,
          scheduledTime: null,
          courtNumber: null
        },
        {
          id: '2',
          round: 1,
          matchNumber: 2,
          categoryId: '1',
          player1: { id: '3', name: 'Slot 3' },
          player2: { id: '4', name: 'Slot 4' },
          status: 'PENDING',
          umpireId: null,
          umpire: null,
          scheduledTime: null,
          courtNumber: null
        }
      ];

      setTournament(mockTournament);
      setMatches(mockMatches);
      
      // Set default category
      if (mockTournament.categories.length > 0) {
        setSelectedCategory(mockTournament.categories[0].id);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tournament draw:', error);
      toast.error('Failed to load tournament draw');
      setLoading(false);
    }
  };

  const fetchUmpires = async () => {
    try {
      const mockUmpires = [
        { id: 'ump1', name: 'John Doe', isAvailable: true },
        { id: 'ump2', name: 'Jane Smith', isAvailable: true }
      ];
      setUmpires(mockUmpires);
    } catch (error) {
      console.error('Error fetching umpires:', error);
    }
  };

  const assignUmpire = async (matchId, umpireId) => {
    try {
      const updatedMatches = matches.map(match => {
        if (match.id === matchId) {
          const umpire = umpires.find(u => u.id === umpireId);
          return { ...match, umpireId, umpire, status: 'SCHEDULED' };
        }
        return match;
      });
      
      setMatches(updatedMatches);
      setShowUmpireModal(null);
      
      const umpire = umpires.find(u => u.id === umpireId);
      toast.success(`${umpire.name} assigned as umpire`);
    } catch (error) {
      console.error('Error assigning umpire:', error);
      toast.error('Failed to assign umpire');
    }
  };

  const startMatch = async (matchId) => {
    try {
      window.open(`/match/${matchId}/live`, '_blank');
    } catch (error) {
      console.error('Error starting match:', error);
      toast.error('Failed to start match');
    }
  };

  const filteredMatches = matches.filter(match => 
    match.categoryId === selectedCategory && match.round === selectedRound
  );

  const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading tournament draw...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Header - Mobile Perfect */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span className="text-sm font-medium">Back to Tournament</span>
        </button>

        {/* Tournament Title - Mobile Perfect */}
        <div className="flex items-center gap-4 mb-6">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
              boxShadow: '0 8px 25px rgba(168,85,247,0.4)'
            }}
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-white leading-tight mb-1">{tournament?.name}</h1>
            <p className="text-sm text-white/60 font-medium">Tournament Draw & Brackets</p>
          </div>
        </div>

        {/* Action Buttons - Mobile Perfect */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          <button
            className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 15px rgba(16,185,129,0.4)'
            }}
          >
            <UserGroupIcon className="w-5 h-5" />
            <span>Assign Players</span>
          </button>
          
          <button
            className="flex-shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 4px 15px rgba(16,185,129,0.4)'
            }}
          >
            <TrophyIcon className="w-5 h-5" />
            <span>End Category</span>
          </button>
        </div>

        {/* Stats Grid - Mobile Perfect */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Total Players */}
          <div 
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(37,99,235,0.1) 100%)',
              border: '2px solid rgba(59,130,246,0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(59,130,246,0.3)' }}
              >
                <UserGroupIcon className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-white">0</p>
                <p className="text-xs font-bold text-white/60">Total Players</p>
              </div>
            </div>
          </div>

          {/* Confirmed */}
          <div 
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)',
              border: '2px solid rgba(16,185,129,0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.3)' }}
              >
                <CheckCircleIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-white">0</p>
                <p className="text-xs font-bold text-white/60">Confirmed</p>
              </div>
            </div>
          </div>

          {/* Total Matches */}
          <div 
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(124,58,237,0.1) 100%)',
              border: '2px solid rgba(139,92,246,0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.3)' }}
              >
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-white">0</p>
                <p className="text-xs font-bold text-white/60">Total Matches</p>
              </div>
            </div>
          </div>

          {/* Completed */}
          <div 
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.2) 0%, rgba(217,119,6,0.1) 100%)',
              border: '2px solid rgba(245,158,11,0.3)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(245,158,11,0.3)' }}
              >
                <TrophyIcon className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <p className="text-2xl font-black text-white">0</p>
                <p className="text-xs font-bold text-white/60">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs - Mobile Perfect */}
        <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
          {tournament?.categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="flex-shrink-0 px-6 py-3 rounded-2xl font-black text-sm transition-all whitespace-nowrap"
              style={
                selectedCategory === category.id
                  ? {
                      background: 'linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%)',
                      color: '#ffffff',
                      boxShadow: '0 4px 15px rgba(168,85,247,0.4)'
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      border: '2px solid rgba(255,255,255,0.1)',
                      color: '#ffffff'
                    }
              }
            >
              {category.name} <span className="text-xs opacity-70">{category.format}</span>
            </button>
          ))}
        </div>

        {/* Round Badge - Mobile Perfect */}
        <div className="flex justify-center mb-6">
          <div 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.2) 100%)',
              border: '2px solid rgba(16,185,129,0.5)',
              boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
            }}
          >
            <TrophyIcon className="w-5 h-5 text-emerald-400" />
            <span className="font-black text-emerald-400 text-base">SEMI FINALS</span>
          </div>
        </div>

        {/* Matches - Mobile Perfect */}
        <div className="space-y-4">
          {filteredMatches.map((match, index) => (
            <div
              key={match.id}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.8) 100%)',
                border: '2px solid rgba(100,116,139,0.3)',
                backdropFilter: 'blur(20px)'
              }}
            >
              <p className="text-xs font-bold text-white/40 mb-4">MATCH #{index + 1}</p>
              
              {/* Player 1 */}
              <div 
                className="rounded-xl p-4 mb-3"
                style={{
                  background: 'rgba(30,41,59,0.6)',
                  border: '1px solid rgba(100,116,139,0.3)'
                }}
              >
                <p className="text-base font-bold text-white">{match.player1.name}</p>
              </div>

              {/* VS */}
              <p className="text-center text-xs font-bold text-white/40 mb-3">VS</p>

              {/* Player 2 */}
              <div 
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(30,41,59,0.6)',
                  border: '1px solid rgba(100,116,139,0.3)'
                }}
              >
                <p className="text-base font-bold text-white">{match.player2.name}</p>
              </div>
            </div>
          ))}
        </div>

        {filteredMatches.length === 0 && (
          <div 
            className="rounded-2xl p-12 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.8) 100%)',
              border: '2px solid rgba(100,116,139,0.3)'
            }}
          >
            <p className="text-gray-400 text-base">No matches found for this round</p>
          </div>
        )}
      </div>

      {/* Umpire Assignment Modal */}
      {showUmpireModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div 
            className="rounded-2xl p-6 max-w-md w-full"
            style={{
              background: 'linear-gradient(135deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)',
              border: '2px solid rgba(100,116,139,0.3)'
            }}
          >
            <h3 className="text-xl font-black text-white mb-4">Assign Umpire</h3>
            
            <div className="space-y-3 mb-4">
              {umpires.map((umpire) => (
                <button
                  key={umpire.id}
                  onClick={() => assignUmpire(showUmpireModal, umpire.id)}
                  disabled={!umpire.isAvailable}
                  className="w-full p-4 rounded-xl transition text-left"
                  style={
                    umpire.isAvailable
                      ? {
                          background: 'rgba(16,185,129,0.2)',
                          border: '2px solid rgba(16,185,129,0.4)'
                        }
                      : {
                          background: 'rgba(100,116,139,0.1)',
                          border: '2px solid rgba(100,116,139,0.2)',
                          opacity: 0.5
                        }
                  }
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{umpire.name}</div>
                      <div className="text-xs text-white/60">
                        {umpire.isAvailable ? 'Available' : 'Not Available'}
                      </div>
                    </div>
                    {umpire.isAvailable && (
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowUmpireModal(null)}
              className="w-full py-3 px-4 rounded-xl font-bold transition"
              style={{
                background: 'rgba(100,116,139,0.3)',
                border: '2px solid rgba(100,116,139,0.4)',
                color: '#ffffff'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDraw;
