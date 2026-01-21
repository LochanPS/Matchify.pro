import { QrCodeIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { getPublicPaymentSettings } from '../../api/payment';

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
        console.error('Error fetching payment settings:', error);
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

      {/* Payment QR Code - ADMIN's QR Code */}
      {!loading && adminPaymentSettings?.qrCodeUrl && (
        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <QrCodeIcon className="h-5 w-5 text-purple-400" />
            <h4 className="text-sm font-medium text-gray-300">
              Scan QR code or use UPI ID
            </h4>
          </div>
          
          {/* QR Code Image */}
          <div className="p-4 bg-white rounded-xl inline-block mb-4">
            <img
              src={adminPaymentSettings.qrCodeUrl}
              alt="Payment QR Code"
              className="w-64 h-64 mx-auto object-contain"
            />
          </div>
          
          {/* Payment Details Below QR */}
          <div className="space-y-2 mb-4">
            <div className="bg-slate-600/50 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-gray-400">UPI ID</p>
              <p className="text-lg font-mono font-bold text-white">
                {adminPaymentSettings.upiId}
              </p>
            </div>
            
            <div className="bg-slate-600/50 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-gray-400">Account Holder</p>
              <p className="text-lg font-medium text-white">
                {adminPaymentSettings.accountHolder}
              </p>
            </div>
            
            <div className="bg-slate-600/50 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-gray-400">Amount to Pay</p>
              <p className="text-2xl font-bold text-purple-400">
                ₹{totalAmount}
              </p>
            </div>
          </div>
          
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-xs text-amber-300">
              💡 <strong>Important:</strong> Please pay exactly <strong className="text-amber-200">₹{totalAmount}</strong> and take a screenshot of the successful payment
            </p>
          </div>

          {/* Anti-Scam Notice */}
          <div className="mt-3 p-2 bg-teal-500/10 border border-teal-500/30 rounded-xl">
            <p className="text-xs text-teal-300">
              🔒 <strong>Secure Payment:</strong> All payments go to Matchify.pro. Admin will verify and pay organizer.
            </p>
          </div>
        </div>
      )}

      {/* If No QR Code - Show UPI Details Only */}
      {!loading && adminPaymentSettings && !adminPaymentSettings.qrCodeUrl && (
        <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <QrCodeIcon className="h-5 w-5 text-purple-400" />
            <h4 className="text-sm font-medium text-gray-300">
              Pay via UPI
            </h4>
          </div>
          
          {/* UPI Payment Details */}
          <div className="space-y-3">
            <div className="bg-slate-600/50 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">UPI ID</p>
              <p className="text-lg font-mono font-bold text-white">
                {adminPaymentSettings.upiId}
              </p>
            </div>
            
            <div className="bg-slate-600/50 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Account Holder</p>
              <p className="text-lg font-medium text-white">
                {adminPaymentSettings.accountHolder}
              </p>
            </div>
            
            <div className="bg-slate-600/50 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-1">Amount to Pay</p>
              <p className="text-2xl font-bold text-purple-400">
                ₹{totalAmount}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-xs text-amber-300">
              💡 Pay <strong className="text-amber-200">₹{totalAmount}</strong> to UPI ID <strong className="text-amber-200">{adminPaymentSettings.upiId}</strong>
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

      {/* No Payment Settings Message */}
      {!loading && !adminPaymentSettings && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-sm text-amber-300">
            ⚠️ Payment details not available. Please contact support.
          </p>
        </div>
      )}

      {/* Payment Instructions */}
      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
        <h4 className="text-sm font-medium text-blue-300 mb-2">How to Pay:</h4>
        <ol className="text-xs text-blue-400/80 space-y-1 list-decimal list-inside">
          <li>Scan the QR code with any UPI app (Google Pay, PhonePe, Paytm, etc.)</li>
          <li>Or manually enter UPI ID: <strong>{adminPaymentSettings?.upiId || '9742628582@slc'}</strong></li>
          <li>Pay exactly ₹{totalAmount} to {adminPaymentSettings?.accountHolder || 'Matchify.pro'}</li>
          <li>Take a screenshot of the successful payment confirmation</li>
          <li>Click "Complete Registration" below and upload the screenshot</li>
          <li>Admin will verify your payment within 24 hours</li>
        </ol>
      </div>
    </div>
  );
}
