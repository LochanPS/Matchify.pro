import api from '../utils/api';

export const matchService = {
  getLiveMatches: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.tournamentId) params.append('tournamentId', filters.tournamentId);
    if (filters.court) params.append('court', filters.court);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.city) params.append('city', filters.city);
    if (filters.state) params.append('state', filters.state);
    if (filters.format) params.append('format', filters.format);
    const response = await api.get(`/matches/live?${params.toString()}`);
    return response.data;
  },

  getMatchById: async (matchId) => {
    const response = await api.get(`/matches/${matchId}`);
    return response.data;
  },

  getLiveMatchDetails: async (matchId) => {
    const response = await api.get(`/matches/${matchId}/live`);
    return response.data;
  },

  getMatchStatus: async (matchId) => {
    const response = await api.get(`/matches/${matchId}/status`);
    return response.data;
  },
};
