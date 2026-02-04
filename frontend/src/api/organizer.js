import api from './axios';

// Get organizer's tournaments with stats
export const getOrganizerTournaments = async () => {
  const response = await api.get('/organizer/tournaments');
  return response.data;
};

// Get tournament registrations
export const getTournamentRegistrations = async (tournamentId) => {
  const response = await api.get(`/organizer/tournaments/${tournamentId}/registrations`);
  return response.data;
};

// Get tournament analytics
export const getTournamentAnalytics = async (tournamentId) => {
  const response = await api.get(`/organizer/tournaments/${tournamentId}/analytics`);
  return response.data;
};

// Export participants
export const exportParticipants = async (tournamentId, format = 'json') => {
  const response = await api.get(`/organizer/tournaments/${tournamentId}/export`, {
    params: { format },
    ...(format === 'csv' && { responseType: 'blob' }),
  });
  return response.data;
};

// Update tournament status
export const updateTournamentStatus = async (tournamentId, status) => {
  const response = await api.put(`/organizer/tournaments/${tournamentId}/status`, { status });
  return response.data;
};

// Approve a registration
export const approveRegistration = async (registrationId) => {
  const response = await api.put(`/organizer/registrations/${registrationId}/approve`);
  return response.data;
};

// Reject a registration
export const rejectRegistration = async (registrationId, reason) => {
  const response = await api.put(`/organizer/registrations/${registrationId}/reject`, { reason });
  return response.data;
};

// Remove a registration (delete player from tournament)
export const removeRegistration = async (registrationId, reason) => {
  const response = await api.delete(`/organizer/registrations/${registrationId}`, { data: { reason } });
  return response.data;
};

// Get all cancellation requests for organizer's tournaments
export const getCancellationRequests = async () => {
  const response = await api.get('/organizer/cancellation-requests');
  return response.data;
};

// Approve a refund request
export const approveRefund = async (registrationId) => {
  const response = await api.put(`/organizer/registrations/${registrationId}/approve-refund`);
  return response.data;
};

// Reject a refund request
export const rejectRefund = async (registrationId, reason) => {
  const response = await api.put(`/organizer/registrations/${registrationId}/reject-refund`, { reason });
  return response.data;
};

// Mark refund as completed (with payment screenshot proof)
export const completeRefund = async (registrationId, formData) => {
  const response = await api.put(`/organizer/registrations/${registrationId}/complete-refund`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};