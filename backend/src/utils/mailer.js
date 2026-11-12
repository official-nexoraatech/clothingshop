import nodemailer from 'nodemailer';

export const isMailConfigured = () => Boolean(
  process.env.SMTP_HOST?.trim() &&
  process.env.SMTP_FROM?.trim() &&
  (!process.env.SMTP_USER || process.env.SMTP_PASS)
);

export function getMailConfigurationStatus() {
  return {
    host: Boolean(process.env.SMTP_HOST?.trim()),
    from: Boolean(process.env.SMTP_FROM?.trim()),
    user: Boolean(process.env.SMTP_USER?.trim()),
    password: Boolean(process.env.SMTP_PASS),
    authenticationComplete: !process.env.SMTP_USER || Boolean(process.env.SMTP_PASS),
  };
}

export async function sendPasswordResetEmail({ email, resetUrl }) {
  if (!isMailConfigured()) throw new Error('SMTP configuration is incomplete. Check SMTP_HOST, SMTP_FROM, SMTP_USER, and SMTP_PASS.');

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 10000,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } } : {}),
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: 'Reset your password',
    text: `We received a request to reset your password. Use this link within one hour: ${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `<p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in one hour. If you did not request this, you can safely ignore this email.</p>`,
  });
}
