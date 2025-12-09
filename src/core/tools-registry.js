// src/core/tools-registry.js
// ===============================================
// Map of tool IDs -> tool modules
// Each module should export: { key, run(input, ctx) }
// ===============================================

function stubTool(key) {
  return {
    key,
    async run(input = {}, ctx = {}) {
      return {
        ok: false,
        stub: true,
        tool: key,
        message: `Tool '${key}' is not implemented yet in this build.`,
        input,
      };
    },
  };
}

module.exports = {
  // ---------- SEO TOOLS ----------

  // Product SEO Engine
  "product-seo": require("../tools/product-seo"),

  // AI Alt-Text Engine
  "ai-alt-text-engine": require("../tools/ai-alt-text-engine"),

  // Image Alt / Media SEO
  "image-alt-media-seo": require("../tools/image-alt-media-seo"),

  // Internal Link Optimiser
  "internal-link-optimizer": require("../tools/internal-link-optimizer"),

  // Technical SEO Auditor
  "technical-seo-auditor": require("../tools/technical-seo-auditor"),

  // Schema / Rich Results Engine
  "schema-rich-results-engine": require("../tools/schema-rich-results-engine"),

  // ---------- ACQUISITION / GROWTH TOOLS ----------

  // Multi-Channel Optimiser
  "multi-channel-optimizer": require("../tools/multi-channel-optimizer"),

  // AI Launch Planner
  "ai-launch-planner": require("../tools/ai-launch-planner"),

  // ---------- ADS / CREATIVES TOOLS ----------

  // Creative Automation Engine
  "creative-automation-engine": require("../tools/creative-automation-engine"),

  // ---------- BRAND TOOLS ----------

  // Brand Intelligence Layer
  "brand-intelligence-layer": require("../tools/brand-intelligence-layer"),

  // ---------- CRO / SOCIAL PROOF TOOLS ----------

  // Review & UGC Engine
  "review-ugc-engine": require("../tools/review-ugc-engine"),

  // ---------- DEVELOPERS TOOLS ----------

  // AURA API SDK (developer helper)
  "aura-api-sdk": require("../tools/aura-api-sdk"),

  // ---------- OPS TOOLS ----------

  // AURA Operations AI (ops copilot)
  "aura-operations-ai": require("../tools/aura-operations-ai"),

  // Inventory / Supplier Sync
  "inventory-supplier-sync": require("../tools/inventory-supplier-sync"),

  // ---------- FINANCE TOOLS ----------

  // Finance Autopilot
  "finance-autopilot": require("../tools/finance-autopilot"),

  // Daily CFO Pack
  "daily-cfo-pack": require("../tools/daily-cfo-pack"),

  // Auto-Insights (finance reporting helper)
  "auto-insights": require("../tools/auto-insights"),

  // ---------- EMAIL / FLOWS TOOLS ----------

  // Abandoned Checkout Winback
  "abandoned-checkout-winback": require("../tools/abandoned-checkout-winback"),

  // Email Automation Builder
  "email-automation-builder": require("../tools/email-automation-builder"),

  // Klaviyo Flow Automation
  "klaviyo-flow-automation": require("../tools/klaviyo-flow-automation"),

  // ---------- SUPPORT TOOLS ----------

  // AI Support Assistant
  "ai-support-assistant": require("../tools/ai-support-assistant"),

  // Inbox Reply Assistant
  "inbox-reply-assistant": require("../tools/inbox-reply-assistant"),

  // ---------- SAFETY NET (OPTIONAL / FUTURE TOOLS) ----------
  //
  // If you add any new tool IDs before creating their folder, you can temporarily
  // wire them up here using stubTool so the API doesn’t 404:
  //
  // "some-future-tool": stubTool("some-future-tool"),
};
