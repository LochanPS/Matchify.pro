import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause } from 'lucide-react';

const MatchTimer = ({ matchStatus, startedAt, onPause, onResume, isPaused }) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (matchStatus !== 'ONGOING' || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      if (startedAt) {
        const start = new Date(startedAt).getTime();
        const now = Date.now();
        const diff = Math.floor((now - start) / 1000);
        setDuration(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [matchStatus, startedAt, isPaused]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (matchStatus !== 'ONGOING') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-gray-600" />
          <div>
            <p className="text-sm text-gray-600">Match Duration</p>
            <p className="text-2xl font-bold text-gray-900 font-mono">
              {formatTime(duration)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isPaused ? (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
            >
              <Pause className="w-4 h-4" />
              <span>Pause</span>
            </button>
          ) : (
            <button
              onClick={onResume}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <Play className="w-4 h-4" />
              <span>Resume</span>
            </button>
          )}
        </div>
      </div>
      
      {isPaused && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-center">
          <p className="text-sm text-yellow-800 font-semibold">⏸️ Match Paused</p>
        </div>
      )}
    </div>
  );
};

export default MatchTimer;
