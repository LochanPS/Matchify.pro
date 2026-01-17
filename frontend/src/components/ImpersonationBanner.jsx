import { useState, useEffect } from 'react';
import { Shield, LogOut } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ImpersonationBanner = () => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if currently impersonating by decoding the JWT token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT (simple base64 decode of payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsImpersonating(!!payload.isImpersonating);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }
  }, []);

  const handleReturnToAdmin = async () => {
    try {
      const response = await api.post('/admin/return-to-admin');
      if (response.data.success) {
        // Update token and user
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        setUser(response.data.user);
        // Navigate to admin dashboard
        navigate('/admin/dashboard');
        // Reload to ensure clean state
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to return to admin:', error);
      alert('Failed to return to admin account');
    }
  };

  if (!isImpersonating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5" />
          <span className="font-semibold">
            🔍 Admin Mode: Viewing User Account
          </span>
        </div>
        <button
          onClick={handleReturnToAdmin}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Return to Admin
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
