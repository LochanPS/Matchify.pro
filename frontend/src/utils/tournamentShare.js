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


const DIVIDER = '———————————————————';

/** Build the WhatsApp-perfect share message */
export function buildShareMessage(tournament) {
  const url = `${window.location.origin}/tournaments/${tournament.id}`;
  const cats = tournament.categories || [];

  // ── Date ───────────────────────────────────────────────────────
  const startDate = new Date(tournament.startDate);
  const dateStr = startDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const dayStr = startDate.toLocaleDateString('en-IN', { weekday: 'long' });

  // ── Time ───────────────────────────────────────────────────────
  const timeStr = formatTime(tournament.matchStartTime);

  // ── Venue ──────────────────────────────────────────────────────
  const venueParts = [tournament.venue, tournament.city].filter(Boolean);
  const venueStr = venueParts.join(', ');

  // ── Categories ─────────────────────────────────────────────────
  const categoryLines = cats.map(c => `  · ${c.name}`).join('\n');

  // ── Entry Fee ──────────────────────────────────────────────────
  // All same → single value line; different → per-category lines
  const fees = [...new Set(cats.map(c => c.entryFee).filter(f => f != null))];
  let entryFeeSection = null;
  if (fees.length === 1) {
    entryFeeSection = `Entry Fee:\n₹${formatPrize(fees[0])} Per Team`;
  } else if (fees.length > 1) {
    const feeLines = cats
      .filter(c => c.entryFee != null)
      .map(c => `  · ${c.name}: ₹${formatPrize(c.entryFee)}`)
      .join('\n');
    entryFeeSection = `Entry Fee:\n${feeLines}`;
  }

  // ── Awards ─────────────────────────────────────────────────────
  // Use prizeDescription (text) if set; else fall back to numeric amounts
  let awardsSection = null;
  const descLines = cats
    .map(c => c.prizeDescription)
    .filter(Boolean)
    .join('\n');

  if (descLines) {
    awardsSection = `🏆 Awards:\n${descLines}`;
  } else {
    const totalWinner = cats.reduce((s, c) => s + (c.prizeWinner || 0), 0);
    const totalRunner = cats.reduce((s, c) => s + (c.prizeRunnerUp || 0), 0);
    const totalSemi   = cats.reduce((s, c) => s + (c.prizeSemiFinalist || 0), 0);
    if (totalWinner > 0 || totalRunner > 0 || totalSemi > 0) {
      const lines = ['🏆 Awards:'];
      if (totalWinner > 0) lines.push(`🥇 Winner: ₹${formatPrize(totalWinner)}`);
      if (totalRunner > 0) lines.push(`🥈 Runner up: ₹${formatPrize(totalRunner)}`);
      if (totalSemi > 0)   lines.push(`🥉 Semi Finalist: ₹${formatPrize(totalSemi)}`);
      awardsSection = lines.join('\n');
    }
  }

  // ── Shuttle ────────────────────────────────────────────────────
  const shuttleSection = tournament.shuttleBrand
    ? `${tournament.shuttleBrand} will be used`
    : null;

  // ── Contact ────────────────────────────────────────────────────
  const contactPhone =
    tournament.contactPhone || tournament.whatsappNumber || tournament.organizer?.phone;
  const contactName = tournament.organizer?.name || tournament.organizer?.username || '';
  let contactSection = null;
  if (contactName || contactPhone) {
    const lines = ['🔑 Contact:'];
    if (contactName)  lines.push(contactName);
    if (contactPhone) lines.push(contactPhone);
    contactSection = lines.join('\n');
  }

  // ── Assemble ───────────────────────────────────────────────────
  const sections = [];

  // Header block (title between dividers)
  sections.push([
    DIVIDER,
    `MATCHIFY.PRO @${tournament.name.toUpperCase()}`,
    DIVIDER,
  ].join('\n'));

  // Venue
  if (venueStr) sections.push(`Venue: ${venueStr}`);

  // Date
  sections.push(`Date: ${dateStr} (${dayStr})`);

  // Time
  if (timeStr) sections.push(`Time: ${timeStr}`);

  // Categories
  if (categoryLines) {
    sections.push(`Category:\n${categoryLines}`);
  }

  // Entry fee
  if (entryFeeSection) sections.push(entryFeeSection);

  // Awards
  if (awardsSection) sections.push(awardsSection);

  // Shuttle
  if (shuttleSection) sections.push(shuttleSection);

  // Contact
  if (contactSection) sections.push(contactSection);

  // Link
  sections.push(`🔗 View & Register:\n${url}`);

  // Footer
  sections.push(`${DIVIDER}\n🌐 www.matchify.pro`);

  // Join sections with blank line between each
  const text = sections.join('\n\n');

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
