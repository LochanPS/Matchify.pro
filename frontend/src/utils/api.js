import axios from 'axios';

// Use environment variable with fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://matchify-probackend.vercel.app/api';

if (import.meta.env.DEV) {
  console.log('🔧 API Base URL:', API_BASE_URL);
}

const api = axios.create({
  baseURL: API_BASE_URL,
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

// Handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Don't clear tokens if we're on login/register pages
      if (window.location.pathname.includes('/login') || 
          window.location.pathname.includes('/register')) {
        return Promise.reject(error);
      }
      
      // Clear tokens and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;