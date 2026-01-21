import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class MatchService {
  /**
   * Generate match records from bracket JSON
   * @param {Object} bracket - Bracket structure from bracket.service
   * @param {String} tournamentId
   * @param {String} categoryId
   * @returns {Array} - Created match records
   */
  async generateMatchesFromBracket(bracket, tournamentId, categoryId) {
    const matchRecords = [];
    const matchIdMap = new Map(); // Map to track match IDs for parent relationships

    if (bracket.format === 'ROUND_ROBIN' || bracket.format === 'ROUND_ROBIN_KNOCKOUT') {
      // Generate Round Robin matches for each group
      let globalMatchNum = 1;
      
      for (const group of bracket.groups) {
        if (group.matches) {
          for (const match of group.matches) {
            const matchRecord = {
              tournamentId,
              categoryId,
              round: 1, // All Round Robin matches are round 1
              matchNumber: globalMatchNum++,
              
              // Participants
              player1Id: match.player1?.id || null,
              player2Id: match.player2?.id || null,
              player1Seed: match.player1?.seed || null,
              player2Seed: match.player2?.seed || null,
              
              // Status
              status: (match.player1?.id && match.player2?.id) ? 'READY' : 'PENDING',
              winnerId: match.winner?.id || null,
              
              // Round Robin specific
              groupName: group.groupName,
              courtNumber: null,
              scoreJson: null,
              parentMatchId: null,
              winnerPosition: null
            };

            matchRecords.push(matchRecord);
          }
        }
      }
      
      // Create all matches in database
      const createdMatches = [];
      for (const matchData of matchRecords) {
        const created = await prisma.match.create({
          data: matchData
        });
        createdMatches.push(created);
      }
      
      return createdMatches;
    }

    // Original knockout logic
    // Process each round
    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        const matchRecord = {
          tournamentId,
          categoryId,
          round: round.roundNumber,
          matchNumber: match.matchNumber,
          
          // Participants
          player1Id: match.participant1?.id || null,
          player2Id: match.participant2?.id || null,
          player1Seed: match.participant1?.seed || null,
          player2Seed: match.participant2?.seed || null,
          
          // Status
          status: match.status === 'bye' ? 'COMPLETED' : 
                  (match.participant1 && match.participant2) ? 'READY' : 'PENDING',
          winnerId: match.winner?.id || null,
          
          // Court assignment (will be done later)
          courtNumber: null,
          scoreJson: null,
          
          // Parent match (will be set in second pass)
          parentMatchId: null,
          winnerPosition: null
        };

        matchRecords.push(matchRecord);
      }
    }

    // Create all matches in database
    const createdMatches = [];
    for (const matchData of matchRecords) {
      const created = await prisma.match.create({
        data: matchData
      });
      createdMatches.push(created);
      
      // Store in map for parent relationship lookup
      const key = `${created.round}-${created.matchNumber}`;
      matchIdMap.set(key, created.id);
    }

    // Second pass: Set parent relationships (only for knockout)
    if (bracket.format === 'KNOCKOUT') {
      for (let i = 0; i < bracket.rounds.length; i++) {
        const round = bracket.rounds[i];
        
        // Skip the final round (no parent)
        if (round.roundNumber === 1) continue;

        for (let j = 0; j < round.matches.length; j++) {
          const match = round.matches[j];
          
          // Find parent match (in the next round, half the match number)
          const parentRound = round.roundNumber - 1;
          const parentMatchNumber = Math.floor(j / 2) + 1;
          const parentKey = `${parentRound}-${parentMatchNumber}`;
          const parentMatchId = matchIdMap.get(parentKey);

          if (parentMatchId) {
            const currentKey = `${round.roundNumber}-${match.matchNumber}`;
            const currentMatchId = matchIdMap.get(currentKey);

            // Update match with parent relationship
            await prisma.match.update({
              where: { id: currentMatchId },
              data: {
                parentMatchId: parentMatchId,
                winnerPosition: j % 2 === 0 ? 'player1' : 'player2'
              }
            });
          }
        }
      }
    }

    return createdMatches;
  }

  /**
   * Get all matches for a tournament category
   */
  async getMatchesByCategory(tournamentId, categoryId) {
    return await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId
      },
      orderBy: [
        { round: 'desc' }, // Finals first
        { matchNumber: 'asc' }
      ]
    });
  }

  /**
   * Get match by ID with full details
   */
  async getMatchById(matchId) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        tournament: {
          select: {
            name: true,
            startDate: true
          }
        },
        category: {
          select: {
            name: true,
            format: true
          }
        },
        parentMatch: true,
        childMatches: true
      }
    });

    if (!match) return null;

    // Fetch player details
    const player1 = match.player1Id
      ? await prisma.user.findUnique({
          where: { id: match.player1Id },
          select: { id: true, name: true, email: true, profilePhoto: true }
        })
      : null;

    const player2 = match.player2Id
      ? await prisma.user.findUnique({
          where: { id: match.player2Id },
          select: { id: true, name: true, email: true, profilePhoto: true }
        })
      : null;

    const umpire = match.umpireId
      ? await prisma.user.findUnique({
          where: { id: match.umpireId },
          select: { id: true, name: true, email: true, profilePhoto: true }
        })
      : null;

    return {
      ...match,
      player1,
      player2,
      umpire
    };
  }

  /**
   * Update match result
   */
  async updateMatchResult(matchId, winnerId, scoreJson) {
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    if (!match) {
      throw new Error('Match not found');
    }

    // Update current match
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        winnerId,
        scoreJson: JSON.stringify(scoreJson),
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // If there's a parent match, advance the winner
    if (match.parentMatchId && match.winnerPosition) {
      const updateData = {};
      if (match.winnerPosition === 'player1') {
        updateData.player1Id = winnerId;
      } else {
        updateData.player2Id = winnerId;
      }

      // Check if parent match now has both players
      const parentMatch = await prisma.match.findUnique({
        where: { id: match.parentMatchId }
      });

      if (parentMatch) {
        const bothPlayersReady = 
          (match.winnerPosition === 'player1' && parentMatch.player2Id) ||
          (match.winnerPosition === 'player2' && parentMatch.player1Id);

        if (bothPlayersReady) {
          updateData.status = 'READY';
        }

        await prisma.match.update({
          where: { id: match.parentMatchId },
          data: updateData
        });
      }
    }

    return updatedMatch;
  }
}

export default new MatchService();
