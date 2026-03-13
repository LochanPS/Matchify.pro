import api from '../utils/api';

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
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await api.post('/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete profile photo
  deletePhoto: async () => {
    const response = await api.delete('/profile/photo');
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put(
      '/profile/password',
      { currentPassword, newPassword }
    );
    return response.data;
  },
};