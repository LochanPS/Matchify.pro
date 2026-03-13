import { useState, useEffect } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNavigate } from 'react-router-dom';

const LiveMatchCard = ({ match }) => {
  const { socket } = useWebSocket();
  const navigate = useNavigate();
  const [currentScore, setCurrentScore] = useState(match.score || {});
  const [matchStatus, setMatchStatus] = useState(match.status);

  // Subscribe to match updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    socket.emit('subscribe:match', match.id);

    socket.on(`match:scoreUpdate:${match.id}`, (updatedScore) => {
      setCurrentScore(updatedScore);
    });

    socket.on(`match:statusChange:${match.id}`, (data) => {
      setMatchStatus(data.status);
    });

    return () => {
      socket.emit('unsubscribe:match', match.id);
      socket.off(`match:scoreUpdate:${match.id}`);
      socket.off(`match:statusChange:${match.id}`);
    };
  }, [socket, match.id]);

  // Parse score for display
  const getDisplayScore = () => {
    if (!currentScore?.sets || currentScore.sets.length === 0) {
      return { player1: '0', player2: '0' };
    }

    const currentSet = currentScore.currentSet || currentScore.sets.length;
    const setIndex = currentSet - 1;
    
    if (currentScore.currentScore) {
      return {
        player1: currentScore.currentScore.player1 || 0,
        player2: currentScore.currentScore.player2 || 0,
      };
    }

    if (currentScore.sets[setIndex]) {
      return {
        player1: currentScore.sets[setIndex].score?.player1 || 0,
        player2: currentScore.sets[setIndex].score?.player2 || 0,
      };
    }

    return { player1: '0', player2: '0' };
  };

  const displayScore = getDisplayScore();
  const isDoubles = match.category?.format === 'DOUBLES' || match.category?.format === 'MIXED_DOUBLES';

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-green-500"
      onClick={() => navigate(`/matches/${match.id}/live`)}
    >
      {/* Header: Tournament + Court */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-1">
            {match.tournament?.name || 'Unknown Tournament'}
          </h3>
          <p className="text-xs text-gray-500">
            {match.category?.name || 'Unknown Category'}
          </p>
        </div>
        <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">
          Court {match.courtNumber || 'TBD'}
        </div>
      </div>

      {/* Players + Score */}
      <div className="space-y-2">
        {/* Player 1 / Team 1 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              P1
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {isDoubles
                  ? 'Team 1'
                  : 'Player 1'}
              </p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {displayScore.player1}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200"></div>

        {/* Player 2 / Team 2 */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
              P2
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">
                {isDoubles
                  ? 'Team 2'
                  : 'Player 2'}
              </p>
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-800">
            {displayScore.player2}
          </div>
        </div>
      </div>

      {/* Footer: Set Score + Duration */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-600">
        <div>
          Set {currentScore.currentSet || 1} • Round {match.round}
        </div>
        <div className="flex items-center space-x-1">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span>LIVE</span>
        </div>
      </div>

      {/* Watch Button */}
      <button 
        className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors text-sm font-medium"
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/matches/${match.id}/live`);
        }}
      >
        Watch Live
      </button>
    </div>
  );
};

export default LiveMatchCard;
