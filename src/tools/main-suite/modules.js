"use strict";

// 9 product suites — the all-in-one AI growth platform for Shopify
// 65 tools total (24 duplicates removed from original 89)
const moduleGroups = [
  {
    id: "seo",
    title: "SEO & Content",
    summary: "Enterprise SEO, content optimization, and organic growth.",
    modules: [
      { id: "product-seo", name: "Product SEO Engine", description: "Optimize product pages for search with AI-powered metadata and content." },
      { id: "blog-seo", name: "Blog SEO Engine", description: "Optimize blog content with keyword clusters, internal linking, and SEO scoring." },
      { id: "blog-draft-engine", name: "Blog Draft Engine", description: "Create and publish SEO-optimized blog content with AI assistance." },
      { id: "weekly-blog-content-engine", name: "Weekly Blog Content Engine", description: "Automate your blog publishing calendar with AI-generated content." },
      { id: "on-page-seo-engine", name: "On-Page SEO Engine", description: "Audit and optimize on-page SEO factors across your entire store." },
      { id: "technical-seo-auditor", name: "Technical SEO Auditor", description: "Deep technical SEO audits with crawl analysis and fix recommendations." },
      { id: "schema-rich-results-engine", name: "Schema & Rich Results", description: "Generate and validate structured data for enhanced search listings." },
      { id: "image-alt-media-seo", name: "Image & Media SEO", description: "AI-powered alt text, image optimization, and media SEO." },
      { id: "rank-visibility-tracker", name: "Rank & Visibility Tracker", description: "Track keyword rankings and search visibility over time." },
      { id: "seo-site-crawler", name: "SEO Site Crawler", description: "Crawl your site to find broken links, redirects, and SEO issues." },
      { id: "internal-link-optimizer", name: "Internal Link Optimizer", description: "Discover and implement internal linking opportunities." },
      { id: "ai-content-brief-generator", name: "AI Content Brief Generator", description: "Generate comprehensive content briefs with keyword strategies." },
      { id: "content-scoring-optimization", name: "Content Scoring & Optimization", description: "Analyze and improve content quality with multi-factor scoring." },
      { id: "keyword-research-suite", name: "Keyword Research Suite", description: "Discover high-value keywords with volume, difficulty, and intent analysis." },
      { id: "backlink-explorer", name: "Backlink Explorer", description: "Analyze your backlink profile and find link-building opportunities." },
      { id: "link-intersect-outreach", name: "Link Intersect & Outreach", description: "Find sites linking to competitors but not you, with outreach templates." },
      { id: "local-seo-toolkit", name: "Local SEO Toolkit", description: "Optimize for local search with Google Business Profile management." },
      { id: "competitive-analysis", name: "Competitive Analysis", description: "Benchmark against competitors across SEO, content, and market share." },
      { id: "ai-content-image-gen", name: "AI Content & Image Gen", description: "Generate marketing copy and images with AI." }
    ]
  },
  {
    id: "lifecycle",
    title: "Email & Lifecycle",
    summary: "Email automation, lifecycle marketing, and customer retention.",
    modules: [
      { id: "email-automation-builder", name: "Email Automation Builder", description: "Build sophisticated multi-channel email campaigns with drag-and-drop automation." },
      { id: "abandoned-checkout-winback", name: "Abandoned Checkout Winback", description: "Recover lost sales with automated win-back sequences." },
      { id: "returns-rma-automation", name: "Returns & RMA Automation", description: "Streamline returns and exchanges with automated workflows." },
      { id: "automation-templates", name: "Automation Templates", description: "Pre-built automation templates for common marketing workflows." },
      { id: "collaboration-approval-workflows", name: "Collaboration & Approvals", description: "Team collaboration with approval workflows for campaigns." }
    ]
  },
  {
    id: "support",
    title: "Customer Support",
    summary: "AI-powered customer support, inbox management, and self-service.",
    modules: [
      { id: "ai-support-assistant", name: "AI Support Assistant", description: "Instant AI-powered responses trained on your knowledge base." },
      { id: "inbox-assistant", name: "Inbox Assistant", description: "Manage customer communications with AI-suggested responses." },
      { id: "review-ugc-engine", name: "Review & UGC Engine", description: "Manage reviews and user content with moderation and sentiment analysis." },
      { id: "self-service-portal", name: "Self-Service Portal", description: "Customer-facing help center with knowledge base and ticketing." }
    ]
  },
  {
    id: "social",
    title: "Social & Brand",
    summary: "Social media management, brand monitoring, and creative tools.",
    modules: [
      { id: "social-scheduler-content-engine", name: "Social Scheduler & Content", description: "Schedule and manage social content across all platforms." },
      { id: "social-media-analytics-listening", name: "Social Analytics & Listening", description: "Monitor and analyze your social presence across 7+ platforms." },
      { id: "brand-mention-tracker", name: "Brand Mention Tracker", description: "Track brand mentions with sentiment analysis and crisis alerts." },
      { id: "brand-intelligence-layer", name: "Brand Intelligence Layer", description: "Deep brand health analytics with competitive positioning." },
      { id: "creative-automation-engine", name: "Creative Automation Engine", description: "Automate creative asset generation and A/B testing." }
    ]
  },
  {
    id: "ads",
    title: "Ads & Acquisition",
    summary: "Multi-platform ad management, optimization, and ROAS tracking.",
    modules: [
      { id: "google-ads-integration", name: "Google Ads", description: "Manage Google Ads campaigns with AI bidding and optimization." },
      { id: "facebook-ads-integration", name: "Facebook & Instagram Ads", description: "Run and optimize Meta ad campaigns from one dashboard." },
      { id: "tiktok-ads-integration", name: "TikTok Ads", description: "Create and manage TikTok ad campaigns with creative tools." },
      { id: "ads-anomaly-guard", name: "Ads Anomaly Guard", description: "Detect ad spend anomalies and protect your budget." },
      { id: "ad-creative-optimizer", name: "Ad Creative Optimizer", description: "AI-powered ad creative testing and optimization." },
      { id: "omnichannel-campaign-builder", name: "Omnichannel Campaign Builder", description: "Build coordinated campaigns across email, ads, and social." }
    ]
  },
  {
    id: "analytics",
    title: "Analytics & Intelligence",
    summary: "Advanced analytics, attribution, and predictive intelligence.",
    modules: [
      { id: "advanced-analytics-attribution", name: "Advanced Attribution", description: "Multi-touch attribution across all marketing channels." },
      { id: "predictive-analytics-widgets", name: "Predictive Analytics", description: "AI-powered predictions for revenue, churn, and growth." },
      { id: "self-service-analytics", name: "Self-Service Analytics", description: "Build custom reports and dashboards with drag-and-drop." },
      { id: "auto-insights", name: "Auto Insights", description: "AI-generated insights surfaced automatically from your data." },
      { id: "ai-segmentation-engine", name: "AI Segmentation Engine", description: "Automatic customer segmentation using machine learning." },
      { id: "reporting-integrations", name: "Reporting & Integrations", description: "Connect data sources and export reports to external tools." },
      { id: "custom-dashboard-builder", name: "Custom Dashboard Builder", description: "Build personalized dashboards with widgets and KPIs." },
      { id: "scheduled-export", name: "Scheduled Export", description: "Automate data exports on a schedule to email, SFTP, or cloud." },
      { id: "data-warehouse-connector", name: "Data Warehouse Connector", description: "Sync data to Snowflake, BigQuery, or Redshift." }
    ]
  },
  {
    id: "personalization",
    title: "Personalization & Revenue",
    summary: "AI-driven personalization, recommendations, and revenue optimization.",
    modules: [
      { id: "dynamic-pricing-engine", name: "Dynamic Pricing Engine", description: "Optimize pricing in real-time based on demand and competition." },
      { id: "upsell-cross-sell-engine", name: "Upsell & Cross-Sell Engine", description: "Increase AOV with AI-powered product recommendations." },
      { id: "customer-data-platform", name: "Customer Data Platform", description: "Unify customer data with RFM analysis and behavioral segmentation." },
      { id: "personalization-recommendation-engine", name: "Personalization & Recommendations", description: "Deliver personalized experiences with collaborative filtering." },
      { id: "advanced-personalization-engine", name: "Advanced Personalization Engine", description: "Real-time personalization with ML models and A/B testing." },
      { id: "ltv-churn-predictor", name: "LTV & Churn Predictor", description: "Predict customer lifetime value and churn risk." },
      { id: "churn-prediction-playbooks", name: "Churn Prediction Playbooks", description: "Automated playbooks triggered by churn risk signals." },
      { id: "customer-segmentation-engine", name: "Customer Segmentation", description: "Advanced customer segmentation with behavioral clusters." },
      { id: "customer-journey-mapping", name: "Customer Journey Mapping", description: "Visualize and optimize the full customer journey." },
      { id: "data-enrichment-suite", name: "Data Enrichment Suite", description: "Enrich customer profiles with third-party data sources." }
    ]
  },
  {
    id: "finance",
    title: "Finance & Operations",
    summary: "Financial analytics, inventory management, and operational tools.",
    modules: [
      { id: "finance-autopilot", name: "Finance Autopilot", description: "Automated P&L tracking, margin analysis, and financial reports." },
      { id: "inventory-supplier-sync", name: "Inventory & Supplier Sync", description: "Real-time inventory sync with supplier management." },
      { id: "inventory-forecasting", name: "Inventory Forecasting", description: "AI-powered demand forecasting to prevent stockouts." },
      { id: "compliance-privacy-suite", name: "Compliance & Privacy Suite", description: "GDPR/CCPA compliance, consent management, and data governance." }
    ]
  },
  {
    id: "platform",
    title: "Platform & Developer",
    summary: "Platform tools, APIs, and developer resources.",
    modules: [
      { id: "aura-operations-ai", name: "Aura Operations AI", description: "Platform-wide AI operations assistant and orchestration." },
      { id: "ai-launch-planner", name: "AI Launch Planner", description: "Plan and execute product launches with AI-powered strategies." },
      { id: "aura-api-sdk", name: "Aura API & SDK", description: "Developer API access and white-label SDK." },
      { id: "webhook-api-triggers", name: "Webhook & API Triggers", description: "Create custom webhooks and API-triggered automations." },
      { id: "loyalty-referral-programs", name: "Loyalty & Referral Programs", description: "Create rewards programs that drive repeat purchases." }
    ]
  }
];

module.exports = moduleGroups;
