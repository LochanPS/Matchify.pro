import prisma from '../lib/prisma.js';
import seedingService from '../services/seeding.service.js';
import bracketService from '../services/bracket.service.js';
import matchService from '../services/match.service.js';

/**
 * Helper function to check if category is completed
 * Returns error response if category is completed
 */
async function checkCategoryNotCompleted(categoryId, res) {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { status: true, name: true }
  });

  if (category?.status === 'completed') {
    res.status(403).json({
      success: false,
      error: `Category '${category.name}' has ended. Draw cannot be modified.`
    });
    return true; // Category is completed
  }
  return false; // Category is not completed
}

/**
 * Generate draw for a specific category
 * POST /api/tournaments/:tournamentId/categories/:categoryId/draw
 */
const generateDraw = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.id;

    // Verify tournament exists and user is the organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return res.status(404).json({ 
        success: false,
        error: 'Tournament not found' 
      });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Only the organizer can generate draws' 
      });
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category || category.tournamentId !== tournamentId) {
      return res.status(404).json({ 
        success: false,
        error: 'Category not found' 
      });
    }

    // Check if draw already exists
    const existingDraw = await prisma.draw.findUnique({
      where: {
        tournamentId_categoryId: {
          tournamentId: tournamentId,
          categoryId: categoryId
        }
      }
    });

    if (existingDraw) {
      return res.status(400).json({
        success: false,
        error: 'Draw already exists for this category',
        draw: existingDraw
      });
    }

    // Fetch all confirmed registrations for this category
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId: tournamentId,
        categoryId: categoryId,
        paymentStatus: 'completed',
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (registrations.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 confirmed participants required to generate draw'
      });
    }

    // Calculate seeds for all participants
    const participantsWithSeeds = [];
    
    for (const registration of registrations) {
      const seedScore = await seedingService.calculateSeedScore(registration.user.id);
      
      participantsWithSeeds.push({
        id: registration.user.id,
        registrationId: registration.id,
        name: registration.user.name,
        email: registration.user.email,
        seedScore: seedScore,
        seed: 0 // Will be assigned after sorting
      });
    }

    // Sort by seed score (highest first) and assign seeds
    participantsWithSeeds.sort((a, b) => b.seedScore - a.seedScore);
    participantsWithSeeds.forEach((p, index) => {
      p.seed = index + 1;
    });

    // Generate bracket
    const bracket = bracketService.generateSingleEliminationBracket(participantsWithSeeds);

    // Generate match records from bracket
    const matches = await matchService.generateMatchesFromBracket(
      bracket,
      tournamentId,
      categoryId
    );

    // 🧹 CLEANUP: Delete any old matches from previous draws
    console.log('🧹 Cleaning up old matches before creating new draw...');
    const deletedCount = await prisma.match.deleteMany({
      where: {
        tournamentId: tournamentId,
        categoryId: categoryId
      }
    });
    console.log(`✅ Deleted ${deletedCount.count} old matches`);

    // Save draw to database
    const draw = await prisma.draw.create({
      data: {
        tournamentId: tournamentId,
        categoryId: categoryId,
        format: 'single_elimination',
        bracketJson: JSON.stringify(bracket)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Draw generated successfully',
      draw: {
        id: draw.id,
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId,
        format: draw.format,
        bracket: JSON.parse(draw.bracketJson),
        totalMatches: matches.length,
        createdAt: draw.createdAt
      }
    });
   
  } catch (error) {
    console.error('Generate draw error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to generate draw',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get draw for a specific category
 * GET /api/tournaments/:tournamentId/categories/:categoryId/draw
 */
const getDraw = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;

    const draw = await prisma.draw.findUnique({
      where: {
        tournamentId_categoryId: {
          tournamentId: tournamentId,
          categoryId: categoryId
        }
      },
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
        }
      }
    });

    if (!draw) {
      return res.status(404).json({ 
        success: false,
        error: 'Draw not found' 
      });
    }

    // Fetch all matches for this category to get live data
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: tournamentId,
        categoryId: categoryId
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    // Fetch all unique player IDs from matches
    const playerIds = new Set();
    matches.forEach(match => {
      if (match.player1Id) playerIds.add(match.player1Id);
      if (match.player2Id) playerIds.add(match.player2Id);
      if (match.winnerId) playerIds.add(match.winnerId);
    });

    // Fetch player data
    const players = await prisma.user.findMany({
      where: {
        id: { in: Array.from(playerIds) }
      },
      select: {
        id: true,
        name: true
      }
    });

    // Create a player lookup map
    const playerMap = {};
    players.forEach(player => {
      playerMap[player.id] = player;
    });

    // Parse the stored bracket JSON
    let bracketData = JSON.parse(draw.bracketJson);

    // Update bracket with live match data
    if (bracketData.format === 'KNOCKOUT' && bracketData.rounds) {
      // Update knockout bracket with match results
      bracketData.rounds.forEach((round, roundIndex) => {
        round.matches.forEach((match, matchIndex) => {
          // Find the corresponding match in database
          const dbMatch = matches.find(m => 
            m.round === (bracketData.rounds.length - roundIndex) && 
            m.matchNumber === (matchIndex + 1)
          );

          if (dbMatch) {
            // Update player names
            if (dbMatch.player1Id && playerMap[dbMatch.player1Id]) {
              match.player1 = {
                id: dbMatch.player1Id,
                name: playerMap[dbMatch.player1Id].name
              };
            }
            if (dbMatch.player2Id && playerMap[dbMatch.player2Id]) {
              match.player2 = {
                id: dbMatch.player2Id,
                name: playerMap[dbMatch.player2Id].name
              };
            }

            // Update winner information
            if (dbMatch.winnerId) {
              if (dbMatch.winnerId === dbMatch.player1Id) {
                match.winner = 1;
              } else if (dbMatch.winnerId === dbMatch.player2Id) {
                match.winner = 2;
              }
            }

            // Update match status
            match.status = dbMatch.status;
            match.completed = dbMatch.status === 'COMPLETED';
            
            // Include full match data for viewing details
            match.dbMatch = {
              id: dbMatch.id,
              matchNumber: dbMatch.matchNumber,
              score: dbMatch.scoreJson, // Field is called scoreJson in database
              winnerId: dbMatch.winnerId,
              courtNumber: dbMatch.courtNumber,
              startTime: dbMatch.startTime,
              startedAt: dbMatch.startedAt,
              endTime: dbMatch.endTime,
              completedAt: dbMatch.completedAt,
              duration: dbMatch.duration,
              status: dbMatch.status
            };
          }
        });
      });
    } else if (bracketData.format === 'ROUND_ROBIN' && bracketData.groups) {
      // Update round robin bracket with match results
      bracketData.groups.forEach((group, groupIndex) => {
        if (group.matches && Array.isArray(group.matches)) {
          group.matches.forEach((match, matchIndex) => {
            // Find the corresponding match in database by match number
            // Round robin matches are stored with unique match numbers
            const dbMatch = matches.find(m => 
              m.stage === 'GROUP' &&
              m.matchNumber === match.matchNumber
            );

            if (dbMatch) {
              // Update player names
              if (dbMatch.player1Id && playerMap[dbMatch.player1Id]) {
                match.player1 = {
                  id: dbMatch.player1Id,
                  name: playerMap[dbMatch.player1Id].name
                };
              }
              if (dbMatch.player2Id && playerMap[dbMatch.player2Id]) {
                match.player2 = {
                  id: dbMatch.player2Id,
                  name: playerMap[dbMatch.player2Id].name
                };
              }

              // Update winner information
              if (dbMatch.winnerId) {
                if (dbMatch.winnerId === dbMatch.player1Id) {
                  match.winner = 1;
                } else if (dbMatch.winnerId === dbMatch.player2Id) {
                  match.winner = 2;
                }
              }

              // Update match status
              match.status = dbMatch.status;
              match.completed = dbMatch.status === 'COMPLETED';
              
              // Include full match data for viewing details
              match.dbMatch = {
                id: dbMatch.id,
                matchNumber: dbMatch.matchNumber,
                scoreJson: dbMatch.scoreJson, // Use scoreJson consistently
                winnerId: dbMatch.winnerId,
                courtNumber: dbMatch.courtNumber,
                startTime: dbMatch.startTime,
                startedAt: dbMatch.startedAt,
                endTime: dbMatch.endTime,
                completedAt: dbMatch.completedAt,
                duration: dbMatch.duration,
                status: dbMatch.status
              };
            }
          });
        }
      });
    } else if (bracketData.format === 'ROUND_ROBIN_KNOCKOUT') {
      // Update round robin groups in mixed format
      if (bracketData.groups) {
        bracketData.groups.forEach((group, groupIndex) => {
          if (group.matches && Array.isArray(group.matches)) {
            group.matches.forEach((match, matchIndex) => {
              const dbMatch = matches.find(m => 
                m.stage === 'GROUP' &&
                m.matchNumber === match.matchNumber
              );

              if (dbMatch) {
                if (dbMatch.player1Id && playerMap[dbMatch.player1Id]) {
                  match.player1 = {
                    id: dbMatch.player1Id,
                    name: playerMap[dbMatch.player1Id].name
                  };
                }
                if (dbMatch.player2Id && playerMap[dbMatch.player2Id]) {
                  match.player2 = {
                    id: dbMatch.player2Id,
                    name: playerMap[dbMatch.player2Id].name
                  };
                }

                if (dbMatch.winnerId) {
                  if (dbMatch.winnerId === dbMatch.player1Id) {
                    match.winner = 1;
                  } else if (dbMatch.winnerId === dbMatch.player2Id) {
                    match.winner = 2;
                  }
                }

                match.status = dbMatch.status;
                match.completed = dbMatch.status === 'COMPLETED';
                
                // Include full match data for viewing details
                match.dbMatch = {
                  id: dbMatch.id,
                  matchNumber: dbMatch.matchNumber,
                  scoreJson: dbMatch.scoreJson,
                  winnerId: dbMatch.winnerId,
                  courtNumber: dbMatch.courtNumber,
                  startTime: dbMatch.startTime,
                  startedAt: dbMatch.startedAt,
                  endTime: dbMatch.endTime,
                  completedAt: dbMatch.completedAt,
                  duration: dbMatch.duration,
                  status: dbMatch.status
                };
              }
            });
          }
        });
      }
      
      // Update knockout stage in mixed format
      if (bracketData.knockout) {
        bracketData.knockout.rounds.forEach((round, roundIndex) => {
          round.matches.forEach((match, matchIndex) => {
            const dbMatch = matches.find(m => 
              m.stage === 'KNOCKOUT' &&
              m.round === (bracketData.knockout.rounds.length - roundIndex) && 
              m.matchNumber === (matchIndex + 1)
            );

            if (dbMatch) {
              if (dbMatch.player1Id && playerMap[dbMatch.player1Id]) {
                match.player1 = {
                  id: dbMatch.player1Id,
                  name: playerMap[dbMatch.player1Id].name
                };
              }
              if (dbMatch.player2Id && playerMap[dbMatch.player2Id]) {
                match.player2 = {
                  id: dbMatch.player2Id,
                  name: playerMap[dbMatch.player2Id].name
                };
              }

              if (dbMatch.winnerId) {
                if (dbMatch.winnerId === dbMatch.player1Id) {
                  match.winner = 1;
                } else if (dbMatch.winnerId === dbMatch.player2Id) {
                  match.winner = 2;
                }
              }

              match.status = dbMatch.status;
              match.completed = dbMatch.status === 'COMPLETED';
              
              // Include full match data for viewing details
              match.dbMatch = {
                id: dbMatch.id,
                matchNumber: dbMatch.matchNumber,
                score: dbMatch.scoreJson, // Field is called scoreJson in database
                winnerId: dbMatch.winnerId,
                courtNumber: dbMatch.courtNumber,
                startTime: dbMatch.startTime,
                startedAt: dbMatch.startedAt,
                endTime: dbMatch.endTime,
                completedAt: dbMatch.completedAt,
                duration: dbMatch.duration,
                status: dbMatch.status
              };
            }
          });
        });
      }
    }

    res.json({
      success: true,
      draw: {
        id: draw.id,
        tournament: draw.tournament,
        category: draw.category,
        format: draw.format,
        bracketJson: bracketData, // Return updated bracket with live data
        createdAt: draw.createdAt
      }
    });
   
  } catch (error) {
    console.error('Get draw error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch draw' 
    });
  }
};

/**
 * Delete draw for a specific category
 * DELETE /api/tournaments/:tournamentId/categories/:categoryId/draw
 */
const deleteDraw = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.id;

    // Check if category is completed
    if (await checkCategoryNotCompleted(categoryId, res)) {
      return; // Response already sent
    }

    // Verify tournament exists and user is the organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!tournament) {
      return res.status(404).json({ 
        success: false,
        error: 'Tournament not found' 
      });
    }

    if (tournament.organizerId !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Only the organizer can delete draws' 
      });
    }

    // Delete all matches for this draw first
    console.log('🧹 Deleting all matches for this draw...');
    const deletedMatches = await prisma.match.deleteMany({
      where: {
        tournamentId: tournamentId,
        categoryId: categoryId
      }
    });
    console.log(`✅ Deleted ${deletedMatches.count} matches`);

    // Delete draw
    await prisma.draw.delete({
      where: {
        tournamentId_categoryId: {
          tournamentId: tournamentId,
          categoryId: categoryId
        }
      }
    });

    res.json({
      success: true,
      message: 'Draw and all associated matches deleted successfully'
    });
   
  } catch (error) {
    console.error('Delete draw error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete draw' 
    });
  }
};

/**
 * Get registered players for a category (for draw assignment)
 * GET /api/tournaments/:tournamentId/categories/:categoryId/players
 */
const getCategoryPlayers = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;

    // Get confirmed registrations for this category
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId,
        categoryId,
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    const players = registrations.map((reg, index) => ({
      id: reg.user.id,
      registrationId: reg.id,
      name: reg.user.name,
      email: reg.user.email,
      phone: reg.user.phone,
      seed: index + 1
    }));

    res.json({
      success: true,
      players,
      totalCount: players.length
    });
  } catch (error) {
    console.error('Get category players error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch players' });
  }
};

/**
 * Assign players to draw slots
 * PUT /api/draws/:drawId/assign-players
 */
const assignPlayersToDraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tournamentId, categoryId, assignments } = req.body;
    // assignments: [{ slot: 1, playerId: 'xxx', playerName: 'John' }, ...]

    // Check if category is completed
    if (await checkCategoryNotCompleted(categoryId, res)) {
      return; // Response already sent
    }

    // Verify tournament and ownership
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Get existing draw
    const draw = await prisma.draw.findUnique({
      where: { tournamentId_categoryId: { tournamentId, categoryId } }
    });

    if (!draw) {
      return res.status(404).json({ success: false, error: 'Draw not found' });
    }

    // Parse bracket
    let bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;

    // 🔒 RELIABILITY FIX: Use transaction to ensure all-or-nothing operation
    const result = await prisma.$transaction(async (tx) => {

    // Build a map of playerId -> slot from assignments (each player can only be in ONE slot)
    const playerSlotMap = {};
    assignments.forEach(({ slot, playerId, playerName }) => {
      playerSlotMap[playerId] = { slot, playerName };
    });

    // Apply assignments to bracket - CLEAR ALL FIRST, then assign
    if (bracketJson.format === 'KNOCKOUT' && bracketJson.rounds) {
      const firstRound = bracketJson.rounds[0];
      
      // First, clear all slots in first round
      firstRound.matches.forEach((match, idx) => {
        match.player1 = { id: null, name: `Slot ${idx * 2 + 1}`, seed: idx * 2 + 1 };
        match.player2 = { id: null, name: `Slot ${idx * 2 + 2}`, seed: idx * 2 + 2 };
      });
      
      // Then assign players to their slots (each player only once)
      Object.entries(playerSlotMap).forEach(([playerId, { slot, playerName }]) => {
        const matchIndex = Math.floor((slot - 1) / 2);
        const playerPosition = (slot - 1) % 2 === 0 ? 'player1' : 'player2';
        if (firstRound.matches[matchIndex]) {
          firstRound.matches[matchIndex][playerPosition] = {
            id: playerId,
            name: playerName,
            seed: slot
          };
        }
      });
      
      bracketJson.totalParticipants = Object.keys(playerSlotMap).length;
    } else if (bracketJson.format === 'ROUND_ROBIN' || bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
      // First clear all participants
      let slotCounter = 0;
      bracketJson.groups.forEach(group => {
        group.participants.forEach((participant, idx) => {
          const slotNum = slotCounter + 1;
          group.participants[idx] = { 
            id: null, 
            name: `Slot ${slotNum}`, 
            seed: slotNum, 
            played: 0, 
            wins: 0, 
            losses: 0, 
            points: 0 
          };
          slotCounter++;
        });
      });
      
      // Then assign players
      slotCounter = 0;
      bracketJson.groups.forEach(group => {
        group.participants.forEach((participant, idx) => {
          const slotNum = slotCounter + 1;
          const assignment = assignments.find(a => a.slot === slotNum);
          if (assignment) {
            group.participants[idx] = {
              ...participant,
              id: assignment.playerId,
              name: assignment.playerName
            };
          }
          slotCounter++;
        });
      });
      
      // CRITICAL FIX: Regenerate matches with updated participant data
      let globalMatchNumber = 1;
      bracketJson.groups.forEach((group, groupIndex) => {
        // Regenerate all matches for this group with updated participants
        group.matches = generateGroupMatches(group.participants, groupIndex, globalMatchNumber);
        group.totalMatches = group.matches.length;
        globalMatchNumber += group.matches.length;
      });
      
      // IMPORTANT: Clear knockout bracket player data when assigning to round robin
      // The knockout bracket should remain empty until explicitly arranged
      if (bracketJson.format === 'ROUND_ROBIN_KNOCKOUT' && bracketJson.knockout && bracketJson.knockout.rounds) {
        console.log('🧹 Clearing knockout bracket player data (will be set when arranged)');
        for (const round of bracketJson.knockout.rounds) {
          if (round.matches) {
            for (const match of round.matches) {
              match.player1 = null;
              match.player2 = null;
              match.winner = null;
              match.winnerId = null;
              match.score1 = null;
              match.score2 = null;
              match.status = 'PENDING';
            }
          }
        }
      }
    }

    // Save updated draw (inside transaction)
    const updatedDraw = await tx.draw.update({
      where: { tournamentId_categoryId: { tournamentId, categoryId } },
      data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() }
    });

    // Create/Update Match records with player assignments
    if (bracketJson.format === 'KNOCKOUT') {
      // Delete existing matches and create new ones (inside transaction)
      await tx.match.deleteMany({
        where: { tournamentId, categoryId }
      });

      // Create match records for all rounds
      const matchRecords = [];
      const totalRounds = bracketJson.rounds.length;
      
      for (let roundIdx = 0; roundIdx < bracketJson.rounds.length; roundIdx++) {
        const round = bracketJson.rounds[roundIdx];
        const reverseRoundNumber = totalRounds - roundIdx;
        
        for (let matchIdx = 0; matchIdx < round.matches.length; matchIdx++) {
          const match = round.matches[matchIdx];
          matchRecords.push({
            tournamentId,
            categoryId,
            round: reverseRoundNumber,
            matchNumber: matchIdx + 1,
            stage: 'KNOCKOUT',
            player1Id: match.player1?.id || null,
            player2Id: match.player2?.id || null,
            player1Seed: match.player1?.seed || null,
            player2Seed: match.player2?.seed || null,
            status: 'PENDING'
          });
        }
      }

      if (matchRecords.length > 0) {
        await tx.match.createMany({ data: matchRecords });
      }
      
      return { updatedDraw, matchCount: matchRecords.length };
    } else if (bracketJson.format === 'ROUND_ROBIN' || bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
      // CRITICAL FIX: Create/Update database Match records for Round Robin
      // First, delete all existing matches for this category to avoid conflicts (inside transaction)
      await tx.match.deleteMany({
        where: { tournamentId, categoryId }
      });
      
      // 🔒 RELIABILITY FIX: Use createMany instead of individual creates
      const matchRecords = [];
      
      // Collect all round robin matches
      for (const group of bracketJson.groups) {
        for (const match of group.matches) {
          // Only create match if both players are assigned
          if (match.player1?.id && match.player2?.id) {
            matchRecords.push({
              tournamentId,
              categoryId,
              matchNumber: match.matchNumber,
              round: 1, // All Round Robin matches are in round 1
              stage: 'GROUP', // Mark as group stage
                player1Id: match.player1.id,
              player2Id: match.player2.id,
              player1Seed: match.player1.seed,
              player2Seed: match.player2.seed,
              status: 'PENDING'
            });
          }
        }
      }
      
      // 🔒 RELIABILITY FIX: Create all round robin matches in one batch
      if (matchRecords.length > 0) {
        await tx.match.createMany({ data: matchRecords });
      }
      
      // For ROUND_ROBIN_KNOCKOUT, also create knockout stage matches
      // BUT DO NOT populate them with player data - they should remain empty until arranged
      if (bracketJson.format === 'ROUND_ROBIN_KNOCKOUT' && bracketJson.knockout && bracketJson.knockout.rounds) {
        let knockoutMatchNum = bracketJson.groups.reduce((sum, g) => sum + g.matches.length, 1);
        const totalKnockoutRounds = bracketJson.knockout.rounds.length;
        
        const knockoutMatchRecords = [];
        for (let roundIdx = 0; roundIdx < bracketJson.knockout.rounds.length; roundIdx++) {
          const round = bracketJson.knockout.rounds[roundIdx];
          const reverseRoundNumber = totalKnockoutRounds - roundIdx;
          
          for (const match of round.matches) {
            knockoutMatchRecords.push({
              tournamentId,
              categoryId,
              matchNumber: knockoutMatchNum++,
              round: reverseRoundNumber,
              stage: 'KNOCKOUT', // Mark as knockout stage
              player1Id: null, // Always null - will be set when knockout is arranged
              player2Id: null, // Always null - will be set when knockout is arranged
              player1Seed: null,
              player2Seed: null,
              status: 'PENDING'
            });
          }
        }
        
        // 🔒 RELIABILITY FIX: Create all knockout matches in one batch
        if (knockoutMatchRecords.length > 0) {
          await tx.match.createMany({ data: knockoutMatchRecords });
        }
      }
      
      return { updatedDraw, matchCount: matchRecords.length };
    }
    
    return { updatedDraw, matchCount: 0 };
    }); // End transaction
    
    // 🔒 RELIABILITY FIX: Set parent relationships AFTER transaction completes
    // This ensures all matches exist before setting relationships
    if (bracketJson.format === 'KNOCKOUT' && result.matchCount > 0) {
      await setKnockoutParentRelationships(tournamentId, categoryId);
    }

    res.json({
      success: true,
      message: 'Players assigned successfully',
      draw: { ...result.updatedDraw, bracketJson }
    });
  } catch (error) {
    console.error('❌ Assign players error:', error);
    // 🔒 RELIABILITY FIX: Transaction will auto-rollback on error
    res.status(500).json({ 
      success: false, 
      error: 'Failed to assign players',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create configured draw with flexible format options
 * POST /api/draws/create
 */
const createConfiguredDraw = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { tournamentId, categoryId, format, bracketSize, numberOfGroups, playersPerGroup, advanceFromGroup, customGroupSizes } = req.body;

    // Check if category is completed
    if (await checkCategoryNotCompleted(categoryId, res)) {
      return; // Response already sent
    }

    // Verify tournament and ownership
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }
    if (tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Only the organizer can create draws' });
    }

    // Verify category
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category || category.tournamentId !== tournamentId) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    // Generate bracket based on format
    let bracketJson;
    const size = bracketSize || category.maxParticipants || 32;

    if (format === 'KNOCKOUT') {
      bracketJson = generateKnockoutBracket(size);
    } else if (format === 'ROUND_ROBIN') {
      bracketJson = generateRoundRobinBracket(size, numberOfGroups || 1, customGroupSizes);
    } else if (format === 'ROUND_ROBIN_KNOCKOUT') {
      bracketJson = generateGroupsKnockoutBracket(size, numberOfGroups || 4, advanceFromGroup || 2, customGroupSizes);
    } else {
      bracketJson = generateKnockoutBracket(size);
    }

    // Upsert draw
    const draw = await prisma.draw.upsert({
      where: { tournamentId_categoryId: { tournamentId, categoryId } },
      update: { format, bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() },
      create: { tournamentId, categoryId, format, bracketJson: JSON.stringify(bracketJson) }
    });

    // DON'T create Match records automatically - they will be created when players are assigned
    // This prevents stale data and ensures matches only exist when there are actual players

    res.status(201).json({
      success: true,
      message: 'Draw created successfully',
      draw: { ...draw, bracketJson }
    });
  } catch (error) {
    console.error('Create configured draw error:', error);
    res.status(500).json({ success: false, error: 'Failed to create draw' });
  }
};

// Helper: Set parent match relationships for knockout winner advancement
async function setKnockoutParentRelationships(tournamentId, categoryId) {
  console.log('🔗 Setting parent match relationships for knockout...');
  
  // Get all knockout matches sorted by round
  const allMatches = await prisma.match.findMany({
    where: {
      tournamentId,
      categoryId,
      OR: [
        { stage: 'KNOCKOUT' },
        { stage: null } // For pure KNOCKOUT format without stage field
      ]
    },
    orderBy: [
      { round: 'desc' },
      { matchNumber: 'asc' }
    ]
  });
  
  if (allMatches.length === 0) {
    console.log('⚠️  No matches found to set relationships');
    return;
  }
  
  // Get unique rounds
  const rounds = [...new Set(allMatches.map(m => m.round))].sort((a, b) => b - a);
  console.log(`   Found ${rounds.length} rounds:`, rounds);
  
  // For each round (except final), set parent relationships
  for (const currentRound of rounds) {
    if (currentRound === 1) {
      console.log(`   Skipping Round 1 (Finals) - no parent`);
      continue; // Skip final (no parent)
    }
    
    const roundMatches = allMatches.filter(m => m.round === currentRound);
    const parentRound = currentRound - 1;
    
    console.log(`   Processing Round ${currentRound} (${roundMatches.length} matches) → Parent Round ${parentRound}`);
    
    for (let i = 0; i < roundMatches.length; i++) {
      const match = roundMatches[i];
      const parentMatchNumber = Math.floor(i / 2) + 1;
      
      const parentMatch = allMatches.find(
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
        
        console.log(`     ✓ Match ${match.matchNumber} → Parent Match ${parentMatch.matchNumber} as ${winnerPosition}`);
      } else {
        console.log(`     ⚠️  No parent found for Match ${match.matchNumber}`);
      }
    }
  }
  
  console.log('✅ Parent relationships set!');
}

// Helper: Generate knockout bracket
function generateKnockoutBracket(size) {
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(2, size))));
  const numRounds = Math.log2(bracketSize);
  const rounds = [];

  for (let round = 0; round < numRounds; round++) {
    const numMatches = bracketSize / Math.pow(2, round + 1);
    const matches = [];
    for (let i = 0; i < numMatches; i++) {
      if (round === 0) {
        matches.push({
          matchNumber: i + 1,
          player1: { id: null, name: `Slot ${i * 2 + 1}`, seed: i * 2 + 1 },
          player2: { id: null, name: `Slot ${i * 2 + 2}`, seed: i * 2 + 2 },
          score1: null, score2: null, winner: null
        });
      } else {
        matches.push({
          matchNumber: i + 1,
          player1: { id: null, name: 'TBD', seed: null },
          player2: { id: null, name: 'TBD', seed: null },
          score1: null, score2: null, winner: null
        });
      }
    }
    rounds.push({ roundNumber: round + 1, matches });
  }

  return { format: 'KNOCKOUT', bracketSize, totalParticipants: 0, rounds };
}

// Helper: Generate round robin bracket with groups and matches
function generateRoundRobinBracket(size, numberOfGroups, customGroupSizes = null) {
  const groups = [];
  let globalMatchNumber = 1;
  let slotNum = 1;

  // Determine group sizes
  let groupSizes;
  if (customGroupSizes && Array.isArray(customGroupSizes)) {
    // Use custom sizes if provided
    groupSizes = customGroupSizes;
    console.log('Using custom group sizes:', groupSizes);
  } else {
    // Default: equal distribution
    const playersPerGroup = Math.ceil(size / numberOfGroups);
    groupSizes = Array(numberOfGroups).fill(playersPerGroup);
    
    // Adjust last groups if needed to match exact size
    let totalAssigned = playersPerGroup * numberOfGroups;
    let groupIndex = numberOfGroups - 1;
    while (totalAssigned > size && groupIndex >= 0) {
      if (groupSizes[groupIndex] > 2) { // Minimum 2 players per group
        groupSizes[groupIndex]--;
        totalAssigned--;
      }
      groupIndex--;
    }
  }

  // Generate groups with specified sizes
  for (let g = 0; g < numberOfGroups; g++) {
    const participants = [];
    const groupSize = groupSizes[g] || 0;
    
    for (let p = 0; p < groupSize; p++) {
      if (slotNum <= size) {
        participants.push({ 
          id: null, 
          name: `Slot ${slotNum}`, 
          seed: slotNum, 
          played: 0, 
          wins: 0, 
          losses: 0, 
          points: 0 
        });
        slotNum++;
      }
    }
    
    // Generate all matches for this group (Round Robin) with global match numbers
    const matches = generateGroupMatches(participants, g, globalMatchNumber);
    globalMatchNumber += matches.length;
    
    groups.push({ 
      groupName: String.fromCharCode(65 + g), 
      participants,
      matches,
      totalMatches: matches.length
    });
  }

  return { 
    format: 'ROUND_ROBIN', 
    bracketSize: size, 
    numberOfGroups, 
    customGroupSizes: customGroupSizes || null,
    groups 
  };
}

// Helper: Generate all matches for a group (everyone plays everyone)
function generateGroupMatches(participants, groupIndex, startingMatchNumber = 1) {
  const matches = [];
  let matchNumber = startingMatchNumber;
  const groupName = String.fromCharCode(65 + groupIndex);
  
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        matchNumber: matchNumber++,
        groupIndex,
        groupName,
        player1: { ...participants[i] },  // Create new object copy
        player2: { ...participants[j] },  // Create new object copy
        status: 'pending',
        winner: null,
        score: null,
        round: 1 // All Round Robin matches are in "round 1"
      });
    }
  }
  
  return matches;
}

// Helper: Generate groups + knockout bracket
function generateGroupsKnockoutBracket(size, numberOfGroups, advanceFromGroup, customGroupSizes = null) {
  const groupData = generateRoundRobinBracket(size, numberOfGroups, customGroupSizes);
  const knockoutSize = numberOfGroups * advanceFromGroup;
  
  // Generate EMPTY knockout bracket (no placeholder names)
  const knockoutData = generateEmptyKnockoutBracket(knockoutSize);

  return {
    format: 'ROUND_ROBIN_KNOCKOUT',
    bracketSize: size,
    numberOfGroups,
    advanceFromGroup,
    customGroupSizes: customGroupSizes || null,
    groups: groupData.groups,
    knockout: knockoutData
  };
}

// Helper: Generate EMPTY knockout bracket (for Round Robin + Knockout)
function generateEmptyKnockoutBracket(size) {
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(Math.max(2, size))));
  const numRounds = Math.log2(bracketSize);
  const rounds = [];

  for (let round = 0; round < numRounds; round++) {
    const numMatches = bracketSize / Math.pow(2, round + 1);
    const matches = [];
    for (let i = 0; i < numMatches; i++) {
      // All slots are completely empty (null) - no placeholder names, no data
      matches.push({
        matchNumber: i + 1,
        player1: null,
        player2: null,
        score1: null, 
        score2: null, 
        winner: null,
        winnerId: null,
        status: 'PENDING'
      });
    }
    rounds.push({ roundNumber: round + 1, matches });
  }

  return { format: 'KNOCKOUT', bracketSize, totalParticipants: 0, rounds };
}

/**
 * Bulk assign all registered players to available slots
 * POST /api/draws/bulk-assign-all
 */
const bulkAssignAllPlayers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tournamentId, categoryId } = req.body;

    // Verify tournament and ownership
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Get existing draw
    const draw = await prisma.draw.findUnique({
      where: { tournamentId_categoryId: { tournamentId, categoryId } }
    });

    if (!draw) {
      return res.status(404).json({ success: false, error: 'Draw not found' });
    }

    // Get all confirmed registrations for this category
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId,
        categoryId,
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Parse bracket
    let bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;

    if (bracketJson.format === 'KNOCKOUT' && bracketJson.rounds) {
      // STEP 1: Clear ALL rounds in bracket JSON (remove stale data)
      console.log('🧹 Clearing all rounds in bracket JSON...');
      bracketJson.rounds.forEach((round, roundIdx) => {
        round.matches.forEach((match, matchIdx) => {
          if (roundIdx === 0) {
            // First round: Keep slot placeholders
            match.player1 = { id: null, name: `Slot ${matchIdx * 2 + 1}`, seed: matchIdx * 2 + 1 };
            match.player2 = { id: null, name: `Slot ${matchIdx * 2 + 2}`, seed: matchIdx * 2 + 2 };
          } else {
            // Other rounds: Set to TBD
            match.player1 = { id: null, name: 'TBD', seed: null };
            match.player2 = { id: null, name: 'TBD', seed: null };
          }
          match.winner = null;
          match.winnerId = null;
          match.score1 = null;
          match.score2 = null;
        });
      });

      // STEP 2: Now assign players to first round
      const firstRound = bracketJson.rounds[0];
      const assignments = [];
      let playerIndex = 0;

      // NEW LOGIC: Fill VERTICALLY column by column (left to right)
      // rounds[0] is the leftmost column (Quarter Finals, Semi Finals, etc.)
      const dbRoundNumber = bracketJson.rounds.length;
      
      // Create array of all slots in vertical order
      const verticalSlots = [];
      firstRound.matches.forEach((match, matchIdx) => {
        // Add player1 slot
        verticalSlots.push({
          matchIdx,
          position: 'player1',
          slot: matchIdx * 2 + 1,
          isEmpty: !match.player1?.id
        });
        
        // Add player2 slot
        verticalSlots.push({
          matchIdx,
          position: 'player2',
          slot: matchIdx * 2 + 2,
          isEmpty: !match.player2?.id
        });
      });

      // Fill slots vertically (top to bottom)
      for (const slotInfo of verticalSlots) {
        if (slotInfo.isEmpty && playerIndex < registrations.length) {
          const reg = registrations[playerIndex];
          const match = firstRound.matches[slotInfo.matchIdx];
          
          match[slotInfo.position] = {
            id: reg.user.id,
            name: reg.user.name,
            seed: slotInfo.slot
          };
          
          assignments.push({
            slot: slotInfo.slot,
            playerId: reg.user.id,
            playerName: reg.user.name,
            matchIdx: slotInfo.matchIdx,
            position: slotInfo.position
          });
          
          playerIndex++;
        }
      }

      // Delete existing matches and create new ones
      await prisma.match.deleteMany({
        where: { tournamentId, categoryId }
      });

      // Create match records for all rounds
      const matchRecords = [];
      const totalRounds = bracketJson.rounds.length;
      
      for (let roundIdx = 0; roundIdx < bracketJson.rounds.length; roundIdx++) {
        const round = bracketJson.rounds[roundIdx];
        const reverseRoundNumber = totalRounds - roundIdx;
        
        for (let matchIdx = 0; matchIdx < round.matches.length; matchIdx++) {
          const match = round.matches[matchIdx];
          matchRecords.push({
            tournamentId,
            categoryId,
            round: reverseRoundNumber,
            matchNumber: matchIdx + 1,
            stage: 'KNOCKOUT',
            player1Id: match.player1?.id || null,
            player2Id: match.player2?.id || null,
            player1Seed: match.player1?.seed || null,
            player2Seed: match.player2?.seed || null,
            status: 'PENDING'
          });
        }
      }

      if (matchRecords.length > 0) {
        await prisma.match.createMany({ data: matchRecords });
      }
    } else if (bracketJson.format === 'ROUND_ROBIN' || bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
      // Handle Round Robin bulk assignment
      const assignments = [];
      let playerIndex = 0;
      let slotCounter = 0;

      // Assign players to each group sequentially
      bracketJson.groups.forEach(group => {
        group.participants.forEach((participant, idx) => {
          const slotNum = slotCounter + 1;
          
          // Assign player if available and slot is empty
          if (!participant.id && playerIndex < registrations.length) {
            const reg = registrations[playerIndex];
            group.participants[idx] = {
              id: reg.user.id,
              name: reg.user.name,
              seed: slotNum,
              played: 0,
              wins: 0,
              losses: 0,
              points: 0
            };
            assignments.push({
              slot: slotNum,
              playerId: reg.user.id,
              playerName: reg.user.name
            });
            playerIndex++;
          }
          slotCounter++;
        });
      });

      // Regenerate matches with updated participants
      let globalMatchNumber = 1;
      bracketJson.groups.forEach((group, groupIndex) => {
        group.matches = generateGroupMatches(group.participants, groupIndex, globalMatchNumber);
        group.totalMatches = group.matches.length;
        globalMatchNumber += group.matches.length;
      });

      // Create database Match records
      await prisma.match.deleteMany({
        where: { tournamentId, categoryId }
      });

      for (const group of bracketJson.groups) {
        for (const match of group.matches) {
          if (match.player1?.id && match.player2?.id) {
            await prisma.match.create({
              data: {
                tournamentId,
                categoryId,
                matchNumber: match.matchNumber,
                round: 1,
                player1Id: match.player1.id,
                player2Id: match.player2.id,
                player1Seed: match.player1.seed,
                player2Seed: match.player2.seed,
                status: 'PENDING'
              }
            });
          }
        }
      }
    }

    // Save updated draw
    const updatedDraw = await prisma.draw.update({
      where: { tournamentId_categoryId: { tournamentId, categoryId } },
      data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() }
    });

    // Set parent relationships for KNOCKOUT format
    if (bracketJson.format === 'KNOCKOUT') {
      await setKnockoutParentRelationships(tournamentId, categoryId);
    }

    res.json({
      success: true,
      message: 'All available players assigned successfully',
      draw: { ...updatedDraw, bracketJson }
    });
  } catch (error) {
    console.error('Bulk assign all players error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign players' });
  }
};

/**
 * Shuffle all assigned players randomly
 * POST /api/draws/shuffle-players
 */
const shuffleAssignedPlayers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tournamentId, categoryId } = req.body;

    // Verify tournament and ownership
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Get existing draw
    const draw = await prisma.draw.findUnique({
      where: { tournamentId_categoryId: { tournamentId, categoryId } }
    });

    if (!draw) {
      return res.status(404).json({ success: false, error: 'Draw not found' });
    }

    // Parse bracket
    let bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;

    // Get matches to check for locked status
    const matches = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      orderBy: { matchNumber: 'asc' }
    });

    if (bracketJson.format === 'KNOCKOUT' && bracketJson.rounds) {
      const firstRound = bracketJson.rounds[0];
      
      // STEP 1: Clear all rounds except first (remove stale data from previous matches)
      console.log('🧹 Clearing non-first rounds in bracket JSON...');
      for (let roundIdx = 1; roundIdx < bracketJson.rounds.length; roundIdx++) {
        bracketJson.rounds[roundIdx].matches.forEach(match => {
          match.player1 = { id: null, name: 'TBD', seed: null };
          match.player2 = { id: null, name: 'TBD', seed: null };
          match.winner = null;
          match.winnerId = null;
          match.score1 = null;
          match.score2 = null;
        });
      }

      // STEP 2: Clear non-first round matches in database
      console.log('🧹 Clearing non-first round matches in database...');
      const dbRoundNumber = bracketJson.rounds.length;
      await prisma.match.updateMany({
        where: { 
          tournamentId, 
          categoryId,
          round: { lt: dbRoundNumber } // All rounds less than first round (SF, Finals, etc.)
        },
        data: {
          player1Id: null,
          player2Id: null,
          winnerId: null,
          status: 'PENDING',
          scoreJson: null,
          startedAt: null,
          completedAt: null
        }
      });
      
      // STEP 3: Collect all assigned players from unlocked matches in first round
      const assignedPlayers = [];
      const allSlots = [];

      firstRound.matches.forEach((match, matchIdx) => {
        const dbMatch = matches.find(m => m.round === dbRoundNumber && m.matchNumber === matchIdx + 1);
        const isLocked = dbMatch?.status === 'COMPLETED' || dbMatch?.status === 'IN_PROGRESS';

        if (!isLocked) {
          // Collect player1
          if (match.player1?.id) {
            assignedPlayers.push(match.player1);
          }
          allSlots.push({ matchIdx, position: 'player1', slot: matchIdx * 2 + 1, isLocked: false });
          
          // Collect player2
          if (match.player2?.id) {
            assignedPlayers.push(match.player2);
          }
          allSlots.push({ matchIdx, position: 'player2', slot: matchIdx * 2 + 2, isLocked: false });
        } else {
          // Keep locked slots info but don't include in shuffle
          allSlots.push({ matchIdx, position: 'player1', slot: matchIdx * 2 + 1, isLocked: true });
          allSlots.push({ matchIdx, position: 'player2', slot: matchIdx * 2 + 2, isLocked: true });
        }
      });

      if (assignedPlayers.length === 0) {
        return res.status(400).json({ success: false, error: 'No players to shuffle' });
      }

      // Simple shuffle - just reverse order or rotate
      const shuffledPlayers = [...assignedPlayers];
      // Rotate by 1 position
      if (shuffledPlayers.length > 1) {
        const first = shuffledPlayers.shift();
        shuffledPlayers.push(first);
      }

      // Clear all unlocked slots first
      allSlots.forEach(({ matchIdx, position, isLocked }) => {
        if (!isLocked) {
          const slot = matchIdx * 2 + (position === 'player1' ? 1 : 2);
          firstRound.matches[matchIdx][position] = { 
            id: null, 
            name: `Slot ${slot}`, 
            seed: slot 
          };
        }
      });

      // Reassign shuffled players to unlocked slots
      const unlockedSlots = allSlots.filter(s => !s.isLocked);
      const assignments = [];
      
      shuffledPlayers.forEach((player, index) => {
        if (index < unlockedSlots.length) {
          const { matchIdx, position, slot } = unlockedSlots[index];
          firstRound.matches[matchIdx][position] = {
            id: player.id,
            name: player.name,
            seed: slot
          };
          assignments.push({
            matchIdx,
            position,
            slot,
            playerId: player.id,
            playerName: player.name
          });
        }
      });

      // Update database match records
      for (const assignment of assignments) {
        const dbMatch = matches.find(m => m.round === dbRoundNumber && m.matchNumber === assignment.matchIdx + 1);
        if (dbMatch) {
          const playerPosition = assignment.position === 'player1' ? 'player1Id' : 'player2Id';
          const seedPosition = assignment.position === 'player1' ? 'player1Seed' : 'player2Seed';
          
          await prisma.match.update({
            where: { id: dbMatch.id },
            data: {
              [playerPosition]: assignment.playerId,
              [seedPosition]: assignment.slot
            }
          });
        }
      }

      // Clear any remaining unlocked slots that don't have players
      for (let i = assignments.length; i < unlockedSlots.length; i++) {
        const { matchIdx, position } = unlockedSlots[i];
        const dbMatch = matches.find(m => m.round === dbRoundNumber && m.matchNumber === matchIdx + 1);
        if (dbMatch) {
          const playerPosition = position === 'player1' ? 'player1Id' : 'player2Id';
          const seedPosition = position === 'player1' ? 'player1Seed' : 'player2Seed';
          
          await prisma.match.update({
            where: { id: dbMatch.id },
            data: {
              [playerPosition]: null,
              [seedPosition]: null
            }
          });
        }
      }
    } else if (bracketJson.format === 'ROUND_ROBIN' || bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
      // Handle Round Robin shuffle
      // Collect all assigned players from all groups
      const assignedPlayers = [];
      let slotCounter = 0;

      bracketJson.groups.forEach(group => {
        group.participants.forEach((participant, idx) => {
          if (participant.id) {
            assignedPlayers.push({
              ...participant,
              originalSlot: slotCounter + 1
            });
          }
          slotCounter++;
        });
      });

      if (assignedPlayers.length === 0) {
        return res.status(400).json({ success: false, error: 'No players to shuffle' });
      }

      // Simple shuffle - rotate by 1
      const shuffledPlayers = [...assignedPlayers];
      if (shuffledPlayers.length > 1) {
        const first = shuffledPlayers.shift();
        shuffledPlayers.push(first);
      }

      // Clear all participants first
      slotCounter = 0;
      bracketJson.groups.forEach(group => {
        group.participants.forEach((participant, idx) => {
          const slotNum = slotCounter + 1;
          group.participants[idx] = {
            id: null,
            name: `Slot ${slotNum}`,
            seed: slotNum,
            played: 0,
            wins: 0,
            losses: 0,
            points: 0
          };
          slotCounter++;
        });
      });

      // Reassign shuffled players
      slotCounter = 0;
      let playerIndex = 0;
      bracketJson.groups.forEach(group => {
        group.participants.forEach((participant, idx) => {
          const slotNum = slotCounter + 1;
          if (playerIndex < shuffledPlayers.length) {
            const player = shuffledPlayers[playerIndex];
            group.participants[idx] = {
              id: player.id,
              name: player.name,
              seed: slotNum,
              played: 0,
              wins: 0,
              losses: 0,
              points: 0
            };
            playerIndex++;
          }
          slotCounter++;
        });
      });

      // Regenerate matches with shuffled participants
      let globalMatchNumber = 1;
      bracketJson.groups.forEach((group, groupIndex) => {
        group.matches = generateGroupMatches(group.participants, groupIndex, globalMatchNumber);
        group.totalMatches = group.matches.length;
        globalMatchNumber += group.matches.length;
      });

      // Recreate database Match records
      await prisma.match.deleteMany({
        where: { tournamentId, categoryId }
      });

      for (const group of bracketJson.groups) {
        for (const match of group.matches) {
          if (match.player1?.id && match.player2?.id) {
            await prisma.match.create({
              data: {
                tournamentId,
                categoryId,
                matchNumber: match.matchNumber,
                round: 1,
                player1Id: match.player1.id,
                player2Id: match.player2.id,
                player1Seed: match.player1.seed,
                player2Seed: match.player2.seed,
                status: 'PENDING'
              }
            });
          }
        }
      }
    }

    // Save updated draw
    const updatedDraw = await prisma.draw.update({
      where: { tournamentId_categoryId: { tournamentId, categoryId } },
      data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() }
    });

    res.json({
      success: true,
      message: 'Players shuffled successfully',
      draw: { ...updatedDraw, bracketJson }
    });
  } catch (error) {
    console.error('Shuffle players error:', error);
    res.status(500).json({ success: false, error: 'Failed to shuffle players' });
  }
};

/**
 * Arrange knockout matchups for Round Robin + Knockout format
 * POST /api/tournaments/:tournamentId/categories/:categoryId/draw/arrange-knockout
 */
const arrangeKnockoutMatchups = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const { knockoutSlots } = req.body;
    const userId = req.user.id;

    console.log('🎯 Arranging knockout matchups for', knockoutSlots.length, 'slots');

    // Verify tournament and ownership
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Get existing draw
    const draw = await prisma.draw.findUnique({
      where: { tournamentId_categoryId: { tournamentId, categoryId } }
    });

    if (!draw) {
      return res.status(404).json({ success: false, error: 'Draw not found' });
    }

    const bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;

    if (bracketJson.format !== 'ROUND_ROBIN_KNOCKOUT') {
      return res.status(400).json({ success: false, error: 'This feature is only for Round Robin + Knockout format' });
    }

    // STEP 1: Create knockout bracket structure if it doesn't exist
    // knockoutSlots is an array of matches, each with player1 and player2
    // So total players = knockoutSlots.length * 2
    const totalPlayers = knockoutSlots.length * 2;
    
    if (!bracketJson.knockout || !bracketJson.knockout.rounds) {
      console.log('🔨 Creating knockout bracket structure for', totalPlayers, 'players (', knockoutSlots.length, 'matches)');
      
      // Generate knockout bracket for the number of players
      const knockoutBracket = generateKnockoutBracket(totalPlayers);
      bracketJson.knockout = knockoutBracket;
      
      console.log('✅ Created knockout structure with', knockoutBracket.rounds.length, 'rounds');
    } else if (bracketJson.knockout.bracketSize !== totalPlayers) {
      // Knockout exists but wrong size - recreate it
      console.log('🔄 Recreating knockout bracket - size changed from', bracketJson.knockout.bracketSize, 'to', totalPlayers);
      const knockoutBracket = generateKnockoutBracket(totalPlayers);
      bracketJson.knockout = knockoutBracket;
      console.log('✅ Recreated knockout structure with', knockoutBracket.rounds.length, 'rounds');
    }

    // STEP 2: Reset ALL knockout matches in bracketJson (clear old data)
    console.log('🧹 Resetting knockout bracket data');
    for (const round of bracketJson.knockout.rounds) {
      if (round.matches) {
        for (const match of round.matches) {
          match.player1 = null;
          match.player2 = null;
          match.winner = null;
          match.winnerId = null;
          match.score1 = null;
          match.score2 = null;
          match.status = 'PENDING';
        }
      }
    }

    // STEP 3: Assign players to first round matches in bracketJson
    if (bracketJson.knockout.rounds[0] && bracketJson.knockout.rounds[0].matches) {
      const firstRound = bracketJson.knockout.rounds[0].matches;
      
      console.log('📝 Assigning players to first round in bracketJson');
      knockoutSlots.forEach((slot, index) => {
        if (firstRound[index]) {
          firstRound[index].player1 = slot.player1;
          firstRound[index].player2 = slot.player2;
          firstRound[index].status = 'PENDING';
          console.log(`   Match ${index + 1}: ${slot.player1?.name || 'TBD'} vs ${slot.player2?.name || 'TBD'}`);
        }
      });
    }

    // STEP 4: Save updated bracketJson
    await prisma.draw.update({
      where: { id: draw.id },
      data: { bracketJson: JSON.stringify(bracketJson) }
    });

    // STEP 5: Check if knockout matches exist in database
    let knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: { matchNumber: 'asc' }
    });

    console.log(`📊 Found ${knockoutMatches.length} existing knockout match records in database`);

    // STEP 6: Create knockout matches in database if they don't exist
    if (knockoutMatches.length === 0) {
      console.log('🔨 Creating knockout match records in database...');
      
      const matchesToCreate = [];
      const totalRounds = bracketJson.knockout.rounds.length;
      
      // Create matches with per-round numbering (each round starts from Match 1)
      bracketJson.knockout.rounds.forEach((round, roundIndex) => {
        // Calculate database round number (reverse: last round = 1 = finals)
        const dbRoundNumber = totalRounds - roundIndex;
        
        round.matches.forEach((bracketMatch, matchIndex) => {
          matchesToCreate.push({
            tournamentId,
            categoryId,
            round: dbRoundNumber,
            matchNumber: matchIndex + 1, // Each round starts from 1
            stage: 'KNOCKOUT',
            status: 'PENDING',
            player1Id: null,
            player2Id: null,
            winnerId: null,
            scoreJson: null,
            startedAt: null,
            completedAt: null,
            umpireId: null
          });
        });
      });

      await prisma.match.createMany({
        data: matchesToCreate
      });

      console.log(`✅ Created ${matchesToCreate.length} knockout match records`);

      // Fetch them again
      knockoutMatches = await prisma.match.findMany({
        where: {
          tournamentId,
          categoryId,
          stage: 'KNOCKOUT'
        },
        orderBy: [
          { round: 'desc' },
          { matchNumber: 'asc' }
        ]
      });
    }

    // STEP 7: Reset ALL knockout matches in database AND clear parent relationships
    console.log('🧹 Resetting all knockout match records in database');
    for (const match of knockoutMatches) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          player1Id: null,
          player2Id: null,
          status: 'PENDING',
          winnerId: null,
          scoreJson: null,
          startedAt: null,
          completedAt: null,
          umpireId: null,
          parentMatchId: null,
          winnerPosition: null
        }
      });
    }

    // STEP 8: Assign players to first round knockout matches in database
    const maxRound = Math.max(...knockoutMatches.map(m => m.round));
    const firstRoundMatches = knockoutMatches.filter(m => m.round === maxRound);
    
    console.log(`🎯 Received ${knockoutSlots.length} knockout slots from frontend:`);
    knockoutSlots.forEach((slot, i) => {
      console.log(`   Slot ${i + 1}: ${slot.player1?.name || 'NULL'} vs ${slot.player2?.name || 'NULL'}`);
    });
    
    console.log(`🎯 Found ${firstRoundMatches.length} first round matches in database`);
    firstRoundMatches.forEach((match, i) => {
      console.log(`   DB Match ${i + 1}: matchNumber=${match.matchNumber}, id=${match.id}`);
    });
    
    console.log(`🎯 Assigning players to first round (Round ${maxRound}) matches in database`);
    
    for (let i = 0; i < knockoutSlots.length && i < firstRoundMatches.length; i++) {
      const slot = knockoutSlots[i];
      
      await prisma.match.update({
        where: { id: firstRoundMatches[i].id },
        data: {
          player1Id: slot.player1?.id || null,
          player2Id: slot.player2?.id || null,
          status: 'PENDING'
        }
      });
      
      console.log(`   ✓ Match ${i + 1}: ${slot.player1?.name || 'TBD'} vs ${slot.player2?.name || 'TBD'}`);
    }

    console.log('✅ Knockout matchups arranged successfully!');

    // STEP 9: Set parent match relationships for winner advancement
    console.log('🔗 Setting parent match relationships...');
    
    // Get all knockout matches sorted by round
    const allKnockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });
    
    // For each round (except final), set parent relationships
    const rounds = [...new Set(allKnockoutMatches.map(m => m.round))].sort((a, b) => b - a);
    
    for (const currentRound of rounds) {
      if (currentRound === 1) continue; // Skip final (no parent)
      
      const roundMatches = allKnockoutMatches.filter(m => m.round === currentRound);
      const parentRound = currentRound - 1;
      
      for (let i = 0; i < roundMatches.length; i++) {
        const match = roundMatches[i];
        const parentMatchNumber = Math.floor(i / 2) + 1;
        
        const parentMatch = allKnockoutMatches.find(
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
          
          console.log(`   ✓ Match ${match.matchNumber} (Round ${currentRound}) → Parent: Match ${parentMatch.matchNumber} (Round ${parentRound}) as ${winnerPosition}`);
        }
      }
    }
    
    console.log('✅ Parent relationships set!');

    // Fetch updated draw with all data
    const finalDraw = await prisma.draw.findUnique({
      where: { id: draw.id },
      include: {
        tournament: true,
        category: true
      }
    });

    res.json({
      success: true,
      message: 'Knockout matchups arranged successfully',
      draw: finalDraw
    });
  } catch (error) {
    console.error('❌ Arrange knockout matchups error:', error);
    res.status(500).json({ success: false, error: 'Failed to arrange knockout matchups' });
  }
};

/**
 * Continue to Knockout Stage - Creates knockout bracket with selected players
 * Organizer provides draw size and selects players manually
 * POST /api/tournaments/:tournamentId/categories/:categoryId/draw/continue-to-knockout
 */
const continueToKnockout = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const { knockoutDrawSize, selectedPlayerIds } = req.body;
    const userId = req.user.id;

    console.log('🎯 Continue to Knockout - Creating knockout bracket...');
    console.log(`   Draw Size: ${knockoutDrawSize}`);
    console.log(`   Selected Players: ${selectedPlayerIds?.length || 0}`);

    // Verify tournament and ownership
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament || tournament.organizerId !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized' });
    }

    // Get existing draw
    const draw = await prisma.draw.findUnique({
      where: { tournamentId_categoryId: { tournamentId, categoryId } }
    });

    if (!draw) {
      return res.status(404).json({ success: false, error: 'Draw not found' });
    }

    const bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;

    if (bracketJson.format !== 'ROUND_ROBIN_KNOCKOUT') {
      return res.status(400).json({ success: false, error: 'This feature is only for Round Robin + Knockout format' });
    }

    // Validate knockout draw size
    if (!knockoutDrawSize || knockoutDrawSize < 2 || knockoutDrawSize > 32) {
      return res.status(400).json({ success: false, error: 'Invalid knockout draw size. Must be between 2 and 32 players' });
    }

    // Validate that draw size is even (for proper matchups)
    if (knockoutDrawSize % 2 !== 0) {
      return res.status(400).json({ success: false, error: 'Knockout draw size must be an even number' });
    }

    // Validate selected players
    if (!selectedPlayerIds || selectedPlayerIds.length !== knockoutDrawSize) {
      return res.status(400).json({ 
        success: false, 
        error: `Please select exactly ${knockoutDrawSize} players for knockout stage` 
      });
    }

    console.log('✅ Validation passed');

    // Get player details
    const players = await prisma.user.findMany({
      where: { id: { in: selectedPlayerIds } },
      select: { id: true, name: true }
    });

    if (players.length !== knockoutDrawSize) {
      return res.status(400).json({ success: false, error: 'Some selected players not found' });
    }

    console.log(`✅ Found ${players.length} players`);

    // Update knockout bracket with selected players
    if (bracketJson.knockout && bracketJson.knockout.rounds) {
      // First, reset ALL knockout matches in bracketJson (clear old data)
      for (const round of bracketJson.knockout.rounds) {
        if (round.matches) {
          for (const match of round.matches) {
            // Clear all match data except structure
            match.player1 = null;
            match.player2 = null;
            match.winner = null;
            match.winnerId = null;
            match.score = null;
            match.status = 'PENDING';
            match.startTime = null;
            match.endTime = null;
            match.umpireId = null;
          }
        }
      }
      
      // Now assign players to first round matches
      if (bracketJson.knockout.rounds[0] && bracketJson.knockout.rounds[0].matches) {
        const firstRound = bracketJson.knockout.rounds[0].matches;
        const numMatches = knockoutDrawSize / 2;
        
        // Get category format to check if doubles
        const category = await prisma.category.findUnique({
          where: { id: categoryId },
          select: { format: true }
        });
        
        const isDoubles = category?.format === 'doubles';
        
        for (let i = 0; i < numMatches && i < firstRound.length; i++) {
          const player1 = players[i * 2];
          const player2 = players[i * 2 + 1];
          
          // Helper function to get player with partner info
          const getPlayerWithPartner = async (player) => {
            if (!player) return null;
            
            const playerData = { id: player.id, name: player.name, seed: player.seed };
            
            // If doubles, find partner
            if (isDoubles) {
              const registration = await prisma.registration.findFirst({
                where: {
                  categoryId,
                  userId: player.id,
                  status: { in: ['confirmed', 'pending'] }
                },
                include: {
                  partner: {
                    select: { id: true, name: true }
                  }
                }
              });
              
              if (registration?.partner) {
                playerData.partnerName = registration.partner.name;
                playerData.partnerId = registration.partner.id;
              }
            }
            
            return playerData;
          };
          
          firstRound[i].player1 = await getPlayerWithPartner(player1);
          firstRound[i].player2 = await getPlayerWithPartner(player2);
          firstRound[i].status = 'PENDING';
        }
      }
      
      console.log('✅ Knockout bracket reset and players assigned');
    }

    // Save updated bracket
    const updatedDraw = await prisma.draw.update({
      where: { id: draw.id },
      data: { bracketJson: JSON.stringify(bracketJson) }
    });

    // Update database Match records for knockout stage
    const knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: { matchNumber: 'asc' }
    });

    console.log(`📝 Updating ${knockoutMatches.length} knockout match records`);

    // Reset all knockout matches first
    for (const match of knockoutMatches) {
      await prisma.match.update({
        where: { id: match.id },
        data: {
          player1Id: null,
          player2Id: null,
          status: 'PENDING',
          winnerId: null,
          score: null,
          startTime: null,
          endTime: null,
          umpireId: null
        }
      });
    }

    // Assign players to first round knockout matches
    const firstRoundMatches = knockoutMatches.filter(m => m.round === Math.max(...knockoutMatches.map(km => km.round)));
    const numMatches = knockoutDrawSize / 2;
    
    console.log(`🎯 Assigning players to ${numMatches} first round matches`);
    console.log(`   First round has ${firstRoundMatches.length} matches (round ${Math.max(...knockoutMatches.map(km => km.round))})`);
    
    for (let i = 0; i < numMatches && i < firstRoundMatches.length; i++) {
      const player1 = players[i * 2];
      const player2 = players[i * 2 + 1];
      
      console.log(`   Match ${i + 1}: ${player1?.name} vs ${player2?.name}`);
      
      await prisma.match.update({
        where: { id: firstRoundMatches[i].id },
        data: {
          player1Id: player1?.id || null,
          player2Id: player2?.id || null,
          status: 'PENDING'
        }
      });
    }

    console.log('✅ Knockout stage created successfully!');

    res.json({
      success: true,
      message: `Knockout stage created with ${knockoutDrawSize} players!`,
      draw: { ...updatedDraw, bracketJson },
      knockoutDrawSize,
      selectedPlayers: players
    });
  } catch (error) {
    console.error('❌ Continue to knockout error:', error);
    res.status(500).json({ success: false, error: 'Failed to create knockout stage' });
  }
};

export {
  generateDraw,
  getDraw,
  deleteDraw,
  createConfiguredDraw,
  getCategoryPlayers,
  assignPlayersToDraw,
  bulkAssignAllPlayers,
  shuffleAssignedPlayers,
  arrangeKnockoutMatchups,
  continueToKnockout
};
