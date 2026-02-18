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
      // Skip profile fetch for admin users
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const user = JSON.parse(storedUser);
        
        // Skip for any admin user (hardcoded or database)
        if (payload.isAdmin || (user.roles && (Array.isArray(user.roles) ? user.roles.includes('ADMIN') : user.roles === 'ADMIN'))) {
          console.log('Skipping profile fetch for admin user');
          return null;
        }
      }
      
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
      
      // If token is invalid, clear storage
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      }
      return null;
    }
  };

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('🔄 AuthContext: Initializing...', {
      hasToken: !!token,
      hasStoredUser: !!storedUser
    });
    
    if (token && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        console.log('✅ AuthContext: User found in localStorage', {
          email: parsedUser.email,
          hasRoles: !!parsedUser.roles,
          hasCurrentRole: !!parsedUser.currentRole
        });
        
        // Fix legacy user data - add roles if missing
        let needsUpdate = false;
        
        if (!parsedUser.roles && !parsedUser.role) {
          console.warn('⚠️ User missing roles field, adding default roles');
          parsedUser.roles = ['PLAYER', 'ORGANIZER', 'UMPIRE'];
          needsUpdate = true;
        }
        
        // Ensure roles is an array
        if (parsedUser.roles && typeof parsedUser.roles === 'string') {
          parsedUser.roles = parsedUser.roles.split(',').map(r => r.trim());
          needsUpdate = true;
        }
        
        // Set default currentRole to PLAYER if not set
        if (!parsedUser.currentRole) {
          parsedUser.currentRole = parsedUser.roles && parsedUser.roles[0] ? parsedUser.roles[0] : 'PLAYER';
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          localStorage.setItem('user', JSON.stringify(parsedUser));
          console.log('✅ User data updated with roles and currentRole');
        }
        
        setUser(parsedUser);
        console.log('✅ AuthContext: User set in state');
        
        // Fetch fresh user data from server to ensure we have latest profile info
        fetchUserProfile().finally(() => {
          setLoading(false);
          console.log('✅ AuthContext: Loading complete');
        });
      } catch (error) {
        console.error('❌ Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else {
      console.log('❌ AuthContext: No token or user in localStorage');
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Login attempt:', email);
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ Login response:', response.data);
      
      const { user: userData, accessToken, token } = response.data;
      const authToken = accessToken || token; // Support both field names
      
      console.log('📦 Token received:', authToken ? 'YES' : 'NO');
      console.log('👤 User data received:', userData ? 'YES' : 'NO');
      
      if (!authToken) {
        throw new Error('No token received from server');
      }
      
      // Ensure roles is an array
      if (userData.roles && typeof userData.roles === 'string') {
        userData.roles = userData.roles.split(',').map(r => r.trim());
      }
      
      // Set default currentRole to PLAYER if not set
      if (!userData.currentRole) {
        userData.currentRole = userData.roles && userData.roles[0] ? userData.roles[0] : 'PLAYER';
      }
      
      console.log('💾 Saving to localStorage...');
      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ Saved to localStorage');
      console.log('   Token in storage:', localStorage.getItem('token') ? 'YES' : 'NO');
      console.log('   User in storage:', localStorage.getItem('user') ? 'YES' : 'NO');
      
      setUser(userData);
      console.log('✅ User set in state');
      
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
      console.error('❌ Login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { user: newUser, accessToken, token } = response.data;
      const authToken = accessToken || token; // Support both field names
      
      // Ensure roles is an array
      if (newUser.roles && typeof newUser.roles === 'string') {
        newUser.roles = newUser.roles.split(',').map(r => r.trim());
      }
      
      // Set default currentRole to PLAYER if not set
      if (!newUser.currentRole) {
        newUser.currentRole = newUser.roles && newUser.roles[0] ? newUser.roles[0] : 'PLAYER';
      }
      
      localStorage.setItem('token', authToken);
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

  // Get current role - defaults to first role in user's roles
  const getCurrentRole = () => {
    if (!user) return null;
    if (user.currentRole) return user.currentRole;
    
    // Get roles array
    const roles = Array.isArray(user.roles) ? user.roles : (user.roles ? user.roles.split(',').map(r => r.trim()) : []);
    return roles[0] || 'PLAYER';
  };

  const currentRole = getCurrentRole();

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
      currentRole,
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