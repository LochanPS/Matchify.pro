/**
 * Property-Based Tests for Validation Service
 * Feature: tournament-system-reliability
 */

import { describe, it, expect } from '@jest/globals';
import fc from 'fast-check';
import validationService from '../src/services/validation.service.js';

describe('Validation Service - Property-Based Tests', () => {
  /**
   * Property 34: Minimum Participant Validation
   * For any attempt to create a tournament with N < 2 participants,
   * the system should reject the creation and return a validation error.
   * Validates: Requirements 13.1
   */
  it('Property 34: should reject participant counts less than 2', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 1 }), // Generate counts less than 2
        (count) => {
          const result = validationService.validateParticipantCount(count);
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 34 (continued): should accept participant counts >= 2
   */
  it('Property 34: should accept participant counts of 2 or more', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }), // Generate valid counts
        (count) => {
          const result = validationService.validateParticipantCount(count);
          expect(result.isValid).toBe(true);
          expect(result.errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 8: Qualifier Count Validation
   * For any qualifier count Q and participant count N,
   * the system should accept Q if and only if 1 ≤ Q ≤ N
   * Validates: Requirements 3.1, 3.2, 13.3
   */
  it('Property 8: should reject qualifier count less than 1', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }), // Total participants
        fc.integer({ min: -100, max: 0 }), // Invalid qualifier count
        (totalParticipants, qualifierCount) => {
          const result = validationService.validateQualifierCount(
            qualifierCount,
            totalParticipants
          );
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8: should reject qualifier count greater than total participants', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 50 }), // Total participants
        (totalParticipants) => {
          const qualifierCount = totalParticipants + fc.sample(fc.integer({ min: 1, max: 50 }), 1)[0];
          const result = validationService.validateQualifierCount(
            qualifierCount,
            totalParticipants
          );
          expect(result.isValid).toBe(false);
          expect(result.errors.length).toBeGreaterThan(0);
          expect(result.errors[0]).toContain('Cannot select');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('Property 8: should accept valid qualifier counts (1 <= Q <= N)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }), // Total participants
        (totalParticipants) => {
          const qualifierCount = fc.sample(
            fc.integer({ min: 1, max: totalParticipants }),
            1
          )[0];
          const result = validationService.validateQualifierCount(
            qualifierCount,
            totalParticipants
          );
          expect(result.isValid).toBe(true);
          expect(result.errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 35: Round-Robin Format Compatibility
   * For any participant count N >= 2, creating a round-robin tournament
   * should succeed and generate valid matches.
   * Validates: Requirements 13.2
   */
  it('Property 35: should accept any participant count >= 2 for round-robin', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }),
        (participantCount) => {
          const result = validationService.validateRoundRobinFormat(participantCount);
          expect(result.isValid).toBe(true);
          expect(result.errors.length).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 12: Knockout Round Count Formula
   * For any knockout tournament with N participants,
   * the system should create exactly ⌈log₂(N)⌉ rounds.
   * Validates: Requirements 4.2, 5.1
   */
  it('Property 12: should calculate correct number of knockout rounds', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }),
        (participantCount) => {
          const rounds = validationService.calculateKnockoutRounds(participantCount);
          const expectedRounds = Math.ceil(Math.log2(participantCount));
          expect(rounds).toBe(expectedRounds);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11: Bye Count Calculation
   * For any knockout bracket with N participants where N is not a power of two,
   * the number of byes should equal 2^⌈log₂(N)⌉ - N.
   * Validates: Requirements 3.5, 11.1
   */
  it('Property 11: should calculate correct number of byes', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }),
        (participantCount) => {
          const byes = validationService.calculateByes(participantCount);
          const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(participantCount)));
          const expectedByes = nextPowerOfTwo - participantCount;
          expect(byes).toBe(expectedByes);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 11 (continued): byes should be 0 for power-of-two participant counts
   */
  it('Property 11: should have zero byes for power-of-two participant counts', () => {
    const powersOfTwo = [2, 4, 8, 16, 32, 64];
    powersOfTwo.forEach(count => {
      const byes = validationService.calculateByes(count);
      expect(byes).toBe(0);
    });
  });

  /**
   * Property 15: Round Naming Correctness
   * For any knockout round, the round name should correctly reflect
   * the number of remaining participants.
   * Validates: Requirements 5.2
   */
  it('Property 15: should name rounds correctly', () => {
    // Test specific cases
    // roundNumber=1 means 2^1=2 participants (Finals)
    expect(validationService.getRoundName(1, 3)).toBe('Finals');
    // roundNumber=2 means 2^2=4 participants (Semifinals)
    expect(validationService.getRoundName(2, 3)).toBe('Semifinals');
    // roundNumber=3 means 2^3=8 participants (Quarterfinals)
    expect(validationService.getRoundName(3, 3)).toBe('Quarterfinals');
    // roundNumber=3 with totalRounds=5 means 2^3=8 participants (Quarterfinals)
    expect(validationService.getRoundName(3, 5)).toBe('Quarterfinals');
    // roundNumber=4 with totalRounds=5 means 2^4=16 participants (Round 2)
    expect(validationService.getRoundName(4, 5)).toBe('Round 2');
    // roundNumber=5 with totalRounds=5 means 2^5=32 participants (Round 1)
    expect(validationService.getRoundName(5, 5)).toBe('Round 1');
  });

  /**
   * Property 2: Dynamic Participant Count Support
   * For any participant count N where 2 ≤ N ≤ 100,
   * the system should successfully validate without hardcoded limits.
   * Validates: Requirements 1.2, 1.3
   */
  it('Property 2: should support any participant count from 2 to 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 100 }),
        (participantCount) => {
          const validation = validationService.validateParticipantCount(participantCount);
          expect(validation.isValid).toBe(true);
          
          const rounds = validationService.calculateKnockoutRounds(participantCount);
          expect(rounds).toBeGreaterThan(0);
          expect(rounds).toBeLessThanOrEqual(7); // log2(100) ≈ 6.64
          
          const byes = validationService.calculateByes(participantCount);
          expect(byes).toBeGreaterThanOrEqual(0);
          expect(byes).toBeLessThan(participantCount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
