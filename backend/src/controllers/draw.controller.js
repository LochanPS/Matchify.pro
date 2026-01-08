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
        bracket: JSON.parse(draw.bracketJson),
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

export {
  generateDraw,
  getDraw,
  deleteDraw
};
