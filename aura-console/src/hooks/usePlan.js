import { useState, useEffect } from "react";
import { apiFetch } from "../api";

// Maps tool route IDs → minimum plan required
export const TOOL_PLAN = {
  // Free — everyone can use
  "product-seo":                          "free",
  "blog-seo":                             "free",
  "seo-site-crawler":                     "free",
  "on-page-seo-engine":                   "free",
  "dashboard":                            "free",

  // Professional ($99/mo)
  "ai-content-brief-generator":           "professional",
  "blog-draft-engine":                    "professional",
  "weekly-blog-content-engine":           "professional",
  "abandoned-checkout-winback":           "professional",
  "review-ugc-engine":                    "professional",
  "email-automation-builder":             "professional",
  "klaviyo-flow-automation":              "professional",
  "internal-link-optimizer":              "professional",
  "technical-seo-auditor":               "professional",
  "schema-rich-results-engine":          "professional",
  "rank-visibility-tracker":             "professional",
  "content-health-auditor":              "professional",
  "serp-tracker":                         "professional",
  "site-audit-health":                    "professional",
  "image-alt-media-seo":                  "professional",
  "ai-alt-text-engine":                   "professional",
  "predictive-analytics-widgets":        "professional",
  "self-service-analytics":              "professional",
  "dynamic-pricing-engine":              "professional",
  "upsell-cross-sell-engine":            "professional",
  "customer-data-platform":              "professional",
  "personalization-recommendation-engine": "professional",
  "brand-mention-tracker":               "professional",
  "social-media-analytics-listening":    "professional",
  "content-scoring-optimization":        "professional",
  "ltv-churn-predictor":                 "professional",
  "multi-channel-optimizer":             "professional",
  "churn-prediction-playbooks":          "professional",
  "inventory-forecasting":               "professional",
  "inventory-supplier-sync":             "professional",
  "finance-autopilot":                   "professional",
  "inbox-assistant":                      "professional",
  "inbox-reply-assistant":               "professional",

  // Enterprise ($299/mo)
  "ab-testing-suite":                     "enterprise",
  "advanced-analytics-attribution":      "enterprise",
  "customer-support-ai":                 "enterprise",
  "ai-support-assistant":                "enterprise",
  "loyalty-referral-programs":           "enterprise",
  "loyalty-referral-program-v2":         "enterprise",
  "creative-automation-engine":          "enterprise",
  "brand-intelligence-layer":            "enterprise",
  "auto-insights":                        "enterprise",
  "aura-operations-ai":                  "enterprise",
  "aura-api-sdk":                         "enterprise",
  "ai-launch-planner":                    "enterprise",
  "workflow-orchestrator":               "enterprise",
  "visual-workflow-builder":             "enterprise",
  "workflow-automation-builder":         "enterprise",
};

const PLAN_RANK = { free: 0, professional: 1, enterprise: 2 };
export const PLAN_LABEL = { free: "Free", professional: "Professional", enterprise: "Enterprise" };
export const PLAN_PRICE = { free: "$0", professional: "$99/mo", enterprise: "$299/mo" };
export const PLAN_COLOUR = { free: "#4ade80", professional: "#7fffd4", enterprise: "#a78bfa" };

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
        const res = await apiFetch("/api/billing/subscription");
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
