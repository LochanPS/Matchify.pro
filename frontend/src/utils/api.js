import axios from 'axios';

// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://matchify-backend-production-cb58.up.railway.app/api';

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

// ── GET cache + request deduplication ───────────────────────────────────────
// Purpose: eliminate redundant network calls when user navigates back to a
//          recently visited page, and prevent concurrent identical GET requests
//          from each firing a separate network round trip.
//
// Safety guarantees:
//   - TTL = 30s — short enough that polling loops (30s+) always get fresh data.
//   - DrawPage polls every 15s with Cache-Control: no-cache → bypasses cache.
//   - Any mutation (POST/PUT/DELETE/PATCH) clears the entire cache immediately.
//   - In-memory only (Map) — cleared on every full page reload; no cross-user leakage.
//   - Requests that pass _noCache:true or Cache-Control:no-cache header are never cached.

const _GET_CACHE = new Map(); // cacheKey → { data, ts }
const _IN_FLIGHT = new Map(); // cacheKey → Promise  (deduplication)
const _CACHE_TTL = 30_000;   // 30 seconds

const _origGet    = api.get.bind(api);
const _origPost   = api.post.bind(api);
const _origPut    = api.put.bind(api);
const _origDelete = api.delete.bind(api);
const _origPatch  = api.patch?.bind(api);

function _makeCacheKey(url, config) {
  return url + '|' + (config?.params ? JSON.stringify(config.params) : '');
}

function _clearGetCache() {
  _GET_CACHE.clear();
  _IN_FLIGHT.clear();
}

// Wrapped GET: cache hit → zero network; in-flight duplicate → same Promise; else → network + cache
api.get = (url, config = {}) => {
  // Honour explicit opt-outs (DrawPage polling, real-time endpoints)
  if (config._noCache || config.headers?.['Cache-Control'] === 'no-cache') {
    return _origGet(url, config);
  }

  const key = _makeCacheKey(url, config);

  // Cache hit — return instantly
  const cached = _GET_CACHE.get(key);
  if (cached && Date.now() - cached.ts < _CACHE_TTL) {
    return Promise.resolve({ data: cached.data, status: 200, headers: {}, config });
  }

  // Deduplication — two components mounting at the same time share one request
  if (_IN_FLIGHT.has(key)) return _IN_FLIGHT.get(key);

  // New network request — store result in cache on success
  const promise = _origGet(url, config)
    .then(res => {
      _GET_CACHE.set(key, { data: res.data, ts: Date.now() });
      _IN_FLIGHT.delete(key);
      return res;
    })
    .catch(err => {
      _IN_FLIGHT.delete(key);
      throw err;
    });

  _IN_FLIGHT.set(key, promise);
  return promise;
};

// Mutations clear the GET cache — next read always fetches fresh data
api.post   = (...args) => { _clearGetCache(); return _origPost(...args); };
api.put    = (...args) => { _clearGetCache(); return _origPut(...args); };
api.delete = (...args) => { _clearGetCache(); return _origDelete(...args); };
if (_origPatch) api.patch = (...args) => { _clearGetCache(); return _origPatch(...args); };

export default api;
