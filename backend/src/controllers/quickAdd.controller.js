import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import { createNotification } from '../services/notification.service.js';

// POST /api/admin/tournaments/:tournamentId/quick-add-player
export const quickAddPlayer = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { name, email, phone, categoryId, gender } = req.body;
    const adminId = req.user.id;

    console.log('🎯 Quick Add Player Request:', { tournamentId, name, email, categoryId });

    // Validate required fields
    if (!name || !email || !phone || !categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, phone, and category are required'
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

    // ADMIN OVERRIDE: Quick Add bypasses max participants limit
    // Admin can add unlimited players regardless of category maxParticipants
    console.log(`✅ Category found: ${category.name}, Current registrations: ${category.registrationCount || 0}, Max: ${category.maxParticipants || 'Unlimited'}`);
    console.log('✅ Admin Quick Add - Bypassing all limits');

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email }
    });

    // If user doesn't exist, create a temporary account
    if (!user) {
      console.log('📝 Creating new user account...');
      const defaultPassword = await bcrypt.hash('QuickAdd@123', 10);
      
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password: defaultPassword,
          roles: 'PLAYER',
          isVerified: true,
          isActive: true,
          gender: gender || 'Male',
          country: 'India',
          city: 'Test City',
          state: 'Test State'
        }
      });

      // Create player profile
      await prisma.playerProfile.create({
        data: {
          userId: user.id,
          matchifyPoints: 0,
          tournamentsPlayed: 0,
          matchesWon: 0,
          matchesLost: 0
        }
      });
      console.log('✅ New user created:', user.email);
    } else {
      console.log('✅ Existing user found:', user.email);
    }

    // Check if already registered in this category
    const existingRegistration = await prisma.registration.findUnique({
      where: {
        userId_categoryId: {
          userId: user.id,
          categoryId: categoryId
        }
      }
    });

    if (existingRegistration) {
      console.log('❌ User already registered in this category');
      return res.status(400).json({
        success: false,
        error: 'Player is already registered in this category'
      });
    }

    console.log('📝 Creating registration...');
    // Create registration with quick-added flag
    const registration = await prisma.registration.create({
      data: {
        userId: user.id,
        tournamentId: tournamentId,
        categoryId: categoryId,
        amountTotal: 0,
        amountWallet: 0,
        amountRazorpay: 0,
        status: 'confirmed',
        paymentStatus: 'quick_added',
        isQuickAdded: true,
        quickAddedBy: adminId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            gender: true
          }
        },
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

    // Send notification to the player
    await createNotification({
      userId: user.id,
      type: 'QUICK_ADDED',
      title: 'Added to Tournament',
      message: `You have been added to ${tournament.name} - ${category.name} category by admin`,
      data: JSON.stringify({
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        categoryId: category.id,
        categoryName: category.name
      })
    });
    console.log('✅ Notification sent');

    console.log('🎉 Quick Add completed successfully!');
    res.json({
      success: true,
      message: 'Player added successfully',
      registration,
      userCreated: !existingRegistration
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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            gender: true
          }
        },
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

    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    console.error('Get quick added players error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quick added players'
    });
  }
};
