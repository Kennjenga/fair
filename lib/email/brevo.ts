// Server-only module - Use Brevo SMTP via nodemailer
// Supports both SMTP and API methods for sending emails

import nodemailer from 'nodemailer';

/**
 * Email sending configuration
 */
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const FROM_EMAIL = process.env.FROM_EMAIL || process.env.BREVO_SENDER_EMAIL || 'noreply@fair-voting.com';
const FROM_NAME = process.env.FROM_NAME || process.env.BREVO_SENDER_NAME || 'FAIR Voting Platform';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Alternative: Brevo API configuration (fallback)
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Create nodemailer transporter for SMTP
 */
let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (!SMTP_USER || !SMTP_PASSWORD) {
      throw new Error('SMTP_USER and SMTP_PASSWORD environment variables are required for email sending');
    }

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

/**
 * Send email via Brevo SMTP
 * @param emailData - Email data to send
 * @returns Email send result
 */
export async function sendEmailViaSMTP(emailData: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}): Promise<any> {
  try {
    const mailTransporter = getTransporter();
    
    const mailOptions = {
      from: emailData.from || `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: Array.isArray(emailData.to) ? emailData.to.join(', ') : emailData.to,
      subject: emailData.subject,
      text: emailData.text || emailData.html.replace(/<[^>]*>/g, ''), // Plain text fallback
      html: emailData.html,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
  } catch (error) {
    console.error('Failed to send email via SMTP:', error);
    throw error;
  }
}

/**
 * Send email via Brevo REST API (fallback)
 * Uses direct API calls instead of SDK to avoid bundling issues
 */
export async function sendEmailViaBrevoAPI(emailData: {
  to: Array<{ email: string }>;
  subject: string;
  htmlContent: string;
  textContent?: string;
  sender: { email: string; name: string };
}): Promise<any> {
  if (!BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY environment variable is not set');
  }

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(`Brevo API error: ${errorData.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send email via Brevo API:', error);
    throw error;
  }
}

/**
 * Send email - automatically chooses SMTP or API based on configuration
 * @param emailData - Email data to send
 * @returns Email send result
 */
export async function sendEmail(emailData: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
}): Promise<any> {
  // Prefer SMTP if configured
  if (SMTP_USER && SMTP_PASSWORD) {
    return await sendEmailViaSMTP(emailData);
  }
  
  // Fallback to API if API key is available
  if (BREVO_API_KEY) {
    const toArray = Array.isArray(emailData.to) ? emailData.to : [emailData.to];
    return await sendEmailViaBrevoAPI({
      to: toArray.map(email => ({ email })),
      subject: emailData.subject,
      htmlContent: emailData.html,
      textContent: emailData.text,
      sender: { 
        email: emailData.from || FROM_EMAIL, 
        name: emailData.fromName || FROM_NAME 
      },
    });
  }

  throw new Error('No email configuration found. Please set SMTP credentials or BREVO_API_KEY.');
}

/**
 * Get Brevo client (for backward compatibility)
 * Now uses SMTP or REST API
 */
export async function getBrevoClient(): Promise<any> {
  return {
    sendTransacEmail: async (email: any) => {
      const toArray = Array.isArray(email.to) ? email.to : email.to || [];
      const toEmails = toArray.map((item: any) => typeof item === 'string' ? item : item.email);
      
      return await sendEmail({
        to: toEmails,
        subject: email.subject || '',
        html: email.htmlContent || '',
        text: email.textContent,
        from: email.sender?.email || FROM_EMAIL,
        fromName: email.sender?.name || FROM_NAME,
      });
    },
  };
}

/**
 * Send voting token email to a voter
 * @param email - Recipient email address
 * @param token - Voting token
 * @param pollName - Name of the poll
 * @param teamName - Voter's team name
 * @returns Email send result
 */
export async function sendVotingTokenEmail(
  email: string,
  token: string,
  pollName: string,
  teamName: string
): Promise<any> {
  const votingUrl = `${APP_URL}/vote?token=${encodeURIComponent(token)}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #1e40af 0%, #0891b2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .token-box { background: white; border: 2px dashed #64748b; padding: 15px; margin: 20px 0; text-align: center; border-radius: 6px; }
        .footer { text-align: center; margin-top: 30px; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FAIR Voting Platform</h1>
        </div>
        <div class="content">
          <h2>Your Voting Token</h2>
          <p>Hello,</p>
          <p>You have been registered to vote in the poll: <strong>${pollName}</strong></p>
          <p>Your team: <strong>${teamName}</strong></p>
          <p>Click the button below to cast your vote:</p>
          <div style="text-align: center;">
            <a href="${votingUrl}" class="button">Cast Your Vote</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <div class="token-box">
            <code style="word-break: break-all;">${votingUrl}</code>
          </div>
          <p><strong>Important:</strong></p>
          <ul>
            <li>This token can only be used once</li>
            <li>You cannot vote for your own team</li>
            <li>Your vote will be recorded on the blockchain for transparency</li>
          </ul>
          <p>Thank you for participating!</p>
        </div>
        <div class="footer">
          <p>This is an automated message from FAIR Voting Platform. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
FAIR Voting Platform - Your Voting Token

Hello,

You have been registered to vote in the poll: ${pollName}
Your team: ${teamName}

Click the link below to cast your vote:
${votingUrl}

Important:
- This token can only be used once
- You cannot vote for your own team
- Your vote will be recorded on the blockchain for transparency

Thank you for participating!
  `;

  return await sendEmail({
    to: email,
    subject: `Your Voting Token for ${pollName}`,
    html: htmlContent,
    text: textContent,
  });
}

/**
 * Update email delivery status in database
 * This should be called by webhook handler when Brevo sends delivery updates
 * @param messageId - Brevo message ID
 * @param status - Delivery status
 */
export async function updateEmailDeliveryStatus(
  messageId: string,
  status: 'sent' | 'delivered' | 'bounced' | 'failed'
): Promise<void> {
  // This would typically update the database
  // For now, we'll log it - actual implementation would query tokens table
  console.log(`Email ${messageId} status updated to: ${status}`);
}
