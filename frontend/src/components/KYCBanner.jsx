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
    <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/40 rounded-xl p-4 mb-6 animate-pulse-slow">
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
              <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                KYC Verification Required
              </h3>
              <p className="text-gray-300 text-sm mb-3">
                Complete your KYC verification before creating your first tournament. 
                It's quick (5-10 minutes) and ensures a safe platform for everyone.
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
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-blue-500/30 transition-all text-sm"
                >
                  Learn More
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/organizer/kyc/submit')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all text-sm"
                >
                  <Shield className="w-4 h-4" />
                  Start KYC Now
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
