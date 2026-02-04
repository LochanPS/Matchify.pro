import express from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';

const router = express.Router();

// Special password for delete all data
const DELETE_PASSWORD = 'Pradyu@123(123)';

// Test endpoint to verify route is working
router.get('/delete-all-info/test', (req, res) => {
  res.json({
    success: true,
    message: 'Delete all data route is working!',
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/admin/delete-all-info
 * Delete all data and reset everything to zero
 * Requires admin authentication + special password
 */
router.post('/delete-all-info', async (req, res) => {
  try {
    const { password } = req.body;

    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const token = authHeader.substring(7);

    // Verify token (basic check - just decode it)
    let decoded;
    try {
      const jwt = await import('jsonwebtoken');
      decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    console.log('🔍 Delete all data request from:', {
      userId: decoded.userId,
      email: decoded.email
    });

    // Verify special password (this is the main security check)
    if (password !== DELETE_PASSWORD) {
      console.log('❌ Invalid password provided');
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    console.log('🗑️  DELETE ALL DATA initiated by:', decoded.email);

    // Delete all data in correct order (respecting foreign key constraints)
    const deletionResults = {};

    // 1. Delete match-related data
    deletionResults.matchScores = await prisma.match.deleteMany({});
    
    // 2. Delete draws
    deletionResults.draws = await prisma.draw.deleteMany({});
    
    // 3. Delete registrations
    deletionResults.registrations = await prisma.registration.deleteMany({});
    
    // 4. Delete payment verifications
    deletionResults.paymentVerifications = await prisma.paymentVerification.deleteMany({});
    
    // 5. Delete categories
    deletionResults.categories = await prisma.category.deleteMany({});
    
    // 6. Delete tournament payments
    deletionResults.tournamentPayments = await prisma.tournamentPayment.deleteMany({});
    
    // 7. Delete tournament posters
    deletionResults.tournamentPosters = await prisma.tournamentPoster.deleteMany({});
    
    // 8. Delete tournament umpires
    deletionResults.tournamentUmpires = await prisma.tournamentUmpire.deleteMany({});
    
    // 9. Delete tournaments
    deletionResults.tournaments = await prisma.tournament.deleteMany({});
    
    // 10. Delete wallet transactions
    deletionResults.walletTransactions = await prisma.walletTransaction.deleteMany({});
    
    // 11. Delete notifications
    deletionResults.notifications = await prisma.notification.deleteMany({});
    
    // 12. Delete score correction requests
    deletionResults.scoreCorrectionRequests = await prisma.scoreCorrectionRequest.deleteMany({});
    
    // 15. Delete SMS logs
    deletionResults.smsLogs = await prisma.smsLog.deleteMany({});
    
    // 16. Delete audit logs
    deletionResults.auditLogs = await prisma.auditLog.deleteMany({});
    
    // 17. Delete academies
    deletionResults.academies = await prisma.academy.deleteMany({});
    
    // 18. Delete organizer KYC submissions
    deletionResults.organizerKYC = await prisma.organizerKYC.deleteMany({});
    
    // 19. Delete organizer requests
    deletionResults.organizerRequests = await prisma.organizerRequest.deleteMany({});
    
    // 20. Delete admin invites
    deletionResults.adminInvites = await prisma.adminInvite.deleteMany({});
    
    // 21. Delete super admin invites
    deletionResults.superAdminInvites = await prisma.superAdminInvite.deleteMany({});
    
    // 22. Delete super admin invite usage
    deletionResults.superAdminInviteUsage = await prisma.superAdminInviteUsage.deleteMany({});
    
    
    // 23. Reset all users' wallet balances and credits to 0 (except admin)
    const adminEmail = 'ADMIN@gmail.com';
    deletionResults.usersReset = await prisma.user.updateMany({
      where: {
        email: { not: adminEmail }
      },
      data: {
        walletBalance: 0,
        totalPoints: 0,
        tournamentsPlayed: 0,
        tournamentsRegistered: 0,
        matchesWon: 0,
        matchesLost: 0,
        matchesUmpired: 0
      }
    });
    
    // 24. Delete all users except admin
    deletionResults.usersDeleted = await prisma.user.deleteMany({
      where: {
        email: { not: adminEmail }
      }
    });

    console.log('✅ All data deleted successfully');
    console.log('📊 Deletion results:', deletionResults);

    res.json({
      success: true,
      message: 'All data deleted successfully. System reset to initial state.',
      deletionResults: {
        matches: deletionResults.matchScores.count,
        draws: deletionResults.draws.count,
        registrations: deletionResults.registrations.count,
        paymentVerifications: deletionResults.paymentVerifications.count,
        categories: deletionResults.categories.count,
        tournamentPayments: deletionResults.tournamentPayments.count,
        tournamentPosters: deletionResults.tournamentPosters.count,
        tournamentUmpires: deletionResults.tournamentUmpires.count,
        tournaments: deletionResults.tournaments.count,
        walletTransactions: deletionResults.walletTransactions.count,
        notifications: deletionResults.notifications.count,
        scoreCorrectionRequests: deletionResults.scoreCorrectionRequests.count,
        smsLogs: deletionResults.smsLogs.count,
        auditLogs: deletionResults.auditLogs.count,
        academies: deletionResults.academies.count,
        organizerKYC: deletionResults.organizerKYC.count,
        organizerRequests: deletionResults.organizerRequests.count,
        adminInvites: deletionResults.adminInvites.count,
        superAdminInvites: deletionResults.superAdminInvites.count,
        superAdminInviteUsage: deletionResults.superAdminInviteUsage.count,
        usersDeleted: deletionResults.usersDeleted.count,
        adminPreserved: true
      }
    });

  } catch (error) {
    console.error('❌ Error deleting all data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete all data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
