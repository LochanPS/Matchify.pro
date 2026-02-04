import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';

/**
 * Tournament Points System
 * 
 * Points awarded based on tournament placement:
 * - Winner: 10 points
 * - Runner-up: 8 points
 * - Semi-finalists: 6 points
 * - Quarter-finalists: 4 points
 * - Participation: 2 points
 */

class TournamentPointsService {
  
  /**
   * Award points to players based on their tournament placement
   * @param {string} tournamentId - Tournament ID
   * @param {string} categoryId - Category ID
   */
  async awardTournamentPoints(tournamentId, categoryId) {
    try {
      console.log(`🏆 Awarding tournament points for category ${categoryId}`);

      // Get category with winner and runner-up
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
        include: {
          tournament: {
            select: { name: true }
          }
        }
      });

      if (!category) {
        console.log('❌ Category not found');
        return;
      }

      // Get all matches for this category to determine placements
      const matches = await prisma.match.findMany({
        where: {
          tournamentId,
          categoryId,
          status: 'COMPLETED'
        },
        orderBy: { round: 'asc' }
      });

      // Get all registrations (for participation points)
      const registrations = await prisma.registration.findMany({
        where: {
          tournamentId,
          categoryId,
          status: 'confirmed'
        },
        select: {
          userId: true,
          partnerId: true
        }
      });

      // Collect all unique player IDs
      const allPlayerIds = new Set();
      registrations.forEach(reg => {
        allPlayerIds.add(reg.userId);
        if (reg.partnerId) allPlayerIds.add(reg.partnerId);
      });

      // Determine placements
      const placements = this.determinePlacements(matches, category);

      // Award points
      const pointsAwarded = [];

      // Winner (10 points)
      if (placements.winner) {
        await this.awardPoints(placements.winner, 10, tournamentId, categoryId, 'WINNER');
        pointsAwarded.push({ userId: placements.winner, points: 10, placement: 'Winner' });
        allPlayerIds.delete(placements.winner);
      }

      // Runner-up (8 points)
      if (placements.runnerUp) {
        await this.awardPoints(placements.runnerUp, 8, tournamentId, categoryId, 'RUNNER_UP');
        pointsAwarded.push({ userId: placements.runnerUp, points: 8, placement: 'Runner-up' });
        allPlayerIds.delete(placements.runnerUp);
      }

      // Semi-finalists (6 points each)
      for (const playerId of placements.semiFinalists) {
        await this.awardPoints(playerId, 6, tournamentId, categoryId, 'SEMI_FINALIST');
        pointsAwarded.push({ userId: playerId, points: 6, placement: 'Semi-finalist' });
        allPlayerIds.delete(playerId);
      }

      // Quarter-finalists (4 points each)
      for (const playerId of placements.quarterFinalists) {
        await this.awardPoints(playerId, 4, tournamentId, categoryId, 'QUARTER_FINALIST');
        pointsAwarded.push({ userId: playerId, points: 4, placement: 'Quarter-finalist' });
        allPlayerIds.delete(playerId);
      }

      // Participation (2 points for everyone else)
      for (const playerId of allPlayerIds) {
        await this.awardPoints(playerId, 2, tournamentId, categoryId, 'PARTICIPATION');
        pointsAwarded.push({ userId: playerId, points: 2, placement: 'Participant' });
      }

      console.log(`✅ Points awarded to ${pointsAwarded.length} players`);
      console.log('Points breakdown:', pointsAwarded);

      return pointsAwarded;

    } catch (error) {
      console.error('❌ Error awarding tournament points:', error);
      throw error;
    }
  }

  /**
   * Determine player placements from matches
   */
  determinePlacements(matches, category) {
    const placements = {
      winner: null,
      runnerUp: null,
      semiFinalists: [],
      quarterFinalists: []
    };

    // Winner and Runner-up from category
    if (category.winnerId) {
      placements.winner = category.winnerId;
    }
    if (category.runnerUpId) {
      placements.runnerUp = category.runnerUpId;
    }

    // Find semi-finalists (losers of semi-final matches, round 2)
    const semiFinalMatches = matches.filter(m => m.round === 2 && m.status === 'COMPLETED');
    semiFinalMatches.forEach(match => {
      const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      if (loserId && !placements.semiFinalists.includes(loserId)) {
        placements.semiFinalists.push(loserId);
      }
    });

    // Find quarter-finalists (losers of quarter-final matches, round 3)
    const quarterFinalMatches = matches.filter(m => m.round === 3 && m.status === 'COMPLETED');
    quarterFinalMatches.forEach(match => {
      const loserId = match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      if (loserId && !placements.quarterFinalists.includes(loserId)) {
        placements.quarterFinalists.push(loserId);
      }
    });

    return placements;
  }

  /**
   * Award points to a specific player
   */
  async awardPoints(userId, points, tournamentId, categoryId, placement) {
    try {
      // Count this user's confirmed tournaments
      const tournamentsPlayed = await prisma.registration.count({
        where: {
          userId,
          status: 'confirmed'
        }
      });

      // Count this user's completed matches
      const completedMatches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: userId },
            { player2Id: userId }
          ],
          status: 'COMPLETED'
        }
      });

      let matchesWon = 0;
      let matchesLost = 0;

      completedMatches.forEach(match => {
        if (match.winnerId === userId) {
          matchesWon++;
        } else if (match.winnerId) {
          matchesLost++;
        }
      });

      // Update user's total points AND stats
      await prisma.user.update({
        where: { id: userId },
        data: {
          totalPoints: { increment: points },
          tournamentsPlayed: tournamentsPlayed,
          matchesWon: matchesWon,
          matchesLost: matchesLost
        }
      });

      // Update player profile if exists
      const playerProfile = await prisma.playerProfile.findUnique({
        where: { userId }
      });

      if (playerProfile) {
        await prisma.playerProfile.update({
          where: { userId },
          data: {
            matchifyPoints: { increment: points },
            tournamentsPlayed: tournamentsPlayed,
            matchesWon: matchesWon,
            matchesLost: matchesLost
          }
        });
      } else {
        // Create player profile if doesn't exist
        await prisma.playerProfile.create({
          data: {
            userId,
            matchifyPoints: points,
            tournamentsPlayed: tournamentsPlayed,
            matchesWon: matchesWon,
            matchesLost: matchesLost
          }
        });
      }

      console.log(`✅ Awarded ${points} points to user ${userId} for ${placement}`);
      console.log(`   Stats: ${tournamentsPlayed} tournaments | ${matchesWon}W-${matchesLost}L`);

      // Create a notification for the player
      await prisma.notification.create({
        data: {
          userId,
          type: 'POINTS_AWARDED',
          title: '🏆 Tournament Points Awarded!',
          message: `You earned ${points} points for ${this.getPlacementText(placement)}!`,
          data: JSON.stringify({
            tournamentId,
            categoryId,
            points,
            placement
          })
        }
      });

      console.log(`✅ Awarded ${points} points to user ${userId} for ${placement}`);

    } catch (error) {
      console.error(`❌ Error awarding points to user ${userId}:`, error);
    }
  }

  /**
   * Get human-readable placement text
   */
  getPlacementText(placement) {
    const texts = {
      'WINNER': 'winning the tournament',
      'RUNNER_UP': 'being the runner-up',
      'SEMI_FINALIST': 'reaching the semi-finals',
      'QUARTER_FINALIST': 'reaching the quarter-finals',
      'PARTICIPATION': 'participating in the tournament'
    };
    return texts[placement] || 'participating';
  }

  /**
   * Get leaderboard with geographical filters
   * @param {number} limit - Number of players to return
   * @param {string} scope - 'city', 'state', or 'country'
   * @param {string} city - City filter
   * @param {string} state - State filter
   */
  async getLeaderboard(limit = 100, scope = 'country', city = null, state = null) {
    try {
      console.log('🔍 Fetching leaderboard:', { limit, scope, city, state });
      
      // Build where clause based on scope - SHOW ALL USERS
      const whereClause = {};

      if (scope === 'city' && city) {
        whereClause.city = city;
      } else if (scope === 'state' && state) {
        whereClause.state = state;
      }
      // 'country' scope has no additional filter (all users in India)

      console.log('🔍 Where clause:', JSON.stringify(whereClause, null, 2));

      const players = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          city: true,
          state: true,
          totalPoints: true,
          tournamentsPlayed: true,
          matchesWon: true,
          matchesLost: true,
          playerProfile: {
            select: {
              matchifyPoints: true,
              tournamentsPlayed: true,
              matchesWon: true,
              matchesLost: true
            }
          }
        },
        orderBy: [
          { totalPoints: 'desc' },
          { name: 'asc' }
        ],
        take: limit
      });

      console.log(`✅ Found ${players.length} players for leaderboard`);

      // Add rank to each player
      const leaderboard = players.map((player, index) => ({
        rank: index + 1,
        ...player,
        winRate: player.matchesWon + player.matchesLost > 0 
          ? ((player.matchesWon / (player.matchesWon + player.matchesLost)) * 100).toFixed(1)
          : 0
      }));

      return leaderboard;

    } catch (error) {
      console.error('❌ Error fetching leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get player's rank and stats with geographical context
   * Returns ranks for city, state, and country
   */
  async getPlayerRankWithGeo(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          city: true,
          state: true,
          totalPoints: true,
          tournamentsPlayed: true,
          matchesWon: true,
          matchesLost: true
        }
      });

      if (!user) return null;

      const winRate = user.matchesWon + user.matchesLost > 0 
        ? ((user.matchesWon / (user.matchesWon + user.matchesLost)) * 100).toFixed(1)
        : 0;

      // Get country rank (all players)
      const countryRank = await prisma.user.count({
        where: {
          totalPoints: { gt: user.totalPoints }
        }
      }) + 1;

      // Get state rank (players in same state)
      const stateRank = user.state ? await prisma.user.count({
        where: {
          state: user.state,
          totalPoints: { gt: user.totalPoints }
        }
      }) + 1 : null;

      // Get city rank (players in same city)
      const cityRank = user.city ? await prisma.user.count({
        where: {
          city: user.city,
          totalPoints: { gt: user.totalPoints }
        }
      }) + 1 : null;

      return {
        ...user,
        winRate,
        ranks: {
          country: countryRank,
          state: stateRank,
          city: cityRank
        }
      };

    } catch (error) {
      console.error('❌ Error fetching player rank with geo:', error);
      throw error;
    }
  }

  /**
   * Get player's rank and stats (legacy - kept for compatibility)
   */
  async getPlayerRank(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          profilePhoto: true,
          totalPoints: true,
          tournamentsPlayed: true,
          matchesWon: true,
          matchesLost: true
        }
      });

      if (!user) return null;

      // Count how many players have more points
      const playersAbove = await prisma.user.count({
        where: {
          totalPoints: { gt: user.totalPoints }
        }
      });

      const rank = playersAbove + 1;

      return {
        ...user,
        rank,
        winRate: user.matchesWon + user.matchesLost > 0 
          ? ((user.matchesWon / (user.matchesWon + user.matchesLost)) * 100).toFixed(1)
          : 0
      };

    } catch (error) {
      console.error('❌ Error fetching player rank:', error);
      throw error;
    }
  }
}

export default new TournamentPointsService();
