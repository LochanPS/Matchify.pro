import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import templateService from './templateService.js';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  constructor() {
    this.from = {
      email: process.env.SENDGRID_FROM_EMAIL || 'noreply@matchify.pro',
      name: process.env.SENDGRID_FROM_NAME || 'Matchify'
    };
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    this.queue = [];
    this.isProcessing = false;
    this.stats = {
      sent: 0,
      failed: 0,
      queued: 0
    };
  }

  async send(to, subject, html, text = null, highPriority = false) {
    try {
      const msg = {
        to,
        from: this.from,
        subject,
        html,
        text: text || this.htmlToText(html)
      };

      // Add priority headers for urgent emails
      if (highPriority) {
        msg.priority = 'high';
        msg.headers = {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high'
        };
      }

      await this.addToQueue(msg);
      return { success: true };
    } catch (error) {
      console.error('❌ Email send error:', error.message);
      if (error.response) {
        console.error('SendGrid error details:', error.response.body);
      }
      return { success: false, error: error.message };
    }
  }

  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gs, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Send email using template
  async sendTemplatedEmail(to, subject, templateName, data) {
    try {
      const { html, text } = await templateService.renderBoth(templateName, {
        ...data,
        email: to
      });

      const msg = {
        to,
        from: this.from,
        subject,
        text,
        html
      };

      await this.addToQueue(msg);
      return { success: true };
    } catch (error) {
      console.error('Error sending templated email:', error);
      return { success: false, error: error.message };
    }
  }

  // Queue management
  async addToQueue(msg) {
    this.queue.push(msg);
    this.stats.queued = this.queue.length;
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      return;
    }

    this.isProcessing = true;
    const msg = this.queue.shift();
    this.stats.queued = this.queue.length;

    try {
      await sgMail.send(msg);
      this.stats.sent++;
      console.log(`✅ Email sent to ${msg.to} (${this.stats.sent} total)`);
    } catch (error) {
      this.stats.failed++;
      console.error(`❌ Email failed to ${msg.to} (${this.stats.failed} total):`, error.message);
      
      // Retry logic for rate limits
      if (error.code === 429) {
        this.queue.unshift(msg); // Put back in queue
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      }
    }

    // Process next email with delay
    setTimeout(() => this.processQueue(), 1000); // 1 second delay between emails
  }

  getStats() {
    return {
      ...this.stats,
      queued: this.queue.length
    };
  }

  // Template: Registration Confirmation
  async sendRegistrationConfirmation(user) {
    const subject = 'Welcome to Matchify.pro! 🎾';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                     color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea;
                     color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎾 Welcome to Matchify.pro!</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name},</h2>
            <p>Thank you for registering as a <strong>${user.role}</strong>!</p>
            <p>Your account is now active and ready to use. Here's what you can do:</p>
            <ul>
              ${user.role === 'PLAYER' ? `
                <li>Discover badminton tournaments in your city</li>
                <li>Register for singles and doubles categories</li>
                <li>Track your Matchify Points and climb the leaderboard</li>
                <li>Watch live matches from anywhere</li>
              ` : user.role === 'ORGANIZER' ? `
                <li>Create and manage badminton tournaments</li>
                <li>Set up multiple categories with custom rules</li>
                <li>Generate draws automatically with smart seeding</li>
                <li>Monitor registrations and revenue in real-time</li>
              ` : user.role === 'UMPIRE' ? `
                <li>Score matches with our intuitive console</li>
                <li>Award Matchify Points to winners</li>
                <li>Track match history and statistics</li>
              ` : `
                <li>Manage platform users and tournaments</li>
                <li>View audit logs and analytics</li>
                <li>Generate admin invites</li>
              `}
            </ul>
            <a href="${this.frontendUrl}/login" class="button">Get Started →</a>
            <p>If you have any questions, feel free to reach out to our support team.</p>
            <p>Best regards,<br><strong>Team Matchify</strong></p>
          </div>
          <div class="footer">
            <p>© 2025 Matchify.pro. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(user.email, subject, html);
  }

  // Template: Tournament Registration Confirmation
  async sendTournamentRegistration(registration) {
    const { user, tournament, categories, totalAmount, paymentMethod } = registration;
    
    const subject = `Registration Confirmed: ${tournament.name} 🎾`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 30px; text-align: center;
                     border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px;
                       border-left: 4px solid #10b981; }
          .category { padding: 10px; margin: 5px 0; background: #e0f2fe; border-radius: 5px; }
          .total { font-size: 20px; font-weight: bold; color: #10b981; margin: 20px 0; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981;
                     color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Registration Confirmed!</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name},</h2>
            <p>You've successfully registered for:</p>
            
            <div class="info-box">
              <h3>${tournament.name}</h3>
              <p><strong>📍 Location:</strong> ${tournament.city}, ${tournament.state}</p>
              <p><strong>📅 Dates:</strong> ${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}</p>
              <p><strong>🏟️ Venue:</strong> ${tournament.venue}</p>
            </div>
            
            <h3>Registered Categories:</h3>
            ${categories.map(cat => `
              <div class="category">
                <strong>${cat.name}</strong> (${cat.gender} • ${cat.type})<br>
                Entry Fee: ₹${cat.registrationFee}
              </div>
            `).join('')}
            
            <p class="total">Total Paid: ₹${totalAmount}</p>
            <p><strong>Payment Method:</strong> ${paymentMethod}</p>
            
            <h3>📋 Important Information:</h3>
            <ul>
              <li>Registration closes on ${new Date(tournament.registrationDeadline).toLocaleDateString()}</li>
              <li>Draws will be published 24 hours before the tournament</li>
              <li>Please arrive 30 minutes before your first match</li>
              <li>Bring valid ID proof for verification</li>
            </ul>
            
            <a href="${this.frontendUrl}/tournaments/${tournament.id}" class="button">View Tournament Details →</a>
            
            <p>Good luck and play well! 🏆</p>
            <p>Best regards,<br><strong>Team Matchify</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(user.email, subject, html);
  }

  // Template: Doubles Partner Invitation
  async sendPartnerInvitation(invitation) {
    const { inviterName, inviterEmail, partnerEmail, tournament, category, token, registrationId } = invitation;
    
    const acceptUrl = `${this.frontendUrl}/partner/confirm/${token}`;
    
    const subject = `${inviterName} invited you to play doubles at ${tournament.name}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 30px; text-align: center;
                     border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .button-group { text-align: center; margin: 30px 0; }
          .button { display: inline-block; padding: 15px 40px; margin: 0 10px;
                     text-decoration: none; border-radius: 5px; font-weight: bold; }
          .accept { background: #10b981; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤝 Doubles Partner Invitation</h1>
          </div>
          <div class="content">
            <h2>You've been invited!</h2>
            <p><strong>${inviterName}</strong> (${inviterEmail}) wants to partner with you in a doubles tournament.</p>
            
            <div class="info-box">
              <h3>Tournament Details:</h3>
              <p><strong>🎾 Tournament:</strong> ${tournament.name}</p>
              <p><strong>📂 Category:</strong> ${category.name} (${category.gender} • ${category.type})</p>
              <p><strong>📍 Location:</strong> ${tournament.city}, ${tournament.state}</p>
              <p><strong>📅 Dates:</strong> ${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}</p>
              <p><strong>💰 Entry Fee:</strong> ₹${category.registrationFee} (₹${category.registrationFee / 2} per person)</p>
            </div>
            
            <div class="button-group">
              <a href="${acceptUrl}" class="button accept">✅ Accept Invitation</a>
            </div>
            
            <p><small><strong>Note:</strong> This invitation expires in 48 hours. You'll need to complete payment after accepting.</small></p>
            
            <p>Best regards,<br><strong>Team Matchify</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(partnerEmail, subject, html);
  }

  // Template: Tournament Cancellation (Refund Notice)
  async sendTournamentCancellation(cancellation) {
    const { user, tournament, refundAmount, categories } = cancellation;
    
    const subject = `Tournament Cancelled: ${tournament.name} - Refund Issued`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 30px; text-align: center;
                     border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px;
                       border-left: 4px solid #ef4444; }
          .refund-box { background: #dcfce7; padding: 20px; margin: 20px 0; border-radius: 8px;
                         border: 2px solid #10b981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Tournament Cancelled</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name},</h2>
            <p>We regret to inform you that the following tournament has been cancelled by the organizer:</p>
            
            <div class="info-box">
              <h3>${tournament.name}</h3>
              <p><strong>Location:</strong> ${tournament.city}, ${tournament.state}</p>
              <p><strong>Original Dates:</strong> ${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}</p>
              <p><strong>Reason:</strong> ${tournament.cancellationReason || 'Not specified'}</p>
            </div>
            
            <div class="refund-box">
              <h3>💰 Full Refund Issued</h3>
              <p>Amount: <strong>₹${refundAmount}</strong></p>
              <p>Credited to your Matchify Wallet</p>
              <p>You can use this amount to register for other tournaments.</p>
            </div>
            
            <h3>Categories You Registered For:</h3>
            <ul>
              ${categories.map(cat => `<li>${cat.name} (₹${cat.registrationFee})</li>`).join('')}
            </ul>
            
            <p>We apologize for any inconvenience caused. Please check out other tournaments in your area:</p>
            <a href="${this.frontendUrl}/tournaments" style="display: inline-block; padding: 12px 30px;
                  background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Browse Tournaments →
            </a>
            
            <p>Best regards,<br><strong>Team Matchify</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(user.email, subject, html);
  }

  // Template: Draw Published
  async sendDrawPublished(notification) {
    const { user, tournament, categories } = notification;
    
    const subject = `Draw Published: ${tournament.name} - Check Your Matches! 🎾`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 30px; text-align: center;
                     border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .button { display: inline-block; padding: 12px 30px; background: #8b5cf6;
                     color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏆 Draw Published!</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name},</h2>
            <p>The draw has been published for <strong>${tournament.name}</strong>!</p>
            
            <div class="info-box">
              <h3>Your Categories:</h3>
              <ul>
                ${categories.map(cat => `
                  <li>
                    <strong>${cat.name}</strong><br>
                    Seed: #${cat.seed || 'Not seeded'}<br>
                    First Match: ${cat.firstMatchDate ? new Date(cat.firstMatchDate).toLocaleString() : 'TBA'}
                  </li>
                `).join('')}
              </ul>
            </div>
            
            <h3>📋 Next Steps:</h3>
            <ul>
              <li>Review your draw and opponent(s)</li>
              <li>Note your first match time and court number</li>
              <li>Arrive 30 minutes early for warm-up</li>
              <li>Bring valid ID proof</li>
            </ul>
            
            <a href="${this.frontendUrl}/tournaments/${tournament.id}/draws" class="button">View Draw & Matches →</a>
            
            <p>Good luck! Play your best and enjoy the tournament. 🎾</p>
            <p>Best regards,<br><strong>Team Matchify</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(user.email, subject, html);
  }

  // Template: Match Assignment (Umpire)
  async sendMatchAssignment(assignment) {
    const { umpire, match, tournament } = assignment;
    
    const subject = `Match Assignment: ${match.player1Name} vs ${match.player2Name}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 30px; text-align: center;
                     border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .match-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px;
                        border: 2px solid #f59e0b; }
          .button { display: inline-block; padding: 12px 30px; background: #f59e0b;
                     color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Match Assignment</h1>
          </div>
          <div class="content">
            <h2>Hi ${umpire.name},</h2>
            <p>You've been assigned to score the following match:</p>
            
            <div class="match-box">
              <h3>${match.player1Name} vs ${match.player2Name}</h3>
              <p><strong>🎾 Tournament:</strong> ${tournament.name}</p>
              <p><strong>📂 Category:</strong> ${match.categoryName}</p>
              <p><strong>🎲 Round:</strong> ${match.round}</p>
              <p><strong>🏟️ Court:</strong> Court ${match.courtNumber || 'TBA'}</p>
              <p><strong>📅 Date & Time:</strong> ${match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : 'TBA'}</p>
            </div>
            
            <h3>📋 Your Responsibilities:</h3>
            <ul>
              <li>Arrive 15 minutes before match time</li>
              <li>Verify player identities and attire</li>
              <li>Conduct toss and explain scoring format</li>
              <li>Score the match using Matchify console</li>
              <li>Submit final score and award Matchify Points</li>
            </ul>
            
            <a href="${this.frontendUrl}/scoring/${match.id}" class="button">Go to Scoring Console →</a>
            
            <p>Thank you for being part of Matchify! 🙏</p>
            <p>Best regards,<br><strong>Team Matchify</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(umpire.email, subject, html);
  }

  // Template: Admin Invite
  async sendAdminInvite(invite) {
    const { email, token, oneTimePassword, expiresAt, invitedBy } = invite;
    
    const acceptUrl = `${this.frontendUrl}/invite/accept/${token}`;

    const subject = '🔐 You\'ve been invited to join Matchify.pro as Admin';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center;
                     border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .credential-box { background: #fef2f2; padding: 20px; margin: 20px 0;
                             border-radius: 8px; border: 2px solid #dc2626; text-align: center; }
          .password { font-size: 24px; font-weight: bold; color: #dc2626;
                       letter-spacing: 2px; font-family: monospace; }
          .button { display: inline-block; padding: 12px 30px; background: #dc2626;
                     color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Admin Invitation</h1>
          </div>
          <div class="content">
            <h2>Welcome to the Matchify Admin Team!</h2>
            <p>You've been invited by <strong>${invitedBy}</strong> to join Matchify.pro as an administrator.</p>
            
            <div class="credential-box">
              <h3>Your One-Time Password:</h3>
              <p class="password">${oneTimePassword}</p>
              <p><small>You'll need this to accept the invitation</small></p>
            </div>
            
            <h3>⚠️ Important Information:</h3>
            <ul>
              <li>This invitation expires on ${new Date(expiresAt).toLocaleString()}</li>
              <li>The one-time password above will only work once</li>
              <li>You'll create your own secure password after accepting</li>
              <li>Admin access includes: user management, tournament oversight, audit logs</li>
            </ul>
            
            <a href="${acceptUrl}" class="button">Accept Invitation →</a>
            
            <h3>🔒 Code of Conduct:</h3>
            <p>As an admin, you're expected to:</p>
            <ul>
              <li>Act with integrity and impartiality</li>
              <li>Protect user privacy and data</li>
              <li>Document all administrative actions</li>
              <li>Report security concerns immediately</li>
            </ul>
            
            <p>If you didn't request this invitation, please ignore this email.</p>
            <p>Best regards,<br><strong>Matchify Security Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(email, subject, html);
  }

  // Template: User Suspension Notice
  async sendSuspensionNotice(suspension) {
    const { user, reason, duration, suspendedBy } = suspension;
    
    const subject = '⚠️ Your Matchify.pro account has been suspended';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc2626; color: white; padding: 30px; text-align: center;
                     border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; }
          .warning-box { background: #fef2f2; padding: 20px; margin: 20px 0;
                          border-radius: 8px; border-left: 4px solid #dc2626; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Account Suspended</h1>
          </div>
          <div class="content">
            <h2>Hi ${user.name},</h2>
            <p>Your Matchify.pro account has been temporarily suspended.</p>
            
            <div class="warning-box">
              <h3>Suspension Details:</h3>
              <p><strong>Reason:</strong> ${reason}</p>
              <p><strong>Duration:</strong> ${duration || 'Until further notice'}</p>
              <p><strong>Suspended By:</strong> ${suspendedBy}</p>
            </div>
            
            <h3>What This Means:</h3>
            <ul>
              <li>You cannot log in during the suspension period</li>
              <li>Existing registrations remain valid</li>
              <li>Refunds for paid registrations (if applicable) will be processed</li>
            </ul>
            
            <h3>📞 Appeal Process:</h3>
            <p>If you believe this suspension was made in error, please contact:</p>
            <p><strong>Email:</strong> support@matchify.pro</p>
            <p><strong>Subject:</strong> Account Suspension Appeal - ${user.email}</p>
            
            <p>We take these actions to maintain a safe and fair platform for all users.</p>
            <p>Best regards,<br><strong>Matchify Moderation Team</strong></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.send(user.email, subject, html);
  }

  // Day 60: Urgent Email Methods

  // Match Starting Soon (15-minute reminder)
  async sendMatchStartingSoon(player, match, courtNumber, opponentName) {
    const matchTime = match.scheduledTime ? new Date(match.scheduledTime).toLocaleString() : 'TBA';
    const matchUrl = `${this.frontendUrl}/matches/${match.id}`;

    const subject = '⚠️ MATCH STARTING SOON - 15 MINUTES';
    const html = `
      <div style="background: #dc2626; color: white; padding: 15px; text-align: center; font-weight: bold; font-size: 18px; border-radius: 8px 8px 0 0;">
        ⚠️ MATCH STARTING SOON - 15 MINUTES
      </div>
      <div style="background: #fff; padding: 30px; border: 3px solid #dc2626; border-top: none; border-radius: 0 0 8px 8px;">
        <h2>Hi ${player.name},</h2>
        <p><strong>Your match is about to begin!</strong> Please head to your assigned court immediately.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <div style="padding: 10px 0; border-bottom: 1px solid #fee2e2;">
            <span style="font-weight: bold; color: #991b1b;">Court Number:</span>
            <span style="float: right;"><strong>Court ${courtNumber}</strong></span>
          </div>
          <div style="padding: 10px 0; border-bottom: 1px solid #fee2e2;">
            <span style="font-weight: bold; color: #991b1b;">Opponent:</span>
            <span style="float: right;">${opponentName}</span>
          </div>
          <div style="padding: 10px 0;">
            <span style="font-weight: bold; color: #991b1b;">Scheduled Time:</span>
            <span style="float: right;">${matchTime}</span>
          </div>
        </div>
        <p><strong>⏰ Time remaining: 15 minutes</strong></p>
        <p>Make sure you have:</p>
        <ul>
          <li>✅ Your racket and shuttlecocks</li>
          <li>✅ Water bottle</li>
          <li>✅ Warmed up properly</li>
        </ul>
        <a href="${matchUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">
          View Match Details
        </a>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          <em>This is a time-sensitive notification. Please check your email regularly on tournament day.</em>
        </p>
      </div>
    `;

    return this.send(player.email, subject, html, null, true); // High priority
  }

  // Tournament Reminder (24-hour advance notice)
  async sendTournamentReminderUrgent(player, tournament) {
    const startDate = new Date(tournament.startDate).toLocaleDateString();
    const tournamentUrl = `${this.frontendUrl}/tournaments/${tournament.id}`;

    const subject = `🎾 Tournament Tomorrow - ${tournament.name}`;
    const html = `
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">🎾 Tournament Tomorrow!</h1>
        <p style="font-size: 20px; margin: 10px 0;">Get Ready!</p>
      </div>
      <div style="background: #fff; padding: 30px; border: 2px solid #3b82f6; border-top: none; border-radius: 0 0 8px 8px;">
        <h2>Hi ${player.name},</h2>
        <p><strong>${tournament.name}</strong> starts <strong>TOMORROW</strong>!</p>
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>📅 Date:</strong> ${startDate}</p>
          <p style="margin: 10px 0 0 0;"><strong>📍 Venue:</strong> ${tournament.venue || 'Check tournament details'}</p>
        </div>
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">✅ Pre-Tournament Checklist:</h3>
          <div style="padding: 10px 0; border-bottom: 1px solid #dbeafe;">🎾 Check your racket and bring backup shuttlecocks</div>
          <div style="padding: 10px 0; border-bottom: 1px solid #dbeafe;">👕 Prepare your sports attire and shoes</div>
          <div style="padding: 10px 0; border-bottom: 1px solid #dbeafe;">💧 Pack water bottle and towel</div>
          <div style="padding: 10px 0; border-bottom: 1px solid #dbeafe;">📱 Download the Matchify app for live updates</div>
          <div style="padding: 10px 0; border-bottom: 1px solid #dbeafe;">🗺️ Plan your route to the venue</div>
          <div style="padding: 10px 0;">⏰ Set an alarm to arrive 30 min early</div>
        </div>
        <a href="${tournamentUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px;">
          View Tournament Schedule
        </a>
        <p style="margin-top: 30px; font-size: 18px; color: #1f2937;">
          <strong>Good luck! 🏆</strong>
        </p>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          See you at the court tomorrow!<br>
          - Matchify Team
        </p>
      </div>
    `;

    return this.send(player.email, subject, html, null, true); // High priority
  }

  // Quick Notification (generic urgent updates)
  async sendQuickNotification(user, message, actionUrl = null) {
    const subject = 'Matchify.pro Notification';
    const fullActionUrl = actionUrl ? `${this.frontendUrl}${actionUrl}` : null;

    const html = `
      <div style="background: white; border-left: 4px solid #3b82f6; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h3>Hi ${user.name},</h3>
        <p>${message}</p>
        ${fullActionUrl ? `
          <a href="${fullActionUrl}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            View Details
          </a>
        ` : ''}
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          - Matchify Team
        </p>
      </div>
    `;

    return this.send(user.email, subject, html);
  }
}

export default new EmailService();

