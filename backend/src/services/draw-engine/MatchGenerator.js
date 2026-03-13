/**
 * MatchGenerator - Converts draw structures to database match records
 * Handles match creation and updates for all formats
 */

import prisma from '../../lib/prisma.js';

class MatchGenerator {
  /**
   * Create match records from draw structure
   */
  async createMatchesFromDraw(draw, tournamentId, categoryId) {
    const { format, matches } = draw;

    const matchRecords = matches.map(match => ({
      tournamentId,
      categoryId,
      round: match.round,
      matchNumber: match.matchNumber,
      stage: match.stage,
      groupIndex: match.groupIndex || null,
      groupName: match.groupName || null,
      slot1Index: match.slot1Index || null,
      slot2Index: match.slot2Index || null,
      slotNumber: match.slotNumber || null,
      player1Id: match.player1Id,
      player2Id: match.player2Id,
      player1Seed: match.player1Seed,
      player2Seed: match.player2Seed,
      winnerId: match.winnerId,
      status: match.status,
      courtNumber: null,
      scoreJson: null,
      matchIndex: match.matchIndex
    }));

    // Bulk create matches
    const createdMatches = await prisma.match.createMany({
      data: matchRecords,
      skipDuplicates: true
    });

    return createdMatches;
  }

  /**
   * Update match with result and advance winner
   */
  async updateMatchResult(matchId, winnerId, scoreJson) {
    // Get the match
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Update match status to COMPLETED
    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        scoreJson: JSON.stringify(scoreJson),
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // If knockout stage, advance winner
    if (match.stage === 'KNOCKOUT') {
      await this.advanceWinner(
        match.tournamentId,
        match.categoryId,
        match.matchIndex,
        winnerId
      );
    }

    return await prisma.match.findUnique({ where: { id: matchId } });
  }

  /**
   * Advance winner to next match using index-based progression
   * 
   * Progression Rules:
   * - nextMatchIndex = floor(currentMatchIndex / 2)
   * - If currentMatchIndex is even: winner → player1 slot
   * - If currentMatchIndex is odd: winner → player2 slot
   */
  async advanceWinner(tournamentId, categoryId, completedMatchIndex, winnerId) {
    // Get all knockout matches for this category
    const allMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: { matchIndex: 'asc' }
    });

    const completedMatch = allMatches.find(m => m.matchIndex === completedMatchIndex);
    if (!completedMatch) {
      throw new Error('Completed match not found');
    }

    // Check if this is the final match
    if (completedMatch.round === 1) {
      console.log('🏆 Final match completed. Tournament winner:', winnerId);
      return null;
    }

    // Calculate next match using index-based progression
    const { nextMatchIndex, winnerSlot } = this._calculateNextMatchPosition(
      completedMatchIndex,
      completedMatch.round,
      allMatches
    );

    if (nextMatchIndex === null) {
      console.log('🏆 No next match found. This was the final.');
      return null;
    }

    const nextMatch = allMatches.find(m => m.matchIndex === nextMatchIndex);
    if (!nextMatch) {
      throw new Error(`Next match with index ${nextMatchIndex} not found`);
    }

    console.log(`📍 Advancing winner from Match ${completedMatchIndex} (Round ${completedMatch.round}) → Match ${nextMatchIndex} (Round ${nextMatch.round}) Slot: ${winnerSlot}`);

    // Update next match with winner
    const updateData = {};
    
    if (winnerSlot === 'player1') {
      updateData.player1Id = winnerId;
    } else {
      updateData.player2Id = winnerId;
    }

    // Determine if next match is ready
    const currentNextMatch = await prisma.match.findUnique({
      where: { id: nextMatch.id }
    });

    const player1Present = winnerSlot === 'player1' ? winnerId : currentNextMatch.player1Id;
    const player2Present = winnerSlot === 'player2' ? winnerId : currentNextMatch.player2Id;

    if (player1Present && player2Present) {
      updateData.status = 'READY';
      console.log('✅ Next match is now READY (both players present)');
    } else {
      updateData.status = 'PENDING';
      console.log('⏳ Next match still PENDING (waiting for other player)');
    }

    await prisma.match.update({
      where: { id: nextMatch.id },
      data: updateData
    });

    return nextMatch;
  }

  /**
   * Reset match result and clear downstream progression
   */
  async resetMatchResult(matchId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Clear match result
    await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId: null,
        scoreJson: null,
        status: match.player1Id && match.player2Id ? 'READY' : 'PENDING',
        completedAt: null
      }
    });

    // If knockout, clear downstream matches
    if (match.stage === 'KNOCKOUT') {
      await this._clearDownstreamMatches(
        match.tournamentId,
        match.categoryId,
        match.matchIndex,
        match.round
      );
    }

    return await prisma.match.findUnique({ where: { id: matchId } });
  }

  /**
   * Handle BYE advancement
   */
  async processBye(tournamentId, categoryId, matchIndex, byeWinnerId) {
    console.log(`🎫 Processing BYE for Match ${matchIndex}, winner: ${byeWinnerId}`);
    
    // Mark match as BYE
    const match = await prisma.match.findFirst({
      where: {
        tournamentId,
        categoryId,
        matchIndex,
        stage: 'KNOCKOUT'
      }
    });

    if (!match) {
      throw new Error('Match not found for BYE processing');
    }

    await prisma.match.update({
      where: { id: match.id },
      data: {
        winnerId: byeWinnerId,
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Advance BYE winner to next round
    await this.advanceWinner(tournamentId, categoryId, matchIndex, byeWinnerId);
  }

  /**
   * Get matches by stage
   */
  async getMatchesByStage(tournamentId, categoryId, stage) {
    return await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        stage
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });
  }

  /**
   * Get matches by group
   */
  async getMatchesByGroup(tournamentId, categoryId, groupIndex) {
    return await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        stage: 'GROUP',
        groupIndex
      },
      orderBy: { matchNumber: 'asc' }
    });
  }

  /**
   * Calculate group standings
   * 
   * Points System:
   * - Win: 1 point
   * - Loss: 0 points
   * 
   * Sorting:
   * 1. Points (descending)
   * 2. Wins (descending)
   * 3. Head-to-head (if applicable)
   * 4. Random (if still tied)
   */
  async calculateGroupStandings(tournamentId, categoryId, groupIndex) {
    const matches = await this.getMatchesByGroup(tournamentId, categoryId, groupIndex);

    // Initialize standings map
    const standings = new Map();

    // Process each match
    for (const match of matches) {
      // Initialize players if not exists
      if (match.player1Id && !standings.has(match.player1Id)) {
        standings.set(match.player1Id, {
          playerId: match.player1Id,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          points: 0
        });
      }

      if (match.player2Id && !standings.has(match.player2Id)) {
        standings.set(match.player2Id, {
          playerId: match.player2Id,
          matchesPlayed: 0,
          wins: 0,
          losses: 0,
          points: 0
        });
      }

      // Only count completed matches
      if (match.status === 'COMPLETED' && match.winnerId) {
        const player1Stats = standings.get(match.player1Id);
        const player2Stats = standings.get(match.player2Id);

        if (player1Stats && player2Stats) {
          player1Stats.matchesPlayed++;
          player2Stats.matchesPlayed++;

          if (match.winnerId === match.player1Id) {
            player1Stats.wins++;
            player1Stats.points += 1;
            player2Stats.losses++;
          } else {
            player2Stats.wins++;
            player2Stats.points += 1;
            player1Stats.losses++;
          }
        }
      }
    }

    // Convert to array and sort
    const standingsArray = Array.from(standings.values());

    // Sort by: points (desc), wins (desc), losses (asc)
    standingsArray.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (a.losses !== b.losses) return a.losses - b.losses;
      return 0; // Equal if all same
    });

    return standingsArray;
  }

  /**
   * Get all group standings for a category
   */
  async getAllGroupStandings(tournamentId, categoryId) {
    // Get draw to find number of groups
    const draw = await prisma.draw.findUnique({
      where: {
        tournamentId_categoryId: {
          tournamentId,
          categoryId
        }
      }
    });

    if (!draw) {
      throw new Error('Draw not found');
    }

    const structure = JSON.parse(draw.bracketJson);
    const numberOfGroups = structure.numberOfGroups || structure.stages?.roundRobin?.groups?.length || 0;

    const allStandings = [];

    for (let groupIndex = 0; groupIndex < numberOfGroups; groupIndex++) {
      const standings = await this.calculateGroupStandings(tournamentId, categoryId, groupIndex);
      allStandings.push({
        groupIndex,
        groupName: String.fromCharCode(65 + groupIndex), // A, B, C...
        standings
      });
    }

    return allStandings;
  }

  /**
   * Get qualified players from groups
   * @param {number} advancePerGroup - Number of players to advance from each group
   */
  async getQualifiedPlayers(tournamentId, categoryId, advancePerGroup) {
    const allStandings = await this.getAllGroupStandings(tournamentId, categoryId);
    const qualifiedPlayers = [];

    for (const groupStanding of allStandings) {
      // Take top N players from each group
      const topPlayers = groupStanding.standings.slice(0, advancePerGroup);
      
      for (const player of topPlayers) {
        qualifiedPlayers.push({
          playerId: player.playerId,
          groupIndex: groupStanding.groupIndex,
          groupName: groupStanding.groupName,
          position: groupStanding.standings.indexOf(player) + 1,
          points: player.points,
          wins: player.wins,
          losses: player.losses
        });
      }
    }

    return qualifiedPlayers;
  }

  /**
   * Populate knockout stage with qualified players
   */
  async populateKnockoutStage(tournamentId, categoryId, qualifiedPlayers) {
    // Get knockout matches
    const knockoutMatches = await this.getMatchesByStage(
      tournamentId,
      categoryId,
      'KNOCKOUT'
    );

    // Sort by round (highest first) and match number
    const sortedMatches = knockoutMatches.sort((a, b) => {
      if (b.round !== a.round) return b.round - a.round;
      return a.matchNumber - b.matchNumber;
    });

    // Get first round matches
    const firstRound = sortedMatches[0]?.round;
    const firstRoundMatches = sortedMatches.filter(m => m.round === firstRound);

    // Assign players to first round matches
    let playerIndex = 0;
    for (const match of firstRoundMatches) {
      const player1 = qualifiedPlayers[playerIndex++];
      const player2 = qualifiedPlayers[playerIndex++];

      await prisma.match.update({
        where: { id: match.id },
        data: {
          player1Id: player1?.id || null,
          player2Id: player2?.id || null,
          player1Seed: player1?.seed || null,
          player2Seed: player2?.seed || null,
          status: (player1 && player2) ? 'READY' : 'PENDING'
        }
      });
    }

    return firstRoundMatches;
  }

  /**
   * Delete all matches for a category
   */
  async deleteMatches(tournamentId, categoryId) {
    return await prisma.match.deleteMany({
      where: { tournamentId, categoryId }
    });
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Calculate next match position using index-based progression
   * 
   * Rules:
   * - nextMatchIndex = floor(currentMatchIndex / 2)
   * - Even matchIndex → player1 slot
   * - Odd matchIndex → player2 slot
   */
  _calculateNextMatchPosition(currentMatchIndex, currentRound, allMatches) {
    // Check if this is the final
    if (currentRound === 1) {
      return { nextMatchIndex: null, winnerSlot: null };
    }

    // Get matches in current round
    const currentRoundMatches = allMatches.filter(m => m.round === currentRound);
    
    // Find position of current match within its round
    const sortedCurrentRound = currentRoundMatches.sort((a, b) => a.matchIndex - b.matchIndex);
    const positionInRound = sortedCurrentRound.findIndex(m => m.matchIndex === currentMatchIndex);

    if (positionInRound === -1) {
      throw new Error('Match not found in current round');
    }

    // Get next round matches
    const nextRound = currentRound - 1;
    const nextRoundMatches = allMatches.filter(m => m.round === nextRound);
    const sortedNextRound = nextRoundMatches.sort((a, b) => a.matchIndex - b.matchIndex);

    // Calculate which match in next round
    const nextMatchPosition = Math.floor(positionInRound / 2);
    const nextMatch = sortedNextRound[nextMatchPosition];

    if (!nextMatch) {
      return { nextMatchIndex: null, winnerSlot: null };
    }

    // Determine slot: even position → player1, odd position → player2
    const winnerSlot = (positionInRound % 2 === 0) ? 'player1' : 'player2';

    return {
      nextMatchIndex: nextMatch.matchIndex,
      winnerSlot
    };
  }

  /**
   * Clear downstream matches when a result is reset
   */
  async _clearDownstreamMatches(tournamentId, categoryId, resetMatchIndex, resetMatchRound) {
    console.log(`🧹 Clearing downstream matches from Match ${resetMatchIndex} (Round ${resetMatchRound})`);

    // Get all knockout matches
    const allMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: { matchIndex: 'asc' }
    });

    // Calculate affected matches
    const affectedMatches = this._getAffectedMatches(
      resetMatchIndex,
      resetMatchRound,
      allMatches
    );

    // Clear each affected match
    for (const match of affectedMatches) {
      const { nextMatchIndex, winnerSlot } = this._calculateNextMatchPosition(
        resetMatchIndex,
        resetMatchRound,
        allMatches
      );

      if (match.matchIndex === nextMatchIndex) {
        const updateData = {
          winnerId: null,
          scoreJson: null,
          completedAt: null
        };

        // Clear the appropriate player slot
        if (winnerSlot === 'player1') {
          updateData.player1Id = null;
        } else if (winnerSlot === 'player2') {
          updateData.player2Id = null;
        }

        // Update status
        const currentMatch = await prisma.match.findUnique({
          where: { id: match.id }
        });

        const player1Present = winnerSlot === 'player1' ? null : currentMatch.player1Id;
        const player2Present = winnerSlot === 'player2' ? null : currentMatch.player2Id;

        updateData.status = (player1Present && player2Present) ? 'READY' : 'PENDING';

        await prisma.match.update({
          where: { id: match.id },
          data: updateData
        });

        console.log(`  ✓ Cleared Match ${match.matchIndex} (Round ${match.round})`);
      }
    }
  }

  /**
   * Get all matches affected by a reset
   */
  _getAffectedMatches(resetMatchIndex, resetMatchRound, allMatches) {
    const affected = [];
    let currentRound = resetMatchRound;
    let currentIndex = resetMatchIndex;

    // Traverse up the bracket
    while (currentRound > 1) {
      const { nextMatchIndex } = this._calculateNextMatchPosition(
        currentIndex,
        currentRound,
        allMatches
      );

      if (nextMatchIndex === null) break;

      const nextMatch = allMatches.find(m => m.matchIndex === nextMatchIndex);
      if (nextMatch) {
        affected.push(nextMatch);
        currentIndex = nextMatchIndex;
        currentRound = nextMatch.round;
      } else {
        break;
      }
    }

    return affected;
  }
}

export default new MatchGenerator();
