// src/core/tools-registry.js
// ===============================================
// Map of tool IDs -> tool modules
// Each module should export at least: { key, run(input, ctx) }
// ===============================================

function stubTool(key) {
  return {
    key,
    name: key,
    description: `Tool '${key}' is not implemented yet in this build.`,
    stub: true,
    async run(input = {}, ctx = {}) {
      return {
        ok: false,
        stub: true,
        key,
        message: `Tool '${key}' is not implemented yet in this build.`,
        input,
        ctx: {
          env: ctx.env,
          requestId: ctx.requestId,
        },
      };
    },
  };
}

module.exports = {
  // ---------- Fully implemented tools ----------
  "product-seo": require("../tools/product-seo"),
  "review-ugc-engine": require("../tools/review-ugc-engine"),
  "image-alt-media-seo": require("../tools/image-alt-media-seo"),
  "internal-link-optimizer": require("../tools/internal-link-optimizer"),
  "technical-seo-auditor": require("../tools/technical-seo-auditor"),
  "schema-rich-results-engine": require("../tools/schema-rich-results-engine"),
  "email-automation-builder": require("../tools/email-automation-builder"),
  "ai-alt-text-engine": require("../tools/ai-alt-text-engine"),
  "ai-launch-planner": require("../tools/ai-launch-planner"),
  "ai-support-assistant": require("../tools/ai-support-assistant"),
  "aura-api-sdk": require("../tools/aura-api-sdk"),
  "aura-operations-ai": require("../tools/aura-operations-ai"),
  "finance-autopilot": require("../tools/finance-autopilot"),
  "daily-cfo-pack": require("../tools/daily-cfo-pack"),
  "auto-insights": require("../tools/auto-insights"),
  "abandoned-checkout-winback": require("../tools/abandoned-checkout-winback"),
  "klaviyo-flow-automation": require("../tools/klaviyo-flow-automation"),
  "inbox-reply-assistant": require("../tools/inbox-reply-assistant"),
  "inventory-supplier-sync": require("../tools/inventory-supplier-sync"),
  "brand-intelligence-layer": require("../tools/brand-intelligence-layer"),
  "creative-automation-engine": require("../tools/creative-automation-engine"),
  "multi-channel-optimizer": require("../tools/multi-channel-optimizer"),

  // ---------- Example stubs if you add more IDs later ----------
  // "workflow-orchestrator": stubTool("workflow-orchestrator"),
  // "content-hub": stubTool("content-hub"),
};
