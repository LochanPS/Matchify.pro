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
    <div className="space-y-4">
      <div>
        <h2 
          className="text-lg font-black mb-2"
          style={{
            background: 'linear-gradient(135deg, #0891b2, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Payment QR Code <span className="text-red-400">*</span>
        </h2>
        <p className="text-gray-400 text-xs">
          Upload UPI QR so admin can pay your earnings
        </p>
      </div>

      {/* Saved Details Notice */}
      {!loadingSaved && hasSavedDetails && (
        <div className="rounded-xl p-3 flex items-start gap-2" style={{ background: 'rgba(6,182,212,0.1)', border: '1.5px solid rgba(6,182,212,0.3)' }}>
          <CheckCircleIcon className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-emerald-300">Auto-filled!</p>
            <p className="text-xs text-emerald-400/80">Saved details loaded. Upload QR code.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl p-3 text-red-400 text-xs" style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid rgba(239,68,68,0.3)' }}>
          {error}
        </div>
      )}

      {/* QR Code Upload */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-emerald-400">
          UPI Payment QR Code <span className="text-red-400">*</span>
        </label>

        {!formData.paymentQR ? (
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              dragActive 
                ? 'border-emerald-500 bg-emerald-500/10' 
                : 'border-white/20 hover:border-emerald-500/50'
            }`}
            style={{ background: 'rgba(0,0,0,0.3)' }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <QrCodeIcon className="mx-auto h-10 w-10 text-gray-500" />
            <div className="mt-3">
              <span className="text-emerald-400 hover:text-emerald-300 font-bold text-sm">
                Upload QR Code
              </span>
              <span className="text-gray-500 text-sm"> or drag</span>
            </div>
            <p className="mt-1.5 text-xs text-gray-500">
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
              alt="Payment QR"
              className="w-48 h-48 object-contain rounded-xl p-2"
              style={{ border: '1.5px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)' }}
            />
            <button
              type="button"
              onClick={removeQR}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 shadow-lg"
            >
              <TrashIcon className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* UPI ID */}
      <div>
        <label htmlFor="upiId" className="block text-xs font-bold text-cyan-400 mb-1.5">
          UPI ID <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="upiId"
          value={formData.upiId || ''}
          onChange={(e) => updateFormData('upiId', e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 transition-all"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1.5px solid rgba(6,182,212,0.3)'
          }}
          placeholder="yourname@upi"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Admin uses this to pay your earnings
        </p>
      </div>

      {/* Account Holder Name */}
      <div>
        <label htmlFor="accountHolderName" className="block text-xs font-bold text-cyan-400 mb-1.5">
          Account Holder Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="accountHolderName"
          value={formData.accountHolderName || ''}
          onChange={(e) => updateFormData('accountHolderName', e.target.value)}
          className="w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 transition-all"
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: '1.5px solid rgba(6,182,212,0.3)'
          }}
          placeholder="John Doe"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Helps admin verify payment recipient
        </p>
      </div>

      {/* Save for Future */}
      <div className="flex items-center gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,255,255,0.1)' }}>
        <input
          type="checkbox"
          id="saveForFuture"
          checked={saveForFuture}
          onChange={(e) => setSaveForFuture(e.target.checked)}
          className="w-4 h-4 rounded border-white/20 text-purple-600 focus:ring-purple-500"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        />
        <label htmlFor="saveForFuture" className="text-xs text-gray-300">
          <span className="font-bold">Save for future tournaments</span>
          <br />
          <span className="text-gray-500">Auto-fill next time</span>
        </label>
      </div>

      {/* Info Box */}
      <div className="rounded-xl p-3" style={{ background: 'rgba(168,85,247,0.1)', border: '1.5px solid rgba(168,85,247,0.3)' }}>
        <div className="flex gap-2">
          <div className="flex-shrink-0">
            <svg className="h-4 w-4 text-purple-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="text-xs font-bold text-purple-300 mb-1">How it works</h3>
            <ul className="text-xs text-gray-400 space-y-0.5">
              <li>• Players pay entry fees to admin</li>
              <li>• Admin verifies all payments</li>
              <li>• Admin uses your QR to pay earnings (30% before, 67% after)</li>
              <li>• You receive payments based on results</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4 border-t border-white/10">
        <button
          type="button"
          onClick={onPrev}
          className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{ background: 'rgba(100,116,139,0.5)', color: '#d1d5db' }}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="px-5 py-2.5 rounded-xl font-bold text-sm transition-all"
          style={{ 
            background: 'linear-gradient(135deg, #a855f7, #8b5cf6)',
            color: '#ffffff',
            boxShadow: '0 6px 20px rgba(168,85,247,0.4)'
          }}
        >
          Next: Review →
        </button>
      </div>
    </div>
  );
};

export default PaymentQRStep;
