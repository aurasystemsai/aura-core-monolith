// Only tools with verified UI and API workflows are listed as live.
const toolsMeta = [
 // ── Live tools ──
 { id: "blog-seo", name: "Blog SEO Engine", description: "Optimize blog content with keyword clusters, internal linking, and SEO scoring.", category: "SEO", suite: "seo" },
 { id: "discounts-bundles", name: "Discounts & Bundles", description: "AI offers built from what your customers really buy together. Create, pause and delete real Shopify discount codes.", category: "Personalization", suite: "personalization" },
 { id: "translations", name: "Translations", description: "Translate products into your store languages with AI, review each one, and undo any change.", category: "SEO", suite: "seo" },
  { id: "product-feed", name: "Product Feed", description: "Check every product against Google Shopping rules, fix weak listings with AI, and export a ready-to-upload feed.", category: "SEO", suite: "seo" },
  { id: "product-seo", name: "Product SEO Engine", description: "Generate and apply SEO metadata to Shopify products.", category: "SEO", suite: "seo" },
 { id: "image-alt-media-seo", name: "Image Alt Text", description: "Find product images with missing or poor alt text and fix them with AI.", category: "SEO", suite: "seo" },
 { id: "ab-testing-suite", name: "A/B Testing Suite", description: "Create controlled experiments, allocate traffic and measure conversion outcomes.", category: "Analytics", suite: "analytics" },
 // ── Coming soon (hidden until built & tested) ──
 { id: "blog-draft-engine", name: "Blog Draft Engine", description: "Create and publish SEO-optimized blog content with AI assistance.", category: "Content", suite: "seo" },
 { id: "weekly-blog-content-engine", name: "Weekly Blog Content Engine", description: "Automate your blog publishing calendar with AI-generated content.", category: "Content", suite: "seo" },
 { id: "on-page-seo-engine", name: "On-Page SEO Engine", description: "Audit and optimize on-page SEO factors across your entire store.", category: "SEO", suite: "seo" },
 { id: "technical-seo-auditor", name: "Technical SEO Auditor", description: "Deep technical SEO audits with crawl analysis and fix recommendations.", category: "SEO", suite: "seo" },
 { id: "schema-rich-results-engine", name: "Schema & Rich Results", description: "Generate and validate structured data for enhanced search listings.", category: "SEO", suite: "seo" },
 { id: "rank-visibility-tracker", name: "Rank & Visibility Tracker", description: "Track keyword rankings and search visibility over time.", category: "SEO", suite: "seo" },
 { id: "ai-visibility-tracker", name: "AI Visibility Tracker", description: "Track and optimize your brand's visibility in AI-generated answers, ChatGPT, Perplexity, and Google AI Overviews.", category: "SEO", suite: "seo" },
 { id: "seo-site-crawler", name: "SEO Site Crawler", description: "Audit products, pages, collections and articles for missing meta, thin content, alt text and duplicates, then AI-fix products.", category: "SEO", suite: "seo" },
 { id: "internal-link-optimizer", name: "Internal Link Optimizer", description: "Discover and implement internal linking opportunities.", category: "SEO", suite: "seo" },
 { id: "ai-content-brief-generator", name: "AI Content Brief Generator", description: "Generate comprehensive content briefs with keyword strategies.", category: "Content", suite: "seo" },
 { id: "content-scoring-optimization", name: "Content Scoring & Optimization", description: "Analyze and improve content quality with multi-factor scoring.", category: "Content", suite: "seo" },
 { id: "keyword-research-suite", name: "Keyword Research Suite", description: "Cluster your keyword list by topic or intent, plan content silos, and schedule publishing.", category: "SEO", suite: "seo" },
 { id: "ai-content-image-gen", name: "AI Content & Image Gen", description: "Generate marketing copy and images with AI.", category: "Content", suite: "seo" },

 // ── Email & Lifecycle (5 tools) ──
 { id: "email-automation-builder", name: "Email Automation Builder", description: "Build sophisticated multi-channel email campaigns with drag-and-drop automation.", category: "Email", suite: "lifecycle" },
 { id: "abandoned-checkout-winback", name: "Abandoned Checkout Winback", description: "Recover lost sales with automated win-back sequences.", category: "Email", suite: "lifecycle" },
 { id: "returns-rma-automation", name: "Returns", description: "Log return requests, check them against real orders and track them to refund.", category: "Email", suite: "lifecycle" },

 // ── Customer Support (4 tools) ──
 { id: "ai-support-assistant", name: "AI Support Assistant", description: "Instant AI-powered responses trained on your knowledge base.", category: "Support", suite: "support" },
 { id: "review-ugc-engine", name: "Review & UGC Engine", description: "Manage reviews and user content with moderation and sentiment analysis.", category: "Support", suite: "support" },

 // ── Social & Brand (5 tools) ──
 { id: "brand-mention-tracker", name: "Brand Mention Tracker", description: "Track brand mentions with sentiment analysis and crisis alerts.", category: "Brand", suite: "social" },

 // ── Ads & Acquisition (6 tools) ──
 { id: "google-ads-integration", name: "Google Ads", description: "Manage Google Ads campaigns with AI bidding and optimization.", category: "Ads", suite: "ads" },
 { id: "facebook-ads-integration", name: "Facebook & Instagram Ads", description: "Run and optimize Meta ad campaigns from one dashboard.", category: "Ads", suite: "ads" },
 { id: "tiktok-ads-integration", name: "TikTok Ads", description: "Create and manage TikTok ad campaigns with creative tools.", category: "Ads", suite: "ads" },
 { id: "ads-anomaly-guard", name: "Ads Anomaly Guard", description: "Detect ad spend anomalies and protect your budget.", category: "Ads", suite: "ads" },
 { id: "ad-creative-optimizer", name: "Ad Creative Optimizer", description: "AI-powered ad creative testing and optimization.", category: "Ads", suite: "ads" },

 // ── Analytics & Intelligence (9 tools) ──
 { id: "auto-insights", name: "Reports & Forecast", description: "Sales report from real orders, 30-day forecast, CSV downloads, emailed copies and a plain-English read of the numbers.", category: "Analytics", suite: "analytics" },
 { id: "data-warehouse-connector", name: "Data Warehouse Connector", description: "Sync data to Snowflake, BigQuery, or Redshift.", category: "Analytics", suite: "analytics" },

 // ── Personalization & Revenue (10 tools) ──
 { id: "dynamic-pricing-engine", name: "Pricing Advisor", description: "Price suggestions from real stock and sales, applied to Shopify only when you approve them.", category: "Personalization", suite: "personalization" },
 { id: "upsell-cross-sell-engine", name: "Upsell & Cross-Sell Engine", description: "Increase AOV with AI-powered product recommendations.", category: "Personalization", suite: "personalization" },
 { id: "customer-data-platform", name: "Customer Data Platform", description: "Unify customer data with RFM analysis and behavioral segmentation.", category: "Personalization", suite: "personalization" },

 // ── Finance & Operations (4 tools) ──
 { id: "inventory-forecasting", name: "Inventory Forecasting", description: "AI-powered demand forecasting to prevent stockouts.", category: "Finance", suite: "finance" },
 { id: "email-deliverability", name: "Email Deliverability", description: "Monitor domain health, blacklist status, and ISP metrics to maximise inbox rates.", category: "Email", suite: "lifecycle" },
 { id: "entity-topic-explorer", name: "Entity & Topic Explorer", description: "Map semantic entity relationships and topic clusters for SEO authority.", category: "SEO", suite: "seo" },
 { id: "landing-page-builder", name: "Landing Page Builder", description: "Build high-converting landing pages with AI-generated copy and A/B testing.", category: "Content", suite: "seo" },
 { id: "mobile-app-analytics", name: "Mobile App Analytics", description: "Track app retention, screen flows, push campaigns, and crash rates.", category: "Analytics", suite: "analytics" },
 { id: "sms-whatsapp-marketing", name: "SMS & WhatsApp Marketing", description: "Automate SMS and WhatsApp campaigns with personalised messaging.", category: "Email", suite: "lifecycle" },
 { id: "workflow-automation-builder", name: "Automations", description: "Rules that check your real store data (low stock, lapsed customers, big orders) and email you or tag the matches.", category: "Automation", suite: "automation" },
 { id: "ai-copilot", name: "AI Copilot", description: "Your AI-powered store assistant — ask anything about your data, campaigns, and strategy.", category: "AI", suite: "ai" },

 // ── Platform & Developer (5 tools) ──
 { id: "loyalty-referral-programs", name: "Loyalty & Referral Programs", description: "Create rewards programs that drive repeat purchases.", category: "Platform", suite: "platform" },
];

const suiteTitles = {
 seo: "SEO & Content",
 lifecycle: "Email & Lifecycle",
 support: "Customer Support",
 social: "Social & Brand",
 ads: "Ads & Acquisition",
 analytics: "Analytics & Intelligence",
 personalization: "Personalization & Revenue",
 finance: "Finance & Operations",
 automation: "Workflow & Automation",
 ai: "AI Tools",
 platform: "Platform & Developer",
};

export function getToolCatalogGroups(serverGroups = []) {
 const groups = new Map();
 const moduleLocations = new Map();
 const addGroup = (id, title, summary = "") => {
  if (!groups.has(id)) groups.set(id, { id, title, summary, modules: [] });
  return groups.get(id);
 };

 for (const tool of toolsMeta) {
  const id = tool.suite || tool.category?.toLowerCase() || "other";
  const group = addGroup(id, suiteTitles[id] || tool.category || "Other");
  if (moduleLocations.has(tool.id)) continue;
  group.modules.push(tool);
  moduleLocations.set(tool.id, group);
 }

 for (const serverGroup of serverGroups) {
  const groupId = serverGroup.id || "other";
  const group = addGroup(groupId, serverGroup.title || suiteTitles[groupId] || "Other", serverGroup.summary);
  for (const serverTool of serverGroup.modules || []) {
   const existingGroup = moduleLocations.get(serverTool.id);
   if (existingGroup) {
	const index = existingGroup.modules.findIndex(tool => tool.id === serverTool.id);
	existingGroup.modules[index] = { ...existingGroup.modules[index], ...serverTool };
   } else {
	group.modules.push(serverTool);
	moduleLocations.set(serverTool.id, group);
   }
  }
 }

 return Array.from(groups.values()).filter(group => group.modules.length > 0);
}

export default toolsMeta;