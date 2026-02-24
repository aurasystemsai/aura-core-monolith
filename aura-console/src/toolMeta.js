// All-in-one AI growth platform — 65 tools across 9 suites
// Every tool that has a frontend component is listed here

const toolsMeta = [
  // ── SEO & Content (19 tools) ──
  { id: "product-seo", name: "Product SEO Engine", description: "Optimize product pages for search with AI-powered metadata and content.", category: "SEO", suite: "seo" },
  { id: "blog-seo", name: "Blog SEO Engine", description: "Optimize blog content with keyword clusters, internal linking, and SEO scoring.", category: "SEO", suite: "seo" },
  { id: "blog-draft-engine", name: "Blog Draft Engine", description: "Create and publish SEO-optimized blog content with AI assistance.", category: "Content", suite: "seo" },
  { id: "weekly-blog-content-engine", name: "Weekly Blog Content Engine", description: "Automate your blog publishing calendar with AI-generated content.", category: "Content", suite: "seo" },
  { id: "on-page-seo-engine", name: "On-Page SEO Engine", description: "Audit and optimize on-page SEO factors across your entire store.", category: "SEO", suite: "seo" },
  { id: "technical-seo-auditor", name: "Technical SEO Auditor", description: "Deep technical SEO audits with crawl analysis and fix recommendations.", category: "SEO", suite: "seo" },
  { id: "schema-rich-results-engine", name: "Schema & Rich Results", description: "Generate and validate structured data for enhanced search listings.", category: "SEO", suite: "seo" },
  { id: "image-alt-media-seo", name: "Image & Media SEO", description: "AI-powered alt text, image optimization, and media SEO.", category: "SEO", suite: "seo" },
  { id: "rank-visibility-tracker", name: "Rank & Visibility Tracker", description: "Track keyword rankings and search visibility over time.", category: "SEO", suite: "seo" },
  { id: "ai-visibility-tracker", name: "AI Visibility Tracker", description: "Track and optimize your brand's visibility in AI-generated answers, ChatGPT, Perplexity, and Google AI Overviews.", category: "SEO", suite: "seo" },
  { id: "seo-site-crawler", name: "SEO Site Crawler", description: "Crawl your site to find broken links, redirects, and SEO issues.", category: "SEO", suite: "seo" },
  { id: "internal-link-optimizer", name: "Internal Link Optimizer", description: "Discover and implement internal linking opportunities.", category: "SEO", suite: "seo" },
  { id: "ai-content-brief-generator", name: "AI Content Brief Generator", description: "Generate comprehensive content briefs with keyword strategies.", category: "Content", suite: "seo" },
  { id: "content-scoring-optimization", name: "Content Scoring & Optimization", description: "Analyze and improve content quality with multi-factor scoring.", category: "Content", suite: "seo" },
  { id: "keyword-research-suite", name: "Keyword Research Suite", description: "Discover high-value keywords with volume, difficulty, and intent analysis.", category: "SEO", suite: "seo" },
  { id: "backlink-explorer", name: "Backlink Explorer", description: "Analyze your backlink profile and find link-building opportunities.", category: "SEO", suite: "seo" },
  { id: "link-intersect-outreach", name: "Link Intersect & Outreach", description: "Find sites linking to competitors but not you, with outreach templates.", category: "SEO", suite: "seo" },
  { id: "local-seo-toolkit", name: "Local SEO Toolkit", description: "Optimize for local search with Google Business Profile management.", category: "SEO", suite: "seo" },
  { id: "competitive-analysis", name: "Competitive Analysis", description: "Benchmark against competitors across SEO, content, and market share.", category: "SEO", suite: "seo" },
  { id: "ai-content-image-gen", name: "AI Content & Image Gen", description: "Generate marketing copy and images with AI.", category: "Content", suite: "seo" },

  // ── Email & Lifecycle (5 tools) ──
  { id: "email-automation-builder", name: "Email Automation Builder", description: "Build sophisticated multi-channel email campaigns with drag-and-drop automation.", category: "Email", suite: "lifecycle" },
  { id: "abandoned-checkout-winback", name: "Abandoned Checkout Winback", description: "Recover lost sales with automated win-back sequences.", category: "Email", suite: "lifecycle" },
  { id: "returns-rma-automation", name: "Returns & RMA Automation", description: "Streamline returns and exchanges with automated workflows.", category: "Email", suite: "lifecycle" },
  { id: "automation-templates", name: "Automation Templates", description: "Pre-built automation templates for common marketing workflows.", category: "Email", suite: "lifecycle" },
  { id: "collaboration-approval-workflows", name: "Collaboration & Approvals", description: "Team collaboration with approval workflows for campaigns.", category: "Email", suite: "lifecycle" },

  // ── Customer Support (4 tools) ──
  { id: "ai-support-assistant", name: "AI Support Assistant", description: "Instant AI-powered responses trained on your knowledge base.", category: "Support", suite: "support" },
  { id: "inbox-assistant", name: "Inbox Assistant", description: "Manage customer communications with AI-suggested responses.", category: "Support", suite: "support" },
  { id: "review-ugc-engine", name: "Review & UGC Engine", description: "Manage reviews and user content with moderation and sentiment analysis.", category: "Support", suite: "support" },
  { id: "self-service-portal", name: "Self-Service Portal", description: "Customer-facing help center with knowledge base and ticketing.", category: "Support", suite: "support" },

  // ── Social & Brand (5 tools) ──
  { id: "social-scheduler-content-engine", name: "Social Scheduler & Content", description: "Schedule and manage social content across all platforms.", category: "Social", suite: "social" },
  { id: "social-media-analytics-listening", name: "Social Analytics & Listening", description: "Monitor and analyze your social presence across 7+ platforms.", category: "Social", suite: "social" },
  { id: "brand-mention-tracker", name: "Brand Mention Tracker", description: "Track brand mentions with sentiment analysis and crisis alerts.", category: "Brand", suite: "social" },
  { id: "brand-intelligence-layer", name: "Brand Intelligence Layer", description: "Deep brand health analytics with competitive positioning.", category: "Brand", suite: "social" },
  { id: "creative-automation-engine", name: "Creative Automation Engine", description: "Automate creative asset generation and A/B testing.", category: "Brand", suite: "social" },

  // ── Ads & Acquisition (6 tools) ──
  { id: "google-ads-integration", name: "Google Ads", description: "Manage Google Ads campaigns with AI bidding and optimization.", category: "Ads", suite: "ads" },
  { id: "facebook-ads-integration", name: "Facebook & Instagram Ads", description: "Run and optimize Meta ad campaigns from one dashboard.", category: "Ads", suite: "ads" },
  { id: "tiktok-ads-integration", name: "TikTok Ads", description: "Create and manage TikTok ad campaigns with creative tools.", category: "Ads", suite: "ads" },
  { id: "ads-anomaly-guard", name: "Ads Anomaly Guard", description: "Detect ad spend anomalies and protect your budget.", category: "Ads", suite: "ads" },
  { id: "ad-creative-optimizer", name: "Ad Creative Optimizer", description: "AI-powered ad creative testing and optimization.", category: "Ads", suite: "ads" },
  { id: "omnichannel-campaign-builder", name: "Omnichannel Campaign Builder", description: "Build coordinated campaigns across email, ads, and social.", category: "Ads", suite: "ads" },

  // ── Analytics & Intelligence (9 tools) ──
  { id: "advanced-analytics-attribution", name: "Advanced Attribution", description: "Multi-touch attribution across all marketing channels.", category: "Analytics", suite: "analytics" },
  { id: "predictive-analytics-widgets", name: "Predictive Analytics", description: "AI-powered predictions for revenue, churn, and growth.", category: "Analytics", suite: "analytics" },
  { id: "self-service-analytics", name: "Self-Service Analytics", description: "Build custom reports and dashboards with drag-and-drop.", category: "Analytics", suite: "analytics" },
  { id: "auto-insights", name: "Auto Insights", description: "AI-generated insights surfaced automatically from your data.", category: "Analytics", suite: "analytics" },
  { id: "ai-segmentation-engine", name: "AI Segmentation Engine", description: "Automatic customer segmentation using machine learning.", category: "Analytics", suite: "analytics" },
  { id: "reporting-integrations", name: "Reporting & Integrations", description: "Connect data sources and export reports to external tools.", category: "Analytics", suite: "analytics" },
  { id: "custom-dashboard-builder", name: "Custom Dashboard Builder", description: "Build personalized dashboards with widgets and KPIs.", category: "Analytics", suite: "analytics" },
  { id: "scheduled-export", name: "Scheduled Export", description: "Automate data exports on a schedule to email, SFTP, or cloud.", category: "Analytics", suite: "analytics" },
  { id: "data-warehouse-connector", name: "Data Warehouse Connector", description: "Sync data to Snowflake, BigQuery, or Redshift.", category: "Analytics", suite: "analytics" },

  // ── Personalization & Revenue (10 tools) ──
  { id: "dynamic-pricing-engine", name: "Dynamic Pricing Engine", description: "Optimize pricing in real-time based on demand and competition.", category: "Personalization", suite: "personalization" },
  { id: "upsell-cross-sell-engine", name: "Upsell & Cross-Sell Engine", description: "Increase AOV with AI-powered product recommendations.", category: "Personalization", suite: "personalization" },
  { id: "customer-data-platform", name: "Customer Data Platform", description: "Unify customer data with RFM analysis and behavioral segmentation.", category: "Personalization", suite: "personalization" },
  { id: "personalization-recommendation-engine", name: "Personalization & Recommendations", description: "Deliver personalized experiences with collaborative filtering.", category: "Personalization", suite: "personalization" },
  { id: "advanced-personalization-engine", name: "Advanced Personalization Engine", description: "Real-time personalization with ML models and A/B testing.", category: "Personalization", suite: "personalization" },
  { id: "ltv-churn-predictor", name: "LTV & Churn Predictor", description: "Predict customer lifetime value and churn risk.", category: "Personalization", suite: "personalization" },
  { id: "churn-prediction-playbooks", name: "Churn Prediction Playbooks", description: "Automated playbooks triggered by churn risk signals.", category: "Personalization", suite: "personalization" },
  { id: "customer-segmentation-engine", name: "Customer Segmentation", description: "Advanced customer segmentation with behavioral clusters.", category: "Personalization", suite: "personalization" },
  { id: "customer-journey-mapping", name: "Customer Journey Mapping", description: "Visualize and optimize the full customer journey.", category: "Personalization", suite: "personalization" },
  { id: "data-enrichment-suite", name: "Data Enrichment Suite", description: "Enrich customer profiles with third-party data sources.", category: "Personalization", suite: "personalization" },

  // ── Finance & Operations (4 tools) ──
  { id: "finance-autopilot", name: "Finance Autopilot", description: "Automated P&L tracking, margin analysis, and financial reports.", category: "Finance", suite: "finance" },
  { id: "inventory-supplier-sync", name: "Inventory & Supplier Sync", description: "Real-time inventory sync with supplier management.", category: "Finance", suite: "finance" },
  { id: "inventory-forecasting", name: "Inventory Forecasting", description: "AI-powered demand forecasting to prevent stockouts.", category: "Finance", suite: "finance" },
  { id: "compliance-privacy-suite", name: "Compliance & Privacy Suite", description: "GDPR/CCPA compliance, consent management, and data governance.", category: "Finance", suite: "finance" },

  // ── Platform & Developer (5 tools) ──
  { id: "aura-operations-ai", name: "Aura Operations AI", description: "Platform-wide AI operations assistant and orchestration.", category: "Platform", suite: "platform" },
  { id: "ai-launch-planner", name: "AI Launch Planner", description: "Plan and execute product launches with AI-powered strategies.", category: "Platform", suite: "platform" },
  { id: "aura-api-sdk", name: "Aura API & SDK", description: "Developer API access and white-label SDK.", category: "Platform", suite: "platform" },
  { id: "webhook-api-triggers", name: "Webhook & API Triggers", description: "Create custom webhooks and API-triggered automations.", category: "Platform", suite: "platform" },
  { id: "loyalty-referral-programs", name: "Loyalty & Referral Programs", description: "Create rewards programs that drive repeat purchases.", category: "Platform", suite: "platform" },
];

export default toolsMeta;