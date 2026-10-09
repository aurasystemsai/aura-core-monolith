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
    ],
  },
  {
    id: "search-visibility", name: "Search Visibility", suite: "seo", category: "SEO",
    description: "Rankings in Google plus visibility in ChatGPT, Perplexity and AI answers.",
    tabs: [
      { id: "rank-visibility-tracker", label: "Google rankings" },
      { id: "ai-visibility-tracker", label: "AI answers" },
      { id: "ai-shopping-readiness", label: "AI shopping" },
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
