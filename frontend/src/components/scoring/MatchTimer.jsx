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

  useEffect(() => {
    if (matchStatus !== 'ONGOING' && matchStatus !== 'IN_PROGRESS') {
      setDisplayTime(0);
      return;
    }

    const calculateElapsed = () => {
      if (!timer?.startedAt) return 0;
      const startTime = new Date(timer.startedAt).getTime();
      const now = Date.now();
      const totalPausedTime = timer.totalPausedTime || 0;
      let elapsed = now - startTime - totalPausedTime;
      if (isPaused && timer.pausedAt) {
        const pauseStart = new Date(timer.pausedAt).getTime();
        elapsed -= (now - pauseStart);
      }
      return Math.max(0, Math.floor(elapsed / 1000));
    };

    setDisplayTime(calculateElapsed());
    if (isPaused) return;

    const interval = setInterval(() => {
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
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  if (matchStatus !== 'ONGOING' && matchStatus !== 'IN_PROGRESS') {
    return null;
  }

  const timerColor = isPaused ? '#FCD34D' : '#34D399';
  const timerBg = isPaused ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
  const timerBorder = isPaused ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)';

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
      border: `1px solid ${timerBorder}`,
      borderRadius: 14,
      padding: '14px 16px',
      transition: 'border-color 0.3s ease'
    }}>
      {/* Start time */}
      {timer?.startedAt && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          marginBottom: 12, color: 'rgba(255,255,255,0.3)', fontSize: 12
        }}>
          <Calendar style={{ width: 12, height: 12 }} />
          <span>Started {formatStartTime(timer.startedAt)}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Clock + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: timerBg,
            border: `1px solid ${timerBorder}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.3s ease'
          }}>
            <Clock style={{ width: 20, height: 20, color: timerColor }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 2, letterSpacing: '0.06em' }}>
              DURATION
            </p>
            <p style={{
              fontSize: 32,
              fontWeight: 800,
              fontFamily: 'monospace',
              color: timerColor,
              lineHeight: 1,
              letterSpacing: '-0.02em',
              transition: 'color 0.3s ease'
            }}>
              {formatTime(displayTime)}
            </p>
          </div>
        </div>

        {/* Pause/Resume */}
        {!isPaused ? (
          <button
            onClick={onPause}
            disabled={disabled}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#FCD34D',
              borderRadius: 10,
              padding: '9px 16px',
              fontSize: 13, fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(245,158,11,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,158,11,0.1)'; }}
          >
            <Pause style={{ width: 15, height: 15 }} />
            Pause
          </button>
        ) : (
          <button
            onClick={onResume}
            disabled={disabled}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(16,185,129,0.1)',
              border: '1px solid rgba(16,185,129,0.25)',
              color: '#34D399',
              borderRadius: 10,
              padding: '9px 16px',
              fontSize: 13, fontWeight: 600,
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.5 : 1,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'rgba(16,185,129,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}
          >
            <Play style={{ width: 15, height: 15 }} />
            Resume
          </button>
        )}
      </div>

      {/* Paused banner */}
      {isPaused && (
        <div style={{
          marginTop: 12,
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 8,
          padding: '8px 12px',
          textAlign: 'center',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
        }}>
          <Pause style={{ width: 12, height: 12, color: '#FCD34D' }} />
          <p style={{ fontSize: 12, fontWeight: 700, color: '#FCD34D', margin: 0 }}>
            Timer Paused
          </p>
        </div>
      )}

      {/* Pause history */}
      {timer?.pauseHistory && timer.pauseHistory.length > 0 && (
        <div style={{
          marginTop: 10,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.06)'
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: 0 }}>
            {timer.pauseHistory.length} pause{timer.pauseHistory.length > 1 ? 's' : ''} · Total paused: {formatTime(Math.floor((timer.totalPausedTime || 0) / 1000))}
          </p>
        </div>
      )}
    </div>
  );
};

export default MatchTimer;
