import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || "ATTACKLAB <noreply@attacklab.com>",
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
    return true;
  } catch (error) {
    console.error("Email send failed:", error);
    return false;
  }
}

export async function sendVerificationEmail(email: string, token: string, name: string): Promise<boolean> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Verify your ATTACKLAB account",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px;background:#090a0d;color:#f4f5f8;border-radius:12px;">
        <h1 style="color:#6afff0;font-size:28px;margin-bottom:24px;">Welcome to ATTACKLAB</h1>
        <p style="font-size:16px;line-height:1.6;color:#b1b4c0;">Hi ${name},</p>
        <p style="font-size:16px;line-height:1.6;color:#b1b4c0;">Thank you for registering. Please verify your email address by clicking the button below:</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6afff0,#4a9eff);color:#090a0d;font-weight:700;text-decoration:none;border-radius:8px;margin:24px 0;font-size:16px;">Verify Email Address</a>
        <p style="font-size:14px;color:#969aa7;line-height:1.6;">This link expires in 24 hours. If you did not create an account, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:32px 0;"/>
        <p style="font-size:12px;color:#969aa7;">&copy; 2026 ATTACKLAB, INC. All rights reserved.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, token: string, name: string): Promise<boolean> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Reset your ATTACKLAB password",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:40px;background:#090a0d;color:#f4f5f8;border-radius:12px;">
        <h1 style="color:#6afff0;font-size:28px;margin-bottom:24px;">Password Reset</h1>
        <p style="font-size:16px;line-height:1.6;color:#b1b4c0;">Hi ${name},</p>
        <p style="font-size:16px;line-height:1.6;color:#b1b4c0;">We received a request to reset your password. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#6afff0,#4a9eff);color:#090a0d;font-weight:700;text-decoration:none;border-radius:8px;margin:24px 0;font-size:16px;">Reset Password</a>
        <p style="font-size:14px;color:#969aa7;line-height:1.6;">This link expires in 1 hour. If you did not request a password reset, please ignore this email.</p>
        <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:32px 0;"/>
        <p style="font-size:12px;color:#969aa7;">&copy; 2026 ATTACKLAB, INC. All rights reserved.</p>
      </div>
    `,
  });
}
