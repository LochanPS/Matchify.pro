/**
 * MatchLifecycleService - Manages match lifecycle during live tournaments
 * Handles: Umpire assignment, match start, scoring, completion, reset
 */

import prisma from '../../lib/prisma.js';
import MatchGenerator from './MatchGenerator.js';

class MatchLifecycleService {
  /**
   * Assign umpire to a match
   * Validation: Umpire cannot be a player in the match
   */
  async assignUmpire(matchId, umpireId, userId) {
    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true
      }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Verify organizer
    if (match.tournament.organizerId !== userId) {
      throw new Error('Only the organizer can assign umpires');
    }

    // Validate: Umpire cannot be a player in the match
    if (umpireId === match.player1Id || umpireId === match.player2Id) {
      throw new Error('Umpire cannot be a player in this match');
    }

    // Validate: Match must be READY
    if (match.status !== 'READY') {
      throw new Error(`Match must be READY to assign umpire. Current status: ${match.status}`);
    }

    // Assign umpire
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        umpireId,
        updatedAt: new Date()
      }
    });

    console.log(`✅ Umpire ${umpireId} assigned to Match ${matchId}`);

    return updatedMatch;
  }

  /**
   * Start a match
   * Sets status to IN_PROGRESS and records startedAt timestamp
   */
  async startMatch(matchId, umpireId, userId) {
    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true
      }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Verify organizer or umpire
    const isOrganizer = match.tournament.organizerId === userId;
    const isAssignedUmpire = match.umpireId === userId;

    if (!isOrganizer && !isAssignedUmpire) {
      throw new Error('Only the organizer or assigned umpire can start the match');
    }

    // Validate: Match must be READY
    if (match.status !== 'READY') {
      throw new Error(`Match must be READY to start. Current status: ${match.status}`);
    }

    // Validate: Both players must be present
    if (!match.player1Id || !match.player2Id) {
      throw new Error('Both players must be assigned before starting the match');
    }

    // Validate: Umpire cannot be a player
    if (umpireId === match.player1Id || umpireId === match.player2Id) {
      throw new Error('Umpire cannot be a player in this match');
    }

    // Start match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        umpireId,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`🏸 Match ${matchId} started by umpire ${umpireId}`);

    return updatedMatch;
  }

  /**
   * Update match score during play
   * Does not complete the match - just updates score
   */
  async updateScore(matchId, scoreJson, userId) {
    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true
      }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Verify organizer or umpire
    const isOrganizer = match.tournament.organizerId === userId;
    const isAssignedUmpire = match.umpireId === userId;

    if (!isOrganizer && !isAssignedUmpire) {
      throw new Error('Only the organizer or assigned umpire can update score');
    }

    // Validate: Match must be IN_PROGRESS
    if (match.status !== 'IN_PROGRESS') {
      throw new Error(`Match must be IN_PROGRESS to update score. Current status: ${match.status}`);
    }

    // Update score
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        scoreJson: JSON.stringify(scoreJson),
        updatedAt: new Date()
      }
    });

    console.log(`📊 Score updated for Match ${matchId}`);

    return updatedMatch;
  }

  /**
   * Complete a match
   * Records winner, final score, and triggers progression
   */
  async completeMatch(matchId, winnerId, scoreJson, userId) {
    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true
      }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Verify organizer or umpire
    const isOrganizer = match.tournament.organizerId === userId;
    const isAssignedUmpire = match.umpireId === userId;

    if (!isOrganizer && !isAssignedUmpire) {
      throw new Error('Only the organizer or assigned umpire can complete the match');
    }

    // Validate: Match must be IN_PROGRESS
    if (match.status !== 'IN_PROGRESS') {
      throw new Error(`Match must be IN_PROGRESS to complete. Current status: ${match.status}`);
    }

    // Validate: Winner must be one of the players
    if (winnerId !== match.player1Id && winnerId !== match.player2Id) {
      throw new Error('Winner must be one of the players in the match');
    }

    // Complete match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        scoreJson: JSON.stringify(scoreJson),
        status: 'COMPLETED',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log(`✅ Match ${matchId} completed. Winner: ${winnerId}`);

    // Trigger progression based on stage
    if (match.stage === 'KNOCKOUT') {
      console.log('🔄 Triggering knockout progression...');
      await MatchGenerator.advanceWinner(
        match.tournamentId,
        match.categoryId,
        match.matchIndex,
        winnerId
      );
    } else if (match.stage === 'GROUP') {
      console.log('📊 Group match completed. Standings will update automatically.');
    }

    return updatedMatch;
  }

  /**
   * Reset a match
   * Clears score, winner, and reverts status
   */
  async resetMatch(matchId, userId) {
    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true
      }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Verify organizer
    if (match.tournament.organizerId !== userId) {
      throw new Error('Only the organizer can reset matches');
    }

    // Determine new status
    const newStatus = (match.player1Id && match.player2Id) ? 'READY' : 'PENDING';

    // Reset match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId: null,
        scoreJson: null,
        status: newStatus,
        completedAt: null,
        updatedAt: new Date()
      }
    });

    console.log(`🔄 Match ${matchId} reset to ${newStatus}`);

    // Clear downstream progression if knockout
    if (match.stage === 'KNOCKOUT') {
      console.log('🧹 Clearing downstream matches...');
      await MatchGenerator.resetMatchResult(matchId);
    }

    return updatedMatch;
  }

  /**
   * Assign court number to a match
   */
  async assignCourt(matchId, courtNumber, userId) {
    // Get match
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: true
      }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Verify organizer
    if (match.tournament.organizerId !== userId) {
      throw new Error('Only the organizer can assign courts');
    }

    // Assign court
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        courtNumber,
        updatedAt: new Date()
      }
    });

    console.log(`🏟️ Court ${courtNumber} assigned to Match ${matchId}`);

    return updatedMatch;
  }

  /**
   * Get match details with full information
   */
  async getMatchDetails(matchId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            organizerId: true
          }
        },
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
      }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Get player details
    const playerIds = [match.player1Id, match.player2Id].filter(Boolean);
    const players = await this._getPlayerDetails(playerIds);

    return {
      ...match,
      player1: players.find(p => p.id === match.player1Id) || null,
      player2: players.find(p => p.id === match.player2Id) || null,
      winner: match.winnerId ? players.find(p => p.id === match.winnerId) : null,
      scoreJson: match.scoreJson ? JSON.parse(match.scoreJson) : null
    };
  }

  /**
   * Get matches with filters
   */
  async getMatches(tournamentId, categoryId, filters = {}) {
    const where = {
      tournamentId,
      categoryId
    };

    if (filters.stage) where.stage = filters.stage;
    if (filters.round) where.round = parseInt(filters.round);
    if (filters.status) where.status = filters.status;
    if (filters.groupIndex !== undefined) where.groupIndex = parseInt(filters.groupIndex);
    if (filters.courtNumber) where.courtNumber = parseInt(filters.courtNumber);

    const matches = await prisma.match.findMany({
      where,
      include: {
        umpire: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    return matches;
  }

  /**
   * Get available umpires for a tournament
   */
  async getAvailableUmpires(tournamentId) {
    // Get tournament umpires
    const tournamentUmpires = await prisma.tournamentUmpire.findMany({
      where: { tournamentId },
      include: {
        umpire: {
          select: {
            id: true,
            name: true,
            email: true,
            umpireCode: true
          }
        }
      }
    });

    return tournamentUmpires.map(tu => tu.umpire);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Get player details (handles both users and guests)
   */
  async _getPlayerDetails(playerIds) {
    const players = [];

    for (const playerId of playerIds) {
      if (playerId.startsWith('guest-')) {
        const registrationId = playerId.replace('guest-', '');
        const registration = await prisma.registration.findUnique({
          where: { id: registrationId },
          select: {
            id: true,
            guestName: true,
            guestEmail: true
          }
        });

        if (registration) {
          players.push({
            id: playerId,
            name: registration.guestName || 'Guest',
            email: registration.guestEmail,
            isGuest: true
          });
        }
      } else {
        const user = await prisma.user.findUnique({
          where: { id: playerId },
          select: {
            id: true,
            name: true,
            email: true
          }
        });

        if (user) {
          players.push({
            ...user,
            isGuest: false
          });
        }
      }
    }

    return players;
  }
}

export default new MatchLifecycleService();
