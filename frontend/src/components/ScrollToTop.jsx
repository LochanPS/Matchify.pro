import { useEffect, useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

const scrollAllToTop = () => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};

/**
 * ScrollToTop — resets scroll position on every route change.
 *
 * useLayoutEffect fires synchronously after DOM mutations but BEFORE the
 * browser paints, so the user never sees the wrong scroll position.
 * The extra useEffect + rAF catches any late-rendering content that might
 * push scroll down after the initial layout.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  // Primary: before paint
  useLayoutEffect(() => {
    scrollAllToTop();
  }, [pathname]);

  // Fallback: after paint in case something re-scrolls (e.g. autofocus, dynamic content)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      scrollAllToTop();
    });
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  return null;
}
