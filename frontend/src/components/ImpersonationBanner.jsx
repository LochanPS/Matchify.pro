import { useState, useEffect } from 'react';
import { Shield, LogOut, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ImpersonationBanner = () => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if currently impersonating by decoding the JWT token
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (token && storedUser) {
      try {
        // Decode JWT (simple base64 decode of payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        setIsImpersonating(!!payload.isImpersonating);
        
        if (payload.isImpersonating) {
          const user = JSON.parse(storedUser);
          setImpersonatedUser(user);
        }
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
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-lg border-b-2 border-amber-600">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
            <Shield className="w-5 h-5" />
            <span className="font-bold text-sm">ADMIN MODE</span>
          </div>
          <span className="font-semibold">
            Viewing: {impersonatedUser?.name || 'User'} ({impersonatedUser?.email})
          </span>
        </div>
        <button
          onClick={handleReturnToAdmin}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-bold shadow-md hover:shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Admin
        </button>
      </div>
    </div>
  );
};

export default ImpersonationBanner;
