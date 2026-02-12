import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const registrationAPI = {
  // Register for tournament (legacy - without screenshot)
  createRegistration: async (registrationData) => {
    const response = await axios.post(
      `${API_URL}/registrations`,
      registrationData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Register for tournament with payment screenshot
  createRegistrationWithScreenshot: async (formData) => {
    const response = await axios.post(
      `${API_URL}/registrations/with-screenshot`,
      formData,
      { 
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      }
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

  // Cancel registration (legacy - simple cancel)
  cancelRegistration: async (id) => {
    const response = await axios.delete(
      `${API_URL}/registrations/${id}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Cancel registration with details (reason, UPI ID, QR code)
  cancelRegistrationWithDetails: async (id, formData) => {
    const response = await axios.post(
      `${API_URL}/registrations/${id}/cancel`,
      formData,
      { 
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  // Verify payment (organizer)
  verifyPayment: async (id, status) => {
    const response = await axios.post(
      `${API_URL}/registrations/${id}/verify-payment`,
      { status },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get partner by player code
  getPartnerByCode: async (playerCode) => {
    // URL encode the player code to handle the # symbol
    const encodedCode = encodeURIComponent(playerCode);
    const response = await axios.get(
      `${API_URL}/registrations/partner-by-code/${encodedCode}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },
};
