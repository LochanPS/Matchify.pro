import api from '../utils/api';

export const superAdminAPI = {
  // Dashboard
  getStats: () => api.get('/super-admin/stats'),

  // Users
  getUsers: (params) => api.get('/super-admin/users', { params }),
  getUserDetails: (userId) => api.get(`/super-admin/users/${userId}`),
  blockUser: (userId, reason) => api.post(`/super-admin/users/${userId}/block`, { reason }),
  unblockUser: (userId) => api.post(`/super-admin/users/${userId}/unblock`),
  updateUserWallet: (userId, data) => api.post(`/super-admin/users/${userId}/wallet`, data),

  // Tournaments
  getTournaments: (params) => api.get('/super-admin/tournaments', { params }),
  getTournamentDetails: (tournamentId) => api.get(`/super-admin/tournaments/${tournamentId}`),
  updateTournamentStatus: (tournamentId, status) => api.patch(`/super-admin/tournaments/${tournamentId}/status`, { status }),
  deleteTournament: (tournamentId) => api.delete(`/super-admin/tournaments/${tournamentId}`),

  // Registrations
  getRegistrations: (params) => api.get('/super-admin/registrations', { params }),
};
