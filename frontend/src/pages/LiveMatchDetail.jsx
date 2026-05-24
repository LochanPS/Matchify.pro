import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { matchService } from '../services/matchService';
import { CheckCircle, ArrowLeft, Share2 } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';

const LiveMatchDetail = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useWebSocket();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);
  const [shareModal, setShareModal] = useState(false);

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId]);

  useEffect(() => {
    if (!socket || !matchId) return;
    socket.emit('subscribe:match', matchId);
    socket.on(`match:scoreUpdate:${matchId}`, (updatedScore) => {
      setMatch(prev => ({ ...prev, score: updatedScore }));
    });
    socket.on(`match:statusChange:${matchId}`, (data) => {
      setMatch(prev => ({ ...prev, status: data.status }));
    });
    return () => {
      socket.emit('unsubscribe:match', matchId);
      socket.off(`match:scoreUpdate:${matchId}`);
      socket.off(`match:statusChange:${matchId}`);
    };
  }, [socket, matchId]);

  useEffect(() => {
    if (!match?.startedAt) return;
    const interval = setInterval(() => {
      const start = new Date(match.startedAt);
      const now = new Date();
      setDuration(Math.floor((now - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [match?.startedAt]);

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      const data = await matchService.getLiveMatchDetails(matchId);
      setMatch(data.match);
      setError(null);
    } catch (err) {
      setError('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Watch live badminton match!\n${match.tournament?.name || 'Tournament'} - ${match.category?.name || 'Category'}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Live Badminton Match', text, url }); } catch {}
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      setShareModal(true);
    }
  };

  if (loading) {
    return <LoadingScreen message="Loading match..." />;
  }

  if (error || !match) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg,#0a0a1f 0%,#050810 100%)' }}>
        <div className="text-center p-8 rounded-2xl" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <p className="text-red-400 font-semibold mb-4">{error || 'Match not found'}</p>
          <button onClick={() => navigate('/matches/live')} className="px-5 py-2.5 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', color: '#050810' }}>
            Back to Live Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(180deg,#0a0a1f 0%,#050810 50%,#0a0a1f 100%)' }}>
      {/* Sticky Header */}
      <div className="sticky top-0 z-20" style={{ background: 'rgba(7,7,26,0.95)', borderBottom: '1px solid rgba(6,182,212,0.15)', backdropFilter: 'blur(20px)' }}>
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <button onClick={() => navigate('/live-matches')} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'animate-pulse' : ''}`} style={{ background: isConnected ? '#06b6d4' : '#ef4444' }} />
            <span className="text-xs font-bold" style={{ color: isConnected ? '#06b6d4' : '#ef4444' }}>
              {isConnected ? 'LIVE' : 'Reconnecting...'}
            </span>
          </div>

          <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', color: '#06b6d4' }}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        <MatchInfo match={match} duration={duration} />
        <Scoreboard match={match} />
        <MatchTimeline match={match} />
      </div>

      {/* Share Success Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#0f0f2e,#0d1117)', border: '1px solid rgba(6,182,212,0.3)' }}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)' }}>
                <CheckCircle className="w-8 h-8" style={{ color: '#06b6d4' }} />
              </div>
              <h3 className="text-lg font-black text-white">Link Copied!</h3>
              <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>Match link copied to clipboard!</p>
            </div>
            <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button onClick={() => setShareModal(false)} className="w-full py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', color: '#050810' }}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MatchInfo = ({ match, duration }) => {
  const formatDuration = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(6,182,212,0.15)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-black text-white leading-tight truncate">{match.tournament?.name || 'Tournament'}</h1>
          <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {match.category?.name || 'Category'} · Round {match.round}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Court</p>
          <p className="text-xl font-black" style={{ color: '#00d4ff' }}>{match.courtNumber || 'TBA'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="px-2.5 py-1 rounded-full font-bold" style={{
          background: match.status === 'ONGOING' ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.08)',
          color: match.status === 'ONGOING' ? '#06b6d4' : 'rgba(255,255,255,0.5)',
          border: `1px solid ${match.status === 'ONGOING' ? 'rgba(6,182,212,0.3)' : 'rgba(255,255,255,0.1)'}`,
        }}>
          {match.status}
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>⏱ {formatDuration(duration)}</span>
      </div>
    </div>
  );
};

const Scoreboard = ({ match }) => {
  const score = match.score || { sets: [], currentScore: { player1: 0, player2: 0 }, currentSet: 1 };
  const currentScore = score.currentScore || { player1: 0, player2: 0 };

  return (
    <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,rgba(0,212,255,0.15),rgba(6,182,212,0.1))', border: '1px solid rgba(0,212,255,0.3)' }}>
      <div className="grid grid-cols-2 gap-4 mb-5 relative">
        <PlayerCard name="Player 1" score={currentScore.player1} isServing={score.currentServer === 'player1'} isLeading={currentScore.player1 > currentScore.player2} />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-black text-sm" style={{ background: 'rgba(7,7,26,0.9)', border: '2px solid rgba(0,212,255,0.4)', color: '#00d4ff' }}>VS</div>
        </div>
        <PlayerCard name="Player 2" score={currentScore.player2} isServing={score.currentServer === 'player2'} isLeading={currentScore.player2 > currentScore.player1} />
      </div>
      <SetScores score={score} />
    </div>
  );
};

const PlayerCard = ({ name, score, isServing, isLeading }) => (
  <div className={`text-center relative ${isLeading ? 'scale-105' : ''} transition-transform`}>
    {isServing && (
      <div className="absolute top-0 right-0 px-2 py-0.5 rounded-full text-xs font-black animate-pulse" style={{ background: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.4)' }}>
        SERVING
      </div>
    )}
    <div className="w-16 h-16 rounded-full mx-auto border-2 flex items-center justify-center mb-3" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.15)' }}>
      <span className="text-2xl">👤</span>
    </div>
    <h3 className="text-sm font-bold text-white truncate px-2">{name}</h3>
    <div className="text-5xl font-black mt-2" style={{ color: isLeading ? '#06b6d4' : 'rgba(255,255,255,0.8)' }}>{score}</div>
  </div>
);

const SetScores = ({ score }) => {
  if (!score.sets || score.sets.length === 0) return null;
  return (
    <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="text-center text-xs font-black uppercase tracking-wider mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>Set Scores</p>
      <div className="flex justify-center gap-4">
        {score.sets.map((set, i) => (
          <div key={i} className="text-center">
            <p className="text-xs mb-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Set {i + 1}</p>
            <div className="px-4 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="text-xl font-black text-white">{set.score?.player1 || 0}</div>
              <div className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>—</div>
              <div className="text-xl font-black text-white">{set.score?.player2 || 0}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MatchTimeline = ({ match }) => {
  const score = match.score || { sets: [], history: [] };

  const cardStyle = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '16px' };

  return (
    <div className="grid grid-cols-1 gap-4">
      {/* Set-by-Set Breakdown */}
      <div style={cardStyle}>
        <h3 className="text-sm font-black text-white mb-4">Set-by-Set Breakdown</h3>
        {!score.sets || score.sets.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Match hasn't started yet</p>
        ) : (
          <div className="space-y-3">
            {score.sets.map((set, i) => (
              <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Set {i + 1}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{
                    background: set.winner ? 'rgba(6,182,212,0.15)' : 'rgba(0,212,255,0.15)',
                    color: set.winner ? '#06b6d4' : '#00d4ff',
                  }}>
                    {set.winner ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Player 1</p>
                    <p className="text-2xl font-black text-white">{set.score?.player1 || 0}</p>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>—</span>
                  <div className="text-center flex-1">
                    <p className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Player 2</p>
                    <p className="text-2xl font-black text-white">{set.score?.player2 || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Point-by-Point Timeline */}
      <div style={cardStyle}>
        <h3 className="text-sm font-black text-white mb-4">Match Timeline</h3>
        {!score.history || score.history.length === 0 ? (
          <p className="text-center py-6 text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No points recorded yet</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...score.history].reverse().map((event, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0" style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}>
                    {event.set || 1}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{event.scorer === 'player1' ? 'Player 1' : 'Player 2'} scored</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{event.score || 'Point scored'}</p>
                  </div>
                </div>
                <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMatchDetail;
