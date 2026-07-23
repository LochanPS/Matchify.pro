import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { createNotification } from '../services/notification.service.js';
import { createOrUpdateTournamentPayment } from '../services/paymentTrackingService.js';
import { isTeamSport } from '../config/sports.js';

// POST /api/admin/tournaments/:tournamentId/quick-add-player
export const quickAddPlayer = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { name, player2Name, categoryId, teamName, roster } = req.body;
    const userId = req.user.userId || req.user.id;

    console.log('🎯 Quick Add Player Request:', { tournamentId, name, player2Name, teamName, categoryId });

    // Category is always required. The NAME requirement differs by sport, so it
    // is checked below once the tournament (and therefore the sport) is known:
    // racket sports need a player name, team sports need a team name.
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        error: 'Category is required'
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

    // Authorization: a platform admin OR the organizer who owns THIS tournament.
    // (Organizers can only add players to their own tournaments — never anyone else's.)
    const userRoles = req.user.roles || (req.user.role ? [req.user.role] : []);
    const isAdmin = userRoles.includes('ADMIN');
    const isOwner = tournament.organizerId === userId;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: "Only an admin or this tournament's organizer can add players"
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

    // Team sports (basketball) add a TEAM, not a player. The team name is
    // required — it is what appears in the draw, the scoreboard and the
    // standings. The roster is optional here: an organizer adding eight teams
    // at the desk needs to be fast, and a match can still be scored team-only.
    // When a roster IS given it is cleaned to the same shape the public
    // registration form produces, so both paths are identical downstream.
    const teamSport = isTeamSport(tournament.sport);
    let cleanRoster = null;
    let displayName;

    if (teamSport) {
      const tName = (teamName || '').trim();
      if (!tName) {
        return res.status(400).json({
          success: false,
          error: 'Team name is required'
        });
      }
      if (Array.isArray(roster)) {
        const cleaned = roster
          .filter(p => (p?.name || '').trim())
          .map(p => ({
            name: String(p.name).trim(),
            jersey: (p.jersey == null ? '' : String(p.jersey)).trim(),
            starter: !!p.starter,
          }));
        if (cleaned.length) cleanRoster = cleaned;
      }
      displayName = tName;
    } else {
      // Racket sports: unchanged behaviour.
      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Name and category are required'
        });
      }
      // For doubles, validate that player2Name is provided
      if (category.format === 'doubles' && !player2Name) {
        return res.status(400).json({
          success: false,
          error: 'Player 2 name is required for doubles category'
        });
      }
      // Construct the display name based on category format
      displayName = category.format === 'doubles'
        ? `${name} / ${player2Name}`
        : name;
    }

    console.log(`📝 Creating guest registration: ${displayName}...`);
    
    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create guest registration with entry fee
      const registration = await tx.registration.create({
        data: {
          userId: null, // No user account
          tournamentId: tournamentId,
          categoryId: categoryId,
          guestName: displayName, // Combined name for doubles, single name for singles, team name for team sports
          guestEmail: null, // No email
          guestPhone: null, // No phone
          guestGender: null, // No gender
          // Team sports only — null for racket sports, exactly as before.
          teamName: teamSport ? displayName : null,
          roster: teamSport ? cleanRoster : null,
          amountTotal: category.entryFee, // Include entry fee for revenue calculation
          amountWallet: 0,
          amountRazorpay: category.entryFee, // Assume admin payment method
          status: 'confirmed',
          paymentStatus: 'quick_added',
          isQuickAdded: true,
          quickAddedBy: userId
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

      // Update category registration count
      await tx.category.update({
        where: { id: categoryId },
        data: {
          registrationCount: {
            increment: 1
          }
        }
      });

      return registration;
    });
    
    console.log('✅ Registration created successfully');
    console.log('✅ Category registration count updated');

    // Update tournament payment totals to include this registration's entry fee
    await createOrUpdateTournamentPayment(tournamentId);
    console.log('✅ Tournament payment totals updated');

    console.log('🎉 Quick Add completed successfully!');
    res.json({
      success: true,
      message: (teamSport || category.format === 'doubles')
        ? 'Team added successfully'
        : 'Player added successfully',
      registration: {
        ...result,
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
