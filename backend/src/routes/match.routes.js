import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get match details
router.get('/:matchId', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            format: true,
            scoringFormat: true
          }
        },
        umpire: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Get player details
    let player1 = null;
    let player2 = null;
    let team1Player1 = null;
    let team1Player2 = null;
    let team2Player1 = null;
    let team2Player2 = null;

    if (match.player1Id) {
      player1 = await prisma.user.findUnique({
        where: { id: match.player1Id },
        select: { id: true, name: true, email: true }
      });
    }

    if (match.player2Id) {
      player2 = await prisma.user.findUnique({
        where: { id: match.player2Id },
        select: { id: true, name: true, email: true }
      });
    }

    // For doubles matches
    if (match.team1Player1Id) {
      team1Player1 = await prisma.user.findUnique({
        where: { id: match.team1Player1Id },
        select: { id: true, name: true, email: true }
      });
    }

    if (match.team1Player2Id) {
      team1Player2 = await prisma.user.findUnique({
        where: { id: match.team1Player2Id },
        select: { id: true, name: true, email: true }
      });
    }

    if (match.team2Player1Id) {
      team2Player1 = await prisma.user.findUnique({
        where: { id: match.team2Player1Id },
        select: { id: true, name: true, email: true }
      });
    }

    if (match.team2Player2Id) {
      team2Player2 = await prisma.user.findUnique({
        where: { id: match.team2Player2Id },
        select: { id: true, name: true, email: true }
      });
    }

    const matchData = {
      ...match,
      player1,
      player2,
      team1Player1,
      team1Player2,
      team2Player1,
      team2Player2,
      scoreData: match.scoreJson ? JSON.parse(match.scoreJson) : null
    };

    res.json({
      success: true,
      data: matchData
    });
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch match details',
      error: error.message
    });
  }
});

// Update match score
router.put('/:matchId/score', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { sets, setsWon, winner, status, duration } = req.body;
    const userId = req.user.userId;

    // Verify match exists and user has permission
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: { organizerId: true }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Check if user is umpire, organizer, or admin
    const userRoles = req.user.roles || [];
    const isAuthorized = 
      match.umpireId === userId ||
      match.tournament.organizerId === userId ||
      userRoles.includes('ADMIN');

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this match'
      });
    }

    // Prepare score data
    const scoreData = {
      sets,
      setsWon,
      winner,
      duration,
      updatedAt: new Date(),
      updatedBy: userId
    };

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreJson: JSON.stringify(scoreData),
        status: status || match.status,
        winnerId: winner ? (winner === 'player1' ? match.player1Id : match.player2Id) : null,
        completedAt: status === 'COMPLETED' ? new Date() : null,
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Match score updated successfully',
      data: updatedMatch
    });
  } catch (error) {
    console.error('Error updating match score:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update match score',
      error: error.message
    });
  }
});

// Start match
router.post('/:matchId/start', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: { organizerId: true }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Check authorization
    const userRoles = req.user.roles || [];
    const isAuthorized = 
      match.umpireId === userId ||
      match.tournament.organizerId === userId ||
      userRoles.includes('ADMIN');

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to start this match'
      });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Match started successfully',
      data: updatedMatch
    });
  } catch (error) {
    console.error('Error starting match:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start match',
      error: error.message
    });
  }
});

// Complete match
router.post('/:matchId/complete', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, scoreData } = req.body;
    const userId = req.user.userId;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: { organizerId: true }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Check authorization
    const userRoles = req.user.roles || [];
    const isAuthorized = 
      match.umpireId === userId ||
      match.tournament.organizerId === userId ||
      userRoles.includes('ADMIN');

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this match'
      });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        winnerId,
        scoreJson: scoreData ? JSON.stringify(scoreData) : match.scoreJson,
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });

    // TODO: Update tournament progression (advance winner to next round)
    // TODO: Update player statistics
    // TODO: Send notifications

    res.json({
      success: true,
      message: 'Match completed successfully',
      data: updatedMatch
    });
  } catch (error) {
    console.error('Error completing match:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete match',
      error: error.message
    });
  }
});

// Assign umpire to match
router.post('/:matchId/assign-umpire', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { umpireId } = req.body;
    const userId = req.user.userId;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: { organizerId: true }
        }
      }
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    // Check if user is organizer or admin
    const userRoles = req.user.roles || [];
    const isAuthorized = 
      match.tournament.organizerId === userId ||
      userRoles.includes('ADMIN');

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to assign umpire'
      });
    }

    // Verify umpire exists and has UMPIRE role
    const umpire = await prisma.user.findUnique({
      where: { id: umpireId }
    });

    if (!umpire || !umpire.roles.includes('UMPIRE')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid umpire selected'
      });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        umpireId,
        status: 'SCHEDULED',
        updatedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Umpire assigned successfully',
      data: updatedMatch
    });
  } catch (error) {
    console.error('Error assigning umpire:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign umpire',
      error: error.message
    });
  }
});

// Get tournament matches
router.get('/tournament/:tournamentId', authenticate, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { categoryId, round, status } = req.query;

    const where = {
      tournamentId
    };

    if (categoryId) where.categoryId = categoryId;
    if (round) where.round = parseInt(round);
    if (status) where.status = status;

    const matches = await prisma.match.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            format: true
          }
        },
        umpire: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' }
      ]
    });

    // Get player details for each match
    const matchesWithPlayers = await Promise.all(
      matches.map(async (match) => {
        const players = {};
        
        if (match.player1Id) {
          players.player1 = await prisma.user.findUnique({
            where: { id: match.player1Id },
            select: { id: true, name: true, email: true }
          });
        }
        
        if (match.player2Id) {
          players.player2 = await prisma.user.findUnique({
            where: { id: match.player2Id },
            select: { id: true, name: true, email: true }
          });
        }

        return {
          ...match,
          ...players,
          scoreData: match.scoreJson ? JSON.parse(match.scoreJson) : null
        };
      })
    );

    res.json({
      success: true,
      data: matchesWithPlayers
    });
  } catch (error) {
    console.error('Error fetching tournament matches:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament matches',
      error: error.message
    });
  }
});

// Get available umpires
router.get('/umpires/available', authenticate, async (req, res) => {
  try {
    const umpires = await prisma.user.findMany({
      where: {
        roles: {
          contains: 'UMPIRE'
        },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true
      }
    });

    // TODO: Check umpire availability based on scheduled matches
    const umpiresWithAvailability = umpires.map(umpire => ({
      ...umpire,
      isAvailable: true // Simplified for now
    }));

    res.json({
      success: true,
      data: umpiresWithAvailability
    });
  } catch (error) {
    console.error('Error fetching umpires:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch umpires',
      error: error.message
    });
  }
});

export default router;