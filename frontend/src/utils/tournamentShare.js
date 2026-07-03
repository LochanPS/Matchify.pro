/**
 * Tournament WhatsApp share utility
 * Used by TournamentDiscoveryPage and TournamentDetailPage
 */
import { sportEmoji } from '../config/sports';

// Always share the LIVE site — never a localhost/preview origin.
const SHARE_BASE = 'https://matchify.pro';

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

/** Build slim WhatsApp message */
export function buildShareMessage(tournament) {
  const url = `${SHARE_BASE}/tournaments/${tournament.id}`;
  const cats = tournament.categories || [];
  const catEmoji = sportEmoji(tournament.sport);

  // Date
  const startDate = new Date(tournament.startDate);
  const dateStr = startDate.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const dayStr = startDate.toLocaleDateString('en-IN', { weekday: 'long' });
  const timeStr = formatTime(tournament.matchStartTime);

  // Venue
  const venueStr = [tournament.venue, tournament.city].filter(Boolean).join(', ');

  // Categories — each with its own direct link to that category's draws.
  const catBlocks = cats.map(c => {
    const isDoubles = /double/i.test(c.name);
    const fee = c.entryFee != null
      ? ` — ₹${formatPrize(c.entryFee)}${isDoubles ? ' Per Team' : ''}`
      : '';
    return {
      title: `${catEmoji} ${c.name}${fee}`,
      url: `${SHARE_BASE}/tournaments/${tournament.id}/draws/${c.id}`,
    };
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

  // Sections separated by a single blank line (clean on mobile — no heavy dividers).
  const lines = [];
  const gap = () => lines.push('');

  // Header + name
  lines.push('🏆 *MATCHIFY.PRO PRESENTS*');
  lines.push(`*${tournament.name}*`);
  gap();

  // Venue / Date / Time
  if (venueStr)  lines.push(`📍 ${venueStr}`);
  lines.push(`📅 ${dateStr} (${dayStr})`);
  if (timeStr)   lines.push(`⏰ ${timeStr}`);

  // Categories — name, then its tap-to-open draw link.
  if (catBlocks.length) {
    gap();
    catBlocks.forEach(({ title, url: catUrl }) => {
      lines.push(title);
      lines.push(catUrl);
    });
  }

  // Awards
  if (awardsLines.length) {
    gap();
    lines.push('🏆 *Awards*');
    awardsLines.forEach(l => lines.push(l));
  }

  // Contact
  if (contactName || contactPhone) {
    gap();
    lines.push(`📞 ${[contactName, contactPhone].filter(Boolean).join(' · ')}`);
  }

  // Tournament link
  gap();
  lines.push(`🔗 ${url}`);
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
