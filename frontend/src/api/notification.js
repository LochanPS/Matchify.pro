import api from './axios';

// Get user notifications
export const getNotifications = async (unreadOnly = false, limit = 50) => {
  const response = await api.get('/notifications', {
    params: { unreadOnly, limit },
  });
  return response.data;
};

// Mark notification as read
export const markAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}/read`);
  return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};
