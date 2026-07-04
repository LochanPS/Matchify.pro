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

/** Build slim WhatsApp message */
export function buildShareMessage(tournament) {
  // Short, readable share links via the /t/ resolver. Uses the slug when present
  // (e.g. /t/vras-djs); falls back to the id, which the resolver also accepts.
  const tRef = tournament.slug || tournament.id;
  const url = `${SHARE_BASE}/t/${tRef}`;        // full https link (returned for Web Share API)
  const urlText = `${DISPLAY_BASE}/t/${tRef}`;  // clean, no-protocol link shown in the message
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

  // Categories — plain "name — ₹fee", one clean line each (no icon, no "Per Team"
  // suffix that pushed the line to wrap on mobile).
  const catBlocks = cats.map(c => {
    const fee = c.entryFee != null ? ` — ₹${formatPrize(c.entryFee)}` : '';
    return { title: `${c.name}${fee}` };
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
    if (w > 0) awardsLines.push(`Winner: ₹${formatPrize(w)}`);
    if (r > 0) awardsLines.push(`Runner up: ₹${formatPrize(r)}`);
    if (s > 0) awardsLines.push(`Semi Finalist: ₹${formatPrize(s)}`);
  }

  // Contact
  const contactPhone =
    tournament.contactPhone || tournament.whatsappNumber || tournament.organizer?.phone;
  const contactName = tournament.organizer?.name || tournament.organizer?.username || '';

  // Plain, icon-free layout — clean and simple on mobile. Dividers separate the
  // main sections; each link sits under a clear text label.
  const lines = [];
  const D = '━━━━━━━━━━━━━';
  const div = () => lines.push(D);

  // Header — brand line, blank line, then the tournament name on its own.
  lines.push('*MATCHIFY.PRO PRESENTS*');
  lines.push('');
  lines.push(`*${tournament.name}*`);
  div();

  // Venue / date, then the map link under a label.
  if (venueStr)  lines.push(venueStr);
  lines.push(`${dateStr} (${dayStr})`);
  if (timeStr)   lines.push(timeStr);
  if (tournament.latitude != null && tournament.longitude != null) {
    lines.push('');
    lines.push('Location');
    lines.push(`${DISPLAY_BASE}/t/${tRef}/location`);
  }
  div();

  // Categories — plain list of names + fees, one line each — then the Register
  // link right below (the main call to action).
  if (catBlocks.length) {
    catBlocks.forEach(({ title }) => lines.push(title));
  }
  lines.push('');
  lines.push('Register');
  lines.push(`${DISPLAY_BASE}/t/${tRef}/register`);
  div();

  // Awards (if the organizer set prizes).
  if (awardsLines.length) {
    lines.push('*Awards*');
    awardsLines.forEach(l => lines.push(l));
    div();
  }

  // Live scores, then the tournament (draws) link right below it — each labelled.
  lines.push('Live scores');
  lines.push(`${DISPLAY_BASE}/t/${tRef}/live`);
  lines.push('');
  lines.push('Draws');
  lines.push(urlText);
  div();

  // Contact + website.
  if (contactName || contactPhone) {
    lines.push([contactName, contactPhone].filter(Boolean).join(' · '));
  }
  lines.push('matchify.pro');

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
