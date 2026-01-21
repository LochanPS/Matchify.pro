import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ScaleIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Registration
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl flex items-center justify-center">
              <ScaleIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
              <p className="text-gray-400">Last Updated: January 20, 2026</p>
            </div>
          </div>
          
          <p className="text-gray-300 text-lg">
            Please read these terms carefully before using Matchify.pro
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 space-y-8">
          
          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-teal-400">1.</span> Acceptance of Terms
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
              <span className="text-teal-400">2.</span> Eligibility and Age Requirements
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
              <span className="text-teal-400">3.</span> Service Description
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
              <span className="text-teal-400">4.</span> Payment Terms
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">4.1 Payment Processing</p>
              <p>
                All tournament entry fee payments are made directly to Matchify.pro admin account via UPI. We act as an escrow service, holding funds and distributing them according to the payment schedule outlined below.
              </p>
              
              <p className="font-semibold text-white">4.2 Payment Split Structure</p>
              <p>Tournament entry fees are distributed as follows:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                <li><span className="text-teal-400 font-semibold">30%</span> - Paid to organizer before tournament starts</li>
                <li><span className="text-cyan-400 font-semibold">65%</span> - Paid to organizer after tournament completion</li>
                <li><span className="text-purple-400 font-semibold">5%</span> - Platform service fee retained by Matchify.pro</li>
              </ul>
              
              <p className="font-semibold text-white mt-4">4.3 Platform Service Fee</p>
              <p>
                Matchify.pro charges a 5% service fee on all tournament entry fees. This fee covers platform maintenance, payment processing, customer support, and technology infrastructure. The service fee is non-refundable.
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
              <span className="text-teal-400">5.</span> Refund Policy
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

        </div>

        {/* Continue to Part 2 */}
        <div className="mt-8 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-6 h-6 text-teal-400" />
            <p className="text-gray-300">
              This is page 1 of 3. Please scroll down to continue reading all terms.
            </p>
          </div>
        </div>

        {/* Part 2 */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 space-y-8 mt-8">
          
          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-teal-400">6.</span> User Obligations and Conduct
            </h2>
            <div className="text-gray-300 space-y-3 leading-relaxed">
              <p className="font-semibold text-white">6.1 Prohibited Activities</p>
              <p>You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide false, inaccurate, or misleading information</li>
                <li>Impersonate any person or entity</li>
                <li>Upload fake or manipulated payment screenshots</li>
                <li>Engage in fraudulent payment activities</li>
                <li>Create multiple accounts to abuse welcome bonuses or promotions</li>
                <li>Use the platform for any illegal activities</li>
                <li>Harass, abuse, or threaten other users</li>
                <li>Post offensive, discriminatory, or inappropriate content</li>
                <li>Attempt to hack, disrupt, or compromise platform security</li>
                <li>Scrape, copy, or reproduce platform content without permission</li>
   