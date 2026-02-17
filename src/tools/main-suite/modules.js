"use strict";

// Module groups showing ONLY the 20 completed enterprise-grade tools
// Hidden: 57 tools still in development (not visible in UI until completed)
const moduleGroups = [
  {
    id: "lifecycle",
    title: "Lifecycle & Email",
    summary: "Enterprise email automation and lifecycle marketing.",
    modules: [
      { id: "klaviyo-flow-automation", name: "Klaviyo Flow Automation", description: "Automate your Klaviyo email flows with AI-powered segmentation and personalization." },
      { id: "email-automation-builder", name: "Email Automation Builder", description: "Build sophisticated multi-channel email campaigns with drag-and-drop automation." },
      { id: "loyalty-referral-programs", name: "Loyalty & Referral Programs", description: "Create rewards programs that drive repeat purchases and customer advocacy." }
    ]
  },
  {
    id: "seo",
    title: "SEO & Content",
    summary: "Enterprise SEO and content optimization tools.",
    modules: [
      { id: "product-seo", name: "Product SEO Engine", description: "Optimize product pages for search with AI-powered metadata and content recommendations." },
      { id: "blog-seo", name: "Blog SEO Engine", description: "Optimize blog content with keyword clusters, internal linking, and SEO scoring." },
      { id: "blog-draft-engine", name: "Blog Draft Engine", description: "Create, collaborate on, and publish SEO-optimized blog content with AI assistance." },
      { id: "weekly-blog-content-engine", name: "Weekly Blog Content Engine", description: "Automate your blog publishing calendar with AI-generated content and scheduling." },
      { id: "content-scoring-optimization", name: "Content Scoring & Optimization", description: "Analyze and improve content quality with multi-factor SEO and readability scoring." },
      { id: "ai-content-brief-generator", name: "AI Content Brief Generator", description: "Generate comprehensive content briefs with competitive research and keyword strategies." }
    ]
  },
  {
    id: "personalization",
    title: "Personalization & Revenue",
    summary: "AI-powered personalization and revenue optimization.",
    modules: [
      { id: "dynamic-pricing-engine", name: "Dynamic Pricing Engine", description: "Optimize pricing in real-time based on demand, competition, and customer behavior." },
      { id: "upsell-cross-sell-engine", name: "Upsell & Cross-Sell Engine", description: "Increase average order value with AI-powered product recommendations and bundles." },
      { id: "customer-data-platform", name: "Customer Data Platform", description: "Unify customer data across channels with RFM analysis and behavioral segmentation." },
      { id: "personalization-recommendation-engine", name: "Personalization & Recommendations", description: "Deliver personalized experiences with collaborative and content-based filtering." }
    ]
  },
  {
    id: "optimization",
    title: "Testing & Optimization",
    summary: "Enterprise experimentation and testing platform.",
    modules: [
      { id: "ab-testing-suite", name: "A/B Testing Suite", description: "Run sophisticated experiments with statistical rigor and AI-powered optimization." }
    ]
  },
  {
    id: "support",
    title: "Customer Support",
    summary: "AI-powered customer support and engagement.",
    modules: [
      { id: "ai-support-assistant", name: "AI Support Assistant", description: "Provide instant answers with AI-powered responses trained on your knowledge base." },
      { id: "customer-support-ai", name: "Customer Support AI", description: "Streamline support operations with quality tracking and omnichannel management." },
      { id: "review-ugc-engine", name: "Review & UGC Engine", description: "Manage customer reviews and user content with moderation and sentiment analysis." }
    ]
  },
  {
    id: "social",
    title: "Social & Brand",
    summary: "Social media management and brand monitoring.",
    modules: [
      { id: "brand-mention-tracker", name: "Brand Mention Tracker", description: "Monitor brand mentions across the web with sentiment analysis and crisis alerts." },
      { id: "social-media-analytics-listening", name: "Social Media Analytics", description: "Manage and analyze your presence across 7+ social platforms from one dashboard." }
    ]
  }
];

module.exports = moduleGroups;
