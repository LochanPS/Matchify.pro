/**
 * Validate badminton score rules
 */
export const validateScore = (score, format = 'best_of_3') => {
  const errors = [];

  // Check if score exists
  if (!score || !score.sets) {
    errors.push('Invalid score structure');
    return { valid: false, errors };
  }

  // Validate each set
  score.sets.forEach((set, index) => {
    const p1Score = set.score?.player1 || 0;
    const p2Score = set.score?.player2 || 0;

    // Set must be won by 2 points (except at 29-29)
    if (p1Score >= 21 || p2Score >= 21) {
      const diff = Math.abs(p1Score - p2Score);

      if (p1Score === 30 || p2Score === 30) {
        // Max score is 30 (winning at 29-29)
        if (diff !== 1) {
          errors.push(`Set ${index + 1}: Invalid 30-point win (must be 30-29)`);
        }
      } else if (p1Score < 30 && p2Score < 30) {
        // Must win by 2 points before 30
        if (diff < 2 && (p1Score >= 21 || p2Score >= 21)) {
          errors.push(`Set ${index + 1}: Must win by 2 points (deuce rule)`);
        }
      }
    }

    // No set should exceed 30 points
    if (p1Score > 30 || p2Score > 30) {
      errors.push(`Set ${index + 1}: Score cannot exceed 30`);
    }

    // Both scores can't be >= 21 with diff > 2 (invalid deuce)
    if (p1Score >= 21 && p2Score >= 21) {
      if (Math.abs(p1Score - p2Score) > 2) {
        errors.push(`Set ${index + 1}: Invalid deuce score (max difference is 2)`);
      }
    }
  });

  // Check match completion
  const player1Sets = score.sets.filter(s => s.winner === 'player1').length;
  const player2Sets = score.sets.filter(s => s.winner === 'player2').length;

  if (format === 'best_of_3') {
    if (player1Sets > 2 || player2Sets > 2) {
      errors.push('Best of 3 cannot have more than 2 sets won');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Check if current score is at match point
 */
export const isMatchPoint = (score, format = 'best_of_3') => {
  if (!score || !score.sets || score.sets.length === 0) {
    return { isMatchPoint: false, player: null };
  }

  const currentSet = score.sets[score.sets.length - 1];
  const p1Score = currentSet.score?.player1 || 0;
  const p2Score = currentSet.score?.player2 || 0;

  // Count sets won
  const player1Sets = score.sets.filter(s => s.winner === 'player1').length;
  const player2Sets = score.sets.filter(s => s.winner === 'player2').length;

  // Check if one player is one set away from winning match
  const player1OneSetAway = player1Sets === (format === 'best_of_3' ? 1 : 2);
  const player2OneSetAway = player2Sets === (format === 'best_of_3' ? 1 : 2);

  // Check if current set is at match point score
  const player1AtMatchPoint = p1Score >= 20 && p1Score >= p2Score;
  const player2AtMatchPoint = p2Score >= 20 && p2Score >= player1Score;

  const isMatchPoint = (player1OneSetAway && player1AtMatchPoint) || (player2OneSetAway && player2AtMatchPoint);
  const player = player1OneSetAway && player1AtMatchPoint ? 'player1' : (player2OneSetAway && player2AtMatchPoint ? 'player2' : null);

  return {
    isMatchPoint,
    player,
  };
};

/**
 * Check if current score is at game point
 */
export const isGamePoint = (score) => {
  if (!score || !score.sets || score.sets.length === 0) {
    return { isGamePoint: false, player: null };
  }

  const currentSet = score.sets[score.sets.length - 1];
  const p1Score = currentSet.score?.player1 || 0;
  const p2Score = currentSet.score?.player2 || 0;

  // Game point: 20+ points and leading
  const player1AtGamePoint = p1Score >= 20 && p1Score > p2Score;
  const player2AtGamePoint = p2Score >= 20 && p2Score > p1Score;

  const isGamePoint = player1AtGamePoint || player2AtGamePoint;
  const player = player1AtGamePoint ? 'player1' : (player2AtGamePoint ? 'player2' : null);

  return {
    isGamePoint,
    player,
  };
};

/**
 * Check if score is in deuce (20-20 or higher with 1 point difference)
 */
export const isDeuce = (score) => {
  if (!score || !score.sets || score.sets.length === 0) {
    return false;
  }

  const currentSet = score.sets[score.sets.length - 1];
  const p1Score = currentSet.score?.player1 || 0;
  const p2Score = currentSet.score?.player2 || 0;

  // Deuce: both players at 20+ with max 1 point difference
  return p1Score >= 20 && p2Score >= 20 && Math.abs(p1Score - p2Score) <= 1;
};

/**
 * Check if score is at golden point (29-29)
 */
export const isGoldenPoint = (score) => {
  if (!score || !score.sets || score.sets.length === 0) {
    return false;
  }

  const currentSet = score.sets[score.sets.length - 1];
  const p1Score = currentSet.score?.player1 || 0;
  const p2Score = currentSet.score?.player2 || 0;

  return p1Score === 29 && p2Score === 29;
};
