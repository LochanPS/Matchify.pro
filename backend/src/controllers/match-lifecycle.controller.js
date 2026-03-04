/**
 * Match Lifecycle Controller
 * Handles match management during live tournaments
 */

import MatchLifecycleService from '../services/draw-engine/MatchLifecycleService.js';
import prisma from '../lib/prisma.js';

/**
 * Assign umpire to a match
 * POST /api/v2/matches/:matchId/assign-umpire
 */
export const assignUmpire = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { umpireId } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!umpireId) {
      return res.status(400).json({
        success: false,
        error: 'Umpire ID is required'
      });
    }

    const match = await MatchLifecycleService.assignUmpire(matchId, umpireId, userId);

    res.json({
      success: true,
      message: 'Umpire assigned successfully',
      data: { match }
    });
  } catch (error) {
    console.error('Assign umpire error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign umpire'
    });
  }
};

/**
 * Start a match
 * POST /api/v2/matches/:matchId/start
 */
export const startMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { umpireId } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!umpireId) {
      return res.status(400).json({
        success: false,
        error: 'Umpire ID is required to start match'
      });
    }

    const match = await MatchLifecycleService.startMatch(matchId, umpireId, userId);

    res.json({
      success: true,
      message: 'Match started successfully',
      data: { match }
    });
  } catch (error) {
    console.error('Start match error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start match'
    });
  }
};

/**
 * Update match score
 * POST /api/v2/matches/:matchId/update-score
 */
export const updateScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { scoreJson } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!scoreJson) {
      return res.status(400).json({
        success: false,
        error: 'Score data is required'
      });
    }

    const match = await MatchLifecycleService.updateScore(matchId, scoreJson, userId);

    res.json({
      success: true,
      message: 'Score updated successfully',
      data: { match }
    });
  } catch (error) {
    console.error('Update score error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update score'
    });
  }
};

/**
 * Complete a match
 * POST /api/v2/matches/:matchId/complete
 */
export const completeMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, scoreJson } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!winnerId) {
      return res.status(400).json({
        success: false,
        error: 'Winner ID is required'
      });
    }

    if (!scoreJson) {
      return res.status(400).json({
        success: false,
        error: 'Final score is required'
      });
    }

    const match = await MatchLifecycleService.completeMatch(
      matchId,
      winnerId,
      scoreJson,
      userId
    );

    res.json({
      success: true,
      message: 'Match completed successfully',
      data: { match }
    });
  } catch (error) {
    console.error('Complete match error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to complete match'
    });
  }
};

/**
 * Reset a match
 * POST /api/v2/matches/:matchId/reset
 */
export const resetMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id || req.user.userId;

    const match = await MatchLifecycleService.resetMatch(matchId, userId);

    res.json({
      success: true,
      message: 'Match reset successfully',
      data: { match }
    });
  } catch (error) {
    console.error('Reset match error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to reset match'
    });
  }
};

/**
 * Assign court to a match
 * POST /api/v2/matches/:matchId/assign-court
 */
export const assignCourt = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { courtNumber } = req.body;
    const userId = req.user.id || req.user.userId;

    if (!courtNumber) {
      return res.status(400).json({
        success: false,
        error: 'Court number is required'
      });
    }

    const match = await MatchLifecycleService.assignCourt(matchId, courtNumber, userId);

    res.json({
      success: true,
      message: 'Court assigned successfully',
      data: { match }
    });
  } catch (error) {
    console.error('Assign court error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign court'
    });
  }
};

/**
 * Get match details
 * GET /api/v2/matches/:matchId
 */
export const getMatchDetails = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await MatchLifecycleService.getMatchDetails(matchId);

    res.json({
      success: true,
      data: { match }
    });
  } catch (error) {
    console.error('Get match details error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get match details'
    });
  }
};

/**
 * Get matches with filters
 * GET /api/v2/tournaments/:tournamentId/categories/:categoryId/matches
 */
export const getMatches = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const filters = {
      stage: req.query.stage,
      round: req.query.round,
      status: req.query.status,
      groupIndex: req.query.groupIndex,
      courtNumber: req.query.courtNumber
    };

    const matches = await MatchLifecycleService.getMatches(
      tournamentId,
      categoryId,
      filters
    );

    res.json({
      success: true,
      data: { matches, count: matches.length }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get matches'
    });
  }
};

/**
 * Get available umpires for a tournament
 * GET /api/v2/tournaments/:tournamentId/umpires
 */
export const getAvailableUmpires = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const umpires = await MatchLifecycleService.getAvailableUmpires(tournamentId);

    res.json({
      success: true,
      data: { umpires, count: umpires.length }
    });
  } catch (error) {
    console.error('Get umpires error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get umpires'
    });
  }
};
