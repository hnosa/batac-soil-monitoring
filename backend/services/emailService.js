// backend/services/emailService.js - CONVERTED TO ES MODULES
import nodemailer from 'nodemailer';

// Fix: createTransport (not createTransporter)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

class EmailService {
  static async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Batac Soil Monitoring - Password Reset',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2c5530;">🌱 Batac Soil Monitoring System</h2>
            <p>You requested a password reset for your account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: #4CAF50; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p>Or copy and paste this link in your browser:</p>
            <p style="word-break: break-all; color: #666;">${resetLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Batac City Soil Monitoring System • Powered by ESP8266 & LoRa
            </p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to: ${email}`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send password reset email');
    }
  }
}

export default EmailService;