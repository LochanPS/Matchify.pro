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
  }
};

export default adminService;
