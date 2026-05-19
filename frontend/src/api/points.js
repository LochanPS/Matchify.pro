import api from '../utils/api';

export const getLeaderboard = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.scope) params.append('scope', filters.scope);
  if (filters.city) params.append('city', filters.city);
  if (filters.state) params.append('state', filters.state);
  if (filters.limit) params.append('limit', filters.limit);
  const response = await api.get(`/leaderboard?${params.toString()}`);
  return response.data;
};

export const getMyPoints = async () => {
  const response = await api.get('/points/my');
  return response.data;
};

export const getUserPoints = async (userId) => {
  const response = await api.get(`/points/user/${userId}`);
  return response.data;
};
