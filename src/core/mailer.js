'use strict';
// Sends email through your own SMTP server (SMTP_HOST, optional DKIM signing) or, failing that, Resend.
// With neither configured nothing is sent and the result says so (dry run).
const FROM = () => process.env.EMAIL_FROM || 'AURA <onboarding@resend.dev>';
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const smtpOn = () => !!process.env.SMTP_HOST;
function isConfigured() { return smtpOn() || !!process.env.RESEND_API_KEY; }

let cached = null;
function transport() {
  const key = [process.env.SMTP_HOST, process.env.SMTP_PORT, process.env.SMTP_USER].join('|');
  if (cached && cached.key === key) return cached.t;
  const port = Number(process.env.SMTP_PORT) || 587;
  const opts = { host: process.env.SMTP_HOST, port, secure: port === 465 };
  if (process.env.SMTP_USER) opts.auth = { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' };
  if (process.env.DKIM_DOMAIN && process.env.DKIM_SELECTOR && process.env.DKIM_PRIVATE_KEY) {
    opts.dkim = { domainName: process.env.DKIM_DOMAIN, keySelector: process.env.DKIM_SELECTOR, privateKey: process.env.DKIM_PRIVATE_KEY.replace(/\\n/g, '\n') };
  }
  cached = { key, t: require('nodemailer').createTransport(opts) };
  return cached.t;
}
function isEmail(v) { return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v); }

async function sendEmail({ to, subject, html, replyTo, from }) {
  if (!isEmail(to)) throw Object.assign(new Error('Invalid recipient email address.'), { status: 400 });
  const body = { from: from || FROM(), to: [to], subject: String(subject || '').slice(0, 200), html: String(html || '') };
  if (replyTo && isEmail(replyTo)) body.reply_to = replyTo;
  if (!isConfigured()) return { sent: false, dryRun: true, to };
  if (smtpOn()) {
    try {
      const info = await transport().sendMail({ from: body.from, to, subject: body.subject, html: body.html, replyTo: body.reply_to });
      return { sent: true, id: info.messageId, to };
    } catch (e) { throw Object.assign(new Error('Mail server error: ' + e.message), { status: 502 }); }
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.message || `Email provider error (${r.status})`), { status: r.status === 403 ? 422 : 502 });
  return { sent: true, id: data.id, to };
}

module.exports = { sendEmail, isConfigured, isEmail, esc };
