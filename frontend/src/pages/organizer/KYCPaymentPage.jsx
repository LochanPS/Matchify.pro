import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, CheckCircle, AlertCircle, CreditCard, Shield } from 'lucide-react';
import api from '../../utils/api';

export default function KYCPaymentPage() {
  const navigate = useNavigate();
  const [paymentScreenshot, setPaymentScreenshot] = useState(null);
  const [paymentScreenshotPreview, setPaymentScreenshotPreview] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setError('Only JPG and PNG files are allowed');
        return;
      }
      setPaymentScreenshot(file);
      setPaymentScreenshotPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!paymentScreenshot) {
      setError('Please upload payment screenshot');
      return;
    }
    
    if (!transactionId.trim()) {
      setError('Please enter transaction ID');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('paymentScreenshot', paymentScreenshot);
      formData.append('transactionId', transactionId);
      formData.append('amount', '50');

      await api.post('/kyc/payment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/organizer/kyc/submit');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit payment. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Payment Submitted!</h2>
          <p className="text-gray-300 mb-4">Redirecting to KYC submission...</p>
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Back Button */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-6"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-6 shadow-2xl shadow-green-500/30">
          <CreditCard className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          KYC Verification Fee
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          Pay ₹50 one-time fee to start your KYC verification process
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Payment Instructions */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Payment Instructions</h2>
            
            {/* Amount */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 mb-6">
              <p className="text-sm text-green-300 mb-2">Amount to Pay</p>
              <p className="text-5xl font-bold text-green-400">₹50</p>
              <p className="text-sm text-green-300 mt-2">One-time KYC verification fee</p>
            </div>

            {/* QR Code */}
            <div className="bg-white rounded-xl p-6 mb-6">
              <p className="text-center text-gray-800 font-semibold mb-4">Scan QR Code to Pay</p>
              <div className="flex justify-center">
                <img 
                  src="data:image/png;base64,YOUR_QR_CODE_BASE64_HERE" 
                  alt="Payment QR Code" 
                  className="w-64 h-64 object-contain"
                />
              </div>
              <p className="text-center text-sm text-gray-600 mt-4">
                Use any UPI app to scan and pay
              </p>
            </div>

            {/* Payment Details */}
            <div className="space-y-3">
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">UPI ID</p>
                <p className="text-white font-mono">YOUR_UPI_ID@paytm</p>
              </div>
              <div className="bg-slate-700/30 rounded-lg p-4">
                <p className="text-sm text-gray-400 mb-1">Account Name</p>
                <p className="text-white">Matchify.pro</p>
              </div>
            </div>

            {/* Why Fee? */}
            <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-blue-300 mb-1">Why ₹50 fee?</p>
                  <p className="text-xs text-blue-200">
                    This one-time fee covers the cost of identity verification, video call infrastructure, 
                    and ensures serious organizers only. It's a small investment for lifetime access to 
                    create unlimited tournaments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Upload Payment Proof */}
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Upload Payment Proof</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Transaction ID / UTR Number *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter 12-digit transaction ID"
                  className="w-full px-4 py-3 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-green-500 transition-colors"
                  required
                />
                <p className="text-xs text-gray-400 mt-2">
                  Find this in your payment app after completing the transaction
                </p>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Screenshot *
                </label>
                
                {!paymentScreenshotPreview ? (
                  <label className="block w-full cursor-pointer">
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-green-500/50 transition-colors">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-white font-medium mb-2">Click to upload screenshot</p>
                      <p className="text-sm text-gray-400">JPG or PNG, max 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={paymentScreenshotPreview}
                      alt="Payment Screenshot"
                      className="w-full rounded-xl border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentScreenshot(null);
                        setPaymentScreenshotPreview(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-white" />
                    </button>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading || !paymentScreenshot || !transactionId}
                className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-green-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Submit Payment & Continue
                  </>
                )}
              </button>

              <p className="text-xs text-gray-400 text-center">
                After verification, you'll be able to upload your Aadhaar and complete KYC
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
