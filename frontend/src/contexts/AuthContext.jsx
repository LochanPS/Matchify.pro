import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

// Check if profile is complete (has required fields)
const isProfileComplete = (user) => {
  if (!user) return true; // No user, no need to show modal
  return !!(user.phone && user.city && user.state && user.gender);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);

  // Fetch fresh user data from server
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data.user) {
        const freshUser = response.data.user;
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
        
        // Check if profile is incomplete
        if (!isProfileComplete(freshUser)) {
          setShowProfileCompletion(true);
        } else {
          setShowProfileCompletion(false);
        }
        return freshUser;
      }
    } catch (error) {
      // Silently handle profile fetch errors - user data from login is sufficient
      console.log('Profile fetch skipped or failed:', error.message);
      return null;
    }
  };
      // If token is invalid, clear storage
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
    }
    return null;
  };

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        
        // Fetch fresh user data from server to ensure we have latest profile info
        fetchUserProfile().finally(() => {
          setLoading(false);
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/multi-auth/login', { email, password });
      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Don't show profile completion for admin
      if (userData.isAdmin) {
        return userData;
      }
      
      // Check if profile is incomplete after login
      if (!isProfileComplete(userData)) {
        setShowProfileCompletion(true);
      }
      
      return userData;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/multi-auth/register', userData);
      const { user: newUser, token } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
      
      // Show profile completion modal for new users
      if (!isProfileComplete(newUser)) {
        setShowProfileCompletion(true);
      }
      
      return newUser;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      // No need to call logout endpoint for simple token auth
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setShowProfileCompletion(false);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Hide modal if profile is now complete
    if (isProfileComplete(updatedUser)) {
      setShowProfileCompletion(false);
    }
  };

  const switchRole = (newRole) => {
    if (user) {
      const updatedUser = { ...user, currentRole: newRole };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const completeProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setShowProfileCompletion(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      updateUser,
      switchRole,
      loading,
      showProfileCompletion,
      setShowProfileCompletion,
      completeProfile,
      isProfileComplete: () => isProfileComplete(user)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};