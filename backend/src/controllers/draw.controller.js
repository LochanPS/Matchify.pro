import { PrismaClient } from '@prisma/client';
import seedingService from '../services/seeding.service.js';
import bracketService from '../services/bracket.service.js';
import matchService from '../services/match.service.js';

const prisma = new PrismaClient();

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

    res.json({
      success: true,
      draw: {
        id: draw.id,
        tournament: draw.tournament,
        category: draw.category,
        format: draw.format,
        bracketJson: JSON.parse(draw.bracketJson),
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
      message: 'Draw deleted successfully'
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
    }

    // Save updated draw
    const updatedDraw = await prisma.draw.update({
      where: { tournamentId_categoryId: { tournamentId, categoryId } },
      data: { bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() }
    });

    // Update Match records with player assignments (for knockout format)
    if (bracketJson.format === 'KNOCKOUT') {
      // Get all matches for this category (round 1)
      const matches = await prisma.match.findMany({
        where: { tournamentId, categoryId, round: 1 },
        orderBy: { matchNumber: 'asc' }
      });

      // First clear all player assignments in round 1
      for (const match of matches) {
        await prisma.match.update({
          where: { id: match.id },
          data: { player1Id: null, player2Id: null, player1Seed: null, player2Seed: null }
        });
      }

      // Then assign players to their slots
      for (const assignment of assignments) {
        const matchIndex = Math.floor((assignment.slot - 1) / 2);
        const playerPosition = (assignment.slot - 1) % 2 === 0 ? 'player1Id' : 'player2Id';
        const seedPosition = (assignment.slot - 1) % 2 === 0 ? 'player1Seed' : 'player2Seed';
        
        if (matches[matchIndex]) {
          await prisma.match.update({
            where: { id: matches[matchIndex].id },
            data: {
              [playerPosition]: assignment.playerId,
              [seedPosition]: assignment.slot
            }
          });
        }
      }
    }

    res.json({
      success: true,
      message: 'Players assigned successfully',
      draw: { ...updatedDraw, bracketJson }
    });
  } catch (error) {
    console.error('Assign players error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign players' });
  }
};

/**
 * Create configured draw with flexible format options
 * POST /api/draws/create
 */
const createConfiguredDraw = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { tournamentId, categoryId, format, bracketSize, numberOfGroups, playersPerGroup, advanceFromGroup } = req.body;

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
      bracketJson = generateRoundRobinBracket(size, numberOfGroups || 1);
    } else if (format === 'ROUND_ROBIN_KNOCKOUT') {
      bracketJson = generateGroupsKnockoutBracket(size, numberOfGroups || 4, advanceFromGroup || 2);
    } else {
      bracketJson = generateKnockoutBracket(size);
    }

    // Upsert draw
    const draw = await prisma.draw.upsert({
      where: { tournamentId_categoryId: { tournamentId, categoryId } },
      update: { format, bracketJson: JSON.stringify(bracketJson), updatedAt: new Date() },
      create: { tournamentId, categoryId, format, bracketJson: JSON.stringify(bracketJson) }
    });

    // Create Match records for knockout format
    if (format === 'KNOCKOUT' && bracketJson.rounds) {
      // Delete existing matches for this category first
      await prisma.match.deleteMany({
        where: { tournamentId, categoryId }
      });

      // Create match records
      const matchRecords = [];
      let globalMatchNum = 1;
      
      for (let roundIdx = 0; roundIdx < bracketJson.rounds.length; roundIdx++) {
        const round = bracketJson.rounds[roundIdx];
        for (let matchIdx = 0; matchIdx < round.matches.length; matchIdx++) {
          const match = round.matches[matchIdx];
          matchRecords.push({
            tournamentId,
            categoryId,
            round: roundIdx + 1,
            matchNumber: globalMatchNum++,
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
    }

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
function generateRoundRobinBracket(size, numberOfGroups) {
  const playersPerGroup = Math.ceil(size / numberOfGroups);
  const groups = [];

  for (let g = 0; g < numberOfGroups; g++) {
    const participants = [];
    for (let p = 0; p < playersPerGroup; p++) {
      const slotNum = g * playersPerGroup + p + 1;
      if (slotNum <= size) {
        participants.push({ id: null, name: `Slot ${slotNum}`, seed: slotNum, played: 0, wins: 0, losses: 0, points: 0 });
      }
    }
    
    // Generate all matches for this group (Round Robin)
    const matches = generateGroupMatches(participants, g);
    
    groups.push({ 
      groupName: String.fromCharCode(65 + g), 
      participants,
      matches,
      totalMatches: matches.length
    });
  }

  return { format: 'ROUND_ROBIN', bracketSize: size, numberOfGroups, groups };
}

// Helper: Generate all matches for a group (everyone plays everyone)
function generateGroupMatches(participants, groupIndex) {
  const matches = [];
  let matchNumber = 1;
  
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      matches.push({
        matchNumber: matchNumber++,
        groupIndex,
        player1: participants[i],
        player2: participants[j],
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
function generateGroupsKnockoutBracket(size, numberOfGroups, advanceFromGroup) {
  const groupData = generateRoundRobinBracket(size, numberOfGroups);
  const knockoutSize = numberOfGroups * advanceFromGroup;
  const knockoutData = generateKnockoutBracket(knockoutSize);

  return {
    format: 'ROUND_ROBIN_KNOCKOUT',
    bracketSize: size,
    numberOfGroups,
    advanceFromGroup,
    groups: groupData.groups,
    knockout: knockoutData
  };
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

    // Get available slots (not locked by started matches)
    const matches = await prisma.match.findMany({
      where: { tournamentId, categoryId },
      orderBy: { matchNumber: 'asc' }
    });

    if (bracketJson.format === 'KNOCKOUT' && bracketJson.rounds) {
      const firstRound = bracketJson.rounds[0];
      const assignments = [];
      let playerIndex = 0;

      // Assign players to available slots
      firstRound.matches.forEach((match, matchIdx) => {
        const dbMatch = matches.find(m => m.round === bracketJson.rounds.length && m.matchNumber === matchIdx + 1);
        const isLocked = dbMatch?.status === 'COMPLETED' || dbMatch?.status === 'IN_PROGRESS';

        if (!isLocked) {
          // Assign to player1 slot if empty
          if (!match.player1?.id && playerIndex < registrations.length) {
            const reg = registrations[playerIndex];
            match.player1 = {
              id: reg.user.id,
              name: reg.user.name,
              seed: matchIdx * 2 + 1
            };
            assignments.push({
              slot: matchIdx * 2 + 1,
              playerId: reg.user.id,
              playerName: reg.user.name
            });
            playerIndex++;
          }

          // Assign to player2 slot if empty
          if (!match.player2?.id && playerIndex < registrations.length) {
            const reg = registrations[playerIndex];
            match.player2 = {
              id: reg.user.id,
              name: reg.user.name,
              seed: matchIdx * 2 + 2
            };
            assignments.push({
              slot: matchIdx * 2 + 2,
              playerId: reg.user.id,
              playerName: reg.user.name
            });
            playerIndex++;
          }
        }
      });

      // Update match records
      for (const assignment of assignments) {
        const matchIndex = Math.floor((assignment.slot - 1) / 2);
        const playerPosition = (assignment.slot - 1) % 2 === 0 ? 'player1Id' : 'player2Id';
        const seedPosition = (assignment.slot - 1) % 2 === 0 ? 'player1Seed' : 'player2Seed';
        
        const dbMatch = matches[matchIndex];
        if (dbMatch) {
          await prisma.match.update({
            where: { id: dbMatch.id },
            data: {
              [playerPosition]: assignment.playerId,
              [seedPosition]: assignment.slot
            }
          });
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
      
      // Collect all assigned players from unlocked matches
      const assignedPlayers = [];
      const unlockedSlots = [];

      firstRound.matches.forEach((match, matchIdx) => {
        const dbMatch = matches.find(m => m.round === bracketJson.rounds.length && m.matchNumber === matchIdx + 1);
        const isLocked = dbMatch?.status === 'COMPLETED' || dbMatch?.status === 'IN_PROGRESS';

        if (!isLocked) {
          if (match.player1?.id) {
            assignedPlayers.push(match.player1);
            unlockedSlots.push({ matchIdx, position: 'player1', slot: matchIdx * 2 + 1 });
          }
          if (match.player2?.id) {
            assignedPlayers.push(match.player2);
            unlockedSlots.push({ matchIdx, position: 'player2', slot: matchIdx * 2 + 2 });
          }
        }
      });

      // Shuffle the players array
      const shuffledPlayers = [...assignedPlayers].sort(() => Math.random() - 0.5);

      // Clear unlocked slots first
      unlockedSlots.forEach(({ matchIdx, position }) => {
        firstRound.matches[matchIdx][position] = { id: null, name: `Slot ${matchIdx * 2 + (position === 'player1' ? 1 : 2)}`, seed: matchIdx * 2 + (position === 'player1' ? 1 : 2) };
      });

      // Reassign shuffled players
      const assignments = [];
      shuffledPlayers.forEach((player, index) => {
        if (index < unlockedSlots.length) {
          const { matchIdx, position, slot } = unlockedSlots[index];
          firstRound.matches[matchIdx][position] = {
            ...player,
            seed: slot
          };
          assignments.push({
            slot,
            playerId: player.id,
            playerName: player.name
          });
        }
      });

      // Update match records
      for (const assignment of assignments) {
        const matchIndex = Math.floor((assignment.slot - 1) / 2);
        const playerPosition = (assignment.slot - 1) % 2 === 0 ? 'player1Id' : 'player2Id';
        const seedPosition = (assignment.slot - 1) % 2 === 0 ? 'player1Seed' : 'player2Seed';
        
        const dbMatch = matches[matchIndex];
        if (dbMatch) {
          await prisma.match.update({
            where: { id: dbMatch.id },
            data: {
              [playerPosition]: assignment.playerId,
              [seedPosition]: assignment.slot
            }
          });
        }
      }

      // Clear assignments for slots that don't have shuffled players
      for (let i = assignments.length; i < unlockedSlots.length; i++) {
        const { slot } = unlockedSlots[i];
        const matchIndex = Math.floor((slot - 1) / 2);
        const playerPosition = (slot - 1) % 2 === 0 ? 'player1Id' : 'player2Id';
        const seedPosition = (slot - 1) % 2 === 0 ? 'player1Seed' : 'player2Seed';
        
        const dbMatch = matches[matchIndex];
        if (dbMatch) {
          await prisma.match.update({
            where: { id: dbMatch.id },
            data: {
              [playerPosition]: null,
              [seedPosition]: null
            }
          });
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

export {
  generateDraw,
  getDraw,
  deleteDraw,
  createConfiguredDraw,
  getCategoryPlayers,
  assignPlayersToDraw,
  bulkAssignAllPlayers,
  shuffleAssignedPlayers
};
