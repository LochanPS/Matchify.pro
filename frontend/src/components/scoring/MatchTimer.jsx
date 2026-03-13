import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Calendar } from 'lucide-react';

const MatchTimer = ({ 
  matchStatus, 
  timer,
  onPause, 
  onResume, 
  isPaused,
  disabled = false 
}) => {
  const [displayTime, setDisplayTime] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (matchStatus !== 'ONGOING' && matchStatus !== 'IN_PROGRESS') {
      setDisplayTime(0);
      return;
    }

    // Calculate elapsed time function
    const calculateElapsed = () => {
      if (!timer?.startedAt) return 0;
      
      const startTime = new Date(timer.startedAt).getTime();
      const now = Date.now();
      const totalPausedTime = timer.totalPausedTime || 0;
      
      // Calculate elapsed time minus paused time
      let elapsed = now - startTime - totalPausedTime;
      
      // If currently paused, subtract time since pause started
      if (isPaused && timer.pausedAt) {
        const pauseStart = new Date(timer.pausedAt).getTime();
        elapsed -= (now - pauseStart);
      }
      
      return Math.max(0, Math.floor(elapsed / 1000));
    };

    // Set initial value immediately
    setDisplayTime(calculateElapsed());

    // Only update if not paused
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentTime(new Date());
      setDisplayTime(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [matchStatus, timer, isPaused]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStartTime = (dateString) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (matchStatus !== 'ONGOING' && matchStatus !== 'IN_PROGRESS') {
    return null;
  }

  return (
    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
      {/* Start Time Display */}
      <div className="flex items-center justify-center gap-2 mb-3 text-gray-400 text-sm">
        <Calendar className="w-4 h-4" />
        <span>Started at {formatStartTime(timer?.startedAt)}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isPaused 
              ? 'bg-amber-500/20 border border-amber-500/30' 
              : 'bg-emerald-500/20 border border-emerald-500/30'
          }`}>
            <Clock className={`w-6 h-6 ${isPaused ? 'text-amber-400' : 'text-emerald-400'}`} />
          </div>
          <div>
            <p className="text-sm text-gray-400">Match Duration</p>
            <p className={`text-3xl font-bold font-mono ${
              isPaused ? 'text-amber-400' : 'text-white'
            }`}>
              {formatTime(displayTime)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {!isPaused ? (
            <button
              onClick={onPause}
              disabled={disabled}
              className="flex items-center gap-2 px-5 py-3 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl hover:bg-amber-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pause className="w-5 h-5" />
              <span className="font-semibold">Pause</span>
            </button>
          ) : (
            <button
              onClick={onResume}
              disabled={disabled}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl hover:bg-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              <span className="font-semibold">Resume</span>
            </button>
          )}
        </div>
      </div>
      
      {isPaused && (
        <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
          <p className="text-amber-300 font-semibold flex items-center justify-center gap-2">
            <Pause className="w-4 h-4" />
            Timer Paused
          </p>
        </div>
      )}

      {/* Pause History */}
      {timer?.pauseHistory && timer.pauseHistory.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <p className="text-xs text-gray-500 mb-2">Pause History ({timer.pauseHistory.length} pauses)</p>
          <div className="text-xs text-gray-400">
            Total paused: {formatTime(Math.floor((timer.totalPausedTime || 0) / 1000))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchTimer;
