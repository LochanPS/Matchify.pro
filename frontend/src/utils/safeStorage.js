/**
 * safeStorage — drop-in localStorage wrapper safe for iOS Safari Private Browsing.
 *
 * iOS throws SecurityError on ANY localStorage access in private mode.
 * All reads return null on failure; writes/removes fail silently.
 * Falls back to an in-memory Map so the session still works (data
 * just won't persist after tab close, which is expected in private mode).
 */

const _mem = new Map();
let _storageAvailable = null; // cached availability check

function _isAvailable() {
  if (_storageAvailable !== null) return _storageAvailable;
  try {
    const key = '__matchify_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    _storageAvailable = true;
  } catch {
    _storageAvailable = false;
  }
  return _storageAvailable;
}

export const safeStorage = {
  getItem(key) {
    try {
      if (_isAvailable()) return localStorage.getItem(key);
    } catch {}
    return _mem.get(key) ?? null;
  },

  setItem(key, value) {
    try {
      if (_isAvailable()) {
        localStorage.setItem(key, value);
        return;
      }
    } catch {}
    _mem.set(key, value);
  },

  removeItem(key) {
    try {
      if (_isAvailable()) localStorage.removeItem(key);
    } catch {}
    _mem.delete(key);
  },

  clear() {
    try {
      if (_isAvailable()) localStorage.clear();
    } catch {}
    _mem.clear();
  },
};

export default safeStorage;
