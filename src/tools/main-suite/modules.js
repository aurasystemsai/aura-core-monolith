"use strict";

// High-level consolidated module groups for the Main Suite aggregator.
// Each module points to an existing tool id so the UI can deep-link or reuse
// the underlying router/component.
const moduleGroups = [
  {
    id: "workflows",
    title: "Workflows & Automation",
    summary: "Orchestrate and execute flows with triggers, conditions, and webhooks.",
    modules: [
      { id: "workflow-orchestrator", name: "Workflow Orchestrator", description: "Coordinate multi-step automations across tools." },
      { id: "workflow-automation-builder", name: "Workflow Automation Builder", description: "Design reusable automation blueprints." },
      { id: "visual-workflow-builder", name: "Visual Workflow Builder", description: "Drag-and-drop canvas for workflows." },
      { id: "webhook-api-triggers", name: "Webhook & API Triggers", description: "Trigger flows from webhooks and API events." },
      { id: "conditional-logic-automation", name: "Conditional Logic Automation", description: "Branching rules and decisioning." }
    ]
  },
  {
    id: "analytics",
    title: "Analytics & Reporting",
    summary: "Attribution, dashboards, and integrations in one place.",
    modules: [
      { id: "advanced-analytics-attribution", name: "Advanced Attribution", description: "Attribution insights and trending." },
      { id: "reporting-integrations", name: "Reporting Integrations", description: "Pipelines into BI/reporting destinations." },
      { id: "custom-dashboard-builder", name: "Custom Dashboards", description: "Assemble dashboards from data sources." },
      { id: "auto-insights", name: "Auto Insights", description: "Automated executive-ready highlights." }
    ]
  },
  {
    id: "seo",
    title: "SEO Core",
    summary: "Crawl, audit, optimize, and monitor rankings.",
    modules: [
      { id: "seo-site-crawler", name: "SEO Site Crawler", description: "Deep crawl and surface issues." },
      { id: "site-audit-health", name: "Site Audit Health", description: "Rollup health scoring." },
      { id: "technical-seo-auditor", name: "Technical SEO", description: "Technical diagnostics and fixes." },
      { id: "on-page-seo-engine", name: "On-Page SEO", description: "Optimize on-page elements and content." },
      { id: "rank-visibility-tracker", name: "Rank Visibility", description: "Track rankings and visibility." },
      { id: "serp-tracker", name: "SERP Tracker", description: "SERP monitoring and deltas." },
      { id: "schema-rich-results-engine", name: "Schema / Rich Results", description: "Structured data generation." },
      { id: "image-alt-media-seo", name: "Media SEO", description: "Image/alt/media optimization." }
    ]
  },
  {
    id: "personalization",
    title: "Personalization & CDP",
    summary: "Audience graph, recommendations, and offer logic.",
    modules: [
      { id: "customer-data-platform", name: "Customer Data Platform", description: "Profiles, traits, and audiences." },
      { id: "personalization-recommendation-engine", name: "Recommendations", description: "AI-driven product/content recs." },
      { id: "advanced-personalization-engine", name: "Advanced Personalization", description: "Contextual and real-time rendering." },
      { id: "upsell-cross-sell-engine", name: "Upsell / Cross-Sell", description: "Offer targeting for AOV lift." },
      { id: "ltv-churn-predictor", name: "LTV & Churn", description: "Predictive scoring for lifecycle actions." }
    ]
  },
  {
    id: "revenue",
    title: "Pricing, Inventory & Finance",
    summary: "Demand forecasting, pricing, and ops controls.",
    modules: [
      { id: "advanced-finance-inventory-planning", name: "Finance & Inventory Planning", description: "Planning and guardrails." },
      { id: "inventory-forecasting", name: "Inventory Forecasting", description: "Demand projections and stock risk." },
      { id: "inventory-supplier-sync", name: "Supplier Sync", description: "Supplier sync and POs." },
      { id: "dynamic-pricing-engine", name: "Dynamic Pricing", description: "Pricing rules and experiments." },
      { id: "finance-autopilot", name: "Finance Autopilot", description: "Ops automations for finance." },
      { id: "daily-cfo-pack", name: "Daily CFO Pack", description: "Daily KPIs and alerts." }
    ]
  },
  {
    id: "lifecycle",
    title: "Lifecycle Automation",
    summary: "Email/SMS flows, winbacks, and retention playbooks.",
    modules: [
      { id: "email-automation-builder", name: "Email Automation", description: "Builder for lifecycle flows." },
      { id: "abandoned-checkout-winback", name: "Checkout Winback", description: "Recover abandoned carts." },
      { id: "multi-channel-optimizer", name: "Multi-Channel Optimizer", description: "Budget/channel allocation." },
      { id: "returns-rma-automation", name: "Returns / RMA", description: "Post-purchase returns flows." },
      { id: "churn-prediction-playbooks", name: "Churn Playbooks", description: "Retention actions by segment." }
    ]
  },
  {
    id: "social",
    title: "Social & Listening",
    summary: "Social monitoring plus scheduling.",
    modules: [
      { id: "social-media-analytics-listening", name: "Social Listening", description: "Monitor mentions and sentiment." },
      { id: "social-scheduler-content-engine", name: "Social Scheduler", description: "Plan and queue content." },
      { id: "brand-mention-tracker", name: "Brand Mention Tracker", description: "Track and alert on brand mentions." }
    ]
  },
  {
    id: "support",
    title: "Support & Portals",
    summary: "Self-service and AI assistance for support.",
    modules: [
      { id: "self-service-portal", name: "Self-Service Portal", description: "Customer self-help." },
      { id: "self-service-support-portal", name: "Support Portal", description: "Support workflows and forms." },
      { id: "customer-support-ai", name: "Customer Support AI", description: "AI-assisted macros and replies." }
    ]
  }
];

module.exports = moduleGroups;
