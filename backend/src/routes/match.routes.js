import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { assignUmpire, getUmpireMatches } from '../controllers/match.controller.js';

const router = express.Router();

// Get matches assigned to the currently authenticated umpire
// MUST be before /:matchId so 'umpire-matches' is not treated as a matchId
router.get('/umpire-matches', authenticate, getUmpireMatches);

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
router.put('/:matchId/score', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { score } = req.body;
    const userId = req.user.userId || req.user.id;

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

    // Update match with the complete score object
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreJson: JSON.stringify(score),
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
    const userId = req.user.userId || req.user.id;

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
      },
      include: {
        tournament: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        umpire: { select: { id: true, name: true, email: true } }
      }
    });

    // Fetch players separately since they're not relations
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

    let player1 = null;
    let player2 = null;
    
    if (updatedMatch.player1Id) {
      player1 = await getPlayerData(updatedMatch.player1Id);
    }
    
    if (updatedMatch.player2Id) {
      player2 = await getPlayerData(updatedMatch.player2Id);
    }

    // Initialize score with timer
    const initialScore = {
      sets: [{ player1: 0, player2: 0 }],
      currentSet: 0,
      matchConfig: {
        pointsPerSet: 21,
        setsToWin: 2,
        maxSets: 3,
        extension: true
      },
      timer: {
        startedAt: new Date().toISOString(),
        isPaused: false,
        totalPausedTime: 0,
        pauseHistory: []
      }
    };

    // Parse existing scoreJson if it exists
    let scoreData = initialScore;
    if (updatedMatch.scoreJson) {
      try {
        const parsed = typeof updatedMatch.scoreJson === 'string' 
          ? JSON.parse(updatedMatch.scoreJson) 
          : updatedMatch.scoreJson;
        
        // Merge with timer and ensure sets array has at least one set
        scoreData = {
          ...parsed,
          sets: parsed.sets && parsed.sets.length > 0 ? parsed.sets : [{ player1: 0, player2: 0 }],
          currentSet: parsed.currentSet || 0,
          timer: initialScore.timer
        };
      } catch (e) {
        console.error('Error parsing scoreJson:', e);
      }
    }

    // Update match with score including timer
    const finalMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreJson: JSON.stringify(scoreData)
      },
      include: {
        tournament: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        umpire: { select: { id: true, name: true, email: true } }
      }
    });

    // Add players and parsed score to response
    finalMatch.player1 = player1;
    finalMatch.player2 = player2;
    finalMatch.score = scoreData;

    res.json({
      success: true,
      message: 'Match started successfully',
      match: finalMatch
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

// Pause match timer
router.put('/:matchId/pause', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
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

    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      return res.status(404).json({ success: false, error: 'Match not found' });
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

// End match — optimised: respond immediately, run non-critical work in background
router.put('/:matchId/end', authenticate, async (req, res) => {
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
    if (match.parentMatchId) {
      parentMatchPromise = prisma.match.findUnique({ where: { id: match.parentMatchId } });
    } else if (match.stage === 'KNOCKOUT' && match.round > 1) {
      parentMatchPromise = prisma.match.findFirst({
        where: {
          tournamentId: match.tournamentId,
          categoryId: match.categoryId,
          round: match.round - 1,
          matchNumber: Math.ceil(match.matchNumber / 2),
          stage: 'KNOCKOUT'
        }
      });
    }

    const [player1, player2, parentMatch, updatedMatch] = await Promise.all([
      isGuestId(match.player1Id) ? Promise.resolve(null) : prisma.user.findUnique({ where: { id: match.player1Id }, select: { id: true, name: true } }),
      isGuestId(match.player2Id) ? Promise.resolve(null) : prisma.user.findUnique({ where: { id: match.player2Id }, select: { id: true, name: true } }),
      parentMatchPromise,
      // ── 4. Mark match COMPLETED ──────────────────────────────────────────────
      prisma.match.update({
        where: { id: matchId },
        data: { status: 'COMPLETED', winnerId, completedAt: new Date(), scoreJson: JSON.stringify(finalScore), updatedAt: new Date() },
        include: { tournament: true, category: true }
      })
    ]);

    const winner = winnerId === match.player1Id ? player1 : player2;
    const loser  = winnerId === match.player1Id ? player2 : player1;

    // ── 5. Advance winner to next round (critical — draw page needs this) ──────
    if (parentMatch) {
      const winnerPos = match.winnerPosition || (match.matchNumber % 2 === 1 ? 'player1' : 'player2');
      const advanceData = winnerPos === 'player1' ? { player1Id: winnerId } : { player2Id: winnerId };
      const bothReady   = winnerPos === 'player1' ? !!parentMatch.player2Id : !!parentMatch.player1Id;
      if (bothReady) advanceData.status = 'READY';
      await prisma.match.update({ where: { id: parentMatch.id }, data: advanceData });
    }

    // ── 6. RESPOND TO CLIENT — everything below is non-critical ───────────────
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
            targetGroup.participants.forEach(p => { p.played = 0; p.wins = 0; p.losses = 0; p.points = 0; });
            groupMatches.forEach(m => {
              const p1 = targetGroup.participants.find(p => p.id === m.player1Id);
              const p2 = targetGroup.participants.find(p => p.id === m.player2Id);
              if (!p1 || !p2) return;
              p1.played++; p2.played++;
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
          // Mark completed match
          for (const round of rounds) {
            const mib = round.matches?.find(m => m.matchNumber === match.matchNumber);
            if (mib) { mib.status = 'completed'; mib.winner = { id: winnerId, name: winnerName }; mib.winnerId = winnerId; mib.score = finalScore; break; }
          }
          // Advance winner in bracket JSON
          if (parentMatch) {
            for (const round of rounds) {
              const pmib = round.matches?.find(m => m.matchNumber === parentMatch.matchNumber);
              if (pmib) {
                const wp = match.winnerPosition || (match.matchNumber % 2 === 1 ? 'player1' : 'player2');
                pmib[wp] = { id: winnerId, name: winnerName };
                if (pmib.player1 && pmib.player2) pmib.status = 'ready';
                break;
              }
            }
          }
          await prisma.draw.update({ where: { tournamentId_categoryId: { tournamentId: match.tournamentId, categoryId: match.categoryId } }, data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() } });
        }
      } catch (bracketErr) {
        console.error('Background bracket JSON update error:', bracketErr);
      }
    };

    runBackground(); // intentionally not awaited

  } catch (error) {
    console.error('Error ending match:', error);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to end match' });
  }
});

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

// Complete match
router.post('/:matchId/complete', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, scoreData } = req.body;
    const userId = req.user.userId || req.user.id;
    
    // 🔍 DEBUG: Log match completion request
    console.log(`\n🏁 Match Complete Request (POST) - Match ${matchId}`);
    console.log(`   Winner ID: ${winnerId}`);
    console.log(`   Has scoreData: ${!!scoreData}`);
    console.log(`   scoreData.sets: ${scoreData?.sets ? JSON.stringify(scoreData.sets) : 'MISSING'}`);
    
    // ⚠️ VALIDATION: Ensure scoreData is provided
    if (!scoreData || !scoreData.sets || !Array.isArray(scoreData.sets) || scoreData.sets.length === 0) {
      console.error(`❌ Match ${matchId} - Cannot complete without score data!`);
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot complete match without score data. Please ensure all sets are recorded.' 
      });
    }

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

    const scoreJsonString = JSON.stringify(scoreData);
    console.log(`   Saving scoreJson (${scoreJsonString.length} chars): ${scoreJsonString.substring(0, 100)}...`);
    
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        winnerId,
        scoreJson: scoreJsonString,
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Match ${matchId} completed successfully with scoreJson saved`);

    // WINNER ADVANCEMENT: Update tournament progression (advance winner to next round)
    if (match.parentMatchId && match.winnerPosition) {
      const updateData = {};
      if (match.winnerPosition === 'player1') {
        updateData.player1Id = winnerId;
      } else {
        updateData.player2Id = winnerId;
      }

      // Check if parent match now has both players
      const parentMatch = await prisma.match.findUnique({
        where: { id: match.parentMatchId }
      });

      if (parentMatch) {
        const bothPlayersReady = 
          (match.winnerPosition === 'player1' && parentMatch.player2Id) ||
          (match.winnerPosition === 'player2' && parentMatch.player1Id);

        if (bothPlayersReady) {
          updateData.status = 'READY'; // Both players assigned, match ready to start
        }

        await prisma.match.update({
          where: { id: match.parentMatchId },
          data: updateData
        });
        
        console.log(`✅ Winner ${winnerId} advanced to next round${updateData.status === 'READY' ? ' (match now READY)' : ' (waiting for opponent)'}`);
      }
    }

    // Check if this is the final match
    const isFinal = match.round === 1 && !match.parentMatchId;
    if (isFinal) {
      const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;
      await prisma.category.update({
        where: { id: match.categoryId },
        data: {
          winnerId: winnerId,
          runnerUpId: loserId,
          status: 'completed'
        }
      });
      console.log(`🏆 Finals completed! Winner: ${winnerId}, Runner-up: ${loserId}`);
    }

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
// Assign umpire to match - calls controller function that sends notification
router.put('/:matchId/umpire', authenticate, assignUmpire);

// Assign umpire to match (POST version for compatibility) - calls controller function
router.post('/:matchId/assign-umpire', authenticate, assignUmpire);

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