import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Spinner from '../components/Spinner';

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
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#050810' }}>
      <div className="text-center">
        <Spinner size="lg" className="mx-auto" />
        <p className="mt-4 font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Loading scoring console...</p>
      </div>
    </div>
  );
}
