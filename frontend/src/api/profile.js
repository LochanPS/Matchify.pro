import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const profileAPI = {
  // Get own profile
  getProfile: async () => {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: getAuthHeader(),
    });
    return response.data.user;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await axios.put(`${API_URL}/profile`, data, {
      headers: getAuthHeader(),
    });
    return response.data.user;
  },

  // Upload profile photo
  uploadPhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    
    const response = await axios.post(`${API_URL}/profile/photo`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete profile photo
  deletePhoto: async () => {
    const response = await axios.delete(`${API_URL}/profile/photo`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await axios.put(
      `${API_URL}/profile/password`,
      { currentPassword, newPassword },
      { headers: getAuthHeader() }
    );
    return response.data;
  },
};