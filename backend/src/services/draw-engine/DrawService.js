/**
 * DrawService - Main service orchestrating draw operations
 * Coordinates DrawEngine, MatchGenerator, and PlayerSeeder
 */

import DrawEngine from './DrawEngine.js';
import MatchGenerator from './MatchGenerator.js';
import PlayerSeeder from './PlayerSeeder.js';
import prisma from '../../lib/prisma.js';

class DrawService {
  /**
   * Create a new EMPTY draw structure (no players assigned yet)
   */
  async createDraw(tournamentId, categoryId, format, options = {}) {
    const { bracketSize } = options;

    if (!bracketSize || bracketSize < 2) {
      throw new Error('Bracket size must be at least 2');
    }

    // Generate EMPTY draw structure (no players)
    const draw = DrawEngine.generateDraw({
      format,
      bracketSize,
      options
    });

    // Save draw to database
    const savedDraw = await prisma.draw.upsert({
      where: {
        tournamentId_categoryId: {
          tournamentId,
          categoryId
        }
      },
      update: {
        format,
        bracketJson: JSON.stringify(draw),
        updatedAt: new Date()
      },
      create: {
        tournamentId,
        categoryId,
        format,
        bracketJson: JSON.stringify(draw)
      }
    });

    // Delete old matches
    await MatchGenerator.deleteMatches(tournamentId, categoryId);

    // Create EMPTY match records (no players assigned)
    await MatchGenerator.createMatchesFromDraw(draw, tournamentId, categoryId);

    return {
      draw: savedDraw,
      structure: draw
    };
  }

  /**
   * Assign players to draw slots
   * @param {string} tournamentId
   * @param {string} categoryId
   * @param {Array} playerAssignments - Array of {slotIndex, playerId, seed}
   */
  async assignPlayers(tournamentId, categoryId, playerAssignments) {
    // Get draw structure
    const drawData = await this.getDraw(tournamentId, categoryId);
    if (!drawData) {
      throw new Error('Draw not found');
    }

    const { structure, matches } = drawData;

    // Update matches based on player assignments
    if (structure.format === 'KNOCKOUT') {
      await this._assignPlayersToKnockout(
        tournamentId,
        categoryId,
        playerAssignments,
        matches
      );
    } else if (structure.format === 'ROUND_ROBIN') {
      await this._assignPlayersToRoundRobin(
        tournamentId,
        categoryId,
        playerAssignments,
        matches,
        structure
      );
    } else if (structure.format === 'ROUND_ROBIN_KNOCKOUT') {
      await this._assignPlayersToHybrid(
        tournamentId,
        categoryId,
        playerAssignments,
        matches,
        structure
      );
    }

    return await this.getDraw(tournamentId, categoryId);
  }

  /**
   * Auto-assign all confirmed players to available slots
   */
  async autoAssignAllPlayers(tournamentId, categoryId) {
    // Get confirmed registrations
    const registrations = await PlayerSeeder.getConfirmedRegistrations(
      tournamentId,
      categoryId
    );

    if (registrations.length === 0) {
      throw new Error('No confirmed players to assign');
    }

    // Seed players
    const seededPlayers = await PlayerSeeder.seedPlayers(registrations);

    // Create player assignments (sequential by seed)
    const playerAssignments = seededPlayers.map((player, index) => ({
      slotIndex: index,
      playerId: player.id,
      seed: player.seed,
      name: player.name
    }));

    return await this.assignPlayers(tournamentId, categoryId, playerAssignments);
  }

  /**
   * Shuffle players randomly
   */
  async shufflePlayers(tournamentId, categoryId) {
    const drawData = await this.getDraw(tournamentId, categoryId);
    if (!drawData) {
      throw new Error('Draw not found');
    }

    // Get all assigned players
    const matches = drawData.matches;
    const playerIds = new Set();
    
    matches.forEach(match => {
      if (match.player1Id) playerIds.add(match.player1Id);
      if (match.player2Id) playerIds.add(match.player2Id);
    });

    if (playerIds.size === 0) {
      throw new Error('No players assigned to shuffle');
    }

    // Shuffle player IDs
    const shuffledIds = Array.from(playerIds).sort(() => Math.random() - 0.5);

    // Create new assignments
    const playerAssignments = shuffledIds.map((playerId, index) => ({
      slotIndex: index,
      playerId,
      seed: index + 1
    }));

    return await this.assignPlayers(tournamentId, categoryId, playerAssignments);
  }

  /**
   * Get draw for a category
   */
  async getDraw(tournamentId, categoryId) {
    const draw = await prisma.draw.findUnique({
      where: {
        tournamentId_categoryId: {
          tournamentId,
          categoryId
        }
      }
    });

    if (!draw) {
      return null;
    }

    // Get matches
    const matches = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      orderBy: { matchIndex: 'asc' }
    });

    return {
      draw,
      structure: JSON.parse(draw.bracketJson),
      matches
    };
  }

  /**
   * Delete draw
   */
  async deleteDraw(tournamentId, categoryId) {
    // Delete matches
    await MatchGenerator.deleteMatches(tournamentId, categoryId);

    // Delete draw
    await prisma.draw.delete({
      where: {
        tournamentId_categoryId: {
          tournamentId,
          categoryId
        }
      }
    });
  }

  /**
   * Complete a match and advance winner
   */
  async completeMatch(matchId, winnerId, scoreJson) {
    // Update match
    const match = await MatchGenerator.updateMatchResult(
      matchId,
      winnerId,
      scoreJson
    );

    return match;
  }

  /**
   * Reset a match result and clear downstream progression
   */
  async resetMatch(matchId) {
    const match = await MatchGenerator.resetMatchResult(matchId);
    return match;
  }

  /**
   * Continue to knockout stage (for hybrid format)
   * @deprecated Use arrangeKnockout instead
   */
  async continueToKnockout(tournamentId, categoryId, qualifiedPlayerIds) {
    return await this.arrangeKnockout(tournamentId, categoryId, qualifiedPlayerIds);
  }

  /**
   * Get group standings (for round robin)
   */
  async getGroupStandings(tournamentId, categoryId, groupIndex) {
    return await MatchGenerator.calculateGroupStandings(
      tournamentId,
      categoryId,
      groupIndex
    );
  }

  /**
   * Get all group standings
   */
  async getAllGroupStandings(tournamentId, categoryId) {
    return await MatchGenerator.getAllGroupStandings(tournamentId, categoryId);
  }

  /**
   * Arrange knockout stage with qualified players
   * For hybrid format after group stage completes
   */
  async arrangeKnockout(tournamentId, categoryId, qualifiedPlayerIds) {
    const drawData = await this.getDraw(tournamentId, categoryId);
    if (!drawData) {
      throw new Error('Draw not found');
    }

    const { structure } = drawData;

    if (structure.format !== 'ROUND_ROBIN_KNOCKOUT') {
      throw new Error('Not a hybrid format');
    }

    // Get player details
    const players = [];
    for (const playerId of qualifiedPlayerIds) {
      if (playerId.startsWith('guest-')) {
        const registrationId = playerId.replace('guest-', '');
        const registration = await prisma.registration.findUnique({
          where: { id: registrationId }
        });
        players.push({
          id: playerId,
          name: registration?.guestName || 'Guest',
          seed: players.length + 1
        });
      } else {
        const user = await prisma.user.findUnique({
          where: { id: playerId },
          select: { id: true, name: true }
        });
        players.push({
          id: user.id,
          name: user.name,
          seed: players.length + 1
        });
      }
    }

    // Create player assignments for knockout stage
    const playerAssignments = players.map((player, index) => ({
      slotIndex: index,
      playerId: player.id,
      seed: player.seed,
      name: player.name
    }));

    // Get knockout matches
    const knockoutMatches = await MatchGenerator.getMatchesByStage(
      tournamentId,
      categoryId,
      'KNOCKOUT'
    );

    // Assign players to knockout bracket
    await this._assignPlayersToKnockout(
      tournamentId,
      categoryId,
      playerAssignments,
      knockoutMatches
    );

    return players;
  }

  /**
   * Auto-arrange knockout with top players from each group
   */
  async autoArrangeKnockout(tournamentId, categoryId, advancePerGroup) {
    const qualifiedPlayers = await MatchGenerator.getQualifiedPlayers(
      tournamentId,
      categoryId,
      advancePerGroup
    );

    const playerIds = qualifiedPlayers.map(p => p.playerId);
    
    return await this.arrangeKnockout(tournamentId, categoryId, playerIds);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Assign players to knockout matches
   */
  async _assignPlayersToKnockout(tournamentId, categoryId, playerAssignments, matches) {
    // Get first round matches
    const firstRoundMatches = matches.filter(m => 
      m.stage === 'KNOCKOUT' && m.round === Math.max(...matches.map(m => m.round))
    ).sort((a, b) => a.matchNumber - b.matchNumber);

    // Create player map by slot index
    const playerMap = new Map();
    playerAssignments.forEach(assignment => {
      playerMap.set(assignment.slotIndex, assignment);
    });

    // Assign players to first round matches and handle BYEs
    for (let i = 0; i < firstRoundMatches.length; i++) {
      const match = firstRoundMatches[i];
      const slot1Index = i * 2;
      const slot2Index = i * 2 + 1;

      const player1 = playerMap.get(slot1Index);
      const player2 = playerMap.get(slot2Index);

      const updateData = {
        player1Id: player1?.playerId || null,
        player2Id: player2?.playerId || null,
        player1Seed: player1?.seed || null,
        player2Seed: player2?.seed || null
      };

      // Determine status and handle BYEs
      if (player1 && player2) {
        // Both players present - match is READY
        updateData.status = 'READY';
      } else if (player1 && !player2) {
        // Player 1 gets BYE
        updateData.status = 'COMPLETED';
        updateData.winnerId = player1.playerId;
        updateData.completedAt = new Date();
        console.log(`🎫 BYE: ${player1.playerId} advances from Match ${match.matchIndex}`);
      } else if (!player1 && player2) {
        // Player 2 gets BYE
        updateData.status = 'COMPLETED';
        updateData.winnerId = player2.playerId;
        updateData.completedAt = new Date();
        console.log(`🎫 BYE: ${player2.playerId} advances from Match ${match.matchIndex}`);
      } else {
        // No players - PENDING
        updateData.status = 'PENDING';
      }

      await prisma.match.update({
        where: { id: match.id },
        data: updateData
      });

      // If BYE, advance winner to next round
      if (updateData.winnerId) {
        await MatchGenerator.advanceWinner(
          tournamentId,
          categoryId,
          match.matchIndex,
          updateData.winnerId
        );
      }
    }
  }

  /**
   * Assign players to round robin matches
   */
  async _assignPlayersToRoundRobin(tournamentId, categoryId, playerAssignments, matches, structure) {
    // Create player map by slot index
    const playerMap = new Map();
    playerAssignments.forEach(assignment => {
      playerMap.set(assignment.slotIndex, assignment);
    });

    // Calculate slot distribution across groups
    let globalSlotIndex = 0;
    for (const group of structure.groups) {
      const groupMatches = matches.filter(m => m.groupIndex === group.groupIndex);
      
      // Create group player map (local slot index to player)
      const groupPlayerMap = new Map();
      for (let i = 0; i < group.slotCount; i++) {
        const player = playerMap.get(globalSlotIndex);
        if (player) {
          groupPlayerMap.set(i, player);
        }
        globalSlotIndex++;
      }

      // Update matches in this group
      for (const match of groupMatches) {
        const player1 = groupPlayerMap.get(match.slot1Index);
        const player2 = groupPlayerMap.get(match.slot2Index);

        const updateData = {
          player1Id: player1?.playerId || null,
          player2Id: player2?.playerId || null,
          player1Seed: player1?.seed || null,
          player2Seed: player2?.seed || null
        };

        // Update status
        if (player1 && player2) {
          updateData.status = 'READY';
        } else {
          updateData.status = 'PENDING';
        }

        await prisma.match.update({
          where: { id: match.id },
          data: updateData
        });
      }
    }
  }

  /**
   * Assign players to hybrid format (round robin stage only)
   */
  async _assignPlayersToHybrid(tournamentId, categoryId, playerAssignments, matches, structure) {
    // Only assign to round robin stage
    const roundRobinMatches = matches.filter(m => m.stage === 'GROUP');
    
    await this._assignPlayersToRoundRobin(
      tournamentId,
      categoryId,
      playerAssignments,
      roundRobinMatches,
      structure.stages.roundRobin
    );
  }
}

export default new DrawService();
