import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Video, CheckCircle, Clock, FileText, AlertCircle } from 'lucide-react';

export default function KYCInfoPage() {
  const navigate = useNavigate();

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
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-600 rounded-2xl mb-6 shadow-2xl shadow-red-500/50 animate-pulse">
          <Shield className="w-10 h-10 text-white" />
        </div>
        <div className="bg-red-500/20 border-2 border-red-500/60 rounded-xl p-4 mb-6 inline-block">
          <p className="text-red-300 font-bold text-lg">⚠️ COMPULSORY REQUIREMENT ⚠️</p>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          KYC Verification is Mandatory
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto">
          You <strong className="text-red-400">MUST</strong> complete KYC verification before creating any tournament on Matchify.pro
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        {/* Why KYC Required */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Why is KYC Required?</h2>
              <p className="text-gray-300 leading-relaxed">
                KYC (Know Your Customer) verification helps us maintain a safe and trustworthy platform. 
                It ensures that all tournament organizers are verified individuals, protecting both players 
                and the integrity of our platform.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="bg-slate-700/30 rounded-xl p-4 border border-white/5">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                <Shield className="w-5 h-5 text-green-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Trust & Safety</h3>
              <p className="text-sm text-gray-400">Verified organizers build player confidence</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4 border border-white/5">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Compliance</h3>
              <p className="text-sm text-gray-400">Meet legal and regulatory requirements</p>
            </div>
            <div className="bg-slate-700/30 rounded-xl p-4 border border-white/5">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white mb-2">Accountability</h3>
              <p className="text-sm text-gray-400">Ensures responsible tournament management</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Video className="w-7 h-7 text-purple-400" />
            How KYC Verification Works
          </h2>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Upload Aadhaar Card</h3>
                <p className="text-gray-400">
                  Upload a clear photo of your Aadhaar card (front side). We accept JPG, PNG, or PDF files up to 5MB.
                </p>
                <div className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-sm text-blue-300">
                    <strong>Tip:</strong> Make sure the photo is clear and all details are readable
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Quick Video Call (2-3 minutes)</h3>
                <p className="text-gray-400">
                  Join a short video call with our admin team. They'll verify your identity by comparing your face with the Aadhaar photo.
                </p>
                <div className="mt-3 bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                  <p className="text-sm text-purple-300">
                    <strong>Note:</strong> Make sure you have a working camera and are in a well-lit area
                  </p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Instant Approval</h3>
                <p className="text-gray-400">
                  Once verified, you'll receive instant approval and can immediately start creating tournaments!
                </p>
                <div className="mt-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-sm text-green-300">
                    <strong>Fast:</strong> The entire process takes only 5-10 minutes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Estimate */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Clock className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-1">Total Time: 5-10 Minutes</h3>
              <p className="text-amber-200">
                Upload Aadhaar (1 min) + Video Call (2-3 min) + Approval (Instant)
              </p>
            </div>
          </div>
        </div>

        {/* What You Need */}
        <div className="bg-slate-800/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">What You Need</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-white">Aadhaar Card</p>
                <p className="text-sm text-gray-400">Clear photo or scan of your Aadhaar</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-white">Working Camera</p>
                <p className="text-sm text-gray-400">For the video verification call</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-white">Good Internet</p>
                <p className="text-sm text-gray-400">Stable connection for video call</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-white">5-10 Minutes</p>
                <p className="text-sm text-gray-400">Quick and easy process</p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Your Privacy is Protected</h3>
              <p className="text-gray-300 mb-3">
                We take your privacy seriously. Your Aadhaar details are encrypted and stored securely. 
                We only use this information for verification purposes and never share it with third parties.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  End-to-end encryption
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Secure cloud storage (Cloudinary)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  No data sharing with third parties
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  Compliant with data protection laws
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/organizer/kyc/payment')}
            className="flex-1 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-green-500/30 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-6 h-6" />
            Start KYC Verification
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-4 bg-slate-700 text-white rounded-xl font-medium hover:bg-slate-600 transition-colors"
          >
            Maybe Later
          </button>
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-400 text-sm mt-6">
          Need help? Contact us at{' '}
          <a href="mailto:support@matchify.pro" className="text-blue-400 hover:text-blue-300">
            support@matchify.pro
          </a>
        </p>
      </div>
    </div>
  );
}
