/**
 * Safely extract a human-readable error string from any error object.
 * Prevents React crash when backend returns object/array instead of string.
 */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (!err) return fallback;

  const status = err?.response?.status;
  const data = err?.response?.data;

  // Generic 404 from Express catch-all (route not found) → user-friendly message
  if (status === 404 && data?.error === 'Not Found' && (data?.message?.includes('Cannot') || data?.message?.includes('not found'))) {
    return 'Service unavailable. Please check your connection and try again.';
  }

  if (data) {
    const raw = data.error || data.message || data.msg;

    if (typeof raw === 'string' && raw.trim()) return raw.trim();

    // Validation array: [{ message: "..." }, ...]
    if (Array.isArray(raw)) {
      const msgs = raw.map(e => e?.message || e?.msg || String(e)).filter(Boolean);
      if (msgs.length) return msgs.join('. ');
    }

    // Object with message key
    if (raw && typeof raw === 'object') {
      const msg = raw.message || raw.msg || raw.error;
      if (typeof msg === 'string') return msg;
    }

    // Entire data is a string
    if (typeof data === 'string') return data;
  }

  // Axios/network error — translate raw technical messages to human language.
  // Note: navigator.onLine is only trustworthy when FALSE. On iOS Safari it is
  // often stuck at `true` even with no connectivity, so we never claim the
  // server is fine based on onLine — an online-looking network error is phrased
  // to cover both a connectivity drop AND the server being unreachable.
  if (err?.message && typeof err.message === 'string') {
    const msg = err.message;
    const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;

    // Timeout — request started but the server didn't answer in time (cold start)
    if (msg.includes('timeout') || msg.includes('timed out') || err.isTimeout || err.code === 'ECONNABORTED') {
      if (isOffline) return 'No internet connection. Please check your network and try again.';
      return 'The server is taking longer than usual to respond — it may be waking up. Please try again in a moment.';
    }

    // Could not reach the server at all (network error / CORS / DNS / offline)
    if (msg === 'Network Error' || msg.toLowerCase().includes('network') || msg.includes('ECONNREFUSED') || err.code === 'ERR_NETWORK') {
      if (isOffline) return 'No internet connection. Please check your network and try again.';
      // Can't tell connectivity vs server from the browser — name both, honestly.
      return "Couldn't reach Matchify — please check your internet connection and try again.";
    }
    return msg;
  }

  // No message and no response at all — treat as a connection failure, not a vague error
  if (!err?.response) {
    return "Couldn't reach Matchify — please check your internet connection and try again.";
  }

  return fallback;
}
