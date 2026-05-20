import api from '../utils/api';

export const getMatch = async (matchId) => {
  const response = await api.get(`/matches/${matchId}`);
  return response.data;
};

export const getTournamentMatches = async (tournamentId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  if (filters.status) params.append('status', filters.status);
  const response = await api.get(`/tournaments/${tournamentId}/matches?${params.toString()}`);
  return response.data;
};

export const getTournamentLiveMatches = async (tournamentId) => {
  const response = await api.get(`/matches/tournament/${tournamentId}?status=IN_PROGRESS`);
  return response.data;
};

export const getTournamentCompletedMatches = async (tournamentId) => {
  const response = await api.get(`/matches/tournament/${tournamentId}?status=COMPLETED`);
  return response.data;
};

export const startMatch = async (matchId) => {
  const response = await api.put(`/matches/${matchId}/start`, {});
  return response.data;
};

export const addPoint = async (matchId, player) => {
  const response = await api.put(`/matches/${matchId}/score`, { player });
  return response.data;
};

export const undoLastPoint = async (matchId) => {
  const response = await api.put(`/matches/${matchId}/undo`, {});
  return response.data;
};

export const pauseTimer = async (matchId) => {
  const response = await api.put(`/matches/${matchId}/pause`, {});
  return response.data;
};

export const resumeTimer = async (matchId) => {
  const response = await api.put(`/matches/${matchId}/resume`, {});
  return response.data;
};
