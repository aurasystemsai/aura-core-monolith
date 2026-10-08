'use strict';
// Sends SMS free through your own Android phone running SMSGate (SMS_GATEWAY_USER/PASS).
// Without credentials nothing is sent and the result says so (dry run).
const E164 = /^\+[1-9]\d{7,14}$/;

function gatewayOn() { return !!(process.env.SMS_GATEWAY_USER && process.env.SMS_GATEWAY_PASS); }
function isConfigured() { return gatewayOn(); }
function isPhone(v) { return typeof v === 'string' && E164.test(v); }

async function sendSms({ to, body }) {
  if (!isPhone(to)) throw Object.assign(new Error('Phone numbers must be in international format, e.g. +447960000000.'), { status: 400 });
  const text = String(body || '').trim().slice(0, 1000);
  if (!text) throw Object.assign(new Error('Message is empty.'), { status: 400 });
  if (!isConfigured()) return { sent: false, dryRun: true, to };
  {
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
}

module.exports = { sendSms, isConfigured, isPhone };