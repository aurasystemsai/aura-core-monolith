// src/tools/inbox-reply-assistant/index.js
// ===============================================
// AURA • Inbox Reply Assistant (rule-based)
// ===============================================

const key = "inbox-reply-assistant";

async function run(input = {}, ctx = {}) {
  const env = ctx.environment || process.env.NODE_ENV || "development";
  const now = new Date().toISOString();

  const customerName = input.customerName || "there";

  return {
    ok: true,
    tool: key,
    environment: env,
    message: "Reply template generated.",
    input,
    output: {
      greeting: `Hi ${customerName},`,
      closing: "Best wishes,\nCustomer Support",
      tone: "friendly, efficient, on-brand",
    },
    meta: {
      engine: "internal-rule-engine-v1",
      generatedAt: now,
    },
  };
}

module.exports = { key, run };
