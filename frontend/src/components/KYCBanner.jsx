import { useNavigate } from 'react-router-dom';
import { Shield, AlertCircle, ArrowRight, X } from 'lucide-react';
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
    <div className="bg-gradient-to-r from-red-500/30 via-orange-500/30 to-amber-500/30 border-2 border-red-500/60 rounded-xl p-6 mb-6 shadow-2xl shadow-red-500/20">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-red-400 animate-pulse" />
                ⚠️ KYC Verification Required Before Creating Tournaments
              </h3>
              <p className="text-white text-base mb-4 font-medium">
                You must complete KYC verification before you can create your first tournament. 
                This is a quick 5-10 minute process to ensure platform safety.
              </p>
              
              {/* Features */}
              <div className="flex flex-wrap gap-3 mb-3">
                <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-white">
                  ⚡ Fast (5-10 min)
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-white">
                  🎥 Video Call
                </span>
                <span className="inline-flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full text-xs font-medium text-white">
                  ✅ Instant Approval
                </span>
              </div>

              {/* Buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/organizer/kyc/info')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 rounded-lg font-bold hover:bg-gray-100 transition-all text-base shadow-lg"
                >
                  📚 Learn More About KYC
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => navigate('/organizer/kyc/payment')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:shadow-xl hover:shadow-green-500/50 transition-all text-base"
                >
                  <Shield className="w-5 h-5" />
                  Start KYC Verification Now
                </button>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
              title="Dismiss"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
