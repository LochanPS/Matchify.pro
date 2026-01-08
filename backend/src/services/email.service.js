import nodemailer from 'nodemailer';

// Create transporter
let transporter = null;

// Initialize email service
const initEmailService = () => {
  // Check if email credentials are provided
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    console.log('✅ Email service initialized');
  } else {
    console.log('⚠️  Email service not configured (will log emails to console)');
  }
};

// Send email
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    // Always log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n📧 EMAIL LOG:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Body:', text || html.substring(0, 200) + '...');
      console.log('---\n');
    }

    if (transporter) {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Matchify.pro" <noreply@matchify.pro>',
        to,
        subject,
        text,
        html,
      });
      console.log('✅ Email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } else {
      // Log email to console if service not configured
      console.log('⚠️  Email not sent (service not configured)');
      return { success: true, messageId: 'console-log' };
    }
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    // Still return success in development so the flow continues
    if (process.env.NODE_ENV !== 'production') {
      console.log('⚠️  Continuing despite email error (development mode)');
      return { success: true, messageId: 'error-but-continuing' };
    }
    return { success: false, error: error.message };
  }
};

// Email templates
const emailTemplates = {
  partnerInvitation: ({ playerName, tournamentName, categoryName, acceptUrl, declineUrl }) => ({
    subject: `Partner Invitation - ${tournamentName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; margin: 10px 5px; text-decoration: none; border-radius: 6px; font-weight: bold; }
          .accept { background: #10b981; color: white; }
          .decline { background: #ef4444; color: white; }
          .info { background: #e0f2fe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏸 Partner Invitation</h1>
          </div>
          <div class="content">
            <p>Hi there!</p>
            <p><strong>${playerName}</strong> has invited you to be their partner for:</p>
            
            <div class="info">
              <strong>Tournament:</strong> ${tournamentName}<br>
              <strong>Category:</strong> ${categoryName}
            </div>
            
            <p>Please confirm your participation by clicking one of the buttons below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" class="button accept">✓ Accept Invitation</a>
              <a href="${declineUrl}" class="button decline">✗ Decline Invitation</a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Note: If you don't have a Matchify.pro account, you'll need to register first to accept this invitation.
            </p>
          </div>
          <div class="footer">
            <p>© 2025 Matchify.pro - Tournament Management Platform</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Partner Invitation - ${tournamentName}

Hi there!

${playerName} has invited you to be their partner for:
- Tournament: ${tournamentName}
- Category: ${categoryName}

Please confirm your participation:
Accept: ${acceptUrl}
Decline: ${declineUrl}

Note: If you don't have a Matchify.pro account, you'll need to register first.

© 2025 Matchify.pro
    `,
  }),

  partnerAccepted: ({ partnerName, tournamentName, categoryName }) => ({
    subject: `Partner Accepted - ${tournamentName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .success { background: #d1fae5; padding: 15px; border-left: 4px solid #10b981; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Partner Confirmed!</h1>
          </div>
          <div class="content">
            <p>Great news!</p>
            <p><strong>${partnerName}</strong> has accepted your partner invitation.</p>
            
            <div class="success">
              <strong>Tournament:</strong> ${tournamentName}<br>
              <strong>Category:</strong> ${categoryName}<br>
              <strong>Status:</strong> Registration Confirmed ✓
            </div>
            
            <p>Your registration is now complete. Good luck in the tournament!</p>
          </div>
          <div class="footer">
            <p>© 2025 Matchify.pro - Tournament Management Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Partner Confirmed - ${tournamentName}

Great news!

${partnerName} has accepted your partner invitation.

Tournament: ${tournamentName}
Category: ${categoryName}
Status: Registration Confirmed ✓

Your registration is now complete. Good luck in the tournament!

© 2025 Matchify.pro
    `,
  }),

  partnerDeclined: ({ partnerName, tournamentName, categoryName }) => ({
    subject: `Partner Declined - ${tournamentName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .warning { background: #fee2e2; padding: 15px; border-left: 4px solid #ef4444; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Partner Declined</h1>
          </div>
          <div class="content">
            <p>Unfortunately, <strong>${partnerName}</strong> has declined your partner invitation.</p>
            
            <div class="warning">
              <strong>Tournament:</strong> ${tournamentName}<br>
              <strong>Category:</strong> ${categoryName}<br>
              <strong>Status:</strong> Partner Declined
            </div>
            
            <p>You can:</p>
            <ul>
              <li>Invite a different partner</li>
              <li>Cancel this registration and register with someone else</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2025 Matchify.pro - Tournament Management Platform</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Partner Declined - ${tournamentName}

Unfortunately, ${partnerName} has declined your partner invitation.

Tournament: ${tournamentName}
Category: ${categoryName}
Status: Partner Declined

You can:
- Invite a different partner
- Cancel this registration and register with someone else

© 2025 Matchify.pro
    `,
  }),
};

// Send partner invitation email
const sendPartnerInvitation = async ({ to, playerName, tournamentName, categoryName, token }) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const acceptUrl = `${frontendUrl}/partner/confirm/${token}?action=accept`;
  const declineUrl = `${frontendUrl}/partner/confirm/${token}?action=decline`;

  const template = emailTemplates.partnerInvitation({
    playerName,
    tournamentName,
    categoryName,
    acceptUrl,
    declineUrl,
  });

  return sendEmail({ to, ...template });
};

// Send partner accepted notification
const sendPartnerAccepted = async ({ to, partnerName, tournamentName, categoryName }) => {
  const template = emailTemplates.partnerAccepted({ partnerName, tournamentName, categoryName });
  return sendEmail({ to, ...template });
};

// Send partner declined notification
const sendPartnerDeclined = async ({ to, partnerName, tournamentName, categoryName }) => {
  const template = emailTemplates.partnerDeclined({ partnerName, tournamentName, categoryName });
  return sendEmail({ to, ...template });
};

// Send admin invite email with one-time password
const sendInviteEmail = async (to, role, inviteUrl, inviterName, oneTimePassword) => {
  const subject = `You've been invited to join Matchify.pro as ${role}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; padding: 14px 32px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .info { background: #e0f2fe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .otp-box { background: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #16a34a; font-family: 'Courier New', monospace; }
        .warning { background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; font-size: 14px; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Admin Invitation - Matchify.pro</h1>
        </div>
        <div class="content">
          <p>Hi there!</p>
          <p><strong>${inviterName}</strong> has invited you to join Matchify.pro as a <strong>${role}</strong>.</p>
          
          <div class="info">
            <strong>Role:</strong> ${role}<br>
            <strong>Platform:</strong> Matchify.pro - Tournament Management Platform<br>
            <strong>Valid for:</strong> 7 days
          </div>

          <div class="otp-box">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #166534;">Your One-Time Password:</p>
            <div class="otp-code">${oneTimePassword}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #166534;">Keep this code secure - you'll need it to complete registration</p>
          </div>
          
          <p>Click the button below to accept this invitation:</p>
          
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button">Accept Invitation & Create Account</a>
          </div>

          <div class="warning">
            <strong>⚠️ Important Security Information:</strong><br>
            • You will need BOTH the invitation link AND the one-time password above<br>
            • The one-time password can only be used once<br>
            • This invitation expires in 7 days<br>
            • As a ${role}, you'll have access to manage the platform
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            Or copy and paste this link into your browser:<br>
            <a href="${inviteUrl}" style="color: #2563eb; word-break: break-all;">${inviteUrl}</a>
          </p>

          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </div>
        <div class="footer">
          <p>© 2025 Matchify.pro - Tournament Management Platform</p>
          <p>This is an automated email. Please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const text = `
Admin Invitation - Matchify.pro

${inviterName} has invited you to join Matchify.pro as a ${role}.

ONE-TIME PASSWORD: ${oneTimePassword}

Role: ${role}
Platform: Matchify.pro - Tournament Management Platform
Valid for: 7 days

IMPORTANT: You will need BOTH the invitation link AND the one-time password above to complete your registration.

Accept this invitation and create your account:
${inviteUrl}

Security Information:
• The one-time password can only be used once
• This invitation expires in 7 days
• Keep your one-time password secure

If you didn't expect this invitation, you can safely ignore this email.

© 2025 Matchify.pro
  `;

  return sendEmail({ to, subject, html, text });
};

export {
  initEmailService,
  sendEmail,
  sendPartnerInvitation,
  sendPartnerAccepted,
  sendPartnerDeclined,
  sendInviteEmail,
};
