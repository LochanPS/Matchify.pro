/**
 * Helper to get proper image URL for uploaded files
 * Handles both local uploads and external URLs
 */
export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://matchify-probackend.vercel.app';
    return `${baseUrl}${url}`;
  }
  return url;
};

export default getImageUrl;
