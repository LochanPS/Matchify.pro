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
  // tx: optional Prisma transaction client — pass when called inside a $transaction block
  async generateMatchesFromBracket(bracket, tournamentId, categoryId, tx = null) {
    const db = tx || prisma; // use transaction client if provided, else default client
    const matchRecords = [];

    if (bracket.format === 'ROUND_ROBIN' || bracket.format === 'ROUND_ROBIN_KNOCKOUT') {
      let globalMatchNum = 1;

      for (const group of bracket.groups || []) {
        for (const match of group.matches || []) {
          matchRecords.push({
            tournamentId, categoryId,
            round: 1, matchNumber: globalMatchNum++, stage: 'GROUP',
            player1Id: match.player1?.id || null,
            player2Id: match.player2?.id || null,
            player1Seed: match.player1?.seed || null,
            player2Seed: match.player2?.seed || null,
            status: (match.player1?.id && match.player2?.id) ? 'READY' : 'PENDING',
            winnerId: match.winner?.id || null,
            courtNumber: null, scoreJson: null, parentMatchId: null, winnerPosition: null,
          });
        }
      }

      if (bracket.format === 'ROUND_ROBIN_KNOCKOUT' && bracket.knockout?.rounds) {
        const totalKnockoutRounds = bracket.knockout.rounds.length;
        let knockoutMatchNum = globalMatchNum;

        for (let roundIdx = 0; roundIdx < bracket.knockout.rounds.length; roundIdx++) {
          const reverseRoundNumber = totalKnockoutRounds - roundIdx;
          for (const match of bracket.knockout.rounds[roundIdx].matches || []) {
            matchRecords.push({
              tournamentId, categoryId,
              round: reverseRoundNumber, matchNumber: knockoutMatchNum++, stage: 'KNOCKOUT',
              player1Id: match.player1?.id || null,
              player2Id: match.player2?.id || null,
              player1Seed: match.player1?.seed || null,
              player2Seed: match.player2?.seed || null,
              status: 'PENDING', winnerId: null,
              courtNumber: null, scoreJson: null, parentMatchId: null, winnerPosition: null,
            });
          }
        }
      }

      // Batch insert — createMany + then fetch back (createMany doesn't return records)
      await db.match.createMany({ data: matchRecords });
      const createdMatches = await db.match.findMany({
        where: { tournamentId, categoryId },
        orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
      });

      // Set parent relationships for knockout matches
      if (bracket.format === 'ROUND_ROBIN_KNOCKOUT') {
        const knockoutMatches = createdMatches.filter(m => m.stage === 'KNOCKOUT');
        const maxRound = Math.max(...knockoutMatches.map(m => m.round));

        for (let currentRound = maxRound; currentRound >= 2; currentRound--) {
          const roundMatches    = knockoutMatches.filter(m => m.round === currentRound).sort((a, b) => a.matchNumber - b.matchNumber);
          const parentRoundMatches = knockoutMatches.filter(m => m.round === currentRound - 1).sort((a, b) => a.matchNumber - b.matchNumber);

          await Promise.all(roundMatches.map((match, i) => {
            const parentMatch = parentRoundMatches[Math.floor(i / 2)];
            if (!parentMatch) return Promise.resolve();
            return db.match.update({
              where: { id: match.id },
              data: { parentMatchId: parentMatch.id, winnerPosition: i % 2 === 0 ? 'player1' : 'player2' }
            });
          }));
        }
      }

      return createdMatches;
    }

    // Pure knockout
    for (const round of bracket.rounds || []) {
      for (const match of round.matches || []) {
        matchRecords.push({
          tournamentId, categoryId,
          round: round.roundNumber, matchNumber: match.matchNumber, stage: 'KNOCKOUT',
          player1Id: match.participant1?.id || null,
          player2Id: match.participant2?.id || null,
          player1Seed: match.participant1?.seed || null,
          player2Seed: match.participant2?.seed || null,
          status: match.status === 'bye' ? 'COMPLETED' : (match.participant1 && match.participant2) ? 'READY' : 'PENDING',
          winnerId: match.winner?.id || null,
          courtNumber: null, scoreJson: null, parentMatchId: null, winnerPosition: null,
        });
      }
    }

    // Batch insert
    await db.match.createMany({ data: matchRecords });
    const createdMatches = await db.match.findMany({
      where: { tournamentId, categoryId },
      orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
    });

    // Set parent relationships (pure knockout)
    if (bracket.format === 'single_elimination') {
      const maxRound = Math.max(...createdMatches.map(m => m.round));

      for (let currentRound = maxRound; currentRound >= 2; currentRound--) {
        const roundMatches = createdMatches.filter(m => m.round === currentRound);

        await Promise.all(roundMatches.map((match, i) => {
          const parentMatchNumber = Math.floor(i / 2) + 1;
          const parentMatch = createdMatches.find(m => m.round === currentRound - 1 && m.matchNumber === parentMatchNumber);
          if (!parentMatch) return Promise.resolve();
          return db.match.update({
            where: { id: match.id },
            data: { parentMatchId: parentMatch.id, winnerPosition: i % 2 === 0 ? 'player1' : 'player2' }
          });
        }));
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

    const isDoubles = match.category?.format === 'doubles';

    // Helper function to get player data with partner name for doubles
    const getPlayerData = async (playerId) => {
      if (!playerId) return null;

      // Guest player (ID starts with "guest-")
      if (playerId.startsWith('guest-')) {
        const registrationId = playerId.replace('guest-', '');
        const registration = await prisma.registration.findUnique({
          where: { id: registrationId },
          select: {
            id: true,
            guestName: true,
            guestEmail: true,
            userId: true,
            // For guest doubles pairs stored as "Name1 & Name2" in guestName,
            // partnerName is already embedded; expose as-is.
          }
        });

        if (registration) {
          return {
            id: playerId,
            name: registration.guestName || 'Guest Player',
            email: registration.guestEmail || null,
            profilePhoto: null,
            isGuest: true
          };
        }
        return null;
      }

      // Regular user
      const user = await prisma.user.findUnique({
        where: { id: playerId },
        select: { id: true, name: true, email: true, profilePhoto: true }
      });

      if (!user) return null;

      // For doubles categories, look up partner name from registration
      if (isDoubles) {
        const reg = await prisma.registration.findFirst({
          where: {
            categoryId: match.categoryId,
            userId: playerId,
          },
          include: {
            partner: { select: { id: true, name: true } }
          }
        });
        if (reg?.partner) {
          return { ...user, partnerName: reg.partner.name, partnerId: reg.partner.id };
        }
      }

      return user;
    };

    // Fetch player details
    const player1 = await getPlayerData(match.player1Id);
    const player2 = await getPlayerData(match.player2Id);

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

    // STAGE ISOLATION GUARD: only a KNOCKOUT match may ever advance a winner into
    // another match's slot — mirrors the same guard in match.routes.js endMatchHandler.
    // This function is not currently wired to any route, but must stay safe if it ever is.
    if (match.parentMatchId && match.winnerPosition && match.stage === 'KNOCKOUT') {
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
