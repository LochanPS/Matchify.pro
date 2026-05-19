/**
 * Tournament WhatsApp-perfect share utility
 * Used by TournamentDiscoveryPage and TournamentDetailPage
 */

/** Convert "08:30" → "8:30 AM" */
function formatTime(timeStr) {
  if (!timeStr) return null;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Format number with commas: 10000 → "10,000" */
function formatPrize(n) {
  return Number(n).toLocaleString('en-IN');
}

/** Divider line used between sections */
const D = '─────────────────────────────────────';

/** Build the WhatsApp-perfect share message */
export function buildShareMessage(tournament) {
  const url = `${window.location.origin}/tournaments/${tournament.id}`;
  const cats = tournament.categories || [];

  // ── Date ───────────────────────────────────────────────────────
  const startDate = new Date(tournament.startDate);
  const dateStr = startDate.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const dayStr = startDate.toLocaleDateString('en-IN', { weekday: 'long' });

  // ── Time ───────────────────────────────────────────────────────
  const timeStr = formatTime(tournament.matchStartTime);

  // ── Venue ──────────────────────────────────────────────────────
  const venueStr = [tournament.venue, tournament.city].filter(Boolean).join(', ');

  // ── Categories with per-category entry fee ─────────────────────
  // Doubles category → show "Per Team", Singles → just the fee
  const catLines = cats.map(c => {
    const isDoubles = /double/i.test(c.name);
    const fee = c.entryFee != null
      ? ` - ₹${formatPrize(c.entryFee)}${isDoubles ? ' Per Team' : ''}`
      : '';
    return `${c.name}${fee}`;
  });

  // ── Awards ─────────────────────────────────────────────────────
  // Use prizeDescription text if set, else build from numeric prizes
  const descLines = cats.map(c => c.prizeDescription).filter(Boolean).join('\n');
  let awardsLines = [];
  if (descLines) {
    awardsLines = descLines.split('\n').map(l => l.trim()).filter(Boolean);
  } else {
    const totalWinner = cats.reduce((s, c) => s + (c.prizeWinner || 0), 0);
    const totalRunner = cats.reduce((s, c) => s + (c.prizeRunnerUp || 0), 0);
    const totalSemi   = cats.reduce((s, c) => s + (c.prizeSemiFinalist || 0), 0);
    if (totalWinner > 0) awardsLines.push(`🥇 Winner: ₹${formatPrize(totalWinner)}`);
    if (totalRunner > 0) awardsLines.push(`🥈 Runner up: ₹${formatPrize(totalRunner)}`);
    if (totalSemi > 0)   awardsLines.push(`🥉 Semi Finalist: ₹${formatPrize(totalSemi)}`);
  }

  // ── Contact ────────────────────────────────────────────────────
  const contactPhone =
    tournament.contactPhone || tournament.whatsappNumber || tournament.organizer?.phone;
  const contactName = tournament.organizer?.name || tournament.organizer?.username || '';

  // ── Assemble — each block separated by divider ─────────────────
  const lines = [];

  // 1. Header
  lines.push('MATCHIFY.PRO PRESENTS');
  lines.push(D);

  // 2. Tournament name
  lines.push(tournament.name);
  lines.push(D);

  // 3. Venue / Date / Time
  if (venueStr) lines.push(`Venue: ${venueStr}`);
  lines.push('');
  lines.push(`Date: ${dateStr} (${dayStr})`);
  lines.push('');
  if (timeStr) { lines.push(`Time: ${timeStr}`); lines.push(''); }
  lines.push(D);

  // 4. Categories + entry fees
  if (catLines.length) {
    catLines.forEach(l => lines.push(l));
    lines.push(D);
  }

  // 5. Awards
  if (awardsLines.length) {
    lines.push('🏆 Awards:');
    awardsLines.forEach(l => lines.push(l));
    lines.push(D);
  }

  // 6. Contact
  if (contactName || contactPhone) {
    lines.push('📞 Contact');
    if (contactName)  lines.push(contactName);
    if (contactPhone) lines.push(contactPhone);
    lines.push(D);
  }

  // 7. Link
  lines.push('🔗 View & Register:');
  lines.push(url);
  lines.push(D);

  // 8. Footer
  lines.push('🌐 www.matchify.pro');
  lines.push(D);

  const text = lines.join('\n');

  return {
    title: `${tournament.name} — Matchify.pro`,
    text,
    url,
  };
}

/** Fetch a URL as a File. Returns null on any failure. */
async function urlToFile(url, filename = 'poster.jpg') {
  if (!url) return null;
  // Resolve relative /uploads/ paths to full backend URL
  if (url.startsWith('/uploads')) {
    const base =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL?.replace('/api', '')) ||
      'https://matchify-probackend.vercel.app';
    url = `${base}${url}`;
  }
  try {
    const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.size) return null;
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}

/** Get primary poster URL from tournament object. */
function getPosterUrl(tournament) {
  const posters = tournament.posters || [];
  const primary = posters.find(p => p.isPrimary) || posters[0];
  return primary?.imageUrl || primary?.url || primary?.preview || null;
}

/**
 * Share a tournament — image first, message as caption.
 *
 * Strategy:
 * 1. If poster available → share image file only via Web Share API
 *    + copy message text to clipboard simultaneously
 *    → Returns 'image' so caller can show "Caption copied — paste in WhatsApp"
 * 2. No poster / file share not supported → share full text via Web Share API
 * 3. No Web Share API → open wa.me deep link with full text
 *
 * @param {object} tournament  Full tournament object from API
 * @returns {Promise<'image'|'shared'|'whatsapp'>}
 */
export async function shareTournament(tournament) {
  const { title, text } = buildShareMessage(tournament);

  if (navigator.share) {
    // ── Try image + text together ─────────────────────────────────
    if (typeof navigator.canShare === 'function') {
      const posterUrl = getPosterUrl(tournament);
      if (posterUrl) {
        const safeName = tournament.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const file = await urlToFile(posterUrl, `${safeName}_poster.jpg`);
        if (file && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ files: [file], text });
            return 'shared';
          } catch (err) {
            if (err?.name === 'AbortError') return 'shared';
            // Fall through to text-only share
          }
        }
      }
    }

    // ── Text-only share fallback ──────────────────────────────────
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'shared';
    }
  }

  // ── wa.me deep link fallback (desktop / unsupported) ─────────
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
  return 'whatsapp';
}
