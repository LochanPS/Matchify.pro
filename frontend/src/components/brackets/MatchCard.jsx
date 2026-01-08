import React from 'react';

const MatchCard = ({ match, onClick }) => {
  const { player1, player2, winner, round, matchNumber, status, score } = match;

  // Determine if participant won
  const isPlayer1Winner = winner?.id === player1?.id;
  const isPlayer2Winner = winner?.id === player2?.id;

  return (
    <div 
      className="bg-white border-2 border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer w-56"
      onClick={() => onClick?.(match)}
    >
      {/* Match Header */}
      <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-300">
        <p className="text-xs text-gray-700 font-semibold">
          Match {matchNumber}
        </p>
      </div>

      {/* Participants */}
      <div className="divide-y divide-gray-200">
        {/* Player 1 */}
        <div 
          className={`px-3 py-2.5 flex items-center justify-between ${
            isPlayer1Winner ? 'bg-green-50 border-l-4 border-green-600' : ''
          } ${status === 'COMPLETED' && !isPlayer1Winner ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {player1 && player1.name !== 'TBD' && player1.name !== 'BYE' ? (
              <>
                {player1.seed && (
                  <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-bold min-w-[24px] text-center">
                    {player1.seed}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-900 truncate">
                  {player1.name}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400 italic">
                {player1?.name || 'TBD'}
              </span>
            )}
          </div>
          {isPlayer1Winner && (
            <span className="text-green-600 font-bold text-lg">✓</span>
          )}
        </div>

        {/* Player 2 */}
        <div 
          className={`px-3 py-2.5 flex items-center justify-between ${
            isPlayer2Winner ? 'bg-green-50 border-l-4 border-green-600' : ''
          } ${status === 'COMPLETED' && !isPlayer2Winner ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {player2 && player2.name !== 'TBD' && player2.name !== 'BYE' ? (
              <>
                {player2.seed && (
                  <span className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-bold min-w-[24px] text-center">
                    {player2.seed}
                  </span>
                )}
                <span className="text-sm font-medium text-gray-900 truncate">
                  {player2.name}
                </span>
              </>
            ) : (
              <span className="text-sm text-gray-400 italic">
                {player2?.name || 'TBD'}
              </span>
            )}
          </div>
          {isPlayer2Winner && (
            <span className="text-green-600 font-bold text-lg">✓</span>
          )}
        </div>
      </div>

      {/* Match Status Badge */}
      {status === 'IN_PROGRESS' && (
        <div className="px-3 py-1.5 bg-blue-50 border-t border-blue-200">
          <p className="text-xs text-blue-700 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            LIVE
          </p>
        </div>
      )}
      {status === 'READY' && player1?.name !== 'TBD' && player2?.name !== 'TBD' && (
        <div className="px-3 py-1.5 bg-yellow-50 border-t border-yellow-200">
          <p className="text-xs text-yellow-700 font-medium">Ready to Play</p>
        </div>
      )}
      {status === 'COMPLETED' && (
        <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600 font-medium">Completed</p>
        </div>
      )}
    </div>
  );
};

export default MatchCard;
