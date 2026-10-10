import React, { Suspense, lazy } from "react";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { canUseTool, requiredPlanFor, PLAN_LABEL } from "../hooks/usePlan";

const t = (p) => lazy(p);
const TOOLS = {
  "blog-draft-engine": t(() => import("./tools/BlogDraftEngine.jsx")),
  "blog-seo": t(() => import("./tools/BlogSEO.jsx")),
  "weekly-blog-content-engine": t(() => import("./tools/WeeklyBlogContentEngine.jsx")),
  "keyword-research-suite": t(() => import("./tools/KeywordResearchSuite.jsx")),
  "ai-content-brief-generator": t(() => import("./tools/AIContentBriefGenerator.jsx")),
  "entity-topic-explorer": t(() => import("./tools/EntityTopicExplorer.jsx")),
  "content-scoring-optimization": t(() => import("./tools/ContentScoringOptimization.jsx")),
  "ai-content-image-gen": t(() => import("./tools/AIContentImageGen.jsx")),
  "seo-site-crawler": t(() => import("./tools/SEOSiteCrawler.jsx")),
  "on-page-seo-engine": t(() => import("./tools/OnPageSEOEngine.jsx")),
  "technical-seo-auditor": t(() => import("./tools/TechnicalSEOAuditor.jsx")),
  "product-seo": t(() => import("./tools/ProductSEOEngine.jsx")),
  "image-alt-media-seo": t(() => import("./tools/ImageAltMediaSEO.jsx")),
  "rank-visibility-tracker": t(() => import("./tools/RankVisibilityTracker.jsx")),
  "ai-shopping-readiness": t(() => import("./tools/AIShoppingReadiness.jsx")),
  "ai-visibility-tracker": t(() => import("./tools/AIVisibilityTracker.jsx")),
  "email-automation-builder": t(() => import("./tools/EmailAutomationBuilder.jsx")),
  "abandoned-checkout-winback": t(() => import("./tools/AbandonedCheckoutWinback.jsx")),
  "sms-whatsapp-marketing": t(() => import("./tools/SMSWhatsAppMarketing.jsx")),
  "email-deliverability": t(() => import("./tools/EmailDeliverability.jsx")),
  "popups": t(() => import("./tools/Popups.jsx")),
  "back-in-stock": t(() => import("./tools/BackInStock.jsx")),
  "upsell-cross-sell-engine": t(() => import("./tools/UpsellCrossSellEngine.jsx")),
  "discounts-bundles": t(() => import("./tools/DiscountsBundles.jsx")),
  "review-ugc-engine": t(() => import("./tools/ReviewUGCEngine.jsx")),
  "loyalty-referral-programs": t(() => import("./tools/LoyaltyReferralPrograms.jsx")),
  "customer-data-platform": t(() => import("./tools/CustomerDataPlatform.jsx")),
  "dynamic-pricing-engine": t(() => import("./tools/DynamicPricingEngine.jsx")),
  "order-risk": t(() => import("./tools/OrderRisk.jsx")),
  "profit-analytics": t(() => import("./tools/ProfitAnalytics.jsx")),
  "auto-insights": t(() => import("./tools/AutoInsights.jsx")),
  "facebook-ads-integration": t(() => import("./tools/FacebookAdsIntegration.jsx")),
  "google-ads-integration": t(() => import("./tools/GoogleAdsIntegration.jsx")),
  "tiktok-ads-integration": t(() => import("./tools/TikTokAdsIntegration.jsx")),
  "ad-creative-optimizer": t(() => import("./tools/AdCreativeOptimizer.jsx")),
  "ads-anomaly-guard": t(() => import("./tools/AdsAnomalyGuard.jsx")),
};

const S = {
  bar: { display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", padding: "12px 16px 0", borderBottom: "1px solid #e2e8f0", background: "#ffffff", position: "sticky", top: 0, zIndex: 5 },
  tab: (on) => ({ flexShrink: 0, whiteSpace: "nowrap", background: on ? "#eff6ff" : "transparent", color: on ? "#1d4ed8" : "#64748b", border: "1px solid " + (on ? "#bfdbfe" : "transparent"), borderBottom: on ? "1px solid #eff6ff" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: -1 }),
  lock: { margin: 24, padding: 20, background: "#ffffff", border: "1px solid #dbe3ed", borderRadius: 10, color: "#172033", maxWidth: 520 },
  btn: { marginTop: 12, background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 600, cursor: "pointer" },
  load: { padding: 24, color: "#a1a1aa", fontSize: 13 },
};

// Shows one hub: a tab bar, then the chosen tool inside it.
export default function HubTool({ hub, tab, plan, onTab, toolProps = {}, onUpgrade }) {
  const tabs = hub.tabs;
  const current = tabs.find((x) => x.id === tab) || tabs.find((x) => canUseTool(plan, x.id)) || tabs[0];
  const Tool = TOOLS[current.id];
  const allowed = canUseTool(plan, current.id);
  return (
    <div>
      <div style={S.bar} role="tablist" aria-label={hub.name}>
        {tabs.map((x) => {
          const ok = canUseTool(plan, x.id);
          return (
            <button key={x.id} role="tab" aria-selected={x.id === current.id} style={S.tab(x.id === current.id)} onClick={() => onTab(x.id)}>
              {x.label}{ok ? "" : ` · ${PLAN_LABEL[requiredPlanFor(x.id)]}`}
            </button>
          );
        })}
      </div>
      {!allowed ? (
        <div style={S.lock}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{current.label} needs the {PLAN_LABEL[requiredPlanFor(current.id)]} plan</div>
          <div style={{ fontSize: 13, color: "#a1a1aa" }}>The other tabs in {hub.name} are available on your plan.</div>
          {onUpgrade && <button style={S.btn} onClick={onUpgrade}>See plans</button>}
        </div>
      ) : (
        <ErrorBoundary key={current.id}>
          <Suspense fallback={<div style={S.load}>Loading…</div>}>
            {Tool ? <Tool {...(toolProps[current.id] || {})} /> : <div style={S.load}>This tab is not available.</div>}
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
