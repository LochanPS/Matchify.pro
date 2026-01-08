import axios from './axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const drawAPI = {
  // Fetch bracket structure for a category
  getBracket: async (tournamentId, categoryId) => {
    const response = await axios.get(
      `${API_URL}/tournaments/${tournamentId}/categories/${categoryId}/bracket`
    );
    return response.data;
  },

  // Fetch all matches for a category
  getMatches: async (tournamentId, categoryId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await axios.get(
      `${API_URL}/tournaments/${tournamentId}/categories/${categoryId}/matches?${queryString}`
    );
    return response.data;
  },

  // Generate draw (organizer only)
  generateDraw: async (tournamentId, categoryId) => {
    const response = await axios.post(
      `${API_URL}/tournaments/${tournamentId}/categories/${categoryId}/draw`
    );
    return response.data;
  },

  // Get draw (with bracket JSON)
  getDraw: async (tournamentId, categoryId) => {
    const response = await axios.get(
      `${API_URL}/tournaments/${tournamentId}/categories/${categoryId}/draw`
    );
    return response.data;
  },

  // Delete draw (organizer only)
  deleteDraw: async (tournamentId, categoryId) => {
    const response = await axios.delete(
      `${API_URL}/tournaments/${tournamentId}/categories/${categoryId}/draw`
    );
    return response.data;
  }
};
