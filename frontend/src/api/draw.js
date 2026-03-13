import api from '../utils/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const drawAPI = {
  // Fetch bracket structure for a category
  getBracket: async (tournamentId, categoryId) => {
    const response = await api.get(
      `/tournaments/${tournamentId}/categories/${categoryId}/bracket`
    );
    return response.data;
  },

  // Fetch all matches for a category
  getMatches: async (tournamentId, categoryId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(
      `/tournaments/${tournamentId}/categories/${categoryId}/matches?${queryString}`
    );
    return response.data;
  },

  // Generate draw (organizer only)
  generateDraw: async (tournamentId, categoryId) => {
    const response = await api.post(
      `/tournaments/${tournamentId}/categories/${categoryId}/draw`
    );
    return response.data;
  },

  // Get draw (with bracket JSON) - PUBLIC endpoint, works without auth
  getDraw: async (tournamentId, categoryId) => {
    try {
      const response = await api.get(
        `/tournaments/${tournamentId}/categories/${categoryId}/draw`
      );
      return response.data;
    } catch (error) {
      // If auth fails, retry without auth headers for public access
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Retrying draw fetch without authentication...');
        const response = await api.get(
          `/tournaments/${tournamentId}/categories/${categoryId}/draw`,
          { headers: { Authorization: undefined } }
        );
        return response.data;
      }
      throw error;
    }
  },

  // Delete draw (organizer only)
  deleteDraw: async (tournamentId, categoryId) => {
    const response = await api.delete(
      `/tournaments/${tournamentId}/categories/${categoryId}/draw`
    );
    return response.data;
  },

  // Bulk assign all registered players to available slots
  bulkAssignAllPlayers: async (tournamentId, categoryId) => {
    const response = await api.post(`/draws/bulk-assign-all`, {
      tournamentId,
      categoryId
    });
    return response.data;
  },

  // Shuffle all assigned players randomly
  shuffleAssignedPlayers: async (tournamentId, categoryId) => {
    const response = await api.post(`/draws/shuffle-players`, {
      tournamentId,
      categoryId
    });
    return response.data;
  }
};
