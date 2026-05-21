import api from '../utils/api';
import { fetchUpload } from '../utils/fetchUpload';

export const profileAPI = {
  // Get own profile
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data.user;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response.data.user;
  },

  // Upload profile photo
  // Uses native fetch — axios default Content-Type: application/json breaks multer.
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    return fetchUpload('/profile/photo', formData);
  },

  // Delete profile photo
  deletePhoto: async () => {
    const response = await api.delete('/profile/photo');
    return response.data;
  },

  // Change password (no current password required)
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put(
      '/profile/password',
      { newPassword }
    );
    return response.data;
  },
};