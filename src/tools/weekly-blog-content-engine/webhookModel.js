// Webhook model for Weekly Blog Content Engine
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
  const source = headers["x-source"] || "generic";
  const signatureValid = secret ? verifySignature(raw, signature, secret) : true;

  return {
    ok: signatureValid,
    event: {
      source,
      payload,
      receivedAt: new Date().toISOString(),
      signatureProvided: !!signature,
      signatureValid,
    },
  };
}

module.exports = { handle };