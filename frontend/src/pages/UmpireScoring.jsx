import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * UmpireScoring - Redirect component
 * Redirects umpires to the proper MatchScoringPage
 */
export default function UmpireScoring() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/match/${matchId}/score`, { replace: true });
  }, [matchId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07071a' }}>
      <div className="text-center">
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
          style={{ borderColor: 'rgba(6,182,212,0.3)', borderTopColor: '#06b6d4' }}
        />
        <p className="mt-4 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Loading scoring console...</p>
      </div>
    </div>
  );
}
