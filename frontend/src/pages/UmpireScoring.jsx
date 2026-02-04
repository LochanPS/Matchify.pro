import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * UmpireScoring - Redirect component
 * This page redirects umpires to the proper MatchScoringPage
 * which has the full scoring functionality
 */
export default function UmpireScoring() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the proper match scoring page
    navigate(`/match/${matchId}/score`, { replace: true });
  }, [matchId, navigate]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-400 mt-4 font-medium">Loading scoring console...</p>
      </div>
    </div>
  );
}
