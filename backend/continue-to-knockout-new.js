/**
 * Continue to Knockout Stage - Creates EMPTY knockout bracket
 * Organizer will manually assign players later
 * POST /api/tournaments/:tournamentId/categories/:categoryId/draw/continue-to-knockout
 */
const continueToKnockout = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;
    const userId = req.user.id;

    console.log('🎯 Continue to Knockout - Creating EMPTY knockout bracket...');

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

    // Check if all Round Robin matches are completed
    const roundRobinMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        stage: 'GROUP'
      }
    });

    const allRoundRobinComplete = roundRobinMatches.every(m => m.status === 'COMPLETED');
    if (!allRoundRobinComplete) {
      return res.status(400).json({ 
        success: false, 
        error: 'All Round Robin matches must be completed before continuing to knockout stage' 
      });
    }

    console.log('✅ All Round Robin matches completed');

    const groups = bracketJson.groups || [];
    const advanceFromGroup = bracketJson.advanceFromGroup || 2;
    
    console.log(`📊 Processing ${groups.length} groups, ${advanceFromGroup} will advance from each`);

    // Calculate standings for each group (for organizer reference)
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const group = groups[groupIndex];
      const groupMatches = roundRobinMatches.filter(m => m.groupIndex === groupIndex);
      
      // Initialize standings
      const standings = {};
      group.participants.forEach(p => {
        if (p && p.id) {
          standings[p.id] = {
            playerId: p.id,
            playerName: p.name,
            wins: 0,
            losses: 0,
            points: 0
          };
        }
      });

      // Calculate wins/losses/points from matches
      groupMatches.forEach(match => {
        if (match.status === 'COMPLETED' && match.winnerId) {
          const winner = match.winnerId;
          const loser = match.player1Id === winner ? match.player2Id : match.player1Id;
          
          if (standings[winner]) {
            standings[winner].wins++;
            standings[winner].points += 2; // Win = 2 points
          }
          if (standings[loser]) {
            standings[loser].losses++;
          }
        }
      });

      // Convert to array and sort by points
      group.standings = Object.values(standings)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.wins !== a.wins) return b.wins - a.wins;
          return a.losses - b.losses;
        });

      console.log(`📋 Group ${String.fromCharCode(65 + groupIndex)} standings calculated (for organizer reference)`);
    }

    // IMPORTANT: Keep knockout bracket EMPTY - organizer will assign players manually
    if (bracketJson.knockout && bracketJson.knockout.rounds && bracketJson.knockout.rounds[0] && bracketJson.knockout.rounds[0].matches) {
      const firstRound = bracketJson.knockout.rounds[0].matches;
      
      // Clear all players from knockout bracket
      firstRound.forEach((match) => {
        match.player1 = null;
        match.player2 = null;
        match.score1 = null;
        match.score2 = null;
        match.winner = null;
      });
      
      console.log('✅ Knockout bracket cleared - ready for manual assignment');
    }

    // Save updated bracket with standings
    const updatedDraw = await prisma.draw.update({
      where: { id: draw.id },
      data: { bracketJson: JSON.stringify(bracketJson) }
    });

    // Reset ALL knockout matches in database to PENDING with NO players
    const knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId,
        categoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: { matchNumber: 'asc' }
    });

    console.log(`📝 Resetting ${knockoutMatches.length} knockout match records to EMPTY`);

    // Reset all knockout matches to PENDING with no players
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

    console.log('✅ Knockout stage ready! Organizer can now manually assign players.');

    res.json({
      success: true,
      message: 'Knockout stage is ready! You can now manually assign qualified players to knockout matches using the "Arrange Knockout Matchups" button.',
      draw: { ...updatedDraw, bracketJson },
      standingsCalculated: true,
      readyForManualAssignment: true
    });
  } catch (error) {
    console.error('❌ Continue to knockout error:', error);
    res.status(500).json({ success: false, error: 'Failed to continue to knockout stage' });
  }
};
