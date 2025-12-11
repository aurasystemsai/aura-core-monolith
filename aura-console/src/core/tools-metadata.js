// aura-console/src/core/tools-metadata.js
// ------------------------------------------
// Static metadata for AURA tools used by the
// Automation Console UI.
// ------------------------------------------

export const TOOLS_METADATA = [
  // --- SEO / CRO ---
  {
    id: "product-seo",
    name: "Product SEO Engine",
    category: "SEO",
    tag: "SEO",
    description:
      "Generate SEO titles, descriptions, slugs and keywords for products.",
    examplePayload: {
      productTitle: "Waterproof gold huggie earrings",
      productDescription:
        "Demi-fine waterproof huggie hoops in 18k gold, everyday wear.",
      brand: "DTP Jewellry",
      tone: "elevated, modern, UK English",
    },
  },
  {
    id: "review-ugc-engine",
    name: "Review & UGC Engine",
    category: "CRO / Social Proof",
    tag: "CRO / SOCIAL PROOF",
    description:
      "Generate on-brand customer reviews, UGC snippets and social proof.",
    examplePayload: {
      productTitle: "Waterproof layered necklace",
      brand: "DTP Jewellry",
      useCases: ["gym", "shower", "holiday"],
    },
  },
  {
    id: "ai-alt-text-engine",
    name: "AI Alt-Text Engine",
    category: "SEO",
    tag: "SEO",
    description:
      "Create descriptive, keyword-aware image alt text at scale for every product asset.",
    examplePayload: {
      imageUrl:
        "https://example.com/products/waterproof-gold-huggie-earrings.jpg",
      productTitle: "Waterproof gold huggie earrings",
      productHandle: "waterproof-gold-huggie-earrings",
    },
  },
  {
    id: "image-alt-media-seo",
    name: "Image Alt / Media SEO",
    category: "SEO",
    tag: "SEO",
    description:
      "Bulk optimise media metadata for SEO and accessibility across the store.",
    examplePayload: {
      images: [
        {
          url: "https://example.com/products/1.jpg",
          productTitle: "Waterproof tennis bracelet",
        },
      ],
    },
  },
  {
    id: "internal-link-optimizer",
    name: "Internal Link Optimiser",
    category: "SEO",
    tag: "SEO",
    description:
      "Suggest internal links between products, collections, articles and content.",
    examplePayload: {
      sourceUrl: "https://dtpjewellry.com/products/waterproof-hoops",
    },
  },

  // --- Finance / Ops ---
  {
    id: "finance-autopilot",
    name: "Finance Autopilot",
    category: "Ops / Finance",
    tag: "OPS / FINANCE",
    description:
      "Summarise revenue, costs, profit and basic KPIs over a selected period.",
    examplePayload: {
      period: "last_30_days",
      currency: "GBP",
    },
  },
  {
    id: "daily-cfo-pack",
    name: "Daily CFO Pack",
    category: "Finance",
    tag: "FINANCE",
    description:
      "Short daily summary with cash, P&L highlights and alerts for the founder.",
    examplePayload: {
      period: "yesterday",
      currency: "GBP",
    },
  },
  {
    id: "inventory-supplier-sync",
    name: "Inventory & Supplier Sync",
    category: "Ops",
    tag: "OPS",
    description:
      "Draft PO emails and sync notes between inventory and suppliers.",
    examplePayload: {
      supplierName: "Core Jewellery Supplier",
      sku: "DTP-HOOP-GOLD-12MM",
      reorderQty: 150,
    },
  },

  // --- Email / Flows ---
  {
    id: "abandoned-checkout-winback",
    name: "Abandoned Checkout Winback",
    category: "Email / Flows",
    tag: "EMAIL / FLOWS",
    description:
      "Draft high-converting email sequences to recover abandoned carts and checkouts.",
    examplePayload: {
      discountCode: "WINBACK10",
      brand: "DTP Jewellry",
      tone: "friendly, on-brand, UK English",
    },
  },
  {
    id: "email-automation-builder",
    name: "Email Automation Builder",
    category: "Email / Flows",
    tag: "EMAIL / FLOWS",
    description:
      "Design and draft full email flows like welcome, winback and post-purchase.",
    examplePayload: {
      flowType: "welcome",
      brand: "DTP Jewellry",
      tone: "warm, high-end, conversational",
    },
  },
  {
    id: "klaviyo-flow-automation",
    name: "Klaviyo Flow Automation",
    category: "Email / Flows",
    tag: "EMAIL / FLOWS",
    description:
      "Blueprint and copy for Klaviyo email and SMS flows ready to paste into Klaviyo.",
    examplePayload: {
      flowType: "post_purchase",
      platform: "klaviyo",
    },
  },

  // --- Support / Ops AI ---
  {
    id: "ai-support-assistant",
    name: "AI Support Assistant",
    category: "Support",
    tag: "SUPPORT",
    description:
      "Draft helpful, on-brand responses for common support tickets and macros.",
    examplePayload: {
      ticketType: "refund_request",
      orderCountry: "UK",
    },
  },
  {
    id: "inbox-assistant",
    name: "Inbox Assistant",
    category: "Support",
    tag: "SUPPORT",
    description:
      "Summarise and prioritise incoming messages for busy inboxes with suggested replies.",
    examplePayload: {
      channel: "email",
    },
  },
  {
    id: "inbox-reply-assistant",
    name: "Inbox Reply Assistant",
    category: "Support",
    tag: "SUPPORT",
    description:
      "Draft fast, personalised responses to individual messages inside the founder inbox.",
    examplePayload: {
      customerMessage:
        "My necklace has tarnished after 3 months – what can I do?",
    },
  },
  {
    id: "customer-support-ai",
    name: "Customer Support AI",
    category: "Support",
    tag: "SUPPORT",
    description:
      "Draft full reply templates and macros for common support scenarios.",
    examplePayload: {
      scenario: "shipping_delay",
      brand: "DTP Jewellry",
    },
  },

  // --- Brand / Strategy / Insights ---
  {
    id: "auto-insights",
    name: "Auto Insights",
    category: "Analytics",
    tag: "ANALYTICS",
    description:
      "Turn store metrics into simple, human-readable insight summaries.",
    examplePayload: {
      metricSource: "shopify_analytics",
      period: "last_7_days",
    },
  },
  {
    id: "brand-intelligence-layer",
    name: "Brand Intelligence Layer",
    category: "Brand",
    tag: "BRAND",
    description:
      "Central reference of brand voice, tone and positioning to keep tools consistent.",
    examplePayload: {
      brand: "DTP Jewellry",
      targetCustomer: "UK-based women 20-40",
    },
  },
  {
    id: "creative-automation-engine",
    name: "Creative Automation Engine",
    category: "Ads / Creatives",
    tag: "ADS / CREATIVES",
    description:
      "Generate hooks, angles and creative briefs for ads and social content.",
    examplePayload: {
      channel: "meta_ads",
      objective: "prospecting",
    },
  },
  {
    id: "ai-launch-planner",
    name: "AI Launch Planner",
    category: "Growth",
    tag: "GROWTH",
    description:
      "Plan product launches, timelines and promo angles automatically.",
    examplePayload: {
      launchType: "new_collection",
      timeframeWeeks: 4,
    },
  },
  {
    id: "ltv-churn-predictor",
    name: "LTV / Churn Predictor",
    category: "Analytics",
    tag: "ANALYTICS",
    description:
      "Estimate customer LTV and churn probabilities from transaction data.",
    examplePayload: {
      customerSample: 250,
    },
  },
  {
    id: "multi-channel-optimizer",
    name: "Multi-Channel Optimizer",
    category: "Acquisition",
    tag: "ACQUISITION",
    description:
      "Give recommendations across paid, organic and email channels.",
    examplePayload: {
      channels: ["meta", "google", "email"],
    },
  },

  // --- Developers / Core ---
  {
    id: "aura-api-sdk",
    name: "AURA API SDK",
    category: "Developers",
    tag: "DEVELOPERS",
    description:
      "Developer-facing helper for integrating with AURA endpoints.",
    examplePayload: {
      language: "javascript",
      framework: "nextjs",
    },
  },
  {
    id: "aura-operations-ai",
    name: "AURA Operations AI",
    category: "Ops",
    tag: "OPS",
    description:
      "Copilot for operations, inventory and fulfilment questions.",
    examplePayload: {
      question: "What SKUs are likely to go out of stock next week?",
    },
  },
];

// Convenience exports for the console UI
export const toolsMetadata = TOOLS_METADATA;
export default toolsMetadata;
