// src/test-all-tools.js
// ===============================================
// Quick health-check runner for ALL AURA tools.
// - Calls Core API /run/:toolid for each tool ID
// - Prints per-tool status and a summary at the end
// ===============================================

const axios = require("axios");

// ---------- tools list (copied from console) ----------

const TOOLS_METADATA = [
  // SEO
  { id: "product-seo", name: "Product SEO Engine", category: "SEO" },
  { id: "ai-alt-text-engine", name: "AI Alt-Text Engine", category: "SEO" },
  { id: "image-alt-media-seo", name: "Image Alt / Media SEO", category: "SEO" },
  { id: "internal-link-optimizer", name: "Internal Link Optimiser", category: "SEO" },
  { id: "technical-seo-auditor", name: "Technical SEO Auditor", category: "SEO" },
  { id: "schema-rich-results-engine", name: "Schema Rich Results Engine", category: "SEO" },

  // Acquisition / growth
  { id: "multi-channel-optimizer", name: "Multi-Channel Optimizer", category: "Acquisition" },
  { id: "creative-automation-engine", name: "Creative Automation Engine", category: "Ads / Creatives" },
  { id: "brand-intelligence-layer", name: "Brand Intelligence Layer", category: "Brand" },
  { id: "ai-launch-planner", name: "AI Launch Planner", category: "Growth" },

  // CRO / social proof
  { id: "review-ugc-engine", name: "Review & UGC Engine", category: "CRO / Social Proof" },

  // Developers
  { id: "aura-api-sdk", name: "AURA API SDK", category: "Developers" },
  { id: "aura-operations-ai", name: "AURA Operations AI", category: "Developers" },

  // Finance
  { id: "finance-autopilot", name: "Finance Autopilot", category: "Finance" },
  { id: "daily-cfo-pack", name: "Daily CFO Pack", category: "Finance" },
  { id: "auto-insights", name: "Auto Insights", category: "Analytics" },

  // Email / flows
  { id: "abandoned-checkout-winback", name: "Abandoned Checkout Winback", category: "Email / Flows" },
  { id: "email-automation-builder", name: "Email Automation Builder", category: "Email / Flows" },
  { id: "klaviyo-flow-automation", name: "Klaviyo Flow Automation", category: "Email / Flows" },

  // Support
  { id: "ai-support-assistant", name: "AI Support Assistant", category: "Support" },
  { id: "inbox-reply-assistant", name: "Inbox Reply Assistant", category: "Support" },

  // Ops
  { id: "inventory-supplier-sync", name: "Inventory / Supplier Sync", category: "Ops" },
];

// ---------- base URL (same as console) ----------

const CORE_BASE_URL = (
  process.env.AURA_CORE_BASE_URL ||
  process.env.CORE_API_BASE_URL ||
  "http://localhost:4999"
).replace(/\/+$/, "");

// ---------- single tool tester ----------

async function testTool(toolId) {
  const url = `${CORE_BASE_URL}/run/${toolId}`;
  const payload = {}; // we’re just health-checking, so empty payload is fine

  const started = Date.now();
  try {
    const res = await axios.post(url, payload, { timeout: 15000 });
    const ms = Date.now() - started;

    if (res.data && res.data.ok) {
      console.log(`✅ ${toolId.padEnd(26)} ${String(ms).padStart(4)} ms`);
      return { id: toolId, ok: true };
    } else {
      console.log(
        `⚠️  ${toolId.padEnd(26)} responded but ok=false (${ms} ms)`
      );
      return { id: toolId, ok: false, error: "ok=false" };
    }
  } catch (err) {
    const ms = Date.now() - started;
    console.log(
      `❌ ${toolId.padEnd(26)} failed after ${String(ms).padStart(4)} ms: ${err.message}`
    );
    return { id: toolId, ok: false, error: err.message };
  }
}

// ---------- main runner ----------

async function main() {
  console.log("");
  console.log("🔧 AURA Core • Tool Health Check");
  console.log("==================================");
  console.log(`Core API : ${CORE_BASE_URL}`);
  console.log(`Tools    : ${TOOLS_METADATA.length}`);
  console.log("==================================");
  console.log("");

  const results = [];

  for (const tool of TOOLS_METADATA) {
    results.push(await testTool(tool.id));
  }

  const passed = results.filter(r => r.ok).length;
  const failed = results.length - passed;

  console.log("");
  console.log("==================================");
  console.log(`Tools tested : ${results.length}`);
  console.log(`Passed       : ${passed}`);
  console.log(`Failed       : ${failed}`);
  console.log("==================================");

  process.exit(failed === 0 ? 0 : 1);
}

main().catch(err => {
  console.error("Unexpected error in test-all-tools:", err);
  process.exit(1);
});
