import { PrismaClient } from '@prisma/client';
import emailService from './emailService.js';

const prisma = new PrismaClient();

// Notification types enum (for reference)
const NotificationType = {
  REGISTRATION_CONFIRMED: 'REGISTRATION_CONFIRMED',
  PARTNER_INVITATION: 'PARTNER_INVITATION',
  PARTNER_ACCEPTED: 'PARTNER_ACCEPTED',
  PARTNER_DECLINED: 'PARTNER_DECLINED',
  DRAW_PUBLISHED: 'DRAW_PUBLISHED',
  MATCH_ASSIGNED: 'MATCH_ASSIGNED',
  MATCH_STARTING_SOON: 'MATCH_STARTING_SOON',
  TOURNAMENT_CANCELLED: 'TOURNAMENT_CANCELLED',
  REFUND_PROCESSED: 'REFUND_PROCESSED',
  TOURNAMENT_REMINDER: 'TOURNAMENT_REMINDER',
  POINTS_AWARDED: 'POINTS_AWARDED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  UMPIRE_ADDED: 'UMPIRE_ADDED',
};

class NotificationService {
  /**
   * Create a notification for a user (in-app + email)
   */
  async createNotification({ userId, type, title, message, data = null, sendEmail = true }) {
    try {
      // 1. Create in-app notification
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data: data ? JSON.stringify(data) : null,
        },
        include: {
          user: {
            select: {
              email: true,
              name: true,
            },
          },
        },
      });

      // 2. Send email notification (if enabled)
      if (sendEmail && notification.user.email) {
        await this.sendEmailNotification(notification, data);
      }

      // TODO: Emit WebSocket event for real-time notification
      // this.emitNotification(userId, notification);

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Send email based on notification type
   */
  async sendEmailNotification(notification, metadata) {
    try {
      const { user, type, title, message } = notification;
      const data = metadata || (notification.data ? JSON.parse(notification.data) : {});

      // Map notification types to email methods
      switch (type) {
        case NotificationType.REGISTRATION_CONFIRMED:
          // Email already sent in registration flow
          break;

        case NotificationType.PARTNER_INVITATION:
          // Email already sent in partner invitation flow
          break;

        case NotificationType.PARTNER_ACCEPTED:
          await emailService.sendQuickNotification(
            user,
            `${data.partnerName || 'Your partner'} has accepted your doubles invitation for ${data.tournamentName}!`,
            data.tournamentId ? `/tournaments/${data.tournamentId}` : null
          );
          break;

        case NotificationType.PARTNER_DECLINED:
          await emailService.sendQuickNotification(
            user,
            `${data.partnerName || 'Your partner'} has declined your doubles invitation for ${data.tournamentName}.`,
            data.tournamentId ? `/tournaments/${data.tournamentId}` : null
          );
          break;

        case NotificationType.DRAW_PUBLISHED:
          await emailService.sendQuickNotification(
            user,
            `The draw for ${data.categoryName} in ${data.tournamentName} has been published! Check your bracket.`,
            data.tournamentId ? `/tournaments/${data.tournamentId}/draws` : null
          );
          break;

        case NotificationType.MATCH_ASSIGNED:
          await emailService.sendQuickNotification(
            user,
            `You have been assigned to umpire a match: ${data.matchDetails || 'Match details available in app'}`,
            data.matchId ? `/umpire/matches/${data.matchId}` : null
          );
          break;

        case NotificationType.MATCH_STARTING_SOON:
          if (data.courtNumber && data.opponentName) {
            await emailService.sendMatchStartingSoon(
              user,
              { scheduledTime: data.matchTime },
              data.courtNumber,
              data.opponentName
            );
          }
          break;

        case NotificationType.TOURNAMENT_REMINDER:
          if (data.tournamentName && data.startDate) {
            await emailService.sendTournamentReminderUrgent(user, {
              name: data.tournamentName,
              startDate: data.startDate,
              venue: data.venue || 'Venue TBA',
              id: data.tournamentId,
            });
          }
          break;

        case NotificationType.TOURNAMENT_CANCELLED:
          // Email already sent in cancellation flow
          break;

        case NotificationType.REFUND_PROCESSED:
          await emailService.sendQuickNotification(
            user,
            `Refund of ₹${data.amount} for ${data.tournamentName} has been credited to your wallet.`,
            '/wallet'
          );
          break;

        case NotificationType.POINTS_AWARDED:
          await emailService.sendQuickNotification(
            user,
            `Congratulations! You earned ${data.points} Matchify Points for ${data.position} in ${data.tournamentName}! 🏆`,
            '/leaderboard'
          );
          break;

        case NotificationType.ACCOUNT_SUSPENDED:
          // Email already sent in suspension flow
          break;

        case NotificationType.UMPIRE_ADDED:
          await emailService.sendQuickNotification(
            user,
            `🎾 Exciting news! You've been selected as an official umpire for "${data.tournamentName}" by ${data.organizerName || 'the tournament organizer'}. Your expertise in officiating will help ensure fair play and smooth matches. Log in to Matchify.pro to view the tournament details and prepare for your upcoming assignments. Thank you for being part of our officiating team!`,
            data.tournamentId ? `/tournaments/${data.tournamentId}` : null
          );
          break;

        default:
          // Generic notification email
          await emailService.sendQuickNotification(user, message, null);
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
      // Don't throw - in-app notification should still work even if email fails
    }
  }

  /**
   * Create notifications for multiple users (bulk)
   */
  async createBulkNotifications(notifications) {
    try {
      const result = await prisma.notification.createMany({
        data: notifications.map(notif => ({
          userId: notif.userId,
          type: notif.type,
          title: notif.title,
          message: notif.message,
          data: notif.data ? JSON.stringify(notif.data) : null,
        })),
      });

      return result;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get user's notifications with pagination
   */
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false }) {
    try {
      const skip = (page - 1) * limit;

      const where = {
        userId,
        ...(unreadOnly && { read: false }),
      };

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, read: false } }),
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        unreadCount,
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId, // Ensure user owns this notification
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId,
          read: false,
        },
        data: {
          read: true,
          readAt: new Date(),
        },
      });

      return result;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: notificationId,
          userId, // Ensure user owns this notification
        },
      });

      return result;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete old notifications (cleanup job)
   */
  async deleteOldNotifications(daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await prisma.notification.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
          read: true, // Only delete read notifications
        },
      });

      return result;
    } catch (error) {
      console.error('Error deleting old notifications:', error);
      throw error;
    }
  }

  // Helper methods for specific notification types

  async notifyRegistrationConfirmed(userId, tournamentName, categories, tournamentId = null) {
    return this.createNotification({
      userId,
      type: NotificationType.REGISTRATION_CONFIRMED,
      title: 'Registration Confirmed',
      message: `Your registration for ${tournamentName} (${categories.join(', ')}) has been confirmed!`,
      data: { tournamentName, categories, tournamentId },
      sendEmail: false, // Email already sent in registration flow
    });
  }

  async notifyPartnerInvitation(userId, tournamentName, inviterName, registrationId, tournamentId = null) {
    return this.createNotification({
      userId,
      type: NotificationType.PARTNER_INVITATION,
      title: 'Doubles Partner Invitation',
      message: `${inviterName} has invited you to partner in ${tournamentName}`,
      data: { tournamentName, inviterName, registrationId, tournamentId },
      sendEmail: false, // Email already sent in partner invitation flow
    });
  }

  async notifyPartnerAccepted(userId, tournamentName, partnerName, tournamentId = null) {
    return this.createNotification({
      userId,
      type: NotificationType.PARTNER_ACCEPTED,
      title: 'Partner Accepted',
      message: `${partnerName} has accepted your doubles invitation for ${tournamentName}!`,
      data: { tournamentName, partnerName, tournamentId },
      sendEmail: true, // Send email for this
    });
  }

  async notifyPartnerDeclined(userId, tournamentName, partnerName, tournamentId = null) {
    return this.createNotification({
      userId,
      type: NotificationType.PARTNER_DECLINED,
      title: 'Partner Declined',
      message: `${partnerName} has declined your doubles invitation for ${tournamentName}`,
      data: { tournamentName, partnerName, tournamentId },
      sendEmail: true, // Send email for this
    });
  }
  async notifyDrawPublished(userId, tournamentName, categoryName, tournamentId) {
    return this.createNotification({
      userId,
      type: NotificationType.DRAW_PUBLISHED,
      title: 'Draw Published',
      message: `The draw for ${categoryName} in ${tournamentName} has been published!`,
      data: { tournamentName, categoryName, tournamentId },
      sendEmail: true, // Send email for this
    });
  }

  async notifyMatchAssigned(userId, matchDetails) {
    return this.createNotification({
      userId,
      type: NotificationType.MATCH_ASSIGNED,
      title: 'Match Assigned',
      message: `You have been assigned to umpire ${matchDetails.player1} vs ${matchDetails.player2}`,
      data: matchDetails,
      sendEmail: true, // Send email for this
    });
  }

  async notifyMatchStartingSoon(userId, matchDetails) {
    return this.createNotification({
      userId,
      type: NotificationType.MATCH_STARTING_SOON,
      title: 'Match Starting Soon',
      message: `Your match starts in 15 minutes on Court ${matchDetails.courtNumber}!`,
      data: matchDetails,
      sendEmail: true, // Send urgent email for this
    });
  }

  async notifyTournamentCancelled(userId, tournamentName, refundAmount, tournamentId = null) {
    return this.createNotification({
      userId,
      type: NotificationType.TOURNAMENT_CANCELLED,
      title: 'Tournament Cancelled',
      message: `${tournamentName} has been cancelled. Refund of ₹${refundAmount} processed to your wallet.`,
      data: { tournamentName, refundAmount, tournamentId },
      sendEmail: false, // Email already sent in cancellation flow
    });
  }

  async notifyRefundProcessed(userId, tournamentName, amount, tournamentId = null) {
    return this.createNotification({
      userId,
      type: NotificationType.REFUND_PROCESSED,
      title: 'Refund Processed',
      message: `Refund of ₹${amount} for ${tournamentName} has been credited to your wallet.`,
      data: { tournamentName, amount, tournamentId },
      sendEmail: true, // Send email for this
    });
  }

  async notifyTournamentReminder(userId, tournamentName, startDate, venue = null, tournamentId = null) {
    return this.createNotification({
      userId,
      type: NotificationType.TOURNAMENT_REMINDER,
      title: 'Tournament Tomorrow',
      message: `${tournamentName} starts tomorrow! Get ready!`,
      data: { tournamentName, startDate, venue, tournamentId },
      sendEmail: true, // Send urgent email for this
    });
  }

  async notifyPointsAwarded(userId, points, tournamentName, position, tournamentId = null) {
    return this.createNotification({
      userId,
      type: NotificationType.POINTS_AWARDED,
      title: 'Matchify Points Awarded',
      message: `You earned ${points} points for ${position} in ${tournamentName}!`,
      data: { points, tournamentName, position, tournamentId },
      sendEmail: true, // Send email for this
    });
  }

  async notifyAccountSuspended(userId, reason, duration) {
    return this.createNotification({
      userId,
      type: NotificationType.ACCOUNT_SUSPENDED,
      title: 'Account Suspended',
      message: `Your account has been suspended. Reason: ${reason}`,
      data: { reason, duration },
      sendEmail: false, // Email already sent in suspension flow
    });
  }
}

export default new NotificationService();
