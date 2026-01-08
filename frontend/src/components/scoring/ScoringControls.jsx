import React from 'react';
import { Plus, Undo2, Play, Trophy } from 'lucide-react';

const ScoringControls = ({ 
  onAddPoint, 
  onUndo, 
  onStart,
  matchStatus,
  player1Name = 'Player 1',
  player2Name = 'Player 2',
  disabled = false
}) => {
  const isPending = matchStatus === 'PENDING' || matchStatus === 'READY';
  const isOngoing = matchStatus === 'ONGOING' || matchStatus === 'IN_PROGRESS';
  const isCompleted = matchStatus === 'COMPLETED';

  if (isPending) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <Play className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready to Start?</h3>
          <p className="text-gray-600 mb-6">Click the button below to begin the match</p>
          <button
            onClick={onStart}
            disabled={disabled}
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            Start Match
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Match Completed!</h3>
          <p className="text-gray-600">The match has ended</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">Scoring Controls</h3>
      
      {/* Point Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Player 1 Button */}
        <button
          onClick={() => onAddPoint('player1')}
          disabled={disabled}
          className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold text-lg">{player1Name}</p>
          <p className="text-sm opacity-80">Add Point</p>
        </button>

        {/* Player 2 Button */}
        <button
          onClick={() => onAddPoint('player2')}
          disabled={disabled}
          className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition transform hover:scale-105 active:scale-95"
        >
          <Plus className="w-8 h-8 mx-auto mb-2" />
          <p className="font-semibold text-lg">{player2Name}</p>
          <p className="text-sm opacity-80">Add Point</p>
        </button>
      </div>

      {/* Undo Button */}
      <button
        onClick={onUndo}
        disabled={disabled}
        className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
      >
        <Undo2 className="w-5 h-5" />
        <span className="font-semibold">Undo Last Point</span>
      </button>

      {/* Instructions */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600 text-center">
          Click the player's button to award them a point. Use undo to correct mistakes.
        </p>
      </div>
    </div>
  );
};

export default ScoringControls;
