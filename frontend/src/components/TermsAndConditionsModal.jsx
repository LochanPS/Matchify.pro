import { X, CheckCircle, AlertTriangle } from 'lucide-react';

export default function TermsAndConditionsModal({ isOpen, onAccept, onDecline }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-2xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-red-500/10 to-orange-500/10">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-orange-400" />
              Terms & Conditions
            </h2>
            <p className="text-gray-300 text-sm mt-1">Please read carefully before proceeding</p>
          </div>
          <button
            onClick={onDecline}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 text-gray-300">
          <div className="space-y-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <p className="text-red-300 font-bold">
                ⚠️ By proceeding with KYC verification, you agree to all terms and conditions listed below.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">1. Identity Verification</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-300">
                <li>You will provide accurate and truthful information</li>
                <li>You will upload a valid government-issued Aadhaar card</li>
                <li>You will verify your phone number with OTP</li>
                <li>You will participate in a video verification call if required</li>
                <li>You understand that false information may result in permanent account suspension</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-3">2. Data Privacy & Security</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-300">
                <li>Your Aadhaar details will be encrypted and stored securely on Cloudinary</li>
                <li>Your phone number will be verified and stored securely</li>
                <li>We will not share your personal information with third parties</li>
                <li>Data is used solely for verification and platform security purposes</li>
                <li>You can request data deletion by contacting support@matchify.pro</li>
                <li>We comply with Indian data protection laws and regulations</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-3">3. Organizer Responsibilities</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-300">
                <li>You will conduct tournaments fairly and professionally</li>
                <li>You will handle player registrations and payments responsibly</li>
                <li>You will provide accurate tournament information (dates, venue, fees)</li>
                <li>You will resolve disputes in good faith and follow platform guidelines</li>
                <li>You will not engage in fraudulent or deceptive practices</li>
                <li>You will maintain professional conduct with players and officials</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-3">4. Platform Rules & Policies</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-300">
                <li>You will comply with all Matchify.pro platform policies</li>
                <li>You will not engage in any fraudulent activities</li>
                <li>You understand that violations may result in account termination</li>
                <li>You agree to maintain professional conduct at all times</li>
                <li>You will not misuse the platform for illegal activities</li>
                <li>You accept that Matchify.pro reserves the right to suspend or terminate accounts</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-3">5. Payment Terms</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-300">
                <li>KYC verification requires a one-time ₹50 verification fee</li>
                <li>This fee is non-refundable under any circumstances</li>
                <li>Payment must be completed before KYC submission</li>
                <li>You will handle tournament entry fees responsibly</li>
                <li>You agree to Matchify.pro's commission structure for tournaments</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-3">6. Verification Process</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-300">
                <li>Phone verification via OTP is mandatory</li>
                <li>Aadhaar card upload is mandatory for identity verification</li>
                <li>Video call verification may be required at admin's discretion</li>
                <li>Verification typically takes 5-15 minutes</li>
                <li>Admin may reject KYC if documents are unclear, invalid, or suspicious</li>
                <li>You can resubmit KYC if rejected with valid reasons</li>
                <li>Approval is at the sole discretion of Matchify.pro admin team</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">7. Account Suspension & Termination</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-300">
                <li>Matchify.pro reserves the right to suspend accounts for policy violations</li>
                <li>Fraudulent activities will result in immediate permanent ban</li>
                <li>Multiple player complaints may lead to account review</li>
                <li>You will be notified of suspension reasons via email</li>
                <li>Appeals can be made to support@matchify.pro within 7 days</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">8. Liability & Disputes</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-300">
                <li>Matchify.pro is not liable for disputes between organizers and players</li>
                <li>You are responsible for tournament execution and player satisfaction</li>
                <li>Platform provides tools but does not guarantee tournament success</li>
                <li>Legal disputes will be resolved under Indian jurisdiction</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">9. Changes to Terms</h3>
              <ul className="space-y-2 list-disc list-inside text-gray-300">
                <li>Matchify.pro may update these terms at any time</li>
                <li>You will be notified of significant changes via email</li>
                <li>Continued use of the platform constitutes acceptance of new terms</li>
              </ul>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-2">Contact Information</h3>
              <p className="text-blue-200 text-sm">
                For questions or concerns about these terms, contact us at:
                <br />
                <strong>Email:</strong> support@matchify.pro
                <br />
                <strong>Website:</strong> www.matchify.pro
              </p>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-white/10 bg-slate-900/50">
          <div className="flex gap-4">
            <button
              onClick={onDecline}
              className="flex-1 px-6 py-4 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
            >
              Decline
            </button>
            <button
              onClick={onAccept}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              I Accept - Continue to KYC
            </button>
          </div>
          <p className="text-center text-gray-400 text-xs mt-3">
            By clicking "I Accept", you confirm that you have read and agree to all terms and conditions
          </p>
        </div>
      </div>
    </div>
  );
}
