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

    // Basic sanity check (keep it lenient; Make will accept anything)
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({
        ok: false,
        error: "JSON body is required",
      });
    }

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
