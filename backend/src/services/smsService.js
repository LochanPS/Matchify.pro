import twilio from 'twilio';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

class SMSService {
  constructor() {
    this.client = null;
    this.enabled = process.env.TWILIO_ENABLED === 'true';
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (this.enabled) {
      this.client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    }
  }

  // SMS Templates
  templates = {
    REGISTRATION_CONFIRMATION: (data) =>
      `✅ Registration confirmed for ${data.tournamentName}! Category: ${data.categoryName}. Entry fee: ₹${data.amount}. Good luck! - Matchify`,
    
    MATCH_STARTING_SOON: (data) =>
      `🏸 Your match starts in 15 minutes! Court: ${data.courtNumber}. Opponent: ${data.opponentName}. Be ready! - Matchify`,
    
    TOURNAMENT_REMINDER: (data) =>
      `📅 Reminder: ${data.tournamentName} starts tomorrow at ${data.time}. Venue: ${data.venue}. See you there! - Matchify`,
    
    DRAW_PUBLISHED: (data) =>
      `🎯 Draw published for ${data.tournamentName}! Your first match is on ${data.matchDate}. Check the app for details. - Matchify`,
    
    PARTNER_INVITATION: (data) =>
      `👥 ${data.playerName} invited you as doubles partner for ${data.tournamentName}. Accept in the app within 24h. - Matchify`,
    
    TOURNAMENT_CANCELLED: (data) =>
      `❌ ${data.tournamentName} has been cancelled. Refund of ₹${data.refundAmount} processed to your wallet. - Matchify`,
    
    MATCH_COMPLETED: (data) =>
      `🏆 Match completed! Result: ${data.result}. You earned ${data.pointsEarned} Matchify Points. - Matchify`
  };

  /**
   * Send SMS (with queue and retry logic)
   */
  async send(phoneNumber, templateName, data) {
    if (!this.enabled) {
      console.log(`[SMS DISABLED] Would send to ${phoneNumber}: ${templateName}`);
      return { success: true, mock: true };
    }

    // Validate phone number (must include country code)
    const formattedPhone = this.formatPhoneNumber(phoneNumber);
    if (!formattedPhone) {
      throw new Error('Invalid phone number format');
    }

    // Get SMS template
    const message = this.templates[templateName](data);
    if (!message) {
      throw new Error(`SMS template ${templateName} not found`);
    }

    // Check rate limit
    const canSend = await this.checkRateLimit(formattedPhone);
    if (!canSend) {
      throw new Error('SMS rate limit exceeded. Try again later.');
    }

    try {
      // Send SMS via Twilio
      const result = await this.client.messages.create({
        body: message,
        from: this.fromNumber,
        to: formattedPhone
      });

      // Log SMS
      await this.logSMS(formattedPhone, templateName, message, 'sent', result.sid);

      console.log(`[SMS SENT] To: ${formattedPhone}, Template: ${templateName}, SID: ${result.sid}`);
      
      return {
        success: true,
        sid: result.sid,
        status: result.status
      };

    } catch (error) {
      console.error(`[SMS ERROR] Failed to send to ${formattedPhone}:`, error.message);
      
      // Log failed SMS
      await this.logSMS(formattedPhone, templateName, message, 'failed', null, error.message);
      
      throw error;
    }
  }

  /**
   * Send SMS with retry logic
   */
  async sendWithRetry(phoneNumber, templateName, data, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.send(phoneNumber, templateName, data);
      } catch (error) {
        if (attempt === retries) {
          throw error; // Final attempt failed
        }
        
        // Wait before retry (exponential backoff)
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`[SMS RETRY] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Format phone number to E.164 format (+91XXXXXXXXXX)
   */
  formatPhoneNumber(phone) {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 91, add +
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    }
    
    // If 10 digits, assume India and add +91
    if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    
    // If already has +, return as is
    if (phone.startsWith('+')) {
      return phone;
    }
    
    return null;
  }

  /**
   * Check rate limit (max 5 SMS per minute per user)
   */
  async checkRateLimit(phoneNumber) {
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    const recentSMS = await prisma.smsLog.count({
      where: {
        phoneNumber,
        createdAt: { gte: oneMinuteAgo },
        status: 'sent'
      }
    });

    const limit = parseInt(process.env.SMS_RATE_LIMIT || '5');
    return recentSMS < limit;
  }

  /**
   * Log SMS to database
   */
  async logSMS(phoneNumber, templateName, message, status, twilioSid = null, error = null) {
    try {
      await prisma.smsLog.create({
        data: {
          phoneNumber,
          templateName,
          message,
          status,
          twilioSid,
          error,
          createdAt: new Date()
        }
      });
    } catch (logError) {
      console.error('[SMS LOG ERROR]', logError);
      // Don't throw - logging failure shouldn't break SMS sending
    }
  }

  /**
   * Bulk send SMS (with delay between messages)
   */
  async sendBulk(recipients, templateName, dataProvider) {
    const results = [];
    
    for (const recipient of recipients) {
      try {
        const data = dataProvider(recipient);
        const result = await this.sendWithRetry(recipient.phoneNumber, templateName, data);
        results.push({ recipient: recipient.phoneNumber, success: true, result });
        
        // Delay 100ms between messages to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        results.push({
          recipient: recipient.phoneNumber,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Get SMS delivery status from Twilio
   */
  async getStatus(twilioSid) {
    if (!this.enabled) {
      return { status: 'mock' };
    }

    try {
      const message = await this.client.messages(twilioSid).fetch();
      return {
        status: message.status,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };
    } catch (error) {
      console.error(`[SMS STATUS ERROR] SID: ${twilioSid}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export default new SMSService();
