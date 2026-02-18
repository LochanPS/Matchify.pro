import prisma from '../lib/prisma.js';

/**
 * Auto-verification service for players and umpires
 * Organizers require manual admin approval
 */

// Check and update player verification status
export const checkPlayerVerification = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isVerifiedPlayer: true,
        tournamentsRegistered: true
      }
    });

    if (!user) return false;

    // Already verified
    if (user.isVerifiedPlayer) return true;

    // Check if user has 12+ tournament registrations
    if (user.tournamentsRegistered >= 12) {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerifiedPlayer: true }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'VERIFICATION_ACHIEVED',
          title: '🎉 You\'re Now a Verified Player!',
          message: 'Congratulations! You\'ve been automatically verified after participating in 12+ tournaments. Your profile now has a blue verification badge.',
          read: false
        }
      });

      console.log(`✅ Player ${userId} auto-verified (12+ tournaments)`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking player verification:', error);
    return false;
  }
};

// Check and update umpire verification status
export const checkUmpireVerification = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        isVerifiedUmpire: true,
        matchesUmpired: true
      }
    });

    if (!user) return false;

    // Already verified
    if (user.isVerifiedUmpire) return true;

    // Check if user has 10+ matches umpired
    if (user.matchesUmpired >= 10) {
      await prisma.user.update({
        where: { id: userId },
        data: { isVerifiedUmpire: true }
      });

      // Create notification
      await prisma.notification.create({
        data: {
          userId: userId,
          type: 'VERIFICATION_ACHIEVED',
          title: '🎉 You\'re Now a Verified Umpire!',
          message: 'Congratulations! You\'ve been automatically verified after umpiring 10+ matches. Your profile now has a purple verification badge.',
          read: false
        }
      });

      console.log(`✅ Umpire ${userId} auto-verified (10+ matches)`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error checking umpire verification:', error);
    return false;
  }
};

// Increment tournament registration count and check verification
export const incrementTournamentRegistration = async (userId) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        tournamentsRegistered: {
          increment: 1
        }
      }
    });

    // Check if user should be verified
    await checkPlayerVerification(userId);
  } catch (error) {
    console.error('Error incrementing tournament registration:', error);
  }
};

// Increment matches umpired count and check verification
export const incrementMatchesUmpired = async (userId) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        matchesUmpired: {
          increment: 1
        }
      }
    });

    // Check if user should be verified
    await checkUmpireVerification(userId);
  } catch (error) {
    console.error('Error incrementing matches umpired:', error);
  }
};

// Get verification status for a user
export const getVerificationStatus = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isVerifiedPlayer: true,
        isVerifiedOrganizer: true,
        isVerifiedUmpire: true,
        tournamentsRegistered: true,
        matchesUmpired: true
      }
    });

    if (!user) return null;

    return {
      player: {
        isVerified: user.isVerifiedPlayer,
        progress: user.tournamentsRegistered,
        required: 12,
        percentage: Math.min((user.tournamentsRegistered / 12) * 100, 100)
      },
      organizer: {
        isVerified: user.isVerifiedOrganizer,
        requiresAdminApproval: true
      },
      umpire: {
        isVerified: user.isVerifiedUmpire,
        progress: user.matchesUmpired,
        required: 10,
        percentage: Math.min((user.matchesUmpired / 10) * 100, 100)
      }
    };
  } catch (error) {
    console.error('Error getting verification status:', error);
    return null;
  }
};

export default {
  checkPlayerVerification,
  checkUmpireVerification,
  incrementTournamentRegistration,
  incrementMatchesUmpired,
  getVerificationStatus
};
