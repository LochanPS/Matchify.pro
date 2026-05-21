import axios from 'axios';

// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://matchify-probackend.vercel.app/api';

if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000, // 25s — cold-start headroom (Vercel serverless ~10-15s + Prisma connect)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Public paths that should never trigger a login redirect on 401
const PUBLIC_PATHS = ['/login', '/register', '/', '/leaderboard', '/tournaments', '/privacy', '/terms'];

// ── Silent token refresh ───────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, newToken = null) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(newToken)
  );
  refreshQueue = [];
}

function doLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
}

// ── Retryable status codes for GET requests ────────────────────────────────
// Vercel cold starts often return 500/502/504 on first hit; a second attempt
// almost always succeeds. Only GET is retried — POST/PUT/DELETE are not
// idempotent and are handled explicitly per handler where needed.
const RETRY_STATUS = new Set([500, 502, 503, 504]);
const MAX_AUTO_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const isGet = (config.method || '').toLowerCase() === 'get';
    const retryCount = config._retryCount || 0;

    // ── Auto-retry GET requests on 5xx / network errors ──────────────────
    // Transparent: calling code never sees transient cold-start failures.
    const isRetryable =
      isGet &&
      retryCount < MAX_AUTO_RETRIES &&
      !config._noRetry && // opt-out flag
      (
        RETRY_STATUS.has(error.response?.status) ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        !error.response // pure network error
      );

    if (isRetryable) {
      config._retryCount = retryCount + 1;
      await sleep(RETRY_DELAY_MS);
      return api(config);
    }

    // ── Timeout — translate to friendly message ───────────────────────────
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        ...error,
        message: 'Server took too long to respond. Please try again.',
        isTimeout: true,
      });
    }

    // ── 401 — try silent token refresh, then replay ───────────────────────
    if (error.response?.status === 401) {
      if (config?._skipLogout) {
        return Promise.reject(error);
      }

      const path = window.location.pathname;
      const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
      if (isPublicPath) return Promise.reject(error);

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) { doLogout(); return Promise.reject(error); }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          config.headers.Authorization = `Bearer ${newToken}`;
          return api(config);
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { timeout: 15000 }
        );
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(config);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // 503/502/504 = server busy (DB connection pool exhausted) — NOT a real
        // auth failure. Do NOT logout: the user's session is still valid; the
        // server just couldn't handle the request right now. Let the caller
        // surface an error so the user can retry without losing their session.
        const refreshStatus = refreshError?.response?.status;
        const isTransient = refreshStatus === 503 || refreshStatus === 502 || refreshStatus === 504;
        if (!isTransient) {
          doLogout();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
