/**
 * MatchifyLogo — Matchify.pro PNG logo
 * Aspect ratio: ~1.092:1 (1083×992)
 *
 * Canvas strips the dark navy background at first load so the logo floats
 * transparently on any background. Result is cached in a module-level variable
 * so processing only happens once per page session.
 *
 * Props:
 *   size       {number}  — height in px (default 40)
 *   variant    {'full'|'icon'|'text'}
 *   className  {string}
 */
import { useState, useEffect } from 'react';

const RATIO = 1.092; // 1083 / 992

// Module-level cache — survives re-renders, cleared on full reload
let _processedSrc = null;
let _processing = null; // shared Promise so concurrent mounts don't double-process

function removeBackground(src) {
  if (_processedSrc) return Promise.resolve(_processedSrc);
  if (_processing) return _processing;

  _processing = new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      try {
        const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = id.data;

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i], g = d[i + 1], b = d[i + 2];
          const maxCh = Math.max(r, g, b);

          // Dark navy background: all channels low, blue-dominant
          // Logo elements (teal/white/silver) all have maxCh > 100
          if (maxCh < 55) {
            d[i + 3] = 0;                                        // fully transparent
          } else if (maxCh < 120) {
            // Soft edge — fade proportionally so glow blends cleanly
            d[i + 3] = Math.round(((maxCh - 55) / 65) * d[i + 3]);
          }
          // maxCh >= 120 → logo element, keep fully opaque
        }

        ctx.putImageData(id, 0, 0);
        _processedSrc = canvas.toDataURL('image/png');
      } catch {
        // Canvas tainted (CORS) — fall back to original
        _processedSrc = src;
      }

      _processing = null;
      resolve(_processedSrc);
    };
    img.onerror = () => { _processing = null; resolve(src); };
    img.src = src;
  });

  return _processing;
}

export default function MatchifyLogo({
  size = 40,
  variant = 'full',
  className = '',
}) {
  const [src, setSrc] = useState(_processedSrc || '/logo.png');

  useEffect(() => {
    if (_processedSrc) return; // already processed
    removeBackground('/logo.png').then(setSrc);
  }, []);

  const imgStyle = {
    height: `${size}px`,
    width: `${Math.round(size * RATIO)}px`,
    display: 'block',
    objectFit: 'contain',
    flexShrink: 0,
    filter: 'drop-shadow(0 2px 14px rgba(0,212,255,0.55))',
  };

  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <img
        src={src}
        alt="Matchify.pro"
        style={imgStyle}
        draggable={false}
      />
    </span>
  );
}
