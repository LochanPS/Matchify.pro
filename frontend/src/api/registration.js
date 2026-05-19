import api from '../utils/api';

export const registrationAPI = {
  createRegistration: async (registrationData) => {
    const response = await api.post('/registrations', registrationData);
    return response.data;
  },

  createRegistrationWithScreenshot: async (formData) => {
    const response = await api.post('/registrations/with-screenshot', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  getMyRegistrations: async (status = null) => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/registrations/my${params}`);
    return response.data;
  },

  cancelRegistration: async (id) => {
    const response = await api.delete(`/registrations/${id}`);
    return response.data;
  },

  cancelRegistrationWithDetails: async (id, formData) => {
    const response = await api.post(`/registrations/${id}/cancel`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  verifyPayment: async (id, status) => {
    const response = await api.post(`/registrations/${id}/verify-payment`, { status });
    return response.data;
  },

  getPartnerByCode: async (playerCode) => {
    const encodedCode = encodeURIComponent(playerCode);
    const response = await api.get(`/registrations/partner-by-code/${encodedCode}`);
    return response.data;
  },
};
