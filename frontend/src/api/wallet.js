import api from '../utils/api';

export const walletAPI = {
  getBalance: async () => {
    const response = await api.get('/wallet/balance');
    return response.data;
  },

  getSummary: async () => {
    const response = await api.get('/wallet/summary');
    return response.data;
  },

  createTopupOrder: async (amount) => {
    const response = await api.post('/wallet/topup', { amount });
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await api.post('/wallet/topup/verify', paymentData);
    return response.data;
  },

  getTransactions: async (page = 1, limit = 20, type = null) => {
    const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() });
    if (type) params.append('type', type);
    const response = await api.get(`/wallet/transactions?${params}`);
    return response.data;
  },

  deductAmount: async (amount, description, referenceId) => {
    const response = await api.post('/wallet/deduct', { amount, description, referenceId });
    return response.data;
  },

  refundAmount: async (amount, description, referenceId) => {
    const response = await api.post('/wallet/refund', { amount, description, referenceId });
    return response.data;
  },
};
