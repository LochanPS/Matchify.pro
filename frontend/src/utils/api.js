import axios from 'axios';
import safeStorage from './safeStorage';

// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://matchify-backend-production-cb58.up.railway.app/api';

if (import.meta.env.DEV) {
  console.log('ðŸ”§ API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45s — Railway cold starts can exceed 30s
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = safeStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Public paths that should never trigger a login redirect on 401
const PUBLIC_PATHS = ['/login', '/register', '/', '/leaderboard', '/tournaments', '/privacy', '/terms'];

// â”€â”€ Silent token refresh â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, newToken = null) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(newToken)
  );
  refreshQueue = [];
}

function doLogout() {
  safeStorage.removeItem('token');
  safeStorage.removeItem('refreshToken');
  safeStorage.removeItem('user');
  window.location.href = '/login';
}

// â”€â”€ Retryable status codes for GET requests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Vercel cold starts often return 500/502/504 on first hit; a second attempt
// almost always succeeds. Only GET is retried â€” POST/PUT/DELETE are not
// idempotent and are handled explicitly per handler where needed.
const RETRY_STATUS = new Set([500, 502, 503, 504]);
// Vercel serverless cold starts can take 10-30s to boot.
// 4 total attempts with 8s gaps = up to ~100s total — enough for cold-start.
const MAX_AUTO_RETRIES = 3;
const RETRY_DELAY_MS   = 8000; // GETs: long gap gives cold server time to boot
const AUTH_RETRY_DELAY = 3000; // Auth POSTs: shorter delay — user waiting at login

// Auth POST endpoints safe to retry (idempotent: same credentials = same result)
// Tournament create is safe to retry — if first attempt timed out before reaching
// the server, no record was created; if server created but response was lost,
// the duplicate is caught by DB constraints and returns 409/400 (not retried).
const AUTH_RETRY_URLS = ['/auth/login', '/auth/register', '/auth/forgot-password'];
const SAFE_POST_RETRY_URLS = ['/tournaments'];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const method = (config.method || '').toLowerCase();
    const isGet = method === 'get';
    // Auth POSTs are safe to retry: same credentials = same result
    const isAuthPost = method === 'post' &&
      AUTH_RETRY_URLS.some(p => config.url?.includes(p));
    // Tournament create safe to retry on cold-start network/timeout errors only
    const isSafePost = method === 'post' &&
      SAFE_POST_RETRY_URLS.some(p => config.url?.endsWith(p) || config.url?.includes(p + '?'));
    const retryCount = config._retryCount || 0;

    // Auto-retry GET + safe POSTs on 5xx / network errors
    // Transparent: calling code never sees transient cold-start failures.
    const isRetryable =
      (isGet || isAuthPost || isSafePost) &&
      retryCount < MAX_AUTO_RETRIES &&
      !config._noRetry &&
      (
        RETRY_STATUS.has(error.response?.status) ||
        error.code === 'ECONNABORTED' ||
        error.code === 'ERR_NETWORK' ||
        !error.response
      );
    // isSafePost uses AUTH_RETRY_DELAY (3s) — user is waiting at the form, 8s is too long

    if (isRetryable) {
      config._retryCount = retryCount + 1;
      await sleep((isAuthPost || isSafePost) ? AUTH_RETRY_DELAY : RETRY_DELAY_MS);
      return api(config);
    }

    // â”€â”€ Timeout â€” translate to friendly message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject({
        ...error,
        message: 'Server took too long to respond. Please try again.',
        isTimeout: true,
      });
    }

    // â”€â”€ 401 â€” try silent token refresh, then replay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (error.response?.status === 401) {
      if (config?._skipLogout) {
        return Promise.reject(error);
      }

      const path = window.location.pathname;
      const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
      if (isPublicPath) return Promise.reject(error);

      const refreshToken = safeStorage.getItem('refreshToken');
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

        safeStorage.setItem('token', newAccessToken);
        if (newRefreshToken) safeStorage.setItem('refreshToken', newRefreshToken);
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(config);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // 503/502/504 = server busy (DB connection pool exhausted) â€” NOT a real
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

// â”€â”€ GET cache + request deduplication â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Purpose: eliminate redundant network calls when user navigates back to a
//          recently visited page, and prevent concurrent identical GET requests
//          from each firing a separate network round trip.
//
// Safety guarantees:
//   - TTL = 30s â€” short enough that polling loops (30s+) always get fresh data.
//   - DrawPage polls every 15s with Cache-Control: no-cache â†’ bypasses cache.
//   - Any mutation (POST/PUT/DELETE/PATCH) clears the entire cache immediately.
//   - In-memory only (Map) â€” cleared on every full page reload; no cross-user leakage.
//   - Requests that pass _noCache:true or Cache-Control:no-cache header are never cached.

const _GET_CACHE = new Map(); // cacheKey â†’ { data, ts }
const _IN_FLIGHT = new Map(); // cacheKey â†’ Promise  (deduplication)
const _CACHE_TTL = 120_000;  // 2 minutes â€” long enough to feel instant when navigating back

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

// Wrapped GET: cache hit â†’ zero network; in-flight duplicate â†’ same Promise; else â†’ network + cache
api.get = (url, config = {}) => {
  // Honour explicit opt-outs (DrawPage polling, real-time endpoints)
  if (config._noCache || config.headers?.['Cache-Control'] === 'no-cache') {
    return _origGet(url, config);
  }

  const key = _makeCacheKey(url, config);

  // Cache hit â€” return instantly
  const cached = _GET_CACHE.get(key);
  if (cached && Date.now() - cached.ts < _CACHE_TTL) {
    return Promise.resolve({ data: cached.data, status: 200, headers: {}, config });
  }

  // Deduplication â€” two components mounting at the same time share one request
  if (_IN_FLIGHT.has(key)) return _IN_FLIGHT.get(key);

  // New network request â€” store result in cache on success
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

// Mutations clear the GET cache â€” next read always fetches fresh data
api.post   = (...args) => { _clearGetCache(); return _origPost(...args); };
api.put    = (...args) => { _clearGetCache(); return _origPut(...args); };
api.delete = (...args) => { _clearGetCache(); return _origDelete(...args); };
if (_origPatch) api.patch = (...args) => { _clearGetCache(); return _origPatch(...args); };

// Exported so fetchUpload callers (native fetch, not axios) can bust the GET
// cache after a file-upload mutation — otherwise stale tournament data is
// returned on the next getTournament() call.
export const clearGetCache = _clearGetCache;

export default api;

