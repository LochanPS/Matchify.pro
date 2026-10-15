/**
 * Tournament WhatsApp share utility
 * Used by TournamentDiscoveryPage and TournamentDetailPage
 */

// Always share the LIVE site — never a localhost/preview origin.
const SHARE_BASE = 'https://matchify.pro';   // full link used for the Web Share API `url` field
const DISPLAY_BASE = 'matchify.pro';         // clean text shown in the message (WhatsApp still linkifies it)

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

/** Parse a stored date string safely → Date, or null if unparseable. */
function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/** "2026-11-01" → "1 November 2026" */
function formatDate(d) {
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Build a polished, professional WhatsApp share message.
 *
 * Design goals: reads like a clean event poster in plain text — a strong
 * header, a crisp info subtitle built from real data, and clearly labelled
 * sections (DATE & VENUE, EVENTS, PRIZES, REGISTER, FOLLOW LIVE). Every block
 * is conditional, so the message stays tight when a field is missing. No
 * emojis — only WhatsApp *bold* and divider rules carry the styling.
 */
export function buildShareMessage(tournament) {
  // Short, readable share links via the /t/ resolver. Uses the slug when present
  // (e.g. /t/vras-djs); falls back to the id, which the resolver also accepts.
  const tRef = tournament.slug || tournament.id;
  const url = `${SHARE_BASE}/t/${tRef}`;        // full https link (returned for Web Share API)
  const urlText = `${DISPLAY_BASE}/t/${tRef}`;  // clean, no-protocol link shown in the message
  const cats = tournament.categories || [];

  // Dates
  const startDate = parseDate(tournament.startDate);
  const dateStr = startDate ? formatDate(startDate) : null;
  const dayStr = startDate ? startDate.toLocaleDateString('en-IN', { weekday: 'long' }) : null;
  const timeStr = formatTime(tournament.matchStartTime);
  const closeDate = parseDate(tournament.registrationCloseDate);

  // Venue
  const venueStr = [tournament.venue, tournament.city].filter(Boolean).join(', ');

  // Entry fees — min fee drives the "Entry from ₹X" subtitle hook.
  const fees = cats.map(c => c.entryFee).filter(v => v != null && !isNaN(v));
  const minFee = fees.length ? Math.min(...fees) : null;

  // Subtitle: a crisp, poster-style info line from real data —
  // e.g. "Badminton · 8 events · Entry from ₹700". Skips any piece that's absent.
  const sport = tournament.sport || 'Badminton';
  // Skip the sport in the subtitle when the name already says it (avoids
  // "...Badminton tournament" followed by "Badminton · ...").
  const nameHasSport = (tournament.name || '').toLowerCase().includes(sport.toLowerCase());
  const subtitleParts = nameHasSport ? [] : [sport];
  if (cats.length) subtitleParts.push(`${cats.length} ${cats.length === 1 ? 'event' : 'events'}`);
  if (minFee != null) subtitleParts.push(`Entry from ₹${formatPrize(minFee)}`);
  const subtitle = subtitleParts.join(' · ');

  // Categories — plain "name — ₹fee", one clean line each.
  const catLines = cats.map(c => {
    const fee = c.entryFee != null ? ` — ₹${formatPrize(c.entryFee)}` : '';
    return `${c.name}${fee}`;
  });

  // Awards — use prizeDescription text first, else numeric totals.
  const descLines = cats.map(c => c.prizeDescription).filter(Boolean).join('\n');
  let awardsLines = [];
  if (descLines) {
    awardsLines = descLines.split('\n').map(l => l.trim()).filter(Boolean);
  } else {
    const w = cats.reduce((s, c) => s + (c.prizeWinner || 0), 0);
    const r = cats.reduce((s, c) => s + (c.prizeRunnerUp || 0), 0);
    const s = cats.reduce((s, c) => s + (c.prizeSemiFinalist || 0), 0);
    if (w > 0) awardsLines.push(`Winner — ₹${formatPrize(w)}`);
    if (r > 0) awardsLines.push(`Runner-up — ₹${formatPrize(r)}`);
    if (s > 0) awardsLines.push(`Semi-finalist — ₹${formatPrize(s)}`);
  }

  // Contact
  const contactPhone =
    tournament.contactPhone || tournament.whatsappNumber || tournament.organizer?.phone;
  const contactName = tournament.organizer?.name || tournament.organizer?.username || '';

  const lines = [];
  const D = '━━━━━━━━━━━━━';
  const div = () => lines.push(D);

  // Header — brand, tournament name, then the info subtitle.
  lines.push('*MATCHIFY.PRO PRESENTS*');
  lines.push('');
  lines.push(`*${tournament.name}*`);
  if (subtitle) lines.push(subtitle);
  div();

  // Date & venue.
  lines.push('*DATE & VENUE*');
  if (dateStr) lines.push(dayStr ? `${dateStr} (${dayStr})` : dateStr);
  if (timeStr) lines.push(`Matches from ${timeStr}`);
  if (venueStr) lines.push(venueStr);
  if (tournament.latitude != null && tournament.longitude != null) {
    lines.push(`Location — ${DISPLAY_BASE}/t/${tRef}/location`);
  }
  div();

  // Events & entry fees.
  if (catLines.length) {
    lines.push('*EVENTS & ENTRY FEES*');
    catLines.forEach(l => lines.push(l));
    div();
  }

  // Prizes & awards (if the organizer set any).
  if (awardsLines.length) {
    lines.push('*PRIZES & AWARDS*');
    awardsLines.forEach(l => lines.push(l));
    div();
  }

  // Register — the primary call to action, with a gentle deadline nudge.
  lines.push('*REGISTER NOW*');
  if (closeDate) lines.push(`Registration closes ${formatDate(closeDate)}`);
  lines.push(`${DISPLAY_BASE}/t/${tRef}/register`);
  div();

  // Follow the action — live scores and draws.
  lines.push('*FOLLOW LIVE*');
  lines.push(`Live scores — ${DISPLAY_BASE}/t/${tRef}/live`);
  lines.push(`Draws & fixtures — ${urlText}`);
  div();

  // Organiser credit + brand sign-off.
  if (contactName || contactPhone) {
    lines.push(`Organised by ${[contactName, contactPhone].filter(Boolean).join(' · ')}`);
  }
  lines.push('Powered by Matchify.pro');

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
