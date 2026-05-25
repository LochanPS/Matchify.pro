import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ScaleIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const TermsOfService = () => {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #050810 30%, #0d1a2a 60%, #050810 100%)' }}>
      {/* Header */}
      <div className="border-b relative" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'linear-gradient(135deg, rgba(7,7,26,0.95), rgba(13,26,42,0.95))' }}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 mb-6 transition-colors text-emerald-400 hover:text-emerald-300"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Registration
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)' }}>
              <ScaleIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
              <p className="text-gray-400">Last Updated: May 6, 2026</p>
            </div>
          </div>
          
          <p className="text-gray-300 text-lg">
            Please read these terms carefully before using Matchify.pro
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-2xl border p-8 space-y-8" style={{ background: 'rgba(13,26,42,0.6)', borderColor: 'rgba(245,158,11,0.2)' }}>
          
          {/* Important Notice */}
          <div className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.1))', border: '2px solid rgba(245,158,11,0.3)' }}>
            <div className="flex items-start gap-3">
              <ShieldCheckIcon className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-emerald-300 font-bold mb-2">⚖️ LEGAL AGREEMENT</p>
                <p className="text-gray-300 text-sm">
                  By using Matchify.pro, you agree to these Terms of Service. Please read carefully before creating an account or using our platform.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">1.</span> Acceptance of Terms
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p>
                By accessing and using Matchify.pro, you accept and agree to be bound by these Terms of Service. If you do not agree to these Terms, please do not use our Platform.
              </p>
              <p>
                Matchify.pro is operated by P S Lochan and provides badminton tournament management services including tournament creation, player registration, match scheduling, scoring, and payment facilitation.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">2.</span> Eligibility and Age Requirements
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">2.1 Age Requirement</p>
              <p>
                You must be at least 18 years old to create an account, make payments, organize tournaments, or act as an umpire on Matchify.pro. Users under 18 may participate as players only with verified parental or guardian consent.
              </p>
              
              <p className="font-semibold text-white">2.2 Account Registration</p>
              <p>
                You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account.
              </p>
              
              <p className="font-semibold text-white">2.3 Multiple Roles</p>
              <p>
                Each user account is automatically granted three roles: Player, Organizer, and Umpire. You may switch between these roles at any time from your dashboard. You are responsible for complying with the obligations specific to each role you use.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">3.</span> Service Description
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">3.1 Platform Services</p>
              <p>Matchify.pro provides the following services:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Tournament creation and management tools for organizers</li>
                <li>Player registration and payment processing facilitation</li>
                <li>Match scheduling, draw generation, and bracket management</li>
                <li>Live scoring and match tracking</li>
                <li>Umpire assignment and scoring console</li>
                <li>Points and leaderboard system</li>
                <li>Payment verification and payout management</li>
                <li>Notification and communication system</li>
              </ul>
              
              <p className="font-semibold text-white mt-4">3.2 Platform Role</p>
              <p>
                Matchify.pro acts as an intermediary platform connecting tournament organizers, players, and umpires. We facilitate payments but do not organize tournaments ourselves. Tournament organizers are independent entities responsible for their tournaments.
              </p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">4.</span> Payment Terms
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">4.1 Payment Processing</p>
              <p>
                All tournament entry fee payments are made directly to Matchify.pro admin account via UPI. We act as an escrow service, holding funds and distributing them according to the payment schedule outlined below.
              </p>
              
              <p className="font-semibold text-white">4.2 Payment Split Structure</p>
              <p>Tournament entry fees are distributed as follows:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 rounded-lg p-4" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <li><span className="text-emerald-400 font-semibold">30%</span> - Paid to organizer before tournament starts</li>
                <li><span className="text-cyan-400 font-semibold">67%</span> - Paid to organizer after tournament completion</li>
                <li><span className="text-purple-400 font-semibold">3%</span> - Platform service fee retained by Matchify.pro</li>
              </ul>
              
              <p className="font-semibold text-white mt-4">4.3 Platform Service Fee</p>
              <p>
                Matchify.pro charges a 3% service fee on all tournament entry fees. This fee covers platform maintenance, payment processing, customer support, and technology infrastructure. The service fee is non-refundable.
              </p>
              
              <p className="font-semibold text-white">4.4 Payment Verification</p>
              <p>
                All payments are manually verified by our admin team. Players must upload valid payment screenshots showing the transaction details. Verification typically takes 2-24 hours. Registration is confirmed only after payment approval.
              </p>
              
              <p className="font-semibold text-white">4.5 Payment Methods</p>
              <p>
                We currently accept payments via UPI only. Players must pay to the admin UPI ID displayed during registration. Payments to any other account will not be accepted.
              </p>
              
              <p className="font-semibold text-white">4.6 GST and Taxes</p>
              <p>
                All fees displayed are inclusive of applicable taxes. If GST becomes applicable, it will be added to the platform service fee and clearly disclosed.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">5.</span> Refund Policy
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">5.1 Tournament Cancellation by Organizer</p>
              <p>
                If a tournament is cancelled by the organizer before it starts, players will receive a 100% refund of their entry fee. Refunds will be processed within 7-14 business days.
              </p>
              
              <p className="font-semibold text-white">5.2 Player Cancellation</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><span className="font-semibold">More than 7 days before tournament:</span> 80% refund</li>
                <li><span className="font-semibold">3-7 days before tournament:</span> 50% refund</li>
                <li><span className="font-semibold">Less than 3 days before tournament:</span> No refund</li>
              </ul>
              
              <p className="font-semibold text-white mt-4">5.3 Payment Rejection</p>
              <p>
                If your payment is rejected by admin for reasons such as wrong account, invalid proof, or duplicate payment, you will receive a 100% refund within 7 business days. You may also be given the option to correct and resubmit payment.
              </p>
              
              <p className="font-semibold text-white">5.4 Insufficient Payment</p>
              <p>
                If you paid less than the required entry fee, you will be notified to pay the remaining amount. Your registration will remain pending until full payment is received. No refund is provided for partial payments unless you request cancellation.
              </p>
              
              <p className="font-semibold text-white">5.5 Tournament Postponement</p>
              <p>
                If a tournament is postponed, players may choose to either transfer their registration to the new date or request a full refund.
              </p>
              
              <p className="font-semibold text-white">5.6 Refund Process</p>
              <p>
                To request a refund, contact our support team with your registration details and bank account or UPI information. Refunds are processed via UPI or bank transfer to the original payment source when possible.
              </p>
              
              <p className="font-semibold text-white">5.7 Non-Refundable Situations</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Player disqualification due to rule violations</li>
                <li>Player no-show on tournament day</li>
                <li>Tournament completed successfully</li>
                <li>Platform service fee after tournament starts</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">6.</span> User Obligations and Conduct
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">6.1 Prohibited Activities</p>
              <p>You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide false, inaccurate, or misleading information</li>
                <li>Impersonate any person or entity</li>
                <li>Upload fake or manipulated payment screenshots</li>
                <li>Engage in fraudulent payment activities</li>
                <li>Create multiple accounts to abuse promotions</li>
                <li>Use the platform for any illegal activities</li>
                <li>Harass, abuse, or threaten other users</li>
                <li>Post offensive, discriminatory, or inappropriate content</li>
                <li>Attempt to hack, disrupt, or compromise platform security</li>
                <li>Scrape, copy, or reproduce platform content without permission</li>
              </ul>
              
              <p className="font-semibold text-white mt-4">6.2 Account Security</p>
              <p>You are responsible for:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Maintaining the confidentiality of your password</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized access</li>
                <li>Logging out after each session on shared devices</li>
              </ul>
              
              <p className="font-semibold text-white mt-4">6.3 Content Standards</p>
              <p>
                All content you upload (profile photos, payment screenshots, messages) must comply with applicable laws and must not contain offensive, illegal, or inappropriate material.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">7.</span> Intellectual Property
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">7.1 Platform Ownership</p>
              <p>
                All content, features, and functionality of Matchify.pro, including but not limited to text, graphics, logos, icons, images, audio clips, video clips, data compilations, and software, are the exclusive property of Matchify.pro and are protected by copyright, trademark, and other intellectual property laws.
              </p>
              
              <p className="font-semibold text-white">7.2 User Content</p>
              <p>
                You retain ownership of content you upload. By uploading content, you grant Matchify.pro a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content for the purpose of providing our services.
              </p>
              
              <p className="font-semibold text-white">7.3 Restrictions</p>
              <p>You may not:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Copy, modify, or distribute platform content without permission</li>
                <li>Reverse engineer or decompile any platform software</li>
                <li>Remove or alter any copyright, trademark, or proprietary notices</li>
                <li>Use our trademarks or branding without written consent</li>
              </ul>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">8.</span> Limitation of Liability
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">8.1 Platform Availability</p>
              <p>
                We strive to provide uninterrupted service but do not guarantee that the platform will be available at all times. We are not liable for any downtime, service interruptions, or technical issues.
              </p>
              
              <p className="font-semibold text-white">8.2 Tournament Disputes</p>
              <p>
                Matchify.pro is not responsible for disputes between players, organizers, or umpires. We act as a facilitator only. Any disputes regarding tournament rules, match results, or conduct must be resolved between the parties involved.
              </p>
              
              <p className="font-semibold text-white">8.3 Third-Party Actions</p>
              <p>
                We are not liable for the actions, conduct, or content of tournament organizers, players, or umpires. Each user is responsible for their own actions and compliance with applicable laws.
              </p>
              
              <p className="font-semibold text-white">8.4 Maximum Liability</p>
              <p>
                To the maximum extent permitted by law, our total liability to you for any claims arising from your use of the platform shall not exceed the amount you paid to us in the 12 months preceding the claim.
              </p>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">9.</span> Termination
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">9.1 Termination by You</p>
              <p>
                You may terminate your account at any time by contacting our support team. Upon termination, you will lose access to all platform features and your data may be deleted.
              </p>
              
              <p className="font-semibold text-white">9.2 Termination by Us</p>
              <p>We may suspend or terminate your account if:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>You violate these Terms of Service</li>
                <li>You engage in fraudulent or illegal activities</li>
                <li>Your account has been inactive for an extended period</li>
                <li>We are required to do so by law</li>
              </ul>
              
              <p className="font-semibold text-white mt-4">9.3 Effect of Termination</p>
              <p>
                Upon termination, your right to use the platform will immediately cease. We may retain certain information as required by law or for legitimate business purposes.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">10.</span> Governing Law and Dispute Resolution
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">10.1 Governing Law</p>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>
              
              <p className="font-semibold text-white">10.2 Jurisdiction</p>
              <p>
                Any disputes arising from these Terms or your use of the platform shall be subject to the exclusive jurisdiction of the courts in Bangalore, Karnataka, India.
              </p>
              
              <p className="font-semibold text-white">10.3 Dispute Resolution</p>
              <p>
                Before filing any legal action, you agree to attempt to resolve disputes through good faith negotiation with our support team. If resolution cannot be reached within 30 days, either party may pursue legal remedies.
              </p>
            </div>
          </section>

          {/* Section 11 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">11.</span> Changes to Terms
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p>
                We reserve the right to modify these Terms at any time. When we make significant changes, we will notify you via email or platform notification. Your continued use of the platform after changes constitutes acceptance of the updated Terms.
              </p>
              <p>
                We recommend reviewing these Terms periodically to stay informed of any updates.
              </p>
            </div>
          </section>

          {/* Section 12 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">12.</span> Contact Information
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p>If you have questions about these Terms of Service, please contact us:</p>
              
              <div className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.1))', border: '2px solid rgba(245,158,11,0.3)' }}>
                <p className="font-semibold text-white mb-3">📧 Contact Information:</p>
                <ul className="space-y-2 text-sm">
                  <li><strong>Email:</strong> <a href="mailto:support@matchify.pro" className="text-emerald-400 underline">support@matchify.pro</a></li>
                  <li><strong>Legal:</strong> <a href="mailto:legal@matchify.pro" className="text-emerald-400 underline">legal@matchify.pro</a></li>
                  <li><strong>Address:</strong> Matchify.pro, Bangalore, Karnataka, India</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Acknowledgment */}
          <div className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.1))', border: '2px solid rgba(168,85,247,0.3)' }}>
            <p className="text-purple-300 font-semibold mb-3">✓ BY USING MATCHIFY.PRO, YOU ACKNOWLEDGE:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
              <li>You have read and understood these Terms of Service</li>
              <li>You agree to be bound by these Terms</li>
              <li>You are legally capable of entering into this agreement</li>
              <li>You will comply with all applicable laws and regulations</li>
            </ul>
          </div>

        </div>

        {/* Back to Registration */}
        <div className="mt-8 text-center">
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #D97706, #F59E0B)', color: '#050810' }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

