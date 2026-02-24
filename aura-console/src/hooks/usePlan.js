import { useState, useEffect } from "react";
import { apiFetch, apiFetchJSON } from "../api";

// Maps tool route IDs to minimum plan required
// 4 tiers: free/starter ($0, dashboard only, 10 credits) ? growth ($49) ? pro ($149) ? enterprise ($349)
// There is NO generous free plan. Unsubscribed users get dashboard + 10 lifetime credits.
export const TOOL_PLAN = {
  // -- Starter (free, $0) -- dashboard only, 10 lifetime AI credits
  "dashboard":                            "free",

  // -- Growth ($49/mo) -- core SEO + marketing tools
  "product-seo":                          "growth",
  "blog-seo":                             "growth",
  "seo-site-crawler":                     "growth",
  "on-page-seo-engine":                   "growth",
  "blog-draft-engine":                    "growth",
  "weekly-blog-content-engine":           "growth",
  "ai-content-brief-generator":           "growth",
  "content-scoring-optimization":         "growth",
  "keyword-research-suite":               "growth",
  "internal-link-optimizer":              "growth",
  "technical-seo-auditor":                "growth",
  "schema-rich-results-engine":           "growth",
  "rank-visibility-tracker":              "growth",
  "image-alt-media-seo":                  "growth",
  "local-seo-toolkit":                    "growth",
  "email-automation-builder":             "growth",
  "abandoned-checkout-winback":           "growth",
  "review-ugc-engine":                    "growth",
  "social-scheduler-content-engine":      "growth",
  "brand-mention-tracker":                "growth",
  "dynamic-pricing-engine":               "growth",
  "inbox-assistant":                      "growth",
  "ltv-churn-predictor":                  "growth",
  "finance-autopilot":                    "growth",
  "inventory-supplier-sync":              "growth",

  // -- Pro ($149/mo) -- advanced & intelligence tools
  "backlink-explorer":                    "pro",
  "link-intersect-outreach":              "pro",
  "competitive-analysis":                 "pro",
  "ai-content-image-gen":                 "pro",
  "automation-templates":                 "pro",
  "collaboration-approval-workflows":     "pro",
  "returns-rma-automation":               "pro",
  "ai-support-assistant":                 "pro",
  "self-service-portal":                  "pro",
  "social-media-analytics-listening":     "pro",
  "creative-automation-engine":           "pro",
  "brand-intelligence-layer":             "pro",
  "google-ads-integration":               "pro",
  "facebook-ads-integration":             "pro",
  "tiktok-ads-integration":               "pro",
  "ads-anomaly-guard":                    "pro",
  "ad-creative-optimizer":                "pro",
  "omnichannel-campaign-builder":         "pro",
  "advanced-analytics-attribution":       "pro",
  "predictive-analytics-widgets":         "pro",
  "self-service-analytics":               "pro",
  "auto-insights":                        "pro",
  "ai-segmentation-engine":               "pro",
  "upsell-cross-sell-engine":             "pro",
  "customer-data-platform":               "pro",
  "personalization-recommendation-engine": "pro",
  "advanced-personalization-engine":       "pro",
  "churn-prediction-playbooks":           "pro",
  "inventory-forecasting":                "pro",
  "compliance-privacy-suite":             "pro",

  // -- Enterprise ($349/mo) -- platform, API, ops
  "reporting-integrations":               "enterprise",
  "custom-dashboard-builder":             "enterprise",
  "scheduled-export":                     "enterprise",
  "data-warehouse-connector":             "enterprise",
  "customer-segmentation-engine":         "enterprise",
  "customer-journey-mapping":             "enterprise",
  "data-enrichment-suite":                "enterprise",
  "aura-operations-ai":                   "enterprise",
  "ai-launch-planner":                    "enterprise",
  "aura-api-sdk":                         "enterprise",
  "webhook-api-triggers":                 "enterprise",
  "loyalty-referral-programs":            "enterprise",
};

const PLAN_RANK = { free: 0, growth: 1, pro: 2, enterprise: 3 };
export const PLAN_LABEL = { free: "Starter", growth: "Growth", pro: "Pro", enterprise: "Enterprise" };
export const PLAN_PRICE = { free: "$0", growth: "$49/mo", pro: "$149/mo", enterprise: "$349/mo" };
export const PLAN_COLOUR = { free: "#71717a", growth: "#38bdf8", pro: "#4f46e5", enterprise: "#a78bfa" };
export const PLAN_CREDITS = { free: 10, growth: 5000, pro: 25000, enterprise: -1 }; // -1 = unlimited

export function canUseTool(userPlan, toolId) {
  const required = TOOL_PLAN[toolId];
  if (!required) return true; // not in map = allow
  return (PLAN_RANK[userPlan] ?? 0) >= (PLAN_RANK[required] ?? 0);
}

export function requiredPlanFor(toolId) {
  return TOOL_PLAN[toolId] || "free";
}

export default function usePlan() {
  const [plan, setPlan] = useState("free");
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiFetchJSON("/api/billing/subscription");
        const data = await res.json();
        setPlan(data.plan_id || "free");
      } catch (_) {
        setPlan("free");
      }
      setPlanLoading(false);
    }
    load();
  }, []);

  return { plan, planLoading };
}
