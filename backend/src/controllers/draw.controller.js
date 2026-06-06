import prisma from '../lib/prisma.js';
import seedingService from '../services/seeding.service.js';
import bracketService from '../services/bracket.service.js';
import matchService from '../services/match.service.js';

/**
 * Helper function to get player name from registration
 * Handles both user registrations and guest registrations
 */
const getPlayerName = (registration) => {
  console.log('🔍 getPlayerName called:', {
    registrationId: registration.id,
    userId: registration.userId,
    userName: registration.user?.name,
    guestName: registration.guestName,
    hasUser: !!registration.user
  });
  
  // If userId exists, use user.name
  if (registration.userId && registration.user) {
    return registration.user.name;
  }
  // Otherwise, use guestName
  const name = registration.guestName || 'Unknown';
  console.log('🔍 Returning name:', name);
  return name;
};

/**
 * Helper function to get player email from registration
 */
const getPlayerEmail = (registration) => {
  if (registration.userId && registration.user) {
    return registration.user.email;
  }
  return registration.guestEmail || null;
};

/**
 * Helper function to get player ID from registration
 * For guest registrations, use registration ID as player ID
 */
const getPlayerId = (registration) => {
  if (registration.userId) {
    return registration.userId;
  }
  // For guests, use registration ID prefixed with 'guest-'
  return `guest-${registration.id}`;
};

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
    const userId = req.user.userId || req.user.id;

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
        paymentStatus: { in: ['verified', 'completed'] },
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        partner: {
          select: {
            id: true,
            name: true
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

    // Calculate seeds — parallel, not sequential (was N sequential awaits = Vercel timeout on 32+ players)
    const participantsWithSeeds = await Promise.all(
      registrations.map(async (registration) => {
        const seedScore = registration.userId
          ? await seedingService.calculateSeedScore(registration.userId)
          : 0;
        return {
          id:             getPlayerId(registration),
          registrationId: registration.id,
          name:           getPlayerName(registration),
          email:          getPlayerEmail(registration),
          seedScore,
          seed:        0, // assigned after sort
          partnerName: registration.partner?.name || registration.guestPartnerName || null,
          partnerId:   registration.partnerId    || null,
        };
      })
    );

    // Sort by seed score (highest first) and assign seeds
    participantsWithSeeds.sort((a, b) => b.seedScore - a.seedScore);
    participantsWithSeeds.forEach((p, index) => { p.seed = index + 1; });

    // Generate bracket structure
    const bracket = bracketService.generateSingleEliminationBracket(participantsWithSeeds);

    // Delete old matches + create new matches + create draw — all in one transaction.
    // Previously three separate writes: a crash between any two left the category in
    // a permanently broken state (no matches, no draw).
    console.log('🧹 Rebuilding draw in atomic transaction...');
    let matches, draw;
    await prisma.$transaction(async (tx) => {
      const deleted = await tx.match.deleteMany({ where: { tournamentId, categoryId } });
      console.log(`✅ Deleted ${deleted.count} old matches`);

      matches = await matchService.generateMatchesFromBracket(bracket, tournamentId, categoryId, tx);

      // Upsert draw (delete existing first if any — upsert not available on composite key easily)
      await tx.draw.deleteMany({ where: { tournamentId, categoryId } });
      draw = await tx.draw.create({
        data: {
          tournamentId,
          categoryId,
          format: 'single_elimination',
          bracketJson: JSON.stringify(bracket),
        }
      });
    });

    console.log(`✅ Created ${matches.length} new matches in database`);

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
    const guestPlayerIds = new Set();
    
    matches.forEach(match => {
      if (match.player1Id) {
        if (match.player1Id.startsWith('guest-')) {
          guestPlayerIds.add(match.player1Id);
        } else {
          playerIds.add(match.player1Id);
        }
      }
      if (match.player2Id) {
        if (match.player2Id.startsWith('guest-')) {
          guestPlayerIds.add(match.player2Id);
        } else {
          playerIds.add(match.player2Id);
        }
      }
      if (match.winnerId) {
        if (match.winnerId.startsWith('guest-')) {
          guestPlayerIds.add(match.winnerId);
        } else {
          playerIds.add(match.winnerId);
        }
      }
    });

    // Fetch player data from User table
    const players = await prisma.user.findMany({
      where: {
        id: { in: Array.from(playerIds) }
      },
      select: {
        id: true,
        name: true
      }
    });

    // Fetch guest player data from Registration table
    const guestRegistrationIds = Array.from(guestPlayerIds).map(id => id.replace('guest-', ''));
    const guestRegistrations = await prisma.registration.findMany({
      where: {
        id: { in: guestRegistrationIds }
      },
      select: {
        id: true,
        guestName: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create a player lookup map (combines users and guests)
    const playerMap = {};
    
    // Add regular users
    players.forEach(player => {
      playerMap[player.id] = player;
    });
    
    // Add guest players
    guestRegistrations.forEach(reg => {
      const guestId = `guest-${reg.id}`;
      playerMap[guestId] = {
        id: guestId,
        name: reg.userId && reg.user ? reg.user.name : (reg.guestName || 'Unknown')
      };
    });

    // Build partner name map: userId -> partnerName (for doubles categories)
    const partnerMap = {};
    const regWithPartners = await prisma.registration.findMany({
      where: { tournamentId: tournamentId, categoryId: categoryId },
      select: {
        userId: true,
        guestPartnerName: true,
        partner: { select: { id: true, name: true } }
      }
    });
    regWithPartners.forEach(reg => {
      if (reg.userId) {
        const name = reg.partner?.name || reg.guestPartnerName || null;
        if (name) partnerMap[reg.userId] = name;
      }
    });

    // Parse the stored bracket JSON
    let bracketData;
    try {
      bracketData = JSON.parse(draw.bracketJson);
      
      // SAFETY CHECK: Validate bracket structure
      if (!bracketData || typeof bracketData !== 'object') {
        console.error('❌ Invalid bracket structure in database, attempting recovery...');
        // Try to recover by creating a minimal valid structure
        bracketData = {
          format: draw.format || 'KNOCKOUT',
          rounds: []
        };
      }
      
      // SAFETY CHECK: Ensure required format field exists
      if (!bracketData.format) {
        console.warn('⚠️ Bracket missing format field, using draw format');
        bracketData.format = draw.format || 'KNOCKOUT';
      }
    } catch (parseError) {
      console.error('❌ Failed to parse bracket JSON:', parseError);
      // Recovery: Create a minimal valid bracket structure
      console.log('🔧 Creating recovery bracket structure...');
      bracketData = {
        format: draw.format || 'KNOCKOUT',
        rounds: []
      };
    }

    // Update bracket with live match data
    if (bracketData.format === 'KNOCKOUT') {
      // SAFETY CHECK: Ensure rounds array exists
      if (!bracketData.rounds) {
        console.warn('⚠️ KNOCKOUT bracket missing rounds array, initializing empty array');
        bracketData.rounds = [];
      }
      
      // SAFETY CHECK: Validate rounds is an array
      if (!Array.isArray(bracketData.rounds)) {
        console.error('❌ Bracket rounds is not an array, recovering...');
        bracketData.rounds = [];
      }
      
      // Update knockout bracket with match results
      bracketData.rounds.forEach((round, roundIndex) => {
        // SAFETY CHECK: Validate round has matches array
        if (!round.matches || !Array.isArray(round.matches)) {
          console.warn(`⚠️ Round ${roundIndex} missing matches array`);
          return;
        }
        
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
                name: playerMap[dbMatch.player1Id].name,
                partnerName: partnerMap[dbMatch.player1Id] || null
              };
            }
            if (dbMatch.player2Id && playerMap[dbMatch.player2Id]) {
              match.player2 = {
                id: dbMatch.player2Id,
                name: playerMap[dbMatch.player2Id].name,
                partnerName: partnerMap[dbMatch.player2Id] || null
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
        // Update participant names in the group
        if (group.participants && Array.isArray(group.participants)) {
          group.participants.forEach((participant, pIndex) => {
            if (participant.id && playerMap[participant.id]) {
              participant.name = playerMap[participant.id].name;
              participant.partnerName = partnerMap[participant.id] || null;
            }
          });
        }

        if (group.matches && Array.isArray(group.matches)) {
          group.matches.forEach((match, matchIndex) => {
            // Find corresponding DB match — stage+matchNumber first, then player IDs (null-stage fallback)
            let dbMatch = matches.find(m => m.stage === 'GROUP' && m.matchNumber === match.matchNumber);
            if (!dbMatch && match.player1?.id && match.player2?.id) {
              dbMatch = matches.find(m =>
                (m.player1Id === match.player1.id && m.player2Id === match.player2.id) ||
                (m.player1Id === match.player2.id && m.player2Id === match.player1.id)
              );
            }

            if (dbMatch) {
              // Update player names
              if (dbMatch.player1Id && playerMap[dbMatch.player1Id]) {
                match.player1 = {
                  id: dbMatch.player1Id,
                  name: playerMap[dbMatch.player1Id].name,
                  partnerName: partnerMap[dbMatch.player1Id] || null
                };
              }
              if (dbMatch.player2Id && playerMap[dbMatch.player2Id]) {
                match.player2 = {
                  id: dbMatch.player2Id,
                  name: playerMap[dbMatch.player2Id].name,
                  partnerName: partnerMap[dbMatch.player2Id] || null
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
        
        // 🔥 CRITICAL FIX: Recalculate standings from completed matches
        // Reset participant stats first
        if (group.participants && Array.isArray(group.participants)) {
          group.participants.forEach(p => {
            p.played = 0;
            p.wins = 0;
            p.losses = 0;
            p.points = 0;
            p.totalPoints = 0; // TP = Total Points Scored in matches
          });
        }
        
        // Get all completed matches for this group
        // Try multiple strategies to find matches
        console.log(`🔍 Recalculating standings for group ${groupIndex}...`);
        console.log(`   Total matches in database: ${matches.length}`);
        console.log(`   Group has ${group.matches?.length || 0} matches in bracketJson`);
        
        // Strategy 1: Match by stage and match number
        let groupMatches = matches.filter(m => 
          m.stage === 'GROUP' &&
          m.status === 'COMPLETED' &&
          group.matches && group.matches.some(gm => gm.matchNumber === m.matchNumber)
        );
        
        console.log(`   Strategy 1 (stage + matchNumber): Found ${groupMatches.length} matches`);
        
        // Strategy 2: If no matches found, try without stage filter (for old data)
        if (groupMatches.length === 0) {
          groupMatches = matches.filter(m => 
            m.status === 'COMPLETED' &&
            group.matches && group.matches.some(gm => gm.matchNumber === m.matchNumber)
          );
          console.log(`   Strategy 2 (matchNumber only): Found ${groupMatches.length} matches`);
        }
        
        // Strategy 3: If still no matches, match by player IDs
        if (groupMatches.length === 0 && group.participants) {
          const participantIds = group.participants.map(p => p.id).filter(Boolean);
          groupMatches = matches.filter(m => 
            m.status === 'COMPLETED' &&
            participantIds.includes(m.player1Id) &&
            participantIds.includes(m.player2Id)
          );
          console.log(`   Strategy 3 (player IDs): Found ${groupMatches.length} matches`);
        }
        
        console.log(`   Final: Using ${groupMatches.length} completed matches for standings`);
        
        // Calculate standings from completed matches
        groupMatches.forEach(m => {
          const player1 = group.participants.find(p => p.id === m.player1Id);
          const player2 = group.participants.find(p => p.id === m.player2Id);
          
          console.log(`   Match ${m.matchNumber}: ${m.player1Id} vs ${m.player2Id}, winner: ${m.winnerId}`);
          console.log(`   Found player1: ${!!player1}, Found player2: ${!!player2}`);
          
          if (player1 && player2) {
            player1.played++;
            player2.played++;
            
            // Calculate TP (Total Points Scored) from scoreJson
            if (m.scoreJson) {
              try {
                const scoreData = typeof m.scoreJson === 'string' ? JSON.parse(m.scoreJson) : m.scoreJson;
                console.log(`   Score data:`, scoreData);
                
                if (scoreData && scoreData.sets && Array.isArray(scoreData.sets)) {
                  let player1TotalPoints = 0;
                  let player2TotalPoints = 0;
                  
                  scoreData.sets.forEach(set => {
                    // Support multiple scoreJson formats: player1/player2, p1/p2, score1/score2
                    const p1Score = set.player1 ?? set.p1 ?? set.score1 ?? 0;
                    const p2Score = set.player2 ?? set.p2 ?? set.score2 ?? 0;
                    
                    player1TotalPoints += p1Score;
                    player2TotalPoints += p2Score;
                  });
                  
                  player1.totalPoints = (player1.totalPoints || 0) + player1TotalPoints;
                  player2.totalPoints = (player2.totalPoints || 0) + player2TotalPoints;
                  
                  console.log(`   ${player1.name} scored ${player1TotalPoints} points (total: ${player1.totalPoints})`);
                  console.log(`   ${player2.name} scored ${player2TotalPoints} points (total: ${player2.totalPoints})`);
                }
              } catch (parseError) {
                console.error(`   Error parsing scoreJson for match ${m.matchNumber}:`, parseError);
              }
            }
            
            // Calculate wins/losses and ranking points
            if (m.winnerId === m.player1Id) {
              player1.wins++;
              player1.points += 2; // Win = 2 points
              player2.losses++;
              console.log(`   ${player1.name} wins! Now has ${player1.points} ranking points`);
            } else if (m.winnerId === m.player2Id) {
              player2.wins++;
              player2.points += 2; // Win = 2 points
              player1.losses++;
              console.log(`   ${player2.name} wins! Now has ${player2.points} ranking points`);
            }
          }
        });
        
        // Log final standings
        console.log(`   Final standings for group ${groupIndex}:`);
        group.participants.forEach(p => {
          console.log(`   - ${p.name}: ${p.points}pts (${p.wins}W-${p.losses}L, ${p.played}P, TP:${p.totalPoints || 0})`);
        });
        
        // Sort: points DESC → point-diff DESC → totalPoints DESC (matches updateRoundRobinStandings)
        if (group.participants && Array.isArray(group.participants)) {
          group.participants.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const aDiff = (a.totalPoints || 0) - (a.totalPointsAgainst || 0);
            const bDiff = (b.totalPoints || 0) - (b.totalPointsAgainst || 0);
            if (bDiff !== aDiff) return bDiff - aDiff;
            return (b.totalPoints || 0) - (a.totalPoints || 0);
          });
        }
      });
    } else if (bracketData.format === 'ROUND_ROBIN_KNOCKOUT') {
      // Update round robin groups in mixed format
      if (bracketData.groups) {
        bracketData.groups.forEach((group, groupIndex) => {
          // Update participant names in the group
          if (group.participants && Array.isArray(group.participants)) {
            group.participants.forEach((participant, pIndex) => {
              if (participant.id && playerMap[participant.id]) {
                participant.name = playerMap[participant.id].name;
                participant.partnerName = partnerMap[participant.id] || null;
              }
            });
          }

          if (group.matches && Array.isArray(group.matches)) {
            group.matches.forEach((match, matchIndex) => {
              // Find corresponding DB match — stage+matchNumber first, then player IDs (null-stage fallback)
              let dbMatch = matches.find(m => m.stage === 'GROUP' && m.matchNumber === match.matchNumber);
              if (!dbMatch && match.player1?.id && match.player2?.id) {
                dbMatch = matches.find(m =>
                  (m.player1Id === match.player1.id && m.player2Id === match.player2.id) ||
                  (m.player1Id === match.player2.id && m.player2Id === match.player1.id)
                );
              }

              if (dbMatch) {
                if (dbMatch.player1Id && playerMap[dbMatch.player1Id]) {
                  match.player1 = {
                    id: dbMatch.player1Id,
                    name: playerMap[dbMatch.player1Id].name,
                    partnerName: partnerMap[dbMatch.player1Id] || null
                  };
                }
                if (dbMatch.player2Id && playerMap[dbMatch.player2Id]) {
                  match.player2 = {
                    id: dbMatch.player2Id,
                    name: playerMap[dbMatch.player2Id].name,
                    partnerName: partnerMap[dbMatch.player2Id] || null
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
          
          // 🔥 CRITICAL FIX: Recalculate standings from completed matches
          // Reset participant stats first
          if (group.participants && Array.isArray(group.participants)) {
            group.participants.forEach(p => {
              p.played = 0;
              p.wins = 0;
              p.losses = 0;
              p.points = 0;
              p.totalPoints = 0; // TP = Total Points Scored in matches
            });
          }
          
          // Get all completed matches for this group
          // Try multiple strategies to find matches
          console.log(`🔍 Recalculating standings for group ${groupIndex} (ROUND_ROBIN_KNOCKOUT)...`);
          console.log(`   Total matches in database: ${matches.length}`);
          console.log(`   Group has ${group.matches?.length || 0} matches in bracketJson`);
          
          // Strategy 1: Match by stage and match number
          let groupMatches = matches.filter(m => 
            m.stage === 'GROUP' &&
            m.status === 'COMPLETED' &&
            group.matches && group.matches.some(gm => gm.matchNumber === m.matchNumber)
          );
          
          console.log(`   Strategy 1 (stage + matchNumber): Found ${groupMatches.length} matches`);
          
          // Strategy 2: If no matches found, try without stage filter (for old data)
          if (groupMatches.length === 0) {
            groupMatches = matches.filter(m => 
              m.status === 'COMPLETED' &&
              group.matches && group.matches.some(gm => gm.matchNumber === m.matchNumber)
            );
            console.log(`   Strategy 2 (matchNumber only): Found ${groupMatches.length} matches`);
          }
          
          // Strategy 3: If still no matches, match by player IDs
          if (groupMatches.length === 0 && group.participants) {
            const participantIds = group.participants.map(p => p.id).filter(Boolean);
            groupMatches = matches.filter(m => 
              m.status === 'COMPLETED' &&
              participantIds.includes(m.player1Id) &&
              participantIds.includes(m.player2Id)
            );
            console.log(`   Strategy 3 (player IDs): Found ${groupMatches.length} matches`);
          }
          
          console.log(`   Final: Using ${groupMatches.length} completed matches for standings`);
          
          // Calculate standings from completed matches
          groupMatches.forEach(m => {
            const player1 = group.participants.find(p => p.id === m.player1Id);
            const player2 = group.participants.find(p => p.id === m.player2Id);
            
            console.log(`   Match ${m.matchNumber}: ${m.player1Id} vs ${m.player2Id}, winner: ${m.winnerId}`);
            console.log(`   Found player1: ${!!player1}, Found player2: ${!!player2}`);
            
            if (player1 && player2) {
              player1.played++;
              player2.played++;
              
              // Calculate TP (Total Points Scored) from scoreJson
              if (m.scoreJson) {
                try {
                  const scoreData = typeof m.scoreJson === 'string' ? JSON.parse(m.scoreJson) : m.scoreJson;
                  console.log(`   Score data:`, scoreData);
                  
                  if (scoreData && scoreData.sets && Array.isArray(scoreData.sets)) {
                    let player1TotalPoints = 0;
                    let player2TotalPoints = 0;
                    
                    scoreData.sets.forEach(set => {
                      // Support multiple scoreJson formats: player1/player2, p1/p2, score1/score2
                      const p1Score = set.player1 ?? set.p1 ?? set.score1 ?? 0;
                      const p2Score = set.player2 ?? set.p2 ?? set.score2 ?? 0;
                      
                      player1TotalPoints += p1Score;
                      player2TotalPoints += p2Score;
                    });
                    
                    player1.totalPoints = (player1.totalPoints || 0) + player1TotalPoints;
                    player2.totalPoints = (player2.totalPoints || 0) + player2TotalPoints;
                    
                    console.log(`   ${player1.name} scored ${player1TotalPoints} points (total: ${player1.totalPoints})`);
                    console.log(`   ${player2.name} scored ${player2TotalPoints} points (total: ${player2.totalPoints})`);
                  }
                } catch (parseError) {
                  console.error(`   Error parsing scoreJson for match ${m.matchNumber}:`, parseError);
                }
              }
              
              // Calculate wins/losses and ranking points
              if (m.winnerId === m.player1Id) {
                player1.wins++;
                player1.points += 2; // Win = 2 points
                player2.losses++;
                console.log(`   ${player1.name} wins! Now has ${player1.points} ranking points`);
              } else if (m.winnerId === m.player2Id) {
                player2.wins++;
                player2.points += 2; // Win = 2 points
                player1.losses++;
                console.log(`   ${player2.name} wins! Now has ${player2.points} ranking points`);
              }
            }
          });
          
          // Log final standings
          console.log(`   Final standings for group ${groupIndex}:`);
          group.participants.forEach(p => {
            console.log(`   - ${p.name}: ${p.points}pts (${p.wins}W-${p.losses}L, ${p.played}P, TP:${p.totalPoints || 0})`);
          });
          
          // Sort: points DESC → point-diff DESC → totalPoints DESC (matches updateRoundRobinStandings)
          if (group.participants && Array.isArray(group.participants)) {
            group.participants.sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              const aDiff = (a.totalPoints || 0) - (a.totalPointsAgainst || 0);
              const bDiff = (b.totalPoints || 0) - (b.totalPointsAgainst || 0);
              if (bDiff !== aDiff) return bDiff - aDiff;
              return (b.totalPoints || 0) - (a.totalPoints || 0);
            });
          }
        });
      }

      // Update knockout stage in mixed format
      if (bracketData.knockout) {
        // KO matches start after all GROUP matches in matchNumber sequence (for null-stage fallback)
        const totalGroupMatchNums = bracketData.groups?.reduce((s, g) => s + (g.matches?.length || 0), 0) || 0;

        bracketData.knockout.rounds.forEach((round, roundIndex) => {
          // Use index-based lookup instead of matchNumber-based, because KO matches created
          // by assignPlayersToDraw use global matchNumbers (not per-round 1-based).
          const dbRound = bracketData.knockout.rounds.length - roundIndex;
          const roundDbMatches = matches
            .filter(m => m.round === dbRound && (m.stage === 'KNOCKOUT' || (m.stage === null && m.matchNumber > totalGroupMatchNums)))
            .sort((a, b) => a.matchNumber - b.matchNumber);

          round.matches.forEach((match, matchIndex) => {
            const dbMatch = roundDbMatches[matchIndex];

            if (dbMatch) {
              if (dbMatch.player1Id && playerMap[dbMatch.player1Id]) {
                match.player1 = {
                  id: dbMatch.player1Id,
                  name: playerMap[dbMatch.player1Id].name,
                  partnerName: partnerMap[dbMatch.player1Id] || null
                };
              }
              if (dbMatch.player2Id && playerMap[dbMatch.player2Id]) {
                match.player2 = {
                  id: dbMatch.player2Id,
                  name: playerMap[dbMatch.player2Id].name,
                  partnerName: partnerMap[dbMatch.player2Id] || null
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

    // Set STRONG no-cache headers to ensure fresh data for all viewers
    // This prevents browsers from caching draw data so players always see latest updates
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff'
    });

    // SAFETY CHECK: Ensure bracketData is valid before sending
    if (!bracketData || typeof bracketData !== 'object') {
      console.warn('⚠️ Invalid bracketData, sending minimal structure');
      bracketData = {
        format: draw.format || 'KNOCKOUT',
        rounds: []
      };
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
    console.error('❌ Get draw error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      tournamentId: req.params.tournamentId,
      categoryId: req.params.categoryId,
      message: error.message
    });
    
    // Return a safe error response instead of crashing
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch draw',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    const userId = req.user.userId || req.user.id;

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
 * Restart draw - Reset all match results while keeping bracket structure
 * POST /api/tournaments/:tournamentId/categories/:categoryId/draw/restart
 */
const restartDraw = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.userId || req.user.id;
    // activeStage: 'knockout' = KO-only restart on hybrid format; anything else = full restart
    const { activeStage } = req.body;
    const koOnly = activeStage === 'knockout';

    console.log('🔄 Restarting draw for tournament:', tournamentId, 'category:', categoryId, koOnly ? '(KO only)' : '(full)');

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
        error: 'Only the organizer can restart draws' 
      });
    }

    // Check if any matches are currently IN_PROGRESS
    const inProgressMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        status: 'IN_PROGRESS'
      }
    });

    if (inProgressMatches.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot restart draw while matches are in progress. Please complete or cancel ongoing matches first.'
      });
    }

    // Get the draw
    const draw = await prisma.draw.findUnique({
      where: {
        tournamentId_categoryId: { tournamentId, categoryId }
      }
    });

    if (!draw) {
      return res.status(404).json({
        success: false,
        error: 'Draw not found'
      });
    }

    // Reset matches - for koOnly, skip GROUP stage matches entirely
    console.log('🧹 Resetting match results...');
    const allMatches = await prisma.match.findMany({
      where: { tournamentId, categoryId }
    });

    // KO-only restart: only reset KNOCKOUT stage matches, leave GROUP stage untouched
    const matchesToReset = koOnly
      ? allMatches.filter(m => m.stage === 'KNOCKOUT')
      : allMatches;

    // Highest round among matches being reset — used to detect winner-advanced slots
    const maxRound = matchesToReset.length > 0 ? Math.max(...matchesToReset.map(m => m.round)) : 1;

    // Batch matches by their reset payload — avoids N sequential round-trips (Vercel 10s timeout)
    // Group 1: later KNOCKOUT rounds (winner-advanced slots) — null out player slots too
    const laterKoIds = matchesToReset
      .filter(m => m.stage === 'KNOCKOUT' && m.round < maxRound)
      .map(m => m.id);
    // Group 2: first-round matches with both players present — status READY
    const readyIds = matchesToReset
      .filter(m => !(m.stage === 'KNOCKOUT' && m.round < maxRound) && m.player1Id && m.player2Id)
      .map(m => m.id);
    // Group 3: everything else — status PENDING
    const pendingIds = matchesToReset
      .filter(m => !(m.stage === 'KNOCKOUT' && m.round < maxRound) && !(m.player1Id && m.player2Id))
      .map(m => m.id);

    const baseReset = { winnerId: null, scoreJson: null, startedAt: null, completedAt: null, umpireId: null, updatedAt: new Date() };

    await Promise.all([
      laterKoIds.length > 0 && prisma.match.updateMany({
        where: { id: { in: laterKoIds } },
        data: { ...baseReset, player1Id: null, player2Id: null, status: 'PENDING' }
      }),
      readyIds.length > 0 && prisma.match.updateMany({
        where: { id: { in: readyIds } },
        data: { ...baseReset, status: 'READY' }
      }),
      pendingIds.length > 0 && prisma.match.updateMany({
        where: { id: { in: pendingIds } },
        data: { ...baseReset, status: 'PENDING' }
      }),
    ].filter(Boolean));

    console.log(`✅ Reset ${matchesToReset.length} matches (koOnly=${koOnly}) — ${laterKoIds.length} later-KO, ${readyIds.length} ready, ${pendingIds.length} pending`);

    // Reset bracket JSON - clear winners but keep structure
    console.log('🔧 Resetting bracket JSON...');
    let bracketJson = JSON.parse(draw.bracketJson);

    // Helper: reset a single match's result fields
    const resetMatchJson = (match, keepPlayers = true) => {
      match.winner = null;
      match.winnerId = null;
      match.score = null;
      match.scoreJson = null;
      match.completed = false;
      if (!keepPlayers) {
        match.player1 = null;
        match.player2 = null;
      }
      match.status = (keepPlayers && match.player1 && match.player2) ? 'ready' : 'pending';
      if (match.dbMatch) {
        match.dbMatch.winnerId = null;
        match.dbMatch.scoreJson = null;
        match.dbMatch.score = null;
        match.dbMatch.startedAt = null;
        match.dbMatch.completedAt = null;
        match.dbMatch.status = (keepPlayers && match.player1 && match.player2) ? 'READY' : 'PENDING';
      }
    };

    if (!koOnly) {
      // Full restart: reset pure KNOCKOUT rounds
      if (bracketJson.rounds && Array.isArray(bracketJson.rounds)) {
        bracketJson.rounds.forEach(round => {
          if (round.matches && Array.isArray(round.matches)) {
            round.matches.forEach(m => resetMatchJson(m, true));
          }
        });
      }

      // Full restart: reset group stage standings + matches
      if (bracketJson.groups && Array.isArray(bracketJson.groups)) {
        bracketJson.groups.forEach(group => {
          if (group.participants && Array.isArray(group.participants)) {
            group.participants.forEach(p => {
              p.played = 0; p.wins = 0; p.losses = 0; p.points = 0; p.totalPoints = 0; p.totalPointsAgainst = 0;
            });
          }
          if (group.matches && Array.isArray(group.matches)) {
            group.matches.forEach(m => resetMatchJson(m, true));
          }
        });
      }
    }

    // Always reset hybrid knockout stage (both full and KO-only restart)
    if (bracketJson.knockout && bracketJson.knockout.rounds) {
      const koRounds = bracketJson.knockout.rounds;
      const isFirstKoRound = (ri) => ri === koRounds.length - 1; // last in array = first played
      koRounds.forEach((round, ri) => {
        if (round.matches && Array.isArray(round.matches)) {
          round.matches.forEach(match => {
            // For the first KO round, keep player assignments (only clear results)
            // For later KO rounds, also clear player slots (they were filled by winner advancement)
            const keepPlayers = isFirstKoRound(ri);
            resetMatchJson(match, keepPlayers);
          });
        }
      });
    }

    // Update the draw with reset bracket JSON
    await prisma.draw.update({
      where: {
        tournamentId_categoryId: { tournamentId, categoryId }
      },
      data: {
        bracketJson: JSON.stringify(bracketJson),
        updatedAt: new Date()
      }
    });

    console.log('✅ Draw restarted successfully');

    res.json({
      success: true,
      message: koOnly
        ? 'Knockout stage restarted. Group stage results are preserved.'
        : 'Draw restarted successfully. All match results have been cleared.',
      data: {
        matchesReset: matchesToReset.length,
        playersKept: true,
        structurePreserved: true,
        koOnly
      }
    });

  } catch (error) {
    console.error('❌ Error restarting draw:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to restart draw'
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

    console.log('🔍 getCategoryPlayers called:', { tournamentId, categoryId });

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
        },
        partner: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    console.log('🔍 Found registrations:', registrations.length);
    registrations.forEach((reg, i) => {
      console.log(`  [${i}] ID: ${reg.id}, userId: ${reg.userId}, guestName: ${reg.guestName}, userName: ${reg.user?.name}, partnerName: ${reg.partner?.name}`);
    });

    const players = registrations.map((reg, index) => ({
      id: getPlayerId(reg),
      registrationId: reg.id,
      name: getPlayerName(reg),
      email: getPlayerEmail(reg),
      phone: reg.userId && reg.user ? reg.user.phone : reg.guestPhone,
      seed: index + 1,
      // Doubles partner
      partnerName: reg.partner?.name || reg.guestPartnerName || null,
      partnerId: reg.partnerId || null
    }));

    console.log('🔍 Mapped players:', players);

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
    const userId = req.user.userId || req.user.id;
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
    assignments.forEach(({ slot, playerId, playerName, partnerName }) => {
      playerSlotMap[playerId] = { slot, playerName, partnerName: partnerName || null };
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
      Object.entries(playerSlotMap).forEach(([playerId, { slot, playerName, partnerName }]) => {
        const matchIndex = Math.floor((slot - 1) / 2);
        const playerPosition = (slot - 1) % 2 === 0 ? 'player1' : 'player2';
        if (firstRound.matches[matchIndex]) {
          firstRound.matches[matchIndex][playerPosition] = {
            id: playerId,
            name: playerName,
            seed: slot,
            partnerName: partnerName || null
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
              name: assignment.playerName,
              partnerName: assignment.partnerName || null
            };
          }
          slotCounter++;
        });
      });
      
      // CRITICAL FIX: Regenerate matches with updated participant data
      let globalMatchNumber = 1;
      bracketJson.groups.forEach((group, groupIndex) => {
        console.log(`🔄 Regenerating matches for ${group.groupName}...`);
        console.log(`   Participants:`, group.participants.map(p => `${p.name} (${p.id})`));
        
        // Regenerate all matches for this group with updated participants
        group.matches = generateGroupMatches(group.participants, groupIndex, globalMatchNumber);
        group.totalMatches = group.matches.length;
        
        console.log(`   Generated ${group.matches.length} matches`);
        console.log(`   First match: ${group.matches[0]?.player1?.name} vs ${group.matches[0]?.player2?.name}`);
        console.log(`   Player IDs: ${group.matches[0]?.player1?.id} vs ${group.matches[0]?.player2?.id}`);
        
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
          const hasPlayer1 = match.player1?.id;
          const hasPlayer2 = match.player2?.id;
          
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
            status: (hasPlayer1 && hasPlayer2) ? 'READY' : 'PENDING'
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
      console.log(`📝 Creating Match records for ${bracketJson.groups.length} groups...`);
      for (const group of bracketJson.groups) {
        console.log(`\n   Group ${group.groupName}: ${group.matches.length} matches`);
        for (const match of group.matches) {
          console.log(`      Match ${match.matchNumber}: ${match.player1?.name} (${match.player1?.id}) vs ${match.player2?.name} (${match.player2?.id})`);
          
          // Create match record regardless of whether players are assigned
          // This ensures all matches exist in the database
          matchRecords.push({
            tournamentId,
            categoryId,
            matchNumber: match.matchNumber,
            round: 1, // All Round Robin matches are in round 1
            stage: 'GROUP', // Mark as group stage
            player1Id: match.player1?.id || null,
            player2Id: match.player2?.id || null,
            player1Seed: match.player1?.seed || null,
            player2Seed: match.player2?.seed || null,
            status: (match.player1?.id && match.player2?.id) ? 'READY' : 'PENDING'
          });
        }
      }
      
      console.log(`\n✅ Total Match records to create: ${matchRecords.length}`);
      
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
    
    // Set parent relationships AFTER transaction completes (all matches must exist first)
    if (bracketJson.format === 'KNOCKOUT' || bracketJson.format === 'ROUND_ROBIN_KNOCKOUT') {
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
    const userId = req.user.userId || req.user.id;
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

    // 🔥 CRITICAL FIX: Create Match records immediately when draw is created
    // This ensures matches exist in the database even before players are assigned
    // Previously, matches were only created during player assignment, causing 404 errors
    
    console.log('📝 Creating Match records for draw...');
    
    // Delete any existing matches first
    await prisma.match.deleteMany({
      where: { tournamentId, categoryId }
    });
    
    const matchRecords = [];
    
    if (format === 'KNOCKOUT') {
      // Create match records for all knockout rounds
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
    } else if (format === 'ROUND_ROBIN' || format === 'ROUND_ROBIN_KNOCKOUT') {
      // Create match records for all round robin matches
      for (const group of bracketJson.groups) {
        for (const match of group.matches) {
          matchRecords.push({
            tournamentId,
            categoryId,
            matchNumber: match.matchNumber,
            round: 1,
            stage: 'GROUP',
            player1Id: match.player1?.id || null,
            player2Id: match.player2?.id || null,
            player1Seed: match.player1?.seed || null,
            player2Seed: match.player2?.seed || null,
            status: 'PENDING'
          });
        }
      }
      
      // For ROUND_ROBIN_KNOCKOUT, also create knockout stage matches
      if (format === 'ROUND_ROBIN_KNOCKOUT' && bracketJson.knockout && bracketJson.knockout.rounds) {
        let knockoutMatchNum = bracketJson.groups.reduce((sum, g) => sum + g.matches.length, 1);
        const totalKnockoutRounds = bracketJson.knockout.rounds.length;
        
        for (let roundIdx = 0; roundIdx < bracketJson.knockout.rounds.length; roundIdx++) {
          const round = bracketJson.knockout.rounds[roundIdx];
          const reverseRoundNumber = totalKnockoutRounds - roundIdx;
          
          for (const match of round.matches) {
            matchRecords.push({
              tournamentId,
              categoryId,
              matchNumber: knockoutMatchNum++,
              round: reverseRoundNumber,
              stage: 'KNOCKOUT',
              player1Id: null,
              player2Id: null,
              player1Seed: null,
              player2Seed: null,
              status: 'PENDING'
            });
          }
        }
      }
    }
    
    // Create all matches in one batch
    if (matchRecords.length > 0) {
      await prisma.match.createMany({ data: matchRecords });
      console.log(`✅ Created ${matchRecords.length} Match records`);
    }
    
    // Set parent relationships for knockout matches
    if (format === 'KNOCKOUT' || format === 'ROUND_ROBIN_KNOCKOUT') {
      await setKnockoutParentRelationships(tournamentId, categoryId);
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
  
  // Collect all parentMatchId + winnerPosition updates, then apply in one batch per round
  // (avoids N sequential await calls — critical for Vercel 10s function limit)
  const allUpdates = []; // { id, parentMatchId, winnerPosition }

  for (const currentRound of rounds) {
    if (currentRound === 1) continue; // Final has no parent

    const roundMatches = allMatches.filter(m => m.round === currentRound);
    const parentRound  = currentRound - 1;

    const parentRoundMatches = allMatches
      .filter(m => m.round === parentRound)
      .sort((a, b) => a.matchNumber - b.matchNumber);

    for (let i = 0; i < roundMatches.length; i++) {
      const match       = roundMatches[i];
      const parentMatch = parentRoundMatches[Math.floor(i / 2)];
      if (parentMatch) {
        allUpdates.push({
          id: match.id,
          parentMatchId: parentMatch.id,
          winnerPosition: i % 2 === 0 ? 'player1' : 'player2'
        });
      }
    }
  }

  // Execute updates in chunks of 10 to avoid overwhelming the DB connection pool
  // (100-player knockout = 126 updates; concurrent >10 saturates pool_limit=10)
  const CHUNK = 10;
  for (let i = 0; i < allUpdates.length; i += CHUNK) {
    await Promise.all(
      allUpdates.slice(i, i + CHUNK).map(u =>
        prisma.match.update({
          where: { id: u.id },
          data: { parentMatchId: u.parentMatchId, winnerPosition: u.winnerPosition }
        })
      )
    );
  }

  console.log(`✅ Parent relationships set! (${allUpdates.length} matches linked)`);
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
      groupName: groupIndexToName(g),
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

// Convert group index to letter name: 0→A, 25→Z, 26→AA, 27→AB...
function groupIndexToName(index) {
  let name = '';
  let i = index;
  do {
    name = String.fromCharCode(65 + (i % 26)) + name;
    i = Math.floor(i / 26) - 1;
  } while (i >= 0);
  return name;
}

// Helper: Generate all matches for a group (everyone plays everyone)
function generateGroupMatches(participants, groupIndex, startingMatchNumber = 1) {
  const matches = [];
  let matchNumber = startingMatchNumber;
  const groupName = groupIndexToName(groupIndex);
  
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
    const userId = req.user.userId || req.user.id;
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

    // Parse bracket — wrap in try-catch: corrupted JSON must not crash the endpoint
    let bracketJson;
    try {
      bracketJson = typeof draw.bracketJson === 'string' ? JSON.parse(draw.bracketJson) : draw.bracketJson;
    } catch (parseErr) {
      console.error('❌ bracketJson parse failed — corrupted draw data:', parseErr.message);
      return res.status(500).json({ success: false, error: 'Draw data is corrupted. Please delete and regenerate the draw.' });
    }
    if (!bracketJson || typeof bracketJson !== 'object') {
      return res.status(500).json({ success: false, error: 'Draw data is invalid. Please regenerate the draw.' });
    }

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
      if (!firstRound || !Array.isArray(firstRound.matches)) {
        return res.status(400).json({ success: false, error: 'Bracket has no rounds. Please regenerate the draw.' });
      }
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
            id: getPlayerId(reg),
            name: getPlayerName(reg),
            seed: slotInfo.slot
          };
          
          assignments.push({
            slot: slotInfo.slot,
            playerId: getPlayerId(reg),
            playerName: getPlayerName(reg),
            matchIdx: slotInfo.matchIdx,
            position: slotInfo.position
          });
          
          playerIndex++;
        }
      }

      // Build match records for all rounds
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

      // Delete existing matches and create new ones — wrapped in transaction for atomicity
      await prisma.$transaction(async (tx) => {
        await tx.match.deleteMany({ where: { tournamentId, categoryId } });
        if (matchRecords.length > 0) {
          await tx.match.createMany({ data: matchRecords });
        }
      });

      if (matchRecords.length > 0) {
        // Fetch newly created matches to set parent relationships
        const createdMatches = await prisma.match.findMany({
          where: { tournamentId, categoryId, stage: 'KNOCKOUT' },
          orderBy: [{ round: 'desc' }, { matchNumber: 'asc' }]
        });
        
        // Set parent relationships for knockout bracket
        console.log('🔗 Setting parent match relationships for knockout bracket...');
        const rounds = [...new Set(createdMatches.map(m => m.round))].sort((a, b) => b - a);
        
        for (const currentRound of rounds) {
          if (currentRound === 1) continue; // Skip final (no parent)
          
          const roundMatches = createdMatches.filter(m => m.round === currentRound);
          const parentRound = currentRound - 1;
          const parentRoundMatches = createdMatches.filter(m => m.round === parentRound);
          
          for (let i = 0; i < roundMatches.length; i++) {
            const match = roundMatches[i];
            const parentMatchIndex = Math.floor(i / 2);
            const parentMatch = parentRoundMatches[parentMatchIndex];
            
            if (parentMatch) {
              const winnerPosition = i % 2 === 0 ? 'player1' : 'player2';
              await prisma.match.update({
                where: { id: match.id },
                data: { parentMatchId: parentMatch.id, winnerPosition }
              });
              console.log(`  ✓ Match ${match.matchNumber} (Round ${match.round}) → Parent: Match ${parentMatch.matchNumber} (Round ${parentMatch.round}) as ${winnerPosition}`);
            }
          }
        }
        console.log('✅ Parent relationships set for knockout bracket');
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
              id: getPlayerId(reg),
              name: getPlayerName(reg),
              seed: slotNum,
              played: 0,
              wins: 0,
              losses: 0,
              points: 0
            };
            assignments.push({
              slot: slotNum,
              playerId: getPlayerId(reg),
              playerName: getPlayerName(reg)
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

      // Create database Match records atomically — delete + re-create in one transaction
      const matchRecords = [];
      for (const group of bracketJson.groups) {
        for (const match of group.matches) {
          if (match.player1?.id && match.player2?.id) {
            matchRecords.push({
              tournamentId,
              categoryId,
              matchNumber: match.matchNumber,
              round: 1,
              stage: 'GROUP',
              player1Id: match.player1.id,
              player2Id: match.player2.id,
              player1Seed: match.player1.seed,
              player2Seed: match.player2.seed,
              status: 'PENDING'
            });
          }
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.match.deleteMany({ where: { tournamentId, categoryId } });
        if (matchRecords.length > 0) {
          await tx.match.createMany({ data: matchRecords });
        }
      });
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
    const userId = req.user.userId || req.user.id;
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

      // Fisher-Yates shuffle for truly random draw order
      const shuffledPlayers = [...assignedPlayers];
      for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
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

      // Fisher-Yates shuffle — truly random (matches KNOCKOUT format shuffle)
      const shuffledPlayers = [...assignedPlayers];
      for (let i = shuffledPlayers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
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

      // Batch create all match records with createMany (avoids N sequential round-trips)
      const matchRecords = [];
      for (const group of bracketJson.groups) {
        for (const match of group.matches) {
          if (match.player1?.id && match.player2?.id) {
            matchRecords.push({
              tournamentId,
              categoryId,
              matchNumber: match.matchNumber,
              round: 1,
              player1Id: match.player1.id,
              player2Id: match.player2.id,
              player1Seed: match.player1.seed ?? null,
              player2Seed: match.player2.seed ?? null,
              status: 'PENDING'
            });
          }
        }
      }
      if (matchRecords.length > 0) {
        await prisma.match.createMany({ data: matchRecords });
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
    const userId = req.user.userId || req.user.id;

    if (!Array.isArray(knockoutSlots) || knockoutSlots.length === 0) {
      return res.status(400).json({ success: false, error: 'knockoutSlots must be a non-empty array' });
    }

    console.log('🎯 Arranging knockout matchups for', knockoutSlots.length, 'slots');

    // Verify tournament ownership (organizer or admin)
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    const userRoles = req.user.roles || [];
    const isAdmin = userRoles.includes('ADMIN');
    if (!tournament || (tournament.organizerId !== userId && !isAdmin)) {
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
          firstRound[index].player2 = slot.player2 || null;
          // Bye match: player2 absent → player1 auto-advances (pre-completed)
          if (slot.player1 && !slot.player2) {
            firstRound[index].status = 'COMPLETED';
            firstRound[index].winner = 1;
            firstRound[index].winnerId = slot.player1.id;
            console.log(`   Match ${index + 1}: ${slot.player1.name} vs BYE → ${slot.player1.name} auto-advances`);
          } else {
            firstRound[index].status = 'PENDING';
            console.log(`   Match ${index + 1}: ${slot.player1?.name || 'TBD'} vs ${slot.player2?.name || 'TBD'}`);
          }
        }
      });

      // Cascade bye winners into subsequent rounds in bracketJson
      for (let ri = 1; ri < bracketJson.knockout.rounds.length; ri++) {
        const round = bracketJson.knockout.rounds[ri];
        const feederRound = bracketJson.knockout.rounds[ri - 1];
        if (!Array.isArray(round?.matches) || !Array.isArray(feederRound?.matches)) continue;
        round.matches.forEach((match, mi) => {
          if (!match.player1) {
            const feeder = feederRound.matches[mi * 2];
            if (feeder?.status === 'COMPLETED') {
              match.player1 = feeder.winner === 1 ? feeder.player1 : feeder.player2;
            }
          }
          if (!match.player2) {
            const feeder = feederRound.matches[mi * 2 + 1];
            if (feeder?.status === 'COMPLETED') {
              match.player2 = feeder.winner === 1 ? feeder.player1 : feeder.player2;
            }
          }
        });
      }
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
      
      // IMMEDIATELY set parent relationships after creating matches
      console.log('🔗 Setting parent match relationships for newly created knockout matches...');
      const rounds = [...new Set(knockoutMatches.map(m => m.round))].sort((a, b) => b - a);
      
      for (const currentRound of rounds) {
        if (currentRound === 1) continue; // Skip final (no parent)
        
        const roundMatches = knockoutMatches.filter(m => m.round === currentRound);
        const parentRound = currentRound - 1;
        const parentRoundMatches = knockoutMatches.filter(m => m.round === parentRound);
        
        for (let i = 0; i < roundMatches.length; i++) {
          const match = roundMatches[i];
          const parentMatchIndex = Math.floor(i / 2);
          const parentMatch = parentRoundMatches[parentMatchIndex];
          
          if (parentMatch) {
            const winnerPosition = i % 2 === 0 ? 'player1' : 'player2';
            await prisma.match.update({
              where: { id: match.id },
              data: { parentMatchId: parentMatch.id, winnerPosition }
            });
            console.log(`  ✓ Match ${match.matchNumber} (Round ${match.round}) → Parent: Match ${parentMatch.matchNumber} (Round ${parentMatch.round}) as ${winnerPosition}`);
          }
        }
      }
      console.log('✅ Parent relationships set for newly created matches');
      
      // Refetch to get updated data
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

    // STEP 7: Reset all knockout match player assignments in ONE query (preserve parentMatchId/winnerPosition)
    console.log('🧹 Resetting knockout match player assignments');
    await prisma.match.updateMany({
      where: { tournamentId, categoryId, stage: 'KNOCKOUT' },
      data: {
        player1Id: null,
        player2Id: null,
        status: 'PENDING',
        winnerId: null,
        scoreJson: null,
        startedAt: null,
        completedAt: null,
        umpireId: null
      }
    });

    // STEP 8: Assign players to first-round matches in ONE transaction
    const maxRound = Math.max(...knockoutMatches.map(m => m.round));
    const firstRoundMatches = knockoutMatches.filter(m => m.round === maxRound);

    console.log(`🎯 Assigning ${knockoutSlots.length} slots to first round (Round ${maxRound})`);

    await prisma.$transaction(
      knockoutSlots
        .slice(0, firstRoundMatches.length)
        .map((slot, i) => {
          const isBye = slot.player1 && !slot.player2;
          if (isBye) console.log(`   Slot ${i + 1}: ${slot.player1.name} vs BYE → auto-advance`);
          else console.log(`   Slot ${i + 1}: ${slot.player1?.name || 'TBD'} vs ${slot.player2?.name || 'TBD'}`);
          return prisma.match.update({
            where: { id: firstRoundMatches[i].id },
            data: {
              player1Id: slot.player1?.id || null,
              player2Id: slot.player2?.id || null,
              status: isBye ? 'COMPLETED' : 'PENDING',
              winnerId: isBye ? slot.player1.id : null,
              completedAt: isBye ? new Date() : null
            }
          });
        })
    );

    // STEP 9: Parent relationships — already set when matches were first created.
    // No need to re-set on re-arrange (bracket structure doesn't change, only players do).
    console.log('✅ Knockout draw arranged successfully!');

    res.json({
      success: true,
      message: 'Knockout matchups arranged successfully'
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
    const userId = req.user.userId || req.user.id;

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

    // Get player details — handle both real users and guest players (IDs starting with "guest-")
    const regularIds = selectedPlayerIds.filter(id => !String(id).startsWith('guest-'));
    const guestIds   = selectedPlayerIds.filter(id =>  String(id).startsWith('guest-'));

    const [regularPlayers, guestRegistrations] = await Promise.all([
      regularIds.length > 0
        ? prisma.user.findMany({ where: { id: { in: regularIds } }, select: { id: true, name: true } })
        : Promise.resolve([]),
      guestIds.length > 0
        ? prisma.registration.findMany({
            where: { id: { in: guestIds.map(id => id.replace('guest-', '')) } },
            select: { id: true, guestName: true }
          })
        : Promise.resolve([])
    ]);

    const guestPlayers = guestRegistrations.map(r => ({ id: `guest-${r.id}`, name: r.guestName || 'Guest' }));
    const players = [...regularPlayers, ...guestPlayers];

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
    // Include null-stage matches for backwards compatibility (created before stage field was added)
    const totalGroupMatchNums = bracketJson.groups?.reduce((s, g) => s + (g.matches?.length || 0), 0) || 0;
    const knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        OR: [
          { stage: 'KNOCKOUT' },
          { stage: null, matchNumber: { gt: totalGroupMatchNums } }
        ]
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
          scoreJson: null,
          startedAt: null,
          completedAt: null,
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

    // Re-establish parent relationships — ensures winner advancement works in /end handler
    await setKnockoutParentRelationships(tournamentId, categoryId);

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

/**
 * Repair knockout parent relationships AND advance winners from already-completed matches.
 * POST /api/tournaments/:tournamentId/categories/:categoryId/draw/repair-knockout
 * Fixes draws where parentMatchId was never set (index-based bug).
 */
const repairKnockoutRelationships = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.id || req.user.userId;

    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) return res.status(404).json({ success: false, error: 'Tournament not found' });
    if (tournament.organizerId !== userId && !req.user.roles?.includes('ADMIN')) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Step 1: Fix parent relationships
    await setKnockoutParentRelationships(tournamentId, categoryId);

    // Step 2: Advance winners from already-completed knockout matches
    const completedKnockoutMatches = await prisma.match.findMany({
      where: { tournamentId, categoryId, stage: 'KNOCKOUT', status: 'COMPLETED', winnerId: { not: null } },
      include: { parentMatch: true },
      orderBy: { round: 'desc' } // process highest rounds first (early rounds)
    });

    let advancedCount = 0;
    for (const match of completedKnockoutMatches) {
      if (!match.parentMatchId) continue;

      const parentMatch = await prisma.match.findUnique({ where: { id: match.parentMatchId } });
      if (!parentMatch) continue;

      const winnerPos = match.winnerPosition;
      if (!winnerPos) continue;

      // Only update if the slot is still empty (don't overwrite existing assignment)
      if (winnerPos === 'player1' && parentMatch.player1Id) continue;
      if (winnerPos === 'player2' && parentMatch.player2Id) continue;

      const updateData = winnerPos === 'player1'
        ? { player1Id: match.winnerId }
        : { player2Id: match.winnerId };

      // Set READY if both players now filled
      const otherSlotFilled = winnerPos === 'player1' ? !!parentMatch.player2Id : !!parentMatch.player1Id;
      if (otherSlotFilled) updateData.status = 'READY';

      await prisma.match.update({ where: { id: parentMatch.id }, data: updateData });
      advancedCount++;
    }

    res.json({
      success: true,
      message: `Knockout bracket repaired. Parent relationships fixed. ${advancedCount} winner(s) advanced.`,
      advancedCount
    });
  } catch (error) {
    console.error('Repair knockout relationships error:', error);
    res.status(500).json({ success: false, error: 'Failed to repair relationships' });
  }
};

export {
  generateDraw,
  getDraw,
  deleteDraw,
  restartDraw,
  createConfiguredDraw,
  getCategoryPlayers,
  assignPlayersToDraw,
  bulkAssignAllPlayers,
  shuffleAssignedPlayers,
  arrangeKnockoutMatchups,
  continueToKnockout,
  repairKnockoutRelationships
};
