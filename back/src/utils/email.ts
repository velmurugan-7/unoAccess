// import nodemailer from 'nodemailer';
// import { config } from '../config/env';
// import { logger } from './logger';

// let transporter: nodemailer.Transporter;

// const getTransporter = async (): Promise<nodemailer.Transporter> => {
//   if (transporter) return transporter;
//   if (config.nodeEnv === 'development' && !config.email.user) {
//     const testAccount = await nodemailer.createTestAccount();
//     transporter = nodemailer.createTransport({
//       host: 'smtp.ethereal.email', port: 587, secure: false,
//       auth: { user: testAccount.user, pass: testAccount.pass },
//     });
//     logger.info(`Ethereal test email: ${testAccount.user}`);
//   } else {
//     transporter = nodemailer.createTransport({
//       host: config.email.host, port: config.email.port,
//       secure: config.email.secure, auth: { user: config.email.user, pass: config.email.pass },
//     });
//   }
//   return transporter;
// };

// const base = (content: string) => `
// <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0e17;border-radius:16px;overflow:hidden">
//   <div style="background:#6366f1;padding:24px 32px">
//     <h1 style="color:#fff;margin:0;font-size:22px">🔐 UnoAccess</h1>
//   </div>
//   <div style="padding:32px;color:#e2e8f0">${content}</div>
//   <div style="padding:16px 32px;background:#1a1930;text-align:center">
//     <p style="color:#64748b;font-size:11px;margin:0">© ${new Date().getFullYear()} UnoAccess — Secure SSO Platform</p>
//   </div>
// </div>`;

// const btn = (href: string, label: string) =>
//   `<a href="${href}" style="display:inline-block;background:#6366f1;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin:16px 0">${label}</a>`;

// const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
//   const t = await getTransporter();
//   const info = await t.sendMail({ from: config.email.from, to, subject, html });
//   if (config.nodeEnv !== 'production') logger.info(`Email preview: ${nodemailer.getTestMessageUrl(info)}`);
// };

// export const sendVerificationEmail = async (to: string, token: string) =>
//   sendEmail(to, 'Verify your UnoAccess account', base(`
//     <h2 style="color:#6366f1;margin-top:0">Verify your email</h2>
//     <p>Welcome! Click below to verify your email address.</p>
//     ${btn(`${config.frontendUrl}/verify-email?token=${token}`, 'Verify Email')}
//     <p style="color:#94a3b8;font-size:12px">Expires in 24 hours. If you didn't create an account, ignore this email.</p>`));

// export const sendPasswordResetEmail = async (to: string, token: string) =>
//   sendEmail(to, 'Reset your UnoAccess password', base(`
//     <h2 style="color:#6366f1;margin-top:0">Password Reset</h2>
//     <p>We received a request to reset your password.</p>
//     ${btn(`${config.frontendUrl}/reset-password?token=${token}`, 'Reset Password')}
//     <p style="color:#94a3b8;font-size:12px">Expires in 1 hour. If you didn't request this, ignore this email.</p>`));

// export const sendSuspiciousLoginEmail = async (to: string, name: string, info: { ip: string; device: string; time: string }) =>
//   sendEmail(to, '⚠️ New sign-in to your UnoAccess account', base(`
//     <h2 style="color:#f59e0b;margin-top:0">New sign-in detected</h2>
//     <p>Hi <strong>${name}</strong>, we detected a sign-in from a new device.</p>
//     <table style="width:100%;border-collapse:collapse;margin:16px 0">
//       <tr><td style="padding:8px;color:#94a3b8">Device</td><td style="padding:8px">${info.device}</td></tr>
//       <tr><td style="padding:8px;color:#94a3b8">IP</td><td style="padding:8px">${info.ip}</td></tr>
//       <tr><td style="padding:8px;color:#94a3b8">Time</td><td style="padding:8px">${info.time}</td></tr>
//     </table>
//     <p>If this was you, no action needed. If not, change your password immediately.</p>
//     ${btn(`${config.frontendUrl}/settings?tab=security`, 'Secure My Account')}`));

// export const sendTwoFactorBackupEmail = async (to: string, name: string, codes: string[]) =>
//   sendEmail(to, '🔑 Your 2FA backup codes — UnoAccess', base(`
//     <h2 style="color:#6366f1;margin-top:0">Your backup codes</h2>
//     <p>Hi <strong>${name}</strong>, here are your 2FA backup codes. Each can only be used once.</p>
//     <div style="background:#1e1b4b;border-radius:8px;padding:16px;font-family:monospace;font-size:14px;line-height:2">
//       ${codes.map(c => `<div>${c}</div>`).join('')}
//     </div>
//     <p style="color:#94a3b8;font-size:12px">Store these securely. Do not share them with anyone.</p>`));

// export const send2FADisabledEmail = async (to: string, name: string) =>
//   sendEmail(to, '🔓 Two-factor authentication disabled', base(`
//     <h2 style="color:#ef4444;margin-top:0">2FA Disabled</h2>
//     <p>Hi <strong>${name}</strong>, two-factor authentication was disabled on your account.</p>
//     <p>If you did not do this, please secure your account immediately.</p>
//     ${btn(`${config.frontendUrl}/settings?tab=security`, 'Review Security Settings')}`));

// export const sendAccountLockedEmail = async (to: string, name: string) =>
//   sendEmail(to, '🔒 Account temporarily locked — UnoAccess', base(`
//     <h2 style="color:#ef4444;margin-top:0">Account Locked</h2>
//     <p>Hi <strong>${name}</strong>, your account has been temporarily locked due to too many failed login attempts.</p>
//     <p>It will be automatically unlocked after 30 minutes.</p>
//     ${btn(`${config.frontendUrl}/forgot-password`, 'Reset Password Instead')}`));

// export const sendAlertEmail = async (
//   to: string,
//   name: string,
//   info: { ruleName: string; metric: string; threshold: number; actualValue: number; condition: string }
// ) =>
//   sendEmail(to, `🚨 Alert triggered: ${info.ruleName}`, base(`
//     <h2 style="color:#ef4444;margin-top:0">Alert Triggered</h2>
//     <p>Hi <strong>${name}</strong>, your alert rule <strong>"${info.ruleName}"</strong> has been triggered.</p>
//     <table style="width:100%;border-collapse:collapse;margin:16px 0">
//       <tr><td style="padding:8px;color:#94a3b8">Metric</td><td style="padding:8px">${info.metric.replace(/_/g,' ')}</td></tr>
//       <tr><td style="padding:8px;color:#94a3b8">Condition</td><td style="padding:8px">${info.condition.replace(/_/g,' ')} ${info.threshold}</td></tr>
//       <tr><td style="padding:8px;color:#ef4444;font-weight:bold">Actual Value</td><td style="padding:8px;color:#ef4444;font-weight:bold">${info.actualValue.toFixed(2)}</td></tr>
//     </table>
//     <p>Log into your dashboard to investigate.</p>`));

import sgMail from '@sendgrid/mail';
import { config } from '../config/env';
import { logger } from './logger';

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// ─── Base email template ──────────────────────────────────────────────────────
const base = (content: string) => `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#0f0e17;border-radius:16px;overflow:hidden">
  <div style="background:#6366f1;padding:24px 32px">
    <h1 style="color:#fff;margin:0;font-size:22px">🔐 UnoAccess</h1>
  </div>
  <div style="padding:32px;color:#e2e8f0">${content}</div>
  <div style="padding:16px 32px;background:#1a1930;text-align:center">
    <p style="color:#64748b;font-size:11px;margin:0">© ${new Date().getFullYear()} UnoAccess — Secure SSO Platform</p>
  </div>
</div>`;

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#6366f1;color:#fff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:bold;margin:16px 0">${label}</a>`;

// ─── Core send function ───────────────────────────────────────────────────────
const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    const from = config.email.from || 'UnoAccess <noreply@unoaccess.com>';

    if (config.nodeEnv === 'development' && !process.env.SENDGRID_API_KEY) {
      // In development without SendGrid key — just log the email
      logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      return;
    }

    await sgMail.send({ to, from, subject, html });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error: any) {
    // Log but NEVER throw — email failure must never crash login or any other flow
    logger.error(`Email send failed to ${to}: ${error?.message || error}`);
  }
};

// ─── All email functions — unchanged from original ────────────────────────────

export const sendVerificationEmail = async (to: string, token: string) =>
  sendEmail(to, 'Verify your UnoAccess account', base(`
    <h2 style="color:#6366f1;margin-top:0">Verify your email</h2>
    <p>Welcome! Click below to verify your email address.</p>
    ${btn(`${config.frontendUrl}/verify-email?token=${token}`, 'Verify Email')}
    <p style="color:#94a3b8;font-size:12px">Expires in 24 hours. If you didn't create an account, ignore this email.</p>`));

export const sendPasswordResetEmail = async (to: string, token: string) =>
  sendEmail(to, 'Reset your UnoAccess password', base(`
    <h2 style="color:#6366f1;margin-top:0">Password Reset</h2>
    <p>We received a request to reset your password.</p>
    ${btn(`${config.frontendUrl}/reset-password?token=${token}`, 'Reset Password')}
    <p style="color:#94a3b8;font-size:12px">Expires in 1 hour. If you didn't request this, ignore this email.</p>`));

export const sendSuspiciousLoginEmail = async (to: string, name: string, info: { ip: string; device: string; time: string }) =>
  sendEmail(to, '⚠️ New sign-in to your UnoAccess account', base(`
    <h2 style="color:#f59e0b;margin-top:0">New sign-in detected</h2>
    <p>Hi <strong>${name}</strong>, we detected a sign-in from a new device.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;color:#94a3b8">Device</td><td style="padding:8px">${info.device}</td></tr>
      <tr><td style="padding:8px;color:#94a3b8">IP</td><td style="padding:8px">${info.ip}</td></tr>
      <tr><td style="padding:8px;color:#94a3b8">Time</td><td style="padding:8px">${info.time}</td></tr>
    </table>
    <p>If this was you, no action needed. If not, change your password immediately.</p>
    ${btn(`${config.frontendUrl}/settings?tab=security`, 'Secure My Account')}`));

export const sendTwoFactorBackupEmail = async (to: string, name: string, codes: string[]) =>
  sendEmail(to, '🔑 Your 2FA backup codes — UnoAccess', base(`
    <h2 style="color:#6366f1;margin-top:0">Your backup codes</h2>
    <p>Hi <strong>${name}</strong>, here are your 2FA backup codes. Each can only be used once.</p>
    <div style="background:#1e1b4b;border-radius:8px;padding:16px;font-family:monospace;font-size:14px;line-height:2">
      ${codes.map(c => `<div>${c}</div>`).join('')}
    </div>
    <p style="color:#94a3b8;font-size:12px">Store these securely. Do not share them with anyone.</p>`));

export const send2FADisabledEmail = async (to: string, name: string) =>
  sendEmail(to, '🔓 Two-factor authentication disabled', base(`
    <h2 style="color:#ef4444;margin-top:0">2FA Disabled</h2>
    <p>Hi <strong>${name}</strong>, two-factor authentication was disabled on your account.</p>
    <p>If you did not do this, please secure your account immediately.</p>
    ${btn(`${config.frontendUrl}/settings?tab=security`, 'Review Security Settings')}`));

export const sendAccountLockedEmail = async (to: string, name: string) =>
  sendEmail(to, '🔒 Account temporarily locked — UnoAccess', base(`
    <h2 style="color:#ef4444;margin-top:0">Account Locked</h2>
    <p>Hi <strong>${name}</strong>, your account has been temporarily locked due to too many failed login attempts.</p>
    <p>It will be automatically unlocked after 30 minutes.</p>
    ${btn(`${config.frontendUrl}/forgot-password`, 'Reset Password Instead')}`));

export const sendAlertEmail = async (
  to: string,
  name: string,
  info: { ruleName: string; metric: string; threshold: number; actualValue: number; condition: string }
) =>
  sendEmail(to, `🚨 Alert triggered: ${info.ruleName}`, base(`
    <h2 style="color:#ef4444;margin-top:0">Alert Triggered</h2>
    <p>Hi <strong>${name}</strong>, your alert rule <strong>"${info.ruleName}"</strong> has been triggered.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:8px;color:#94a3b8">Metric</td><td style="padding:8px">${info.metric.replace(/_/g,' ')}</td></tr>
      <tr><td style="padding:8px;color:#94a3b8">Condition</td><td style="padding:8px">${info.condition.replace(/_/g,' ')} ${info.threshold}</td></tr>
      <tr><td style="padding:8px;color:#ef4444;font-weight:bold">Actual Value</td><td style="padding:8px;color:#ef4444;font-weight:bold">${info.actualValue.toFixed(2)}</td></tr>
    </table>
    <p>Log into your dashboard to investigate.</p>`));