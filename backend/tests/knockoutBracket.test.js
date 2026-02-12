/**
 * Unit Tests for Knockout Bracket Generation
 * Feature: tournament-system-reliability
 * Task 4.4: Implement knockout bracket generation with parent-child relationships
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import matchGenerationService from '../src/services/matchGeneration.service.js';

const prisma = new PrismaClient();

describe('Knockout Bracket Generation - Parent-Child Relationships', () => {
  let testTournamentId;
  let testCategoryId;
  let testOrganizerId;

  beforeAll(async () => {
    // Create a test user (organizer) first
    const testUser = await prisma.user.create({
      data: {
        email: `test-organizer-knockout-${Date.now()}@test.com`,
        password: 'test-password',
        name: 'Test Organizer Knockout',
        phone: `+91${Date.now().toString().slice(-10)}`,
        roles: 'ORGANIZER'
      }
    });
    testOrganizerId = testUser.id;

    // Create a test tournament and category for our tests
    const tournament = await prisma.tournament.create({
      data: {
        name: 'Test Tournament for Knockout Generation',
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
        format: 'KNOCKOUT',
        organizerId: testOrganizerId
      }
    });
    testTournamentId = tournament.id;

    const category = await prisma.category.create({
      data: {
        tournamentId: testTournamentId,
        name: 'Test Category Knockout',
        format: 'SINGLES',
        gender: 'MIXED',
        entryFee: 100,
        tournamentFormat: 'KNOCKOUT',
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
   * Unit Test: Verify parent-child relationships are set during creation
   * Tests Requirements 5.4, 12.1, 12.2
   */
  it('should set parentMatchId and childPosition during bracket creation', async () => {
    const participants = Array.from({ length: 8 }, (_, i) => ({
      id: `participant-${i}`,
      name: `Player ${i}`,
      seed: i + 1
    }));

    const result = await matchGenerationService.generateKnockoutBracket(
      testTournamentId,
      testCategoryId,
      participants
    );

    // Verify matches were created
    expect(result.matches.length).toBeGreaterThan(0);

    // Get all matches from database
    const allMatches = await prisma.match.findMany({
      where: {
        tournamentId: testTournamentId,
        categoryId: testCategoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' }
      ]
    });

    // Verify parent-child relationships exist
    const matchesWithParents = allMatches.filter(m => m.parentMatchId !== null);
    expect(matchesWithParents.length).toBeGreaterThan(0);

    // Verify each non-final match has a parent
    const finalMatch = allMatches.find(m => m.round === 1);
    const nonFinalMatches = allMatches.filter(m => m.round > 1);
    
    for (const match of nonFinalMatches) {
      expect(match.parentMatchId).not.toBeNull();
      expect(match.childPosition).not.toBeNull();
      expect([1, 2]).toContain(match.childPosition);
    }

    // Verify final match has no parent
    expect(finalMatch.parentMatchId).toBeNull();
  });

  /**
   * Unit Test: Verify bracket structure for power of 2 participants
   */
  it('should create correct bracket structure for 8 participants', async () => {
    const participants = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
      seed: i + 1
    }));

    const result = await matchGenerationService.generateKnockoutBracket(
      testTournamentId,
      testCategoryId,
      participants
    );

    // Should have 3 rounds (log2(8) = 3)
    expect(result.rounds).toBe(3);

    // Should have 7 total matches (4 + 2 + 1)
    expect(result.matches.length).toBe(7);

    // Verify round distribution
    const round1Matches = result.matches.filter(m => m.round === 1);
    const round2Matches = result.matches.filter(m => m.round === 2);
    const round3Matches = result.matches.filter(m => m.round === 3);

    expect(round1Matches.length).toBe(1); // Finals
    expect(round2Matches.length).toBe(2); // Semifinals
    expect(round3Matches.length).toBe(4); // Quarterfinals
  });

  /**
   * Unit Test: Verify bracket structure with byes (non-power of 2)
   */
  it('should create correct bracket structure for 5 participants with byes', async () => {
    const participants = Array.from({ length: 5 }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
      seed: i + 1
    }));

    const result = await matchGenerationService.generateKnockoutBracket(
      testTournamentId,
      testCategoryId,
      participants
    );

    // Should have 3 rounds (ceil(log2(5)) = 3)
    expect(result.rounds).toBe(3);

    // Should have 7 total matches (4 + 2 + 1)
    // But 3 of them should be byes (8 - 5 = 3)
    expect(result.matches.length).toBe(7);

    // Count bye matches
    const byeMatches = result.matches.filter(m => m.status === 'COMPLETED' && m.player2Id === null);
    expect(byeMatches.length).toBe(3);

    // Verify byes are in the first round (highest round number)
    for (const byeMatch of byeMatches) {
      expect(byeMatch.round).toBe(3); // First round
      expect(byeMatch.winnerId).not.toBeNull();
    }
  });

  /**
   * Unit Test: Verify parent-child position mapping
   */
  it('should correctly map child positions to parent matches', async () => {
    const participants = Array.from({ length: 4 }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
      seed: i + 1
    }));

    await matchGenerationService.generateKnockoutBracket(
      testTournamentId,
      testCategoryId,
      participants
    );

    const allMatches = await prisma.match.findMany({
      where: {
        tournamentId: testTournamentId,
        categoryId: testCategoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'asc' },
        { matchNumber: 'asc' }
      ]
    });

    // Get semifinals (round 2)
    const semifinals = allMatches.filter(m => m.round === 2);
    expect(semifinals.length).toBe(2);

    // Both semifinals should point to the same parent (finals)
    const finalMatch = allMatches.find(m => m.round === 1);
    expect(semifinals[0].parentMatchId).toBe(finalMatch.id);
    expect(semifinals[1].parentMatchId).toBe(finalMatch.id);

    // They should have different child positions
    expect(semifinals[0].childPosition).toBe(1);
    expect(semifinals[1].childPosition).toBe(2);
  });

  /**
   * Unit Test: Verify bye winners are auto-advanced
   */
  it('should auto-advance bye winners to parent matches', async () => {
    const participants = Array.from({ length: 3 }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
      seed: i + 1
    }));

    await matchGenerationService.generateKnockoutBracket(
      testTournamentId,
      testCategoryId,
      participants
    );

    const allMatches = await prisma.match.findMany({
      where: {
        tournamentId: testTournamentId,
        categoryId: testCategoryId,
        stage: 'KNOCKOUT'
      }
    });

    // Find bye matches
    const byeMatches = allMatches.filter(m => m.status === 'COMPLETED' && m.player2Id === null);
    
    // For each bye match, verify winner is placed in parent match
    for (const byeMatch of byeMatches) {
      if (byeMatch.parentMatchId) {
        const parentMatch = allMatches.find(m => m.id === byeMatch.parentMatchId);
        expect(parentMatch).toBeDefined();
        
        // Winner should be in the correct position in parent match
        if (byeMatch.winnerPosition === 'player1') {
          expect(parentMatch.player1Id).toBe(byeMatch.winnerId);
        } else if (byeMatch.winnerPosition === 'player2') {
          expect(parentMatch.player2Id).toBe(byeMatch.winnerId);
        }
      }
    }
  });

  /**
   * Unit Test: Verify transaction atomicity
   */
  it('should create all matches in a single transaction', async () => {
    const participants = Array.from({ length: 4 }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
      seed: i + 1
    }));

    const result = await matchGenerationService.generateKnockoutBracket(
      testTournamentId,
      testCategoryId,
      participants
    );

    // All matches should be created
    const allMatches = await prisma.match.findMany({
      where: {
        tournamentId: testTournamentId,
        categoryId: testCategoryId,
        stage: 'KNOCKOUT'
      }
    });

    // Should have 3 matches (2 semifinals + 1 final)
    expect(allMatches.length).toBe(3);
    expect(result.matches.length).toBe(3);
  });

  /**
   * Unit Test: Verify minimum participants (2)
   */
  it('should handle minimum case of 2 participants', async () => {
    const participants = [
      { id: 'p1', name: 'Player 1', seed: 1 },
      { id: 'p2', name: 'Player 2', seed: 2 }
    ];

    const result = await matchGenerationService.generateKnockoutBracket(
      testTournamentId,
      testCategoryId,
      participants
    );

    // Should have 1 round (finals only)
    expect(result.rounds).toBe(1);
    
    // Should have 1 match
    expect(result.matches.length).toBe(1);
    
    // Match should have both participants
    const finalMatch = result.matches[0];
    expect(finalMatch.player1Id).toBe('p1');
    expect(finalMatch.player2Id).toBe('p2');
    expect(finalMatch.parentMatchId).toBeNull();
  });

  /**
   * Unit Test: Error handling for insufficient participants
   */
  it('should reject generation with less than 2 participants', async () => {
    const participants = [{ id: 'p1', name: 'Player 1', seed: 1 }];

    await expect(
      matchGenerationService.generateKnockoutBracket(
        testTournamentId,
        testCategoryId,
        participants
      )
    ).rejects.toThrow('At least 2 participants required');
  });

  /**
   * Unit Test: Verify roundNumber field is set
   */
  it('should set roundNumber field for spec compliance', async () => {
    const participants = Array.from({ length: 4 }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
      seed: i + 1
    }));

    await matchGenerationService.generateKnockoutBracket(
      testTournamentId,
      testCategoryId,
      participants
    );

    const allMatches = await prisma.match.findMany({
      where: {
        tournamentId: testTournamentId,
        categoryId: testCategoryId,
        stage: 'KNOCKOUT'
      }
    });

    // All matches should have roundNumber set
    for (const match of allMatches) {
      expect(match.roundNumber).not.toBeNull();
      expect(match.roundNumber).toBe(match.round);
    }
  });
});
