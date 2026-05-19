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
  let entryFeeBlock = '';
  if (fees.length === 1) {
    entryFeeBlock = `\nEntry Fee: ₹${formatPrize(fees[0])} Per Team`;
  } else if (fees.length > 1) {
    // Show per category
    const feeLines = cats
      .filter(c => c.entryFee != null)
      .map(c => `· ${c.name}: ₹${formatPrize(c.entryFee)}`)
      .join('\n');
    entryFeeBlock = `\nEntry Fee:\n${feeLines}`;
  }

  // ── Awards ─────────────────────────────────────────────────────
  // Aggregate across categories — take max prizes if multiple categories
  const totalWinner = cats.reduce((s, c) => s + (c.prizeWinner || 0), 0);
  const totalRunner = cats.reduce((s, c) => s + (c.prizeRunnerUp || 0), 0);
  const totalSemi   = cats.reduce((s, c) => s + (c.prizeSemiFinalist || 0), 0);

  let awardsBlock = '';
  if (totalWinner > 0 || totalRunner > 0 || totalSemi > 0) {
    const lines = ['🏆 Awards:'];
    if (totalWinner > 0) lines.push(`Winner: ₹${formatPrize(totalWinner)}`);
    if (totalRunner > 0) lines.push(`Runner up: ₹${formatPrize(totalRunner)}`);
    if (totalSemi > 0)   lines.push(`Semi Finalist: ₹${formatPrize(totalSemi)}`);
    awardsBlock = '\n' + lines.join('\n');
  }

  // ── Shuttle brand ──────────────────────────────────────────────
  const shuttleBlock = tournament.shuttleBrand
    ? `\n${tournament.shuttleBrand} Shuttle`
    : '';

  // ── Contact ────────────────────────────────────────────────────
  const contactPhone =
    tournament.contactPhone || tournament.whatsappNumber || tournament.organizer?.phone;
  const contactName = tournament.organizer?.name || tournament.organizer?.username || '';
  let contactBlock = '';
  if (contactPhone || contactName) {
    const contactStr = [contactName, contactPhone].filter(Boolean).join(' - ');
    contactBlock = `\n🔑 Contact: ${contactStr}`;
  }

  // ── Assemble ───────────────────────────────────────────────────
  const lines = [
    `MATCHIFY.PRO @${tournament.name.toUpperCase()}`,
    ``,
    venueStr ? `Venue: ${venueStr}` : null,
    `Date: ${dateStr} (${dayStr})`,
    timeStr ? `Time: ${timeStr}` : null,
  ].filter(l => l !== null);

  if (categoryLines) {
    lines.push('');
    lines.push('Category:');
    lines.push(categoryLines);
  }

  if (entryFeeBlock) lines.push(entryFeeBlock.trim());
  if (awardsBlock)   lines.push(awardsBlock.trim());
  if (shuttleBlock)  lines.push(shuttleBlock.trim());
  if (contactBlock)  lines.push('');
  if (contactBlock)  lines.push(contactBlock.trim());

  lines.push('');
  lines.push(`🔗 View & Register: ${url}`);
  lines.push('');
  lines.push('———————————');
  lines.push('🌐 www.matchify.pro');

  const text = lines.join('\n');

  return {
    title: `${tournament.name} — Matchify.pro`,
    text,
    url,
  };
}

/**
 * Fetch a URL as a File object for Web Share API.
 * Returns null on failure (CORS, network, etc.)
 */
async function urlToFile(url, filename = 'poster.jpg') {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type || 'image/jpeg' });
  } catch {
    return null;
  }
}

/**
 * Share a tournament with poster image(s) + WhatsApp-formatted text.
 *
 * Strategy:
 * 1. Build message
 * 2. If navigator.share + files supported → try to fetch poster → share with file
 * 3. Fallback: navigator.share text-only
 * 4. Fallback: open wa.me deep link
 * 5. Last resort: copy to clipboard
 *
 * @param {object} tournament  Full tournament object
 * @param {function} [setCopied]  Optional callback when clipboard fallback fires
 * @returns {Promise<'shared'|'copied'|'whatsapp'>}
 */
export async function shareTournament(tournament, setCopied) {
  const { title, text } = buildShareMessage(tournament);

  // ── Try Web Share API with poster file ────────────────────────
  if (navigator.share) {
    // Check if files are supported
    const canShareFiles = typeof navigator.canShare === 'function';

    // Get primary poster URL
    const primaryPoster = (tournament.posters || []).find(p => p.isPrimary) || tournament.posters?.[0];
    const posterUrl = primaryPoster?.url || primaryPoster?.imageUrl || primaryPoster?.preview;

    let shared = false;

    if (posterUrl && canShareFiles) {
      const file = await urlToFile(posterUrl, `${tournament.name.replace(/\s+/g, '_')}_poster.jpg`);
      if (file && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ title, text, files: [file] });
          shared = true;
        } catch (err) {
          // User cancelled or error — fall through
          if (err?.name === 'AbortError') return 'shared'; // user cancelled = intentional
        }
      }
    }

    if (!shared) {
      // Text-only share
      try {
        await navigator.share({ title, text });
        return 'shared';
      } catch (err) {
        if (err?.name === 'AbortError') return 'shared';
      }
    } else {
      return 'shared';
    }
  }

  // ── WhatsApp deep link fallback ────────────────────────────────
  const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank');
  return 'whatsapp';
}
