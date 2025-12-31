// Twilio integration for winback SMS delivery
const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMS({ to, body, from }) {
  await client.messages.create({ to, from: from || process.env.TWILIO_PHONE_NUMBER, body });
}

module.exports = { sendSMS };
