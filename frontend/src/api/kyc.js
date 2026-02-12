import api from '../utils/api';

/**
 * KYC API Client Functions
 */

// ============================================
// ORGANIZER KYC ENDPOINTS
// ============================================

/**
 * Submit KYC with Aadhaar image
 */
export const submitKYC = async (data) => {
  const response = await api.post('/kyc/submit', data);
  return response.data;
};

/**
 * Request video call with admin
 */
export const requestVideoCall = async () => {
  const response = await api.post('/kyc/request-call');
  return response.data;
};

/**
 * Get current KYC status
 */
export const getKYCStatus = async () => {
  const response = await api.get('/kyc/status');
  return response.data;
};

/**
 * Rejoin active video call
 */
export const rejoinCall = async () => {
  const response = await api.post('/kyc/rejoin-call');
  return response.data;
};

// ============================================
// ADMIN KYC ENDPOINTS
// ============================================

/**
 * Get all pending KYCs (admin only)
 */
export const getPendingKYCs = async () => {
  const response = await api.get('/admin/kyc/pending');
  return response.data;
};

/**
 * Approve KYC (admin only)
 */
export const approveKYC = async (kycId, notes) => {
  const response = await api.post(`/admin/kyc/approve/${kycId}`, notes);
  return response.data;
};

/**
 * Reject KYC (admin only)
 */
export const rejectKYC = async (kycId, data) => {
  const response = await api.post(`/admin/kyc/reject/${kycId}`, data);
  return response.data;
};

/**
 * Toggle admin availability for KYC calls
 */
export const toggleAvailability = async (available) => {
  const response = await api.put('/admin/availability', { availableForKYC: available });
  return response.data;
};

/**
 * Get KYC statistics (admin only)
 */
export const getKYCStats = async () => {
  const response = await api.get('/admin/kyc/stats');
  return response.data;
};
