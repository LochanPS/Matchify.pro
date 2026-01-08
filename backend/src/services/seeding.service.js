import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class SeedingService {
  /**
   * Calculate Matchify Points seed score for a player
   * @param {String} userId - User ID
   * @returns {Number} - Seed score (higher is better)
   */
  async calculateSeedScore(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    // Matchify Points formula:
    // Base: Total Points from tournaments
    // Bonus: Win rate multiplier
    // Bonus: Tournament participation
    
    const basePoints = user.totalPoints || 0;
    const totalMatches = user.matchesWon + user.matchesLost;
    const winRate = totalMatches > 0 ? user.matchesWon / totalMatches : 0;
    const winRateBonus = winRate * 100; // 0-100 bonus points
    const participationBonus = (user.tournamentsPlayed || 0) * 10; // 10 points per tournament

    const seedScore = basePoints + winRateBonus + participationBonus;

    return Math.round(seedScore);
  }

  /**
   * Calculate seed scores for multiple players
   * @param {Array} userIds - Array of user IDs
   * @returns {Object} - Map of userId to seed score
   */
  async calculateSeedScores(userIds) {
    const scores = {};
    
    for (const userId of userIds) {
      scores[userId] = await this.calculateSeedScore(userId);
    }

    return scores;
  }
}

export default new SeedingService();
