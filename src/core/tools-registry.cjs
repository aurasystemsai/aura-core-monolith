// src/core/tools-registry.js
// ------------------------------------------------------
// Central registry for all AURA Core tools.
//
// Each tool must export:
//   - meta: { id: string, name: string, ... }
//   - run(input, ctx)
//
// This file collects them, verifies unique IDs and exposes:
//   - toolsById: { [id]: toolModule }
//   - getTool(id): toolModule (throws if unknown)
//   - listTools(): { id, name, category }[]
// ------------------------------------------------------

"use strict";

// SEO + content tools
const productSeo = require("../tools/product-seo");
const blogSeo = require("../tools/blog-seo");
const weeklyBlogContentEngine = require("../tools/weekly-blog-content-engine");
const onPageSeoEngine = require("../tools/on-page-seo-engine");
const technicalSeoAuditor = require("../tools/technical-seo-auditor");
const schemaRichResultsEngine = require("../tools/schema-rich-results-engine");
const imageAltMediaSeo = require("../tools/image-alt-media-seo");
const rankVisibilityTracker = require("../tools/rank-visibility-tracker");
const aiAltTextEngine = require("../tools/ai-alt-text-engine");
const blogDraftEngine = require("../tools/blog-draft-engine");

// Lifecycle / retention / automation tools
const abandonedCheckoutWinback = require("../tools/abandoned-checkout-winback");
const returnsRmaAutomation = require("../tools/returns-rma-automation");
const ltvChurnPredictor = require("../tools/ltv-churn-predictor");
const emailAutomationBuilder = require("../tools/email-automation-builder");
const socialSchedulerContentEngine = require("../tools/social-scheduler-content-engine");
const reviewUgcEngine = require("../tools/review-ugc-engine");
const klaviyoFlowAutomation = require("../tools/klaviyo-flow-automation");

// Pricing, finance, operations
const dynamicPricingEngine = require("../tools/dynamic-pricing-engine");
const financeAutopilot = require("../tools/finance-autopilot");
const dailyCfoPack = require("../tools/daily-cfo-pack");
const inventorySupplierSync = require("../tools/inventory-supplier-sync");
const multiChannelOptimizer = require("../tools/multi-channel-optimizer");

// Support, inbox, assistants
const customerSupportAi = require("../tools/customer-support-ai");
const inboxAssistant = require("../tools/inbox-assistant");
const inboxReplyAssistant = require("../tools/inbox-reply-assistant");
const aiSupportAssistant = require("../tools/ai-support-assistant");

// Strategy, insights, brand / ops layers
const aiLaunchPlanner = require("../tools/ai-launch-planner");
const autoInsights = require("../tools/auto-insights");
const brandIntelligenceLayer = require("../tools/brand-intelligence-layer");
const creativeAutomationEngine = require("../tools/creative-automation-engine");
const auraOperationsAi = require("../tools/aura-operations-ai");

// Platform / orchestration (no dev-only stubs here)
// NOTE: The previous aura-api-sdk helper did not expose meta.id
// so it cannot live in the tools registry. Keep SDK-style helpers
// in /tools but DO NOT register them here unless they behave like tools.
const workflowOrchestrator = require("../tools/workflow-orchestrator");

// ------------------------------------------------------
// Master list – ONE place to register tools.
// ------------------------------------------------------
const allTools = [
  // SEO + content
  productSeo,
  blogSeo,
  weeklyBlogContentEngine,
  onPageSeoEngine,
  technicalSeoAuditor,
  schemaRichResultsEngine,
  imageAltMediaSeo,
  rankVisibilityTracker,
  aiAltTextEngine,
  blogDraftEngine,

  // Lifecycle / retention
  abandonedCheckoutWinback,
  returnsRmaAutomation,
  ltvChurnPredictor,
  emailAutomationBuilder,
  socialSchedulerContentEngine,
  reviewUgcEngine,
  klaviyoFlowAutomation,

  // Pricing / finance / ops
  dynamicPricingEngine,
  financeAutopilot,
  dailyCfoPack,
  inventorySupplierSync,
  multiChannelOptimizer,

  // Support / inbox / assistants
  customerSupportAi,
  inboxAssistant,
  inboxReplyAssistant,
  aiSupportAssistant,

  // Strategy / insights / brand / ops
  aiLaunchPlanner,
  autoInsights,
  brandIntelligenceLayer,
  creativeAutomationEngine,
  auraOperationsAi,

  // Platform / orchestration
  workflowOrchestrator,
];

// ------------------------------------------------------
// Build { id -> tool } map and validate
// ------------------------------------------------------
const toolsById = allTools.reduce((map, tool) => {
  if (!tool || !tool.meta || !tool.meta.id) {
    throw new Error(
      "Tool missing meta.id – every tool must export meta.id: " +
        JSON.stringify(Object.keys(tool || {}))
    );
  }

  const id = tool.meta.id;

  if (map[id]) {
    throw new Error(`Duplicate tool id registered in tools-registry: ${id}`);
  }

  map[id] = tool;
  return map;
}, {});

/**
 * Lookup a tool by ID.
 * Throws if the tool is not registered.
 */
function getTool(toolId) {
  const tool = toolsById[toolId];

  if (!tool) {
    throw new Error(`Unknown tool: ${toolId}`);
  }

  return tool;
}

/**
 * Convenience: list all registered tools (id + name).
 * Useful for debugging / API introspection.
 */
function listTools() {
  return Object.values(toolsById).map((tool) => ({
    id: tool.meta.id,
    name: tool.meta.name,
    category: tool.meta.category || null,
  }));
}

module.exports = {
  toolsById,
  getTool,
  listTools,
};
