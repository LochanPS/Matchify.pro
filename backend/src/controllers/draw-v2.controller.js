/**
 * Draw Controller V2 - Using new draw engine
 * Clean API endpoints for draw management
 */

import DrawService from '../services/draw-engine/DrawService.js';
import PlayerSeeder from '../services/draw-engine/PlayerSeeder.js';
import prisma from '../lib/prisma.js';

/**
 * Create a new EMPTY draw (no players assigned)
 * POST /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
 */
export const createDraw = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const { format, bracketSize, options = {} } = req.body;
    const userId = req.user.id || req.user.userId;

    // Verify ownership
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the organizer can create draws'
      });
    }

    // Verify category
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category || category.tournamentId !== tournamentId) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Check if category is completed
    if (category.status === 'completed') {
      return res.status(403).json({
        success: false,
        error: 'Cannot modify draw for completed category'
      });
    }

    // Validate format
    const validFormats = ['KNOCKOUT', 'ROUND_ROBIN', 'ROUND_ROBIN_KNOCKOUT'];
    if (!validFormats.includes(format)) {
      return res.status(400).json({
        success: false,
        error: `Invalid format. Must be one of: ${validFormats.join(', ')}`
      });
    }

    // Validate bracket size
    if (!bracketSize || bracketSize < 2) {
      return res.status(400).json({
        success: false,
        error: 'Bracket size must be at least 2'
      });
    }

    // Create EMPTY draw
    const result = await DrawService.createDraw(
      tournamentId,
      categoryId,
      format,
      { bracketSize, ...options }
    );

    res.status(201).json({
      success: true,
      message: 'Draw structure created successfully. Now assign players.',
      data: {
        draw: result.draw,
        structure: result.structure
      }
    });
  } catch (error) {
    console.error('Create draw error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create draw'
    });
  }
};

/**
 * Assign players to draw slots
 * POST /api/v2/tournaments/:tournamentId/categories/:categoryId/assign-players
 */
export const assignPlayers = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const { playerAssignments } = req.body;
    const userId = req.user.id || req.user.userId;

    // Verify ownership
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (!Array.isArray(playerAssignments)) {
      return res.status(400).json({
        success: false,
        error: 'playerAssignments must be an array'
      });
    }

    const result = await DrawService.assignPlayers(
      tournamentId,
      categoryId,
      playerAssignments
    );

    res.json({
      success: true,
      message: 'Players assigned successfully',
      data: result
    });
  } catch (error) {
    console.error('Assign players error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign players'
    });
  }
};

/**
 * Auto-assign all confirmed players
 * POST /api/v2/tournaments/:tournamentId/categories/:categoryId/auto-assign-players
 */
export const autoAssignPlayers = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.id || req.user.userId;

    // Verify ownership
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const result = await DrawService.autoAssignAllPlayers(
      tournamentId,
      categoryId
    );

    res.json({
      success: true,
      message: 'All players assigned automatically',
      data: result
    });
  } catch (error) {
    console.error('Auto assign players error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-assign players'
    });
  }
};

/**
 * Get confirmed players for assignment
 * GET /api/v2/tournaments/:tournamentId/categories/:categoryId/confirmed-players
 */
export const getConfirmedPlayers = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;

    const registrations = await PlayerSeeder.getConfirmedRegistrations(
      tournamentId,
      categoryId
    );

    const seededPlayers = await PlayerSeeder.seedPlayers(registrations);

    res.json({
      success: true,
      data: {
        players: seededPlayers,
        count: seededPlayers.length
      }
    });
  } catch (error) {
    console.error('Get confirmed players error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get confirmed players'
    });
  }
};

/**
 * Get draw
 * GET /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
 */
export const getDraw = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;

    const result = await DrawService.getDraw(tournamentId, categoryId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Draw not found'
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get draw error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get draw'
    });
  }
};

/**
 * Delete draw
 * DELETE /api/v2/tournaments/:tournamentId/categories/:categoryId/draw
 */
export const deleteDraw = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.id || req.user.userId;

    // Verify ownership
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    await DrawService.deleteDraw(tournamentId, categoryId);

    res.json({
      success: true,
      message: 'Draw deleted successfully'
    });
  } catch (error) {
    console.error('Delete draw error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete draw'
    });
  }
};

/**
 * Complete match and advance winner
 * POST /api/v2/matches/:matchId/complete
 */
export const completeMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, scoreJson } = req.body;

    if (!winnerId) {
      return res.status(400).json({
        success: false,
        error: 'Winner ID is required'
      });
    }

    const match = await DrawService.completeMatch(matchId, winnerId, scoreJson);

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
 * Reset match result
 * POST /api/v2/matches/:matchId/reset
 */
export const resetMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id || req.user.userId;

    // Get match to verify ownership
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    if (match.tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the organizer can reset matches'
      });
    }

    const resetMatch = await DrawService.resetMatch(matchId);

    res.json({
      success: true,
      message: 'Match reset successfully. Downstream matches cleared.',
      data: { match: resetMatch }
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
 * Continue to knockout stage
 * POST /api/v2/tournaments/:tournamentId/categories/:categoryId/continue-knockout
 */
export const continueToKnockout = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const { qualifiedPlayerIds } = req.body;
    const userId = req.user.id || req.user.userId;

    // Verify ownership
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (!Array.isArray(qualifiedPlayerIds) || qualifiedPlayerIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Qualified player IDs required'
      });
    }

    const qualifiedPlayers = await DrawService.arrangeKnockout(
      tournamentId,
      categoryId,
      qualifiedPlayerIds
    );

    res.json({
      success: true,
      message: 'Knockout stage populated successfully',
      data: { qualifiedPlayers }
    });
  } catch (error) {
    console.error('Continue to knockout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to continue to knockout'
    });
  }
};

/**
 * Auto-arrange knockout with top players from groups
 * POST /api/v2/tournaments/:tournamentId/categories/:categoryId/auto-arrange-knockout
 */
export const autoArrangeKnockout = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const { advancePerGroup } = req.body;
    const userId = req.user.id || req.user.userId;

    // Verify ownership
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    if (!advancePerGroup || advancePerGroup < 1) {
      return res.status(400).json({
        success: false,
        error: 'advancePerGroup must be at least 1'
      });
    }

    const qualifiedPlayers = await DrawService.autoArrangeKnockout(
      tournamentId,
      categoryId,
      advancePerGroup
    );

    res.json({
      success: true,
      message: `Top ${advancePerGroup} from each group advanced to knockout`,
      data: { qualifiedPlayers }
    });
  } catch (error) {
    console.error('Auto arrange knockout error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to auto-arrange knockout'
    });
  }
};

/**
 * Get group standings
 * GET /api/v2/tournaments/:tournamentId/categories/:categoryId/groups/:groupIndex/standings
 */
export const getGroupStandings = async (req, res) => {
  try {
    const { tournamentId, categoryId, groupIndex } = req.params;

    const standings = await DrawService.getGroupStandings(
      tournamentId,
      categoryId,
      parseInt(groupIndex)
    );

    res.json({
      success: true,
      data: { standings }
    });
  } catch (error) {
    console.error('Get group standings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get group standings'
    });
  }
};

/**
 * Get all group standings
 * GET /api/v2/tournaments/:tournamentId/categories/:categoryId/standings
 */
export const getAllGroupStandings = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;

    const allStandings = await DrawService.getAllGroupStandings(
      tournamentId,
      categoryId
    );

    res.json({
      success: true,
      data: { groups: allStandings }
    });
  } catch (error) {
    console.error('Get all group standings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get group standings'
    });
  }
};

/**
 * Shuffle players
 * POST /api/v2/tournaments/:tournamentId/categories/:categoryId/shuffle
 */
export const shufflePlayers = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.id || req.user.userId;

    // Verify ownership
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    await DrawService.shufflePlayers(tournamentId, categoryId);

    res.json({
      success: true,
      message: 'Players shuffled successfully'
    });
  } catch (error) {
    console.error('Shuffle players error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to shuffle players'
    });
  }
};

/**
 * Get all matches for a category
 * GET /api/v2/tournaments/:tournamentId/categories/:categoryId/matches
 */
export const getMatches = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const { stage, round, groupIndex } = req.query;

    const where = {
      tournamentId,
      categoryId
    };

    if (stage) where.stage = stage;
    if (round) where.round = parseInt(round);
    if (groupIndex !== undefined) where.groupIndex = parseInt(groupIndex);

    const matches = await prisma.match.findMany({
      where,
      orderBy: [
        { matchIndex: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: { matches }
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get matches'
    });
  }
};
