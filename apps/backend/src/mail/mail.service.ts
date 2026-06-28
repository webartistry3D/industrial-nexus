import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<string>('SMTP_SECURE', 'false') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordReset(to: string, firstName: string, resetToken: string): Promise<void> {
    const appUrl = this.configService.get<string>('APP_URL', 'http://localhost:3000');
    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    const fromName = this.configService.get<string>('SMTP_FROM_NAME', 'Industrial Nexus');
    const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL', 'noreply@industrialnexus.com');

    try {
      await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to,
        subject: 'Reset Your Industrial Nexus Password',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; font-weight: 700; color: #0f172a; margin: 0;">Industrial Nexus</h1>
              <p style="color: #64748b; margin-top: 4px; font-size: 14px;">Password Reset Request</p>
            </div>
            <div style="background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
              <p style="color: #1e293b; font-size: 15px; margin-top: 0;">Hi ${firstName},</p>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                We received a request to reset the password for your Industrial Nexus account.
                Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
              </p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${resetUrl}"
                   style="display: inline-block; background: #1e3a5f; color: #ffffff; text-decoration: none;
                          padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  Reset Password
                </a>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
                If you did not request a password reset, you can safely ignore this email.
                Your password will not change.
              </p>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px;">
              &copy; ${new Date().getFullYear()} Industrial Nexus. All rights reserved.
            </p>
          </div>
        `,
        text: `Hi ${firstName},\n\nYou requested a password reset for your Industrial Nexus account.\n\nReset your password here: ${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email.`,
      });
      this.logger.log(`[Mail] Password reset email sent to ${to}`);
    } catch (err) {
      this.logger.error(`[Mail] Failed to send password reset email to ${to}:`, err);
      throw err;
    }
  }
}
