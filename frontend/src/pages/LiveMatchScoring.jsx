import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const LiveMatchScoring = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  
  // Score state
  const [currentSet, setCurrentSet] = useState(1);
  const [sets, setSets] = useState([
    { player1: 0, player2: 0 },
    { player1: 0, player2: 0 },
    { player1: 0, player2: 0 }
  ]);
  const [setsWon, setSetsWon] = useState({ player1: 0, player2: 0 });
  const [matchCompleted, setMatchCompleted] = useState(false);
  const [winner, setWinner] = useState(null);

  useEffect(() => {
    fetchMatchDetails();
  }, [matchId]);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const fetchMatchDetails = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockMatch = {
        id: matchId,
        player1: { id: '1', name: 'Player 1' },
        player2: { id: '2', name: 'Player 2' },
        tournament: { name: 'Test Tournament' },
        category: { name: 'Men\'s Singles' },
        round: 1,
        matchNumber: 1,
        status: 'IN_PROGRESS'
      };
      
      setMatch(mockMatch);
      setLoading(false);
      
      // Auto-start timer if match is in progress
      if (mockMatch.status === 'IN_PROGRESS') {
        setIsTimerRunning(true);
        setStartTime(new Date());
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load match details');
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatStartTime = (date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const addPoint = (player) => {
    if (matchCompleted) return;

    const newSets = [...sets];
    newSets[currentSet - 1][player]++;
    setSets(newSets);

    // Check if set is won (assuming 21 points to win, must win by 2)
    const currentSetScore = newSets[currentSet - 1];
    const playerScore = currentSetScore[player];
    const opponentScore = currentSetScore[player === 'player1' ? 'player2' : 'player1'];

    if (playerScore >= 21 && playerScore - opponentScore >= 2) {
      // Set won
      const newSetsWon = { ...setsWon };
      newSetsWon[player]++;
      setSetsWon(newSetsWon);

      toast.success(`${match[player].name} wins Set ${currentSet}!`);

      // Check if match is won (best of 3)
      if (newSetsWon[player] >= 2) {
        setMatchCompleted(true);
        setWinner(player);
        setIsTimerRunning(false);
        toast.success(`🏆 ${match[player].name} wins the match!`);
      } else {
        // Move to next set
        setCurrentSet(prev => prev + 1);
      }
    }
  };

  const undoLastPoint = () => {
    if (matchCompleted) return;

    const newSets = [...sets];
    const currentSetScore = newSets[currentSet - 1];

    // Find which player scored last (has higher score)
    if (currentSetScore.player1 > 0 || currentSetScore.player2 > 0) {
      if (currentSetScore.player1 >= currentSetScore.player2) {
        newSets[currentSet - 1].player1--;
      } else {
        newSets[currentSet - 1].player2--;
      }
      setSets(newSets);
    }
  };

  const startMatch = () => {
    setIsTimerRunning(true);
    setStartTime(new Date());
    toast.success('Match started!');
  };

  const pauseMatch = () => {
    setIsTimerRunning(false);
    toast.info('Match paused');
  };

  const completeMatch = async () => {
    try {
      // Save match results to backend
      const matchResult = {
        matchId,
        sets,
        setsWon,
        winner,
        duration: timer,
        completedAt: new Date()
      };

      console.log('Saving match result:', matchResult);
      // TODO: API call to save match result
      
      toast.success('Match completed and saved!');
      navigate('/matches');
    } catch (error) {
      console.error('Error saving match:', error);
      toast.error('Failed to save match result');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <p className="text-gray-400 text-lg">Match not found</p>
          <button
            onClick={() => navigate('/matches')}
            className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/matches')}
            className="flex items-center gap-2 text-gray-400 hover:text-teal-400 transition"
          >
            <span>←</span>
            <span>Back to Matches</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">{match.tournament.name}</h1>
            <p className="text-gray-400">{match.category.name} - Round {match.round}</p>
          </div>
          
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Timer Section */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 text-center border border-slate-700">
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-gray-400">📅 Started at {formatStartTime(startTime)}</span>
          </div>
          
          <div className="text-6xl font-bold text-teal-400 mb-4">
            {formatTime(timer)}
          </div>
          
          <div className="flex items-center justify-center gap-4">
            {!isTimerRunning && !matchCompleted && (
              <button
                onClick={startMatch}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition"
              >
                Start Match
              </button>
            )}
            
            {isTimerRunning && (
              <button
                onClick={pauseMatch}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg transition"
              >
                Pause
              </button>
            )}
            
            {matchCompleted && (
              <button
                onClick={completeMatch}
                className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-lg transition"
              >
                Save & Complete
              </button>
            )}
          </div>
        </div>

        {/* Set Scores */}
        <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
          <div className="flex justify-center gap-8 mb-6">
            {sets.map((set, index) => (
              <div
                key={index}
                className={`text-center p-4 rounded-lg border-2 ${
                  currentSet === index + 1
                    ? 'border-purple-500 bg-purple-900/30'
                    : 'border-slate-600 bg-slate-700'
                }`}
              >
                <p className="text-gray-400 text-sm mb-2">Set {index + 1}</p>
                <p className="text-2xl font-bold text-white">
                  {set.player1} - {set.player2}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Current Set Score */}
        <div className="bg-slate-800 rounded-xl p-8 mb-6 border border-slate-700">
          <div className="flex items-center justify-between">
            {/* Player 1 */}
            <div className="text-center">
              <div className="bg-slate-700 rounded-xl p-6 mb-4">
                <p className="text-4xl font-bold text-white mb-2">{setsWon.player1}</p>
                <p className="text-gray-400">Sets Won</p>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{match.player1.name}</h3>
            </div>

            {/* Current Set Score */}
            <div className="text-center">
              <p className="text-gray-400 mb-2">Set {currentSet}</p>
              <div className="text-8xl font-bold text-white">
                {sets[currentSet - 1]?.player1 || 0} - {sets[currentSet - 1]?.player2 || 0}
              </div>
              {matchCompleted && winner && (
                <div className="mt-4">
                  <p className="text-2xl font-bold text-teal-400">
                    🏆 {match[winner].name} Wins!
                  </p>
                </div>
              )}
            </div>

            {/* Player 2 */}
            <div className="text-center">
              <div className="bg-slate-700 rounded-xl p-6 mb-4">
                <p className="text-4xl font-bold text-white mb-2">{setsWon.player2}</p>
                <p className="text-gray-400">Sets Won</p>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{match.player2.name}</h3>
            </div>
          </div>
        </div>

        {/* Scoring Controls */}
        {!matchCompleted && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Player 1 Controls */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h4 className="text-lg font-bold text-white mb-4 text-center">{match.player1.name}</h4>
              <div className="space-y-4">
                <button
                  onClick={() => addPoint('player1')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
                >
                  + Point
                </button>
                <button
                  onClick={undoLastPoint}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg transition"
                >
                  — Undo
                </button>
              </div>
            </div>

            {/* Player 2 Controls */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h4 className="text-lg font-bold text-white mb-4 text-center">{match.player2.name}</h4>
              <div className="space-y-4">
                <button
                  onClick={() => addPoint('player2')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
                >
                  + Point
                </button>
                <button
                  onClick={undoLastPoint}
                  className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-3 px-6 rounded-lg transition"
                >
                  — Undo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMatchScoring;