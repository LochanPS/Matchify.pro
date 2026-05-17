import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';

/**
 * Restart draws - Reset all match data but keep draw structure and player assignments
 * POST /api/tournaments/:tournamentId/categories/:categoryId/draw/restart
 */
export const restartDraw = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.id || req.user.userId;

    // Verify tournament exists and user is the organizer
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
        error: 'Only the organizer can restart draws' 
      });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category || category.tournamentId !== tournamentId) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }

    // Get draw to check format
    const draw = await prisma.draw.findUnique({
      where: { tournamentId_categoryId: { tournamentId, categoryId } }
    });

    const bracketJson = draw
      ? (typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson)
      : null;

    const isHybrid = bracketJson?.format === 'ROUND_ROBIN_KNOCKOUT';

    if (isHybrid) {
      // ── ROUND_ROBIN_KNOCKOUT: only restart knockout stage ──────────────────
      const knockoutMatches = await prisma.match.findMany({
        where: { tournamentId, categoryId, stage: 'KNOCKOUT' },
        orderBy: [{ round: 'desc' }, { matchNumber: 'asc' }]
      });

      if (knockoutMatches.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No knockout matches found to restart'
        });
      }

      // Find the highest round (= first KO round, fewest players advanced)
      const maxKoRound = Math.max(...knockoutMatches.map(m => m.round));

      for (const match of knockoutMatches) {
        const isFirstKoRound = match.round === maxKoRound;
        await prisma.match.update({
          where: { id: match.id },
          data: {
            status: 'PENDING',
            winnerId: null,
            scoreJson: null,
            startedAt: null,
            completedAt: null,
            umpireId: null,
            courtNumber: null,
            // First KO round keeps players (they come from group advancement);
            // later rounds clear players (they come from match winners)
            ...(!isFirstKoRound ? { player1Id: null, player2Id: null } : {}),
            updatedAt: new Date()
          }
        });
      }

      // Reset bracketJson knockout rounds — null out players, set pending
      if (bracketJson?.knockout?.rounds) {
        bracketJson.knockout.rounds.forEach(round => {
          round.matches.forEach(match => {
            // Only clear non-first-round slots in bracketJson too
            // (first KO round slots were populated by continueToKnockout — keep them)
            match.winner = null;
          });
        });

        await prisma.draw.update({
          where: { tournamentId_categoryId: { tournamentId, categoryId } },
          data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() }
        });
      }

      console.log(`✅ Restarted ${knockoutMatches.length} KNOCKOUT matches for category ${category.name} (group stage preserved)`);

      return res.json({
        success: true,
        message: 'Knockout stage restarted successfully. Group results preserved.',
        stats: {
          totalMatches: knockoutMatches.length,
          firstRoundMatches: knockoutMatches.filter(m => m.round === maxKoRound).length,
          resetMatches: knockoutMatches.filter(m => m.round < maxKoRound).length
        }
      });
    }

    // ── Pure KNOCKOUT / ROUND_ROBIN: restart everything ───────────────────────
    const matches = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      orderBy: [{ round: 'desc' }, { matchNumber: 'asc' }]
    });

    if (matches.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No matches found to restart'
      });
    }

    // Get first round matches to preserve player assignments
    const maxRound = Math.max(...matches.map(m => m.round));
    const firstRoundMatches = matches.filter(m => m.round === maxRound);

    // Reset all matches
    for (const match of matches) {
      const isFirstRound = match.round === maxRound;

      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: 'PENDING',
          winnerId: null,
          scoreJson: null,
          startedAt: null,
          completedAt: null,
          umpireId: null,
          courtNumber: null,
          ...(isFirstRound ? {} : { player1Id: null, player2Id: null }),
          updatedAt: new Date()
        }
      });
    }

    console.log(`✅ Restarted ${matches.length} matches for category ${category.name}`);
    console.log(`   - First round matches: ${firstRoundMatches.length} (players preserved)`);
    console.log(`   - Other matches: ${matches.length - firstRoundMatches.length} (players cleared)`);

    // Reset Round Robin standings
    if (bracketJson?.format === 'ROUND_ROBIN') {
      if (bracketJson.groups) {
        bracketJson.groups.forEach(group => {
          group.participants.forEach(participant => {
            participant.played = 0;
            participant.wins = 0;
            participant.losses = 0;
            participant.points = 0;
          });
        });

        await prisma.draw.update({
          where: { tournamentId_categoryId: { tournamentId, categoryId } },
          data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() }
        });

        console.log(`✅ Reset Round Robin standings for all groups`);
      }
    }

    res.json({
      success: true,
      message: 'Draw restarted successfully',
      stats: {
        totalMatches: matches.length,
        firstRoundMatches: firstRoundMatches.length,
        resetMatches: matches.length - firstRoundMatches.length
      }
    });
   
  } catch (error) {
    console.error('Restart draw error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to restart draw',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
