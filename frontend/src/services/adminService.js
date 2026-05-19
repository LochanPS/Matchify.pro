import api from '../utils/api';

const adminService = {
  // ==================== DASHBOARD ====================
  async getStats(startDate, endDate) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(`/admin/stats`, { params });
    return response.data;
  },

  // ==================== USER MANAGEMENT ====================
  async getUsers({ page = 1, limit = 20, search, role, status, city, state }) {
    const params = { page, limit };
    if (search) params.search = search;
    if (role) params.role = role;
    if (status) params.status = status;
    if (city) params.city = city;
    if (state) params.state = state;
    const response = await api.get(`/admin/users`, { params });
    return response.data;
  },

  async getUserDetails(userId) {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },

  async suspendUser(userId, reason, durationDays) {
    const response = await api.post(`/admin/users/${userId}/suspend`, { reason, durationDays });
    return response.data;
  },

  async unsuspendUser(userId) {
    const response = await api.post(`/admin/users/${userId}/unsuspend`, {});
    return response.data;
  },

  async loginAsUser(userId) {
    const response = await api.post(`/admin/users/${userId}/login-as`, {});
    return response.data;
  },

  // ==================== TOURNAMENT MANAGEMENT ====================
  async getTournaments({ page = 1, limit = 20, status, organizerId, search }) {
    const params = { page, limit };
    if (status) params.status = status;
    if (organizerId) params.organizerId = organizerId;
    if (search) params.search = search;
    const response = await api.get(`/admin/tournaments`, { params });
    return response.data;
  },

  async cancelTournament(tournamentId, reason) {
    const response = await api.delete(`/admin/tournaments/${tournamentId}`, { data: { reason } });
    return response.data;
  },

  // ==================== AUDIT LOGS ====================
  async getAuditLogs({ page = 1, limit = 50, action, entityType, adminId, startDate, endDate }) {
    const params = { page, limit };
    if (action) params.action = action;
    if (entityType) params.entityType = entityType;
    if (adminId) params.adminId = adminId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(`/admin/audit-logs`, { params });
    return response.data;
  },

  async getEntityAuditLogs(entityType, entityId) {
    const response = await api.get(`/admin/audit-logs/${entityType}/${entityId}`);
    return response.data;
  },

  async exportAuditLogs({ action, entityType, adminId, startDate, endDate }) {
    const params = {};
    if (action) params.action = action;
    if (entityType) params.entityType = entityType;
    if (adminId) params.adminId = adminId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(`/admin/audit-logs/export`, { params, responseType: 'blob' });
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
  async getInvites({ page = 1, limit = 20, status }) {
    const params = { page, limit };
    if (status) params.status = status;
    const response = await api.get(`/admin/invites`, { params });
    return response.data;
  },

  async createInvite(email, role, duration = '7d') {
    const response = await api.post(`/admin/invites`, { email, role, duration });
    return response.data;
  },

  async revokeInvite(inviteId) {
    const response = await api.delete(`/admin/invites/${inviteId}/revoke`);
    return response.data;
  },

  async deleteInvite(inviteId) {
    const response = await api.delete(`/admin/invites/${inviteId}`);
    return response.data;
  },

  // ==================== PAYMENT MANAGEMENT ====================
  async getPaymentDashboard() {
    const response = await api.get(`/admin/payment/dashboard`);
    return response.data;
  },

  async getPaymentNotifications() {
    const response = await api.get(`/admin/payment/notifications`);
    return response.data;
  },

  async getPaymentSchedule() {
    const response = await api.get(`/admin/payment/schedule`);
    return response.data;
  },

  async getPendingVerifications() {
    const response = await api.get(`/admin/payment/pending-verifications`);
    return response.data;
  },

  async approvePayment(registrationId, notes) {
    const response = await api.post(`/admin/payment/approve/${registrationId}`, { notes });
    return response.data;
  },

  async rejectPayment(registrationId, reason) {
    const response = await api.post(`/admin/payment/reject/${registrationId}`, { reason });
    return response.data;
  },

  async getPendingPayouts() {
    const response = await api.get(`/admin/payment/pending-payouts`);
    return response.data;
  },

  async markPaymentPaid(tournamentId, paymentType, transactionRef, notes) {
    const response = await api.post(`/admin/payment/mark-paid/${tournamentId}`, { paymentType, transactionRef, notes });
    return response.data;
  },

  async getDailyReport(date) {
    const params = {};
    if (date) params.date = date;
    const response = await api.get(`/admin/payment/daily-report`, { params });
    return response.data;
  },

  async getMonthlyReport() {
    const response = await api.get(`/admin/payment/monthly-report`);
    return response.data;
  },

  async exportPaymentCSV(startDate, endDate, type) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (type) params.type = type;
    const response = await api.get(`/admin/payment/export-csv`, { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `payment-export-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return { success: true };
  },

  async runDailyTasks() {
    const response = await api.post(`/admin/payment/run-daily-tasks`, {});
    return response.data;
  },

  async checkDuePayments() {
    const response = await api.post(`/admin/payment/check-due-payments`, {});
    return response.data;
  },

  // ==================== USER LEDGER MANAGEMENT ====================
  async getUsersLedger({ page = 1, limit = 50, search, sortBy = 'currentBalance', order = 'desc' }) {
    const params = { page, limit, sortBy, order };
    if (search) params.search = search;
    const response = await api.get(`/admin/user-ledger/users`, { params });
    return response.data;
  },

  async getUserSummary(userId) {
    const response = await api.get(`/admin/user-ledger/user/${userId}`);
    return response.data;
  },

  async getUserTransactions(userId, { page = 1, limit = 50, type, category, startDate, endDate }) {
    const params = { page, limit };
    if (type) params.type = type;
    if (category) params.category = category;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(`/admin/user-ledger/user/${userId}/transactions`, { params });
    return response.data;
  },

  async recordPaymentTransaction(data) {
    const response = await api.post(`/admin/user-ledger/record-payment`, data);
    return response.data;
  },

  async exportUserLedger(userId, startDate, endDate) {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await api.get(`/admin/user-ledger/user/${userId}/export`, { params, responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `user_ledger_${userId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    return { success: true };
  },

  async getLedgerStats() {
    const response = await api.get(`/admin/user-ledger/stats`);
    return response.data;
  },

  async getQuickStats() {
    const response = await api.get(`/admin/payment/quick-stats`);
    return response.data;
  },

  // ==================== PAYMENT VERIFICATION ====================
  async getPaymentVerifications({ page = 1, limit = 20, status, tournamentId }) {
    const params = { page, limit };
    if (status) params.status = status;
    if (tournamentId) params.tournamentId = tournamentId;
    const response = await api.get(`/admin/payment-verifications`, { params });
    return response.data;
  },

  async getPaymentVerificationStats() {
    const response = await api.get(`/admin/payment-verifications/stats`);
    return response.data;
  },

  async approvePaymentVerification(verificationId) {
    const response = await api.post(`/admin/payment-verifications/${verificationId}/approve`, {});
    return response.data;
  },

  async rejectPaymentVerification(verificationId, rejectionData) {
    const response = await api.post(`/admin/payment-verifications/${verificationId}/reject`, rejectionData);
    return response.data;
  }
};

export default adminService;
