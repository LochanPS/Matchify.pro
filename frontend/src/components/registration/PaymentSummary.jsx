import { QrCodeIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { getPublicPaymentSettings } from '../../api/payment';

// Helper to get proper image URL
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    return `${baseUrl}${url}`;
  }
  return url;
};

export default function PaymentSummary({ 
  selectedCategories, 
  categories,
  tournament
}) {
  const [adminPaymentSettings, setAdminPaymentSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch admin payment settings (PUBLIC endpoint)
  useEffect(() => {
    const fetchAdminPaymentSettings = async () => {
      try {
        const response = await getPublicPaymentSettings();
        setAdminPaymentSettings(response.data);
      } catch (error) {
        console.error('Error fetching admin payment settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminPaymentSettings();
  }, []);

  // Calculate total amount
  const totalAmount = selectedCategories.reduce((sum, catId) => {
    const category = categories.find(c => c.id === catId);
    return sum + (category?.entryFee || 0);
  }, 0);

  const selectedCategoryDetails = selectedCategories.map(catId => 
    categories.find(c => c.id === catId)
  ).filter(Boolean);

  // Use ADMIN's QR code instead of organizer's
  const qrImageUrl = adminPaymentSettings?.qrCodeUrl ? getImageUrl(adminPaymentSettings.qrCodeUrl) : null;

  if (selectedCategories.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Payment Summary
      </h3>

      {/* Selected Categories */}
      <div className="space-y-2 mb-4">
        {selectedCategoryDetails.map((category) => (
          <div key={category.id} className="flex justify-between text-sm">
            <span className="text-gray-400">{category.name}</span>
            <span className="font-medium text-white">₹{category.entryFee}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 pt-4 mb-4">
        <div className="flex justify-between text-lg font-bold">
          <span className="text-white">Total Amount</span>
          <span className="text-purple-400">₹{totalAmount}</span>
        </div>
      </div>

      {/* Payment QR Code - ADMIN's QR */}
      {!loading && qrImageUrl && (
        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <QrCodeIcon className="h-5 w-5 text-purple-400" />
            <h4 className="text-sm font-medium text-gray-300">
              Scan & Pay to Matchify.pro
            </h4>
          </div>
          
          <div className="p-2 bg-slate-600/50 border border-white/10 rounded-xl inline-block">
            <img
              src={qrImageUrl}
              alt="Payment QR Code"
              className="w-48 h-48 mx-auto object-contain rounded-lg"
            />
          </div>
          
          {adminPaymentSettings?.accountHolderName && (
            <p className="mt-3 text-sm font-medium text-white">
              {adminPaymentSettings.accountHolderName}
            </p>
          )}
          
          {adminPaymentSettings?.upiId && (
            <p className="text-sm text-gray-400">
              UPI: {adminPaymentSettings.upiId}
            </p>
          )}
          
          <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-xs text-amber-300">
              💡 Pay <strong className="text-amber-200">₹{totalAmount}</strong> using any UPI app
            </p>
          </div>

          {/* Anti-Scam Notice */}
          <div className="mt-3 p-2 bg-teal-500/10 border border-teal-500/30 rounded-xl">
            <p className="text-xs text-teal-300">
              🔒 <strong>Secure Payment:</strong> All payments go to Matchify.pro. Admin will pay organizer after verification.
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-sm text-gray-400 mt-2">Loading payment details...</p>
        </div>
      )}

      {/* No QR Code Message */}
      {!loading && !qrImageUrl && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-sm text-amber-300">
            ⚠️ Payment QR not available. Please contact support.
          </p>
        </div>
      )}

      {/* Payment Instructions */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h4 className="text-sm font-medium text-blue-300 mb-2">How to Pay:</h4>
        <ol className="text-xs text-blue-400/80 space-y-1 list-decimal list-inside">
          <li>Scan the QR code with any UPI app</li>
          <li>Pay ₹{totalAmount} to Matchify.pro</li>
          <li>Take a screenshot of the payment</li>
          <li>Click "Complete Registration" below</li>
          <li>Admin will verify your payment</li>
        </ol>
      </div>
    </div>
  );
}
