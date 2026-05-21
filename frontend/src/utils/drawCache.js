/**
 * Draw cache — stores last successful draw response in localStorage.
 * Key: draw_<tournamentId>_<categoryId>
 * TTL: 30 minutes (stale after that, user gets fresh spinner)
 */
const TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getDrawCache(tournamentId, categoryId) {
  try {
    const raw = localStorage.getItem(`draw_${tournamentId}_${categoryId}`);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > TTL_MS) {
      localStorage.removeItem(`draw_${tournamentId}_${categoryId}`);
      return null;
    }
    return data;
  } catch {
    return null; // corrupted cache — just fall through to normal load
  }
}

export function setDrawCache(tournamentId, categoryId, data) {
  try {
    localStorage.setItem(
      `draw_${tournamentId}_${categoryId}`,
      JSON.stringify({ data, ts: Date.now() })
    );
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}
