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

    // Get all matches for this category
    const matches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
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
          // Reset status
          status: 'PENDING',
          
          // Clear winner
          winnerId: null,
          
          // Clear scores
          scoreJson: null,
          
          // Clear times
          startedAt: null,
          completedAt: null,
          
          // Clear umpire and court
          umpireId: null,
          courtNumber: null,
          
          // For non-first-round matches, clear players (they'll be filled by winners)
          ...(isFirstRound ? {} : {
            player1Id: null,
            player2Id: null
          }),
          
          updatedAt: new Date()
        }
      });
    }

    console.log(`✅ Restarted ${matches.length} matches for category ${category.name}`);
    console.log(`   - First round matches: ${firstRoundMatches.length} (players preserved)`);
    console.log(`   - Other matches: ${matches.length - firstRoundMatches.length} (players cleared)`);

    // Reset Round Robin standings if applicable
    const draw = await prisma.draw.findUnique({
      where: { tournamentId_categoryId: { tournamentId, categoryId } }
    });

    if (draw) {
      const bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;
      
      if (bracketJson.format === 'ROUND_ROBIN' || bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
        // Reset all group standings
        if (bracketJson.groups) {
          bracketJson.groups.forEach(group => {
            group.participants.forEach(participant => {
              participant.played = 0;
              participant.wins = 0;
              participant.losses = 0;
              participant.points = 0;
            });
          });

          // Update the draw with reset standings
          await prisma.draw.update({
            where: { tournamentId_categoryId: { tournamentId, categoryId } },
            data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() }
          });

          console.log(`✅ Reset Round Robin standings for all groups`);
        }
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
