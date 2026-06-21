/**
 * SVA Consults — Netlify Function: Contact Form Handler
 * File: netlify/functions/contact.js
 *
 * Accepts POST requests from the contact form,
 * validates input, and sends two emails via Nodemailer:
 *   1. Notification → office@svaconsults.com
 *   2. Auto-reply   → the enquirer
 *
 * Environment variables required (set in Netlify → Site Settings → Environment Variables):
 *   SMTP_HOST    e.g. smtp.gmail.com
 *   SMTP_PORT    e.g. 587
 *   SMTP_SECURE  "true" for port 465, "false" for 587
 *   SMTP_USER    e.g. office@svaconsults.com
 *   SMTP_PASS    App Password or SMTP password
 */

const nodemailer = require('nodemailer');

// ── HELPERS ──────────────────────────────────────────────────────────────

function sanitise(str = '') {
  return String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, 2000);
}

function isValidEmail(email = '') {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  };
}

// ── HANDLER ───────────────────────────────────────────────────────────────

exports.handler = async function (event) {

  // Only allow POST
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'Method not allowed. Use POST.' });
  }

  // ── PARSE BODY ──────────────────────────────────────────────────────────
  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { ok: false, error: 'Invalid JSON body.' });
  }

  const { name, email, phone, message } = body;

  // ── VALIDATE ────────────────────────────────────────────────────────────
  if (!name || !String(name).trim()) {
    return json(400, { ok: false, error: 'Name is required.' });
  }
  if (!isValidEmail(email)) {
    return json(400, { ok: false, error: 'A valid email address is required.' });
  }

  const safeName    = sanitise(name);
  const safeEmail   = sanitise(email);
  const safePhone   = sanitise(phone || 'Not provided');
  const safeMessage = sanitise(message || 'No additional message.');

  // ── SMTP CONFIG ─────────────────────────────────────────────────────────
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_SECURE,
    SMTP_USER,
    SMTP_PASS,
  } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error('Missing SMTP environment variables.');
    return json(500, { ok: false, error: 'Server email configuration is incomplete. Please contact us directly at office@svaconsults.com.' });
  }

  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   parseInt(SMTP_PORT || '587'),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  // ── EMAIL 1: NOTIFICATION TO SVA CONSULTS ───────────────────────────────
  const notificationMail = {
    from:    `"SVA Consults Website" <${SMTP_USER}>`,
    to:      'office@svaconsults.com',
    replyTo: safeEmail,
    subject: `New Enquiry — ${safeName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#17181B;border:1px solid rgba(255,255,255,0.08);border-radius:8px;overflow:hidden;max-width:560px;">
        <tr>
          <td style="background:#0D0E11;padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:16px;font-weight:700;color:#F5F5F7;letter-spacing:-0.3px;">SVA Consults</span>
          </td>
        </tr>
        <tr><td style="padding:32px;">
          <p style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#3B82F6;margin:0 0 12px;">New Website Enquiry</p>
          <h1 style="font-size:22px;font-weight:700;color:#F5F5F7;margin:0 0 24px;letter-spacing:-0.5px;">You have a new message</h1>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#4A4A52;">Full Name</p>
              <p style="margin:0;font-size:15px;color:#E8E8E8;">${safeName}</p>
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#4A4A52;">Email Address</p>
              <p style="margin:0;font-size:15px;color:#E8E8E8;">
                <a href="mailto:${safeEmail}" style="color:#3B82F6;text-decoration:none;">${safeEmail}</a>
              </p>
            </td></tr>
            <tr><td style="padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#4A4A52;">Phone Number</p>
              <p style="margin:0;font-size:15px;color:#E8E8E8;">${safePhone}</p>
            </td></tr>
            <tr><td style="padding:14px 0;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:#4A4A52;">Message</p>
              <p style="margin:0;font-size:14px;color:#8A8A8E;line-height:1.6;white-space:pre-wrap;">${safeMessage}</p>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
            <tr><td>
              <a href="mailto:${safeEmail}?subject=Re: Your enquiry to SVA Consults"
                 style="display:inline-block;background:#3B82F6;color:#fff;font-size:13px;font-weight:600;padding:12px 28px;border-radius:4px;text-decoration:none;letter-spacing:0.02em;">
                Reply to ${safeName}
              </a>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:11px;color:#4A4A52;line-height:1.5;">
            Submitted via svaconsults.com contact form.<br>
            © 2025 SVA Consults Pvt. Ltd. — office@svaconsults.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `New enquiry from ${safeName}\n\nEmail: ${safeEmail}\nPhone: ${safePhone}\n\nMessage:\n${safeMessage}`,
  };

  // ── EMAIL 2: AUTO-REPLY TO THE ENQUIRER ─────────────────────────────────
  const autoReplyMail = {
    from:    `"SVA Consults" <${SMTP_USER}>`,
    to:      safeEmail,
    subject: `We've received your message — SVA Consults`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#17181B;border:1px solid rgba(255,255,255,0.08);border-radius:8px;overflow:hidden;max-width:560px;">
        <tr>
          <td style="background:#0D0E11;padding:24px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <span style="font-size:16px;font-weight:700;color:#F5F5F7;letter-spacing:-0.3px;">SVA Consults</span>
          </td>
        </tr>
        <tr><td style="padding:36px 32px;">
          <p style="font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#3B82F6;margin:0 0 12px;">Message Received</p>
          <h1 style="font-size:22px;font-weight:700;color:#F5F5F7;margin:0 0 16px;letter-spacing:-0.5px;">Thank you, ${safeName}.</h1>
          <p style="font-size:14px;color:#8A8A8E;line-height:1.7;margin:0 0 20px;">
            We have received your enquiry and a member of our team will be in touch with you shortly.
          </p>
          <p style="font-size:14px;color:#8A8A8E;line-height:1.7;margin:0 0 32px;">
            If you have anything to add, simply reply to this email.
          </p>
          <p style="font-size:13px;color:#4A4A52;line-height:1.8;margin:0;">
            SVA Consults<br>
            Sri Venkateshwara Associates<br>
            Medchal (Malkajgiri), Telangana, India<br>
            <a href="mailto:office@svaconsults.com" style="color:#3B82F6;text-decoration:none;">office@svaconsults.com</a>
          </p>
        </td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.05);">
          <p style="margin:0;font-size:11px;color:#4A4A52;">© 2025 SVA Consults Pvt. Ltd.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    text: `Hi ${safeName},\n\nThank you for reaching out to SVA Consults. We have received your message and will be in touch shortly.\n\nSVA Consults\noffice@svaconsults.com`,
  };

  // ── SEND ────────────────────────────────────────────────────────────────
  try {
    await transporter.sendMail(notificationMail);
    await transporter.sendMail(autoReplyMail);
    return json(200, { ok: true, message: 'Your message has been sent successfully.' });
  } catch (err) {
    console.error('Nodemailer error:', err.message);
    return json(500, {
      ok: false,
      error: 'We could not send your message due to a server error. Please email us directly at office@svaconsults.com.',
    });
  }
};
