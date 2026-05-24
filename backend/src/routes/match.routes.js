import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize, optionalAuth } from '../middleware/auth.js';
import { assignUmpire, getUmpireMatches } from '../controllers/match.controller.js';
import { broadcastScoreUpdate, broadcastMatchStatus, broadcastMatchComplete, broadcastToTournament } from '../services/socketService.js';

const router = express.Router();

// Get matches assigned to the currently authenticated umpire
// MUST be before /:matchId so 'umpire-matches' is not treated as a matchId
router.get('/umpire-matches', authenticate, getUmpireMatches);

// GET /live — all in-progress matches (must be before /:matchId)
router.get('/live', authenticate, async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: 'IN_PROGRESS' },
      include: {
        tournament: { select: { id: true, name: true } },
        category:   { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });
    const parsed = matches.map(m => ({
      ...m,
      score: m.scoreJson ? (() => { try { return JSON.parse(m.scoreJson); } catch { return null; } })() : null,
    }));
    res.json({ success: true, matches: parsed });
  } catch (error) {
    console.error('Error fetching live matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch live matches' });
  }
});

// GET /:matchId/status — quick poll endpoint (before /:matchId to match correctly)
router.get('/:matchId/status', authenticate, async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.matchId },
      select: { id: true, status: true, winnerId: true, updatedAt: true, scoreJson: true },
    });
    if (!match) return res.status(404).json({ success: false, error: 'Match not found' });
    res.json({
      success: true,
      status: match.status,
      winnerId: match.winnerId,
      updatedAt: match.updatedAt,
      score: match.scoreJson ? (() => { try { return JSON.parse(match.scoreJson); } catch { return null; } })() : null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get match status' });
  }
});

// PUT /:matchId/undo — undo last point (alias: remove last event from score)
router.put('/:matchId/undo', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId || req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { organizerId: true } } },
    });
    if (!match) return res.status(404).json({ success: false, error: 'Match not found' });

    const userRoles = req.user.roles || [];
    if (match.umpireId !== userId && match.tournament.organizerId !== userId && !userRoles.includes('ADMIN')) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    const score = match.scoreJson ? (() => { try { return JSON.parse(match.scoreJson); } catch { return null; } })() : null;
    if (!score) return res.status(400).json({ success: false, error: 'No score data to undo' });

    // Pop last point from current set
    const sets = score.sets || [];
    const currentSetIdx = sets.findIndex(s => s.status === 'in_progress') ?? sets.length - 1;
    const currentSet = sets[currentSetIdx >= 0 ? currentSetIdx : sets.length - 1];

    if (currentSet?.points?.length > 0) {
      const lastPoint = currentSet.points.pop();
      // Reverse the score
      if (lastPoint?.scorer === 'player1') currentSet.player1Score = Math.max(0, (currentSet.player1Score || 0) - 1);
      if (lastPoint?.scorer === 'player2') currentSet.player2Score = Math.max(0, (currentSet.player2Score || 0) - 1);
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { scoreJson: JSON.stringify(score), updatedAt: new Date() },
    });

    broadcastScoreUpdate(matchId, score);
    res.json({ success: true, message: 'Last point undone', score });
  } catch (error) {
    console.error('Error undoing point:', error);
    res.status(500).json({ success: false, error: 'Failed to undo point' });
  }
});

// GET /:matchId/live — full match details for live spectating (alias of /:matchId)
router.get('/:matchId/live', authenticate, async (req, res) => {
  req.url = `/${req.params.matchId}`;
  // Re-use the same match detail logic by redirecting internally
  return res.redirect(307, `/api/matches/${req.params.matchId}`);
});

// GET match details (defined before PUT /start so Express doesn't confuse them)
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

    // Helper function to get player data (handles both real users and guest players)
    const getPlayerData = async (playerId) => {
      if (!playerId) return null;
      
      // Check if it's a guest player (ID starts with "guest-")
      if (playerId.startsWith('guest-')) {
        const registrationId = playerId.replace('guest-', '');
        const registration = await prisma.registration.findUnique({
          where: { id: registrationId },
          select: { 
            id: true, 
            guestName: true, 
            guestEmail: true,
            userId: true
          }
        });
        
        if (registration) {
          return {
            id: playerId,
            name: registration.guestName || 'Guest Player',
            email: registration.guestEmail || null,
            profilePhoto: null,
            isGuest: true
          };
        }
        return null;
      }
      
      // Regular user
      return await prisma.user.findUnique({
        where: { id: playerId },
        select: { id: true, name: true, email: true, profilePhoto: true }
      });
    };

    // Fetch all player data in parallel — was sequential (up to 6 round trips)
    [player1, player2, team1Player1, team1Player2, team2Player1, team2Player2] =
      await Promise.all([
        match.player1Id      ? getPlayerData(match.player1Id)      : Promise.resolve(null),
        match.player2Id      ? getPlayerData(match.player2Id)      : Promise.resolve(null),
        match.team1Player1Id ? getPlayerData(match.team1Player1Id) : Promise.resolve(null),
        match.team1Player2Id ? getPlayerData(match.team1Player2Id) : Promise.resolve(null),
        match.team2Player1Id ? getPlayerData(match.team2Player1Id) : Promise.resolve(null),
        match.team2Player2Id ? getPlayerData(match.team2Player2Id) : Promise.resolve(null),
      ]);

    const matchData = {
      ...match,
      player1,
      player2,
      team1Player1,
      team1Player2,
      team2Player1,
      team2Player2,
      score: match.scoreJson ? JSON.parse(match.scoreJson) : null
    };

    res.json({
      success: true,
      match: matchData
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
// Accepts two modes:
//   1. Full score object: { score: { sets: [...], ... } }
//   2. Point-by-point increment: { player: 'player1' | 'player2' }
router.put('/:matchId/score', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    let { score, player } = req.body;
    const userRoles = req.user.roles || [];
    const userId = req.user.userId || req.user.id;

    // ── Auth: role check first (fast), then assignment check for umpires ──
    const canScore = userRoles.some(r => ['UMPIRE', 'ADMIN', 'ORGANIZER'].includes(r));
    if (!canScore) {
      return res.status(403).json({ success: false, message: 'Not authorized to update match scores' });
    }

    // For umpires: verify assigned to this specific match (admins/organisers skip)
    if (userRoles.includes('UMPIRE') && !userRoles.includes('ADMIN') && !userRoles.includes('ORGANIZER')) {
      const matchAssignment = await prisma.match.findUnique({
        where: { id: matchId },
        select: { umpireId: true }
      });
      if (!matchAssignment) {
        return res.status(404).json({ success: false, message: 'Match not found' });
      }
      if (matchAssignment.umpireId !== userId) {
        return res.status(403).json({ success: false, message: 'Not authorized: not assigned as umpire for this match' });
      }
    }

    // ── Point-by-point mode: { player: 'player1'|'player2' } ─────────────
    // Only needs a findUnique when the frontend sends player (not full score).
    // MatchScoringPage always sends the full score object, so this path is only
    // used by the legacy ScoringConsolePage / API integrations.
    if (player && !score) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        select: { scoreJson: true }
      });
      if (!match) {
        return res.status(404).json({ success: false, message: 'Match not found' });
      }
      const current = match.scoreJson
        ? (() => { try { return JSON.parse(match.scoreJson); } catch { return null; } })()
        : null;
      if (!current) {
        return res.status(400).json({ success: false, message: 'Match score not initialised — start the match first' });
      }

      const sets = current.sets || [];
      let activeSetIdx = sets.findIndex(s => s.status === 'in_progress');
      if (activeSetIdx === -1) activeSetIdx = sets.length - 1;
      if (activeSetIdx >= 0) {
        const activeSet = sets[activeSetIdx];
        if (player === 'player1') activeSet.player1 = (activeSet.player1 || 0) + 1;
        else if (player === 'player2') activeSet.player2 = (activeSet.player2 || 0) + 1;
        if (!activeSet.points) activeSet.points = [];
        activeSet.points.push({ scorer: player, timestamp: new Date().toISOString() });
        current.sets = sets;
      }
      score = current;
    }

    if (!score) {
      return res.status(400).json({ success: false, message: 'score or player field required' });
    }

    // ── Single update — no pre-fetch needed when full score provided ──────
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: { scoreJson: JSON.stringify(score), updatedAt: new Date() }
    });

    broadcastScoreUpdate(matchId, score);

    res.json({ success: true, message: 'Score updated', score, data: updatedMatch });
  } catch (error) {
    console.error('Error updating match score:', error);
    res.status(500).json({ success: false, message: 'Failed to update match score', error: error.message });
  }
});

// Start match handler — shared by POST (primary) and PUT (legacy alias)
// ── Player data helper (guest-safe) ───────────────────────────────────────
const _getPlayerData = async (playerId) => {
  if (!playerId) return null;
  if (playerId.startsWith('guest-')) {
    const reg = await prisma.registration.findUnique({
      where: { id: playerId.replace('guest-', '') },
      select: { id: true, guestName: true, guestEmail: true }
    });
    return reg ? { id: playerId, name: reg.guestName || 'Guest Player', email: reg.guestEmail || null, profilePhoto: null, isGuest: true } : null;
  }
  return prisma.user.findUnique({
    where: { id: playerId },
    select: { id: true, name: true, email: true, profilePhoto: true }
  });
};

const startMatchHandler = async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId || req.user.id;

    // ── Step 1: fetch match (1 query) ─────────────────────────────────────
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: { select: { organizerId: true, id: true, name: true } },
        category:   { select: { id: true, name: true } },
        umpire:     { select: { id: true, name: true, email: true } }
      }
    });

    if (!match) {
      return res.status(404).json({ success: false, message: 'Match not found' });
    }

    // Authorization check
    const userRoles = req.user.roles || [];
    const isAuthorized =
      match.umpireId === userId ||
      match.tournament.organizerId === userId ||
      userRoles.includes('ADMIN');

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: 'Not authorized to start this match' });
    }

    // Guard: prevent re-starting a match already in progress or completed
    if (match.status === 'IN_PROGRESS' || match.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Match has already been started' });
    }

    // ── Step 2: build score + fetch both players in parallel (2 queries) ──
    const now = new Date();
    const timer = {
      startedAt: now.toISOString(),
      isPaused: false,
      totalPausedTime: 0,
      pauseHistory: []
    };

    let scoreData = {
      sets: [{ player1: 0, player2: 0 }],
      currentSet: 0,
      matchConfig: { pointsPerSet: 21, setsToWin: 2, maxSets: 3, extension: true },
      timer
    };

    if (match.scoreJson) {
      try {
        const parsed = typeof match.scoreJson === 'string' ? JSON.parse(match.scoreJson) : match.scoreJson;
        scoreData = {
          ...parsed,
          sets: parsed.sets?.length > 0 ? parsed.sets : [{ player1: 0, player2: 0 }],
          currentSet: parsed.currentSet || 0,
          timer
        };
      } catch (e) {
        console.error('Error parsing scoreJson:', e);
      }
    }

    const [player1, player2] = await Promise.all([
      _getPlayerData(match.player1Id),
      _getPlayerData(match.player2Id)
    ]);

    // ── Step 3: single update — status + scoreJson together (1 query) ─────
    const finalMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: now,
        updatedAt: now,
        scoreJson: JSON.stringify(scoreData)
      },
      include: {
        tournament: { select: { id: true, name: true } },
        category:   { select: { id: true, name: true } },
        umpire:     { select: { id: true, name: true, email: true } }
      }
    });

    finalMatch.player1 = player1;
    finalMatch.player2 = player2;
    finalMatch.score = scoreData;

    // Broadcast (fire-and-forget — don't block the response)
    broadcastMatchStatus(matchId, 'IN_PROGRESS', { score: scoreData });
    broadcastToTournament(match.tournamentId, 'match-started', {
      matchId,
      player1: player1 ? { id: player1.id, name: player1.name } : null,
      player2: player2 ? { id: player2.id, name: player2.name } : null,
      category: match.category,
      courtNumber: match.courtNumber,
      matchNumber: match.matchNumber,
      startedAt: now.toISOString(),
    });

    res.json({ success: true, message: 'Match started successfully', match: finalMatch });
  } catch (error) {
    console.error('Error starting match:', error);
    res.status(500).json({ success: false, message: 'Failed to start match', error: error.message });
  }
};

router.post('/:matchId/start', authenticate, startMatchHandler);
router.put('/:matchId/start', authenticate, startMatchHandler); // legacy alias

// Pause match timer
router.put('/:matchId/pause', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId || req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { organizerId: true } } }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    const userRoles = req.user.roles || [];
    const isAuthorized = match.umpireId === userId || match.tournament.organizerId === userId || userRoles.includes('ADMIN');
    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Not authorized to pause this match' });
    }

    if (match.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, error: 'Match is not in progress' });
    }

    // Parse current score
    const score = match.scoreJson ? JSON.parse(match.scoreJson) : {};
    
    if (!score.timer) {
      return res.status(400).json({ success: false, error: 'Timer not initialized' });
    }

    if (score.timer.isPaused) {
      return res.status(400).json({ success: false, error: 'Timer is already paused' });
    }

    // Update timer
    score.timer.isPaused = true;
    score.timer.pausedAt = new Date().toISOString();
    score.timer.pauseHistory = score.timer.pauseHistory || [];
    score.timer.pauseHistory.push({
      pausedAt: score.timer.pausedAt
    });

    // Save updated score
    await prisma.match.update({
      where: { id: matchId },
      data: { scoreJson: JSON.stringify(score) }
    });

    res.json({
      success: true,
      message: 'Timer paused',
      timer: score.timer
    });
  } catch (error) {
    console.error('Error pausing timer:', error);
    res.status(500).json({ success: false, error: 'Failed to pause timer' });
  }
});

// Resume match timer
router.put('/:matchId/resume', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const userId = req.user.userId || req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { organizerId: true } } }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    const userRoles = req.user.roles || [];
    const isAuthorized = match.umpireId === userId || match.tournament.organizerId === userId || userRoles.includes('ADMIN');
    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Not authorized to resume this match' });
    }

    if (match.status !== 'IN_PROGRESS') {
      return res.status(400).json({ success: false, error: 'Match is not in progress' });
    }

    // Parse current score
    const score = match.scoreJson ? JSON.parse(match.scoreJson) : {};
    
    if (!score.timer) {
      return res.status(400).json({ success: false, error: 'Timer not initialized' });
    }

    if (!score.timer.isPaused) {
      return res.status(400).json({ success: false, error: 'Timer is not paused' });
    }

    // Calculate pause duration
    const pausedAt = new Date(score.timer.pausedAt);
    const resumedAt = new Date();
    const pauseDuration = resumedAt - pausedAt;

    // Update timer
    score.timer.isPaused = false;
    score.timer.totalPausedTime = (score.timer.totalPausedTime || 0) + pauseDuration;
    
    // Update last pause history entry
    if (score.timer.pauseHistory && score.timer.pauseHistory.length > 0) {
      const lastPause = score.timer.pauseHistory[score.timer.pauseHistory.length - 1];
      lastPause.resumedAt = resumedAt.toISOString();
      lastPause.duration = pauseDuration;
    }

    delete score.timer.pausedAt;

    // Save updated score
    await prisma.match.update({
      where: { id: matchId },
      data: { scoreJson: JSON.stringify(score) }
    });

    res.json({
      success: true,
      message: 'Timer resumed',
      timer: score.timer
    });
  } catch (error) {
    console.error('Error resuming timer:', error);
    res.status(500).json({ success: false, error: 'Failed to resume timer' });
  }
});

// Shared handler used by both PUT /:matchId/end and POST /:matchId/complete
const endMatchHandler = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, finalScore } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!finalScore?.sets?.length) {
      return res.status(400).json({ success: false, error: 'Cannot complete match without score data.' });
    }

    // ── 1. Fetch match ─────────────────────────────────────────────────────────
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { tournament: { select: { organizerId: true } } }
    });
    if (!match) return res.status(404).json({ success: false, error: 'Match not found' });

    const userRoles = req.user.roles || [];
    if (match.umpireId !== userId && match.tournament.organizerId !== userId && !userRoles.includes('ADMIN')) {
      return res.status(403).json({ success: false, error: 'Not authorized to end this match' });
    }

    // ── 2. Compute duration ────────────────────────────────────────────────────
    if (finalScore.timer?.startedAt) {
      const totalPausedTime = finalScore.timer.totalPausedTime || 0;
      const totalDuration = Math.floor((Date.now() - new Date(finalScore.timer.startedAt).getTime() - totalPausedTime) / 1000);
      finalScore.timer.completedAt = new Date().toISOString();
      finalScore.timer.totalDuration = totalDuration;
      finalScore.timer.totalDurationFormatted = formatDuration(totalDuration);
    }

    // ── 3. Fetch players + parent match in parallel ───────────────────────────
    const isGuestId = (id) => !id || id.startsWith('guest-');
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    // Determine parent match lookup
    let parentMatchPromise = Promise.resolve(null);
    let fallbackWinnerPos = null; // set by the IIFE below when parentMatchId is missing
    if (match.parentMatchId) {
      parentMatchPromise = prisma.match.findUnique({ where: { id: match.parentMatchId } });
    } else if (match.stage === 'KNOCKOUT' && match.round > 1) {
      // Fallback: use index-based lookup because matchNumbers are global counters
      // (matchNumber-based lookup only works for pure KNOCKOUT with per-round numbering)
      parentMatchPromise = (async () => {
        const [currentRoundMatches, parentRoundMatches] = await Promise.all([
          prisma.match.findMany({
            where: { tournamentId: match.tournamentId, categoryId: match.categoryId, round: match.round, stage: 'KNOCKOUT' },
            orderBy: { matchNumber: 'asc' }
          }),
          prisma.match.findMany({
            where: { tournamentId: match.tournamentId, categoryId: match.categoryId, round: match.round - 1, stage: 'KNOCKOUT' },
            orderBy: { matchNumber: 'asc' }
          })
        ]);
        const myIndex = currentRoundMatches.findIndex(m => m.id === matchId);
        if (myIndex === -1) return null;
        fallbackWinnerPos = myIndex % 2 === 0 ? 'player1' : 'player2';
        return parentRoundMatches[Math.floor(myIndex / 2)] || null;
      })();
    }

    const [player1, player2, parentMatch] = await Promise.all([
      isGuestId(match.player1Id) ? Promise.resolve(null) : prisma.user.findUnique({ where: { id: match.player1Id }, select: { id: true, name: true } }),
      isGuestId(match.player2Id) ? Promise.resolve(null) : prisma.user.findUnique({ where: { id: match.player2Id }, select: { id: true, name: true } }),
      parentMatchPromise,
    ]);

    // Resolve display names — falls back to guest Registration for guest-{id} players
    const resolveGuestName = async (playerId) => {
      if (!playerId || !playerId.startsWith('guest-')) return null;
      const regId = playerId.replace('guest-', '');
      const reg = await prisma.registration.findUnique({
        where: { id: regId },
        select: { guestName: true, user: { select: { name: true } } }
      });
      return reg ? (reg.user?.name || reg.guestName || 'Unknown') : 'Unknown';
    };

    const [guestName1, guestName2] = await Promise.all([
      resolveGuestName(match.player1Id),
      resolveGuestName(match.player2Id),
    ]);

    // player1/player2 are null for guests — supplement with resolved guest names
    const player1WithName = player1 || (guestName1 ? { id: match.player1Id, name: guestName1 } : null);
    const player2WithName = player2 || (guestName2 ? { id: match.player2Id, name: guestName2 } : null);

    const winner = winnerId === match.player1Id ? player1WithName : player2WithName;
    const loser  = winnerId === match.player1Id ? player2WithName : player1WithName;

    // ── 4+5. Mark COMPLETED and advance winner atomically ─────────────────────
    // Both writes in a single transaction so a crash between them can't leave the
    // match completed but the bracket not advanced (or vice versa).
    const isFinal = !parentMatch && match.round === 1 && match.stage !== 'GROUP';

    // timeout:30000 — prevents P2028 "Unable to start a transaction in the given time"
    // Default Prisma transaction timeout is 5s which stalls under pool pressure
    const updatedMatch = await prisma.$transaction(async (tx) => {
      const completed = await tx.match.update({
        where: { id: matchId },
        data: { status: 'COMPLETED', winnerId, completedAt: new Date(), scoreJson: JSON.stringify(finalScore), updatedAt: new Date() },
        include: { tournament: true, category: true }
      });

      if (parentMatch) {
        const winnerPos   = match.winnerPosition || fallbackWinnerPos || (match.matchNumber % 2 === 1 ? 'player1' : 'player2');
        const advanceData = winnerPos === 'player1' ? { player1Id: winnerId } : { player2Id: winnerId };
        const bothReady   = winnerPos === 'player1' ? !!parentMatch.player2Id : !!parentMatch.player1Id;
        if (bothReady) advanceData.status = 'READY';
        await tx.match.update({ where: { id: parentMatch.id }, data: advanceData });
      }

      // Final match: close category and record winner/runner-up
      if (isFinal) {
        await tx.category.update({
          where: { id: match.categoryId },
          data: {
            status: 'completed',
            winnerId: !isGuestId(winnerId) ? winnerId : null,
            runnerUpId: !isGuestId(loserId) ? loserId : null,
          }
        });
      }

      return completed;
    }, { timeout: 30000 });

    // ── 6. RESPOND TO CLIENT — everything below is non-critical ───────────────
    // Broadcast match completion to live spectators
    broadcastMatchComplete(matchId, winnerId, finalScore);
    broadcastToTournament(match.tournamentId, 'match-ended', {
      matchId,
      winnerId,
    });

    res.json({
      success: true,
      message: 'Match ended successfully',
      match: updatedMatch,
      summary: {
        winner: winner?.name,
        loser:  loser?.name,
        duration: finalScore?.timer?.totalDurationFormatted,
        finalScore
      }
    });

    // ── 7. Background: stats + notifications + bracket JSON ───────────────────
    // Fire-and-forget — client already received success response above
    const runBackground = async () => {
      const getRoundName = (r) => r === 1 ? 'Final' : r === 2 ? 'Semi Finals' : r === 3 ? 'Quarter Finals' : r === 4 ? 'Round of 16' : `Round ${r}`;
      const roundName = getRoundName(match.round);
      const notifData = JSON.stringify({ matchId: match.id, tournamentId: match.tournamentId, categoryId: match.categoryId, round: match.round, roundName });

      try {
        // Stats + umpire lookup + notifications all in parallel
        const tasks = [];

        // Player stats
        if (!isGuestId(winnerId) && !isGuestId(loserId) && player1 && player2) {
          tasks.push(prisma.user.update({ where: { id: winnerId }, data: { matchesWon: { increment: 1 } } }));
          tasks.push(prisma.user.update({ where: { id: loserId },  data: { matchesLost: { increment: 1 } } }));
        }

        // Notifications
        if (!isGuestId(winnerId)) {
          tasks.push(prisma.notification.create({ data: {
            userId: winnerId, type: 'MATCH_WON', title: '🏆 Victory!',
            message: `Congratulations! You won your ${roundName} match in ${updatedMatch.tournament.name} - ${updatedMatch.category.name}`,
            data: notifData
          }}));
        }
        if (!isGuestId(loserId)) {
          tasks.push(prisma.notification.create({ data: {
            userId: loserId, type: 'MATCH_LOST', title: 'Match Complete',
            message: `Your ${roundName} match in ${updatedMatch.tournament.name} - ${updatedMatch.category.name} has ended`,
            data: notifData
          }}));
        }
        tasks.push(prisma.notification.create({ data: {
          userId: updatedMatch.tournament.organizerId, type: 'MATCH_COMPLETED', title: 'Match Completed',
          message: `Match #${match.matchNumber} (${roundName}) completed: ${winner?.name || 'Player'} defeated ${loser?.name || 'Player'}`,
          data: notifData
        }}));

        await Promise.all(tasks);
      } catch (bgErr) {
        console.error('Background stats/notif error:', bgErr);
      }

      // Bracket JSON update (standings / advance in stored JSON)
      try {
        const draw = await prisma.draw.findUnique({
          where: { tournamentId_categoryId: { tournamentId: match.tournamentId, categoryId: match.categoryId } }
        });
        if (!draw?.bracketJson) return;

        const bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;
        if (!bracketJson || typeof bracketJson !== 'object') return;

        const winnerName = winner?.name || 'Winner';

        if (bracketJson.format === 'ROUND_ROBIN' || (bracketJson.format === 'ROUND_ROBIN_KNOCKOUT' && match.stage === 'GROUP')) {
          // Find group
          let targetGroup = null;
          for (const group of (bracketJson.groups || [])) {
            if (group.participants?.some(p => p.id === match.player1Id) &&
                group.participants?.some(p => p.id === match.player2Id)) {
              targetGroup = group; break;
            }
          }
          if (targetGroup) {
            const allMatches = await prisma.match.findMany({ where: { tournamentId: match.tournamentId, categoryId: match.categoryId, status: 'COMPLETED' } });
            const groupMatches = allMatches.filter(m => targetGroup.participants.some(p => p.id === m.player1Id) && targetGroup.participants.some(p => p.id === m.player2Id));
            targetGroup.participants.forEach(p => { p.played = 0; p.wins = 0; p.losses = 0; p.points = 0; p.totalPoints = 0; });
            groupMatches.forEach(m => {
              const p1 = targetGroup.participants.find(p => p.id === m.player1Id);
              const p2 = targetGroup.participants.find(p => p.id === m.player2Id);
              if (!p1 || !p2) return;
              p1.played++; p2.played++;
              // Accumulate total game points (TP) from scoreJson
              if (m.scoreJson) {
                try {
                  const sd = typeof m.scoreJson === 'string' ? JSON.parse(m.scoreJson) : m.scoreJson;
                  if (sd?.sets && Array.isArray(sd.sets)) {
                    let t1 = 0, t2 = 0;
                    sd.sets.forEach(s => { t1 += s.player1 ?? s.p1 ?? s.score1 ?? 0; t2 += s.player2 ?? s.p2 ?? s.score2 ?? 0; });
                    p1.totalPoints = (p1.totalPoints || 0) + t1;
                    p2.totalPoints = (p2.totalPoints || 0) + t2;
                  }
                } catch (_) {}
              }
              if (m.winnerId === m.player1Id) { p1.wins++; p1.points += 2; p2.losses++; }
              else if (m.winnerId === m.player2Id) { p2.wins++; p2.points += 2; p1.losses++; }
            });
            targetGroup.participants.sort((a, b) => b.points !== a.points ? b.points - a.points : b.wins - a.wins);
            const mib = targetGroup.matches?.find(m => m.matchNumber === match.matchNumber);
            if (mib) { mib.status = 'completed'; mib.winner = winnerId === match.player1Id ? 1 : 2; mib.winnerId = winnerId; mib.score = finalScore; }
            await prisma.draw.update({ where: { tournamentId_categoryId: { tournamentId: match.tournamentId, categoryId: match.categoryId } }, data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() } });
          }
        } else if (bracketJson.format === 'KNOCKOUT' || bracketJson.format === 'single_elimination' ||
                   (bracketJson.format === 'ROUND_ROBIN_KNOCKOUT' && match.stage === 'KNOCKOUT')) {
          const rounds = bracketJson.knockout?.rounds || bracketJson.rounds;
          if (!Array.isArray(rounds)) return;

          // For ROUND_ROBIN_KNOCKOUT the bracketJson uses per-round matchNumbers (1, 2, 1…)
          // but DB matchNumbers are global. Use index-based lookup instead.
          const isHybridKO = bracketJson.format === 'ROUND_ROBIN_KNOCKOUT';

          if (isHybridKO) {
            // Find this match's position within its DB round
            const dbRoundMatches = await prisma.match.findMany({
              where: { tournamentId: match.tournamentId, categoryId: match.categoryId, round: match.round, stage: 'KNOCKOUT' },
              orderBy: { matchNumber: 'asc' }
            });
            const myIndex = dbRoundMatches.findIndex(m => m.id === match.id);
            if (myIndex === -1) return;

            const totalKnockoutRounds = rounds.length; // bracketJson rounds length
            const bracketRoundIdx = totalKnockoutRounds - match.round; // reverse mapping
            const bracketRound = rounds[bracketRoundIdx];
            const mib = bracketRound?.matches?.[myIndex];
            if (mib) {
              mib.status = 'completed';
              mib.winner = { id: winnerId, name: winnerName };
              mib.winnerId = winnerId;
              mib.score = finalScore;
            }

            // Advance winner in bracket JSON parent slot
            if (parentMatch) {
              const parentBracketRoundIdx = bracketRoundIdx + 1;
              const parentBracketRound = rounds[parentBracketRoundIdx];
              const parentPos = Math.floor(myIndex / 2);
              const pmib = parentBracketRound?.matches?.[parentPos];
              if (pmib) {
                const wp = match.winnerPosition || fallbackWinnerPos || (myIndex % 2 === 0 ? 'player1' : 'player2');
                pmib[wp] = { id: winnerId, name: winnerName };
                if (pmib.player1 && pmib.player2) pmib.status = 'ready';
              }
            }
          } else {
            // Pure KNOCKOUT — matchNumbers are per-round, value search works
            for (const round of rounds) {
              const mib = round.matches?.find(m => m.matchNumber === match.matchNumber);
              if (mib) { mib.status = 'completed'; mib.winner = { id: winnerId, name: winnerName }; mib.winnerId = winnerId; mib.score = finalScore; break; }
            }
            if (parentMatch) {
              for (const round of rounds) {
                const pmib = round.matches?.find(m => m.matchNumber === parentMatch.matchNumber);
                if (pmib) {
                  const wp = match.winnerPosition || fallbackWinnerPos || (match.matchNumber % 2 === 1 ? 'player1' : 'player2');
                  pmib[wp] = { id: winnerId, name: winnerName };
                  if (pmib.player1 && pmib.player2) pmib.status = 'ready';
                  break;
                }
              }
            }
          }

          await prisma.draw.update({ where: { tournamentId_categoryId: { tournamentId: match.tournamentId, categoryId: match.categoryId } }, data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() } });
        }
      } catch (bracketErr) {
        console.error('Background bracket JSON update error:', bracketErr);
      }

      // Award tournament points when category final is completed
      if (isFinal) {
        try {
          const tournamentPointsService = (await import('../services/tournamentPoints.service.js')).default;
          await tournamentPointsService.awardTournamentPoints(match.tournamentId, match.categoryId);
          console.log(`✅ Tournament points awarded for category ${match.categoryId}`);
        } catch (pointsErr) {
          console.error('Background points award error:', pointsErr);
        }
      }
    };

    runBackground(); // intentionally not awaited

  } catch (error) {
    console.error('Error ending match:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to end match' });
  }
};

// End match — optimised: respond immediately, run non-critical work in background
router.put('/:matchId/end', authenticate, endMatchHandler);

// Give bye to player (advance without playing)
import { giveBye } from '../controllers/match.controller.js';
router.post('/:matchId/give-bye', authenticate, giveBye);

// Change match winner (for corrections)
router.put('/:matchId/change-winner', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId } = req.body;
    const userId = req.user.userId || req.user.id;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: { select: { organizerId: true } }
      }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
    }

    // Only organizer can change results
    if (match.tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only the organizer can change match results' });
    }

    // Validate winner
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      return res.status(400).json({ success: false, error: 'Winner must be a match participant' });
    }

    // Update match winner
    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId: winnerId,
        updatedAt: new Date()
      }
    });

    // Update Round Robin standings if applicable
    try {
      const draw = await prisma.draw.findUnique({
        where: { tournamentId_categoryId: { tournamentId: match.tournamentId, categoryId: match.categoryId } }
      });
      
      if (draw) {
        const bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;
        
        if (bracketJson.format === 'ROUND_ROBIN' || bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
          console.log('🔄 Recalculating Round Robin standings after result change...');
          
          // Find which group this match belongs to
          let targetGroup = null;
          for (const group of bracketJson.groups) {
            const hasPlayer1 = group.participants.some(p => p.id === match.player1Id);
            const hasPlayer2 = group.participants.some(p => p.id === match.player2Id);
            if (hasPlayer1 && hasPlayer2) {
              targetGroup = group;
              break;
            }
          }

          if (targetGroup) {
            // Get all completed matches for this group
            const allMatches = await prisma.match.findMany({
              where: {
                tournamentId: match.tournamentId,
                categoryId: match.categoryId,
                status: 'COMPLETED'
              }
            });

            // Filter matches that belong to this group
            const groupMatches = allMatches.filter(m => {
              const hasP1 = targetGroup.participants.some(p => p.id === m.player1Id);
              const hasP2 = targetGroup.participants.some(p => p.id === m.player2Id);
              return hasP1 && hasP2;
            });

            // Reset all participant stats
            targetGroup.participants.forEach(p => {
              p.played = 0;
              p.wins = 0;
              p.losses = 0;
              p.points = 0;
            });

            // Recalculate standings with updated winner
            groupMatches.forEach(m => {
              const player1 = targetGroup.participants.find(p => p.id === m.player1Id);
              const player2 = targetGroup.participants.find(p => p.id === m.player2Id);

              if (player1 && player2) {
                player1.played++;
                player2.played++;

                if (m.winnerId === m.player1Id) {
                  player1.wins++;
                  player1.points += 2; // Win = 2 points
                  player2.losses++;
                } else if (m.winnerId === m.player2Id) {
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
              where: { tournamentId_categoryId: { tournamentId: match.tournamentId, categoryId: match.categoryId } },
              data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() }
            });

            console.log(`✅ Updated standings for ${targetGroup.groupName} after result change`);
          }
        }
      }
    } catch (standingsError) {
      console.error('❌ Error updating Round Robin standings:', standingsError);
    }

    res.json({
      success: true,
      message: 'Match result updated successfully'
    });
  } catch (error) {
    console.error('Error changing match winner:', error);
    res.status(500).json({ success: false, error: 'Failed to change match result' });
  }
});

// Helper function to format duration
function formatDuration(seconds) {
  if (!seconds) return '00:00';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Complete match — alias for PUT /end, normalizes scoreData → finalScore field name
router.post('/:matchId/complete', authenticate, async (req, res) => {
  if (req.body.scoreData && !req.body.finalScore) {
    req.body.finalScore = req.body.scoreData;
  }
  return endMatchHandler(req, res);
});

// Assign umpire to match
// Assign umpire to match - calls controller function that sends notification
router.put('/:matchId/umpire', authenticate, assignUmpire);

// Assign umpire to match (POST version for compatibility) - calls controller function
router.post('/:matchId/assign-umpire', authenticate, assignUmpire);

// Get tournament matches
router.get('/tournament/:tournamentId', optionalAuth, async (req, res) => {
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

    // Batch-fetch all unique player IDs — handles both real users and guest players
    const allPlayerIds = [...new Set(
      matches.flatMap(m => [m.player1Id, m.player2Id, m.team1Player1Id, m.team1Player2Id, m.team2Player1Id, m.team2Player2Id]).filter(Boolean)
    )];
    const regularIds = allPlayerIds.filter(id => !id.startsWith('guest-'));
    const guestRegIds = allPlayerIds
      .filter(id => id.startsWith('guest-'))
      .map(id => id.replace('guest-', ''));

    const [users, guestRegs] = await Promise.all([
      regularIds.length
        ? prisma.user.findMany({ where: { id: { in: regularIds } }, select: { id: true, name: true, email: true } })
        : [],
      guestRegIds.length
        ? prisma.registration.findMany({ where: { id: { in: guestRegIds } }, select: { id: true, guestName: true, guestEmail: true } })
        : [],
    ]);

    const playerMap = Object.fromEntries(users.map(p => [p.id, p]));
    guestRegs.forEach(r => {
      playerMap[`guest-${r.id}`] = { id: `guest-${r.id}`, name: r.guestName || 'Guest Player', email: r.guestEmail || null };
    });

    const matchesWithPlayers = matches.map(match => ({
      ...match,
      player1:      playerMap[match.player1Id]      || null,
      player2:      playerMap[match.player2Id]      || null,
      team1Player1: playerMap[match.team1Player1Id] || null,
      team1Player2: playerMap[match.team1Player2Id] || null,
      team2Player1: playerMap[match.team2Player1Id] || null,
      team2Player2: playerMap[match.team2Player2Id] || null,
      scoreData: match.scoreJson ? (() => { try { return JSON.parse(match.scoreJson); } catch { return null; } })() : null,
    }));

    res.json({
      success: true,
      matches: matchesWithPlayers
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

// Set match configuration (scoring format)
router.put('/:matchId/config', authenticate, async (req, res) => {
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
    const hasUmpireRole = req.user.roles?.includes('umpire') || req.user.roles?.includes('UMPIRE') || req.user.role === 'UMPIRE';

    if (!isOrganizer && !isAssignedUmpire && !hasUmpireRole) {
      return res.status(403).json({ success: false, error: 'Not authorized to set match config' });
    }

    // Only allow config change before match starts
    if (match.status !== 'PENDING' && match.status !== 'READY' && match.status !== 'SCHEDULED') {
      return res.status(400).json({ success: false, error: 'Cannot change config after match has started' });
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
      sets: [{ player1: 0, player2: 0 }],
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

    res.json({
      success: true,
      message: 'Match config saved',
      matchConfig
    });
  } catch (error) {
    console.error('Set match config error:', error);
    res.status(500).json({ success: false, error: 'Failed to set match config' });
  }
});

export default router;