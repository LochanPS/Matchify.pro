import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Get leaderboard with filters
export const getLeaderboard = async (filters = {}) => {
  const params = new URLSearchParams();
  
  if (filters.scope) params.append('scope', filters.scope); // city, state, global
  if (filters.city) params.append('city', filters.city);
  if (filters.state) params.append('state', filters.state);
  if (filters.limit) params.append('limit', filters.limit);
  
  const response = await axios.get(`${API_URL}/api/leaderboard?${params.toString()}`);
  return response.data;
};

// Get my points history
export const getMyPoints = async () => {
  const token = localStorage.getItem('token');
  const response = await axios.get(`${API_URL}/api/points/my`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// Get specific user's points (public)
export const getUserPoints = async (userId) => {
  const response = await axios.get(`${API_URL}/api/points/user/${userId}`);
  return response.data;
};
