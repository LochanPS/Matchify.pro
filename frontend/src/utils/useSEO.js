import { useEffect } from 'react';

// Lightweight per-page SEO — no dependency. Sets document.title + description +
// Open Graph / Twitter meta + canonical for the current route. Google renders JS,
// so these client-set tags are picked up for indexing.
//
// Usage:
//   useSEO({ title: 'Tournaments', description: '…', path: '/tournaments' });
// Omit a field to fall back to the site default.

const SITE = 'https://matchify.pro';
const DEFAULT_TITLE = "Matchify.pro — India's Premier Sports Tournament Platform";
const DEFAULT_DESC =
  "Join India's largest sports tournament platform. Register for tournaments, track your progress, view live draws, and compete with players across the country.";

function upsertMeta(key, keyVal, content) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${key}="${keyVal}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(key, keyVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export default function useSEO({ title, description, path } = {}) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const fullTitle = title ? `${title} | Matchify.pro` : DEFAULT_TITLE;
    const desc = description || DEFAULT_DESC;
    const url = path ? `${SITE}${path}` : `${SITE}${window.location.pathname}`;

    document.title = fullTitle;
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', fullTitle);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('property', 'og:url', url);
    upsertMeta('name', 'twitter:title', fullTitle);
    upsertMeta('name', 'twitter:description', desc);
    setCanonical(url);
  }, [title, description, path]);
}
