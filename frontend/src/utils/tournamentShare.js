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

/**
 * Resolve image URL — handles relative /uploads/ paths from local/backend.
 * In production, poster URLs are full Supabase URLs already.
 */
function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('/uploads')) {
    const base =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL?.replace('/api', '')) ||
      'https://matchify-probackend.vercel.app';
    return `${base}${url}`;
  }
  return url;
}

/** Build the WhatsApp-perfect share message */
export function buildShareMessage(tournament) {
  const url = `${window.location.origin}/tournaments/${tournament.id}`;
  const cats = tournament.categories || [];

  // ── Date line ──────────────────────────────────────────────────
  const startDate = new Date(tournament.startDate);
  const dateStr = startDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const dayStr = startDate.toLocaleDateString('en-IN', { weekday: 'long' });

  // ── Time line ──────────────────────────────────────────────────
  const timeStr = formatTime(tournament.matchStartTime);

  // ── Venue line ─────────────────────────────────────────────────
  const venueParts = [tournament.venue, tournament.city].filter(Boolean);
  const venueStr = venueParts.join(', ');

  // ── Category bullets ───────────────────────────────────────────
  const categoryLines = cats.map(c => `· ${c.name}`).join('\n');

  // ── Entry Fee ──────────────────────────────────────────────────
  // If all same fee → single line; if different → per category
  const fees = [...new Set(cats.map(c => c.entryFee).filter(f => f != null))];
  let entryFeeLines = [];
  if (fees.length === 1) {
    entryFeeLines = [`Entry Fee: ₹${formatPrize(fees[0])} Per Team`];
  } else if (fees.length > 1) {
    entryFeeLines = [
      'Entry Fee:',
      ...cats
        .filter(c => c.entryFee != null)
        .map(c => `· ${c.name}: ₹${formatPrize(c.entryFee)}`),
    ];
  }

  // ── Awards ─────────────────────────────────────────────────────
  const totalWinner = cats.reduce((s, c) => s + (c.prizeWinner || 0), 0);
  const totalRunner = cats.reduce((s, c) => s + (c.prizeRunnerUp || 0), 0);
  const totalSemi   = cats.reduce((s, c) => s + (c.prizeSemiFinalist || 0), 0);
  let awardsLines = [];
  if (totalWinner > 0 || totalRunner > 0 || totalSemi > 0) {
    awardsLines.push('🏆 Awards:');
    if (totalWinner > 0) awardsLines.push(`Winner: ₹${formatPrize(totalWinner)}`);
    if (totalRunner > 0) awardsLines.push(`Runner up: ₹${formatPrize(totalRunner)}`);
    if (totalSemi > 0)   awardsLines.push(`Semi Finalist: ₹${formatPrize(totalSemi)}`);
  }

  // ── Shuttle brand ──────────────────────────────────────────────
  const shuttleLine = tournament.shuttleBrand ? `${tournament.shuttleBrand} Shuttle` : null;

  // ── Contact ────────────────────────────────────────────────────
  const contactPhone =
    tournament.contactPhone || tournament.whatsappNumber || tournament.organizer?.phone;
  const contactName = tournament.organizer?.name || tournament.organizer?.username || '';
  const contactStr = [contactName, contactPhone].filter(Boolean).join(' - ');
  const contactLine = contactStr ? `🔑 Contact: ${contactStr}` : null;

  // ── Assemble ───────────────────────────────────────────────────
  // Header: MATCHIFY.PRO on its own line, tournament name below (bold in WhatsApp)
  const parts = [
    `*MATCHIFY.PRO*`,
    `*${tournament.name.toUpperCase()}*`,
    ``,
  ];

  if (venueStr) parts.push(`Venue: ${venueStr}`);
  parts.push(`Date: ${dateStr} (${dayStr})`);
  if (timeStr)  parts.push(`Time: ${timeStr}`);

  if (categoryLines) {
    parts.push('');
    parts.push('Category:');
    parts.push(categoryLines);
  }

  if (entryFeeLines.length) {
    parts.push('');
    parts.push(...entryFeeLines);
  }

  if (awardsLines.length) {
    parts.push('');
    parts.push(...awardsLines);
  }

  if (shuttleLine) {
    parts.push('');
    parts.push(shuttleLine);
  }

  if (contactLine) {
    parts.push('');
    parts.push(contactLine);
  }

  parts.push('');
  parts.push(`🔗 View & Register: ${url}`);
  parts.push('');
  parts.push('———————————');
  parts.push('🌐 www.matchify.pro');

  const text = parts.join('\n');

  return {
    title: `${tournament.name} — Matchify.pro`,
    text,
    url,
  };
}

/**
 * Fetch a URL as a File object for Web Share API.
 * Returns null on any failure (CORS, network, etc.)
 */
async function urlToFile(rawUrl, filename = 'poster.jpg') {
  const url = resolveImageUrl(rawUrl);
  if (!url) return null;
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

/**
 * Get the primary poster's resolved full URL from a tournament object.
 */
function getPosterUrl(tournament) {
  const posters = tournament.posters || [];
  const primary = posters.find(p => p.isPrimary) || posters[0];
  if (!primary) return null;
  // poster.imageUrl is the canonical field from the DB
  return resolveImageUrl(primary.imageUrl || primary.url || primary.preview);
}

/**
 * Share a tournament with poster image + WhatsApp-formatted text.
 *
 * Priority:
 * 1. Web Share API + poster File (mobile native share sheet with image)
 * 2. Web Share API text-only (if image fetch fails)
 * 3. wa.me deep link (desktop / no share API)
 *
 * @param {object} tournament  Full tournament object from API
 * @returns {Promise<'shared'|'whatsapp'>}
 */
export async function shareTournament(tournament) {
  const { title, text } = buildShareMessage(tournament);

  if (navigator.share) {
    // ── Attempt share with image ──────────────────────────────────
    if (typeof navigator.canShare === 'function') {
      const posterUrl = getPosterUrl(tournament);
      if (posterUrl) {
        const safeName = tournament.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const file = await urlToFile(posterUrl, `${safeName}_poster.jpg`);
        if (file && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({ title, text, files: [file] });
            return 'shared';
          } catch (err) {
            if (err?.name === 'AbortError') return 'shared'; // user dismissed = ok
            // Otherwise fall through to text-only
          }
        }
      }
    }

    // ── Text-only share fallback ───────────────────────────────────
    try {
      await navigator.share({ title, text });
      return 'shared';
    } catch (err) {
      if (err?.name === 'AbortError') return 'shared';
      // Fall through to wa.me
    }
  }

  // ── wa.me deep link fallback (desktop or unsupported browsers) ──
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
  return 'whatsapp';
}
