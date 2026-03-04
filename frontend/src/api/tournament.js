import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const tournamentAPI = {
  // Get all tournaments (public)
  getTournaments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await axios.get(`${API_URL}/tournaments?${queryString}`);
    return response.data;
  },

  // Get single tournament (public)
  getTournament: async (id) => {
    const response = await axios.get(`${API_URL}/tournaments/${id}`);
    return response.data;
  },

  // Create tournament (organizer only)
  createTournament: async (tournamentData) => {
    const response = await axios.post(
      `${API_URL}/tournaments`,
      tournamentData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Update tournament (organizer only)
  updateTournament: async (id, tournamentData) => {
    const response = await axios.put(
      `${API_URL}/tournaments/${id}`,
      tournamentData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Delete tournament (organizer only)
  deleteTournament: async (id) => {
    const response = await axios.delete(
      `${API_URL}/tournaments/${id}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Upload tournament posters (organizer only)
  uploadPosters: async (id, files) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('posters', file);
    });

    const response = await axios.post(
      `${API_URL}/tournaments/${id}/posters`,
      formData,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Category endpoints
  createCategory: async (tournamentId, categoryData) => {
    const response = await axios.post(
      `${API_URL}/tournaments/${tournamentId}/categories`,
      categoryData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getCategories: async (tournamentId) => {
    const response = await axios.get(`${API_URL}/tournaments/${tournamentId}/categories`);
    return response.data;
  },

  updateCategory: async (tournamentId, categoryId, categoryData) => {
    const response = await axios.put(
      `${API_URL}/tournaments/${tournamentId}/categories/${categoryId}`,
      categoryData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  deleteCategory: async (tournamentId, categoryId) => {
    const response = await axios.delete(
      `${API_URL}/tournaments/${tournamentId}/categories/${categoryId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Upload payment QR code (organizer only)
  uploadPaymentQR: async (tournamentId, file, upiId, accountHolderName) => {
    const formData = new FormData();
    formData.append('paymentQR', file);
    if (upiId) formData.append('upiId', upiId);
    if (accountHolderName) formData.append('accountHolderName', accountHolderName);

    const response = await axios.post(
      `${API_URL}/tournaments/${tournamentId}/payment-qr`,
      formData,
      {
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Update payment info (organizer only)
  updatePaymentInfo: async (tournamentId, paymentInfo) => {
    const response = await axios.put(
      `${API_URL}/tournaments/${tournamentId}/payment-info`,
      paymentInfo,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Umpire management (organizer only)
  addUmpireByCode: async (tournamentId, umpireCode) => {
    const response = await axios.post(
      `${API_URL}/tournaments/${tournamentId}/umpires`,
      { umpireCode },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getTournamentUmpires: async (tournamentId) => {
    const response = await axios.get(
      `${API_URL}/tournaments/${tournamentId}/umpires`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  removeUmpire: async (tournamentId, umpireId) => {
    const response = await axios.delete(
      `${API_URL}/tournaments/${tournamentId}/umpires/${umpireId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },
};
