import axios from 'axios';

// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://matchify-probackend.vercel.app/api';

if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // 20s — covers Vercel serverless cold starts (~10-15s)
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
// When the access token expires the backend returns 401.
// Instead of logging the user out immediately, we try to silently refresh
// using the stored refresh token, then replay the original request.
// Guards against multiple concurrent requests all trying to refresh at once.
let isRefreshing = false;
let refreshQueue = []; // pending requests waiting for a new token

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

// Handle token expiry + timeout
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Timeout — backend cold start took too long
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      console.warn('⏱️ Request timed out:', error.config?.url);
      return Promise.reject({
        ...error,
        message: 'Request timed out. Please try again.',
        isTimeout: true,
      });
    }

    if (error.response?.status === 401) {
      // Background polls (Live Matches, notification count) set _skipLogout: true
      // so they never trigger auto-logout — only user-initiated requests do.
      if (error.config?._skipLogout) {
        return Promise.reject(error);
      }

      const path = window.location.pathname;
      const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));

      // Already on a public/auth page — don't redirect, just reject
      if (isPublicPath) {
        return Promise.reject(error);
      }

      const refreshToken = localStorage.getItem('refreshToken');

      // No refresh token stored → full logout
      if (!refreshToken) {
        doLogout();
        return Promise.reject(error);
      }

      // Another request is already refreshing — queue this one
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api(error.config);
        });
      }

      isRefreshing = true;

      try {
        // Use raw axios so this call doesn't go through our interceptor again
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          { refreshToken },
          { timeout: 15000 }
        );
        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        localStorage.setItem('token', newAccessToken);
        if (newRefreshToken) localStorage.setItem('refreshToken', newRefreshToken);

        // Update default header for future requests
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        // Flush queued requests with the new token
        processQueue(null, newAccessToken);

        // Replay the original request that triggered the 401
        error.config.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(error.config);
      } catch (refreshError) {
        processQueue(refreshError, null);
        doLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
