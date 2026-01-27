// Webhook model for Multi Channel Optimizer
const crypto = require("crypto");

function verifySignature(body, signature, secret, algorithm = "sha256") {
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac(algorithm, secret);
  const digest = hmac.update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

function handle(payload = {}, headers = {}, secret) {
  const raw = JSON.stringify(payload);
  const signature = headers["x-signature"] || headers["x-hub-signature"];
  const signatureValid = secret ? verifySignature(raw, signature, secret) : true;
  const eventType = headers["x-event-type"] || payload.eventType || "multi-channel";
  return { ok: signatureValid, event: { type: eventType, payload, signatureProvided: !!signature, signatureValid, receivedAt: new Date().toISOString() } };
}

module.exports = { handle };