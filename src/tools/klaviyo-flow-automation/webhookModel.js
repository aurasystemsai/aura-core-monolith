// Webhook handler for Klaviyo Flow Automation
const crypto = require("crypto");

function verifySignature(body, signature, secret, algorithm = "sha256") {
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac(algorithm, secret);
  const digest = hmac.update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function handle(payload = {}, headers = {}, secret) {
  const raw = JSON.stringify(payload);
  const signature = headers["x-signature"] || headers["x-klaviyo-signature"];
  const signatureValid = secret ? verifySignature(raw, signature, secret) : true;
  return { ok: signatureValid, payload, signatureProvided: !!signature, signatureValid };
}

module.exports = { handle };
