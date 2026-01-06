// Auto-generated tool meta registry for Aura Core
// Each object: { id, name, description, category }



// Deduplicate by id, keeping the first occurrence
const toolsMeta = Array.from(new Map([
  // ...existing code...
  ["advanced-personalization-engine", { id: "advanced-personalization-engine", name: "Advanced Personalization Engine", description: "AI-powered real-time content/product personalization.", category: "Personalization / AI" }],
  ["advanced-finance-inventory-planning", { id: "advanced-finance-inventory-planning", name: "Advanced Finance & Inventory Planning", description: "Advanced financial and inventory planning analytics.", category: "Finance / Analytics" }],
  ["ai-alt-text-engine", { id: "ai-alt-text-engine", name: "AI Alt-Text Engine", description: "Generates AI-powered alt text for images.", category: "SEO / AI" }],
  ["ai-support-assistant", { id: "ai-support-assistant", name: "AI Support Assistant", description: "Generates support macros and FAQ topics.", category: "Support / AI" }],
  ["aura-api-sdk", { id: "aura-api-sdk", name: "Aura API SDK", description: "Generates API SDK configuration snippets.", category: "Development" }],
  ["aura-operations-ai", { id: "aura-operations-ai", name: "Aura Operations AI", description: "Generates operations insights and checklists.", category: "Operations / AI" }],
  ["auto-insights", { id: "auto-insights", name: "Auto Insights", description: "Automated high-level business insights.", category: "Analytics / AI" }],
  ["backlink-explorer", { id: "backlink-explorer", name: "Backlink Explorer", description: "Explore and analyze backlinks for SEO.", category: "SEO" }],
  ["brand-intelligence-layer", { id: "brand-intelligence-layer", name: "Brand Intelligence Layer", description: "Generates brand voice and intelligence snapshots.", category: "Brand" }],
  ["churn-prediction-playbooks", { id: "churn-prediction-playbooks", name: "Churn Prediction Playbooks", description: "Automated playbooks for churn prediction and retention.", category: "Analytics" }],
  ["collaboration-approval-workflows", { id: "collaboration-approval-workflows", name: "Collaboration & Approval Workflows", description: "Automate collaboration and approval processes.", category: "Operations" }],
  ["competitive-analysis", { id: "competitive-analysis", name: "Competitive Analysis", description: "Analyze competitors and market trends.", category: "Analytics" }],
  ["content-health-auditor", { id: "content-health-auditor", name: "Content Health Auditor", description: "Audit and improve content health and quality.", category: "Content / AI" }],
  ["content-scoring-optimization", { id: "content-scoring-optimization", name: "Content Scoring & Optimization", description: "Score and optimize content for SEO and engagement.", category: "Content / AI" }],
  ["creative-automation-engine", { id: "creative-automation-engine", name: "Creative Automation Engine", description: "Generates creative hooks and angles.", category: "Marketing / Creative" }],
  ["customer-data-platform", { id: "customer-data-platform", name: "Customer Data Platform", description: "Centralize and analyze customer data.", category: "Analytics / Integration" }],
  ["daily-cfo-pack", { id: "daily-cfo-pack", name: "Daily CFO Pack", description: "Daily financial insights and reports.", category: "Finance / Analytics" }],
  ["email-automation-builder", { id: "email-automation-builder", name: "Email Automation Builder", description: "Automate email campaigns and flows.", category: "Marketing / Automation" }],
  ["finance-autopilot", { id: "finance-autopilot", name: "Finance Autopilot", description: "Automate financial operations and reporting.", category: "Finance / Analytics" }],
  ["image-alt-media-seo", { id: "image-alt-media-seo", name: "Image Alt Media SEO", description: "Optimize image alt text and media for SEO.", category: "SEO / AI" }],
  ["inbox-assistant", { id: "inbox-assistant", name: "Inbox Assistant", description: "Automate inbox management and responses.", category: "Support / AI" }],
  ["inbox-reply-assistant", { id: "inbox-reply-assistant", name: "Inbox Reply Assistant", description: "Generate reply templates for support inbox.", category: "Support / AI" }],
  ["internal-link-optimizer", { id: "internal-link-optimizer", name: "Internal Link Optimizer", description: "Suggests internal links for SEO and navigation.", category: "SEO" }],
  ["inventory-supplier-sync", { id: "inventory-supplier-sync", name: "Inventory Supplier Sync", description: "Syncs inventory data with suppliers.", category: "Operations" }],
  ["keyword-research-suite", { id: "keyword-research-suite", name: "Keyword Research Suite", description: "Comprehensive keyword research tools.", category: "SEO" }],
  ["klaviyo-flow-automation", { id: "klaviyo-flow-automation", name: "Klaviyo Flow Automation", description: "Blueprints for Klaviyo automation flows.", category: "Email / Automation" }],
  ["link-intersect-outreach", { id: "link-intersect-outreach", name: "Link Intersect & Outreach", description: "Find link opportunities and automate outreach.", category: "SEO" }],
  ["personalization-recommendation-engine", { id: "personalization-recommendation-engine", name: "Personalization Recommendation Engine", description: "AI-driven product/content recommendations.", category: "Personalization / AI" }],
  ["site-audit-health", { id: "site-audit-health", name: "Site Audit Health", description: "Comprehensive site health and audit checks.", category: "SEO" }],
  ["social-media-analytics-listening", { id: "social-media-analytics-listening", name: "Social Media Analytics & Listening", description: "Monitor and analyze social media performance.", category: "Social / Analytics" }],
  ["technical-seo-auditor", { id: "technical-seo-auditor", name: "Technical SEO Auditor", description: "Performs technical SEO health checks.", category: "SEO" }],
  ["workflow-automation-builder", { id: "workflow-automation-builder", name: "Workflow Automation Builder", description: "Build and automate workflows across tools.", category: "Automation" }],
  ["workflow-orchestrator", { id: "workflow-orchestrator", name: "Workflow Orchestrator", description: "Orchestrates multi-step automation workflows.", category: "Automation" }],
  // ...add all other unique tool entries here, following the same pattern...
]).values()).sort((a, b) => {
  if (a.category < b.category) return -1;
  if (a.category > b.category) return 1;
  if (a.name < b.name) return -1;
  if (a.name > b.name) return 1;
  return 0;
});

export default toolsMeta;
