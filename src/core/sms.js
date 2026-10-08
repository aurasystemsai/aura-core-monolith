'use strict';
// Sends SMS through a carrier API (Twilio) for real customers at scale. The optional Android SMSGate path is for dev/testing only.
// The cost of each text is charged to the shop in credits (see SMS_CREDITS_PER_SEGMENT in creditLedger).
// Without credentials nothing is sent and the result says so (dry run).
const E164 = /^\+[1-9]\d{7,14}$/;

function gatewayOn() { return !!(process.env.SMS_GATEWAY_USER && process.env.SMS_GATEWAY_PASS); }
function isConfigured() { return gatewayOn() || !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && (process.env.TWILIO_FROM || process.env.TWILIO_MESSAGING_SERVICE_SID)); }
function isPhone(v) { return typeof v === 'string' && E164.test(v); }

async function sendSms({ to, body }) {
  if (!isPhone(to)) throw Object.assign(new Error('Phone numbers must be in international format, e.g. +447960000000.'), { status: 400 });
  const text = String(body || '').trim().slice(0, 1000);
  if (!text) throw Object.assign(new Error('Message is empty.'), { status: 400 });
  if (!isConfigured()) return { sent: false, dryRun: true, to };
  if (gatewayOn()) {
    const base = (process.env.SMS_GATEWAY_URL || 'https://api.sms-gate.app/3rdparty/v1').replace(/\/+$/, '');
    const g = await fetch(base + '/messages', {
      method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(process.env.SMS_GATEWAY_USER + ':' + process.env.SMS_GATEWAY_PASS).toString('base64'), 'Content-Type': 'application/json' },
      body: JSON.stringify({ textMessage: { text }, phoneNumbers: [to] }),
    });
    const gd = await g.json().catch(() => ({}));
    if (!g.ok) throw Object.assign(new Error(gd.message || ('Phone gateway error (' + g.status + ')')), { status: 502 });
    const auth = 'Basic ' + Buffer.from(process.env.SMS_GATEWAY_USER + ':' + process.env.SMS_GATEWAY_PASS).toString('base64');
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const s = await fetch(base + '/messages/' + gd.id, { headers: { Authorization: auth } }).then((x) => x.json()).catch(() => ({}));
      if (s.state === 'Failed') throw Object.assign(new Error((s.recipients && s.recipients[0] && s.recipients[0].error) || 'The phone could not send the text.'), { status: 502 });
      if (s.state === 'Sent' || s.state === 'Delivered') return { sent: true, id: gd.id, to };
    }
    return { sent: true, queued: true, id: gd.id, to };
  }
  const p = new URLSearchParams({ To: to, Body: text });
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) p.set('MessagingServiceSid', process.env.TWILIO_MESSAGING_SERVICE_SID); else p.set('From', process.env.TWILIO_FROM);
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST', headers: { Authorization: 'Basic ' + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64'), 'Content-Type': 'application/x-www-form-urlencoded' }, body: p,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.message || `SMS provider error (${r.status})`), { status: 502 });
  return { sent: true, id: data.sid, to };
}

module.exports = { sendSms, isConfigured, isPhone };
