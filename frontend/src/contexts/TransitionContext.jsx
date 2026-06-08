/**
 * TransitionContext — navigate directly, no splash screen on transitions.
 * Splash only shows on first-ever app open (handled in App.jsx).
 */
import { createContext, useContext, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const TransitionContext = createContext(null);

export function TransitionProvider({ children }) {
  const navigate = useNavigate();

  // Just navigate — no splash, no delay
  const triggerTransition = useCallback((dest) => {
    if (dest) navigate(dest);
  }, [navigate]);

  return (
    <TransitionContext.Provider value={{ triggerTransition }}>
      {children}
    </TransitionContext.Provider>
  );
}

export function usePageTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('usePageTransition must be used within TransitionProvider');
  return ctx;
}
