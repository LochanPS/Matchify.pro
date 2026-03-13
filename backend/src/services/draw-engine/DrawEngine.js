/**
 * DrawEngine - Core draw system logic
 * Handles all three tournament formats with clean, index-based progression
 * No parent-child logic - uses pure index-based advancement
 */

class DrawEngine {
  /**
   * Generate a complete draw structure based on format
   * @param {Object} config - Draw configuration
   * @returns {Object} - Complete draw structure
   */
  generateDraw(config) {
    const { format, bracketSize, options = {} } = config;

    switch (format) {
      case 'KNOCKOUT':
        return this.generateKnockoutDraw(bracketSize, options);
      
      case 'ROUND_ROBIN':
        return this.generateRoundRobinDraw(bracketSize, options);
      
      case 'ROUND_ROBIN_KNOCKOUT':
        return this.generateHybridDraw(bracketSize, options);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Generate pure knockout draw (EMPTY - no players assigned)
   */
  generateKnockoutDraw(bracketSize, options = {}) {
    const size = this._nextPowerOf2(bracketSize);
    const totalRounds = Math.log2(size);
    
    // Generate all matches with EMPTY slots
    const matches = this._generateEmptyKnockoutMatches(size, totalRounds);

    return {
      format: 'KNOCKOUT',
      bracketSize: size,
      totalRounds,
      totalSlots: size,
      matches,
      metadata: {
        createdAt: new Date().toISOString(),
        options
      }
    };
  }

  /**
   * Generate round robin draw (EMPTY - no players assigned)
   */
  generateRoundRobinDraw(totalSlots, options = {}) {
    const { numberOfGroups = 1, customGroupSizes = null } = options;
    
    // Calculate group sizes
    const groupSizes = customGroupSizes || 
      this._calculateEqualGroupSizes(totalSlots, numberOfGroups);

    // Generate empty matches for each group
    const matches = [];
    let globalMatchIndex = 0;

    const groups = [];
    for (let groupIndex = 0; groupIndex < numberOfGroups; groupIndex++) {
      const groupSize = groupSizes[groupIndex] || 0;
      const groupName = String.fromCharCode(65 + groupIndex); // A, B, C...
      
      // Generate empty matches for this group
      const groupMatches = this._generateEmptyRoundRobinMatches(
        groupSize,
        groupIndex,
        groupName,
        globalMatchIndex
      );
      
      matches.push(...groupMatches);
      globalMatchIndex += groupMatches.length;
      
      groups.push({
        groupIndex,
        groupName,
        slotCount: groupSize,
        matchCount: this._calculateRoundRobinMatchCount(groupSize)
      });
    }

    return {
      format: 'ROUND_ROBIN',
      totalSlots,
      numberOfGroups,
      groups,
      matches,
      metadata: {
        createdAt: new Date().toISOString(),
        options
      }
    };
  }

  /**
   * Generate hybrid round robin + knockout draw (EMPTY - no players assigned)
   */
  generateHybridDraw(totalSlots, options = {}) {
    const {
      numberOfGroups = 4,
      advancePerGroup = 2,
      customGroupSizes = null
    } = options;

    // Generate empty round robin stage
    const roundRobinDraw = this.generateRoundRobinDraw(totalSlots, {
      numberOfGroups,
      customGroupSizes
    });

    // Calculate knockout stage size
    const knockoutSlots = numberOfGroups * advancePerGroup;
    const knockoutBracketSize = this._nextPowerOf2(knockoutSlots);
    const knockoutRounds = Math.log2(knockoutBracketSize);

    // Generate empty knockout matches
    const knockoutMatches = this._generateEmptyKnockoutMatchesForHybrid(
      knockoutBracketSize,
      knockoutRounds,
      roundRobinDraw.matches.length // Start index after group matches
    );

    return {
      format: 'ROUND_ROBIN_KNOCKOUT',
      totalSlots,
      numberOfGroups,
      advancePerGroup,
      stages: {
        roundRobin: {
          groups: roundRobinDraw.groups,
          matches: roundRobinDraw.matches
        },
        knockout: {
          bracketSize: knockoutBracketSize,
          totalRounds: knockoutRounds,
          slotCount: knockoutSlots,
          matches: knockoutMatches
        }
      },
      matches: [...roundRobinDraw.matches, ...knockoutMatches],
      metadata: {
        createdAt: new Date().toISOString(),
        options
      }
    };
  }

  /**
   * Advance winner to next round (index-based)
   */
  advanceWinner(matches, completedMatchIndex, winnerId) {
    const match = matches[completedMatchIndex];
    if (!match) {
      throw new Error('Match not found');
    }

    // Mark winner
    match.winnerId = winnerId;
    match.status = 'COMPLETED';

    // Calculate next match index
    const nextMatchIndex = this._calculateNextMatchIndex(
      completedMatchIndex,
      match.round,
      match.stage
    );

    if (nextMatchIndex !== null && matches[nextMatchIndex]) {
      const nextMatch = matches[nextMatchIndex];
      const position = this._calculateWinnerPosition(completedMatchIndex, match.round);

      // Place winner in next match
      if (position === 1) {
        nextMatch.player1Id = winnerId;
      } else {
        nextMatch.player2Id = winnerId;
      }

      // Update next match status
      if (nextMatch.player1Id && nextMatch.player2Id) {
        nextMatch.status = 'READY';
      }
    }

    return matches;
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Calculate next power of 2
   */
  _nextPowerOf2(n) {
    return Math.pow(2, Math.ceil(Math.log2(Math.max(2, n))));
  }

  /**
   * Seed players by ranking/points
   */
  _seedPlayers(players) {
    return players
      .map((player, index) => ({
        ...player,
        seed: player.seed || index + 1
      }))
      .sort((a, b) => a.seed - b.seed);
  }

  /**
   * Calculate bye positions (top seeds get byes)
   */
  _calculateByePositions(bracketSize, byeCount) {
    const positions = [];
    for (let i = 0; i < byeCount; i++) {
      positions.push(i + 1); // Seeds 1, 2, 3... get byes
    }
    return positions;
  }

  /**
   * Generate EMPTY knockout matches (no players assigned)
   */
  _generateEmptyKnockoutMatches(bracketSize, totalRounds) {
    const matches = [];
    let matchIndex = 0;

    // Generate all rounds from first to final
    for (let round = totalRounds; round >= 1; round--) {
      const matchCount = Math.pow(2, round - 1);
      
      for (let i = 0; i < matchCount; i++) {
        matches.push({
          matchIndex,
          round,
          matchNumber: i + 1,
          stage: 'KNOCKOUT',
          slotNumber: round === totalRounds ? (i * 2 + 1) : null, // Only first round has slot numbers
          player1Id: null,
          player2Id: null,
          player1Seed: null,
          player2Seed: null,
          winnerId: null,
          status: 'PENDING' // Will become READY when both players assigned
        });
        matchIndex++;
      }
    }

    return matches;
  }

  /**
   * Generate EMPTY knockout matches for hybrid format
   */
  _generateEmptyKnockoutMatchesForHybrid(bracketSize, totalRounds, startIndex) {
    const matches = [];
    let matchIndex = startIndex;

    for (let round = totalRounds; round >= 1; round--) {
      const matchCount = Math.pow(2, round - 1);
      
      for (let i = 0; i < matchCount; i++) {
        matches.push({
          matchIndex,
          round,
          matchNumber: i + 1,
          stage: 'KNOCKOUT',
          player1Id: null,
          player2Id: null,
          player1Seed: null,
          player2Seed: null,
          winnerId: null,
          status: 'PENDING'
        });
        matchIndex++;
      }
    }

    return matches;
  }

  /**
   * Generate EMPTY round robin matches for a group
   */
  _generateEmptyRoundRobinMatches(groupSize, groupIndex, groupName, startIndex) {
    const matches = [];
    let matchIndex = startIndex;
    let slotPairIndex = 0;

    // Generate all possible match combinations for the group
    for (let i = 0; i < groupSize; i++) {
      for (let j = i + 1; j < groupSize; j++) {
        matches.push({
          matchIndex,
          round: 1,
          matchNumber: matchIndex + 1,
          stage: 'GROUP',
          groupIndex,
          groupName,
          slot1Index: i, // Slot index within group (0, 1, 2, 3...)
          slot2Index: j,
          player1Id: null,
          player2Id: null,
          player1Seed: null,
          player2Seed: null,
          winnerId: null,
          status: 'PENDING' // Will become READY when both players assigned
        });
        matchIndex++;
        slotPairIndex++;
      }
    }

    return matches;
  }





  /**
   * Calculate equal group sizes
   */
  _calculateEqualGroupSizes(totalPlayers, numberOfGroups) {
    const baseSize = Math.floor(totalPlayers / numberOfGroups);
    const remainder = totalPlayers % numberOfGroups;
    
    const sizes = Array(numberOfGroups).fill(baseSize);
    
    // Distribute remainder
    for (let i = 0; i < remainder; i++) {
      sizes[i]++;
    }

    return sizes;
  }

  /**
   * Calculate round robin match count
   */
  _calculateRoundRobinMatchCount(playerCount) {
    return (playerCount * (playerCount - 1)) / 2;
  }

  /**
   * Calculate next match index (index-based progression)
   */
  _calculateNextMatchIndex(currentMatchIndex, currentRound, stage) {
    if (stage !== 'KNOCKOUT' || currentRound === 1) {
      return null; // No next match (finals or group stage)
    }

    // Find the start index of the next round
    // This is a simplified calculation - adjust based on your match ordering
    const matchesInCurrentRound = Math.pow(2, currentRound - 1);
    const matchesBeforeCurrentRound = Math.pow(2, currentRound) - 2;
    
    const positionInRound = currentMatchIndex - matchesBeforeCurrentRound;
    const nextRoundStartIndex = matchesBeforeCurrentRound + matchesInCurrentRound;
    
    return nextRoundStartIndex + Math.floor(positionInRound / 2);
  }

  /**
   * Calculate winner position in next match
   */
  _calculateWinnerPosition(matchIndex, round) {
    const matchesBeforeRound = Math.pow(2, round) - 2;
    const positionInRound = matchIndex - matchesBeforeRound;
    
    return (positionInRound % 2) + 1; // Returns 1 or 2
  }
}

export default new DrawEngine();
