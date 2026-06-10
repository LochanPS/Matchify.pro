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

  // Axios/network error — translate raw technical messages to human language
  if (err?.message && typeof err.message === 'string') {
    const msg = err.message;
    if (msg === 'Network Error' || msg.toLowerCase().includes('network')) {
      // navigator.onLine = false → actual internet issue
      // navigator.onLine = true  → server is down / starting up (cold start)
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return 'No internet connection. Please check your network.';
      }
      return 'Server is temporarily unavailable. Please wait a moment and try again.';
    }
    if (msg.includes('timeout') || msg.includes('timed out') || err.isTimeout)
      return 'Server is taking longer than usual to respond. Please try again.';
    if (msg.includes('ECONNREFUSED') || msg.includes('ECONNABORTED'))
      return 'Could not reach the server. Please try again shortly.';
    return msg;
  }

  return fallback;
}
