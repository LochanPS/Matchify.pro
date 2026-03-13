import prisma from '../lib/prisma.js';

/**
 * Validate invite token and return invite details
 * @param {string} token - Invite token
 * @returns {Object} Validation result with invite details or error
 */
export async function validateInviteToken(token) {
  const invite = await prisma.adminInvite.findUnique({
    where: { token },
    include: {
      inviter: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!invite) {
    return {
      valid: false,
      error: 'Invalid invite token'
    };
  }

  if (invite.status === 'accepted') {
    return {
      valid: false,
      error: 'Invite already used'
    };
  }

  if (invite.status === 'revoked') {
    return {
      valid: false,
      error: 'Invite has been revoked'
    };
  }

  if (new Date() > invite.expiresAt) {
    // Auto-mark as expired
    await prisma.adminInvite.update({
      where: { id: invite.id },
      data: { status: 'expired' }
    });

    return {
      valid: false,
      error: 'Invite has expired'
    };
  }

  return {
    valid: true,
    invite
  };
}

/**
 * Get invite details for public display (no sensitive data)
 * @param {string} token - Invite token
 * @returns {Object} Public invite details or error
 */
export async function getInvitePublicDetails(token) {
  const validation = await validateInviteToken(token);

  if (!validation.valid) {
    return { error: validation.error };
  }

  const { invite } = validation;

  return {
    success: true,
    data: {
      email: invite.email,
      role: invite.role,
      invitedBy: invite.inviter.name,
      inviterEmail: invite.inviter.email,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      status: invite.status
    }
  };
}

/**
 * Check if invite is valid for acceptance
 * @param {string} token - Invite token
 * @param {string} oneTimePassword - One-time password
 * @param {string} email - Email address
 * @returns {Object} Validation result
 */
export async function validateInviteForAcceptance(token, oneTimePassword, email) {
  const validation = await validateInviteToken(token);

  if (!validation.valid) {
    return validation;
  }

  const { invite } = validation;

  // Verify one-time password
  if (invite.oneTimePassword !== oneTimePassword.toUpperCase()) {
    return {
      valid: false,
      error: 'Invalid one-time password'
    };
  }

  // Verify email matches
  if (invite.email !== email) {
    return {
      valid: false,
      error: 'Email does not match invite'
    };
  }

  return {
    valid: true,
    invite
  };
}
