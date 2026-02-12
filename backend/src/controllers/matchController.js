import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';

export const getUmpireMatches = async (req, res) => {
  try {
    const userRoles = req.user.roles || [];
    if (!userRoles.includes('UMPIRE')) {
      return res.status(403).json({ error: 'Umpire role required' });
    }

    const matches = await prisma.match.findMany({
      where: { umpireId: req.user.userId },
      include: {
        tournament: { select: { name: true, venue: true } },
        category: { select: { name: true, format: true } },
      },
      orderBy: { scheduledTime: 'asc' },
    });

    res.json({ matches });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
};

export const updateScore = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { scoreData } = req.body;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.umpireId !== req.user.userId) {
      return res.status(403).json({ error: 'Not your match' });
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { scoreJson: JSON.stringify(scoreData), status: 'IN_PROGRESS' },
    });

    res.json({ message: 'Score updated', match: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update score' });
  }
};

export const submitMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winnerId, finalScore } = req.body;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.umpireId !== req.user.userId) {
      return res.status(403).json({ error: 'Not your match' });
    }

    await prisma.match.update({
      where: { id: matchId },
      data: { 
        status: 'COMPLETED', 
        winnerId, 
        scoreJson: JSON.stringify(finalScore), 
        completedAt: new Date() 
      },
    });

    // Award points based on round
    const points = { 
      'FINAL': 100, 
      'SEMI_FINAL': 50, 
      'QUARTER_FINAL': 25 
    }[match.round] || 10;

    // Update winner's player profile (if exists)
    try {
      await prisma.playerProfile.update({
        where: { userId: winnerId },
        data: { 
          matchifyPoints: { increment: points }, 
          matchesWon: { increment: 1 } 
        },
      });
    } catch (error) {
      console.log('Player profile not found for winner, skipping points update');
    }

    // Update umpire statistics in User model
    try {
      const updatedUser = await prisma.user.update({
        where: { id: req.user.userId },
        data: { matchesUmpired: { increment: 1 } },
      });

      // Check if umpire should be verified (10+ matches)
      if (updatedUser.matchesUmpired >= 10 && !updatedUser.isVerifiedUmpire) {
        await prisma.user.update({
          where: { id: req.user.userId },
          data: { isVerifiedUmpire: true }
        });
        console.log(`✅ Umpire verified after ${updatedUser.matchesUmpired} matches`);
      }
    } catch (error) {
      console.error('Error updating umpire stats:', error);
    }

    res.json({ message: 'Match completed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit match' });
  }
};