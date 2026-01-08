import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const registrationAPI = {
  // Register for tournament
  createRegistration: async (registrationData) => {
    const response = await axios.post(
      `${API_URL}/registrations`,
      registrationData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get my registrations
  getMyRegistrations: async (status = null) => {
    const params = status ? `?status=${status}` : '';
    const response = await axios.get(
      `${API_URL}/registrations/my${params}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Cancel registration
  cancelRegistration: async (id) => {
    const response = await axios.delete(
      `${API_URL}/registrations/${id}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Verify payment (if needed in future)
  verifyPayment: async (id, paymentData) => {
    const response = await axios.post(
      `${API_URL}/registrations/${id}/verify-payment`,
      paymentData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },
};
