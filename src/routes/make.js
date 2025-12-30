// src/routes/make.js
// ----------------------------------------
// Make.com integration routes
// - Forwards structured payloads to Make webhooks
// ----------------------------------------

const express = require("express");

const router = express.Router();

function requireMakeWebhookUrl() {
  const url = process.env.MAKE_APPLY_FIX_QUEUE_WEBHOOK;
  if (!url || String(url).trim() === "") return null;
  return String(url).trim();
}

// Input validation helper
function validateMakePayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') errors.push('Payload must be an object');
  // Add more checks as needed for your Make integration
  return errors;
}

// POST /integrations/make/apply-fix-queue
// Forwards JSON to Make "aura_apply_fix_queue" webhook
router.post("/integrations/make/apply-fix-queue", async (req, res) => {
  try {
    const webhookUrl = requireMakeWebhookUrl();
    if (!webhookUrl) {
      return res.status(500).json({
        ok: false,
        error:
          "MAKE_APPLY_FIX_QUEUE_WEBHOOK is not configured on the server environment",
      });
    }

    const payload = req.body || {};
    const errors = validateMakePayload(payload);
    if (errors.length) {
      return res.status(400).json({ ok: false, error: errors.join('; ') });
    }
    /*...*/
    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await resp.text();

    return res.status(200).json({
      ok: true,
      forwardedToMake: true,
      makeStatus: resp.status,
      makeResponse: text,
    });
  } catch (err) {
    console.error("[Core] Make forward error", err);
    return res.status(500).json({
      ok: false,
      error: err.message || "Failed to forward to Make webhook",
    });
  }
});

module.exports = router;
