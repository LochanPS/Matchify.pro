import api from '../utils/api'; // 20s timeout + auth interceptor on every call

/**
 * Multipart file upload via native fetch (NOT axios).
 *
 * Why not axios for uploads?
 * The shared axios instance has `Content-Type: application/json` as a
 * default header. Axios v1.x does NOT reliably clear this default when the
 * request body is FormData, so the server receives Content-Type: application/json
 * instead of multipart/form-data;boundary=.... Multer cannot parse JSON-typed
 * bodies — req.files is always undefined → 400 "No files uploaded".
 *
 * With native fetch + FormData body + NO Content-Type header, the browser
 * always sets the correct `multipart/form-data; boundary=<uuid>` automatically.
 * This is the only fully reliable approach for multipart uploads in this setup.
 */
async function _fetchUpload(path, formData, timeoutMs = 120000) {
  const token = localStorage.getItem('token');
  const baseUrl = api.defaults.baseURL || 'https://matchify-probackend.vercel.app/api';
  const url = `${baseUrl}${path}`;

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        // Authorization only — intentionally no Content-Type so browser sets
        // multipart/form-data;boundary=... automatically from the FormData body.
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(tid);
  }

  let data;
  try { data = await response.json(); } catch { data = {}; }

  if (!response.ok) {
    const err = new Error(data?.error || data?.message || `Upload failed (${response.status})`);
    err.response = { status: response.status, data };
    throw err;
  }
  return data;
}

export const tournamentAPI = {
  // Get all tournaments (public)
  getTournaments: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await api.get(`/tournaments?${queryString}`);
    return response.data;
  },

  // Get single tournament (public)
  getTournament: async (id) => {
    const response = await api.get(`/tournaments/${id}`);
    return response.data;
  },

  // Create tournament (organizer only)
  createTournament: async (tournamentData) => {
    const response = await api.post('/tournaments', tournamentData);
    return response.data;
  },

  // Update tournament (organizer only)
  updateTournament: async (id, tournamentData) => {
    const response = await api.put(`/tournaments/${id}`, tournamentData);
    return response.data;
  },

  // Delete tournament (organizer only)
  deleteTournament: async (id) => {
    const response = await api.delete(`/tournaments/${id}`);
    return response.data;
  },

  // Upload tournament posters (organizer only)
  // Uses native fetch — see _fetchUpload comment above for why not axios.
  uploadPosters: async (id, files) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('posters', file));
    return _fetchUpload(`/tournaments/${id}/posters`, formData);
  },

  // Category endpoints
  createCategory: async (tournamentId, categoryData) => {
    const response = await api.post(
      `/tournaments/${tournamentId}/categories`,
      categoryData
    );
    return response.data;
  },

  getCategories: async (tournamentId) => {
    const response = await api.get(`/tournaments/${tournamentId}/categories`);
    return response.data;
  },

  updateCategory: async (tournamentId, categoryId, categoryData) => {
    const response = await api.put(
      `/tournaments/${tournamentId}/categories/${categoryId}`,
      categoryData
    );
    return response.data;
  },

  deleteCategory: async (tournamentId, categoryId) => {
    const response = await api.delete(
      `/tournaments/${tournamentId}/categories/${categoryId}`
    );
    return response.data;
  },

  // Upload payment QR code (organizer only)
  // Uses native fetch — see _fetchUpload comment above for why not axios.
  uploadPaymentQR: async (tournamentId, file, upiId, accountHolderName) => {
    const formData = new FormData();
    formData.append('paymentQR', file);
    if (upiId) formData.append('upiId', upiId);
    if (accountHolderName) formData.append('accountHolderName', accountHolderName);
    return _fetchUpload(`/tournaments/${tournamentId}/payment-qr`, formData);
  },

  // Delete a poster (organizer only)
  deletePoster: async (tournamentId, posterId) => {
    const response = await api.delete(
      `/tournaments/${tournamentId}/posters/${posterId}`
    );
    return response.data;
  },

  // Update payment info (organizer only)
  updatePaymentInfo: async (tournamentId, paymentInfo) => {
    const response = await api.put(
      `/tournaments/${tournamentId}/payment-info`,
      paymentInfo
    );
    return response.data;
  },

  // Umpire management (organizer only)
  addUmpireByCode: async (tournamentId, umpireCode) => {
    const response = await api.post(
      `/tournaments/${tournamentId}/umpires`,
      { umpireCode }
    );
    return response.data;
  },

  getTournamentUmpires: async (tournamentId) => {
    const response = await api.get(`/tournaments/${tournamentId}/umpires`);
    return response.data;
  },

  removeUmpire: async (tournamentId, umpireId) => {
    const response = await api.delete(
      `/tournaments/${tournamentId}/umpires/${umpireId}`
    );
    return response.data;
  },
};
