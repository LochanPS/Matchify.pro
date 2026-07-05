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

    // ── Batch all player/umpire lookups — one query per entity type, not N per match ──
    const regularPlayerIds = new Set();
    const guestRegistrationIds = new Set();
    const umpireIds = new Set();

    for (const match of matches) {
      for (const id of [match.player1Id, match.player2Id, match.winnerId]) {
        if (!id) continue;
        if (id.startsWith('guest-')) guestRegistrationIds.add(id.replace('guest-', ''));
        else regularPlayerIds.add(id);
      }
      if (match.umpireId) umpireIds.add(match.umpireId);
    }

    const isDoubles = matches[0]?.category?.format === 'doubles';

    const [usersRaw, guestRegsRaw, umpiresRaw, partnerRegsRaw] = await Promise.all([
      regularPlayerIds.size > 0
        ? prisma.user.findMany({ where: { id: { in: [...regularPlayerIds] } }, select: { id: true, name: true, profilePhoto: true } })
        : [],
      guestRegistrationIds.size > 0
        ? prisma.registration.findMany({ where: { id: { in: [...guestRegistrationIds] } }, select: { id: true, guestName: true } })
        : [],
      umpireIds.size > 0
        ? prisma.user.findMany({ where: { id: { in: [...umpireIds] } }, select: { id: true, name: true, email: true } })
        : [],
      isDoubles && regularPlayerIds.size > 0
        ? prisma.registration.findMany({
            where: { categoryId: matches[0].categoryId, userId: { in: [...regularPlayerIds] }, status: { in: ['confirmed', 'pending'] } },
            include: { partner: { select: { id: true, name: true } } }
          })
        : [],
    ]);

    // Build lookup maps
    const userMap    = Object.fromEntries(usersRaw.map(u => [u.id, u]));
    const guestMap   = Object.fromEntries(guestRegsRaw.map(r => [`guest-${r.id}`, { id: `guest-${r.id}`, name: r.guestName || 'Unknown', profilePhoto: null, isGuest: true }]));
    const umpireMap  = Object.fromEntries(umpiresRaw.map(u => [u.id, u]));
    const partnerMap = Object.fromEntries(partnerRegsRaw.filter(r => r.partner).map(r => [r.userId, r.partner]));

    const resolvePlayer = (id) => {
      if (!id) return null;
      if (id.startsWith('guest-')) return guestMap[id] || null;
      const u = userMap[id];
      if (!u) return null;
      const partner = partnerMap[id];
      return partner ? { ...u, partnerName: partner.name, partnerId: partner.id } : u;
    };

    const matchesWithPlayers = matches.map(match => ({
      id:             match.id,
      round:          match.round,
      matchNumber:    match.matchNumber,
      stage:          match.stage,
      courtNumber:    match.courtNumber,
      categoryName:   match.category.name,
      categoryFormat: match.category.format,
      player1:        resolvePlayer(match.player1Id) || { name: 'TBD' },
      player2:        resolvePlayer(match.player2Id) || { name: 'TBD' },
      player1Seed:    match.player1Seed,
      player2Seed:    match.player2Seed,
      status:         match.status,
      score:          match.scoreJson ? JSON.parse(match.scoreJson) : null,
      winner:         match.winnerId ? (userMap[match.winnerId] || null) : null,
      winnerId:       match.winnerId,
      umpire:         match.umpireId ? (umpireMap[match.umpireId] || null) : null,
      startedAt:      match.startedAt,
      completedAt:    match.completedAt,
    }));

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
    const userRoles = req.user.roles || [];
    const isUmpire = userRoles.includes('UMPIRE') || req.user.role === 'UMPIRE';
    const isAdmin  = userRoles.includes('ADMIN')  || req.user.role === 'ADMIN';

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

    if (!winnerId) {
      return res.status(400).json({ success: false, error: 'winnerId is required' });
    }

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

    // Check if this is the final match (not a group stage match)
    const isFinal = match.round === 1 && !match.parentMatchId && match.stage !== 'GROUP';

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
    } else if (!match.parentMatchId && match.stage === 'KNOCKOUT' && match.round > 1) {
      // Fallback advancement for bye: parentMatchId not set — use bracket math
      const nextRound = match.round - 1;
      const nextMatchNumber = Math.ceil(match.matchNumber / 2);
      const winnerPos = match.matchNumber % 2 === 1 ? 'player1' : 'player2';

      const parentMatch = await prisma.match.findFirst({
        where: {
          tournamentId: match.tournamentId,
          categoryId:   match.categoryId,
          round:        nextRound,
          matchNumber:  nextMatchNumber,
          stage:        'KNOCKOUT'
        }
      });

      if (parentMatch) {
        const updateData = winnerPos === 'player1'
          ? { player1Id: winnerId }
          : { player2Id: winnerId };
        const bothPlayersReady = winnerPos === 'player1' ? !!parentMatch.player2Id : !!parentMatch.player1Id;
        if (bothPlayersReady) updateData.status = 'READY';
        await prisma.match.update({ where: { id: parentMatch.id }, data: updateData });
        console.log(`Bye winner ${winnerId} advanced via fallback to round ${nextRound} match ${nextMatchNumber}`);
      }
    }

    // Invalidate the draw-page cache so the new BYE state shows immediately
    // (the organiser's own refetch already bypasses the cache; this is for other viewers).
    try {
      const { cacheDel } = await import('../services/redisService.js');
      const { getDrawPageCacheKey } = await import('./drawPage.controller.js');
      await cacheDel(getDrawPageCacheKey(match.tournamentId, match.categoryId));
    } catch { /* non-fatal */ }

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
  saveUmpireQueue,
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
      p.totalPoints = 0;
      p.totalPointsAgainst = 0;
    });

    // Calculate new standings
    groupMatches.forEach(match => {
      const player1 = targetGroup.participants.find(p => p.id === match.player1Id);
      const player2 = targetGroup.participants.find(p => p.id === match.player2Id);

      if (player1 && player2) {
        player1.played++;
        player2.played++;

        // Parse shuttle points for tiebreaking
        if (match.scoreJson) {
          try {
            const sd = typeof match.scoreJson === 'string' ? JSON.parse(match.scoreJson) : match.scoreJson;
            if (sd?.sets && Array.isArray(sd.sets)) {
              let t1 = 0, t2 = 0;
              sd.sets.forEach(s => {
                t1 += s.player1 ?? s.p1 ?? s.score1 ?? 0;
                t2 += s.player2 ?? s.p2 ?? s.score2 ?? 0;
              });
              player1.totalPoints = (player1.totalPoints || 0) + t1;
              player2.totalPoints = (player2.totalPoints || 0) + t2;
              player1.totalPointsAgainst = (player1.totalPointsAgainst || 0) + t2;
              player2.totalPointsAgainst = (player2.totalPointsAgainst || 0) + t1;
            }
          } catch (_) {}
        }

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

    // Sort: match points DESC → total points FOR (TP) DESC → net point diff (PD) DESC
    targetGroup.participants.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aTp = a.totalPoints || 0, bTp = b.totalPoints || 0;
      if (bTp !== aTp) return bTp - aTp;
      const aDiff = (a.totalPoints || 0) - (a.totalPointsAgainst || 0);
      const bDiff = (b.totalPoints || 0) - (b.totalPointsAgainst || 0);
      return bDiff - aDiff;
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
        // Use verification service to increment and check
        const { incrementMatchesUmpired } = await import('../services/verification.service.js');
        await incrementMatchesUmpired(match.umpireId);
        
        console.log(`✅ Updated umpire stats and checked verification`);
      } catch (umpireError) {
        console.error('❌ Error updating umpire statistics:', umpireError);
        // Don't fail the match completion if umpire stats update fails
      }
    }

    // Determine the loser
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    // Check if this is the final match (round 1, no parent match, not group stage)
    const isFinal = match.round === 1 && !match.parentMatchId && match.stage !== 'GROUP';

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
      // Knockout: Update bracket - advance winner to next match (parentMatchId set)
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
    } else if (!match.parentMatchId && match.stage === 'KNOCKOUT' && match.round > 1) {
      // Fallback advancement: parentMatchId not set (draw created without linking).
      // Use standard bracket math: parent = ceil(matchNumber/2), position = odd→player1, even→player2
      const nextRound = match.round - 1;
      const nextMatchNumber = Math.ceil(match.matchNumber / 2);
      const winnerPos = match.matchNumber % 2 === 1 ? 'player1' : 'player2';

      const parentMatch = await prisma.match.findFirst({
        where: {
          tournamentId: match.tournamentId,
          categoryId:   match.categoryId,
          round:        nextRound,
          matchNumber:  nextMatchNumber,
          stage:        'KNOCKOUT'
        }
      });

      if (parentMatch) {
        const updateData = winnerPos === 'player1'
          ? { player1Id: winnerId }
          : { player2Id: winnerId };

        const bothPlayersReady =
          winnerPos === 'player1' ? !!parentMatch.player2Id : !!parentMatch.player1Id;
        if (bothPlayersReady) updateData.status = 'READY';

        await prisma.match.update({ where: { id: parentMatch.id }, data: updateData });
        console.log(`Winner ${winnerId} advanced to round ${nextRound} match ${nextMatchNumber} (${winnerPos}) via fallback round/matchNumber logic`);
      }
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

        // For PURE ROUND_ROBIN: if this is the last GROUP match, close the category
        // (ROUND_ROBIN_KNOCKOUT hybrid is handled when the KO final completes)
        if (bracketJson.format === 'ROUND_ROBIN' && match.stage === 'GROUP') {
          const remainingCount = await prisma.match.count({
            where: {
              categoryId: match.categoryId,
              id: { not: matchId },
              status: { notIn: ['COMPLETED', 'BYE'] }
            }
          });

          if (remainingCount === 0) {
            // All group matches done — determine winner from final standings
            const allMatches = await prisma.match.findMany({
              where: { categoryId: match.categoryId },
              select: { player1Id: true, player2Id: true, winnerId: true }
            });

            const isGuestId = (id) => !id || id.startsWith('guest-');
            const standings = {};
            allMatches.forEach(m => {
              [m.player1Id, m.player2Id].forEach(pid => {
                if (pid && !isGuestId(pid) && !standings[pid]) {
                  standings[pid] = { id: pid, points: 0, wins: 0 };
                }
              });
              if (m.winnerId && !isGuestId(m.winnerId)) {
                standings[m.winnerId].points += 2;
                standings[m.winnerId].wins += 1;
              }
            });

            const sorted = Object.values(standings).sort((a, b) =>
              b.points !== a.points ? b.points - a.points : b.wins - a.wins
            );

            await prisma.category.update({
              where: { id: match.categoryId },
              data: {
                status: 'completed',
                winnerId:   sorted[0]?.id || null,
                runnerUpId: sorted[1]?.id || null,
              }
            });

            // Award tournament points
            try {
              const tournamentPointsService = await import('../services/tournamentPoints.service.js');
              await tournamentPointsService.default.awardTournamentPoints(match.tournamentId, match.categoryId);
              console.log(`✅ Tournament points awarded for RR category ${match.categoryId}`);
            } catch (pointsError) {
              console.error('❌ Error awarding RR tournament points:', pointsError);
            }

            console.log(`✅ Pure Round Robin category ${match.categoryId} completed. Winner: ${sorted[0]?.id}`);
          }
        }
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

    // Scope to tournaments where this user is actually registered as an umpire.
    // Previously used { OR: [{ umpireId }, { status: 'PENDING' }] } which leaked
    // ALL pending matches from every tournament to any umpire-role user.
    const umpireTournaments = await prisma.tournamentUmpire.findMany({
      where: { umpireId: userId },
      select: { tournamentId: true }
    });
    const tournamentIds = umpireTournaments.map(t => t.tournamentId);

    const matches = await prisma.match.findMany({
      where: {
        tournamentId: { in: tournamentIds },
        OR: [
          { umpireId: userId },
          { status: { in: ['PENDING', 'READY'] } }
        ]
      },
      include: {
        tournament: { select: { id: true, name: true } },
        category:   { select: { id: true, name: true } }
      },
      orderBy: [{ queueOrder: 'asc' }, { status: 'asc' }, { round: 'asc' }, { matchNumber: 'asc' }]
    });

    // Batch player lookups — collect regular + guest IDs separately
    const playerIds = new Set();
    const guestIds = new Set();
    const addId = (id) => {
      if (!id) return;
      if (id.startsWith('guest-')) guestIds.add(id);
      else playerIds.add(id);
    };
    for (const m of matches) {
      addId(m.player1Id); addId(m.player2Id);
      addId(m.team1Player1Id); addId(m.team1Player2Id);
      addId(m.team2Player1Id); addId(m.team2Player2Id);
    }
    const [players, guestRegs] = await Promise.all([
      playerIds.size > 0
        ? prisma.user.findMany({ where: { id: { in: [...playerIds] } }, select: { id: true, name: true } })
        : [],
      guestIds.size > 0
        ? prisma.registration.findMany({
            where: { id: { in: [...guestIds].map(id => id.replace('guest-', '')) } },
            select: { id: true, guestName: true }
          })
        : [],
    ]);
    const playerMap = Object.fromEntries([
      ...players.map(p => [p.id, p]),
      ...guestRegs.map(r => [`guest-${r.id}`, { id: `guest-${r.id}`, name: r.guestName || 'Guest' }]),
    ]);

    const resolveName = (id) => (id ? (playerMap[id]?.name || null) : null);
    const buildTeamName = (id1, id2) => {
      const n1 = resolveName(id1);
      const n2 = resolveName(id2);
      if (n1 && n2) return `${n1} & ${n2}`;
      if (n1) return n1;
      if (n2) return n2;
      return null;
    };

    const matchesWithPlayers = matches.map(m => {
      // Doubles match: team slots populated
      const isDoubles = m.team1Player1Id || m.team1Player2Id || m.team2Player1Id || m.team2Player2Id;
      let p1Name, p2Name;
      if (isDoubles) {
        p1Name = buildTeamName(m.team1Player1Id, m.team1Player2Id) || 'TBD';
        p2Name = buildTeamName(m.team2Player1Id, m.team2Player2Id) || 'TBD';
      } else {
        p1Name = resolveName(m.player1Id) || 'TBD';
        p2Name = resolveName(m.player2Id) || 'TBD';
      }
      return {
        ...m,
        player1: { name: p1Name },
        player2: { name: p2Name },
        score: m.scoreJson ? JSON.parse(m.scoreJson) : null,
      };
    });

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

    // KO matches stay locked until organizer arranges them (player1Id/player2Id get
    // set only by arrangeKnockoutMatchups/continueToKnockout, which themselves gate
    // on round robin completion). Block umpire assignment before that point.
    if (match.stage === 'KNOCKOUT' && (!match.player1Id || !match.player2Id)) {
      return res.status(400).json({
        success: false,
        error: 'This knockout match has not been arranged yet. Complete round robin and arrange the KO bracket first.'
      });
    }

    // Get umpire details
    const umpire = await prisma.user.findUnique({
      where: { id: umpireId },
      select: { id: true, name: true, email: true }
    });

    if (!umpire) {
      return res.status(404).json({ success: false, error: 'Umpire not found' });
    }

    // ── Resolve player display name (handles regular users + guest-{id} players) ──
    const resolvePlayerName = async (playerId) => {
      if (!playerId) return null;
      if (playerId.startsWith('guest-')) {
        const regId = playerId.replace('guest-', '');
        const reg = await prisma.registration.findUnique({
          where: { id: regId },
          select: {
            guestName: true,
            guestPartnerName: true,
            user: { select: { name: true } },
            partner: { select: { name: true } }
          }
        });
        if (!reg) return null;
        const baseName = reg.user?.name || reg.guestName || 'Unknown';
        const partnerName = reg.partner?.name || reg.guestPartnerName || null;
        return partnerName ? `${baseName} & ${partnerName}` : baseName;
      } else {
        // Regular user — also check if they have a doubles partner via Registration
        const [userRow, regRow] = await Promise.all([
          prisma.user.findUnique({
            where: { id: playerId },
            select: { name: true }
          }),
          prisma.registration.findFirst({
            where: { userId: playerId, tournamentId: match.tournamentId, categoryId: match.categoryId },
            select: {
              guestPartnerName: true,
              partner: { select: { name: true } }
            }
          })
        ]);
        if (!userRow) return null;
        const partnerName = regRow?.partner?.name || regRow?.guestPartnerName || null;
        return partnerName ? `${userRow.name} & ${partnerName}` : userRow.name;
      }
    };

    let [p1Name, p2Name] = await Promise.all([
      resolvePlayerName(match.player1Id),
      resolvePlayerName(match.player2Id)
    ]);

    // If DB player IDs are null (knockout match not yet advanced), fall back to bracketJson
    if (!p1Name || !p2Name) {
      try {
        const draw = await prisma.draw.findUnique({
          where: { tournamentId_categoryId: { tournamentId: match.tournamentId, categoryId: match.categoryId } },
          select: { bracketJson: true }
        });
        if (draw?.bracketJson) {
          const bracket = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;
          // rounds[0] = first played round (highest db round number)
          // rounds[length-1] = finals (db round = 1)
          // mapping: roundIndex = rounds.length - match.round
          const rounds = bracket.knockout?.rounds || bracket.rounds || [];
          if (rounds.length > 0) {
            const roundIndex = rounds.length - match.round;
            const bracketRound = rounds[Math.max(0, Math.min(roundIndex, rounds.length - 1))];
            const bracketMatches = bracketRound?.matches || [];
            // Within the round, find position of this match among all knockout DB matches for this round
            // sorted by matchNumber — same order bracketJson was created
            const siblingMatches = await prisma.match.findMany({
              where: { tournamentId: match.tournamentId, categoryId: match.categoryId, stage: 'KNOCKOUT', round: match.round },
              select: { id: true },
              orderBy: { matchNumber: 'asc' }
            });
            const matchPosInRound = siblingMatches.findIndex(m => m.id === match.id);
            const bm = bracketMatches[matchPosInRound >= 0 ? matchPosInRound : 0];
            if (bm) {
              if (!p1Name && bm.player1?.name && bm.player1.name !== 'TBD' && bm.player1.name !== 'TBA') p1Name = bm.player1.name;
              if (!p2Name && bm.player2?.name && bm.player2.name !== 'TBD' && bm.player2.name !== 'TBA') p2Name = bm.player2.name;
            }
          }
        }
      } catch (_) {}
    }

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
    const playersInfo = p1Name && p2Name
      ? `${p1Name} vs ${p2Name}`
      : p1Name || p2Name
        ? `${p1Name || p2Name} vs TBD`
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
      player1Name: p1Name || 'TBD',
      player2Name: p2Name || 'TBD',
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
          umpireId: umpireId,
          tournamentId: match.tournamentId,
          categoryId: match.categoryId,
          matchNumber: match.matchNumber,
          round: match.round,
          roundName,
          courtNumber: match.courtNumber,
          player1Name: p1Name || 'TBD',
          player2Name: p2Name || 'TBD',
          matchDetails,
          tournamentName: match.tournament.name,
          categoryName: match.category.name
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

/**
 * Save umpire match queue (bulk assign + ordering)
 * PUT /api/matches/tournament/:tournamentId/umpire-queue
 * Body: { umpireId: string, matchIds: string[] }  — matchIds ordered by desired play sequence
 */
const saveUmpireQueue = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { umpireId, matchIds } = req.body;
    const userId = req.user.userId || req.user.id;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!umpireId || !Array.isArray(matchIds)) {
      return res.status(400).json({ success: false, error: 'umpireId and matchIds array required' });
    }

    // ── Verify organizer owns this tournament ────────────────────────────────
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, name: true, organizerId: true }
    });
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    if (tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only organizer can assign umpire queues' });
    }

    // ── Verify umpire is registered for this tournament ──────────────────────
    const tournamentUmpire = await prisma.tournamentUmpire.findUnique({
      where: { tournamentId_umpireId: { tournamentId, umpireId } }
    });
    if (!tournamentUmpire) {
      return res.status(400).json({ success: false, error: 'Umpire is not registered for this tournament' });
    }

    // ── Get umpire details for notification ─────────────────────────────────
    const umpire = await prisma.user.findUnique({
      where: { id: umpireId },
      select: { id: true, name: true, email: true }
    });
    if (!umpire) return res.status(404).json({ success: false, error: 'Umpire not found' });

    // ── Verify all matchIds belong to this tournament ────────────────────────
    if (matchIds.length > 0) {
      const matchCount = await prisma.match.count({
        where: { id: { in: matchIds }, tournamentId }
      });
      if (matchCount !== matchIds.length) {
        return res.status(400).json({ success: false, error: 'Some matches do not belong to this tournament' });
      }

      // KO matches stay locked until organizer arranges them (player IDs set only
      // by arrangeKnockoutMatchups/continueToKnockout, gated on RR completion).
      const unarrangedKo = await prisma.match.count({
        where: { id: { in: matchIds }, tournamentId, stage: 'KNOCKOUT', OR: [{ player1Id: null }, { player2Id: null }] }
      });
      if (unarrangedKo > 0) {
        return res.status(400).json({
          success: false,
          error: `${unarrangedKo} knockout match(es) in this queue have not been arranged yet. Complete round robin and arrange the KO bracket first.`
        });
      }
    }

    // ── Transaction: clear old queue → set new queue atomically ─────────────
    await prisma.$transaction(async (tx) => {
      // Clear queueOrder for all matches currently queued to this umpire in this tournament
      await tx.match.updateMany({
        where: { tournamentId, umpireId, queueOrder: { not: null } },
        data: { queueOrder: null }
      });

      // Assign umpireId + queueOrder (1-based) for each match in new queue
      for (let i = 0; i < matchIds.length; i++) {
        await tx.match.update({
          where: { id: matchIds[i] },
          data: { umpireId, queueOrder: i + 1 }
        });
      }
    });

    // ── Fetch full match details for rich notification ────────────────────────
    let matchSummaries = [];
    if (matchIds.length > 0) {
      try {
        const assignedMatches = await prisma.match.findMany({
          where: { id: { in: matchIds } },
          select: {
            id: true, queueOrder: true, round: true, matchNumber: true, status: true,
            player1Id: true, player2Id: true,
            team1Player1Id: true, team1Player2Id: true,
            team2Player1Id: true, team2Player2Id: true,
            category: { select: { name: true } },
          },
          orderBy: { queueOrder: 'asc' }
        });
        const pidSet = new Set();
        const guestPidSet = new Set();
        const addPid = (id) => {
          if (!id) return;
          if (id.startsWith('guest-')) guestPidSet.add(id);
          else pidSet.add(id);
        };
        for (const m of assignedMatches) {
          addPid(m.player1Id); addPid(m.player2Id);
          addPid(m.team1Player1Id); addPid(m.team1Player2Id);
          addPid(m.team2Player1Id); addPid(m.team2Player2Id);
        }
        const [pList, guestPList] = await Promise.all([
          pidSet.size > 0
            ? prisma.user.findMany({ where: { id: { in: [...pidSet] } }, select: { id: true, name: true } })
            : [],
          guestPidSet.size > 0
            ? prisma.registration.findMany({
                where: { id: { in: [...guestPidSet].map(id => id.replace('guest-', '')) } },
                select: { id: true, guestName: true }
              })
            : [],
        ]);
        const pMap = Object.fromEntries([
          ...pList.map(p => [p.id, p]),
          ...guestPList.map(r => [`guest-${r.id}`, { id: `guest-${r.id}`, name: r.guestName || 'Guest' }]),
        ]);
        const resolvePName = (id) => (id ? (pMap[id]?.name || null) : null);
        const buildPTeam = (id1, id2) => {
          const n1 = resolvePName(id1); const n2 = resolvePName(id2);
          if (n1 && n2) return `${n1} & ${n2}`;
          return n1 || n2 || null;
        };
        matchSummaries = assignedMatches.map(m => {
          const isDoubles = m.team1Player1Id || m.team1Player2Id || m.team2Player1Id || m.team2Player2Id;
          return {
            id: m.id,
            queueOrder: m.queueOrder,
            round: m.round,
            matchNumber: m.matchNumber,
            status: m.status,
            categoryName: m.category?.name || '',
            player1Name: isDoubles ? (buildPTeam(m.team1Player1Id, m.team1Player2Id) || 'TBD') : (resolvePName(m.player1Id) || 'TBD'),
            player2Name: isDoubles ? (buildPTeam(m.team2Player1Id, m.team2Player2Id) || 'TBD') : (resolvePName(m.player2Id) || 'TBD'),
          };
        });
      } catch (detailErr) {
        console.error('⚠️ Match detail fetch failed (non-fatal):', detailErr.message);
      }
    }

    // ── Send notification to umpire with full match list ──────────────────────
    if (matchIds.length > 0) {
      try {
        const notificationService = await import('../services/notificationService.js');
        await notificationService.default.createNotification({
          userId: umpireId,
          type: 'MATCH_ASSIGNED',
          title: '⚖️ Match Queue Assigned',
          message: `You have been assigned ${matchIds.length} match${matchIds.length > 1 ? 'es' : ''} in ${tournament.name}. Tap each match below to configure and start scoring.`,
          data: {
            tournamentId,
            tournamentName: tournament.name,
            matchCount: matchIds.length,
            umpireName: umpire.name,
            isQueue: true,
            matches: matchSummaries,
          },
          sendEmail: false
        });

        // ── Send organizer a simple confirmation ──────────────────────────────
        await notificationService.default.createNotification({
          userId: tournament.organizerId,
          type: 'MATCH_ASSIGNED',
          title: '✅ Queue Saved',
          message: `${matchIds.length} match${matchIds.length > 1 ? 'es' : ''} assigned to ${umpire.name} in ${tournament.name}.`,
          data: {
            tournamentId,
            tournamentName: tournament.name,
            umpireId,
            umpireName: umpire.name,
            matchCount: matchIds.length,
            isOrganizerConfirmation: true,
          },
          sendEmail: false
        });
      } catch (notifError) {
        console.error('⚠️ Queue notification failed (non-fatal):', notifError.message);
      }
    }

    res.json({
      success: true,
      message: `Queue of ${matchIds.length} match${matchIds.length > 1 ? 'es' : ''} saved for ${umpire.name}`
    });
  } catch (error) {
    console.error('Save umpire queue error:', error);
    res.status(500).json({ success: false, error: 'Failed to save umpire queue' });
  }
};
