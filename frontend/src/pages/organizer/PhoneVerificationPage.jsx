import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, ArrowLeft, Loader2, CheckCircle, AlertCircle, Upload, FileText } from 'lucide-react';
import api from '../../utils/api';

export default function PhoneVerificationPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState('upload'); // 'upload', 'phone', 'otp'
  const [phone, setPhone] = useState('');
  const [otp, setOTP] = useState('');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [aadhaarPreview, setAadhaarPreview] = useState(null);
  const [aadhaarUrl, setAadhaarUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Check if already verified
  useEffect(() => {
    checkPhoneStatus();
  }, []);
  
  const checkPhoneStatus = async () => {
    try {
      const response = await api.get('/kyc/phone-status');
      if (response.data.phoneVerified) {
        // Already verified, redirect to payment
        navigate('/organizer/kyc/payment');
      }
    } catch (err) {
      console.error('Failed to check phone status:', err);
    }
  };
  
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or PDF file');
      return;
    }
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }
    
    setAadhaarFile(file);
    setError('');
    
    // Create preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAadhaarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setAadhaarPreview(null);
    }
  };
  
  const handleUploadAadhaar = async () => {
    if (!aadhaarFile) {
      setError('Please select an Aadhaar file');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('aadhaar', aadhaarFile);
      
      const response = await api.post('/kyc/upload-aadhaar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setAadhaarUrl(response.data.imageUrl);
      setStep('phone');
      setSuccess('Aadhaar uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload Aadhaar');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitPhone = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await api.post('/kyc/submit-phone', {
        phone,
        aadhaarImageUrl: aadhaarUrl
      });
      
      setStep('otp');
      setSuccess('Phone number submitted! Admin will send OTP to your phone.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit phone number');
    } finally {
      setLoading(false);
    }
  };
  
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await api.post('/kyc/verify-otp', { otp });
      setSuccess('Phone verified successfully!');
      setTimeout(() => {
        navigate('/organizer/kyc/payment');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group mb-6"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Phone Verification</h1>
          <p className="text-gray-300">Upload Aadhaar and verify your phone number</p>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 ${step === 'upload' ? 'text-blue-400' : step === 'phone' || step === 'otp' ? 'text-green-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'upload' ? 'bg-blue-500' : step === 'phone' || step === 'otp' ? 'bg-green-500' : 'bg-gray-600'}`}>
              {step === 'phone' || step === 'otp' ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
            <span className="text-sm font-medium">Upload</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-600"></div>
          <div className={`flex items-center gap-2 ${step === 'phone' ? 'text-blue-400' : step === 'otp' ? 'text-green-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'phone' ? 'bg-blue-500' : step === 'otp' ? 'bg-green-500' : 'bg-gray-600'}`}>
              {step === 'otp' ? <CheckCircle className="w-5 h-5" /> : '2'}
            </div>
            <span className="text-sm font-medium">Phone</span>
          </div>
          <div className="w-12 h-0.5 bg-gray-600"></div>
          <div className={`flex items-center gap-2 ${step === 'otp' ? 'text-blue-400' : 'text-gray-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'otp' ? 'bg-blue-500' : 'bg-gray-600'}`}>
              3
            </div>
            <span className="text-sm font-medium">Verify</span>
          </div>
        </div>
        
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-300">{success}</p>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-300">{error}</p>
          </div>
        )}
        
        {/* Step 1: Upload Aadhaar */}
        {step === 'upload' && (
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-400" />
              Upload Aadhaar Card
            </h2>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-3">
                Select Aadhaar Card (JPG, PNG, or PDF)
              </label>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="aadhaar-upload"
              />
              <label
                htmlFor="aadhaar-upload"
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-purple-500 transition-colors bg-slate-700/30"
              >
                {aadhaarPreview ? (
                  <img src={aadhaarPreview} alt="Aadhaar preview" className="max-h-full rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-gray-400 mb-3" />
                    <p className="text-gray-300 font-medium">Click to upload Aadhaar</p>
                    <p className="text-gray-500 text-sm mt-1">JPG, PNG, or PDF (max 5MB)</p>
                  </>
                )}
              </label>
              {aadhaarFile && (
                <p className="text-green-400 text-sm mt-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  {aadhaarFile.name}
                </p>
              )}
            </div>
            
            <button
              onClick={handleUploadAadhaar}
              disabled={loading || !aadhaarFile}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Upload Aadhaar
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Step 2: Enter Phone */}
        {step === 'phone' && (
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Phone className="w-6 h-6 text-blue-400" />
              Enter Phone Number
            </h2>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-3">Phone Number</label>
              <div className="flex gap-3">
                <div className="px-4 py-4 bg-slate-700/50 text-white rounded-xl border border-white/10 font-medium">
                  +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit number"
                  maxLength={10}
                  className="flex-1 px-4 py-4 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 text-lg"
                />
              </div>
            </div>
            
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
              <p className="text-blue-300 text-sm">
                <strong>Note:</strong> Admin will manually send an OTP to this number via WhatsApp or SMS. Make sure this number is correct and accessible.
              </p>
            </div>
            
            <button
              onClick={handleSubmitPhone}
              disabled={loading || phone.length !== 10}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit Phone Number
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Step 3: Enter OTP */}
        {step === 'otp' && (
          <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Enter OTP
            </h2>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
              <p className="text-yellow-300 text-sm">
                <strong>Waiting for Admin:</strong> Admin will send a 6-digit OTP to <strong>+91 {phone}</strong> via WhatsApp or SMS. Please wait for the message.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-3 text-center">
                Enter the 6-digit OTP you received
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full px-4 py-4 bg-slate-700/50 text-white rounded-xl border border-white/10 focus:outline-none focus:border-purple-500 text-center text-3xl tracking-widest font-bold"
              />
            </div>
            
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Verify OTP
                </>
              )}
            </button>
            
            <p className="text-center text-gray-400 text-sm mt-4">
              Didn't receive OTP? Contact admin or wait for them to send it.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
