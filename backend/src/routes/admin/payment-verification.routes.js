import express from 'express';
import { updateTournamentPaymentRecord } from '../../services/paymentTrackingService.js';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import AuditLogService from '../../services/auditLog.service.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all payment verifications (with filters)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, tournamentId, page = 1, limit } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (tournamentId) where.tournamentId = tournamentId;

    // If no limit specified and status is pending, get all pending payments
    // Otherwise use pagination
    const shouldPaginate = limit && limit !== 'all';
    const skip = shouldPaginate ? (parseInt(page) - 1) * parseInt(limit) : 0;
    const take = shouldPaginate ? parseInt(limit) : undefined;

    const [verifications, total] = await Promise.all([
      prisma.paymentVerification.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip,
        take
      }),
      prisma.paymentVerification.count({ where })
    ]);

    // Manually fetch related data for each verification
    const enrichedVerifications = await Promise.all(
      verifications.map(async (verification) => {
        const registration = await prisma.registration.findUnique({
          where: { id: verification.registrationId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                city: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                format: true
              }
            },
            tournament: {
              select: {
                id: true,
                name: true,
                city: true,
                state: true,
                startDate: true
              }
            }
          }
        });

        return {
          ...verification,
          registration
        };
      })
    );

    res.json({
      success: true,
      data: enrichedVerifications,
      pagination: {
        page: parseInt(page),
        limit: take || total,
        total,
        totalPages: shouldPaginate ? Math.ceil(total / parseInt(limit)) : 1
      }
    });
  } catch (error) {
    console.error('Error fetching payment verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment verifications',
      error: error.message
    });
  }
});

// Get payment verification stats
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [pending, approved, rejected, totalAmount] = await Promise.all([
      prisma.paymentVerification.count({ where: { status: 'pending' } }),
      prisma.paymentVerification.count({ where: { status: 'approved' } }),
      prisma.paymentVerification.count({ where: { status: 'rejected' } }),
      prisma.paymentVerification.aggregate({
        where: { status: 'approved' },
        _sum: { amount: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        totalAmountCollected: totalAmount._sum.amount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment stats'
    });
  }
});

// Bulk approve payments - MUST be before /:id/approve to avoid route conflicts
router.post('/bulk/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { verificationIds } = req.body;
    const adminId = req.user.userId;

    console.log('🔍 Bulk approve request received:', {
      adminId,
      verificationCount: verificationIds?.length,
      sampleIds: verificationIds?.slice(0, 3),
      allIds: verificationIds
    });

    if (!verificationIds || !Array.isArray(verificationIds) || verificationIds.length === 0) {
      console.log('❌ Invalid verification IDs:', verificationIds);
      return res.status(400).json({
        success: false,
        message: 'Verification IDs array is required'
      });
    }

    console.log(`🔍 Bulk approving ${verificationIds.length} payments by admin:`, adminId);

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // First, let's check if all IDs exist
    console.log('🔍 Checking if all verification IDs exist...');
    const existingVerifications = await prisma.paymentVerification.findMany({
      where: {
        id: { in: verificationIds }
      },
      select: {
        id: true,
        status: true,
        userId: true,
        registrationId: true
      }
    });

    console.log(`Found ${existingVerifications.length} out of ${verificationIds.length} verifications`);
    
    const existingIds = existingVerifications.map(v => v.id);
    const missingIds = verificationIds.filter(id => !existingIds.includes(id));
    
    if (missingIds.length > 0) {
      console.log('❌ Missing verification IDs:', missingIds);
      return res.status(404).json({
        success: false,
        message: 'Payment verification not found',
        details: `Missing IDs: ${missingIds.join(', ')}`
      });
    }

    const pendingVerifications = existingVerifications.filter(v => v.status === 'pending');
    console.log(`${pendingVerifications.length} verifications are pending, ${existingVerifications.length - pendingVerifications.length} already processed`);

    // Process each verification
    for (const id of verificationIds) {
      try {
        console.log(`Processing verification: ${id}`);
        
        const verification = await prisma.paymentVerification.findUnique({
          where: { id },
          include: { 
            registration: {
              include: {
                tournament: true,
                user: true
              }
            }
          }
        });

        if (!verification) {
          results.failed++;
          results.errors.push(`Payment verification ${id} not found`);
          console.log(`❌ Verification not found: ${id}`);
          continue;
        }

        if (verification.status !== 'pending') {
          results.failed++;
          results.errors.push(`Payment ${id} already processed (status: ${verification.status})`);
          console.log(`❌ Already processed: ${id} - ${verification.status}`);
          continue;
        }

        // Update verification status
        await prisma.paymentVerification.update({
          where: { id },
          data: {
            status: 'approved',
            verifiedBy: adminId,
            verifiedAt: new Date()
          }
        });

        // Update registration status
        await prisma.registration.update({
          where: { id: verification.registrationId },
          data: {
            paymentStatus: 'verified',
            status: 'confirmed'
          }
        });

        // Update tournament payment tracking
        await updateTournamentPaymentRecord(verification.tournamentId);

        // Send notification to user
        try {
          await prisma.notification.create({
            data: {
              userId: verification.userId,
              type: 'PAYMENT_APPROVED',
              title: 'Payment Approved ✅',
              message: `Your payment for ${verification.registration.tournament.name} has been verified. Registration confirmed!`,
              data: JSON.stringify({
                registrationId: verification.registrationId,
                tournamentId: verification.tournamentId,
                tournamentName: verification.registration.tournament.name
              })
            }
          });
        } catch (notifError) {
          console.error('⚠️ Failed to send notification (non-critical):', notifError.message);
        }

        results.successful++;
        console.log(`✅ Successfully processed: ${verification.registration?.user?.name}`);
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing ${id}: ${error.message}`);
        console.error(`❌ Error processing verification ${id}:`, error);
      }
    }

    console.log(`✅ Bulk approve completed: ${results.successful} successful, ${results.failed} failed`);

    // Log the bulk approval action to audit logs
    try {
      // Handle super admin case - use the real admin user ID instead of 'admin'
      let auditAdminId = adminId;
      if (adminId === 'admin') {
        const realAdmin = await prisma.user.findFirst({
          where: { roles: { contains: 'ADMIN' } }
        });
        auditAdminId = realAdmin?.id || adminId;
      }
      
      await AuditLogService.log({
        adminId: auditAdminId,
        action: 'BULK_PAYMENT_APPROVED',
        entityType: 'PAYMENT_VERIFICATION',
        entityId: null, // Bulk action, no single entity
        details: {
          totalProcessed: verificationIds.length,
          successful: results.successful,
          failed: results.failed,
          verificationIds: verificationIds,
          errors: results.errors
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      console.log('✅ Bulk payment approval logged to audit trail');
    } catch (auditError) {
      console.error('⚠️ Failed to log bulk approval audit entry (non-critical):', auditError.message);
    }

    res.json({
      success: true,
      message: `Bulk approval completed: ${results.successful} successful, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('❌ Error in bulk approve:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk approve payments',
      error: error.message
    });
  }
});

// Bulk reject payments - MUST be before /:id/reject to avoid route conflicts
router.post('/bulk/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { verificationIds, reason = 'Bulk rejection by admin', rejectionType = 'CUSTOM' } = req.body;
    const adminId = req.user.userId;

    if (!verificationIds || !Array.isArray(verificationIds) || verificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Verification IDs array is required'
      });
    }

    console.log(`🔍 Bulk rejecting ${verificationIds.length} payments by admin:`, adminId);

    const results = {
      successful: 0,
      failed: 0,
      errors: []
    };

    // Process each verification
    for (const id of verificationIds) {
      try {
        const verification = await prisma.paymentVerification.findUnique({
          where: { id },
          include: {
            registration: {
              include: {
                user: true,
                tournament: true
              }
            }
          }
        });

        if (!verification) {
          results.failed++;
          results.errors.push(`Payment verification ${id} not found`);
          continue;
        }

        if (verification.status !== 'pending') {
          results.failed++;
          results.errors.push(`Payment ${id} already processed`);
          continue;
        }

        // Update verification status
        await prisma.paymentVerification.update({
          where: { id },
          data: {
            status: 'rejected',
            verifiedBy: adminId,
            verifiedAt: new Date(),
            rejectionReason: reason,
            rejectionType: rejectionType
          }
        });

        // Update registration status
        await prisma.registration.update({
          where: { id: verification.registrationId },
          data: {
            paymentStatus: 'rejected',
            status: 'cancelled'
          }
        });

        // Send notification to user
        try {
          await prisma.notification.create({
            data: {
              userId: verification.userId,
              type: 'PAYMENT_REJECTED',
              title: 'Payment Rejected',
              message: reason,
              data: JSON.stringify({
                registrationId: verification.registrationId,
                tournamentId: verification.tournamentId,
                reason,
                rejectionType
              })
            }
          });
        } catch (notifError) {
          console.error('⚠️ Failed to send notification (non-critical):', notifError.message);
        }

        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error processing ${id}: ${error.message}`);
        console.error(`❌ Error processing verification ${id}:`, error);
      }
    }

    console.log(`✅ Bulk reject completed: ${results.successful} successful, ${results.failed} failed`);

    // Log the bulk rejection action to audit logs
    try {
      // Handle super admin case - use the real admin user ID instead of 'admin'
      let auditAdminId = adminId;
      if (adminId === 'admin') {
        const realAdmin = await prisma.user.findFirst({
          where: { roles: { contains: 'ADMIN' } }
        });
        auditAdminId = realAdmin?.id || adminId;
      }
      
      await AuditLogService.log({
        adminId: auditAdminId,
        action: 'BULK_PAYMENT_REJECTED',
        entityType: 'PAYMENT_VERIFICATION',
        entityId: null, // Bulk action, no single entity
        details: {
          totalProcessed: verificationIds.length,
          successful: results.successful,
          failed: results.failed,
          reason: reason,
          rejectionType: rejectionType,
          verificationIds: verificationIds,
          errors: results.errors
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      console.log('✅ Bulk payment rejection logged to audit trail');
    } catch (auditError) {
      console.error('⚠️ Failed to log bulk rejection audit entry (non-critical):', auditError.message);
    }

    res.json({
      success: true,
      message: `Bulk rejection completed: ${results.successful} successful, ${results.failed} failed`,
      results
    });
  } catch (error) {
    console.error('❌ Error in bulk reject:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk reject payments',
      error: error.message
    });
  }
});

// Approve payment
router.post('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    console.log('🔍 Approving payment:', id, 'by admin:', adminId);

    const verification = await prisma.paymentVerification.findUnique({
      where: { id },
      include: { 
        registration: {
          include: {
            tournament: true,
            user: true
          }
        }
      }
    });

    if (!verification) {
      console.error('❌ Payment verification not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Payment verification not found'
      });
    }

    if (verification.status !== 'pending') {
      console.error('❌ Payment already processed:', verification.status);
      return res.status(400).json({
        success: false,
        message: 'Payment already processed'
      });
    }

    console.log('✅ Payment verification found:', {
      id: verification.id,
      userId: verification.userId,
      tournamentId: verification.tournamentId,
      amount: verification.amount
    });

    // Update verification status
    await prisma.paymentVerification.update({
      where: { id },
      data: {
        status: 'approved',
        verifiedBy: adminId,
        verifiedAt: new Date()
      }
    });
    console.log('✅ Verification status updated to approved');

    // Update registration status
    await prisma.registration.update({
      where: { id: verification.registrationId },
      data: {
        paymentStatus: 'verified',
        status: 'confirmed'
      }
    });
    console.log('✅ Registration status updated to confirmed');

    // Update tournament payment tracking
    await updateTournamentPaymentRecord(verification.tournamentId);
    console.log('✅ Tournament payment tracking updated');

    // Send notification to user
    try {
      await prisma.notification.create({
        data: {
          userId: verification.userId,
          type: 'PAYMENT_APPROVED',
          title: 'Payment Approved ✅',
          message: `Your payment for ${verification.registration.tournament.name} has been verified. Registration confirmed!`,
          data: JSON.stringify({
            registrationId: verification.registrationId,
            tournamentId: verification.tournamentId,
            tournamentName: verification.registration.tournament.name
          })
        }
      });
      console.log('✅ Notification sent to user');
    } catch (notifError) {
      console.error('⚠️ Failed to send notification (non-critical):', notifError.message);
    }

    // Send notification to organizer
    try {
      await prisma.notification.create({
        data: {
          userId: verification.registration.tournament.organizerId,
          type: 'NEW_REGISTRATION',
          title: 'New Player Registered 🎉',
          message: `${verification.registration.user.name} has been registered for ${verification.registration.tournament.name}`,
          data: JSON.stringify({
            registrationId: verification.registrationId,
            tournamentId: verification.tournamentId,
            playerName: verification.registration.user.name,
            playerEmail: verification.registration.user.email
          })
        }
      });
      console.log('✅ Notification sent to organizer');
    } catch (notifError) {
      console.error('⚠️ Failed to send organizer notification (non-critical):', notifError.message);
    }

    // Log the approval action to audit logs
    try {
      // Handle super admin case - use the real admin user ID instead of 'admin'
      let auditAdminId = adminId;
      if (adminId === 'admin') {
        const realAdmin = await prisma.user.findFirst({
          where: { roles: { contains: 'ADMIN' } }
        });
        auditAdminId = realAdmin?.id || adminId;
      }
      
      await AuditLogService.log({
        adminId: auditAdminId,
        action: 'PAYMENT_APPROVED',
        entityType: 'PAYMENT_VERIFICATION',
        entityId: id,
        details: {
          userId: verification.userId,
          tournamentId: verification.tournamentId,
          tournamentName: verification.registration.tournament.name,
          playerName: verification.registration.user.name,
          amount: verification.amount,
          registrationId: verification.registrationId
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      console.log('✅ Payment approval logged to audit trail');
    } catch (auditError) {
      console.error('⚠️ Failed to log audit entry (non-critical):', auditError.message);
    }

    res.json({
      success: true,
      message: 'Payment approved successfully'
    });
  } catch (error) {
    console.error('❌ Error approving payment:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to approve payment',
      error: error.message
    });
  }
});

// Reject payment
router.post('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, rejectionType, customMessage, amountPaid, amountRequired } = req.body;
    const adminId = req.user.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const verification = await prisma.paymentVerification.findUnique({
      where: { id },
      include: {
        registration: {
          include: {
            user: true,
            tournament: true
          }
        }
      }
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Payment verification not found'
      });
    }

    if (verification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed'
      });
    }

    // Build notification message based on rejection type
    let notificationTitle = 'Payment Rejected';
    let notificationMessage = reason;

    if (rejectionType === 'INSUFFICIENT_AMOUNT') {
      notificationTitle = 'Insufficient Payment Amount';
      notificationMessage = `You paid ₹${amountPaid} but the entry fee is ₹${amountRequired}. Please pay the remaining ₹${amountRequired - amountPaid} to complete your registration.\n\n${customMessage || 'Scan the QR code again and pay the remaining amount, then upload the new payment screenshot.'}`;
    } else if (rejectionType === 'REFUND_REQUIRED') {
      notificationTitle = 'Payment Refund Initiated';
      notificationMessage = customMessage || 'Your payment will be refunded. Please provide your bank details or UPI ID for the refund.';
    } else if (rejectionType === 'WRONG_ACCOUNT') {
      notificationTitle = 'Payment to Wrong Account';
      notificationMessage = customMessage || 'You paid to the wrong account. Please pay to the admin account (9742628582@slc) and upload the correct payment screenshot.';
    } else if (rejectionType === 'INVALID_PROOF') {
      notificationTitle = 'Invalid Payment Proof';
      notificationMessage = customMessage || 'The payment screenshot provided is invalid or unclear. Please upload a clear screenshot showing the transaction details.';
    } else if (rejectionType === 'DUPLICATE') {
      notificationTitle = 'Duplicate Registration';
      notificationMessage = customMessage || 'You have already registered for this tournament. This duplicate registration has been cancelled.';
    } else if (rejectionType === 'TOURNAMENT_FULL') {
      notificationTitle = 'Tournament Full';
      notificationMessage = customMessage || 'The tournament has reached maximum capacity. Your payment will be refunded.';
    } else if (rejectionType === 'CUSTOM') {
      notificationTitle = 'Payment Rejected';
      notificationMessage = customMessage || reason;
    }

    // Update verification status
    await prisma.paymentVerification.update({
      where: { id },
      data: {
        status: 'rejected',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: reason,
        rejectionType: rejectionType || 'CUSTOM'
      }
    });

    // Update registration status based on rejection type
    const registrationStatus = rejectionType === 'INSUFFICIENT_AMOUNT' ? 'pending' : 'cancelled';
    
    await prisma.registration.update({
      where: { id: verification.registrationId },
      data: {
        paymentStatus: 'rejected',
        status: registrationStatus
      }
    });

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: verification.userId,
        type: 'PAYMENT_REJECTED',
        title: notificationTitle,
        message: notificationMessage,
        data: JSON.stringify({
          registrationId: verification.registrationId,
          tournamentId: verification.tournamentId,
          reason,
          rejectionType: rejectionType || 'CUSTOM',
          amountPaid,
          amountRequired,
          amountRemaining: amountRequired && amountPaid ? amountRequired - amountPaid : null
        })
      }
    });

    // Log the rejection action to audit logs
    try {
      // Handle super admin case - use the real admin user ID instead of 'admin'
      let auditAdminId = adminId;
      if (adminId === 'admin') {
        const realAdmin = await prisma.user.findFirst({
          where: { roles: { contains: 'ADMIN' } }
        });
        auditAdminId = realAdmin?.id || adminId;
      }
      
      await AuditLogService.log({
        adminId: auditAdminId,
        action: 'PAYMENT_REJECTED',
        entityType: 'PAYMENT_VERIFICATION',
        entityId: id,
        details: {
          userId: verification.userId,
          tournamentId: verification.tournamentId,
          tournamentName: verification.registration.tournament.name,
          playerName: verification.registration.user.name,
          amount: verification.amount,
          reason: reason,
          rejectionType: rejectionType || 'CUSTOM',
          customMessage: customMessage,
          amountPaid: amountPaid,
          amountRequired: amountRequired,
          registrationId: verification.registrationId
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      console.log('✅ Payment rejection logged to audit trail');
    } catch (auditError) {
      console.error('⚠️ Failed to log audit entry (non-critical):', auditError.message);
    }

    res.json({
      success: true,
      message: 'Payment rejected successfully',
      rejectionType: rejectionType || 'CUSTOM'
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment'
    });
  }
});

export default router;
