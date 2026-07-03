import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Short share links: /t/:tSlug and /t/:tSlug/:cSlug
// Resolves the readable slug to the real tournament (and category) and opens the
// real page. Nothing else in the app changes — this is a thin entry point.
export default function ShareRedirect() {
  const { tSlug, cSlug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get(`/tournaments/resolve/${encodeURIComponent(tSlug)}`);
        const { id, categories } = res.data || {};
        if (!active) return;
        if (!id) { navigate('/tournaments', { replace: true }); return; }
        if (cSlug) {
          const cat = (categories || []).find((c) => c.slug === cSlug || c.id === cSlug);
          if (cat) { navigate(`/tournaments/${id}/draws/${cat.id}`, { replace: true }); return; }
        }
        navigate(`/tournaments/${id}`, { replace: true });
      } catch {
        if (active) navigate('/tournaments', { replace: true });
      }
    })();
    return () => { active = false; };
  }, [tSlug, cSlug, navigate]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
      Opening…
    </div>
  );
}
