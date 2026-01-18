import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { submitKYC, getKYCStatus } from '../../api/kyc';

export default function KYCSubmission() {
  const navigate = useNavigate();
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Check if KYC already exists
  useEffect(() => {
    checkExistingKYC();
  }, []);

  const checkExistingKYC = async () => {
    try {
      const status = await getKYCStatus();
      if (status.status === 'APPROVED') {
        navigate('/organizer/tournaments/create');
      } else if (status.status === 'PENDING' || status.status === 'IN_PROGRESS') {
        navigate('/organizer/kyc/video-call');
      }
    } catch (err) {
      // No KYC exists, continue with submission
    }
  };

  const handleFileChange = (file) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or PDF file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setAadhaarFile(file);
    
    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null); // PDF preview not supported
    }
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
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'matchify_kyc'); // You'll need to create this preset
    formData.append('folder', 'kyc/aadhaar');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/dfg8tdgmf/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.secure_url;
  };

  const handleSubmit = async () => {
    if (!aadhaarFile) {
      setError('Please upload your Aadhaar card');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(aadhaarFile);

      // Submit KYC
      await submitKYC({
        aadhaarImageUrl: imageUrl,
        aadhaarNumber: null // Optional: can add input for last 4 digits
      });

      // Redirect to video call page
      navigate('/organizer/kyc/video-call');
    } catch (err) {
      console.error('KYC submission error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit KYC. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500/20 rounded-full mb-4">
            <FileText className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">KYC Verification</h1>
          <p className="text-gray-300 text-lg">
            Complete KYC to start organizing tournaments
          </p>
          <p className="text-purple-400 text-sm mt-2">
            ⚡ Takes only 2-5 minutes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-500 rounded-full text-white font-bold">
              1
            </div>
            <div className="w-20 h-1 bg-purple-500 mx-2"></div>
            <div className="flex items-center justify-center w-10 h-10 bg-slate-700 rounded-full text-gray-400 font-bold">
              2
            </div>
            <div className="w-20 h-1 bg-slate-700 mx-2"></div>
            <div className="flex items-center justify-center w-10 h-10 bg-slate-700 rounded-full text-gray-400 font-bold">
              3
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center mb-12 text-sm">
          <span className="text-purple-400 font-medium">Upload Aadhaar</span>
          <span className="text-gray-500 mx-8">Video Call</span>
          <span className="text-gray-500">Approved</span>
        </div>

        {/* Upload Card */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6">Upload Aadhaar Card</h2>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              dragActive
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-600 hover:border-purple-500/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,application/pdf"
              onChange={(e) => handleFileChange(e.target.files[0])}
              className="hidden"
              id="aadhaar-upload"
            />

            {preview ? (
              <div className="space-y-4">
                <img
                  src={preview}
                  alt="Aadhaar preview"
                  className="max-h-64 mx-auto rounded-lg border border-white/10"
                />
                <button
                  onClick={() => {
                    setAadhaarFile(null);
                    setPreview(null);
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Change file
                </button>
              </div>
            ) : aadhaarFile ? (
              <div className="space-y-4">
                <FileText className="w-16 h-16 text-purple-400 mx-auto" />
                <p className="text-white font-medium">{aadhaarFile.name}</p>
                <p className="text-sm text-gray-400">
                  {(aadhaarFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  onClick={() => {
                    setAadhaarFile(null);
                    setPreview(null);
                  }}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Change file
                </button>
              </div>
            ) : (
              <label htmlFor="aadhaar-upload" className="cursor-pointer block">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg font-medium text-white mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-400">
                  JPG, PNG or PDF (max 5MB)
                </p>
              </label>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Info Box */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-sm text-blue-300 mb-2 font-medium">📋 Requirements:</p>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• Clear photo of your Aadhaar card (front side)</li>
              <li>• All details must be readable</li>
              <li>• File size under 5MB</li>
              <li>• Accepted formats: JPG, PNG, PDF</li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!aadhaarFile || uploading}
            className="mt-6 w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-600 text-white py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                Submit & Continue to Video Verification
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Security Note */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            🔒 Your information is secure and will only be used for verification purposes
          </p>
        </div>
      </div>
    </div>
  );
}
