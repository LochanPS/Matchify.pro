import express from 'express';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { cacheGet, cacheSet, cacheDel } from '../services/redisService.js';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationById,
  deleteAllNotificationsForUser
} from '../controllers/notification.controller.js';

const router = express.Router();

const notifCacheKey = (userId) => `notif:unread:${userId}`;

// GET /api/notifications - Get user's notifications
router.get('/', authenticate, getNotifications);

// GET /api/notifications/unread-count — cached 30s per user
router.get('/unread-count', authenticate, async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const key = notifCacheKey(userId);

    const cached = await cacheGet(key);
    if (cached !== null) {
      return res.json(cached);
    }

    const count = await prisma.notification.count({
      where: { userId, read: false }
    });

    const result = { count };
    await cacheSet(key, result, 30); // 30s TTL
    res.json(result);
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// PUT /api/notifications/read-all — bust cache after
router.put('/read-all', authenticate, async (req, res, next) => {
  const userId = req.user.id || req.user.userId;
  await cacheDel(notifCacheKey(userId));
  return markAllNotificationsAsRead(req, res, next);
});

// PUT /api/notifications/:id/read — bust cache after
router.put('/:id/read', authenticate, async (req, res, next) => {
  const userId = req.user.id || req.user.userId;
  await cacheDel(notifCacheKey(userId));
  return markNotificationAsRead(req, res, next);
});

// DELETE /api/notifications/all - Delete all notifications (changed to /all to avoid conflict)
router.delete('/all', authenticate, deleteAllNotificationsForUser);

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', authenticate, deleteNotificationById);

export default router;
