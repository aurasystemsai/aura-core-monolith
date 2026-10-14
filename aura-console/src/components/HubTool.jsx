import React, { Suspense, lazy } from "react";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { canUseTool, requiredPlanFor, PLAN_LABEL } from "../hooks/usePlan";
import { isPreviewTool } from "../hubs.js";

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
  "order-tracking": t(() => import("./tools/OrderTracking.jsx")),
  "profit-analytics": t(() => import("./tools/ProfitAnalytics.jsx")),
  "auto-insights": t(() => import("./tools/AutoInsights.jsx")),
  "facebook-ads-integration": t(() => import("./tools/FacebookAdsIntegration.jsx")),
  "google-ads-integration": t(() => import("./tools/GoogleAdsIntegration.jsx")),
  "tiktok-ads-integration": t(() => import("./tools/TikTokAdsIntegration.jsx")),
  "ad-creative-optimizer": t(() => import("./tools/AdCreativeOptimizer.jsx")),
  "ads-anomaly-guard": t(() => import("./tools/AdsAnomalyGuard.jsx")),
  "advanced-analytics-attribution": t(() => import("./tools/AdvancedAnalyticsAttribution.jsx")),
  "advanced-finance-inventory-planning": t(() => import("./tools/AdvancedFinanceInventoryPlanning.jsx")),
  "advanced-personalization-engine": t(() => import("./tools/AdvancedPersonalizationEngine.jsx")),
  "affiliate-partner-management": t(() => import("./tools/AffiliatePartnerManagement.jsx")),
  "ai-launch-planner": t(() => import("./tools/AILaunchPlanner.jsx")),
  "ai-segmentation-engine": t(() => import("./tools/AiSegmentationEngine.jsx")),
  "aura-api-sdk": t(() => import("./tools/AuraAPISDK.jsx")),
  "aura-operations-ai": t(() => import("./tools/AuraOperationsAI.jsx")),
  "automation-templates": t(() => import("./tools/AutomationTemplates.jsx")),
  "backlink-explorer": t(() => import("./tools/BacklinkExplorer.jsx")),
  "brand-intelligence-layer": t(() => import("./tools/BrandIntelligenceLayer.jsx")),
  "churn-prediction-playbooks": t(() => import("./tools/ChurnPredictionPlaybooks.jsx")),
  "collaboration-approval-workflows": t(() => import("./tools/CollaborationApprovalWorkflows.jsx")),
  "competitive-analysis": t(() => import("./tools/CompetitiveAnalysis.jsx")),
  "compliance-privacy-suite": t(() => import("./tools/CompliancePrivacySuite.jsx")),
  "conditional-logic-automation": t(() => import("./tools/ConditionalLogicAutomation.jsx")),
  "conversion-rate-optimization": t(() => import("./tools/ConversionRateOptimization.jsx")),
  "creative-automation-engine": t(() => import("./tools/CreativeAutomationEngine.jsx")),
  "custom-dashboard-builder": t(() => import("./tools/CustomDashboardBuilder.jsx")),
  "daily-cfo-pack": t(() => import("./tools/DailyCFOPack.jsx")),
  "digital-asset-management": t(() => import("./tools/DigitalAssetManagement.jsx")),
  "finance-autopilot": t(() => import("./tools/FinanceAutopilot.jsx")),
  "inbox-assistant": t(() => import("./tools/InboxAssistant.jsx")),
  "inventory-supplier-sync": t(() => import("./tools/InventorySupplierSync.jsx")),
  "link-intersect-outreach": t(() => import("./tools/LinkIntersectOutreach.jsx")),
  "local-seo-toolkit": t(() => import("./tools/LocalSEOToolkit.jsx")),
  "ltv-churn-predictor": t(() => import("./tools/LTVChurnPredictor.jsx")),
  "multi-channel-optimizer": t(() => import("./tools/MultiChannelOptimizer.jsx")),
  "newsletter-automation": t(() => import("./tools/NewsletterAutomation.jsx")),
  "omnichannel-campaign-builder": t(() => import("./tools/OmnichannelCampaignBuilder.jsx")),
  "personalization-recommendation-engine": t(() => import("./tools/PersonalizationRecommendationEngine.jsx")),
  "predictive-analytics-widgets": t(() => import("./tools/PredictiveAnalyticsWidgets.jsx")),
  "reporting-integrations": t(() => import("./tools/ReportingIntegrations.jsx")),
  "scheduled-export": t(() => import("./tools/ScheduledExport.jsx")),
  "self-service-analytics": t(() => import("./tools/SelfServiceAnalytics.jsx")),
  "self-service-portal": t(() => import("./tools/SelfServicePortal.jsx")),
  "social-media-analytics-listening": t(() => import("./tools/SocialMediaAnalyticsListening.jsx")),
  "social-scheduler-content-engine": t(() => import("./tools/SocialSchedulerContentEngine.jsx")),
  "subscription-management": t(() => import("./tools/SubscriptionManagement.jsx")),
  "video-podcast-seo": t(() => import("./tools/VideoPodcastSEO.jsx")),
  "visual-workflow-builder": t(() => import("./tools/VisualWorkflowBuilder.jsx")),
  "voice-search-optimization": t(() => import("./tools/VoiceSearchOptimization.jsx")),
  "webhook-api-triggers": t(() => import("./tools/WebhookApiTriggers.jsx")),
  "workflow-orchestrator": t(() => import("./tools/WorkflowOrchestrator.jsx")),
  "workflow-automation-builder": t(() => import("./tools/WorkflowAutomationBuilder.jsx")),
  "inventory-forecasting": t(() => import("./tools/InventoryForecasting.jsx")),
  "returns-rma-automation": t(() => import("./tools/ReturnsRMAAutomation.jsx")),
};

const S = {
  bar: { display: "flex", gap: 6, flexWrap: "nowrap", overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none", WebkitOverflowScrolling: "touch", padding: "12px 16px 0", borderBottom: "1px solid #e2e8f0", background: "#ffffff", position: "sticky", top: 0, zIndex: 5 },
  tab: (on) => ({ flexShrink: 0, whiteSpace: "nowrap", background: on ? "#eff6ff" : "transparent", color: on ? "#1d4ed8" : "#64748b", border: "1px solid " + (on ? "#bfdbfe" : "transparent"), borderBottom: on ? "1px solid #eff6ff" : "1px solid transparent", borderRadius: "8px 8px 0 0", padding: "9px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: -1 }),
  lock: { margin: 24, padding: 20, background: "#ffffff", border: "1px solid #dbe3ed", borderRadius: 10, color: "#172033", maxWidth: 520 },
  btn: { marginTop: 12, background: "#2563eb", color: "#fff", border: "none", borderRadius: 8, padding: "8px 14px", fontWeight: 600, cursor: "pointer" },
  badge: { marginLeft: 6, fontSize: 10, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", borderRadius: 999, padding: "1px 7px" },
  note: { margin: "12px 16px 0", padding: "10px 14px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, color: "#92400e", fontSize: 13 },
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
              {x.label}{ok ? "" : ` · ${PLAN_LABEL[requiredPlanFor(x.id)]}`}{isPreviewTool(x.id) && <span style={S.badge}>Preview</span>}
            </button>
          );
        })}
      </div>
      {isPreviewTool(current.id) && <div style={S.note}><strong>Preview.</strong> This tool is still being rebuilt on your real store data, so figures and results here are not yet reliable. Please do not act on them.</div>}
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
