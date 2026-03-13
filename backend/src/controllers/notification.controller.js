import { getUserNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from '../services/notification.service.js';

// GET /api/notifications - Get user notifications
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly, limit } = req.query;

    const notifications = await getUserNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit) : 50,
    });

    const unreadCount = notifications.filter((n) => !n.read).length;

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
    });
  }
};

// PUT /api/notifications/:id/read - Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await markAsRead(id, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Notification marked as read',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read',
    });
  }
};

// PUT /api/notifications/read-all - Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await markAllAsRead(userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read',
    });
  }
};

// DELETE /api/notifications/:id - Delete a notification
const deleteNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await deleteNotification(id, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } else {
      res.status(result.status || 400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification',
    });
  }
};

// DELETE /api/notifications - Delete all notifications for user
const deleteAllNotificationsForUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await deleteAllNotifications(userId);

    if (result.success) {
      res.json({
        success: true,
        message: `${result.count} notification(s) deleted successfully`,
        count: result.count,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete all notifications',
    });
  }
};

export { 
  getNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotificationById,
  deleteAllNotificationsForUser
};
