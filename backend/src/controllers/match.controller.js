import { PrismaClient } from '@prisma/client';
import matchService from '../services/match.service.js';

const prisma = new PrismaClient();

/**
 * Get all matches for a tournament category
 * GET /api/tournaments/:tournamentId/categories/:categoryId/matches
 */
const getMatches = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const { status, round } = req.query; // Optional filters

    // Build where clause
    const whereClause = {
      tournamentId,
      categoryId
    };

    if (status) {
      whereClause.status = status;
    }

    if (round) {
      whereClause.round = parseInt(round);
    }

    // Fetch matches with player details
    const matches = await prisma.match.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            name: true,
            format: true
          }
        }
      },
      orderBy: [
        { round: 'asc' }, // Finals (1) first
        { matchNumber: 'asc' }
      ]
    });

    // Get player details for each match
    const matchesWithPlayers = await Promise.all(
      matches.map(async (match) => {
        const player1 = match.player1Id
          ? await prisma.user.findUnique({
              where: { id: match.player1Id },
              select: { id: true, name: true, profilePhoto: true }
            })
          : null;

        const player2 = match.player2Id
          ? await prisma.user.findUnique({
              where: { id: match.player2Id },
              select: { id: true, name: true, profilePhoto: true }
            })
          : null;

        const winner = match.winnerId
          ? await prisma.user.findUnique({
              where: { id: match.winnerId },
              select: { id: true, name: true }
            })
          : null;

        return {
          id: match.id,
          round: match.round,
          matchNumber: match.matchNumber,
          courtNumber: match.courtNumber,
          categoryName: match.category.name,
          player1: player1 || { name: 'TBD' },
          player2: player2 || { name: 'TBD' },
          player1Seed: match.player1Seed,
          player2Seed: match.player2Seed,
          status: match.status,
          score: match.scoreJson ? JSON.parse(match.scoreJson) : null,
          winner,
          startedAt: match.startedAt,
          completedAt: match.completedAt
        };
      })
    );

    // Group matches by round
    const matchesByRound = {};
    matchesWithPlayers.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    res.json({
      success: true,
      totalMatches: matchesWithPlayers.length,
      matchesByRound,
      matches: matchesWithPlayers
    });
   
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch matches' 
    });
  }
};

/**
 * Get single match details
 * GET /api/matches/:matchId
 */
const getMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await matchService.getMatchById(matchId);

    if (!match) {
      return res.status(404).json({ 
        success: false,
        error: 'Match not found' 
      });
    }

    res.json({
      success: true,
      match
    });
   
  } catch (error) {
    console.error('Get match error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch match' 
    });
  }
};

/**
 * Update match result
 * PUT /api/matches/:matchId/result
 */
const updateMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, scoreJson } = req.body;
    const userId = req.user.id;

    // Verify user is organizer or umpire
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

    // Check authorization
    const isOrganizer = match.tournament.organizerId === userId;
    const isUmpire = req.user.role === 'UMPIRE';
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOrganizer && !isUmpire && !isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to update match results' 
      });
    }

    // Validate winner is one of the participants
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return res.status(400).json({ 
        success: false,
        error: 'Winner must be one of the match participants' 
      });
    }

    // Update match result
    const updatedMatch = await matchService.updateMatchResult(matchId, winnerId, scoreJson);

    res.json({
      success: true,
      message: 'Match result updated successfully',
      match: updatedMatch
    });
   
  } catch (error) {
    console.error('Update match result error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to update match result',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Assign court to match
 * PUT /api/matches/:matchId/court
 */
const assignCourt = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { courtNumber } = req.body;
    const userId = req.user.id;

    // Verify user is organizer
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

    if (match.tournament.organizerId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false,
        error: 'Not authorized to assign courts' 
      });
    }

    // Update court assignment
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { courtNumber }
    });

    res.json({
      success: true,
      message: 'Court assigned successfully',
      match: updatedMatch
    });
   
  } catch (error) {
    console.error('Assign court error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to assign court' 
    });
  }
};

/**
 * Get bracket structure for a category
 * GET /api/tournaments/:tournamentId/categories/:categoryId/bracket
 */
const getBracket = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        tournament: {
          select: { name: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }

    // Check if matches exist (draw generated)
    const matchCount = await prisma.match.count({
      where: {
        tournamentId,
        categoryId
      }
    });

    if (matchCount === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Draw not generated yet',
        message: 'The organizer has not generated the draw for this category yet.'
      });
    }

    // Fetch all matches
    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId
      },
      orderBy: [
        { round: 'desc' }, // Highest round number first (earliest round)
        { matchNumber: 'asc' }
      ]
    });

    // Get player details for each match
    const matchesWithPlayers = await Promise.all(
      matches.map(async (match) => {
        const player1 = match.player1Id
          ? await prisma.user.findUnique({
              where: { id: match.player1Id },
              select: { id: true, name: true, profilePhoto: true }
            })
          : null;

        const player2 = match.player2Id
          ? await prisma.user.findUnique({
              where: { id: match.player2Id },
              select: { id: true, name: true, profilePhoto: true }
            })
          : null;

        const winner = match.winnerId
          ? await prisma.user.findUnique({
              where: { id: match.winnerId },
              select: { id: true, name: true }
            })
          : null;

        return {
          id: match.id,
          matchNumber: match.matchNumber,
          courtNumber: match.courtNumber,
          round: match.round,
          player1: player1 ? {
            id: player1.id,
            name: player1.name,
            photo: player1.profilePhoto,
            seed: match.player1Seed
          } : { name: 'BYE' },
          player2: player2 ? {
            id: player2.id,
            name: player2.name,
            photo: player2.profilePhoto,
            seed: match.player2Seed
          } : { name: 'BYE' },
          status: match.status,
          score: match.scoreJson ? JSON.parse(match.scoreJson) : null,
          winner,
          parentMatchId: match.parentMatchId,
          winnerPosition: match.winnerPosition
        };
      })
    );

    // Organize matches by round with round names
    const roundNames = {
      1: 'Final',
      2: 'Semi-Final',
      3: 'Quarter-Final',
      4: 'Round of 16',
      5: 'Round of 32',
      6: 'Round of 64'
    };

    const rounds = {};
    matchesWithPlayers.forEach(match => {
      const roundName = roundNames[match.round] || `Round ${match.round}`;
      if (!rounds[roundName]) {
        rounds[roundName] = [];
      }
      rounds[roundName].push(match);
    });

    res.json({
      success: true,
      bracket: {
        categoryName: category.name,
        format: category.format,
        tournamentName: category.tournament.name,
        rounds
      }
    });
   
  } catch (error) {
    console.error('Get bracket error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch bracket' 
    });
  }
};

/**
 * Create a match for a tournament category
 * POST /api/tournaments/:tournamentId/categories/:categoryId/matches
 */
const createMatch = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const { matchNumber, round, player1Id, player2Id } = req.body;
    const userId = req.user.id;

    // Verify tournament exists and user is organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, organizerId: true, name: true }
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only the organizer can create matches' });
    }

    // Check if match already exists
    const existingMatch = await prisma.match.findFirst({
      where: {
        tournamentId,
        categoryId,
        matchNumber: parseInt(matchNumber),
        round: parseInt(round)
      }
    });

    if (existingMatch) {
      // Return existing match
      const player1 = existingMatch.player1Id
        ? await prisma.user.findUnique({ where: { id: existingMatch.player1Id }, select: { id: true, name: true } })
        : null;
      const player2 = existingMatch.player2Id
        ? await prisma.user.findUnique({ where: { id: existingMatch.player2Id }, select: { id: true, name: true } })
        : null;
      const umpire = existingMatch.umpireId
        ? await prisma.user.findUnique({ where: { id: existingMatch.umpireId }, select: { id: true, name: true, email: true } })
        : null;

      return res.json({
        success: true,
        match: {
          ...existingMatch,
          player1,
          player2,
          umpire
        },
        created: false
      });
    }

    // Create new match
    const match = await prisma.match.create({
      data: {
        tournamentId,
        categoryId,
        matchNumber: parseInt(matchNumber),
        round: parseInt(round),
        player1Id: player1Id || null,
        player2Id: player2Id || null,
        status: 'PENDING'
      }
    });

    // Get player details
    const player1 = match.player1Id
      ? await prisma.user.findUnique({ where: { id: match.player1Id }, select: { id: true, name: true } })
      : null;
    const player2 = match.player2Id
      ? await prisma.user.findUnique({ where: { id: match.player2Id }, select: { id: true, name: true } })
      : null;

    res.status(201).json({
      success: true,
      match: {
        ...match,
        player1,
        player2,
        umpire: null
      },
      created: true
    });

  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({ success: false, error: 'Failed to create match' });
  }
};

export {
  getMatches,
  getMatch,
  updateMatchResult,
  assignCourt,
  getBracket,
  startMatch,
  updateLiveScore,
  endMatch,
  getUmpireMatches,
  assignUmpire,
  createMatch
};

/**
 * Start a match (set status to IN_PROGRESS)
 * PUT /api/matches/:matchId/start
 */
const startMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    // Check authorization (organizer, assigned umpire, or any umpire role)
    const isOrganizer = match.tournament.organizerId === userId;
    const isAssignedUmpire = match.umpireId === userId;
    const hasUmpireRole = req.user.roles?.includes('umpire') || req.user.role === 'UMPIRE';

    if (!isOrganizer && !isAssignedUmpire && !hasUmpireRole) {
      return res.status(403).json({ success: false, error: 'Not authorized to start this match' });
    }

    // Initialize score structure for badminton (best of 3 sets, 21 points each)
    const initialScore = {
      sets: [{ player1: 0, player2: 0 }],
      currentSet: 0,
      matchConfig: {
        pointsPerSet: 21,
        setsToWin: 2,
        maxSets: 3
      }
    };

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        scoreJson: JSON.stringify(initialScore),
        umpireId: match.umpireId || userId // Assign current user as umpire if not assigned
      }
    });

    res.json({
      success: true,
      message: 'Match started',
      match: { ...updatedMatch, score: initialScore }
    });
  } catch (error) {
    console.error('Start match error:', error);
    res.status(500).json({ success: false, error: 'Failed to start match' });
  }
};

/**
 * Update live score during match
 * PUT /api/matches/:matchId/score
 */
const updateLiveScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { score } = req.body;
    const userId = req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    // Check authorization
    const isOrganizer = match.tournament.organizerId === userId;
    const isAssignedUmpire = match.umpireId === userId;
    const hasUmpireRole = req.user.roles?.includes('umpire') || req.user.role === 'UMPIRE';

    if (!isOrganizer && !isAssignedUmpire && !hasUmpireRole) {
      return res.status(403).json({ success: false, error: 'Not authorized to update score' });
    }

    if (match.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, error: 'Match is not in progress' });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { scoreJson: JSON.stringify(score) }
    });

    res.json({
      success: true,
      match: { ...updatedMatch, score }
    });
  } catch (error) {
    console.error('Update live score error:', error);
    res.status(500).json({ success: false, error: 'Failed to update score' });
  }
};

/**
 * End match and declare winner
 * PUT /api/matches/:matchId/end
 */
const endMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, finalScore } = req.body;
    const userId = req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    // Check authorization
    const isOrganizer = match.tournament.organizerId === userId;
    const isAssignedUmpire = match.umpireId === userId;
    const hasUmpireRole = req.user.roles?.includes('umpire') || req.user.role === 'UMPIRE';

    if (!isOrganizer && !isAssignedUmpire && !hasUmpireRole) {
      return res.status(403).json({ success: false, error: 'Not authorized to end this match' });
    }

    // Validate winner
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return res.status(400).json({ success: false, error: 'Winner must be a match participant' });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        winnerId,
        scoreJson: JSON.stringify(finalScore),
        completedAt: new Date()
      }
    });

    // Update bracket - advance winner to next match
    if (match.parentMatchId && match.winnerPosition) {
      const updateData = match.winnerPosition === 'player1'
        ? { player1Id: winnerId }
        : { player2Id: winnerId };
      
      await prisma.match.update({
        where: { id: match.parentMatchId },
        data: updateData
      });
    }

    res.json({
      success: true,
      message: 'Match completed',
      match: { ...updatedMatch, score: finalScore }
    });
  } catch (error) {
    console.error('End match error:', error);
    res.status(500).json({ success: false, error: 'Failed to end match' });
  }
};

/**
 * Get matches assigned to umpire
 * GET /api/umpire/matches
 */
const getUmpireMatches = async (req, res) => {
  try {
    const userId = req.user.id;

    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { umpireId: userId },
          { status: 'PENDING' } // Show all pending matches for umpires to pick
        ]
      },
      include: {
        tournament: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } }
      },
      orderBy: [{ status: 'asc' }, { scheduledTime: 'asc' }]
    });

    // Get player details
    const matchesWithPlayers = await Promise.all(
      matches.map(async (match) => {
        const player1 = match.player1Id
          ? await prisma.user.findUnique({
              where: { id: match.player1Id },
              select: { id: true, name: true }
            })
          : null;
        const player2 = match.player2Id
          ? await prisma.user.findUnique({
              where: { id: match.player2Id },
              select: { id: true, name: true }
            })
          : null;

        return {
          ...match,
          player1: player1 || { name: 'TBD' },
          player2: player2 || { name: 'TBD' },
          score: match.scoreJson ? JSON.parse(match.scoreJson) : null
        };
      })
    );

    res.json({ success: true, matches: matchesWithPlayers });
  } catch (error) {
    console.error('Get umpire matches error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch matches' });
  }
};

/**
 * Assign umpire to match
 * PUT /api/matches/:matchId/umpire
 */
const assignUmpire = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { umpireId } = req.body;
    const userId = req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    // Only organizer can assign umpires
    if (match.tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only organizer can assign umpires' });
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { umpireId }
    });

    res.json({ success: true, message: 'Umpire assigned', match: updatedMatch });
  } catch (error) {
    console.error('Assign umpire error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign umpire' });
  }
};
