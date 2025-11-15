// Server-only module - Uses Brevo SMTP via nodemailer
// This file should only be imported in API routes (server-side)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Send password reset email
 * @param email - Recipient email address
 * @param resetToken - Password reset token
 * @returns Email send result
 */
export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
): Promise<any> {
  const resetUrl = `${APP_URL}/admin/reset-password?token=${encodeURIComponent(resetToken)}`;
  
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
        .warning { background: #fef3c7; border-left: 4px solid #d97706; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FAIR Voting Platform</h1>
        </div>
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your FAIR Voting Platform account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <div class="token-box">
            <code style="word-break: break-all;">${resetUrl}</code>
          </div>
          <div class="warning">
            <strong>⚠️ Important:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
          </div>
          <p>If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>
        </div>
        <div class="footer">
          <p>This is an automated message from FAIR Voting Platform. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
FAIR Voting Platform - Password Reset Request

Hello,

We received a request to reset your password for your FAIR Voting Platform account.

Click the link below to reset your password:
${resetUrl}

Important: This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.

If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.
  `;

  const { sendEmail } = await import('./brevo');
  return await sendEmail({
    to: email,
    subject: 'Reset Your FAIR Voting Platform Password',
    html: htmlContent,
    text: textContent,
  });
}

