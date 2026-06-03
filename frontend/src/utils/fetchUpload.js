/**
 * fetchUpload — multipart file upload via native fetch (NOT axios).
 *
 * Why not axios?
 * The shared axios instance has `Content-Type: application/json` as a default
 * header. Axios v1.x does NOT reliably clear this default when the body is
 * FormData, so the server receives Content-Type: application/json instead of
 * multipart/form-data;boundary=.... Multer cannot parse JSON-typed bodies —
 * req.files/req.file is always undefined → 400 "No files uploaded".
 *
 * With native fetch + FormData body + NO Content-Type header, the browser
 * always sets the correct `multipart/form-data; boundary=<uuid>` automatically.
 *
 * @param {string} path       - relative API path, e.g. '/registrations/with-screenshot'
 * @param {FormData} formData - FormData instance with all fields + files appended
 * @param {object} [opts]
 * @param {string} [opts.method='POST']    - HTTP method
 * @param {number} [opts.timeoutMs=120000] - abort timeout in ms (default 2 min)
 * @returns {Promise<object>} parsed JSON response
 * @throws error with .response = { status, data } for compatibility with getErrorMessage()
 */
export async function fetchUpload(path, formData, { method = 'POST', timeoutMs = 120000 } = {}) {
  const token = localStorage.getItem('token');
  // Derive base URL the same way api.js does so env config is respected.
  const baseUrl = import.meta.env.VITE_API_URL || 'https://matchify-backend-production-cb58.up.railway.app/api';
  const url = `${baseUrl}${path}`;

  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        // Authorization only — intentionally NO Content-Type.
        // Browser sets multipart/form-data;boundary=... automatically from FormData.
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
    // Match axios error shape so getErrorMessage() works unchanged.
    err.response = { status: response.status, data };
    throw err;
  }
  return data;
}
