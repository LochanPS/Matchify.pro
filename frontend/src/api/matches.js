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

// Single call — fetch ALL match statuses at once, filter client-side.
// Previously two separate requests (IN_PROGRESS + COMPLETED) = 2 DB queries per poll.
// Now 1 request = 1 DB query per poll. Halves connection pressure under load.
export const getTournamentAllMatches = async (tournamentId) => {
  const response = await api.get(`/matches/tournament/${tournamentId}`, { _skipLogout: true, timeout: 30000 });
  return response.data;
};

// Legacy aliases kept so other callers don't break, but they share one request
export const getTournamentLiveMatches = async (tournamentId) => {
  const data = await getTournamentAllMatches(tournamentId);
  return { ...data, matches: (data.matches || []).filter(m => m.status === 'IN_PROGRESS') };
};

export const getTournamentCompletedMatches = async (tournamentId) => {
  const data = await getTournamentAllMatches(tournamentId);
  return { ...data, matches: (data.matches || []).filter(m => m.status === 'COMPLETED') };
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
