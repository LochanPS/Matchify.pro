/**
 * SlideToConfirm — swipe right to confirm an irreversible action.
 * Replaces the tap-once button on the Match Complete modal.
 *
 * Props:
 *   label      – text shown inside the track, e.g. "Confirm Lochan PS as Winner"
 *   onConfirm  – async function called when slide completes
 *   color      – accent hex (default amber #f59e0b)
 *   disabled   – disable interactions while parent is saving
 */

import { useRef, useState, useCallback } from 'react';
import { Trophy } from 'lucide-react';

const THRESHOLD = 0.78; // 78% of track = confirm

export default function SlideToConfirm({ label, onConfirm, color = '#f59e0b', disabled = false }) {
  const trackRef  = useRef(null);
  const [pct, setPct]           = useState(0);     // 0–1
  const [dragging, setDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const startX = useRef(0);

  const handleWidth = 52; // px

  // ── pointer helpers ────────────────────────────────────────────────────────
  const getTrackWidth = () => trackRef.current?.getBoundingClientRect().width || 300;

  const calcPct = useCallback((clientX) => {
    const trackW = getTrackWidth();
    const raw = (clientX - startX.current) / (trackW - handleWidth);
    return Math.min(1, Math.max(0, raw));
  }, []);

  const onStart = (clientX) => {
    if (disabled || confirmed) return;
    startX.current = clientX;
    setDragging(true);
  };

  const onMove = (clientX) => {
    if (!dragging) return;
    setPct(calcPct(clientX));
  };

  const onEnd = async () => {
    if (!dragging) return;
    setDragging(false);
    if (pct >= THRESHOLD) {
      setConfirmed(true);
      setPct(1);
      try { await onConfirm(); } catch { setConfirmed(false); setPct(0); }
    } else {
      // snap back
      setPct(0);
    }
  };

  // ── mouse events ───────────────────────────────────────────────────────────
  const onMouseDown = (e) => onStart(e.clientX);
  const onMouseMove = (e) => onMove(e.clientX);
  const onMouseUp   = () => onEnd();

  // ── touch events ──────────────────────────────────────────────────────────
  const onTouchStart = (e) => onStart(e.touches[0].clientX);
  const onTouchMove  = (e) => { e.preventDefault(); onMove(e.touches[0].clientX); };
  const onTouchEnd   = () => onEnd();

  const trackW = '100%';
  const fillPct = `${Math.round(pct * 100)}%`;

  const transition = dragging ? 'none' : 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)';

  return (
    <div
      ref={trackRef}
      style={{
        position: 'relative',
        width: trackW,
        height: 52,
        borderRadius: 999,
        background: `rgba(0,0,0,0.35)`,
        border: `1.5px solid ${color}44`,
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'none',
        cursor: disabled ? 'not-allowed' : confirmed ? 'default' : 'grab',
        opacity: disabled ? 0.55 : 1,
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* fill bar */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: fillPct,
          background: `linear-gradient(90deg, ${color}55, ${color}33)`,
          transition,
          borderRadius: 999,
        }}
      />

      {/* track label */}
      <span
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.78rem',
          fontWeight: 800,
          color: confirmed ? color : `${color}bb`,
          letterSpacing: '0.03em',
          paddingLeft: handleWidth + 8,
          paddingRight: 12,
          pointerEvents: 'none',
          transition: 'color 0.2s',
        }}
      >
        {confirmed ? '✓ Confirmed!' : label}
      </span>

      {/* handle */}
      <div
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          position: 'absolute',
          top: 2,
          left: 2,
          width: handleWidth - 4,
          height: 48 - 4,
          borderRadius: 999,
          background: confirmed
            ? `linear-gradient(135deg, ${color}, ${color}cc)`
            : `linear-gradient(135deg, ${color}ee, ${color}99)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `translateX(calc(${fillPct} * (var(--tw, 1))))`,
          // Use inline calc relative to track width via the pct value
          // We shift the handle by (pct * (trackWidth - handleWidth))
          // Since we can't read trackWidth in CSS easily, we override transform:
          transition,
          cursor: disabled ? 'not-allowed' : 'grab',
          boxShadow: `0 2px 12px ${color}55`,
          zIndex: 2,
        }}
        // Override transform with exact pixel value via ref
        ref={el => {
          if (!el) return;
          const trackWidth = trackRef.current?.getBoundingClientRect().width || 300;
          const maxShift = trackWidth - handleWidth;
          el.style.transform = `translateX(${Math.round(pct * maxShift)}px)`;
          el.style.transition = transition;
        }}
      >
        <Trophy size={18} color={confirmed ? '#07071a' : '#07071a'} strokeWidth={2.5} />
      </div>
    </div>
  );
}
