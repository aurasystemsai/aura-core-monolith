// src/core/tools-registry.js
// ===============================================
// Map of tool IDs -> tool modules
// Each module exports: { key, run(input, ctx) }
// ===============================================

module.exports = {
  // ---- Core tools that are already fully implemented ----
  "product-seo": require("../tools/product-seo"),
  "finance-autopilot": require("../tools/finance-autopilot"),
  "review-ugc-engine": require("../tools/review-ugc-engine"),
  "schema-rich-results-engine": require("../tools/schema-rich-results-engine"),

  // ---- Additional tools (rules-based placeholders, no AI) ----
  "ai-alt-text-engine": require("../tools/ai-alt-text-engine"),
  "ai-launch-planner": require("../tools/ai-launch-planner"),
  "ai-support-assistant": require("../tools/ai-support-assistant"),
  "aura-api-sdk": require("../tools/aura-api-sdk"),
  "aura-operations-ai": require("../tools/aura-operations-ai"),
  "auto-insights": require("../tools/auto-insights"),
  "brand-intelligence-layer": require("../tools/brand-intelligence-layer"),
  "creative-automation-engine": require("../tools/creative-automation-engine"),
  "customer-support-ai": require("../tools/customer-support-ai"),
  "daily-cfo-pack": require("../tools/daily-cfo-pack"),
  "dynamic-pricing-engine": require("../tools/dynamic-pricing-engine"),
  "email-automation-builder": require("../tools/email-automation-builder"),
  "image-alt-media-seo": require("../tools/image-alt-media-seo"),
  "inbox-assistant": require("../tools/inbox-assistant"),
  "inbox-reply-assistant": require("../tools/inbox-reply-assistant"),
  "internal-link-optimizer": require("../tools/internal-link-optimizer"),
  "inventory-supplier-sync": require("../tools/inventory-supplier-sync"),
  "klaviyo-flow-automation": require("../tools/klaviyo-flow-automation"),
  "ltv-churn-predictor": require("../tools/ltv-churn-predictor"),
  "multi-channel-optimizer": require("../tools/multi-channel-optimizer"),
  "on-page-seo-engine": require("../tools/on-page-seo-engine"),
  "rank-visibility-tracker": require("../tools/rank-visibility-tracker"),
  "returns-rma-automation": require("../tools/returns-rma-automation"),
  "social-scheduler-content-engine": require("../tools/social-scheduler-content-engine"),
  "technical-seo-auditor": require("../tools/technical-seo-auditor"),
  "weekly-blog-content-engine": require("../tools/weekly-blog-content-engine"),
  "workflow-orchestrator": require("../tools/workflow-orchestrator"),
};
