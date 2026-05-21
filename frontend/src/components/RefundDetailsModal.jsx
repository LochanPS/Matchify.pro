import { useState, useRef } from 'react';
import { X, Upload, CheckCircle, Loader, AlertTriangle } from 'lucide-react';
import api from '../utils/api';
import { fetchUpload } from '../utils/fetchUpload';
import { toast } from 'react-hot-toast';

export default function RefundDetailsModal({ registration, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    upiId: '',
    accountName: '',
    qrCode: null
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const qrCodeInputRef = useRef(null);

  const handleQrCodeChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, qrCode: 'Please upload an image file' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, qrCode: 'File size must be less than 5MB' }));
        return;
      }
      setFormData(prev => ({ ...prev, qrCode: file }));
      setErrors(prev => ({ ...prev, qrCode: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.upiId || formData.upiId.trim().length < 5) {
      newErrors.upiId = 'Please provide a valid UPI ID';
    }
    if (!formData.accountName || formData.accountName.trim().length < 2) {
      newErrors.accountName = 'Please provide your account name';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      setSubmitting(true);
      
      const submitData = new FormData();
      submitData.append('upiId', formData.upiId.trim());
      submitData.append('accountName', formData.accountName.trim());
      if (formData.qrCode) {
        submitData.append('refundQrCode', formData.qrCode);
      }

      await fetchUpload(`/registrations/${registration.id}/submit-refund-details`, submitData);

      toast.success('Refund details submitted successfully!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting refund details:', error);
      toast.error(error.response?.data?.error || 'Failed to submit refund details');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl max-w-lg w-full">
        {/* Header - Emerald Theme */}
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Submit Refund Details</h2>
                <p className="text-emerald-100 text-sm mt-1">Refund Amount: ₹{registration.refundAmount || registration.amountTotal}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={submitting}
              className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-300 mb-4">
            Your payment was rejected for <span className="font-semibold text-white">"{registration.tournament.name}"</span>.
          </p>
          
          {registration.cancellationReason && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <p className="text-red-400 text-sm">
                <strong>Rejection Reason:</strong> {registration.cancellationReason}
              </p>
            </div>
          )}

          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <p className="text-amber-300 text-sm">
              <strong>Note:</strong> Please provide your refund details below. The admin will process your refund to the UPI ID you provide.
            </p>
          </div>

          {/* UPI ID */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Your UPI ID <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.upiId}
              onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
              placeholder="e.g., yourname@upi, 9876543210@paytm"
              className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                errors.upiId ? 'border-red-500' : 'border-white/10'
              }`}
            />
            {errors.upiId && (
              <p className="text-red-400 text-sm mt-1">{errors.upiId}</p>
            )}
          </div>

          {/* Account Name */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Account Holder Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.accountName}
              onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
              placeholder="Your full name as per bank account"
              className={`w-full px-4 py-3 bg-slate-700/50 border rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all ${
                errors.accountName ? 'border-red-500' : 'border-white/10'
              }`}
            />
            {errors.accountName && (
              <p className="text-red-400 text-sm mt-1">{errors.accountName}</p>
            )}
          </div>

          {/* QR Code Upload */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Your Payment QR Code (Optional)
            </label>
            <p className="text-gray-500 text-sm mb-2">
              Upload your UPI QR code to help the admin send the refund faster
            </p>
            <input
              type="file"
              ref={qrCodeInputRef}
              onChange={handleQrCodeChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => qrCodeInputRef.current?.click()}
              className={`w-full px-4 py-4 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 transition-all ${
                formData.qrCode 
                  ? 'border-emerald-500/50 bg-emerald-500/10' 
                  : 'border-white/20 hover:border-white/30 hover:bg-slate-700/30'
              }`}
            >
              {formData.qrCode ? (
                <>
                  <CheckCircle className="h-8 w-8 text-emerald-400" />
                  <span className="text-emerald-300 font-medium">{formData.qrCode.name}</span>
                  <span className="text-emerald-400/80 text-sm">Click to change</span>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-gray-500" />
                  <span className="text-gray-400 font-medium">Upload QR Code</span>
                  <span className="text-gray-500 text-sm">PNG, JPG up to 5MB</span>
                </>
              )}
            </button>
            {errors.qrCode && (
              <p className="text-red-400 text-sm mt-1">{errors.qrCode}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 px-4 py-3 border border-white/10 rounded-xl text-gray-300 hover:bg-slate-700/50 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.3)' }}
            >
              {submitting ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Details'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
