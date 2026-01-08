import { PrismaClient } from '@prisma/client';
import { sendPartnerInvitation, sendPartnerAccepted, sendPartnerDeclined } from './email.service.js';

const prisma = new PrismaClient();

// Create notification
const createNotification = async ({ userId, type, title, message }) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
      },
    });
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
};

// Send partner invitation notification
const notifyPartnerInvitation = async ({ registration, playerName, partnerEmail }) => {
  try {
    const { tournament, category, partnerToken } = registration;

    // Send email
    await sendPartnerInvitation({
      to: partnerEmail,
      playerName,
      tournamentName: tournament.name,
      categoryName: category.name,
      token: partnerToken,
    });

    // If partner is registered, create in-app notification
    const partner = await prisma.user.findUnique({
      where: { email: partnerEmail },
    });

    if (partner) {
      await createNotification({
        userId: partner.id,
        type: 'PARTNER_INVITATION',
        title: 'Partner Invitation',
        message: `${playerName} invited you to be their partner for ${tournament.name} - ${category.name}`,
        registrationId: registration.id,
        tournamentId: tournament.id,
        categoryId: category.id,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Notify partner invitation error:', error);
    return { success: false, error: error.message };
  }
};

// Send partner accepted notification
const notifyPartnerAccepted = async ({ registration, partnerName }) => {
  try {
    const { userId, tournament, category } = registration;

    // Get player details
    const player = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // Send email
    await sendPartnerAccepted({
      to: player.email,
      partnerName,
      tournamentName: tournament.name,
      categoryName: category.name,
    });

    // Create in-app notification
    await createNotification({
      userId,
      type: 'PARTNER_ACCEPTED',
      title: 'Partner Accepted',
      message: `${partnerName} accepted your partner invitation for ${tournament.name} - ${category.name}`,
      registrationId: registration.id,
      tournamentId: tournament.id,
      categoryId: category.id,
    });

    return { success: true };
  } catch (error) {
    console.error('Notify partner accepted error:', error);
    return { success: false, error: error.message };
  }
};

// Send partner declined notification
const notifyPartnerDeclined = async ({ registration, partnerName }) => {
  try {
    const { userId, tournament, category } = registration;

    // Get player details
    const player = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    // Send email
    await sendPartnerDeclined({
      to: player.email,
      partnerName,
      tournamentName: tournament.name,
      categoryName: category.name,
    });

    // Create in-app notification
    await createNotification({
      userId,
      type: 'PARTNER_DECLINED',
      title: 'Partner Declined',
      message: `${partnerName} declined your partner invitation for ${tournament.name} - ${category.name}`,
      registrationId: registration.id,
      tournamentId: tournament.id,
      categoryId: category.id,
    });

    return { success: true };
  } catch (error) {
    console.error('Notify partner declined error:', error);
    return { success: false, error: error.message };
  }
};

// Get user notifications
const getUserNotifications = async (userId, { unreadOnly = false, limit = 50 } = {}) => {
  try {
    const where = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
};

// Mark notification as read
const markAsRead = async (notificationId, userId) => {
  try {
    const notification = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { success: false, error: error.message };
  }
};

// Mark all notifications as read
const markAllAsRead = async (userId) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return { success: false, error: error.message };
  }
};

export {
  createNotification,
  notifyPartnerInvitation,
  notifyPartnerAccepted,
  notifyPartnerDeclined,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
};
