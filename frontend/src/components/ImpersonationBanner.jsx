import { useState, useEffect } from 'react';
import { Shield, LogOut, ArrowLeft, AlertTriangle, X } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const ImpersonationBanner = () => {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState(null);
  const [errorModal, setErrorModal] = useState(null);
  const [isReturning, setIsReturning] = useState(false); // Add loading state
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if currently impersonating by decoding the JWT token
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    console.log('🔍 ImpersonationBanner useEffect - checking token...');
    console.log('Token exists:', !!token);
    console.log('Stored user exists:', !!storedUser);
    
    if (token && storedUser) {
      try {
        // Decode JWT (simple base64 decode of payload)
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 Token payload:', payload);
        console.log('🔍 isImpersonating:', payload.isImpersonating);
        
        setIsImpersonating(!!payload.isImpersonating);
        
        if (payload.isImpersonating) {
          const user = JSON.parse(storedUser);
          console.log('🔍 Impersonated user:', user);
          setImpersonatedUser(user);
        } else {
          console.log('🔍 Not impersonating - banner will not show');
        }
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    } else {
      console.log('🔍 No token or user - banner will not show');
    }
  }, []);

  const handleReturnToAdmin = async () => {
    if (isReturning) return; // Prevent double-clicks
    
    try {
      setIsReturning(true);
      console.log('🔄 Attempting to return to admin...');
      const response = await api.post('/admin/return-to-admin');
      console.log('✅ Response received:', response.data);
      
      if (response.data.success) {
        console.log('✅ Success! Updating localStorage and context...');
        console.log('📦 User data from response:', response.data.user);
        console.log('📦 User roles:', response.data.user.roles);
        console.log('📦 User isAdmin:', response.data.user.isAdmin);
        
        // Update token and user in localStorage
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        console.log('✅ LocalStorage updated');
        console.log('📦 Stored user:', localStorage.getItem('user'));
        
        // Update AuthContext
        updateUser(response.data.user);
        console.log('✅ AuthContext updated');
        
        console.log('✅ Redirecting to admin dashboard...');
        // Force full page reload to ensure all state is reset
        window.location.href = '/admin-dashboard';
      } else {
        console.error('❌ Response not successful:', response.data);
        setErrorModal(response.data.message || 'Unable to return to admin account. Please try again or refresh the page.');
        setIsReturning(false);
      }
    } catch (error) {
      console.error('❌ Failed to return to admin:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const errorMessage = error.response?.data?.message || error.message || 'Unable to return to admin account. Please try again or refresh the page.';
      setErrorModal(errorMessage);
      setIsReturning(false);
    }
  };

  if (!isImpersonating) return null;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-lg border-b-2 border-amber-600">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
              <Shield className="w-5 h-5" />
              <span className="font-bold text-sm">ADMIN MODE</span>
            </div>
            <span className="font-semibold">
              Viewing as: {impersonatedUser?.name || 'User'} ({impersonatedUser?.email})
            </span>
          </div>
          <button
            onClick={handleReturnToAdmin}
            disabled={isReturning}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg transition-colors font-bold shadow-md ${
              isReturning 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-white text-orange-600 hover:bg-orange-50 hover:shadow-lg'
            }`}
          >
            {isReturning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                Returning...
              </>
            ) : (
              <>
                <ArrowLeft className="w-4 h-4" />
                Return to Admin
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Modal */}
      {errorModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            {/* Halo effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500 to-rose-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-500/20">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-red-400">Matchify.pro</h3>
                <p className="text-gray-300 mt-2">{errorModal}</p>
              </div>
              <div className="p-4 bg-slate-900/50 border-t border-white/10">
                <button
                  onClick={() => setErrorModal(null)}
                  className="w-full px-4 py-3 rounded-xl font-medium transition-colors bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImpersonationBanner;
