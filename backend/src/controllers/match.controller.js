import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import matchService from '../services/match.service.js';

// Helper function to format duration in milliseconds to readable string
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  return `${minutes}m ${secs}s`;
};

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
        // Helper function to get player with partner info for doubles
        const getPlayerWithPartner = async (playerId, categoryFormat) => {
          if (!playerId) return null;
          
          const player = await prisma.user.findUnique({
            where: { id: playerId },
            select: { id: true, name: true, profilePhoto: true }
          });
          
          if (!player) return null;
          
          // If doubles category, find partner from registration
          if (categoryFormat === 'doubles') {
            const registration = await prisma.registration.findFirst({
              where: {
                categoryId: match.categoryId,
                userId: playerId,
                status: { in: ['confirmed', 'pending'] }
              },
              include: {
                partner: {
                  select: { id: true, name: true }
                }
              }
            });
            
            if (registration?.partner) {
              return {
                ...player,
                partnerName: registration.partner.name,
                partnerId: registration.partner.id
              };
            }
          }
          
          return player;
        };

        const player1 = await getPlayerWithPartner(match.player1Id, match.category.format);
        const player2 = await getPlayerWithPartner(match.player2Id, match.category.format);

        const winner = match.winnerId
          ? await prisma.user.findUnique({
              where: { id: match.winnerId },
              select: { id: true, name: true }
            })
          : null;

        const umpire = match.umpireId
          ? await prisma.user.findUnique({
              where: { id: match.umpireId },
              select: { id: true, name: true, email: true }
            })
          : null;

        return {
          id: match.id,
          round: match.round,
          matchNumber: match.matchNumber,
          stage: match.stage, // ADD THIS - needed for Round Robin vs Knockout detection
          courtNumber: match.courtNumber,
          categoryName: match.category.name,
          categoryFormat: match.category.format, // Add format to know if doubles
          player1: player1 || { name: 'TBD' },
          player2: player2 || { name: 'TBD' },
          player1Seed: match.player1Seed,
          player2Seed: match.player2Seed,
          status: match.status,
          score: match.scoreJson ? JSON.parse(match.scoreJson) : null,
          winner,
          winnerId: match.winnerId,
          umpire,
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
    const userId = req.user.userId || req.user.id;

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
    const userId = req.user.userId || req.user.id;

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
    const userId = req.user.userId || req.user.id;

    // Verify tournament exists and user is organizer or admin
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, organizerId: true, name: true }
    });

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    // Check if user is organizer or has ADMIN role
    const userRoles = req.user.roles || [];
    const isOrganizer = tournament.organizerId === userId;
    const isAdmin = userRoles.includes('ADMIN') || req.user.role === 'ADMIN';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Only the organizer or admin can create matches' });
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

/**
 * Give bye to a player (advance them to next round without playing)
 * POST /api/matches/:matchId/give-bye
 */
const giveBye = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('🎯 Give Bye - Match:', matchId, 'Winner:', winnerId);

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    // Check authorization
    const isOrganizer = match.tournament.organizerId === userId;
    const hasAdminRole = req.user.roles?.includes('admin') || req.user.role === 'ADMIN';

    if (!isOrganizer && !hasAdminRole) {
      return res.status(403).json({ success: false, error: 'Not authorized to give bye' });
    }

    // Validate that one player is missing
    if (match.player1Id && match.player2Id) {
      return res.status(400).json({ success: false, error: 'Both players are assigned. Cannot give bye.' });
    }

    // Validate winner is the assigned player
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return res.status(400).json({ success: false, error: 'Winner must be the assigned player' });
    }

    // Create a bye score
    const byeScore = {
      sets: [],
      winner: winnerId,
      isBye: true,
      completedAt: new Date().toISOString()
    };

    // Update match as completed with bye
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        winnerId,
        scoreJson: JSON.stringify(byeScore),
        completedAt: new Date()
      }
    });

    console.log('✅ Bye given to winner:', winnerId);

    // Check if this is the final match
    const isFinal = match.round === 1 && !match.parentMatchId;

    if (isFinal) {
      // Update category with winner (no runner-up for bye)
      await prisma.category.update({
        where: { id: match.categoryId },
        data: {
          winnerId: winnerId,
          status: 'completed'
        }
      });
      console.log(`Finals completed with bye! Winner: ${winnerId}`);
      
      // Award tournament points
      try {
        const tournamentPointsService = await import('../services/tournamentPoints.service.js');
        await tournamentPointsService.default.awardTournamentPoints(match.tournamentId, match.categoryId);
        console.log(`✅ Tournament points awarded for category ${match.categoryId}`);
      } catch (pointsError) {
        console.error('❌ Error awarding tournament points:', pointsError);
      }
    } else if (match.parentMatchId && match.winnerPosition) {
      // Knockout: Advance winner to next match
      const updateData = match.winnerPosition === 'player1'
        ? { player1Id: winnerId }
        : { player2Id: winnerId };
      
      // Check if parent match now has both players
      const parentMatch = await prisma.match.findUnique({
        where: { id: match.parentMatchId }
      });

      if (parentMatch) {
        const bothPlayersReady = 
          (match.winnerPosition === 'player1' && parentMatch.player2Id) ||
          (match.winnerPosition === 'player2' && parentMatch.player1Id);

        if (bothPlayersReady) {
          updateData.status = 'READY';
        }
      }
      
      await prisma.match.update({
        where: { id: match.parentMatchId },
        data: updateData
      });
      console.log(`Winner ${winnerId} advanced to next round via bye${updateData.status === 'READY' ? ' (match now READY)' : ' (waiting for opponent)'}`);
    }

    res.json({
      success: true,
      message: isFinal ? 'Finals completed with bye! Category winner recorded.' : 'Bye given successfully',
      match: { ...updatedMatch, score: byeScore },
      isFinal,
      categoryWinner: isFinal ? winnerId : null
    });
  } catch (error) {
    console.error('Give bye error:', error);
    res.status(500).json({ success: false, error: 'Failed to give bye' });
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
  createMatch,
  undoPoint,
  setMatchConfig,
  pauseMatchTimer,
  resumeMatchTimer,
  giveBye
};

/**
 * Start a match (set status to IN_PROGRESS)
 * PUT /api/matches/:matchId/start
 */
const startMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId || req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { 
        tournament: true,
        category: true
      }
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

    // Check if there's a pre-saved config from the umpire
    let pointsPerSet = 21;
    let maxSets = 3;
    let setsToWin = 2;
    let extension = true;

    // First check if config was pre-saved via setMatchConfig
    if (match.scoreJson) {
      try {
        const existingScore = JSON.parse(match.scoreJson);
        if (existingScore.matchConfig) {
          pointsPerSet = existingScore.matchConfig.pointsPerSet || 21;
          maxSets = existingScore.matchConfig.maxSets || 3;
          setsToWin = existingScore.matchConfig.setsToWin || Math.ceil(maxSets / 2);
          extension = existingScore.matchConfig.extension !== undefined ? existingScore.matchConfig.extension : true;
          console.log('Using pre-saved match config:', existingScore.matchConfig);
        }
      } catch (e) {
        // If parsing fails, use category defaults
      }
    }
    
    // If no pre-saved config, parse from category scoring format
    if (!match.scoreJson && match.category?.scoringFormat) {
      const scoringFormat = match.category.scoringFormat;
      
      // Try parsing "NxM" format (e.g., "21x3", "30x1")
      const nxmMatch = scoringFormat.match(/(\d+)x(\d+)/);
      if (nxmMatch) {
        pointsPerSet = parseInt(nxmMatch[1]);
        maxSets = parseInt(nxmMatch[2]);
        setsToWin = Math.ceil(maxSets / 2);
      } else {
        // Try parsing "N games to M pts" format (e.g., "1 games to 30 pts", "3 games to 21 pts")
        const gamesMatch = scoringFormat.match(/(\d+)\s*games?\s*to\s*(\d+)\s*pts?/i);
        if (gamesMatch) {
          maxSets = parseInt(gamesMatch[1]);
          pointsPerSet = parseInt(gamesMatch[2]);
          setsToWin = Math.ceil(maxSets / 2);
        }
      }
      
      // Check for no extension flag
      if (scoringFormat.toLowerCase().includes('noext') || 
          scoringFormat.toLowerCase().includes('no-ext') ||
          scoringFormat.toLowerCase().includes('no ext') ||
          scoringFormat.toLowerCase().includes('no extension')) {
        extension = false;
      }
    }

    console.log(`Match config: ${pointsPerSet} points, ${maxSets} sets, extension: ${extension}`);

    // Initialize score structure based on category settings
    const initialScore = {
      sets: [{ player1: 0, player2: 0 }],
      currentSet: 0,
      currentScore: { player1: 0, player2: 0 },
      currentServer: 'player1',
      history: [],
      matchConfig: {
        pointsPerSet,
        setsToWin,
        maxSets,
        extension
      },
      // Timer tracking
      timer: {
        startedAt: new Date().toISOString(),
        pausedAt: null,
        totalPausedTime: 0, // in milliseconds
        isPaused: false,
        pauseHistory: [] // Array of {pausedAt, resumedAt, duration}
      }
    };

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        scoreJson: JSON.stringify(initialScore),
        umpireId: match.umpireId || userId
      }
    });

    res.json({
      success: true,
      message: 'Match started',
      match: { ...updatedMatch, score: initialScore },
      matchConfig: initialScore.matchConfig,
      timer: initialScore.timer
    });
  } catch (error) {
    console.error('Start match error:', error);
    res.status(500).json({ success: false, error: 'Failed to start match' });
  }
};

/**
 * Update live score during match (add point)
 * PUT /api/matches/:matchId/score
 */
const updateLiveScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { player, score } = req.body;
    const userId = req.user.userId || req.user.id;

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

    if (match.status !== 'IN_PROGRESS' && match.status !== 'ONGOING') {
      return res.status(400).json({ success: false, error: 'Match is not in progress' });
    }

    // If player is provided, add a point using scoring logic
    if (player) {
      // Import scoring service functions
      const { addPoint } = await import('../services/scoringService.js');
      const result = await addPoint(matchId, player);
      
      return res.json({
        success: true,
        score: result.scoreData,
        matchComplete: result.matchComplete,
        winner: result.winner
      });
    }

    // If raw score is provided, update directly (for corrections)
    if (score) {
      const updatedMatch = await prisma.match.update({
        where: { id: matchId },
        data: { scoreJson: JSON.stringify(score) }
      });

      return res.json({
        success: true,
        match: { ...updatedMatch, score }
      });
    }

    return res.status(400).json({ success: false, error: 'Either player or score must be provided' });
  } catch (error) {
    console.error('Update live score error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update score' });
  }
};

/**
 * End match and declare winner
 * PUT /api/matches/:matchId/end
 */
/**
 * Update Round Robin group standings after match completion
 */
async function updateRoundRobinStandings(tournamentId, categoryId, matchId) {
  try {
    console.log('🔍 updateRoundRobinStandings called with:', { tournamentId, categoryId, matchId });
    
    // Get the current draw
    const draw = await prisma.draw.findUnique({
      where: { tournamentId_categoryId: { tournamentId, categoryId } }
    });

    if (!draw) {
      console.log('❌ No draw found in updateRoundRobinStandings');
      return;
    }

    let bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;
    
    console.log('🔍 Bracket format in updateRoundRobinStandings:', bracketJson.format);
    
    if (bracketJson.format !== 'ROUND_ROBIN' && bracketJson.format !== 'ROUND_ROBIN_KNOCKOUT') {
      console.log('❌ Not a Round Robin format, exiting');
      return;
    }

    // Get the completed match to find which players are involved
    const completedMatch = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!completedMatch) {
      console.log('❌ Completed match not found');
      return;
    }

    console.log('🔍 Completed match:', { player1Id: completedMatch.player1Id, player2Id: completedMatch.player2Id, winnerId: completedMatch.winnerId });

    // Find which group this match belongs to by checking player IDs
    let targetGroup = null;
    for (const group of bracketJson.groups) {
      const hasPlayer1 = group.participants.some(p => p.id === completedMatch.player1Id);
      const hasPlayer2 = group.participants.some(p => p.id === completedMatch.player2Id);
      if (hasPlayer1 && hasPlayer2) {
        targetGroup = group;
        break;
      }
    }

    if (!targetGroup) {
      console.log('❌ Target group not found for match players');
      return;
    }

    console.log('🔍 Target group found:', targetGroup.groupName);

    // Get all completed matches for this group (by checking if both players are in the group)
    const allMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        status: 'COMPLETED'
      }
    });

    // Filter matches that belong to this group
    const groupMatches = allMatches.filter(match => {
      const hasPlayer1 = targetGroup.participants.some(p => p.id === match.player1Id);
      const hasPlayer2 = targetGroup.participants.some(p => p.id === match.player2Id);
      return hasPlayer1 && hasPlayer2;
    });

    // Reset all participant stats
    targetGroup.participants.forEach(p => {
      p.played = 0;
      p.wins = 0;
      p.losses = 0;
      p.points = 0;
    });

    // Calculate new standings
    groupMatches.forEach(match => {
      const player1 = targetGroup.participants.find(p => p.id === match.player1Id);
      const player2 = targetGroup.participants.find(p => p.id === match.player2Id);

      if (player1 && player2) {
        player1.played++;
        player2.played++;

        if (match.winnerId === match.player1Id) {
          player1.wins++;
          player1.points += 2; // Win = 2 points
          player2.losses++;
        } else if (match.winnerId === match.player2Id) {
          player2.wins++;
          player2.points += 2; // Win = 2 points
          player1.losses++;
        }
      }
    });

    // Sort participants by points (descending), then by wins
    targetGroup.participants.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.wins - a.wins;
    });

    // Update the draw
    await prisma.draw.update({
      where: { tournamentId_categoryId: { tournamentId, categoryId } },
      data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() }
    });

    console.log(`✅ Updated standings for ${targetGroup.groupName}:`, targetGroup.participants.map(p => `${p.name}: ${p.points}pts (${p.wins}W-${p.losses}L)`));
  } catch (error) {
    console.error('❌ Error updating Round Robin standings:', error);
  }
}

const endMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, finalScore } = req.body;
    const userId = req.user.userId || req.user.id;

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

    // Get existing score data to preserve timer info
    let scoreData = match.scoreJson ? JSON.parse(match.scoreJson) : {};
    
    // Merge final score with existing data (preserve timer)
    const mergedScore = {
      ...scoreData,
      ...finalScore,
      matchConfig: scoreData.matchConfig || finalScore.matchConfig
    };

    // Finalize timer
    if (mergedScore.timer) {
      mergedScore.timer.endedAt = new Date().toISOString();
      mergedScore.timer.isPaused = false;
      
      // Calculate total match duration (excluding paused time)
      const startTime = new Date(mergedScore.timer.startedAt).getTime();
      const endTime = new Date().getTime();
      const totalTime = endTime - startTime;
      mergedScore.timer.totalDuration = totalTime - (mergedScore.timer.totalPausedTime || 0);
      mergedScore.timer.totalDurationFormatted = formatDuration(mergedScore.timer.totalDuration);
    }

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        winnerId,
        scoreJson: JSON.stringify(mergedScore),
        completedAt: new Date()
      }
    });

    // Update umpire statistics if an umpire was assigned
    if (match.umpireId) {
      try {
        // Increment matchesUmpired count
        const updatedUser = await prisma.user.update({
          where: { id: match.umpireId },
          data: {
            matchesUmpired: { increment: 1 }
          }
        });

        // Check if umpire should be verified (10+ matches)
        if (updatedUser.matchesUmpired >= 10 && !updatedUser.isVerifiedUmpire) {
          await prisma.user.update({
            where: { id: match.umpireId },
            data: { isVerifiedUmpire: true }
          });
          console.log(`✅ Umpire ${match.umpireId} verified after ${updatedUser.matchesUmpired} matches`);
        }

        console.log(`✅ Updated umpire stats: ${updatedUser.matchesUmpired} matches umpired`);
      } catch (umpireError) {
        console.error('❌ Error updating umpire statistics:', umpireError);
        // Don't fail the match completion if umpire stats update fails
      }
    }

    // Determine the loser
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    // Check if this is the final match (round 1 and no parent match)
    const isFinal = match.round === 1 && !match.parentMatchId;

    if (isFinal) {
      // Update category with winner and runner-up
      await prisma.category.update({
        where: { id: match.categoryId },
        data: {
          winnerId: winnerId,
          runnerUpId: loserId,
          status: 'completed'
        }
      });
      console.log(`Finals completed! Winner: ${winnerId}, Runner-up: ${loserId}`);
      
      // Award tournament points to all players
      try {
        const tournamentPointsService = await import('../services/tournamentPoints.service.js');
        await tournamentPointsService.default.awardTournamentPoints(match.tournamentId, match.categoryId);
        console.log(`✅ Tournament points awarded for category ${match.categoryId}`);
      } catch (pointsError) {
        console.error('❌ Error awarding tournament points:', pointsError);
        // Don't fail the match completion if points awarding fails
      }
    } else if (match.parentMatchId && match.winnerPosition) {
      // Knockout: Update bracket - advance winner to next match
      const updateData = match.winnerPosition === 'player1'
        ? { player1Id: winnerId }
        : { player2Id: winnerId };
      
      // Check if parent match now has both players
      const parentMatch = await prisma.match.findUnique({
        where: { id: match.parentMatchId }
      });

      if (parentMatch) {
        // Check if both players are now assigned
        const bothPlayersReady = 
          (match.winnerPosition === 'player1' && parentMatch.player2Id) ||
          (match.winnerPosition === 'player2' && parentMatch.player1Id);

        if (bothPlayersReady) {
          updateData.status = 'READY'; // Both players assigned, match ready to start
        }
      }
      
      await prisma.match.update({
        where: { id: match.parentMatchId },
        data: updateData
      });
      console.log(`Winner ${winnerId} advanced to next round${updateData.status === 'READY' ? ' (match now READY)' : ' (waiting for opponent)'}`);
    }

    // Check if this is a Round Robin match and update standings
    console.log('🔍 Checking if Round Robin match...');
    const draw = await prisma.draw.findUnique({
      where: { tournamentId_categoryId: { tournamentId: match.tournamentId, categoryId: match.categoryId } }
    });
    
    console.log('🔍 Draw found:', !!draw);
    if (draw) {
      const bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;
      console.log('🔍 Bracket format:', bracketJson.format);
      if (bracketJson.format === 'ROUND_ROBIN' || bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
        // This is a Round Robin match, update standings
        console.log('🔍 Calling updateRoundRobinStandings...');
        await updateRoundRobinStandings(match.tournamentId, match.categoryId, matchId);
        console.log(`✅ Round Robin match completed. Standings updated.`);
      } else {
        console.log('🔍 Not a Round Robin format, skipping standings update');
      }
    } else {
      console.log('🔍 No draw found, skipping standings update');
    }

    res.json({
      success: true,
      message: isFinal ? 'Finals completed! Category winner recorded.' : 'Match completed',
      match: { ...updatedMatch, score: mergedScore },
      isFinal,
      categoryWinner: isFinal ? winnerId : null
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
    const userId = req.user.userId || req.user.id;

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
    const userId = req.user.userId || req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { 
        tournament: true,
        category: true
      }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    // Only organizer can assign umpires
    if (match.tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only organizer can assign umpires' });
    }

    // Get umpire details
    const umpire = await prisma.user.findUnique({
      where: { id: umpireId },
      select: { id: true, name: true, email: true }
    });

    if (!umpire) {
      return res.status(404).json({ success: false, error: 'Umpire not found' });
    }

    // Get player names for notification
    const player1 = match.player1Id
      ? await prisma.user.findUnique({
          where: { id: match.player1Id },
          select: { name: true }
        })
      : null;

    const player2 = match.player2Id
      ? await prisma.user.findUnique({
          where: { id: match.player2Id },
          select: { name: true }
        })
      : null;

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { umpireId }
    });

    // Determine round name
    const roundNames = {
      1: 'Finals',
      2: 'Semi Finals',
      3: 'Quarter Finals',
      4: 'Round of 16',
      5: 'Round of 32'
    };
    const roundName = roundNames[match.round] || `Round ${match.round}`;

    // Send notification to umpire
    console.log('📧 Sending notification to umpire:', umpire.name, umpire.email);
    
    const notificationService = await import('../services/notificationService.js');
    const matchDetails = `${roundName} - Match #${match.matchNumber}`;
    const playersInfo = player1 && player2 
      ? `${player1.name} vs ${player2.name}` 
      : 'Players TBD';
    
    // Build clean message with only relevant details
    let message = `You have been assigned as umpire for ${matchDetails}\n\n`;
    message += `Players: ${playersInfo}\n`;
    message += `Tournament: ${match.tournament.name}\n`;
    message += `Category: ${match.category.name}`;
    
    // Only add court if assigned
    if (match.courtNumber) {
      message += `\nCourt: ${match.courtNumber}`;
    }

    console.log('📧 Notification message:', message);
    console.log('📧 Notification data:', {
      matchId: match.id,
      tournamentId: match.tournamentId,
      categoryId: match.categoryId,
      matchNumber: match.matchNumber,
      round: match.round,
      roundName,
      courtNumber: match.courtNumber,
      player1Name: player1?.name || 'TBD',
      player2Name: player2?.name || 'TBD',
      matchDetails
    });

    try {
      await notificationService.default.createNotification({
        userId: umpireId,
        type: 'MATCH_ASSIGNED',
        title: '⚖️ Match Assignment',
        message: message,
        data: {
          matchId: match.id,
          tournamentId: match.tournamentId,
          categoryId: match.categoryId,
          matchNumber: match.matchNumber,
          round: match.round,
          roundName,
          courtNumber: match.courtNumber,
          player1Name: player1?.name || 'TBD',
          player2Name: player2?.name || 'TBD',
          matchDetails
        },
        sendEmail: true
      });
      
      console.log(`✅ Notification sent successfully to ${umpire.name}`);
    } catch (notifError) {
      console.error('❌ Error sending notification:', notifError);
      // Don't fail the whole request if notification fails
    }

    console.log(`✅ Umpire ${umpire.name} assigned to ${matchDetails} and notified`);

    res.json({ 
      success: true, 
      message: 'Umpire assigned and notified', 
      match: updatedMatch 
    });
  } catch (error) {
    console.error('Assign umpire error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign umpire' });
  }
};

/**
 * Undo last point
 * PUT /api/matches/:matchId/undo
 */
const undoPoint = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId || req.user.id;

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
      return res.status(403).json({ success: false, error: 'Not authorized to undo points' });
    }

    if (!match.scoreJson) {
      return res.status(400).json({ success: false, error: 'No score to undo' });
    }

    let scoreData = JSON.parse(match.scoreJson);
    const matchConfig = scoreData.matchConfig || {
      pointsPerSet: 21,
      setsToWin: 2,
      maxSets: 3,
      extension: true
    };

    if (!scoreData.history || scoreData.history.length === 0) {
      return res.status(400).json({ success: false, error: 'No history to undo' });
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
    } else {
      scoreData.currentScore = { player1: 0, player2: 0 };
    }

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreJson: JSON.stringify(scoreData),
        status: 'IN_PROGRESS', // In case match was completed
        winnerId: null,
        completedAt: null
      }
    });

    res.json({
      success: true,
      message: 'Point undone',
      score: scoreData
    });
  } catch (error) {
    console.error('Undo point error:', error);
    res.status(500).json({ success: false, error: 'Failed to undo point' });
  }
};

/**
 * Set match scoring configuration
 * PUT /api/matches/:matchId/config
 */
const setMatchConfig = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { pointsPerSet, maxSets, setsToWin, extension } = req.body;
    const userId = req.user.userId || req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: true }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    // Check authorization - organizer or umpire can set config
    const isOrganizer = match.tournament.organizerId === userId;
    const isAssignedUmpire = match.umpireId === userId;
    const hasUmpireRole = req.user.roles?.includes('umpire') || req.user.role === 'UMPIRE';

    if (!isOrganizer && !isAssignedUmpire && !hasUmpireRole) {
      return res.status(403).json({ success: false, error: 'Not authorized to set match config' });
    }

    // Only allow config change before match starts (case-insensitive check)
    const status = match.status?.toUpperCase();
    if (status !== 'PENDING' && status !== 'READY' && status !== 'SCHEDULED') {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot change config after match has started',
        currentStatus: match.status
      });
    }

    // Build the match config
    const matchConfig = {
      pointsPerSet: pointsPerSet || 21,
      maxSets: maxSets || 3,
      setsToWin: setsToWin || Math.ceil((maxSets || 3) / 2),
      extension: extension !== undefined ? extension : true
    };

    // Store config in scoreJson as initial config
    const initialScore = {
      sets: [],
      currentSet: 0,
      currentScore: { player1: 0, player2: 0 },
      currentServer: 'player1',
      history: [],
      matchConfig
    };

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreJson: JSON.stringify(initialScore)
      }
    });

    console.log(`✅ Match config saved for match ${matchId}:`, matchConfig);

    res.json({
      success: true,
      message: 'Match config saved',
      matchConfig
    });
  } catch (error) {
    console.error('Set match config error:', error);
    res.status(500).json({ success: false, error: 'Failed to set match config' });
  }
};

/**
 * Pause match timer
 * PUT /api/matches/:matchId/timer/pause
 */
const pauseMatchTimer = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId || req.user.id;

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
      return res.status(403).json({ success: false, error: 'Not authorized to pause timer' });
    }

    if (match.status !== 'IN_PROGRESS' && match.status !== 'ONGOING') {
      return res.status(400).json({ success: false, error: 'Match is not in progress' });
    }

    let scoreData = match.scoreJson ? JSON.parse(match.scoreJson) : {};
    
    // Initialize timer if not exists
    if (!scoreData.timer) {
      scoreData.timer = {
        startedAt: match.startedAt?.toISOString() || new Date().toISOString(),
        pausedAt: null,
        totalPausedTime: 0,
        isPaused: false,
        pauseHistory: []
      };
    }

    if (scoreData.timer.isPaused) {
      return res.status(400).json({ success: false, error: 'Timer is already paused' });
    }

    // Pause the timer
    scoreData.timer.pausedAt = new Date().toISOString();
    scoreData.timer.isPaused = true;

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { scoreJson: JSON.stringify(scoreData) }
    });

    res.json({
      success: true,
      message: 'Timer paused',
      timer: scoreData.timer
    });
  } catch (error) {
    console.error('Pause timer error:', error);
    res.status(500).json({ success: false, error: 'Failed to pause timer' });
  }
};

/**
 * Resume match timer
 * PUT /api/matches/:matchId/timer/resume
 */
const resumeMatchTimer = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId || req.user.id;

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
      return res.status(403).json({ success: false, error: 'Not authorized to resume timer' });
    }

    if (match.status !== 'IN_PROGRESS' && match.status !== 'ONGOING') {
      return res.status(400).json({ success: false, error: 'Match is not in progress' });
    }

    let scoreData = match.scoreJson ? JSON.parse(match.scoreJson) : {};

    if (!scoreData.timer || !scoreData.timer.isPaused) {
      return res.status(400).json({ success: false, error: 'Timer is not paused' });
    }

    // Calculate pause duration
    const pausedAt = new Date(scoreData.timer.pausedAt);
    const resumedAt = new Date();
    const pauseDuration = resumedAt.getTime() - pausedAt.getTime();

    // Add to pause history
    scoreData.timer.pauseHistory.push({
      pausedAt: scoreData.timer.pausedAt,
      resumedAt: resumedAt.toISOString(),
      duration: pauseDuration
    });

    // Update total paused time
    scoreData.timer.totalPausedTime += pauseDuration;
    scoreData.timer.pausedAt = null;
    scoreData.timer.isPaused = false;

    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { scoreJson: JSON.stringify(scoreData) }
    });

    res.json({
      success: true,
      message: 'Timer resumed',
      timer: scoreData.timer
    });
  } catch (error) {
    console.error('Resume timer error:', error);
    res.status(500).json({ success: false, error: 'Failed to resume timer' });
  }
};
