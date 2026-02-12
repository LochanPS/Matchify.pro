/**
 * Match Generation Service
 * Handles generation of round-robin and knockout matches
 */

import prisma from '../lib/prisma.js';

class MatchGenerationService {
  /**
   * Generate round-robin matches for a tournament
   * Every participant plays every other participant exactly once
   * @param {string} tournamentId
   * @param {Array} participants - Array of participant objects with {id, name, seed}
   * @returns {Promise<Array>} - Created match records
   */
  async generateRoundRobinMatches(tournamentId, categoryId, participants) {
    if (!participants || participants.length < 2) {
      throw new Error('At least 2 participants required for round-robin');
    }

    const matches = [];
    const n = participants.length;
    
    // Generate all unique pairings using nested loop
    // This ensures each participant plays each other exactly once
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        matches.push({
          tournamentId,
          categoryId,
          round: 1, // All round-robin matches are in round 1
          matchNumber: matches.length + 1,
          stage: 'GROUP',
          player1Id: participants[i].id,
          player2Id: participants[j].id,
          player1Seed: participants[i].seed || i + 1,
          player2Seed: participants[j].seed || j + 1,
          status: 'PENDING',
          winnerId: null,
          scoreJson: null
        });
      }
    }

    // Persist all matches to database
    const createdMatches = await prisma.match.createMany({
      data: matches
    });

    // Fetch and return the created matches
    const savedMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        stage: 'GROUP'
      },
      orderBy: { matchNumber: 'asc' }
    });

    return savedMatches;
  }

  /**
   * Calculate expected number of round-robin matches
   * Formula: n × (n-1) / 2
   * @param {number} participantCount
   * @returns {number}
   */
  calculateRoundRobinMatchCount(participantCount) {
    if (participantCount < 2) return 0;
    return (participantCount * (participantCount - 1)) / 2;
  }

  /**
   * Verify round-robin match generation correctness
   * @param {Array} matches - Generated matches
   * @param {number} participantCount - Number of participants
   * @returns {{isValid: boolean, errors: string[]}}
   */
  verifyRoundRobinMatches(matches, participantCount) {
    const errors = [];
    
    // Check total match count
    const expectedCount = this.calculateRoundRobinMatchCount(participantCount);
    if (matches.length !== expectedCount) {
      errors.push(`Expected ${expectedCount} matches, got ${matches.length}`);
    }

    // Check for duplicate matches
    const pairings = new Set();
    for (const match of matches) {
      const pair1 = `${match.player1Id}-${match.player2Id}`;
      const pair2 = `${match.player2Id}-${match.player1Id}`;
      
      if (pairings.has(pair1) || pairings.has(pair2)) {
        errors.push(`Duplicate match found: ${pair1}`);
      }
      
      pairings.add(pair1);
      pairings.add(pair2);
    }

    // Check that each participant appears in correct number of matches
    const participantMatchCounts = {};
    for (const match of matches) {
      participantMatchCounts[match.player1Id] = (participantMatchCounts[match.player1Id] || 0) + 1;
      participantMatchCounts[match.player2Id] = (participantMatchCounts[match.player2Id] || 0) + 1;
    }

    for (const [participantId, count] of Object.entries(participantMatchCounts)) {
      if (count !== participantCount - 1) {
        errors.push(`Participant ${participantId} appears in ${count} matches, expected ${participantCount - 1}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate knockout bracket structure with parent-child relationships
   * Implements the algorithm from tournament-system-reliability spec:
   * 1. Calculate rounds and byes
   * 2. Generate matches from final round backwards to Round 1
   * 3. Set parentMatchId and childPosition during creation
   * 4. Assign byes to first B participants
   * 5. Use database transaction for atomic creation
   * 
   * @param {string} tournamentId
   * @param {string} categoryId
   * @param {Array} participants - Qualified participants with {id, seed}
   * @returns {Promise<{rounds: number, matches: Array}>}
   */
  async generateKnockoutBracket(tournamentId, categoryId, participants) {
    const n = participants.length;
    if (n < 2) {
      throw new Error('At least 2 participants required for knockout');
    }

    const totalRounds = Math.ceil(Math.log2(n));
    const bracketSize = Math.pow(2, totalRounds);
    const byeCount = bracketSize - n;

    console.log(`🏆 Generating knockout bracket: ${n} participants, ${totalRounds} rounds, ${byeCount} byes`);

    // Separate participants: first B get byes, rest compete in Round 1
    const participantsWithByes = participants.slice(0, byeCount);
    const participantsInRound1 = participants.slice(byeCount);

    // Use transaction for atomic creation
    return await prisma.$transaction(async (tx) => {
      console.log(`📝 Creating matches from Finals backwards to Round 1...`);

      // Store matches by round for parent relationship lookup
      const matchesByRound = {};

      // Generate matches from final round (round 1) backwards to first round (highest number)
      // Note: In our schema, round 1 = Finals, round 2 = Semifinals, etc.
      for (let r = 1; r <= totalRounds; r++) {
        const matchesInRound = Math.pow(2, r - 1);
        matchesByRound[r] = [];

        console.log(`   Creating Round ${r} (${this.getRoundName(r, totalRounds)}): ${matchesInRound} matches`);

        for (let m = 0; m < matchesInRound; m++) {
          const matchData = {
            tournamentId,
            categoryId,
            round: r,
            roundNumber: r, // Also set roundNumber for spec compliance
            matchNumber: m + 1,
            stage: 'KNOCKOUT',
            player1Id: null,
            player2Id: null,
            player1Seed: null,
            player2Seed: null,
            status: 'PENDING',
            winnerId: null,
            scoreJson: null,
            parentMatchId: null,
            childPosition: null,
            winnerPosition: null
          };

          // If this is not the final round, set parent relationship
          if (r > 1) {
            const parentRound = r - 1;
            const parentMatchNumber = Math.floor(m / 2) + 1;
            const parentMatch = matchesByRound[parentRound][parentMatchNumber - 1];

            if (parentMatch) {
              matchData.parentMatchId = parentMatch.id;
              matchData.childPosition = (m % 2) + 1; // 1 or 2
              matchData.winnerPosition = (m % 2) === 0 ? 'player1' : 'player2';
              
              console.log(`      Match ${m + 1} → Parent: Round ${parentRound} Match ${parentMatchNumber} (position ${matchData.childPosition})`);
            }
          }

          const createdMatch = await tx.match.create({ data: matchData });
          matchesByRound[r].push(createdMatch);
        }
      }

      // Now assign participants to the first round (highest round number)
      const firstRoundNumber = totalRounds;
      const firstRoundMatches = matchesByRound[firstRoundNumber];
      const regularMatchCount = participantsInRound1.length / 2;

      console.log(`👥 Assigning participants to Round ${firstRoundNumber}...`);

      // Assign participants to regular matches
      for (let i = 0; i < regularMatchCount; i++) {
        const match = firstRoundMatches[i];
        await tx.match.update({
          where: { id: match.id },
          data: {
            player1Id: participantsInRound1[i * 2]?.id || null,
            player2Id: participantsInRound1[i * 2 + 1]?.id || null,
            player1Seed: participantsInRound1[i * 2]?.seed || i * 2 + 1,
            player2Seed: participantsInRound1[i * 2 + 1]?.seed || i * 2 + 2
          }
        });
      }

      // Assign byes to remaining matches
      console.log(`🎫 Assigning ${byeCount} byes...`);
      for (let i = 0; i < byeCount; i++) {
        const match = firstRoundMatches[regularMatchCount + i];
        const participant = participantsWithByes[i];
        
        await tx.match.update({
          where: { id: match.id },
          data: {
            player1Id: participant.id,
            player2Id: null,
            player1Seed: participant.seed || regularMatchCount * 2 + i + 1,
            player2Seed: null,
            status: 'COMPLETED',
            winnerId: participant.id,
            scoreJson: JSON.stringify({ bye: true }),
            completedAt: new Date()
          }
        });

        console.log(`      Bye assigned to ${participant.id} in Match ${match.matchNumber}`);
      }

      // Fetch all created matches
      const allMatches = await tx.match.findMany({
        where: {
          tournamentId,
          categoryId,
          stage: 'KNOCKOUT'
        },
        orderBy: [
          { round: 'asc' },
          { matchNumber: 'asc' }
        ]
      });

      console.log(`✅ Created ${allMatches.length} matches with parent-child relationships`);

      // Auto-advance bye winners to parent matches
      console.log(`⚡ Auto-advancing bye winners...`);
      for (const match of allMatches) {
        if (match.status === 'COMPLETED' && match.winnerId && match.parentMatchId) {
          await this.advanceWinner(match, tx);
        }
      }

      console.log(`✅ Knockout bracket generated successfully`);

      return {
        rounds: totalRounds,
        matches: allMatches
      };
    });
  }

  /**
   * Set parent-child relationships for knockout matches
   * @param {Array} matches - All knockout matches
   */
  async setParentRelationships(matches) {
    console.log(`🔗 Setting parent relationships for ${matches.length} matches...`);
    
    const maxRound = Math.max(...matches.map(m => m.round));
    let relationshipsSet = 0;
    
    for (let currentRound = maxRound; currentRound >= 2; currentRound--) {
      const roundMatches = matches.filter(m => m.round === currentRound);
      
      console.log(`   Processing Round ${currentRound}: ${roundMatches.length} matches`);
      
      for (let i = 0; i < roundMatches.length; i++) {
        const match = roundMatches[i];
        const parentRound = currentRound - 1;
        const parentMatchNumber = Math.floor(i / 2) + 1;
        
        const parentMatch = matches.find(
          m => m.round === parentRound && m.matchNumber === parentMatchNumber
        );

        if (parentMatch) {
          const winnerPosition = i % 2 === 0 ? 'player1' : 'player2';
          
          await prisma.match.update({
            where: { id: match.id },
            data: {
              parentMatchId: parentMatch.id,
              winnerPosition: winnerPosition
            }
          });
          
          relationshipsSet++;
          console.log(`   ✓ Match ${match.matchNumber} (R${currentRound}) → Match ${parentMatch.matchNumber} (R${parentRound}) as ${winnerPosition}`);
        } else {
          console.log(`   ⚠️ No parent found for Match ${match.matchNumber} (R${currentRound})`);
        }
      }
    }
    
    console.log(`✅ Set ${relationshipsSet} parent relationships`);
  }

  /**
   * Advance winner to parent match
   * @param {Object} match - Completed match
   * @param {Object} tx - Optional Prisma transaction client
   */
  async advanceWinner(match, tx = null) {
    if (!match.parentMatchId || !match.winnerId) {
      return;
    }

    const prismaClient = tx || prisma;

    const updateData = {};
    if (match.winnerPosition === 'player1') {
      updateData.player1Id = match.winnerId;
    } else if (match.winnerPosition === 'player2') {
      updateData.player2Id = match.winnerId;
    }

    await prismaClient.match.update({
      where: { id: match.parentMatchId },
      data: updateData
    });
  }

  /**
   * Get round name based on round number
   * @param {number} roundNumber - Round number (1 = Finals, 2 = Semifinals, etc.)
   * @param {number} totalRounds - Total number of rounds
   * @returns {string}
   */
  getRoundName(roundNumber, totalRounds) {
    const remainingParticipants = Math.pow(2, roundNumber);
    
    if (remainingParticipants === 2) return 'Finals';
    if (remainingParticipants === 4) return 'Semifinals';
    if (remainingParticipants === 8) return 'Quarterfinals';
    
    const roundFromStart = totalRounds - roundNumber + 1;
    return `Round ${roundFromStart}`;
  }
}

export default new MatchGenerationService();
