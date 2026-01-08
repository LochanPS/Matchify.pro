import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get match details
export const getMatch = async (matchId) => {
  const response = await axios.get(`${API_URL}/matches/${matchId}`);
  return response.data;
};

// Get tournament matches
export const getTournamentMatches = async (tournamentId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.status) params.append('status', filters.status);
  
  const response = await axios.get(`${API_URL}/tournaments/${tournamentId}/matches?${params.toString()}`);
  return response.data;
};

// Start match
export const startMatch = async (matchId) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/matches/${matchId}/start`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Add point to player
export const addPoint = async (matchId, player) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/matches/${matchId}/score`,
    { player },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

// Undo last point
export const undoLastPoint = async (matchId) => {
  const token = localStorage.getItem('token');
  const response = await axios.post(
    `${API_URL}/matches/${matchId}/undo`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};
