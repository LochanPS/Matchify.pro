/**
 * Helper to get proper image URL for uploaded files
 * Handles both local uploads and external URLs, and optimizes Cloudinary
 * images (resize + auto-format/quality) to keep memory low on mobile.
 */
import { cldOptimize } from './cloudinary';

export const getImageUrl = (url, opts = { w: 1200 }) => {
  if (!url) return null;
  if (url.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://matchify-backend-production-cb58.up.railway.app';
    return `${baseUrl}${url}`;
  }
  return cldOptimize(url, opts);
};

export default getImageUrl;
