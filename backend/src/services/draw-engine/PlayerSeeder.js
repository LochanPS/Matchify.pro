/**
 * PlayerSeeder - Handles player seeding and ranking
 * Calculates seeds based on player statistics and tournament history
 */

import prisma from '../../lib/prisma.js';

class PlayerSeeder {
  /**
   * Seed players for a tournament category
   */
  async seedPlayers(registrations) {
    const playersWithScores = [];

    for (const registration of registrations) {
      const player = await this._getPlayerData(registration);
      const seedScore = await this._calculateSeedScore(player);

      playersWithScores.push({
        id: player.id,
        registrationId: registration.id,
        name: player.name,
        email: player.email,
        seedScore,
        seed: 0 // Will be assigned after sorting
      });
    }

    // Sort by seed score (highest first)
    playersWithScores.sort((a, b) => b.seedScore - a.seedScore);

    // Assign seeds
    playersWithScores.forEach((player, index) => {
      player.seed = index + 1;
    });

    return playersWithScores;
  }

  /**
   * Calculate seed score for a player
   */
  async _calculateSeedScore(player) {
    // Guest players get default score
    if (player.isGuest) {
      return 0;
    }

    // Get user statistics
    const user = await prisma.user.findUnique({
      where: { id: player.id },
      select: {
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true
      }
    });

    if (!user) {
      return 0;
    }

    // Calculate seed score components
    const basePoints = user.totalPoints || 0;
    const totalMatches = user.matchesWon + user.matchesLost;
    const winRate = totalMatches > 0 ? user.matchesWon / totalMatches : 0;
    const winRateBonus = winRate * 100;
    const participationBonus = (user.tournamentsPlayed || 0) * 10;

    return Math.round(basePoints + winRateBonus + participationBonus);
  }

  /**
   * Get player data from registration
   */
  async _getPlayerData(registration) {
    // User registration
    if (registration.userId) {
      const user = await prisma.user.findUnique({
        where: { id: registration.userId },
        select: {
          id: true,
          name: true,
          email: true
        }
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        isGuest: false
      };
    }

    // Guest registration
    return {
      id: `guest-${registration.id}`,
      name: registration.guestName || 'Guest Player',
      email: registration.guestEmail || null,
      isGuest: true
    };
  }

  /**
   * Get confirmed registrations for a category
   */
  async getConfirmedRegistrations(tournamentId, categoryId) {
    return await prisma.registration.findMany({
      where: {
        tournamentId,
        categoryId,
        status: 'confirmed',
        paymentStatus: 'completed'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }
}

export default new PlayerSeeder();
