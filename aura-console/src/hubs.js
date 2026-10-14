// Each hub is one menu entry that holds several existing tools as tabs.
// The tools, their API routes and their credit rules are unchanged.
export const HUBS = [
  {
    id: "blog-studio", name: "Blog Studio", suite: "seo", category: "Content",
    description: "Write, optimise and schedule blog posts with AI, all in one place.",
    tabs: [
      { id: "blog-draft-engine", label: "Draft" },
      { id: "blog-seo", label: "SEO" },
      { id: "weekly-blog-content-engine", label: "Weekly plan" },
    ],
  },
  {
    id: "content-research", name: "Content Research", suite: "seo", category: "Content",
    description: "Keywords, briefs, topics and content scoring in one research flow.",
    tabs: [
      { id: "keyword-research-suite", label: "Keywords" },
      { id: "ai-content-brief-generator", label: "Briefs" },
      { id: "entity-topic-explorer", label: "Topics" },
      { id: "content-scoring-optimization", label: "Scoring" },
      { id: "ai-content-image-gen", label: "Copy & images" },
    ],
  },
  {
    id: "site-audit", name: "Site Audit", suite: "seo", category: "SEO",
    description: "Crawl your store, check on-page and technical SEO, and fix problems.",
    tabs: [
      { id: "seo-site-crawler", label: "Crawler" },
      { id: "on-page-seo-engine", label: "On-page" },
      { id: "technical-seo-auditor", label: "Technical" },
    ],
  },
  {
    id: "product-optimiser", name: "Product Optimiser", suite: "seo", category: "SEO",
    description: "Fix product titles, meta and image alt text with AI.",
    tabs: [
      { id: "product-seo", label: "Product SEO" },

      { id: "image-alt-media-seo", label: "Image alt text" },
      { id: "digital-asset-management", label: "Media library" },
    ],
  },
  {
    id: "search-visibility", name: "Search Visibility", suite: "seo", category: "SEO",
    description: "Rankings in Google plus visibility in ChatGPT, Perplexity and AI answers.",
    tabs: [
      { id: "rank-visibility-tracker", label: "Google rankings" },
      { id: "ai-visibility-tracker", label: "AI answers" },
      { id: "ai-shopping-readiness", label: "AI shopping" },
      { id: "backlink-explorer", label: "Link building" },
      { id: "competitive-analysis", label: "Competitors" },
    ],
  },
  {
    id: "messaging", name: "Email & SMS", suite: "lifecycle", category: "Email",
    description: "Campaigns, flows, win-back, SMS and WhatsApp, and deliverability.",
    tabs: [
      { id: "email-automation-builder", label: "Email" },
      { id: "abandoned-checkout-winback", label: "Win-back" },
      { id: "sms-whatsapp-marketing", label: "SMS & WhatsApp" },
      { id: "email-deliverability", label: "Deliverability" },
    ],
  },
  {
    id: "capture-notify", name: "Capture & Notify", suite: "personalization", category: "Personalization",
    description: "Popups that collect emails and back-in-stock alerts that bring shoppers back.",
    tabs: [
      { id: "popups", label: "Popups" },
      { id: "back-in-stock", label: "Back in stock" },
    ],
  },
  {
    id: "offers-upsell", name: "Offers & Upsell", suite: "personalization", category: "Personalization",
    description: "Upsells, cross-sells, bundles and discount codes from one place.",
    tabs: [
      { id: "upsell-cross-sell-engine", label: "Upsell" },
      { id: "discounts-bundles", label: "Discounts & bundles" },
    ],
  },
  {
    id: "loyalty-reviews", name: "Loyalty & Reviews", suite: "support", category: "Support",
    description: "Reviews, user content, points and referrals.",
    tabs: [
      { id: "review-ugc-engine", label: "Reviews" },
      { id: "loyalty-referral-programs", label: "Loyalty & referrals" },
      { id: "affiliate-partner-management", label: "Affiliates" },
    ],
  },
  {
    id: "customers-profit", name: "Customers & Profit", suite: "analytics", category: "Analytics",
    description: "Who your customers are, what they are worth, and how to price for profit.",
    tabs: [
      { id: "customer-data-platform", label: "Customers" },
      { id: "dynamic-pricing-engine", label: "Pricing" },
      { id: "auto-insights", label: "Reports" },
      { id: "profit-analytics", label: "Profit" },
      { id: "order-risk", label: "Order risk" },
    ],
  },
  {
    id: "ads-hub", name: "Ads", suite: "ads", category: "Ads",
    description: "Meta, Google and TikTok accounts, AI ad copy and spend alerts.",
    tabs: [
      { id: "facebook-ads-integration", label: "Meta" },
      { id: "google-ads-integration", label: "Google" },
      { id: "tiktok-ads-integration", label: "TikTok" },
      { id: "ad-creative-optimizer", label: "Ad copy" },
      { id: "ads-anomaly-guard", label: "Spend alerts" },
    ],
  },
  {
    id: "specialist-seo", name: "Specialist SEO", suite: "seo", category: "SEO",
    description: "Local, voice and video search tools for stores that need them.",
    tabs: [
      { id: "local-seo-toolkit", label: "Local SEO" },
    ],
  },
  {
    id: "social-hub", name: "Social", suite: "social", category: "Social",
    description: "Write social posts from your real products and plan what to post.",
    tabs: [
      { id: "social-scheduler-content-engine", label: "Post planner" },
    ],
  },
  {
    id: "reports-analytics", name: "Reports & Analytics", suite: "analytics", category: "Analytics",
    description: "Build and download reports from your real recent Shopify orders.",
    tabs: [
      { id: "self-service-analytics", label: "Shopify reports" },
    ],
  },
  {
    id: "finance-stock", name: "Finance & Stock", suite: "finance", category: "Finance",
    description: "Real Shopify stock levels, recent sales, reorder suggestions and purchase orders.",
    tabs: [
      { id: "inventory-forecasting", label: "Inventory & Cash" },
    ],
  },
  {
    id: "support-desk", name: "Support Desk", suite: "support", category: "Support",
    description: "Track real Shopify orders and manage customer return requests.",
    tabs: [
      { id: "order-tracking", label: "Order tracking" },
      { id: "returns-rma-automation", label: "Returns" },
    ],
  },
  {
    id: "automation-hub", name: "Workflow Builder", suite: "automation", category: "Automation",
    description: "Run rules against real Shopify stock, customer and order data.",
    tabs: [
      { id: "workflow-automation-builder", label: "Store rules" },
    ],
  },
];

const byTab = new Map();
for (const hub of HUBS) for (const tab of hub.tabs) byTab.set(tab.id, hub);
const byId = new Map(HUBS.map((h) => [h.id, h]));

export const isHub = (id) => byId.has(id);
export const hubById = (id) => byId.get(id) || null;
export const hubForTool = (toolId) => byTab.get(toolId) || null;
// A hub id or any of its tool ids resolves to the hub and the tab to show.
const ALIASES = { "ai-alt-text-engine": "image-alt-media-seo", "loyalty-referral-program-v2": "loyalty-referral-programs" };
export function resolveSection(raw) {
  const section = ALIASES[raw] || raw;
  if (byId.has(section)) return { hub: byId.get(section), tab: null };
  if (byTab.has(section)) return { hub: byTab.get(section), tab: section };
  return null;
}
export const hiddenToolIds = new Set(byTab.keys());

// Tools that exist but are still being rebuilt on real store data.
const PREVIEW = new Set(["advanced-analytics-attribution", "advanced-finance-inventory-planning", "ai-launch-planner", "ai-segmentation-engine", "aura-api-sdk", "aura-operations-ai", "automation-templates", "brand-intelligence-layer", "churn-prediction-playbooks", "collaboration-approval-workflows", "compliance-privacy-suite", "conditional-logic-automation", "creative-automation-engine", "custom-dashboard-builder", "daily-cfo-pack", "finance-autopilot", "inventory-supplier-sync", "link-intersect-outreach", "ltv-churn-predictor", "multi-channel-optimizer", "predictive-analytics-widgets", "reporting-integrations", "scheduled-export", "social-media-analytics-listening", "video-podcast-seo", "visual-workflow-builder", "voice-search-optimization", "webhook-api-triggers", "workflow-orchestrator"]);
export const isPreviewTool = (id) => PREVIEW.has(id);
export const isPreviewHub = (id) => { const h = byId.get(id); return !!h && h.tabs.every((x) => PREVIEW.has(x.id)); };
