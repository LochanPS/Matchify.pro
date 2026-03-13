import api from '../utils/api';

// Payment Settings
export const getPaymentSettings = async () => {
  const response = await api.get('/admin/payment-settings');
  return response.data;
};

// Public Payment Settings (for players to see QR code)
export const getPublicPaymentSettings = async () => {
  const response = await api.get('/admin/payment-settings/public');
  return response.data;
};

export const updatePaymentSettings = async (formData) => {
  const response = await api.put('/admin/payment-settings', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Payment Verifications
export const getPaymentVerifications = async (params = {}) => {
  const response = await api.get('/admin/payment-verifications', { params });
  return response.data;
};

export const getPaymentVerificationStats = async () => {
  const response = await api.get('/admin/payment-verifications/stats');
  return response.data;
};

export const approvePayment = async (id) => {
  const response = await api.post(`/admin/payment-verifications/${id}/approve`);
  return response.data;
};

export const rejectPayment = async (id, reason) => {
  const response = await api.post(`/admin/payment-verifications/${id}/reject`, { reason });
  return response.data;
};

// Tournament Payments
export const getTournamentPayments = async (params = {}) => {
  const response = await api.get('/admin/tournament-payments', { params });
  return response.data;
};

export const getTournamentPayment = async (tournamentId) => {
  const response = await api.get(`/admin/tournament-payments/${tournamentId}`);
  return response.data;
};

export const getTournamentPaymentStats = async () => {
  const response = await api.get('/admin/tournament-payments/stats/overview');
  return response.data;
};

export const markPayout50_1Paid = async (tournamentId, notes) => {
  const response = await api.post(
    `/admin/tournament-payments/${tournamentId}/payout-50-1/mark-paid`,
    { notes }
  );
  return response.data;
};

export const markPayout50_2Paid = async (tournamentId, notes) => {
  const response = await api.post(
    `/admin/tournament-payments/${tournamentId}/payout-50-2/mark-paid`,
    { notes }
  );
  return response.data;
};

export const getPendingPayouts = async (type) => {
  const response = await api.get('/admin/tournament-payments/pending/payouts', {
    params: { type },
  });
  return response.data;
};

// Revenue Analytics
export const getRevenueOverview = async (params = {}) => {
  const response = await api.get('/admin/revenue/overview', { params });
  return response.data;
};

export const getRevenueByTournament = async (params = {}) => {
  const response = await api.get('/admin/revenue/by-tournament', { params });
  return response.data;
};

export const getRevenueByOrganizer = async () => {
  const response = await api.get('/admin/revenue/by-organizer');
  return response.data;
};

export const getRevenueByLocation = async (groupBy = 'city') => {
  const response = await api.get('/admin/revenue/by-location', {
    params: { groupBy },
  });
  return response.data;
};

export const getRevenueTimeline = async (params = {}) => {
  const response = await api.get('/admin/revenue/timeline', { params });
  return response.data;
};

export const getDetailedPayments = async (params = {}) => {
  const response = await api.get('/admin/revenue/payments/detailed', { params });
  return response.data;
};

// Delete All Data
export const deleteAllData = async (password) => {
  const response = await api.post('/admin/delete-all-info', { password });
  return response.data;
};
