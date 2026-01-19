import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, ArrowRight, X, CheckCircle, Clock, Video } from 'lucide-react';
import { useState } from 'react';

export default function KYCBanner({ onDismiss }) {
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (dismissed) return null;

  return (
    <div className="relative mb-8 overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 animate-gradient-x"></div>
      
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/50 via-orange-500/50 to-amber-500/50 blur-xl"></div>
      
      {/* Content Container */}
      <div className="relative bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 border-4 border-amber-500/80 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
        {/* Pulsing Alert Icon */}
        <div className="absolute top-4 right-4">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
            <div className="relative w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-lg">
              <AlertCircle className="w-7 h-7 text-white animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-6 pr-16">
          {/* Large Icon */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute -inset-2 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur-lg opacity-75 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Shield className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title with Animation */}
            <h3 className="text-3xl font-black text-white mb-3 flex items-center gap-3 animate-pulse">
              <span className="text-4xl">⚠️</span>
              KYC Verification Required
            </h3>
            
            <p className="text-white/90 text-lg mb-4 font-semibold leading-relaxed">
              Complete your KYC verification to unlock tournament creation! 
              <span className="text-amber-300"> Quick, secure, and required for all organizers.</span>
            </p>

            {/* Process Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-white">Step 1</h4>
                </div>
                <p className="text-sm text-white/80">Upload documents & pay ₹50 KYC fee</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-white">Step 2</h4>
                </div>
                <p className="text-sm text-white/80">Quick video verification call</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:bg-white/15 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <h4 className="font-bold text-white">Step 3</h4>
                </div>
                <p className="text-sm text-white/80">Get approved in 5-10 minutes</p>
              </div>
            </div>

            {/* Features Tags */}
            <div className="flex flex-wrap gap-3 mb-6">
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 px-4 py-2 rounded-full text-sm font-bold text-green-300">
                ⚡ Fast Process
              </span>
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/50 px-4 py-2 rounded-full text-sm font-bold text-blue-300">
                🔒 100% Secure
              </span>
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 px-4 py-2 rounded-full text-sm font-bold text-purple-300">
                ✅ Instant Approval
              </span>
              <span className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/50 px-4 py-2 rounded-full text-sm font-bold text-amber-300">
                💰 Only ₹50
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => navigate('/organizer/kyc/info')}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-xl font-black text-lg hover:bg-gray-100 transition-all shadow-2xl hover:shadow-white/50 hover:scale-105"
              >
                <span className="text-2xl">📚</span>
                Learn More About KYC
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={() => navigate('/organizer/kyc/info')}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white rounded-xl font-black text-lg hover:shadow-2xl hover:shadow-green-500/50 transition-all hover:scale-105 animate-pulse"
              >
                <Shield className="w-6 h-6" />
                Start KYC Now
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                  Required!
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-lg transition-colors group"
          title="Dismiss (you'll see this again)"
        >
          <X className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
}
