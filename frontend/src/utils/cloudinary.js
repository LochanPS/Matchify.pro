/**
 * Cloudinary URL optimizer.
 *
 * Our images are uploaded to Cloudinary and were being served at full original
 * resolution with no transforms, e.g.
 *   https://res.cloudinary.com/<cloud>/image/upload/v123/matchify/.../x.jpg
 * On image-heavy pages (the infinite-scroll tournament list, leaderboards) iOS
 * Safari decodes every one of these to a full bitmap and can run out of memory,
 * crashing the tab ("A problem repeatedly occurred").
 *
 * cldOptimize() injects Cloudinary delivery transforms so each image is served
 * resized, auto-format (WebP/AVIF) and auto-quality:
 *   .../image/upload/f_auto,q_auto,c_limit,w_800/v123/...
 * c_limit only ever downscales (never upscales), so small images are untouched.
 * Non-Cloudinary URLs (and already-transformed ones) are returned unchanged.
 */
export function cldOptimize(url, opts = {}) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;

  const [head, tail] = url.split('/upload/');
  if (tail == null) return url;

  // Already has a transformation segment right after /upload/ → leave it alone.
  const firstSeg = tail.split('/')[0] || '';
  if (/(^|,)(w_|h_|c_|f_|q_|dpr_|e_|g_|ar_)/.test(firstSeg)) return url;

  const t = ['f_auto', 'q_auto', 'c_limit'];
  if (opts.w) t.push(`w_${opts.w}`);
  if (opts.h) t.push(`h_${opts.h}`);
  if (opts.dpr) t.push(`dpr_${opts.dpr}`);

  return `${head}/upload/${t.join(',')}/${tail}`;
}

export default cldOptimize;
