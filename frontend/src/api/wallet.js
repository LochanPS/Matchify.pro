import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const walletAPI = {
  // Get wallet balance
  getBalance: async () => {
    const response = await axios.get(`${API_URL}/wallet/balance`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Get wallet summary
  getSummary: async () => {
    const response = await axios.get(`${API_URL}/wallet/summary`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Create top-up order
  createTopupOrder: async (amount) => {
    const response = await axios.post(
      `${API_URL}/wallet/topup`,
      { amount },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Verify payment
  verifyPayment: async (paymentData) => {
    const response = await axios.post(
      `${API_URL}/wallet/topup/verify`,
      paymentData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get transaction history
  getTransactions: async (page = 1, limit = 20, type = null) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (type) {
      params.append('type', type);
    }

    const response = await axios.get(
      `${API_URL}/wallet/transactions?${params}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Deduct amount (internal use)
  deductAmount: async (amount, description, referenceId) => {
    const response = await axios.post(
      `${API_URL}/wallet/deduct`,
      { amount, description, referenceId },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Refund amount (internal use)
  refundAmount: async (amount, description, referenceId) => {
    const response = await axios.post(
      `${API_URL}/wallet/refund`,
      { amount, description, referenceId },
      { headers: getAuthHeader() }
    );
    return response.data;
  },
};