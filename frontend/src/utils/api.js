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
      const token = localStorage.getItem('token');
      const path = window.location.pathname;

      // Only redirect if user was actually authenticated (had a token)
      // and is not already on a public/auth page
      const isPublicPath = PUBLIC_PATHS.some(p => path === p || path.startsWith(p + '/'));
      if (!token || isPublicPath) {
        return Promise.reject(error);
      }

      // Authenticated session expired — clear and redirect
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;