import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWebSocket } from '../contexts/WebSocketContext';
import { matchService } from '../services/matchService';

const LiveMatchDetail = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useWebSocket();
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId]);

  useEffect(() => {
    if (!socket || !matchId) return;

    // Subscribe to this specific match
    socket.emit('subscribe:match', matchId);

    socket.on(`match:scoreUpdate:${matchId}`, (updatedScore) => {
      console.log('Score update received:', updatedScore);
      setMatch(prev => ({
        ...prev,
        score: updatedScore
      }));
    });

    socket.on(`match:statusChange:${matchId}`, (data) => {
      console.log('Match status changed:', data);
      setMatch(prev => ({
        ...prev,
        status: data.status
      }));
    });

    return () => {
      socket.emit('unsubscribe:match', matchId);
      socket.off(`match:scoreUpdate:${matchId}`);
      socket.off(`match:statusChange:${matchId}`);
    };
  }, [socket, matchId]);

  // Update duration every second
  useEffect(() => {
    if (!match?.startedAt) return;

    const interval = setInterval(() => {
      const start = new Date(match.startedAt);
      const now = new Date();
      const diff = Math.floor((now - start) / 1000);
      setDuration(diff);
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
      console.error('Error fetching match:', err);
      setError('Failed to load match details');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const text = `Watch live badminton match!\n${match.tournament?.name || 'Tournament'} - ${match.category?.name || 'Category'}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Live Badminton Match',
          text: text,
          url: url
        });
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert('Match link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Match not found'}</p>
          <button 
            onClick={() => navigate('/matches/live')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Live Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            ← Back to Live Matches
          </button>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Live' : 'Reconnecting...'}
            </span>
          </div>

          <button
            onClick={handleShare}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Share Match
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <MatchInfo match={match} duration={duration} />
        <Scoreboard match={match} />
        <MatchTimeline match={match} />
      </div>
    </div>
  );
};

const MatchInfo = ({ match, duration }) => {
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ONGOING': return 'text-green-600';
      case 'COMPLETED': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {match.tournament?.name || 'Tournament'}
          </h1>
          <p className="text-gray-600">
            {match.category?.name || 'Category'} - Round {match.round}
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-sm text-gray-600">Court</div>
          <div className="text-2xl font-bold text-blue-600">
            {match.courtNumber || 'TBA'}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          Status: <span className={`font-semibold ${getStatusColor(match.status)}`}>
            {match.status}
          </span>
        </div>
        
        <div>
          Duration: <span className="font-semibold">
            {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
};

const Scoreboard = ({ match }) => {
  const score = match.score || { sets: [], currentScore: { player1: 0, player2: 0 }, currentSet: 1 };
  const currentScore = score.currentScore || { player1: 0, player2: 0 };
  const isDoubles = match.category?.format === 'DOUBLES' || match.category?.format === 'MIXED_DOUBLES';

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg shadow-xl p-8 mb-6 relative">
      {/* Players */}
      <div className="grid grid-cols-2 gap-8 mb-8 relative">
        {/* Player/Team 1 */}
        <PlayerCard 
          name="Player 1"
          score={currentScore.player1}
          isServing={score.currentServer === 'player1'}
          isLeading={currentScore.player1 > currentScore.player2}
        />

        {/* VS Divider */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-gray-700">VS</span>
          </div>
        </div>

        {/* Player/Team 2 */}
        <PlayerCard 
          name="Player 2"
          score={currentScore.player2}
          isServing={score.currentServer === 'player2'}
          isLeading={currentScore.player2 > currentScore.player1}
        />
      </div>

      {/* Set Scores */}
      <SetScores score={score} />
    </div>
  );
};

const PlayerCard = ({ name, score, isServing, isLeading }) => {
  return (
    <div className={`text-center relative ${isLeading ? 'scale-105' : ''} transition-transform`}>
      {/* Serving Indicator */}
      {isServing && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          SERVING
        </div>
      )}

      {/* Player Photo */}
      <div className="mb-4">
        <div className="w-32 h-32 rounded-full mx-auto border-4 border-white shadow-lg bg-gray-300 flex items-center justify-center">
          <span className="text-4xl text-gray-600">👤</span>
        </div>
      </div>

      {/* Player Name */}
      <h3 className="text-2xl font-bold text-white mb-1">
        {name}
      </h3>

      {/* Current Set Score */}
      <div className="text-6xl font-bold text-white mt-4">
        {score}
      </div>
    </div>
  );
};

const SetScores = ({ score }) => {
  if (!score.sets || score.sets.length === 0) return null;

  return (
    <div className="border-t border-blue-500 pt-6">
      <div className="text-center text-white mb-4 text-sm font-semibold">
        SET SCORES
      </div>
      
      <div className="flex justify-center space-x-8">
        {score.sets.map((set, index) => (
          <div key={index} className="text-center">
            <div className="text-xs text-blue-200 mb-2">Set {index + 1}</div>
            <div className="bg-white/10 rounded-lg px-6 py-3">
              <div className="text-2xl font-bold text-white">
                {set.score?.player1 || 0}
              </div>
              <div className="text-blue-200">-</div>
              <div className="text-2xl font-bold text-white">
                {set.score?.player2 || 0}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MatchTimeline = ({ match }) => {
  const score = match.score || { sets: [], history: [] };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Set-by-Set Breakdown */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Set-by-Set Breakdown
        </h3>
        
        {!score.sets || score.sets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Match hasn't started yet
          </p>
        ) : (
          <div className="space-y-4">
            {score.sets.map((set, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700">Set {index + 1}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    set.winner ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {set.winner ? 'Completed' : 'In Progress'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <div className="text-sm text-gray-600">Player 1</div>
                    <div className="text-3xl font-bold text-gray-900">{set.score?.player1 || 0}</div>
                  </div>
                  <div className="text-gray-400 mx-4">-</div>
                  <div className="text-center flex-1">
                    <div className="text-sm text-gray-600">Player 2</div>
                    <div className="text-3xl font-bold text-gray-900">{set.score?.player2 || 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Point-by-Point Timeline */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Match Timeline
        </h3>
        
        {!score.history || score.history.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No points recorded yet
          </p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {[...score.history].reverse().map((event, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold">
                    {event.set || 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">
                      {event.scorer === 'player1' ? 'Player 1' : 'Player 2'} scored
                    </div>
                    <div className="text-gray-500 text-xs">
                      {event.score || 'Point scored'}
                    </div>
                  </div>
                </div>
                <div className="text-gray-400 text-xs">
                  {event.timestamp ? new Date(event.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : 'Now'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMatchDetail;
