// Badminton scoring rules

const RULES = {
  pointsToWinGame: 21,
  pointsToWinSet: 2, // Best of 3 sets
  deucePoint: 20,
  maxDeuceDifference: 2,
  maxPointsInGame: 30, // If 29-29, next point wins
};

/**
 * Check if a game (set) is complete
 */
function isGameComplete(score1, score2) {
  // Normal win (21+ with 2 point lead)
  if (score1 >= RULES.pointsToWinGame && score1 - score2 >= RULES.maxDeuceDifference) {
    return true;
  }
  if (score2 >= RULES.pointsToWinGame && score2 - score1 >= RULES.maxDeuceDifference) {
    return true;
  }
  
  // Golden point (30 wins)
  if (score1 === RULES.maxPointsInGame || score2 === RULES.maxPointsInGame) {
    return true;
  }
  
  return false;
}

/**
 * Get winner of a game
 */
function getGameWinner(score1, score2) {
  if (!isGameComplete(score1, score2)) {
    return null;
  }
  return score1 > score2 ? 'player1' : 'player2';
}

/**
 * Check if match is complete
 */
function isMatchComplete(sets) {
  const player1Wins = sets.filter(set => set.winner === 'player1').length;
  const player2Wins = sets.filter(set => set.winner === 'player2').length;
  
  // Best of 3: First to win 2 sets
  return player1Wins === 2 || player2Wins === 2;
}

/**
 * Get match winner
 */
function getMatchWinner(sets) {
  if (!isMatchComplete(sets)) {
    return null;
  }
  
  const player1Wins = sets.filter(set => set.winner === 'player1').length;
  return player1Wins === 2 ? 'player1' : 'player2';
}

/**
 * Validate score update
 */
function validateScoreUpdate(currentScore, newScore) {
  // Can only increment by 1
  if (newScore !== currentScore + 1) {
    return { valid: false, error: 'Score can only increment by 1' };
  }
  
  // Cannot exceed 30
  if (newScore > RULES.maxPointsInGame) {
    return { valid: false, error: 'Score cannot exceed 30' };
  }
  
  return { valid: true };
}

/**
 * Determine current server (alternates every point)
 */
function determineServer(totalPoints, initialServer) {
  // Server changes after each point in badminton
  return totalPoints % 2 === 0 ? initialServer : (initialServer === 'player1' ? 'player2' : 'player1');
}

export {
  RULES,
  isGameComplete,
  getGameWinner,
  isMatchComplete,
  getMatchWinner,
  validateScoreUpdate,
  determineServer,
};
