// src/core/tools-registry.cjs
// ------------------------------------------------------
// Central registry for all AURA Core tools.
//
// Each tool must export:
//   - meta: { id: string, name: string, category?: string, ... }
//   - run(input, ctx)
//
// This file collects them, verifies unique IDs and exposes:
//   - toolsById: { [id]: toolModule }
//   - getTool(id): toolModule (throws if unknown)
//   - listTools(): [{ id, name, category }]
//
// Any module that does NOT expose meta.id is treated as a helper/SDK
// and is skipped (with a console warning) instead of crashing Core.
// ------------------------------------------------------

"use strict";

// ==============  SEO & Content  ==============
const productSeo = require("../tools/product-seo");
const blogSeo = require("../tools/blog-seo");
const blogDraftEngine = require("../tools/blog-draft-engine");
const weeklyBlogContentEngine = require("../tools/weekly-blog-content-engine");
const onPageSeoEngine = require("../tools/on-page-seo-engine");
const technicalSeoAuditor = require("../tools/technical-seo-auditor");
const schemaRichResultsEngine = require("../tools/schema-rich-results-engine");
const imageAltMediaSeo = require("../tools/image-alt-media-seo");
const rankVisibilityTracker = require("../tools/rank-visibility-tracker");
const seoSiteCrawler = require("../tools/seo-site-crawler");
const internalLinkOptimizer = require("../tools/internal-link-optimizer");
const aiContentImageGen = require("../tools/ai-content-image-gen");
const aiVisibilityTracker = require("../tools/ai-visibility-tracker");

// ==============  Email & Lifecycle  ==============
const emailAutomationBuilder = require("../tools/email-automation-builder");
const abandonedCheckoutWinback = require("../tools/abandoned-checkout-winback");
const returnsRmaAutomation = require("../tools/returns-rma-automation");
const reviewUgcEngine = require("../tools/review-ugc-engine");

// ==============  Customer Support  ==============
const aiSupportAssistant = require("../tools/ai-support-assistant");

// ==============  Ads & Acquisition  ==============
const googleAdsIntegration = require("../tools/google-ads-integration");
const facebookAdsIntegration = require("../tools/facebook-ads-integration");
const tiktokAdsIntegration = require("../tools/tiktok-ads-integration");
const adsAnomalyGuard = require("../tools/ads-anomaly-guard");
const adCreativeOptimizer = require("../tools/ad-creative-optimizer");

// ==============  Analytics & Intelligence  ==============
const loyaltyReferralPrograms = require("../tools/loyalty-referral-programs");
const autoInsights = require("../tools/auto-insights");

// ==============  Personalization & Revenue  ==============
const dynamicPricingEngine = require("../tools/dynamic-pricing-engine");

// ==============  Finance & Operations  ==============

// ==============  Social & Brand  ==============

// ==============  Platform & Developer  ==============
const mainSuite = require("../tools/main-suite");

// ------------------------------------------------------
// Master list – ONE place to register tools.
// Helpers/SDKs (aura-api-sdk) should NOT be in this array.
// Scaffold directories without index.js are not registered
// here but still have frontend UIs and backend dirs.
// ------------------------------------------------------
const allTools = [
  // SEO & Content
  productSeo, blogSeo, blogDraftEngine, weeklyBlogContentEngine,
  onPageSeoEngine, technicalSeoAuditor, schemaRichResultsEngine,
  imageAltMediaSeo, rankVisibilityTracker, seoSiteCrawler,
  internalLinkOptimizer, aiContentImageGen, aiVisibilityTracker, 

  // Email & Lifecycle
  emailAutomationBuilder, abandonedCheckoutWinback, returnsRmaAutomation,
  reviewUgcEngine,

  // Customer Support
  aiSupportAssistant,

  // Ads & Acquisition
  googleAdsIntegration, facebookAdsIntegration, tiktokAdsIntegration,
  adsAnomalyGuard, adCreativeOptimizer, 

  // Analytics & Intelligence
  
  loyaltyReferralPrograms, autoInsights,

  // Personalization & Revenue
  dynamicPricingEngine,

  // Finance & Operations
  

  // Social & Brand
  

  // Platform & Developer
  mainSuite,
];

// ------------------------------------------------------
// Build { id -> tool } map and validate.
// Any module without meta.id is treated as NON-tool and skipped.
// ------------------------------------------------------
const toolsById = {};

for (const mod of allTools) {
  if (!mod || typeof mod !== "object") {
    console.warn(
      "[tools-registry] Skipping invalid module (not an object):",
      mod
    );
    continue;
  }

  const keys = Object.keys(mod);

  if (!mod.meta || !mod.meta.id) {
    console.warn(
      "[tools-registry] Skipping module without meta.id; keys=",
      keys
    );
    continue;
  }

  const id = mod.meta.id;

  if (toolsById[id]) {
    throw new Error(
      `Duplicate tool id registered in tools-registry: ${id}`
    );
  }

  toolsById[id] = mod;
}

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
