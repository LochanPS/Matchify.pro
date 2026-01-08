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
      alert('Match submitted successfully!');
    } catch (error) {
      console.error('Error submitting match:', error);
      alert('Error submitting match');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  if (!match) return (
    <div className="text-center py-8">
      <p className="text-gray-500">Match not found</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Scoring Console</h1>
      
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">
          {match.tournament?.name} - {match.category?.name}
        </h2>
        
        <div className="grid grid-cols-4 gap-4 text-center mb-6">
          <div className="font-semibold">Player</div>
          <div className="font-semibold">Set 1</div>
          <div className="font-semibold">Set 2</div>
          <div className="font-semibold">Set 3</div>
          
          <div className="text-left font-medium">Player 1</div>
          <div className="text-2xl font-bold">{score.set1.player1}</div>
          <div className="text-2xl font-bold">{score.set2.player1}</div>
          <div className="text-2xl font-bold">{score.set3.player1}</div>
          
          <div className="text-left font-medium">Player 2</div>
          <div className="text-2xl font-bold">{score.set1.player2}</div>
          <div className="text-2xl font-bold">{score.set2.player2}</div>
          <div className="text-2xl font-bold">{score.set3.player2}</div>
        </div>

        <div className="text-center mb-4">
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Current Set: {score.currentSet}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <button 
          onClick={() => addPoint('player1')} 
          className="bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-lg text-lg font-semibold transition-colors"
        >
          +1 Player 1
        </button>
        <button 
          onClick={() => addPoint('player2')} 
          className="bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg text-lg font-semibold transition-colors"
        >
          +1 Player 2
        </button>
      </div>

      <button 
        onClick={submitMatch} 
        className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
      >
        Submit Match
      </button>
    </div>
  );
}