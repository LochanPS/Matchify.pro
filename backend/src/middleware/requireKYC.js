import prisma from '../lib/prisma.js';

/**
 * Middleware to check if organizer has completed KYC
 * Blocks tournament creation if KYC is not approved
 */
export const requireKYC = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user has organizer role
    if (!req.user.roles.includes('ORGANIZER')) {
      return res.status(403).json({
        error: 'ORGANIZER_ROLE_REQUIRED',
        message: 'Only organizers can create tournaments'
      });
    }

    // Check KYC status
    const kyc = await prisma.organizerKYC.findUnique({
      where: { organizerId: userId }
    });

    if (!kyc) {
      return res.status(403).json({
        error: 'KYC_REQUIRED',
        message: 'Please complete KYC verification before creating tournaments',
        redirectTo: '/organizer/kyc/submit'
      });
    }

    if (kyc.status !== 'APPROVED') {
      return res.status(403).json({
        error: 'KYC_NOT_APPROVED',
        message: `KYC status: ${kyc.status}. Please complete KYC verification.`,
        kycStatus: kyc.status,
        redirectTo: kyc.status === 'PENDING' || kyc.status === 'IN_PROGRESS' 
          ? '/organizer/kyc/video-call' 
          : '/organizer/kyc/submit'
      });
    }

    // KYC approved, allow tournament creation
    next();
  } catch (error) {
    console.error('KYC check error:', error);
    res.status(500).json({
      error: 'KYC_CHECK_FAILED',
      message: 'Failed to verify KYC status'
    });
  }
};
