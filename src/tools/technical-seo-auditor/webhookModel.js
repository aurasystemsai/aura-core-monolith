// Webhook model for Technical SEO Auditor
const crypto = require("crypto");

function verifySignature(body, signature, secret, algorithm = "sha256") {
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac(algorithm, secret);
  const digest = hmac.update(body).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

async function handle({ payload = {}, headers = {}, secret } = {}) {
  const raw = JSON.stringify(payload);
  const signature = headers["x-signature"] || headers["x-hub-signature"];
  const page = payload.url || headers["x-page"] || "unknown";
  const signatureValid = secret ? verifySignature(raw, signature, secret) : true;

  return {
    ok: signatureValid,
    event: {
      page,
      payload,
      receivedAt: new Date().toISOString(),
      signatureProvided: !!signature,
      signatureValid,
    },
  };
}

module.exports = { handle };