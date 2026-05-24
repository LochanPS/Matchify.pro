import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ShieldCheckIcon, LockClosedIcon, EyeIcon } from '@heroicons/react/24/outline';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0a0a1f 0%, #07071a 30%, #0d1a2a 60%, #07071a 100%)' }}>
      {/* Header */}
      <div className="border-b relative" style={{ borderColor: 'rgba(6,182,212,0.3)', background: 'linear-gradient(135deg, rgba(7,7,26,0.95), rgba(13,26,42,0.95))' }}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 mb-6 transition-colors text-emerald-400 hover:text-emerald-300"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Registration
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)' }}>
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
              <p className="text-gray-400">Last Updated: May 6, 2026</p>
            </div>
          </div>
          
          <p className="text-gray-300 text-lg">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-2xl border p-8 space-y-8" style={{ background: 'rgba(13,26,42,0.6)', borderColor: 'rgba(6,182,212,0.2)' }}>
          
          {/* Important Notice */}
          <div className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.1))', border: '2px solid rgba(6,182,212,0.3)' }}>
            <div className="flex items-start gap-3">
              <LockClosedIcon className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <p className="text-emerald-300 font-bold mb-2">🔒 YOUR PRIVACY MATTERS</p>
                <p className="text-gray-300 text-sm">
                  This Privacy Policy explains how Matchify.pro collects, uses, stores, and protects your personal data in compliance with the Digital Personal Data Protection Act, 2023 and applicable Indian laws.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">1.</span> Information We Collect
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <div>
                <p className="font-semibold text-white mb-2">1.1 Personal Information</p>
                <p className="mb-2">When you register on Matchify.pro, we collect:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Account Information:</strong> Name, email address, phone number, date of birth, gender</li>
                  <li><strong>Profile Information:</strong> Profile photo, city, state, country</li>
                  <li><strong>Matchify Code:</strong> Your unique universal ID (e.g., #A10000)</li>
                  <li><strong>Role Information:</strong> Player, Organizer, or Umpire roles</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">1.2 Payment Information</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>UPI ID and payment screenshots</li>
                  <li>Bank account details (for refunds and payouts)</li>
                  <li>Transaction history and payment status</li>
                  <li>Wallet balance and transaction records</li>
                </ul>
                <p className="mt-2 text-sm text-yellow-300">
                  ⚠️ Note: We do NOT store your UPI PIN, bank passwords, or credit card CVV numbers.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">1.3 Tournament and Match Data</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Tournament registrations and participation history</li>
                  <li>Match scores, results, and statistics</li>
                  <li>Points earned and leaderboard rankings</li>
                  <li>Partner information for doubles matches</li>
                  <li>Umpire assignments and scoring records</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">1.4 Technical Information</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Operating system</li>
                  <li>Login timestamps and activity logs</li>
                  <li>Cookies and session data</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">1.5 Communications</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Messages sent through our platform</li>
                  <li>Support tickets and customer service interactions</li>
                  <li>Feedback and reviews</li>
                  <li>Notifications and alerts</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">2.</span> How We Use Your Information
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>We use your personal information for the following purposes:</p>
              
              <div>
                <p className="font-semibold text-white mb-2">2.1 Service Delivery</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Create and manage your account</li>
                  <li>Process tournament registrations and payments</li>
                  <li>Generate draws and match schedules</li>
                  <li>Track scores and update leaderboards</li>
                  <li>Facilitate communication between users</li>
                  <li>Send notifications about tournaments and matches</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">2.2 Payment Processing</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Verify payment screenshots</li>
                  <li>Process refunds and cancellations</li>
                  <li>Distribute payouts to organizers</li>
                  <li>Maintain wallet balances</li>
                  <li>Generate payment receipts and invoices</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">2.3 Platform Improvement</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Analyze usage patterns and trends</li>
                  <li>Improve user experience and features</li>
                  <li>Fix bugs and technical issues</li>
                  <li>Develop new features and services</li>
                  <li>Conduct research and analytics</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">2.4 Security and Fraud Prevention</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Detect and prevent fraudulent activities</li>
                  <li>Verify user identity and payment authenticity</li>
                  <li>Monitor for suspicious behavior</li>
                  <li>Enforce our Terms of Service</li>
                  <li>Protect against unauthorized access</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">2.5 Legal Compliance</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Comply with applicable laws and regulations</li>
                  <li>Respond to legal requests and court orders</li>
                  <li>Maintain audit logs and records</li>
                  <li>Resolve disputes and enforce agreements</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">3.</span> Information Sharing and Disclosure
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <div>
                <p className="font-semibold text-white mb-2">3.1 Public Information</p>
                <p className="mb-2">The following information is publicly visible on our platform:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your name and profile photo</li>
                  <li>Matchify Code (universal ID)</li>
                  <li>Tournament participation history</li>
                  <li>Match results and scores</li>
                  <li>Leaderboard rankings and points</li>
                  <li>City and state (not full address)</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">3.2 Sharing with Other Users</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Tournament Organizers:</strong> Can see registration details of participants</li>
                  <li><strong>Doubles Partners:</strong> Can see your contact information when paired</li>
                  <li><strong>Umpires:</strong> Can see player names and match details</li>
                  <li><strong>Other Players:</strong> Can see your public profile and match history</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">3.3 Third-Party Service Providers</p>
                <p className="mb-2">We may share your information with trusted third parties who help us operate our platform:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Cloud Hosting:</strong> Vercel, AWS (for hosting and storage)</li>
                  <li><strong>Database:</strong> PostgreSQL (for data storage)</li>
                  <li><strong>Image Storage:</strong> Cloudinary (for photos and screenshots)</li>
                  <li><strong>Email Service:</strong> For sending notifications</li>
                  <li><strong>SMS Service:</strong> Twilio (for SMS notifications)</li>
                  <li><strong>Analytics:</strong> For usage statistics (anonymized)</li>
                </ul>
                <p className="mt-2 text-sm text-gray-400">
                  All third-party providers are contractually obligated to protect your data and use it only for specified purposes.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">3.4 Legal Requirements</p>
                <p>We may disclose your information if required by law or in response to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Court orders or legal processes</li>
                  <li>Government or regulatory requests</li>
                  <li>Law enforcement investigations</li>
                  <li>Protection of our rights and property</li>
                  <li>Emergency situations involving safety</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">3.5 Business Transfers</p>
                <p>
                  If Matchify.pro is involved in a merger, acquisition, or sale of assets, your information may be transferred to the new entity. We will notify you before your information is transferred and becomes subject to a different privacy policy.
                </p>
              </div>

              <div className="rounded-lg p-4" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <p className="text-red-300 font-semibold mb-2">❌ WE NEVER:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Sell your personal information to third parties</li>
                  <li>Share your payment details with unauthorized parties</li>
                  <li>Use your data for purposes you haven't consented to</li>
                  <li>Share your phone number or email for marketing without permission</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">4.</span> Data Security
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>We implement industry-standard security measures to protect your personal information:</p>
              
              <div>
                <p className="font-semibold text-white mb-2">4.1 Technical Safeguards</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Encryption:</strong> All data transmitted is encrypted using HTTPS/TLS</li>
                  <li><strong>Password Protection:</strong> Passwords are hashed using bcrypt (12 rounds)</li>
                  <li><strong>Secure Storage:</strong> Data stored in secure, encrypted databases</li>
                  <li><strong>Access Controls:</strong> Role-based access restrictions</li>
                  <li><strong>Regular Backups:</strong> Automated daily backups</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">4.2 Organizational Safeguards</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Limited employee access to personal data</li>
                  <li>Confidentiality agreements with staff</li>
                  <li>Regular security audits and updates</li>
                  <li>Incident response procedures</li>
                  <li>Security awareness training</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">4.3 Your Responsibility</p>
                <p className="mb-2">You can help protect your account by:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Using a strong, unique password</li>
                  <li>Not sharing your login credentials</li>
                  <li>Logging out after using shared devices</li>
                  <li>Reporting suspicious activity immediately</li>
                  <li>Keeping your contact information updated</li>
                </ul>
              </div>

              <div className="rounded-lg p-4" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                <p className="text-amber-300 font-semibold mb-2">⚠️ IMPORTANT:</p>
                <p className="text-sm">
                  While we implement strong security measures, no system is 100% secure. We cannot guarantee absolute security of your data. Please use strong passwords and be cautious about sharing sensitive information.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">5.</span> Your Rights and Choices
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>Under the Digital Personal Data Protection Act, 2023, you have the following rights:</p>
              
              <div>
                <p className="font-semibold text-white mb-2">5.1 Access and Portability</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Request a copy of your personal data</li>
                  <li>Download your tournament history and match records</li>
                  <li>Export your data in a machine-readable format</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">5.2 Correction and Update</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Update your profile information anytime</li>
                  <li>Correct inaccurate or incomplete data</li>
                  <li>Request correction of errors in your records</li>
                </ul>
                <p className="mt-2 text-sm text-gray-400">
                  Note: Some information like name and date of birth can only be set once and cannot be changed later for security reasons.
                </p>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">5.3 Deletion</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Request deletion of your account and personal data</li>
                  <li>We will delete your data within 30 days of request</li>
                  <li>Some data may be retained for legal compliance (e.g., payment records for 7 years)</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">5.4 Consent Withdrawal</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Withdraw consent for marketing communications</li>
                  <li>Opt-out of non-essential notifications</li>
                  <li>Disable cookies (may affect functionality)</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">5.5 Complaint</p>
                <p>
                  If you believe your privacy rights have been violated, you can file a complaint with the Data Protection Board of India or contact our Data Protection Officer.
                </p>
              </div>

              <div className="rounded-lg p-4" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)' }}>
                <p className="text-emerald-300 font-semibold mb-2">📧 To Exercise Your Rights:</p>
                <p className="text-sm">
                  Email us at: <a href="mailto:privacy@matchify.pro" className="text-emerald-400 underline">privacy@matchify.pro</a><br/>
                  Or contact support through the app
                </p>
              </div>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">6.</span> Data Retention
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>We retain your personal information for as long as necessary to provide our services and comply with legal obligations:</p>
              
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Active Accounts:</strong> Data retained while account is active</li>
                <li><strong>Inactive Accounts:</strong> Deleted after 3 years of inactivity</li>
                <li><strong>Payment Records:</strong> Retained for 7 years (tax compliance)</li>
                <li><strong>Match Results:</strong> Retained permanently for historical records</li>
                <li><strong>Support Tickets:</strong> Retained for 2 years</li>
                <li><strong>Audit Logs:</strong> Retained for 1 year</li>
              </ul>

              <p className="mt-4">
                After the retention period, we securely delete or anonymize your data so it can no longer identify you.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">7.</span> Children's Privacy
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>
                Matchify.pro is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18 without verified parental consent.
              </p>
              <p>
                If you are under 18 and wish to participate as a player, your parent or legal guardian must create the account and provide consent. If we discover we have collected information from a child under 18 without proper consent, we will delete it immediately.
              </p>
              <p>
                Parents can contact us at <a href="mailto:privacy@matchify.pro" className="text-emerald-400 underline">privacy@matchify.pro</a> to review, modify, or delete their child's information.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">8.</span> Cookies and Tracking
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>We use cookies and similar technologies to improve your experience:</p>
              
              <div>
                <p className="font-semibold text-white mb-2">8.1 Types of Cookies</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Essential Cookies:</strong> Required for login and basic functionality</li>
                  <li><strong>Performance Cookies:</strong> Help us understand how you use the platform</li>
                  <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
                  <li><strong>Analytics Cookies:</strong> Collect anonymous usage statistics</li>
                </ul>
              </div>

              <div>
                <p className="font-semibold text-white mb-2">8.2 Managing Cookies</p>
                <p>
                  You can control cookies through your browser settings. However, disabling essential cookies may affect platform functionality.
                </p>
              </div>
            </div>
          </section>

          {/* Section 9 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">9.</span> Changes to Privacy Policy
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors.
              </p>
              <p>
                When we make significant changes, we will:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Update the "Last Updated" date at the top</li>
                <li>Notify you via email or platform notification</li>
                <li>Request your consent if required by law</li>
              </ul>
              <p className="mt-4">
                Your continued use of Matchify.pro after changes constitutes acceptance of the updated Privacy Policy.
              </p>
            </div>
          </section>

          {/* Section 10 */}
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-emerald-400">10.</span> Contact Us
            </h2>
            <div className="text-gray-300 space-y-4 leading-relaxed">
              <p>If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:</p>
              
              <div className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.1))', border: '2px solid rgba(6,182,212,0.3)' }}>
                <p className="font-semibold text-white mb-3">📧 Contact Information:</p>
                <ul className="space-y-2 text-sm">
                  <li><strong>Email:</strong> <a href="mailto:privacy@matchify.pro" className="text-emerald-400 underline">privacy@matchify.pro</a></li>
                  <li><strong>Support:</strong> <a href="mailto:support@matchify.pro" className="text-emerald-400 underline">support@matchify.pro</a></li>
                  <li><strong>Data Protection Officer:</strong> <a href="mailto:dpo@matchify.pro" className="text-emerald-400 underline">dpo@matchify.pro</a></li>
                  <li><strong>Address:</strong> Matchify.pro, Bangalore, Karnataka, India</li>
                </ul>
              </div>

              <p className="mt-4">
                We will respond to your inquiries within 30 days as required by the Digital Personal Data Protection Act, 2023.
              </p>
            </div>
          </section>

          {/* Acknowledgment */}
          <div className="rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.1))', border: '2px solid rgba(168,85,247,0.3)' }}>
            <p className="text-purple-300 font-semibold mb-3">✓ BY USING MATCHIFY.PRO, YOU ACKNOWLEDGE:</p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-300">
              <li>You have read and understood this Privacy Policy</li>
              <li>You consent to the collection and use of your information as described</li>
              <li>You understand your rights regarding your personal data</li>
              <li>You agree to receive necessary communications from us</li>
            </ul>
          </div>

        </div>

        {/* Back to Top */}
        <div className="mt-8 text-center">
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all"
            style={{ background: 'linear-gradient(135deg, #0891b2, #06b6d4)', color: '#003320' }}
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
