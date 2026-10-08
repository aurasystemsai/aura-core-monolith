'use strict';
// Sends email through Resend. Without RESEND_API_KEY nothing is sent and the result says so (dry run).
const FROM = () => process.env.EMAIL_FROM || 'AURA <onboarding@resend.dev>';
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function isConfigured() { return !!process.env.RESEND_API_KEY; }
function isEmail(v) { return typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v); }

async function sendEmail({ to, subject, html, replyTo, from }) {
  if (!isEmail(to)) throw Object.assign(new Error('Invalid recipient email address.'), { status: 400 });
  const body = { from: from || FROM(), to: [to], subject: String(subject || '').slice(0, 200), html: String(html || '') };
  if (replyTo && isEmail(replyTo)) body.reply_to = replyTo;
  if (!isConfigured()) return { sent: false, dryRun: true, to };
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.message || `Email provider error (${r.status})`), { status: r.status === 403 ? 422 : 502 });
  return { sent: true, id: data.id, to };
}

module.exports = { sendEmail, isConfigured, isEmail, esc };
