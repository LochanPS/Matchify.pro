import { ShieldCheckIcon, SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const KYCBanner = ({ kycStatus }) => {
  const navigate = useNavigate();

  if (kycStatus === 'APPROVED') return null;

  return (
    <div id="kyc-banner" className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 p-8 mb-8 animate-gradient-x shadow-2xl">
      {/* Pulsing alert icon */}
      <div className="absolute top-4 right-4 animate-pulse">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
          <SparklesIcon className="w-6 h-6 text-white" />
        </div>
      </div>

      <div className="flex items-start gap-6">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-lg">
            <ShieldCheckIcon className="w-12 h-12 text-white drop-shadow-lg" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-white mb-2">Complete Your KYC Verification</h2>
          <p className="text-white/90 text-lg mb-6">
            KYC verification is mandatory to create tournaments. Get verified in minutes!
          </p>

          {/* Process Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl mb-2">📱</div>
              <h3 className="font-semibold text-white mb-1">1. Phone Verify</h3>
              <p className="text-white/80 text-sm">Verify your phone number</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl mb-2">💳</div>
              <h3 className="font-semibold text-white mb-1">2. Pay ₹50</h3>
              <p className="text-white/80 text-sm">One-time verification fee</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="text-2xl mb-2">✅</div>
              <h3 className="font-semibold text-white mb-1">3. Get Approved</h3>
              <p className="text-white/80 text-sm">Start creating tournaments</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/organizer/kyc/info')}
              className="px-8 py-4 bg-white text-orange-600 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg flex items-center gap-2 text-lg"
            >
              Start KYC Now
              <ArrowRightIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/20">
              <span className="text-white font-semibold">⚡ Fast</span>
              <span className="text-white font-semibold">🔒 Secure</span>
              <span className="text-white font-semibold">💰 ₹50</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KYCBanner;
