import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const matchService = {
  // Get all live matches
  getLiveMatches: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.tournamentId) params.append('tournamentId', filters.tournamentId);
    if (filters.court) params.append('court', filters.court);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.format) params.append('format', filters.format);
    
    const response = await api.get(`/api/matches/live?${params.toString()}`);
    return response.data;
  },

  // Get single match details
  getMatchById: async (matchId) => {
    const response = await api.get(`/api/matches/${matchId}`);
    return response.data;
  },

  // Get live match details
  getLiveMatchDetails: async (matchId) => {
    const response = await api.get(`/api/matches/${matchId}/live`);
    return response.data;
  },

  // Get match status (quick polling)
  getMatchStatus: async (matchId) => {
    const response = await api.get(`/api/matches/${matchId}/status`);
    return response.data;
  },
};
