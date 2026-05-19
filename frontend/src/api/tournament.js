import api from '../utils/api'; // 20s timeout + auth interceptor on every call

export const tournamentAPI = {
  // Get all tournaments (public)
  getTournaments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/tournaments?${queryString}`);
    return response.data;
  },

  // Get single tournament (public)
  getTournament: async (id) => {
    const response = await api.get(`/tournaments/${id}`);
    return response.data;
  },

  // Create tournament (organizer only)
  createTournament: async (tournamentData) => {
    const response = await api.post('/tournaments', tournamentData);
    return response.data;
  },

  // Update tournament (organizer only)
  updateTournament: async (id, tournamentData) => {
    const response = await api.put(`/tournaments/${id}`, tournamentData);
    return response.data;
  },

  // Delete tournament (organizer only)
  deleteTournament: async (id) => {
    const response = await api.delete(`/tournaments/${id}`);
    return response.data;
  },

  // Upload tournament posters (organizer only)
  uploadPosters: async (id, files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('posters', file);
    });
    const response = await api.post(
      `/tournaments/${id}/posters`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Category endpoints
  createCategory: async (tournamentId, categoryData) => {
    const response = await api.post(
      `/tournaments/${tournamentId}/categories`,
      categoryData
    );
    return response.data;
  },

  getCategories: async (tournamentId) => {
    const response = await api.get(`/tournaments/${tournamentId}/categories`);
    return response.data;
  },

  updateCategory: async (tournamentId, categoryId, categoryData) => {
    const response = await api.put(
      `/tournaments/${tournamentId}/categories/${categoryId}`,
      categoryData
    );
    return response.data;
  },

  deleteCategory: async (tournamentId, categoryId) => {
    const response = await api.delete(
      `/tournaments/${tournamentId}/categories/${categoryId}`
    );
    return response.data;
  },

  // Upload payment QR code (organizer only)
  uploadPaymentQR: async (tournamentId, file, upiId, accountHolderName) => {
    const formData = new FormData();
    formData.append('paymentQR', file);
    if (upiId) formData.append('upiId', upiId);
    if (accountHolderName) formData.append('accountHolderName', accountHolderName);
    const response = await api.post(
      `/tournaments/${tournamentId}/payment-qr`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Delete a poster (organizer only)
  deletePoster: async (tournamentId, posterId) => {
    const response = await api.delete(
      `/tournaments/${tournamentId}/posters/${posterId}`
    );
    return response.data;
  },

  // Update payment info (organizer only)
  updatePaymentInfo: async (tournamentId, paymentInfo) => {
    const response = await api.put(
      `/tournaments/${tournamentId}/payment-info`,
      paymentInfo
    );
    return response.data;
  },

  // Umpire management (organizer only)
  addUmpireByCode: async (tournamentId, umpireCode) => {
    const response = await api.post(
      `/tournaments/${tournamentId}/umpires`,
      { umpireCode }
    );
    return response.data;
  },

  getTournamentUmpires: async (tournamentId) => {
    const response = await api.get(`/tournaments/${tournamentId}/umpires`);
    return response.data;
  },

  removeUmpire: async (tournamentId, umpireId) => {
    const response = await api.delete(
      `/tournaments/${tournamentId}/umpires/${umpireId}`
    );
    return response.data;
  },
};
