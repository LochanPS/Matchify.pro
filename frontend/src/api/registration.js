import api from '../utils/api';
import { fetchUpload } from '../utils/fetchUpload';

export const registrationAPI = {
  createRegistration: async (registrationData) => {
    const response = await api.post('/registrations', registrationData);
    return response.data;
  },

  // Uses native fetch — axios default Content-Type: application/json breaks multer.
  // See utils/fetchUpload.js for full explanation.
  createRegistrationWithScreenshot: async (formData) => {
    return fetchUpload('/registrations/with-screenshot', formData);
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

  // Uses native fetch for the same reason as createRegistrationWithScreenshot.
  cancelRegistrationWithDetails: async (id, formData) => {
    return fetchUpload(`/registrations/${id}/cancel`, formData);
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
