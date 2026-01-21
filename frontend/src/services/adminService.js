import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const adminService = {
  // ==================== DASHBOARD ====================
  
  /**
   * Get platform statistics
   */
  async getStats(startDate, endDate) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${API_URL}/admin/stats`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  // ==================== USER MANAGEMENT ====================
  
  /**
   * Get all users with filters
   */
  async getUsers({ page = 1, limit = 20, search, role, status, city, state }) {
    const params = { page, limit };
    if (search) params.search = search;
    if (role) params.role = role;
    if (status) params.status = status;
    if (city) params.city = city;
    if (state) params.state = state;
    
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  /**
   * Get user details by ID
   */
  async getUserDetails(userId) {
    const response = await axios.get(`${API_URL}/admin/users/${userId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Suspend a user
   */
  async suspendUser(userId, reason, durationDays) {
    const response = await axios.post(
      `${API_URL}/admin/users/${userId}/suspend`,
      { reason, durationDays },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Unsuspend a user
   */
  async unsuspendUser(userId) {
    const response = await axios.post(
      `${API_URL}/admin/users/${userId}/unsuspend`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Login as a user (impersonation)
   */
  async loginAsUser(userId) {
    const response = await axios.post(
      `${API_URL}/admin/users/${userId}/login-as`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // ==================== TOURNAMENT MANAGEMENT ====================
  
  /**
   * Get all tournaments with filters
   */
  async getTournaments({ page = 1, limit = 20, status, organizerId, search }) {
    const params = { page, limit };
    if (status) params.status = status;
    if (organizerId) params.organizerId = organizerId;
    if (search) params.search = search;
    
    const response = await axios.get(`${API_URL}/admin/tournaments`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  /**
   * Cancel a tournament (emergency)
   */
  async cancelTournament(tournamentId, reason) {
    const response = await axios.delete(
      `${API_URL}/admin/tournaments/${tournamentId}`,
      {
        headers: getAuthHeader(),
        data: { reason }
      }
    );
    return response.data;
  },

  // ==================== AUDIT LOGS ====================
  
  /**
   * Get audit logs with filters
   */
  async getAuditLogs({ page = 1, limit = 50, action, entityType, adminId, startDate, endDate }) {
    const params = { page, limit };
    if (action) params.action = action;
    if (entityType) params.entityType = entityType;
    if (adminId) params.adminId = adminId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${API_URL}/admin/audit-logs`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  /**
   * Get audit logs for specific entity
   */
  async getEntityAuditLogs(entityType, entityId) {
    const response = await axios.get(
      `${API_URL}/admin/audit-logs/${entityType}/${entityId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Export audit logs as CSV
   */
  async exportAuditLogs({ action, entityType, adminId, startDate, endDate }) {
    const params = {};
    if (action) params.action = action;
    if (entityType) params.entityType = entityType;
    if (adminId) params.adminId = adminId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${API_URL}/admin/audit-logs/export`, {
      headers: getAuthHeader(),
      params,
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return { success: true };
  },

  // ==================== ADMIN INVITES ====================
  
  /**
   * Get all admin invites
   */
  async getInvites({ page = 1, limit = 20, status }) {
    const params = { page, limit };
    if (status) params.status = status;
    
    const response = await axios.get(`${API_URL}/admin/invites`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  /**
   * Create new admin invite
   */
  async createInvite(email, role, duration = '7d') {
    const response = await axios.post(
      `${API_URL}/admin/invites`,
      { email, role, duration },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Revoke an invite
   */
  async revokeInvite(inviteId) {
    const response = await axios.delete(
      `${API_URL}/admin/invites/${inviteId}/revoke`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Delete an invite
   */
  async deleteInvite(inviteId) {
    const response = await axios.delete(
      `${API_URL}/admin/invites/${inviteId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // ==================== PAYMENT MANAGEMENT ====================
  
  /**
   * Get payment dashboard data
   */
  async getPaymentDashboard() {
    const response = await axios.get(`${API_URL}/admin/payment/dashboard`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Get payment notifications
   */
  async getPaymentNotifications() {
    const response = await axios.get(`${API_URL}/admin/payment/notifications`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Get payment schedule
   */
  async getPaymentSchedule() {
    const response = await axios.get(`${API_URL}/admin/payment/schedule`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Get pending payment verifications
   */
  async getPendingVerifications() {
    const response = await axios.get(`${API_URL}/admin/payment/pending-verifications`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Approve payment
   */
  async approvePayment(registrationId, notes) {
    const response = await axios.post(
      `${API_URL}/admin/payment/approve/${registrationId}`,
      { notes },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Reject payment
   */
  async rejectPayment(registrationId, reason) {
    const response = await axios.post(
      `${API_URL}/admin/payment/reject/${registrationId}`,
      { reason },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Get pending organizer payouts
   */
  async getPendingPayouts() {
    const response = await axios.get(`${API_URL}/admin/payment/pending-payouts`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Mark organizer payment as paid
   */
  async markPaymentPaid(tournamentId, paymentType, transactionRef, notes) {
    const response = await axios.post(
      `${API_URL}/admin/payment/mark-paid/${tournamentId}`,
      { paymentType, transactionRef, notes },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Generate daily report
   */
  async getDailyReport(date) {
    const params = {};
    if (date) params.date = date;
    
    const response = await axios.get(`${API_URL}/admin/payment/daily-report`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  /**
   * Generate monthly report
   */
  async getMonthlyReport() {
    const response = await axios.get(`${API_URL}/admin/payment/monthly-report`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Export payment data as CSV
   */
  async exportPaymentCSV(startDate, endDate, type) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (type) params.type = type;
    
    const response = await axios.get(`${API_URL}/admin/payment/export-csv`, {
      headers: getAuthHeader(),
      params,
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payment-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return { success: true };
  },

  /**
   * Run daily payment tasks manually
   */
  async runDailyTasks() {
    const response = await axios.post(
      `${API_URL}/admin/payment/run-daily-tasks`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Check for payments due
   */
  async checkDuePayments() {
    const response = await axios.post(
      `${API_URL}/admin/payment/check-due-payments`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // ==================== USER LEDGER MANAGEMENT ====================
  
  /**
   * Get all users with payment summaries
   */
  async getUsersLedger({ page = 1, limit = 50, search, sortBy = 'currentBalance', order = 'desc' }) {
    const params = { page, limit, sortBy, order };
    if (search) params.search = search;
    
    const response = await axios.get(`${API_URL}/admin/user-ledger/users`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  /**
   * Get specific user's payment summary
   */
  async getUserSummary(userId) {
    const response = await axios.get(`${API_URL}/admin/user-ledger/user/${userId}`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Get user's transaction history
   */
  async getUserTransactions(userId, { page = 1, limit = 50, type, category, startDate, endDate }) {
    const params = { page, limit };
    if (type) params.type = type;
    if (category) params.category = category;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${API_URL}/admin/user-ledger/user/${userId}/transactions`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  /**
   * Record a payment transaction
   */
  async recordPaymentTransaction(data) {
    const response = await axios.post(
      `${API_URL}/admin/user-ledger/record-payment`,
      data,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Export user's complete ledger as CSV
   */
  async exportUserLedger(userId, startDate, endDate) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await axios.get(`${API_URL}/admin/user-ledger/user/${userId}/export`, {
      headers: getAuthHeader(),
      params,
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `user_ledger_${userId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    return { success: true };
  },

  /**
   * Get ledger statistics
   */
  async getLedgerStats() {
    const response = await axios.get(`${API_URL}/admin/user-ledger/stats`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Get quick stats for dashboard
   */
  async getQuickStats() {
    const response = await axios.get(`${API_URL}/admin/payment/quick-stats`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // ==================== PAYMENT VERIFICATION ====================
  
  /**
   * Get payment verifications
   */
  async getPaymentVerifications({ page = 1, limit = 20, status, tournamentId }) {
    const params = { page, limit };
    if (status) params.status = status;
    if (tournamentId) params.tournamentId = tournamentId;
    
    const response = await axios.get(`${API_URL}/admin/payment-verifications`, {
      headers: getAuthHeader(),
      params
    });
    return response.data;
  },

  /**
   * Get payment verification stats
   */
  async getPaymentVerificationStats() {
    const response = await axios.get(`${API_URL}/admin/payment-verifications/stats`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  /**
   * Approve payment verification
   */
  async approvePaymentVerification(verificationId) {
    const response = await axios.post(
      `${API_URL}/admin/payment-verifications/${verificationId}/approve`,
      {},
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  /**
   * Reject payment verification
   */
  async rejectPaymentVerification(verificationId, rejectionData) {
    const response = await axios.post(
      `${API_URL}/admin/payment-verifications/${verificationId}/reject`,
      rejectionData,
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};

export default adminService;
