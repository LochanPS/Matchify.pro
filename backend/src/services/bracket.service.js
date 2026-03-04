import { nextPowerOf2, calculateByes, distributeByes, generateRoundNames } from '../utils/bracketHelpers.js';

class BracketService {
  /**
   * Generate a single elimination bracket
   * @param {Array} participants - Array of participants with { id, name, seed }
   * @returns {Object} - Bracket structure
   */
  generateSingleEliminationBracket(participants) {
    const participantCount = participants.length;
    
    if (participantCount < 2) {
      throw new Error('At least 2 participants required for a bracket');
    }

    const nextPower = nextPowerOf2(participantCount);
    const byeCount = calculateByes(participantCount);
    const byeSeeds = distributeByes(participantCount, byeCount);
    
    // Calculate total rounds
    const totalRounds = Math.log2(nextPower);
    const roundNames = generateRoundNames(totalRounds);

    // Sort participants by seed
    const sortedParticipants = [...participants].sort((a, b) => a.seed - b.seed);

    // Initialize bracket structure
    const bracket = {
      format: 'single_elimination',
      totalRounds: totalRounds,
      totalParticipants: participantCount,
      byes: byeCount,
      rounds: []
    };

    // Generate first round matches
    const firstRoundMatches = this.generateFirstRoundMatches(
      sortedParticipants,
      byeSeeds,
      nextPower
    );

    // Build all rounds
    bracket.rounds = this.buildRounds(firstRoundMatches, totalRounds, roundNames);

    return bracket;
  }

  /**
   * Generate first round matches with proper seeding
   */
  generateFirstRoundMatches(participants, byeSeeds, bracketSize) {
    const matches = [];
    const matchups = this.generateMatchups(bracketSize);

    for (const [seed1, seed2] of matchups) {
      const participant1 = participants.find(p => p.seed === seed1);
      const participant2 = participants.find(p => p.seed === seed2);

      const match = {
        matchNumber: matches.length + 1,
        participant1: participant1 || null,
        participant2: participant2 || null,
        winner: null,
        status: 'pending'
      };

      // If either participant is null (bye), auto-advance the other
      if (!participant1 && participant2) {
        match.winner = participant2;
        match.status = 'bye';
      } else if (participant1 && !participant2) {
        match.winner = participant1;
        match.status = 'bye';
      }

      matches.push(match);
    }

    return matches;
  }

  /**
   * Generate standard tournament matchups based on bracket size
   * Returns array of [seed1, seed2] pairs
   */
  generateMatchups(bracketSize) {
    const matchups = [];
    const seeds = Array.from({ length: bracketSize }, (_, i) => i + 1);

    // Standard bracket pairing: 1 vs bracket_size, 2 vs bracket_size-1, etc.
    for (let i = 0; i < bracketSize / 2; i++) {
      matchups.push([seeds[i], seeds[bracketSize - 1 - i]]);
    }

    return matchups;
  }

  /**
   * Build all rounds of the bracket
   */
  buildRounds(firstRoundMatches, totalRounds, roundNames) {
    const rounds = [];

    // Round 1
    rounds.push({
      roundNumber: 1,
      roundName: roundNames[0],
      matches: firstRoundMatches
    });

    // Generate subsequent rounds
    for (let i = 2; i <= totalRounds; i++) {
      const previousRoundMatches = rounds[i - 2].matches;
      const currentRoundMatches = [];

      for (let j = 0; j < previousRoundMatches.length; j += 2) {
        const match1 = previousRoundMatches[j];
        const match2 = previousRoundMatches[j + 1];

        currentRoundMatches.push({
          matchNumber: currentRoundMatches.length + 1,
          participant1: match1.winner || null,
          participant2: match2.winner || null,
          winner: null,
          status: 'pending',
          previousMatches: [match1.matchNumber, match2.matchNumber]
        });
      }

      rounds.push({
        roundNumber: i,
        roundName: roundNames[i - 1],
        matches: currentRoundMatches
      });
    }

    return rounds;
  }
}

export default new BracketService();
