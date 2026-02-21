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
    console.log(`✅ Category found: ${category.name}, Current registrations: ${category.registrationCount || 0}, Max: ${category.maxParticipants || 'Unlimited'}`);
    console.log('✅ Admin Quick Add - Bypassing all limits');

    // Check if user exists with this email
    let user = await prisma.user.findUnique({
      where: { email }
    });

    let userId = null;
    let isGuestRegistration = false;

    if (user) {
      // User exists - use their account
      console.log('✅ Existing user found:', user.email);
      userId = user.id;

      // Check if already registered in this category
      const existingRegistration = await prisma.registration.findFirst({
        where: {
          userId: user.id,
          categoryId: categoryId
        }
      });

      if (existingRegistration) {
        console.log('❌ User already registered in this category');
        return res.status(400).json({
          success: false,
          error: 'Player is already registered in this category'
        });
      }
    } else {
      // User doesn't exist - create guest registration (NO user account)
      console.log('📝 Creating guest registration (no user account)...');
      isGuestRegistration = true;

      // Check if guest with same email already registered in this category
      const existingGuestRegistration = await prisma.registration.findFirst({
        where: {
          guestEmail: email,
          categoryId: categoryId
        }
      });

      if (existingGuestRegistration) {
        console.log('❌ Guest already registered in this category');
        return res.status(400).json({
          success: false,
          error: 'Player is already registered in this category'
        });
      }
    }

    console.log('📝 Creating registration...');
    // Create registration
    const registrationData = {
      tournamentId: tournamentId,
      categoryId: categoryId,
      amountTotal: 0,
      amountWallet: 0,
      amountRazorpay: 0,
      status: 'confirmed',
      paymentStatus: 'quick_added',
      isQuickAdded: true,
      quickAddedBy: adminId
    };

    if (isGuestRegistration) {
      // Guest registration - no userId
      registrationData.userId = null;
      registrationData.guestName = name;
      registrationData.guestEmail = email;
      registrationData.guestPhone = phone;
      registrationData.guestGender = gender || 'Male';
    } else {
      // User registration
      registrationData.userId = userId;
    }

    const registration = await prisma.registration.create({
      data: registrationData,
      include: {
        user: user ? {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            gender: true
          }
        } : undefined,
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

    // Send notification only if user exists
    if (user) {
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
    } else {
      console.log('ℹ️ Guest registration - no notification sent');
    }

    console.log('🎉 Quick Add completed successfully!');
    res.json({
      success: true,
      message: isGuestRegistration 
        ? 'Guest player added successfully (no account created)' 
        : 'Player added successfully',
      registration: {
        ...registration,
        // Add guest info to response for display
        displayName: isGuestRegistration ? name : registration.user?.name,
        displayEmail: isGuestRegistration ? email : registration.user?.email,
        displayPhone: isGuestRegistration ? phone : registration.user?.phone,
        displayGender: isGuestRegistration ? (gender || 'Male') : registration.user?.gender,
        isGuest: isGuestRegistration
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

    // Format response to include guest info
    const formattedRegistrations = registrations.map(reg => ({
      ...reg,
      displayName: reg.userId ? reg.user?.name : reg.guestName,
      displayEmail: reg.userId ? reg.user?.email : reg.guestEmail,
      displayPhone: reg.userId ? reg.user?.phone : reg.guestPhone,
      displayGender: reg.userId ? reg.user?.gender : reg.guestGender,
      isGuest: !reg.userId
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
