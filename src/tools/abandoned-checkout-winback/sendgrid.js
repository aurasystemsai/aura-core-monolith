// SendGrid integration for winback email delivery
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ to, subject, html, from }) {
  const msg = { to, from: from || process.env.DEFAULT_FROM_EMAIL, subject, html };
  await sgMail.send(msg);
}

module.exports = { sendEmail };
