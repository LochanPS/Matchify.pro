import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById,
  deleteAllNotificationsForUser
} from '../controllers/notification.controller.js';

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', authenticate, getNotifications);

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    // Use singleton prisma (imported above) — never create a new PrismaClient per
    // request; that leaks connections and causes P2024 exhaustion under load.
    const count = await prisma.notification.count({
      where: {
        userId: req.user.id,
        read: false
      }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read (must come before /:id)
router.put('/read-all', authenticate, markAllNotificationsAsRead);

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', authenticate, markNotificationAsRead);

// DELETE /api/notifications/all - Delete all notifications (changed to /all to avoid conflict)
router.delete('/all', authenticate, deleteAllNotificationsForUser);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authenticate, deleteNotificationById);

export default router;
