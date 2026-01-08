import api from './axios';

// Get partner invitation details
export const getPartnerInvitation = async (token) => {
  const response = await api.get(`/partner/confirm/${token}`);
  return response.data;
};

// Confirm partner invitation (accept or decline)
export const confirmPartner = async (token, action) => {
  const response = await api.post(`/partner/confirm/${token}`, { action });
  return response.data;
};
