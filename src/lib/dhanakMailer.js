import nodemailer from 'nodemailer';
import {
  FEST_INSTITUTE,
  FEST_LOCATION,
  SOCIAL_LINKS,
} from './festConfig';

const WEBD_HEAD = {
  name: 'Yuvraj Singh Tomar',
  role: 'Web Dev Head, DHANAK 2027',
  phoneDisplay: '+91 92011 72630',
  phoneTel: 'tel:+919201172630',
  whatsappUrl: 'https://wa.me/919201172630',
};

function getSmtpConfig() {
  const user = (
    process.env.SMTP_USER ||
    process.env.DHANAK_EMAIL_USER ||
    process.env.GMAIL_USER ||
    ''
  ).trim();
  const pass = (
    process.env.SMTP_PASS ||
    process.env.DHANAK_EMAIL_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    ''
  ).trim();
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = Number(process.env.SMTP_PORT || 465);
  const fromName = (process.env.SMTP_FROM_NAME || 'DHANAK 2027 · IIST').trim();

  return { user, pass, host, port, fromName };
}

export function isMailerConfigured() {
  const { user, pass } = getSmtpConfig();
  return Boolean(
    user &&
      pass &&
      !user.includes('your-email') &&
      !user.includes('your-dhanak-email') &&
      !pass.includes('your-app-password') &&
      !pass.includes('your-16-char')
  );
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildDhanakEmailContent({
  introLines,
  codeLabel,
  otp,
  actionUrl,
  actionText,
  closingNote,
  supportEmail,
  siteUrl,
}) {
  const safeOtp = String(otp || '').trim();
  const cleanSiteUrl = String(siteUrl || '').replace(/\/$/, '');
  const contactUrl = cleanSiteUrl ? `${cleanSiteUrl}/contact-us` : '';

  const textParts = [
    'Dear Participant,',
    '',
    ...introLines,
    '',
  ];

  if (safeOtp) {
    textParts.push(`${codeLabel}: ${safeOtp}`, '');
  }

  if (actionUrl) {
    textParts.push(`${actionText || 'Direct link'}: ${actionUrl}`, '');
  }

  textParts.push(
    closingNote,
    '',
    'Warm regards,',
    'Team DHANAK 2027',
    `${FEST_INSTITUTE} (IIST)`,
    FEST_LOCATION,
    '',
    '---',
    'Website & Technical Support (Web Dev Head):',
    `${WEBD_HEAD.name} (${WEBD_HEAD.role})`,
    `Phone / WhatsApp: ${WEBD_HEAD.phoneDisplay} (${WEBD_HEAD.whatsappUrl})`,
    ...(supportEmail ? [`Email: ${supportEmail}`] : []),
    ...(contactUrl ? [`Contact Page: ${contactUrl}`] : []),
    '',
    'Follow DHANAK 2027:',
    `Instagram: ${SOCIAL_LINKS.instagram}`,
    `LinkedIn: ${SOCIAL_LINKS.linkedin}`,
    `YouTube: ${SOCIAL_LINKS.youtube}`
  );

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1f2937;">
    <div style="max-width:600px;">
      <p style="margin:0 0 12px 0;">Dear Participant,</p>
      ${introLines
        .map(
          (line) =>
            `<p style="margin:0 0 12px 0;">${escapeHtml(line)}</p>`
        )
        .join('')}
      ${
        safeOtp
          ? `<p style="margin:14px 0;padding:10px 14px;background-color:#f9fafb;border-left:3px solid #ea580c;font-size:15px;">
              <strong>${escapeHtml(codeLabel)}:</strong>
              <span style="font-family:'Courier New',Courier,monospace;font-size:18px;font-weight:700;letter-spacing:2px;color:#111827;margin-left:6px;">${escapeHtml(safeOtp)}</span>
            </p>`
          : ''
      }
      ${
        actionUrl
          ? `<p style="margin:0 0 12px 0;">
              ${escapeHtml(actionText || 'Or click here to verify directly')}:
              <a href="${escapeHtml(actionUrl)}" target="_blank" rel="noopener noreferrer" style="color:#c2410c;font-weight:600;">${escapeHtml(actionUrl)}</a>
            </p>`
          : ''
      }
      <p style="margin:0 0 18px 0;color:#4b5563;font-size:13px;">${escapeHtml(closingNote)}</p>

      <p style="margin:0 0 16px 0;">
        Warm regards,<br />
        <strong>Team DHANAK 2027</strong><br />
        ${escapeHtml(FEST_INSTITUTE)} (IIST)<br />
        <span style="color:#6b7280;font-size:13px;">${escapeHtml(FEST_LOCATION)}</span>
      </p>

      <hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0;" />

      <p style="margin:0 0 10px 0;font-size:13px;color:#374151;">
        <strong>Website &amp; Technical Support:</strong><br />
        ${escapeHtml(WEBD_HEAD.name)} &mdash; ${escapeHtml(WEBD_HEAD.role)}<br />
        Phone: <a href="${WEBD_HEAD.phoneTel}" style="color:#c2410c;text-decoration:none;">${escapeHtml(WEBD_HEAD.phoneDisplay)}</a>
        &nbsp;|&nbsp;
        <a href="${WEBD_HEAD.whatsappUrl}" target="_blank" rel="noopener noreferrer" style="color:#c2410c;text-decoration:none;">WhatsApp</a>
        ${
          supportEmail
            ? `&nbsp;|&nbsp; <a href="mailto:${escapeHtml(supportEmail)}" style="color:#c2410c;text-decoration:none;">${escapeHtml(supportEmail)}</a>`
            : ''
        }
        ${
          contactUrl
            ? `&nbsp;|&nbsp; <a href="${escapeHtml(contactUrl)}" target="_blank" rel="noopener noreferrer" style="color:#c2410c;text-decoration:none;">Contact Us</a>`
            : ''
        }
      </p>

      <p style="margin:0;font-size:13px;color:#374151;">
        <strong>Connect with DHANAK 2027:</strong>
        <a href="${escapeHtml(SOCIAL_LINKS.instagram)}" target="_blank" rel="noopener noreferrer" style="color:#c2410c;text-decoration:none;">Instagram</a>
        &nbsp;&middot;&nbsp;
        <a href="${escapeHtml(SOCIAL_LINKS.linkedin)}" target="_blank" rel="noopener noreferrer" style="color:#c2410c;text-decoration:none;">LinkedIn</a>
        &nbsp;&middot;&nbsp;
        <a href="${escapeHtml(SOCIAL_LINKS.youtube)}" target="_blank" rel="noopener noreferrer" style="color:#c2410c;text-decoration:none;">YouTube</a>
      </p>
    </div>
  </body>
</html>`;

  return {
    text: textParts.join('\n'),
    html,
  };
}

async function dispatchDhanakEmail({ to, subject, emailArgs }) {
  const { user, pass, host, port, fromName } = getSmtpConfig();
  if (!user || !pass) {
    throw new Error('SMTP credentials are not configured.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const { text, html } = buildDhanakEmailContent({
    ...emailArgs,
    supportEmail: user,
  });

  await transporter.sendMail({
    from: `"${fromName}" <${user}>`,
    to,
    subject,
    text,
    html,
  });
}

export async function sendDhanakVerificationEmail({ to, otp, verifyUrl, siteUrl }) {
  const safeOtp = String(otp || '').trim();
  const subject = safeOtp
    ? `${safeOtp} — DHANAK 2027 Email Verification Code`
    : 'Verify your email for DHANAK 2027 · IIST';

  await dispatchDhanakEmail({
    to,
    subject,
    emailArgs: {
      introLines: [
        'Greetings from DHANAK 2027 — Ember from Ashes, the Annual Cultural Festival of the Indian Institute of Space Science and Technology (IIST).',
        'Thank you for registering with us. Please enter the verification code below on the sign-in screen to verify your email address and activate your account.',
      ],
      codeLabel: 'Verification Code (OTP)',
      otp: safeOtp,
      actionUrl: verifyUrl,
      actionText: 'Or verify directly via this link',
      closingNote:
        'If you did not create an account for DHANAK 2027, please disregard this email.',
      siteUrl,
    },
  });
}

export async function sendDhanakPasswordResetEmail({ to, otp, siteUrl }) {
  const safeOtp = String(otp || '').trim();
  const subject = safeOtp
    ? `${safeOtp} — DHANAK 2027 Password Reset OTP`
    : 'DHANAK 2027 Password Reset Code';

  await dispatchDhanakEmail({
    to,
    subject,
    emailArgs: {
      introLines: [
        'Greetings from DHANAK 2027 — Ember from Ashes, the Annual Cultural Festival of the Indian Institute of Space Science and Technology (IIST).',
        'We received a request to reset the password for your DHANAK 2027 account. Enter the OTP below along with your new password on the Reset Password page, then sign in again.',
      ],
      codeLabel: 'Password Reset OTP',
      otp: safeOtp,
      closingNote:
        'If you did not request a password reset, you can safely ignore this email — your password will remain unchanged.',
      siteUrl,
    },
  });
}
