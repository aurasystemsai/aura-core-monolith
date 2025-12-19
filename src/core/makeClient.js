// src/core/makeClient.js
const crypto = require("crypto");

function mustGetWebhookUrl() {
  const url = String(process.env.MAKE_APPLY_FIX_QUEUE_WEBHOOK_URL || "").trim();
  if (!url) {
    throw new Error("MAKE_APPLY_FIX_QUEUE_WEBHOOK_URL is not set");
  }
  return url;
}

function signBody(bodyString) {
  const secret = String(process.env.AURA_SIGNING_SECRET || "").trim();
  if (!secret) return null;

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(bodyString, "utf8");
  return hmac.digest("hex");
}

async function postApplyFixQueue(payload) {
  const url = mustGetWebhookUrl();

  const bodyString = JSON.stringify(payload);
  const signature = signBody(bodyString);
  const timestamp = new Date().toISOString();

  const headers = {
    "content-type": "application/json",
  };

  // Make API Key auth (recommended if you enable it in Make webhook)
  const apiKey = String(process.env.MAKE_WEBHOOK_API_KEY || "").trim();
  if (apiKey) {
    headers["x-make-apikey"] = apiKey;
  }

  // Optional AURA signature headers for debugging/auditing
  if (signature) {
    headers["x-aura-timestamp"] = timestamp;
    headers["x-aura-signature"] = signature;
  }

  const controller = new AbortController();
  const timeoutMs = 15000;
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: bodyString,
      signal: controller.signal,
    });

    const text = await resp.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch (_e) {
      json = null;
    }

    if (!resp.ok) {
      const err = new Error(
        `Make webhook failed: HTTP ${resp.status} ${resp.statusText} :: ${text || ""}`.trim()
      );
      err.status = resp.status;
      err.responseText = text;
      throw err;
    }

    return {
      ok: true,
      status: resp.status,
      response: json || text || null,
    };
  } finally {
    clearTimeout(t);
  }
}

module.exports = {
  postApplyFixQueue,
};
