/**
 * Tournament WhatsApp share utility
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

const D = '──────────────────────';

/** Build slim WhatsApp message */
export function buildShareMessage(tournament) {
  const url = `${window.location.origin}/tournaments/${tournament.id}`;
  const cats = tournament.categories || [];

  // Date
  const startDate = new Date(tournament.startDate);
  const dateStr = startDate.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const dayStr = startDate.toLocaleDateString('en-IN', { weekday: 'long' });
  const timeStr = formatTime(tournament.matchStartTime);

  // Venue
  const venueStr = [tournament.venue, tournament.city].filter(Boolean).join(', ');

  // Categories — doubles → "Per Team"
  const catLines = cats.map(c => {
    const isDoubles = /double/i.test(c.name);
    const fee = c.entryFee != null
      ? ` — ₹${formatPrize(c.entryFee)}${isDoubles ? ' Per Team' : ''}`
      : '';
    return `🏸 ${c.name}${fee}`;
  });

  // Awards — use prizeDescription text first, else numeric
  const descLines = cats.map(c => c.prizeDescription).filter(Boolean).join('\n');
  let awardsLines = [];
  if (descLines) {
    awardsLines = descLines.split('\n').map(l => l.trim()).filter(Boolean);
  } else {
    const w = cats.reduce((s, c) => s + (c.prizeWinner || 0), 0);
    const r = cats.reduce((s, c) => s + (c.prizeRunnerUp || 0), 0);
    const s = cats.reduce((s, c) => s + (c.prizeSemiFinalist || 0), 0);
    if (w > 0) awardsLines.push(`🥇 Winner: ₹${formatPrize(w)}`);
    if (r > 0) awardsLines.push(`🥈 Runner up: ₹${formatPrize(r)}`);
    if (s > 0) awardsLines.push(`🥉 Semi Finalist: ₹${formatPrize(s)}`);
  }

  // Contact
  const contactPhone =
    tournament.contactPhone || tournament.whatsappNumber || tournament.organizer?.phone;
  const contactName = tournament.organizer?.name || tournament.organizer?.username || '';

  const lines = [];

  // Header
  lines.push('🎾 *MATCHIFY.PRO PRESENTS*');
  lines.push(D);
  lines.push(`*${tournament.name}*`);
  lines.push(D);

  // Venue / Date / Time — compact, no blank lines
  if (venueStr)  lines.push(`📍 ${venueStr}`);
  lines.push(`📅 ${dateStr} (${dayStr})`);
  if (timeStr)   lines.push(`⏰ ${timeStr}`);
  lines.push(D);

  // Categories
  if (catLines.length) {
    catLines.forEach(l => lines.push(l));
    lines.push(D);
  }

  // Awards
  if (awardsLines.length) {
    lines.push('🏆 Awards:');
    awardsLines.forEach(l => lines.push(l));
    lines.push(D);
  }

  // Contact — single line
  if (contactName || contactPhone) {
    const parts = [contactName, contactPhone].filter(Boolean).join(' · ');
    lines.push(`📞 ${parts}`);
    lines.push(D);
  }

  // Link
  lines.push(`🔗 ${url}`);
  lines.push(D);
  lines.push('🌐 www.matchify.pro');

  const text = lines.join('\n');

  return {
    title: `${tournament.name} — Matchify.pro`,
    text,
    url,
  };
}

/**
 * Share tournament — text only (no image attachment).
 * Web Share API → wa.me fallback.
 */
export async function shareTournament(tournament) {
  const { title, text } = buildShareMessage(tournament);

  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'shared';
    }
  }

  // Fallback: open WhatsApp with text
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  return 'whatsapp';
}
