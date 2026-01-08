import React from 'react';
import { Users, ArrowRight } from 'lucide-react';

const DoublesRotationIndicator = ({ 
  isDoubles, 
  currentServer, 
  player1Team, 
  player2Team,
  score 
}) => {
  if (!isDoubles) {
    return null;
  }

  // In doubles, service rotates based on score
  // If score is even, original server serves
  // If score is odd, partner serves
  const getServerPosition = (team, isServing) => {
    if (!score || !score.currentScore) return null;
    
    const teamScore = team === 'player1' ? score.currentScore.player1 : score.currentScore.player2;
    const isEven = teamScore % 2 === 0;
    
    if (!isServing) return null;
    
    return isEven ? 'right' : 'left';
  };

  const player1ServerPos = currentServer === 'player1' ? getServerPosition('player1', true) : null;
  const player2ServerPos = currentServer === 'player2' ? getServerPosition('player2', true) : null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Doubles Service Rotation</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Player 1 Team */}
        <div className={`p-4 rounded-lg border-2 ${
          currentServer === 'player1' 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <p className="text-sm font-semibold text-gray-700 mb-2">Team 1</p>
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${
              player1ServerPos === 'right' ? 'font-bold text-green-600' : 'text-gray-600'
            }`}>
              {player1ServerPos === 'right' && <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>}
              <span>{player1Team?.player1 || 'Player 1A'}</span>
              {player1ServerPos === 'right' && <span className="text-xs">(Serving - Right)</span>}
            </div>
            <div className={`flex items-center gap-2 ${
              player1ServerPos === 'left' ? 'font-bold text-green-600' : 'text-gray-600'
            }`}>
              {player1ServerPos === 'left' && <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>}
              <span>{player1Team?.player2 || 'Player 1B'}</span>
              {player1ServerPos === 'left' && <span className="text-xs">(Serving - Left)</span>}
            </div>
          </div>
        </div>

        {/* Player 2 Team */}
        <div className={`p-4 rounded-lg border-2 ${
          currentServer === 'player2' 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <p className="text-sm font-semibold text-gray-700 mb-2">Team 2</p>
          <div className="space-y-2">
            <div className={`flex items-center gap-2 ${
              player2ServerPos === 'right' ? 'font-bold text-green-600' : 'text-gray-600'
            }`}>
              {player2ServerPos === 'right' && <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>}
              <span>{player2Team?.player1 || 'Player 2A'}</span>
              {player2ServerPos === 'right' && <span className="text-xs">(Serving - Right)</span>}
            </div>
            <div className={`flex items-center gap-2 ${
              player2ServerPos === 'left' ? 'font-bold text-green-600' : 'text-gray-600'
            }`}>
              {player2ServerPos === 'left' && <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>}
              <span>{player2Team?.player2 || 'Player 2B'}</span>
              {player2ServerPos === 'left' && <span className="text-xs">(Serving - Left)</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Service Rules Reminder */}
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="text-blue-800">
          <strong>Service Rule:</strong> Server position changes based on team's score. 
          Even score = Right court, Odd score = Left court.
        </p>
      </div>
    </div>
  );
};

export default DoublesRotationIndicator;
