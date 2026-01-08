import { useState, useRef } from 'react';
import { QrCodeIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';

const PaymentQRStep = ({ formData, updateFormData, updateMultipleFields, onNext, onPrev }) => {
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    // Validate file size (max 5MB)
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

  const handleNext = () => {
    // Payment QR is required
    if (!formData.paymentQR) {
      setError('Please upload your UPI QR code. This is required for players to pay entry fees.');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment QR Code <span className="text-red-500">*</span></h2>
        <p className="text-gray-600">
          Upload your UPI QR code so players can scan and pay the entry fees directly to you
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* QR Code Upload */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          UPI Payment QR Code <span className="text-red-500">*</span>
        </label>

        {!formData.paymentQR ? (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <QrCodeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Upload QR Code
              </button>
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
              className="w-64 h-64 object-contain border rounded-lg bg-white p-2"
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
        <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-2">
          UPI ID (Optional)
        </label>
        <input
          type="text"
          id="upiId"
          value={formData.upiId || ''}
          onChange={(e) => updateFormData('upiId', e.target.value)}
          className="input"
          placeholder="e.g., yourname@upi or 9876543210@paytm"
        />
        <p className="mt-1 text-sm text-gray-500">
          Players can also pay using this UPI ID directly
        </p>
      </div>

      {/* Account Holder Name */}
      <div>
        <label htmlFor="accountHolderName" className="block text-sm font-medium text-gray-700 mb-2">
          Account Holder Name (Optional)
        </label>
        <input
          type="text"
          id="accountHolderName"
          value={formData.accountHolderName || ''}
          onChange={(e) => updateFormData('accountHolderName', e.target.value)}
          className="input"
          placeholder="e.g., John Doe"
        />
        <p className="mt-1 text-sm text-gray-500">
          This helps players verify they're paying to the right person
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">How it works</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Players will see this QR code when registering for your tournament</li>
                <li>They can scan and pay the entry fee directly to your account</li>
                <li>After payment, they'll upload the payment screenshot for verification</li>
                <li>You can verify payments from your organizer dashboard</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t">
        <button
          type="button"
          onClick={onPrev}
          className="btn-secondary"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="btn-primary"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default PaymentQRStep;
