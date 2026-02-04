import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';

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
              stage: 'GROUP', // Mark as group stage
              
              // Participants
              player1Id: match.player1?.id || null,
              player2Id: match.player2?.id || null,
              player1Seed: match.player1?.seed || null,
              player2Seed: match.player2?.seed || null,
              
              // Status
              status: (match.player1?.id && match.player2?.id) ? 'READY' : 'PENDING',
              winnerId: match.winner?.id || null,
              
              // Match details
              courtNumber: null,
              scoreJson: null,
              parentMatchId: null,
              winnerPosition: null
            };

            matchRecords.push(matchRecord);
          }
        }
      }
      
      // For ROUND_ROBIN_KNOCKOUT, also create knockout stage matches (empty initially)
      if (bracket.format === 'ROUND_ROBIN_KNOCKOUT' && bracket.knockout && bracket.knockout.rounds) {
        // Calculate starting match number for knockout stage
        let knockoutMatchNum = globalMatchNum;
        
        // Reverse round numbering for knockout: Finals=1, SF=2, QF=3, etc.
        const totalKnockoutRounds = bracket.knockout.rounds.length;
        
        for (let roundIdx = 0; roundIdx < bracket.knockout.rounds.length; roundIdx++) {
          const round = bracket.knockout.rounds[roundIdx];
          const reverseRoundNumber = totalKnockoutRounds - roundIdx;
          
          for (const match of round.matches) {
            const matchRecord = {
              tournamentId,
              categoryId,
              round: reverseRoundNumber, // Reverse numbering
              matchNumber: knockoutMatchNum++,
              stage: 'KNOCKOUT', // Mark as knockout stage
              
              // Participants (will be null until organizer arranges)
              player1Id: match.player1?.id || null,
              player2Id: match.player2?.id || null,
              player1Seed: match.player1?.seed || null,
              player2Seed: match.player2?.seed || null,
              
              // Status
              status: 'PENDING',
              winnerId: null,
              
              // Match details
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
      
      // Set parent relationships for knockout matches
      if (bracket.format === 'ROUND_ROBIN_KNOCKOUT') {
        const knockoutMatches = createdMatches.filter(m => m.stage === 'KNOCKOUT');
        const maxRound = Math.max(...knockoutMatches.map(m => m.round));
        
        for (let currentRound = maxRound; currentRound >= 2; currentRound--) {
          const roundMatches = knockoutMatches.filter(m => m.round === currentRound);
          
          for (let i = 0; i < roundMatches.length; i++) {
            const match = roundMatches[i];
            const parentRound = currentRound - 1;
            const parentMatchNumber = Math.floor(i / 2) + 1;
            
            const parentMatch = knockoutMatches.find(
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
            }
          }
        }
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
          stage: 'KNOCKOUT', // Pure knockout format
          
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
    // Note: Round numbering is REVERSE - Finals=1, SF=2, QF=3, etc.
    // So we need to process from highest round number down to 2 (skip Finals which is round 1)
    if (bracket.format === 'single_elimination') {
      const maxRound = Math.max(...createdMatches.map(m => m.round));
      
      // Process each round from highest (first round) to 2 (semi-finals)
      for (let currentRound = maxRound; currentRound >= 2; currentRound--) {
        const roundMatches = createdMatches.filter(m => m.round === currentRound);
        
        for (let i = 0; i < roundMatches.length; i++) {
          const match = roundMatches[i];
          
          // Parent match is in the LOWER round number (closer to finals)
          const parentRound = currentRound - 1;
          
          // Two matches feed into one parent match
          const parentMatchNumber = Math.floor(i / 2) + 1;
          
          // Find parent match
          const parentMatch = createdMatches.find(
            m => m.round === parentRound && m.matchNumber === parentMatchNumber
          );

          if (parentMatch) {
            // Determine winner position: first match of pair goes to player1, second to player2
            const winnerPosition = i % 2 === 0 ? 'player1' : 'player2';

            // Update match with parent relationship
            await prisma.match.update({
              where: { id: match.id },
              data: {
                parentMatchId: parentMatch.id,
                winnerPosition: winnerPosition
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
