import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { createNotification } from '../services/notification.service.js';
import { createOrUpdateTournamentPayment } from '../services/paymentTrackingService.js';

// POST /api/admin/tournaments/:tournamentId/quick-add-player
export const quickAddPlayer = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { name, player2Name, categoryId } = req.body;
    const adminId = req.user.id;

    console.log('🎯 Quick Add Player Request:', { tournamentId, name, player2Name, categoryId });

    // Validate required fields - ONLY name and category
    if (!name || !categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Name and category are required'
      });
    }

    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        categories: true
      }
    });

    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    // Verify category exists and belongs to tournament
    const category = tournament.categories.find(c => c.id === categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found in this tournament'
      });
    }

    console.log(`✅ Category found: ${category.name}, Current registrations: ${category.registrationCount || 0}, Max: ${category.maxParticipants || 'Unlimited'}`);
    console.log('✅ Admin Quick Add - Bypassing all limits');

    // For doubles, validate that player2Name is provided
    if (category.format === 'doubles' && !player2Name) {
      return res.status(400).json({
        success: false,
        error: 'Player 2 name is required for doubles category'
      });
    }

    // Construct the display name based on category format
    const displayName = category.format === 'doubles' 
      ? `${name} / ${player2Name}` 
      : name;

    console.log(`📝 Creating guest registration: ${displayName}...`);
    
    // Create guest registration with ONLY name (or combined names for doubles)
    const registration = await prisma.registration.create({
      data: {
        userId: null, // No user account
        tournamentId: tournamentId,
        categoryId: categoryId,
        guestName: displayName, // Store combined name for doubles, single name for singles
        guestEmail: null, // No email
        guestPhone: null, // No phone
        guestGender: null, // No gender
        amountTotal: category.entryFee, // Include entry fee for revenue calculation
        amountWallet: 0,
        amountRazorpay: category.entryFee, // Assume admin payment method
        status: 'confirmed',
        paymentStatus: 'quick_added',
        isQuickAdded: true,
        quickAddedBy: adminId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            format: true,
            gender: true
          }
        }
      }
    });
    console.log('✅ Registration created successfully');

    // Update category registration count
    await prisma.category.update({
      where: { id: categoryId },
      data: {
        registrationCount: {
          increment: 1
        }
      }
    });
    console.log('✅ Category registration count updated');

    // Update tournament payment totals to include this registration's entry fee
    await createOrUpdateTournamentPayment(tournamentId);
    console.log('✅ Tournament payment totals updated');

    console.log('🎉 Quick Add completed successfully!');
    res.json({
      success: true,
      message: category.format === 'doubles' 
        ? 'Team added successfully' 
        : 'Player added successfully',
      registration: {
        ...registration,
        displayName: displayName,
        isGuest: true
      }
    });
  } catch (error) {
    console.error('❌ Quick add player error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: 'Failed to add player: ' + error.message
    });
  }
};

// GET /api/admin/tournaments/:tournamentId/quick-added-players
export const getQuickAddedPlayers = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId,
        isQuickAdded: true
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            format: true,
            gender: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Format response - only show name
    const formattedRegistrations = registrations.map(reg => ({
      ...reg,
      displayName: reg.guestName, // Only name is stored
      isGuest: true
    }));

    res.json({
      success: true,
      count: formattedRegistrations.length,
      registrations: formattedRegistrations
    });
  } catch (error) {
    console.error('Get quick added players error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quick added players'
    });
  }
};
