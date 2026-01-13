import { PrismaClient } from '@prisma/client';
import {
  isGameComplete,
  getGameWinner,
  isMatchComplete,
  getMatchWinner,
  validateScoreUpdate,
  determineServer,
} from '../utils/badmintonRules.js';

const prisma = new PrismaClient();

/**
 * Initialize match score
 * @param {object} config - Match config (optional)
 */
function initializeScore(config = {}) {
  return {
    sets: [],
    currentSet: 1,
    currentScore: { player1: 0, player2: 0 },
    currentServer: 'player1', // Default, will be randomized
    history: [], // Point-by-point history
    matchConfig: config.matchConfig || {
      pointsPerSet: 21,
      setsToWin: 2,
      maxSets: 3,
      extension: true
    }
  };
}

/**
 * Add point to match
 */
async function addPoint(matchId, player) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new Error('Match not found');
  }

  if (match.status !== 'ONGOING' && match.status !== 'IN_PROGRESS') {
    throw new Error('Match is not ongoing');
  }

  // Get current score or initialize
  let scoreData = match.scoreJson ? JSON.parse(match.scoreJson) : initializeScore();
  
  // Get match config from score data
  const matchConfig = scoreData.matchConfig || {
    pointsPerSet: 21,
    setsToWin: 2,
    maxSets: 3,
    extension: true
  };

  // Validate score update
  const currentPlayerScore = scoreData.currentScore[player];
  const validation = validateScoreUpdate(
    currentPlayerScore,
    currentPlayerScore + 1,
    matchConfig
  );

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // Increment score
  scoreData.currentScore[player] += 1;

  // Add to history
  scoreData.history.push({
    set: scoreData.currentSet,
    player,
    score: { ...scoreData.currentScore },
    timestamp: new Date().toISOString(),
  });

  // Update server
  const totalPoints = scoreData.currentScore.player1 + scoreData.currentScore.player2;
  scoreData.currentServer = determineServer(totalPoints, scoreData.currentServer);

  // Check if game is complete (using match config)
  if (isGameComplete(scoreData.currentScore.player1, scoreData.currentScore.player2, matchConfig)) {
    const winner = getGameWinner(scoreData.currentScore.player1, scoreData.currentScore.player2, matchConfig);
    
    // Save set result
    scoreData.sets.push({
      setNumber: scoreData.currentSet,
      score: { ...scoreData.currentScore },
      winner,
    });

    // Check if match is complete (using match config)
    if (isMatchComplete(scoreData.sets, matchConfig)) {
      const matchWinner = getMatchWinner(scoreData.sets, matchConfig);
      
      // Determine actual winner ID
      const winnerId = matchWinner === 'player1' ? match.player1Id : match.player2Id;
      
      // Update match status
      await prisma.match.update({
        where: { id: matchId },
        data: {
          scoreJson: JSON.stringify(scoreData),
          status: 'COMPLETED',
          winnerId: winnerId,
          completedAt: new Date(),
        },
      });

      return { scoreData, matchComplete: true, winner: matchWinner };
    }

    // Start next set
    scoreData.currentSet += 1;
    scoreData.currentScore = { player1: 0, player2: 0 };
    
    // Winner of previous set serves first in next set
    scoreData.currentServer = winner;
  }

  // Update match
  await prisma.match.update({
    where: { id: matchId },
    data: {
      scoreJson: JSON.stringify(scoreData),
      updatedAt: new Date(),
    },
  });

  return { scoreData, matchComplete: false };
}

/**
 * Undo last point
 */
async function undoLastPoint(matchId) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match || !match.scoreJson) {
    throw new Error('No score to undo');
  }

  let scoreData = JSON.parse(match.scoreJson);

  if (scoreData.history.length === 0) {
    throw new Error('No history to undo');
  }

  // Remove last point from history
  const lastPoint = scoreData.history.pop();

  // If we're undoing into a previous set
  if (lastPoint.set < scoreData.currentSet) {
    // Remove last completed set
    scoreData.sets.pop();
    scoreData.currentSet = lastPoint.set;
  }

  // Restore previous score
  if (scoreData.history.length > 0) {
    const previousPoint = scoreData.history[scoreData.history.length - 1];
    scoreData.currentScore = { ...previousPoint.score };
    
    // Recalculate server
    const totalPoints = scoreData.currentScore.player1 + scoreData.currentScore.player2;
    scoreData.currentServer = determineServer(totalPoints, 'player1');
  } else {
    scoreData.currentScore = { player1: 0, player2: 0 };
    scoreData.currentServer = 'player1';
  }

  // Update match
  await prisma.match.update({
    where: { id: matchId },
    data: {
      scoreJson: JSON.stringify(scoreData),
      status: 'ONGOING', // In case match was completed
      winnerId: null,
      completedAt: null,
    },
  });

  return scoreData;
}

/**
 * Start match
 */
async function startMatch(matchId, umpireId) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
  });

  if (!match) {
    throw new Error('Match not found');
  }

  if (match.status !== 'PENDING' && match.status !== 'READY') {
    throw new Error('Match cannot be started');
  }

  const scoreData = initializeScore();

  await prisma.match.update({
    where: { id: matchId },
    data: {
      status: 'ONGOING',
      umpireId: umpireId,
      startedAt: new Date(),
      scoreJson: JSON.stringify(scoreData),
    },
  });

  return scoreData;
}

export {
  initializeScore,
  addPoint,
  undoLastPoint,
  startMatch,
};
