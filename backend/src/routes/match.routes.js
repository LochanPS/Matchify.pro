import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { assignUmpire } from '../controllers/match.controller.js';

const router = express.Router();

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
      },
      include: {
        tournament: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        umpire: { select: { id: true, name: true, email: true } }
      }
    });

    // Fetch players separately since they're not relations
    let player1 = null;
    let player2 = null;
    
    if (updatedMatch.player1Id) {
      player1 = await prisma.user.findUnique({
        where: { id: updatedMatch.player1Id },
        select: { id: true, name: true, email: true, profilePhoto: true }
      });
    }
    
    if (updatedMatch.player2Id) {
      player2 = await prisma.user.findUnique({
        where: { id: updatedMatch.player2Id },
        select: { id: true, name: true, email: true, profilePhoto: true }
      });
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

// End match
router.put('/:matchId/end', authenticate, async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, finalScore } = req.body;
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

    // Check authorization
    const userRoles = req.user.roles || [];
    const isAuthorized = 
      match.umpireId === userId ||
      match.tournament.organizerId === userId ||
      userRoles.includes('ADMIN');

    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Not authorized to end this match' });
    }

    // Calculate final duration if timer exists
    let totalDuration = null;
    if (finalScore && finalScore.timer && finalScore.timer.startedAt) {
      const startTime = new Date(finalScore.timer.startedAt).getTime();
      const endTime = Date.now();
      const totalPausedTime = finalScore.timer.totalPausedTime || 0;
      totalDuration = Math.floor((endTime - startTime - totalPausedTime) / 1000); // in seconds
    }

    // Update final score with completion time
    if (finalScore && finalScore.timer) {
      finalScore.timer.completedAt = new Date().toISOString();
      finalScore.timer.totalDuration = totalDuration;
      finalScore.timer.totalDurationFormatted = formatDuration(totalDuration);
    }

    // Get player details for notifications and stats
    const player1 = await prisma.user.findUnique({ where: { id: match.player1Id } });
    const player2 = await prisma.user.findUnique({ where: { id: match.player2Id } });
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;
    const winner = winnerId === match.player1Id ? player1 : player2;
    const loser = winnerId === match.player1Id ? player2 : player1;

    // Update match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        winnerId: winnerId,
        completedAt: new Date(),
        scoreJson: JSON.stringify(finalScore),
        updatedAt: new Date()
      },
      include: {
        tournament: true,
        category: true
      }
    });

    // 1. Update Player Statistics
    if (player1 && player2) {
      // Update winner stats
      await prisma.user.update({
        where: { id: winnerId },
        data: {
          matchesWon: { increment: 1 },
          tournamentsPlayed: { increment: 0 } // Will be updated when tournament ends
        }
      });

      // Update loser stats
      await prisma.user.update({
        where: { id: loserId },
        data: {
          matchesLost: { increment: 1 }
        }
      });
    }

    // 2. Advance Winner to Next Round (Update Bracket)
    if (match.parentMatchId) {
      const parentMatch = await prisma.match.findUnique({
        where: { id: match.parentMatchId }
      });

      if (parentMatch) {
        // Determine which position the winner should take in parent match
        const updateData = {};
        if (match.winnerPosition === 'player1') {
          updateData.player1Id = winnerId;
        } else if (match.winnerPosition === 'player2') {
          updateData.player2Id = winnerId;
        }

        // Update parent match with winner
        await prisma.match.update({
          where: { id: match.parentMatchId },
          data: updateData
        });
      }
    }

    // 3. Send Notifications
    try {
      // Determine round name for notifications
      const getRoundName = (round) => {
        if (round === 1) return 'Final';
        if (round === 2) return 'Semi Finals';
        if (round === 3) return 'Quarter Finals';
        if (round === 4) return 'Round of 16';
        return `Round ${round}`;
      };

      const roundName = getRoundName(match.round);
      const matchLabel = `${roundName} - Match #${match.matchNumber}`;

      // Get umpire details for organizer notification
      let umpireInfo = '';
      if (match.umpireId) {
        const umpire = await prisma.user.findUnique({
          where: { id: match.umpireId },
          select: { name: true }
        });
        umpireInfo = umpire ? `\nUmpire: ${umpire.name}` : '';
      }

      const courtInfo = match.courtNumber ? `\nCourt: ${match.courtNumber}` : '';

      // Notify winner
      await prisma.notification.create({
        data: {
          userId: winnerId,
          type: 'MATCH_WON',
          title: '🏆 Victory!',
          message: `Congratulations! You won your ${roundName} match in ${updatedMatch.tournament.name} - ${updatedMatch.category.name}`,
          data: JSON.stringify({
            matchId: match.id,
            tournamentId: match.tournamentId,
            categoryId: match.categoryId,
            score: finalScore,
            round: match.round,
            roundName: roundName
          })
        }
      });

      // Notify loser
      await prisma.notification.create({
        data: {
          userId: loserId,
          type: 'MATCH_LOST',
          title: 'Match Complete',
          message: `Your ${roundName} match in ${updatedMatch.tournament.name} - ${updatedMatch.category.name} has ended`,
          data: JSON.stringify({
            matchId: match.id,
            tournamentId: match.tournamentId,
            categoryId: match.categoryId,
            score: finalScore,
            round: match.round,
            roundName: roundName
          })
        }
      });

      // Notify organizer with detailed info
      await prisma.notification.create({
        data: {
          userId: updatedMatch.tournament.organizerId,
          type: 'MATCH_COMPLETED',
          title: 'Match Completed',
          message: `${matchLabel} completed: ${winner?.name} defeated ${loser?.name}${umpireInfo}${courtInfo}`,
          data: JSON.stringify({
            matchId: match.id,
            tournamentId: match.tournamentId,
            categoryId: match.categoryId,
            winnerId: winnerId,
            loserId: loserId,
            round: match.round,
            roundName: roundName,
            courtNumber: match.courtNumber,
            umpireId: match.umpireId
          })
        }
      });
    } catch (notifError) {
      console.error('Error sending notifications:', notifError);
      // Don't fail the request if notifications fail
    }

    // 4. Update Round Robin Standings (if applicable)
    try {
      const draw = await prisma.draw.findUnique({
        where: { tournamentId_categoryId: { tournamentId: match.tournamentId, categoryId: match.categoryId } }
      });
      
      if (draw) {
        const bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;
        
        if (bracketJson.format === 'ROUND_ROBIN' || bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
          console.log('🔍 Round Robin match completed, updating standings...');
          
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

            // Calculate new standings
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

            console.log(`✅ Updated standings for ${targetGroup.groupName}:`, targetGroup.participants.map(p => `${p.name}: ${p.points}pts (${p.wins}W-${p.losses}L)`));
          }
        }
      }
    } catch (standingsError) {
      console.error('❌ Error updating Round Robin standings:', standingsError);
      // Don't fail the request if standings update fails
    }

    res.json({
      success: true,
      message: 'Match ended successfully',
      match: updatedMatch,
      summary: {
        winner: winner?.name,
        loser: loser?.name,
        duration: finalScore?.timer?.totalDurationFormatted,
        finalScore: finalScore
      }
    });
  } catch (error) {
    console.error('Error ending match:', error);
    res.status(500).json({ success: false, error: 'Failed to end match' });
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