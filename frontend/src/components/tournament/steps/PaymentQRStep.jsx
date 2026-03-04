import { useState, useRef, useEffect } from 'react';
import { QrCodeIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../../../utils/api';

const PaymentQRStep = ({ formData, updateFormData, updateMultipleFields, onNext, onPrev }) => {
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [hasSavedDetails, setHasSavedDetails] = useState(false);
  const [saveForFuture, setSaveForFuture] = useState(true);
  const fileInputRef = useRef(null);

  // Fetch saved payment details on mount
  useEffect(() => {
    fetchSavedPaymentDetails();
  }, []);

  const fetchSavedPaymentDetails = async () => {
    try {
      setLoadingSaved(true);
      const response = await api.get('/organizer/payment-details');
      const { upiId, accountHolderName, paymentQRUrl } = response.data.data;
      
      if (upiId || accountHolderName || paymentQRUrl) {
        setHasSavedDetails(true);
        
        // Auto-fill if form is empty
        if (!formData.upiId && upiId) {
          updateFormData('upiId', upiId);
        }
        if (!formData.accountHolderName && accountHolderName) {
          updateFormData('accountHolderName', accountHolderName);
        }
        // Note: QR image needs to be re-uploaded each time for security
      }
    } catch (error) {
      console.error('Error fetching saved payment details:', error);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError('');
    const preview = URL.createObjectURL(file);
    updateFormData('paymentQR', { file, preview });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeQR = () => {
    if (formData.paymentQR?.preview) {
      URL.revokeObjectURL(formData.paymentQR.preview);
    }
    updateFormData('paymentQR', null);
  };

  const savePaymentDetails = async () => {
    try {
      await api.put('/organizer/payment-details', {
        upiId: formData.upiId,
        accountHolderName: formData.accountHolderName,
      });
    } catch (error) {
      console.error('Error saving payment details:', error);
    }
  };

  const handleNext = async () => {
    // Payment QR is required
    if (!formData.paymentQR) {
      setError('Please upload your UPI QR code. This is required for admin to pay your tournament earnings.');
      return;
    }
    // UPI ID is required
    if (!formData.upiId || !formData.upiId.trim()) {
      setError('UPI ID is required for admin to make payments to you.');
      return;
    }
    // Account Holder Name is required
    if (!formData.accountHolderName || !formData.accountHolderName.trim()) {
      setError('Account Holder Name is required so admin can verify the payment recipient.');
      return;
    }

    // Save for future if checked
    if (saveForFuture) {
      await savePaymentDetails();
    }

    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Payment QR Code <span className="text-red-500">*</span></h2>
        <p className="text-gray-400">
          Upload your UPI QR code so the admin can scan and pay your tournament earnings directly to you
        </p>
      </div>

      {/* Saved Details Notice */}
      {!loadingSaved && hasSavedDetails && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
          <CheckCircleIcon className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-emerald-300">Payment details auto-filled!</p>
            <p className="text-sm text-emerald-400/80">We've filled in your saved UPI ID and account holder name. You still need to upload the QR code.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
          {error}
        </div>
      )}

      {/* QR Code Upload */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300">
          UPI Payment QR Code <span className="text-red-500">*</span>
        </label>

        {!formData.paymentQR ? (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
              dragActive 
                ? 'border-purple-500 bg-purple-500/10' 
                : 'border-white/20 hover:border-purple-500/50 hover:bg-purple-500/10 bg-slate-700/30'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <QrCodeIcon className="mx-auto h-12 w-12 text-gray-500" />
            <div className="mt-4">
              <span className="text-purple-400 hover:text-purple-300 font-medium">
                Upload QR Code
              </span>
              <span className="text-gray-500"> or drag and drop</span>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              PNG, JPG up to 5MB
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        ) : (
          <div className="relative inline-block">
            <img
              src={formData.paymentQR.preview}
              alt="Payment QR Code"
              className="w-64 h-64 object-contain border-2 border-white/10 rounded-xl bg-slate-700/50 p-2"
            />
            <button
              type="button"
              onClick={removeQR}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* UPI ID */}
      <div>
        <label htmlFor="upiId" className="block text-sm font-medium text-gray-300 mb-2">
          UPI ID <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="upiId"
          value={formData.upiId || ''}
          onChange={(e) => updateFormData('upiId', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          placeholder="e.g., yourname@upi or 9876543210@paytm"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Admin will use this UPI ID to pay your tournament earnings
        </p>
      </div>

      {/* Account Holder Name */}
      <div>
        <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-300 mb-2">
          Account Holder Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="accountHolderName"
          value={formData.accountHolderName || ''}
          onChange={(e) => updateFormData('accountHolderName', e.target.value)}
          className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          placeholder="e.g., John Doe"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          This helps admin verify they're paying to the right person
        </p>
      </div>

      {/* Save for Future */}
      <div className="flex items-center gap-3 p-4 bg-slate-700/30 border border-white/10 rounded-xl">
        <input
          type="checkbox"
          id="saveForFuture"
          checked={saveForFuture}
          onChange={(e) => setSaveForFuture(e.target.checked)}
          className="w-5 h-5 rounded border-white/20 bg-slate-700 text-purple-600 focus:ring-purple-500"
        />
        <label htmlFor="saveForFuture" className="text-sm text-gray-300">
          <span className="font-medium">Save payment details for future tournaments</span>
          <br />
          <span className="text-gray-500">UPI ID and account holder name will be auto-filled next time</span>
        </label>
      </div>

      {/* Info Box */}
      <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-300">How it works</h3>
            <div className="mt-2 text-sm text-gray-400">
              <ul className="list-disc list-inside space-y-1">
                <li>Players pay entry fees to the admin account first</li>
                <li>Admin collects all payments and verifies them</li>
                <li>Admin uses your QR code to pay your tournament earnings (30% before, 65% after)</li>
                <li>You receive payments directly from admin based on the tournament results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={onPrev}
          className="px-6 py-3 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors font-medium"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all font-semibold"
        >
          Next: Review →
        </button>
      </div>
    </div>
  );
};

export default PaymentQRStep;
