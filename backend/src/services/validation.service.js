/**
 * Validation Service
 * Provides validation functions for tournament system operations
 */

class ValidationService {
  /**
   * Validate participant count
   * @param {number} count - Number of participants
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validateParticipantCount(count) {
    const errors = [];
    
    if (typeof count !== 'number' || isNaN(count)) {
      errors.push('Participant count must be a valid number');
      return { isValid: false, errors };
    }
    
    if (count < 2) {
      errors.push('Tournament requires at least 2 participants');
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  }

  /**
   * Validate qualifier count
   * @param {number} qualifierCount - Number of qualifiers to advance
   * @param {number} totalParticipants - Total number of participants
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validateQualifierCount(qualifierCount, totalParticipants) {
    const errors = [];
    
    if (typeof qualifierCount !== 'number' || isNaN(qualifierCount)) {
      errors.push('Qualifier count must be a valid number');
      return { isValid: false, errors };
    }
    
    if (typeof totalParticipants !== 'number' || isNaN(totalParticipants)) {
      errors.push('Total participants must be a valid number');
      return { isValid: false, errors };
    }
    
    if (qualifierCount < 1) {
      errors.push('Must select at least 1 qualifier');
      return { isValid: false, errors };
    }
    
    if (qualifierCount > totalParticipants) {
      errors.push(`Cannot select ${qualifierCount} qualifiers from ${totalParticipants} participants`);
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  }

  /**
   * Validate round-robin format compatibility
   * @param {number} participantCount - Number of participants
   * @returns {{isValid: boolean, errors: string[]}}
   */
  validateRoundRobinFormat(participantCount) {
    const errors = [];
    
    if (typeof participantCount !== 'number' || isNaN(participantCount)) {
      errors.push('Participant count must be a valid number');
      return { isValid: false, errors };
    }
    
    if (participantCount < 2) {
      errors.push('Round-robin tournament requires at least 2 participants');
      return { isValid: false, errors };
    }
    
    return { isValid: true, errors: [] };
  }

  /**
   * Calculate number of knockout rounds needed
   * @param {number} participantCount - Number of participants
   * @returns {number} - Number of rounds
   */
  calculateKnockoutRounds(participantCount) {
    if (participantCount < 2) return 0;
    return Math.ceil(Math.log2(participantCount));
  }

  /**
   * Calculate number of byes needed
   * @param {number} participantCount - Number of participants
   * @returns {number} - Number of byes
   */
  calculateByes(participantCount) {
    if (participantCount < 2) return 0;
    const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(participantCount)));
    return nextPowerOfTwo - participantCount;
  }

  /**
   * Get round name based on remaining participants
   * @param {number} roundNumber - Current round number (1 = Finals, 2 = Semifinals, etc.)
   * @param {number} totalRounds - Total number of rounds
   * @returns {string} - Round name
   */
  getRoundName(roundNumber, totalRounds) {
    const remainingParticipants = Math.pow(2, roundNumber);
    
    if (remainingParticipants === 2) return 'Finals';
    if (remainingParticipants === 4) return 'Semifinals';
    if (remainingParticipants === 8) return 'Quarterfinals';
    
    // For other rounds, use reverse numbering from the end
    const roundFromStart = totalRounds - roundNumber + 1;
    return `Round ${roundFromStart}`;
  }
}

export default new ValidationService();
