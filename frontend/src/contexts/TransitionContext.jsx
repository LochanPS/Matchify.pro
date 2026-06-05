/**
 * TransitionContext — provides a way for any page to trigger the splash
 * loading screen BEFORE navigating. The splash renders at App level (above
 * the router), so it stays visible across page transitions with zero flash.
 *
 * Usage in a page:
 *   const { triggerTransition } = useTransition();
 *   triggerTransition('/dashboard?role=PLAYER');  // shows splash, then navigates
 */
import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '../components/SplashScreen';

const TransitionContext = createContext(null);

export function TransitionProvider({ children }) {
  const [active, setActive] = useState(false);
  const destRef = useRef(null);
  const navigate = useNavigate();

  const triggerTransition = useCallback((dest) => {
    destRef.current = dest;
    setActive(true);
  }, []);

  const handleComplete = useCallback(() => {
    const dest = destRef.current;
    setActive(false);
    destRef.current = null;
    if (dest) navigate(dest);
  }, [navigate]);

  return (
    <TransitionContext.Provider value={{ triggerTransition }}>
      {children}
      {/* Renders ABOVE the router — stays mounted across route changes */}
      {active && (
        <SplashScreen duration={2000} onComplete={handleComplete} />
      )}
    </TransitionContext.Provider>
  );
}

export function usePageTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error('usePageTransition must be used within TransitionProvider');
  return ctx;
}
