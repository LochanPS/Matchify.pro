/**
 * Property-Based Tests for Match Generation Service
 * Feature: tournament-system-reliability
 * Task 3.1: Create MatchGenerationService with round-robin logic
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fc from 'fast-check';
import { PrismaClient } from '@prisma/client';
import matchGenerationService from '../src/services/matchGeneration.service.js';

const prisma = new PrismaClient();

describe('Match Generation Service - Round-Robin Tests', () => {
  let testTournamentId;
  let testCategoryId;
  let testOrganizerId;

  beforeAll(async () => {
    // Create a test user (organizer) first
    const testUser = await prisma.user.create({
      data: {
        email: `test-organizer-${Date.now()}@test.com`,
        password: 'test-password',
        name: 'Test Organizer',
        phone: `+91${Date.now().toString().slice(-10)}`,
        roles: 'ORGANIZER'
      }
    });
    testOrganizerId = testUser.id;

    // Create a test tournament and category for our tests
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Test Tournament for Match Generation',
        description: 'Test tournament',
        venue: 'Test Venue',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        zone: 'Test Zone',
        registrationOpenDate: '2024-01-01',
        registrationCloseDate: '2024-01-31',
        startDate: '2024-02-01',
        endDate: '2024-02-28',
        format: 'ROUND_ROBIN',
        organizerId: testOrganizerId
      }
    });
    testTournamentId = tournament.id;

    const category = await prisma.category.create({
      data: {
        tournamentId: testTournamentId,
        name: 'Test Category',
        format: 'SINGLES',
        gender: 'MIXED',
        entryFee: 100,
        tournamentFormat: 'ROUND_ROBIN',
        scoringFormat: '21x3'
      }
    });
    testCategoryId = category.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testCategoryId) {
      await prisma.match.deleteMany({ where: { categoryId: testCategoryId } });
      await prisma.category.delete({ where: { id: testCategoryId } });
    }
    if (testTournamentId) {
      await prisma.tournament.delete({ where: { id: testTournamentId } });
    }
    if (testOrganizerId) {
      await prisma.user.delete({ where: { id: testOrganizerId } });
    }
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up matches before each test
    await prisma.match.deleteMany({ 
      where: { 
        tournamentId: testTournamentId,
        categoryId: testCategoryId 
      } 
    });
  });

  /**
   * Property 3: Round-Robin Match Count Formula
   * For any round-robin tournament with N participants,
   * the system should generate exactly N × (N-1) / 2 matches.
   * **Validates: Requirements 2.1**
   */
  it('Property 3: should generate exactly N×(N-1)/2 matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 20 }), // Limit to 20 for test performance
        async (participantCount) => {
          // Clean up before this iteration
          await prisma.match.deleteMany({ 
            where: { 
              tournamentId: testTournamentId,
              categoryId: testCategoryId 
            } 
          });

          // Generate test participants
          const participants = Array.from({ length: participantCount }, (_, i) => ({
            id: `participant-${i}`,
            name: `Player ${i}`,
            seed: i + 1
          }));

          // Generate matches
          const matches = await matchGenerationService.generateRoundRobinMatches(
            testTournamentId,
            testCategoryId,
            participants
          );

          // Verify match count formula
          const expectedCount = (participantCount * (participantCount - 1)) / 2;
          expect(matches.length).toBe(expectedCount);
        }
      ),
      { numRuns: 50 } // Run 50 iterations
    );
  }, 30000); // 30 second timeout

  /**
   * Property 4: Round-Robin Participant Match Count
   * For any participant in a round-robin tournament with N participants,
   * that participant should appear in exactly N-1 matches.
   * **Validates: Requirements 2.2**
   */
  it('Property 4: each participant should appear in exactly N-1 matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 15 }),
        async (participantCount) => {
          // Clean up before this iteration
          await prisma.match.deleteMany({ 
            where: { 
              tournamentId: testTournamentId,
              categoryId: testCategoryId 
            } 
          });

          const participants = Array.from({ length: participantCount }, (_, i) => ({
            id: `participant-${i}`,
            name: `Player ${i}`,
            seed: i + 1
          }));

          const matches = await matchGenerationService.generateRoundRobinMatches(
            testTournamentId,
            testCategoryId,
            participants
          );

          // Count matches for each participant
          const participantMatchCounts = {};
          for (const match of matches) {
            participantMatchCounts[match.player1Id] = 
              (participantMatchCounts[match.player1Id] || 0) + 1;
            participantMatchCounts[match.player2Id] = 
              (participantMatchCounts[match.player2Id] || 0) + 1;
          }

          // Verify each participant appears in exactly N-1 matches
          for (const participant of participants) {
            expect(participantMatchCounts[participant.id]).toBe(participantCount - 1);
          }
        }
      ),
      { numRuns: 50 }
    );
  }, 30000); // 30 second timeout

  /**
   * Property 5: Round-Robin Match Uniqueness
   * For any round-robin tournament, no two matches should have
   * the same pair of participants (regardless of order).
   * **Validates: Requirements 2.3, 9.1**
   */
  it('Property 5: should not generate duplicate matches', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 15 }),
        async (participantCount) => {
          // Clean up before this iteration
          await prisma.match.deleteMany({ 
            where: { 
              tournamentId: testTournamentId,
              categoryId: testCategoryId 
            } 
          });

          const participants = Array.from({ length: participantCount }, (_, i) => ({
            id: `participant-${i}`,
            name: `Player ${i}`,
            seed: i + 1
          }));

          const matches = await matchGenerationService.generateRoundRobinMatches(
            testTournamentId,
            testCategoryId,
            participants
          );

          // Check for duplicate pairings
          const pairings = new Set();
          for (const match of matches) {
            // Create normalized pairing (smaller ID first)
            const pair = [match.player1Id, match.player2Id].sort().join('-');
            
            // Verify this pairing hasn't been seen before
            expect(pairings.has(pair)).toBe(false);
            pairings.add(pair);
          }

          // Verify we have the correct number of unique pairings
          const expectedCount = (participantCount * (participantCount - 1)) / 2;
          expect(pairings.size).toBe(expectedCount);
        }
      ),
      { numRuns: 50 }
    );
  }, 30000); // 30 second timeout

  /**
   * Property 6: Round-Robin Match Persistence
   * For any round-robin tournament, after match generation completes,
   * querying storage should return all generated matches with correct
   * participant assignments.
   * **Validates: Requirements 2.4**
   */
  it('Property 6: should persist all matches to database immediately', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 12 }),
        async (participantCount) => {
          // Clean up before this iteration
          await prisma.match.deleteMany({ 
            where: { 
              tournamentId: testTournamentId,
              categoryId: testCategoryId 
            } 
          });

          const participants = Array.from({ length: participantCount }, (_, i) => ({
            id: `participant-${i}`,
            name: `Player ${i}`,
            seed: i + 1
          }));

          // Generate matches
          const returnedMatches = await matchGenerationService.generateRoundRobinMatches(
            testTournamentId,
            testCategoryId,
            participants
          );

          // Query database to verify persistence
          const storedMatches = await prisma.match.findMany({
            where: {
              tournamentId: testTournamentId,
              categoryId: testCategoryId,
              stage: 'GROUP'
            }
          });

          // Verify all matches were persisted
          expect(storedMatches.length).toBe(returnedMatches.length);
          
          // Verify participant assignments are correct
          for (const returnedMatch of returnedMatches) {
            const storedMatch = storedMatches.find(m => m.id === returnedMatch.id);
            expect(storedMatch).toBeDefined();
            expect(storedMatch.player1Id).toBe(returnedMatch.player1Id);
            expect(storedMatch.player2Id).toBe(returnedMatch.player2Id);
            expect(storedMatch.tournamentId).toBe(testTournamentId);
            expect(storedMatch.categoryId).toBe(testCategoryId);
          }
        }
      ),
      { numRuns: 30 }
    );
  }, 30000); // 30 second timeout

  /**
   * Property 7: Round-Robin Match Generation Determinism
   * For any set of participants, generating round-robin matches twice
   * should produce matches in the same order with the same pairings.
   * **Validates: Requirements 2.5**
   */
  it('Property 7: should generate matches deterministically', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 2, max: 10 }),
        async (participantCount) => {
          // Clean up before this iteration
          await prisma.match.deleteMany({ 
            where: { 
              tournamentId: testTournamentId,
              categoryId: testCategoryId 
            } 
          });

          const participants = Array.from({ length: participantCount }, (_, i) => ({
            id: `participant-${i}`,
            name: `Player ${i}`,
            seed: i + 1
          }));

          // Generate matches first time
          const matches1 = await matchGenerationService.generateRoundRobinMatches(
            testTournamentId,
            testCategoryId,
            participants
          );

          // Clean up
          await prisma.match.deleteMany({ where: { categoryId: testCategoryId } });

          // Generate matches second time with same participants
          const matches2 = await matchGenerationService.generateRoundRobinMatches(
            testTournamentId,
            testCategoryId,
            participants
          );

          // Verify same number of matches
          expect(matches1.length).toBe(matches2.length);

          // Verify same pairings in same order
          for (let i = 0; i < matches1.length; i++) {
            // Note: IDs will be different, but pairings should be the same
            expect(matches2[i].player1Id).toBe(matches1[i].player1Id);
            expect(matches2[i].player2Id).toBe(matches1[i].player2Id);
            expect(matches2[i].matchNumber).toBe(matches1[i].matchNumber);
          }
        }
      ),
      { numRuns: 30 }
    );
  }, 30000); // 30 second timeout

  /**
   * Unit Test: Edge case with exactly 2 participants
   */
  it('should handle minimum case of 2 participants', async () => {
    const participants = [
      { id: 'p1', name: 'Player 1', seed: 1 },
      { id: 'p2', name: 'Player 2', seed: 2 }
    ];

    const matches = await matchGenerationService.generateRoundRobinMatches(
      testTournamentId,
      testCategoryId,
      participants
    );

    expect(matches.length).toBe(1);
    expect(matches[0].player1Id).toBe('p1');
    expect(matches[0].player2Id).toBe('p2');
  });

  /**
   * Unit Test: Verify match count calculation helper
   */
  it('should calculate correct match count for various participant counts', () => {
    expect(matchGenerationService.calculateRoundRobinMatchCount(2)).toBe(1);
    expect(matchGenerationService.calculateRoundRobinMatchCount(3)).toBe(3);
    expect(matchGenerationService.calculateRoundRobinMatchCount(4)).toBe(6);
    expect(matchGenerationService.calculateRoundRobinMatchCount(5)).toBe(10);
    expect(matchGenerationService.calculateRoundRobinMatchCount(8)).toBe(28);
    expect(matchGenerationService.calculateRoundRobinMatchCount(16)).toBe(120);
  });

  /**
   * Unit Test: Verify match verification helper
   */
  it('should verify round-robin matches correctly', () => {
    const validMatches = [
      { player1Id: 'p1', player2Id: 'p2' },
      { player1Id: 'p1', player2Id: 'p3' },
      { player1Id: 'p2', player2Id: 'p3' }
    ];

    const result = matchGenerationService.verifyRoundRobinMatches(validMatches, 3);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  /**
   * Unit Test: Verify detection of incorrect match count
   */
  it('should detect incorrect match count', () => {
    const invalidMatches = [
      { player1Id: 'p1', player2Id: 'p2' },
      { player1Id: 'p1', player2Id: 'p3' }
      // Missing p2 vs p3
    ];

    const result = matchGenerationService.verifyRoundRobinMatches(invalidMatches, 3);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Expected 3 matches');
  });

  /**
   * Unit Test: Verify detection of duplicate matches
   */
  it('should detect duplicate matches', () => {
    const duplicateMatches = [
      { player1Id: 'p1', player2Id: 'p2' },
      { player1Id: 'p2', player2Id: 'p1' }, // Duplicate (reverse order)
      { player1Id: 'p1', player2Id: 'p3' }
    ];

    const result = matchGenerationService.verifyRoundRobinMatches(duplicateMatches, 3);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate match'))).toBe(true);
  });

  /**
   * Unit Test: Error handling for insufficient participants
   */
  it('should reject generation with less than 2 participants', async () => {
    const participants = [{ id: 'p1', name: 'Player 1', seed: 1 }];

    await expect(
      matchGenerationService.generateRoundRobinMatches(
        testTournamentId,
        testCategoryId,
        participants
      )
    ).rejects.toThrow('At least 2 participants required');
  });

  /**
   * Unit Test: Error handling for empty participants
   */
  it('should reject generation with empty participants array', async () => {
    await expect(
      matchGenerationService.generateRoundRobinMatches(
        testTournamentId,
        testCategoryId,
        []
      )
    ).rejects.toThrow('At least 2 participants required');
  });
});
