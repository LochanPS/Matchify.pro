import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

export default function UmpireScoring() {
  const { matchId } = useParams();
  const [match, setMatch] = useState(null);
  const [score, setScore] = useState({
    set1: { player1: 0, player2: 0 },
    set2: { player1: 0, player2: 0 },
    set3: { player1: 0, player2: 0 },
    currentSet: 1,
  });
  const [loading, setLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatch(res.data.match);
      if (res.data.match.scoreJson) {
        setScore(JSON.parse(res.data.match.scoreJson));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching match:', error);
      setLoading(false);
    }
  };

  const addPoint = async (player) => {
    const newScore = { ...score };
    const set = `set${score.currentSet}`;
    newScore[set][player]++;

    // Check if set is won
    if (
      (newScore[set].player1 >= 21 && newScore[set].player1 - newScore[set].player2 >= 2) ||
      (newScore[set].player2 >= 21 && newScore[set].player2 - newScore[set].player1 >= 2)
    ) {
      if (score.currentSet < 3) newScore.currentSet++;
    }

    setScore(newScore);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/matches/${matchId}/score`, 
        { scoreData: newScore }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const submitMatch = async () => {
    const sets = [score.set1, score.set2, score.set3];
    let p1 = 0, p2 = 0;
    sets.forEach((s) => {
      if (s.player1 > s.player2) p1++;
      else if (s.player2 > s.player1) p2++;
    });

    const winnerId = p1 > p2 ? match.player1Id : match.player2Id;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/matches/${matchId}/submit`, 
        { winnerId, finalScore: score }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error submitting match:', error);
      setErrorMessage('Error submitting match');
      setShowErrorModal(true);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-400 mt-4 font-medium">Loading match...</p>
      </div>
    </div>
  );

  if (!match) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center py-8">
        <p className="text-gray-400">Match not found</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-white mb-6">Scoring Console</h1>
        
        {/* Match Info Card with Halo */}
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl"></div>
          <div className="relative bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-4">
              {match.tournament?.name} - {match.category?.name}
            </h2>
            
            <div className="grid grid-cols-4 gap-4 text-center mb-6">
              <div className="font-semibold text-gray-400">Player</div>
              <div className="font-semibold text-gray-400">Set 1</div>
              <div className="font-semibold text-gray-400">Set 2</div>
              <div className="font-semibold text-gray-400">Set 3</div>
              
              <div className="text-left font-medium text-white">Player 1</div>
              <div className="text-2xl font-bold text-white">{score.set1.player1}</div>
              <div className="text-2xl font-bold text-white">{score.set2.player1}</div>
              <div className="text-2xl font-bold text-white">{score.set3.player1}</div>
              
              <div className="text-left font-medium text-white">Player 2</div>
              <div className="text-2xl font-bold text-white">{score.set1.player2}</div>
              <div className="text-2xl font-bold text-white">{score.set2.player2}</div>
              <div className="text-2xl font-bold text-white">{score.set3.player2}</div>
            </div>

            <div className="text-center">
              <span className="bg-purple-500/20 text-purple-300 px-4 py-2 rounded-xl text-sm font-medium border border-purple-500/30">
                Current Set: {score.currentSet}
              </span>
            </div>
          </div>
        </div>

        {/* Score Buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            onClick={() => addPoint('player1')} 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-xl text-lg font-semibold transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            +1 Player 1
          </button>
          <button 
            onClick={() => addPoint('player2')} 
            className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white py-4 px-6 rounded-xl text-lg font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/25"
          >
            +1 Player 2
          </button>
        </div>

        <button 
          onClick={submitMatch} 
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-4 px-6 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-red-500/25"
        >
          Submit Match
        </button>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 bg-gradient-to-r from-emerald-500/30 via-green-500/30 to-emerald-500/30 rounded-full blur-3xl"></div>
          </div>
          <div className="relative bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Match Submitted!</h3>
            <p className="text-gray-400 mb-6">The match has been submitted successfully.</p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-96 h-96 bg-gradient-to-r from-red-500/30 via-orange-500/30 to-red-500/30 rounded-full blur-3xl"></div>
          </div>
          <div className="relative bg-slate-800 border border-white/10 rounded-2xl p-6 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Error</h3>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-red-500/25 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
