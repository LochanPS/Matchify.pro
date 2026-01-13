// Badminton scoring rules

// Default rules (can be overridden by match config)
const DEFAULT_RULES = {
  pointsToWinGame: 21,
  setsToWin: 2, // Best of 3 sets
  maxSets: 3,
  deucePoint: 20,
  maxDeuceDifference: 2,
  maxPointsInGame: 30, // If 29-29, next point wins
  extension: true, // Allow deuce/extension
};

/**
 * Check if a game (set) is complete
 * @param {number} score1 - Player 1 score
 * @param {number} score2 - Player 2 score
 * @param {object} config - Match config (optional)
 */
function isGameComplete(score1, score2, config = {}) {
  const pointsToWin = config.pointsPerSet || DEFAULT_RULES.pointsToWinGame;
  const extension = config.extension !== undefined ? config.extension : DEFAULT_RULES.extension;
  const maxPoints = extension ? (pointsToWin + 9) : pointsToWin; // e.g., 30 for 21-point game, or exact points if no extension
  const deucePoint = pointsToWin - 1; // e.g., 20 for 21-point game, 29 for 30-point game
  
  // If no extension, first to reach points wins
  if (!extension) {
    if (score1 >= pointsToWin || score2 >= pointsToWin) {
      return true;
    }
    return false;
  }
  
  // Normal win (pointsToWin+ with 2 point lead)
  if (score1 >= pointsToWin && score1 - score2 >= DEFAULT_RULES.maxDeuceDifference) {
    return true;
  }
  if (score2 >= pointsToWin && score2 - score1 >= DEFAULT_RULES.maxDeuceDifference) {
    return true;
  }
  
  // Golden point (maxPoints wins)
  if (score1 === maxPoints || score2 === maxPoints) {
    return true;
  }
  
  return false;
}

/**
 * Get winner of a game
 * @param {number} score1 - Player 1 score
 * @param {number} score2 - Player 2 score
 * @param {object} config - Match config (optional)
 */
function getGameWinner(score1, score2, config = {}) {
  if (!isGameComplete(score1, score2, config)) {
    return null;
  }
  return score1 > score2 ? 'player1' : 'player2';
}

/**
 * Check if match is complete
 * @param {array} sets - Array of completed sets
 * @param {object} config - Match config (optional)
 */
function isMatchComplete(sets, config = {}) {
  const setsToWin = config.setsToWin || DEFAULT_RULES.setsToWin;
  
  const player1Wins = sets.filter(set => set.winner === 'player1').length;
  const player2Wins = sets.filter(set => set.winner === 'player2').length;
  
  return player1Wins >= setsToWin || player2Wins >= setsToWin;
}

/**
 * Get match winner
 * @param {array} sets - Array of completed sets
 * @param {object} config - Match config (optional)
 */
function getMatchWinner(sets, config = {}) {
  if (!isMatchComplete(sets, config)) {
    return null;
  }
  
  const setsToWin = config.setsToWin || DEFAULT_RULES.setsToWin;
  const player1Wins = sets.filter(set => set.winner === 'player1').length;
  return player1Wins >= setsToWin ? 'player1' : 'player2';
}

/**
 * Validate score update
 * @param {number} currentScore - Current score
 * @param {number} newScore - New score
 * @param {object} config - Match config (optional)
 */
function validateScoreUpdate(currentScore, newScore, config = {}) {
  const pointsToWin = config.pointsPerSet || DEFAULT_RULES.pointsToWinGame;
  const extension = config.extension !== undefined ? config.extension : DEFAULT_RULES.extension;
  const maxPoints = extension ? (pointsToWin + 9) : pointsToWin;
  
  // Can only increment by 1
  if (newScore !== currentScore + 1) {
    return { valid: false, error: 'Score can only increment by 1' };
  }
  
  // Cannot exceed max points
  if (newScore > maxPoints) {
    return { valid: false, error: `Score cannot exceed ${maxPoints}` };
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
  DEFAULT_RULES,
  isGameComplete,
  getGameWinner,
  isMatchComplete,
  getMatchWinner,
  validateScoreUpdate,
  determineServer,
};
