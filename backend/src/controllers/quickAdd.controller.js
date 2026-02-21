import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { createNotification } from '../services/notification.service.js';

// POST /api/admin/tournaments/:tournamentId/quick-add-player
export const quickAddPlayer = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { name, categoryId } = req.body;
    const adminId = req.user.id;

    console.log('🎯 Quick Add Player Request:', { tournamentId, name, categoryId });

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

    console.log('📝 Creating guest registration with name only...');
    
    // Create guest registration with ONLY name
    const registration = await prisma.registration.create({
      data: {
        userId: null, // No user account
        tournamentId: tournamentId,
        categoryId: categoryId,
        guestName: name, // Only store the name
        guestEmail: null, // No email
        guestPhone: null, // No phone
        guestGender: null, // No gender
        amountTotal: 0,
        amountWallet: 0,
        amountRazorpay: 0,
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

    console.log('🎉 Quick Add completed successfully!');
    res.json({
      success: true,
      message: 'Player added successfully',
      registration: {
        ...registration,
        displayName: name,
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
