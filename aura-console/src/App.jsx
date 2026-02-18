import React, { useState, useEffect, Suspense, lazy } from "react";
import { apiFetch } from "./api";
import "./App.css";
import usePlan, { canUseTool } from "./hooks/usePlan";

import toolsMeta from "./toolMeta";
import AiChatbot from "./components/AiChatbot.jsx";
import ChangelogModal from "./components/ChangelogModal.jsx";
import Toast from "./components/Toast.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";
import ShopifyReconnectButton from "./components/ShopifyReconnectButton.jsx";

const PricingPage = lazy(() => import("./components/PricingPage"));
const ProjectSwitcher = lazy(() => import("./ProjectSwitcher"));
const SystemHealthPanel = lazy(() => import("./components/SystemHealthPanel"));
const DraftLibrary = lazy(() => import("./components/DraftLibrary"));
const ContentIngestor = lazy(() => import("./components/ContentIngestor"));
const ProductsList = lazy(() => import("./components/ProductsList.jsx"));
const ToolsList = lazy(() => import("./components/ToolsList.jsx"));
const ContentHealthAuditor = lazy(() => import("./components/ContentHealthAuditor"));
const UserManagement = lazy(() => import("./components/UserManagement.jsx"));
const AutomationScheduler = lazy(() => import("./components/AutomationScheduler.jsx"));
const Reports = lazy(() => import("./components/Reports.jsx"));
const WorkflowOrchestrator = lazy(() => import("./components/tools/WorkflowOrchestrator.jsx"));
const ProductSeoEngine = lazy(() => import("./components/ProductSeoEngine"));
const InternalLinkOptimizer = lazy(() => import("./components/InternalLinkOptimizer"));
const Dashboard = lazy(() => import("./dashboard/Dashboard.jsx"));
const AllTools = lazy(() => import("./components/AllTools.jsx"));
const MainSuite = lazy(() => import("./components/tools/MainSuite.jsx"));
const SeoMasterSuite = lazy(() => import("./components/tools/SeoMasterSuite.jsx"));
const FixQueue = lazy(() => import("./components/FixQueue"));
const Auth = lazy(() => import("./auth/Auth.jsx"));
const Onboarding = lazy(() => import("./onboarding/Onboarding.jsx"));
const Credits = lazy(() => import("./credits/Credits.jsx"));
const Settings = lazy(() => import("./components/Settings.jsx"));
const AbandonedCheckoutWinback = lazy(() => import("./components/tools/AbandonedCheckoutWinback.jsx"));
const CustomerDataPlatform = lazy(() => import("./components/tools/CustomerDataPlatform.jsx"));
const VisualWorkflowBuilder = lazy(() => import("./components/tools/VisualWorkflowBuilder.jsx"));
const SelfServicePortal = lazy(() => import("./components/tools/SelfServicePortal.jsx"));
const AdvancedPersonalizationEngine = lazy(() => import("./components/tools/AdvancedPersonalizationEngine.jsx"));
const ABTestingSuite = lazy(() => import("./components/tools/ABTestingSuite.jsx"));
const DataWarehouseConnector = lazy(() => import("./components/tools/DataWarehouseConnector.jsx"));
const ConsentPrivacyManagement = lazy(() => import("./components/tools/ConsentPrivacyManagement.jsx"));
const EntityTopicExplorer = lazy(() => import("./components/tools/EntityTopicExplorer.jsx"));
const InternalLinkingSuggestions = lazy(() => import("./components/tools/InternalLinkingSuggestions.jsx"));
const AIContentBriefGenerator = lazy(() => import("./components/tools/AIContentBriefGenerator.jsx"));
const BrandMentionTracker = lazy(() => import("./components/tools/BrandMentionTracker.jsx"));
const LocalSEOToolkit = lazy(() => import("./components/tools/LocalSEOToolkit.jsx"));
const AutomationTemplates = lazy(() => import("./components/tools/AutomationTemplates.jsx"));
const ConditionalLogicAutomation = lazy(() => import("./components/tools/ConditionalLogicAutomation.jsx"));
const WebhookApiTriggers = lazy(() => import("./components/tools/WebhookApiTriggers.jsx"));
const ReportingIntegrations = lazy(() => import("./components/tools/ReportingIntegrations.jsx"));
const CustomDashboardBuilder = lazy(() => import("./components/tools/CustomDashboardBuilder.jsx"));
const WorkflowAutomationBuilder = lazy(() => import("./components/tools/WorkflowAutomationBuilder.jsx"));
const ScheduledExport = lazy(() => import("./components/tools/ScheduledExport.jsx"));
const SelfServiceAnalytics = lazy(() => import("./components/tools/SelfServiceAnalytics.jsx"));
const ChurnPredictionPlaybooks = lazy(() => import("./components/tools/ChurnPredictionPlaybooks.jsx"));
const UpsellCrossSellEngine = lazy(() => import("./components/tools/UpsellCrossSellEngine.jsx"));
const InventoryForecasting = lazy(() => import("./components/tools/InventoryForecasting.jsx"));
const BlogDraftEngine = lazy(() => import("./components/tools/BlogDraftEngine.jsx"));
const BlogSEO = lazy(() => import("./components/tools/BlogSEO.jsx"));
const WeeklyBlogContentEngine = lazy(() => import("./components/tools/WeeklyBlogContentEngine.jsx"));
const OnPageSEOEngine = lazy(() => import("./components/tools/OnPageSEOEngine.jsx"));
const TechnicalSEOAuditor = lazy(() => import("./components/tools/TechnicalSEOAuditor.jsx"));
const SERPTracker = lazy(() => import("./components/tools/SERPTracker.jsx"));
const SEOSiteCrawler = lazy(() => import("./components/tools/SEOSiteCrawler.jsx"));
const SocialSchedulerContentEngine = lazy(() => import("./components/tools/SocialSchedulerContentEngine.jsx"));
const SocialMediaAnalyticsListening = lazy(() => import("./components/tools/SocialMediaAnalyticsListening.jsx"));
const SiteAuditHealth = lazy(() => import("./components/tools/SiteAuditHealth.jsx"));
const SchemaRichResultsEngine = lazy(() => import("./components/tools/SchemaRichResultsEngine.jsx"));
const ReviewUGCEngine = lazy(() => import("./components/tools/ReviewUGCEngine.jsx"));
const ReturnsRMAAutomation = lazy(() => import("./components/tools/ReturnsRMAAutomation.jsx"));
const RankVisibilityTracker = lazy(() => import("./components/tools/RankVisibilityTracker.jsx"));
const MultiChannelOptimizer = lazy(() => import("./components/tools/MultiChannelOptimizer.jsx"));
const LTVChurnPredictor = lazy(() => import("./components/tools/LTVChurnPredictor.jsx"));
const KlaviyoFlowAutomation = lazy(() => import("./components/tools/KlaviyoFlowAutomation.jsx"));
const InventorySupplierSync = lazy(() => import("./components/tools/InventorySupplierSync.jsx"));
const InboxReplyAssistant = lazy(() => import("./components/tools/InboxReplyAssistant.jsx"));
const InboxAssistant = lazy(() => import("./components/tools/InboxAssistant.jsx"));
const ImageAltMediaSEO = lazy(() => import("./components/tools/ImageAltMediaSEO.jsx"));
const FinanceAutopilot = lazy(() => import("./components/tools/FinanceAutopilot.jsx"));
const EmailAutomationBuilder = lazy(() => import("./components/tools/EmailAutomationBuilder.jsx"));
const DynamicPricingEngine = lazy(() => import("./components/tools/DynamicPricingEngine.jsx"));
const CustomerSupportAI = lazy(() => import("./components/tools/CustomerSupportAI.jsx"));
const CreativeAutomationEngine = lazy(() => import("./components/tools/CreativeAutomationEngine.jsx"));
const BrandIntelligenceLayer = lazy(() => import("./components/tools/BrandIntelligenceLayer.jsx"));
const AutoInsights = lazy(() => import("./components/tools/AutoInsights.jsx"));
const AuraOperationsAI = lazy(() => import("./components/tools/AuraOperationsAI.jsx"));
const AuraAPISDK = lazy(() => import("./components/tools/AuraAPISDK.jsx"));
const AiSupportAssistant = lazy(() => import("./components/tools/AISupportAssistant.jsx"));
const AiLaunchPlanner = lazy(() => import("./components/tools/AILaunchPlanner.jsx"));
const AdvancedAnalyticsAttribution = lazy(() => import("./components/tools/AdvancedAnalyticsAttribution.jsx"));
const PredictiveAnalyticsWidgets = lazy(() => import("./components/tools/PredictiveAnalyticsWidgets.jsx"));
const ToolScaffold = lazy(() => import("./components/tools/ToolScaffold.jsx"));
const LoyaltyReferralPrograms = lazy(() => import("./components/tools/LoyaltyReferralPrograms.jsx"));
const PersonalizationRecommendationEngine = lazy(() => import("./components/tools/PersonalizationRecommendationEngine.jsx"));
const ContentScoringOptimization = lazy(() => import("./components/tools/ContentScoringOptimization.jsx"));

const MAIN_SUITE_PREF_KEY = "main-suite-prefs";

// Map tool ids to Main Suite group ids so the mega menu can deep-link into the suite.
// Groups come from src/tools/main-suite/modules.js
const toolToMainSuiteGroup = {
  // Workflows & Automation
  "workflow-orchestrator": "workflows",
  "workflow-automation-builder": "workflows",
  "visual-workflow-builder": "workflows",
  "webhook-api-triggers": "workflows",
  "conditional-logic-automation": "workflows",
  "omnichannel-campaign-builder": "lifecycle",
  // Analytics & Reporting
  "advanced-analytics-attribution": "analytics",
  "reporting-integrations": "analytics",
  "custom-dashboard-builder": "analytics",
  "auto-insights": "analytics",
  "predictive-analytics-widgets": "analytics",
  "self-service-analytics": "analytics",
  "ab-testing-suite": "analytics",
  // SEO Core
  "seo-site-crawler": "seo",
  "site-audit-health": "seo",
  "technical-seo-auditor": "seo",
  "on-page-seo-engine": "seo",
  "rank-visibility-tracker": "seo",
  "serp-tracker": "seo",
  "schema-rich-results-engine": "seo",
  "image-alt-media-seo": "seo",
  // Personalization & CDP
  "customer-data-platform": "personalization",
  "personalization-recommendation-engine": "personalization",
  "advanced-personalization-engine": "personalization",
  "upsell-cross-sell-engine": "personalization",
  "ltv-churn-predictor": "personalization",
  "ai-segmentation-engine": "personalization",
  // Pricing, Inventory & Finance
  "advanced-finance-inventory-planning": "revenue",
  "inventory-forecasting": "revenue",
  "inventory-supplier-sync": "revenue",
  "dynamic-pricing-engine": "revenue",
  "finance-autopilot": "revenue",
  "daily-cfo-pack": "revenue",
  // Lifecycle Automation
  "email-automation-builder": "lifecycle",
  "abandoned-checkout-winback": "lifecycle",
  "multi-channel-optimizer": "lifecycle",
  "returns-rma-automation": "lifecycle",
  "churn-prediction-playbooks": "lifecycle",
  "klaviyo-flow-automation": "lifecycle",
  "ai-content-image-gen": "lifecycle",
  // Ads & Acquisition
  "google-ads-integration": "ads",
  "facebook-ads-integration": "ads",
  "tiktok-ads-integration": "ads",
  "ads-anomaly-guard": "ads",
  "ad-creative-optimizer": "ads",
  // Social & Listening
  "social-media-analytics-listening": "social",
  "social-scheduler-content-engine": "social",
  "brand-mention-tracker": "social",
  // Support & Portals
  "self-service-portal": "support",
  "self-service-support-portal": "support",
  "customer-support-ai": "support",
  "inbox-assistant": "support",
  "inbox-reply-assistant": "support",
  "compliance-privacy-suite": "support",
};

// Global error boundary for graceful error handling
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    if (typeof window !== 'undefined' && window.console) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
    if (this.props.onError) {
      this.props.onError(error);
    }
    // Removed broken /api/analytics call. Add error logging here if needed.
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          color: '#ff4d4f',
          background: '#23263a',
          padding: 48,
          borderRadius: 18,
          margin: '64px auto',
          maxWidth: 540,
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 20,
          boxShadow: '0 8px 32px #0006',
        }}>
          <div>Something went wrong.</div>
          <div style={{ fontSize: 15, marginTop: 18, color: '#fff8' }}>{this.state.error?.toString()}</div>
          <pre style={{ color: '#fff', fontSize: 13, marginTop: 18, textAlign: 'left', background: '#1a1a1a', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
            {this.state.error?.stack || ''}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
      // Fetch project/shop context from backend API on mount
      useEffect(() => {
        async function fetchProject() {
          try {
            const res = await apiFetch('/api/session');
            if (res.ok) {
              const data = await res.json();
              if (data && data.project) {
                const sanitizedDomain = (data.project.domain || data.project.shopDomain || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
                if (sanitizedDomain) {
                  localStorage.setItem('auraShopDomain', sanitizedDomain);
                }
                setProject({ ...data.project, domain: sanitizedDomain || data.project.domain });
              } else if (data && data.shop) {
                setProject({ id: data.shop.id, name: data.shop.name });
              }
            }
          } catch (e) {
            // Fallback: try localStorage for dev
            const storedProjectId = localStorage.getItem('auraProjectId');
            const storedProjectName = localStorage.getItem('auraProjectName');
            if (storedProjectId) {
              setProject({ id: storedProjectId, name: storedProjectName });
            }
          }
        }
        fetchProject();
      }, []);
    // Debug banner removed
  // Main navigation state
  const [activeSection, setActiveSectionRaw] = useState('dashboard');
  const { plan } = usePlan();
  const [toolInitUrl, setToolInitUrl] = useState(null);

  // Gate navigation — locked tools redirect to Settings
  function setActiveSection(section, url) {
    if (url) setToolInitUrl(url);
    if (!canUseTool(plan, section)) {
      setActiveSectionRaw('settings');
      return;
    }
    setActiveSectionRaw(section);
  }

  const [sectionHistory, setSectionHistory] = useState([]);
  const sectionHistoryRef = React.useRef([]);
  const navModeRef = React.useRef(null);
  const prevSectionRef = React.useRef(null);
  const lastPushedSectionRef = React.useRef(null);
  // Project state (simulate or fetch as needed)
  const [project, setProject] = useState(null);
  // Core API URL (simulate or fetch as needed)
  const [coreUrl] = useState(window.CORE_API || 'https://aura-core-monolith.onrender.com');
  // Floating AI Chatbot widget state
  const [showChatbot, setShowChatbot] = useState(false);
  // Onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('auraOnboarded'));
  // Changelog modal state
  const [showChangelog, setShowChangelog] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  // Changelog unread state (simple: mark as seen after open)
  const [changelogSeen, setChangelogSeen] = useState(() => !!localStorage.getItem('auraChangelogSeen'));
  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Handle ?billing=success redirect back from Shopify approval page
  // Use sessionStorage so this only fires once even if the URL param persists in the Shopify Admin parent frame
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const alreadyHandled = sessionStorage.getItem('billingSuccessHandled');
    if (params.get('billing') === 'success' && !alreadyHandled) {
      sessionStorage.setItem('billingSuccessHandled', '1');
      setToast({ message: '🎉 Plan upgraded successfully! Your new features are now active.', type: 'success' });
      setActiveSectionRaw('settings');
    }
    // Clear the flag after 10s so a future genuine upgrade still shows the toast
    if (alreadyHandled) {
      setTimeout(() => sessionStorage.removeItem('billingSuccessHandled'), 10000);
    }
  }, []);

  const navigateToMainSuite = (targetGroupId) => {
    try {
      const prefs = JSON.parse(localStorage.getItem(MAIN_SUITE_PREF_KEY) || "{}") || {};
      localStorage.setItem(
        MAIN_SUITE_PREF_KEY,
        JSON.stringify({ ...prefs, activeGroup: targetGroupId || prefs.activeGroup })
      );
    } catch (e) {
      // ignore prefs errors
    }
    setActiveSection('main-suite');
  };
  // Track section transitions for an in-app back action
  useEffect(() => {
    if (navModeRef.current === 'back') {
      navModeRef.current = null;
    } else if (prevSectionRef.current && prevSectionRef.current !== activeSection) {
      setSectionHistory(prev => [...prev.slice(-9), prevSectionRef.current]);
    }
    prevSectionRef.current = activeSection;
  }, [activeSection]);

  useEffect(() => {
    sectionHistoryRef.current = sectionHistory;
  }, [sectionHistory]);

  // Keep browser history in sync so browser back stays inside the app
  useEffect(() => {
    if (typeof window === 'undefined' || !window.history?.pushState) return;
    const state = { section: activeSection };
    if (lastPushedSectionRef.current === null) {
      window.history.replaceState(state, "");
    } else if (navModeRef.current !== 'popstate') {
      window.history.pushState(state, "");
    }
    lastPushedSectionRef.current = activeSection;
    if (navModeRef.current === 'popstate') navModeRef.current = null;
  }, [activeSection]);

  useEffect(() => {
    const onPopState = (e) => {
      if (e.state && e.state.section) {
        navModeRef.current = 'popstate';
        setActiveSection(e.state.section);
        return;
      }
      const historyStack = sectionHistoryRef.current;
      if (historyStack.length) {
        const last = historyStack[historyStack.length - 1];
        navModeRef.current = 'popstate';
        setSectionHistory(historyStack.slice(0, -1));
        setActiveSection(last);
        return;
      }
      // fallback to dashboard without leaving the embedded app
      navModeRef.current = 'popstate';
      setActiveSection('dashboard');
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState({ section: 'dashboard' }, "");
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Provide a global helper for tool back buttons to jump to Main Suite
  useEffect(() => {
    window.__AURA_TO_SUITE = (targetGroupId) => {
      try {
        const prefs = JSON.parse(localStorage.getItem(MAIN_SUITE_PREF_KEY) || "{}") || {};
        localStorage.setItem(
          MAIN_SUITE_PREF_KEY,
          JSON.stringify({ ...prefs, activeGroup: targetGroupId || prefs.activeGroup })
        );
      } catch (e) {
        // ignore prefs errors
      }
      navModeRef.current = 'suite';
      setSectionHistory([]);
      setActiveSection('main-suite');
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        window.history.replaceState({ section: 'main-suite' }, "");
      }
    };
    return () => { delete window.__AURA_TO_SUITE; };
  }, []);

  useEffect(() => {
    window.__AURA_SECTION_BACK = () => {
      setSectionHistory(prev => {
        if (!prev.length) {
          if (typeof window !== 'undefined' && window.history?.back) window.history.back();
          return prev;
        }
        const last = prev[prev.length - 1];
        navModeRef.current = 'back';
        setActiveSection(last);
        return prev.slice(0, -1);
      });
    };
    return () => { delete window.__AURA_SECTION_BACK; };
  }, []);

  // Mark onboarding as complete
  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('auraOnboarded', '1');
  };
  // Mark changelog as seen
  const handleShowChangelog = () => {
    setShowChangelog(true);
    setChangelogSeen(true);
    localStorage.setItem('auraChangelogSeen', '1');
  };
  return (
    <ErrorBoundary>
      <OnboardingModal open={showOnboarding} onClose={handleCloseOnboarding} />
      <ChangelogModal open={showChangelog} onClose={() => setShowChangelog(false)} />
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
      <div className="app-shell">
        {/* Simplified top navigation */}
        <nav className="top-nav-clean">
          <div className="nav-brand">
            <img src="/logo-aura.png" alt="AURA" className="nav-logo" />
            <span className="nav-brand-text">AURA</span>
          </div>
          <div className="nav-links">
            <button
              className={activeSection === 'dashboard' ? 'nav-link-active' : 'nav-link'}
              onClick={() => setActiveSection('dashboard')}
            >
              <span className="nav-icon">📊</span>
              Dashboard
            </button>
            <button
              className={activeSection === 'all-tools' || activeSection === 'main-suite' || activeSection.includes('suite') ? 'nav-link-active' : 'nav-link'}
              onClick={() => setActiveSection('all-tools')}
            >
              <span className="nav-icon">🚀</span>
              Tools
            </button>
            <button
              className={activeSection === 'settings' ? 'nav-link-active' : 'nav-link'}
              onClick={() => setActiveSection('settings')}
            >
              <span className="nav-icon">⚙️</span>
              Settings
            </button>
          </div>
          <div className="nav-actions">
            {project?.name && (
              <div className="nav-shop-info">
                <span className="shop-name">{project.name}</span>
              </div>
            )}
          </div>
        </nav>
        <main className="app-main">
          <div className="page-frame fade-in">
            <section className="tool-section">
              {/* Main content routing */}
              <Suspense fallback={<div className="loading-spinner"><div className="spinner"></div><p>Loading…</p></div>}>
                {/* Core sections */}
                {activeSection === "dashboard" && <Dashboard setActiveSection={(section, url) => { if (url) setToolInitUrl(url); setActiveSection(section); }} />}
                {activeSection === "all-tools" && <AllTools setActiveSection={setActiveSection} />}
                {activeSection === "main-suite" && <MainSuite setActiveSection={setActiveSection} />}
                {activeSection === "settings" && <Settings />}
                
                {/* Legacy sections - only accessible via direct navigation */}
                {activeSection === "seo-master-suite" && <SeoMasterSuite />}
                {activeSection === "pricing" && <PricingPage />}
                {activeSection === "automation-scheduler" && <AutomationScheduler />}
                {activeSection === "reports" && <Reports />}
                {activeSection === "auth" && <Auth />}
                {activeSection === "user-management" && <UserManagement coreUrl={coreUrl} />}
                {activeSection === "onboarding" && <Onboarding />}
                {activeSection === "credits" && <Credits />}
                {activeSection === "ai-chatbot" && <AiChatbot coreUrl={coreUrl} />}

                {/* Utility sections */}
                {(activeSection === "workflow-orchestrator" || activeSection === "orchestration") && <WorkflowOrchestrator />}
                {activeSection === "products" && (
                  <ProductsList 
                    shopDomain={project && project.domain ? String(project.domain).replace(/^https?:\/\//, "").replace(/\/$/, "") : undefined}
                    shopToken={undefined}
                  />
                )}
                {activeSection === "content-health" && project && (
                  <ContentHealthAuditor coreUrl={coreUrl} projectId={project.id} />
                )}
                {activeSection === "fix-queue" && project && (
                  <FixQueue coreUrl={coreUrl} projectId={project.id} />
                )}
                {activeSection === "content-ingest" && project && (
                  <ContentIngestor coreUrl={coreUrl} projectId={project.id} />
                )}
                {activeSection === "draft-library" && project && (
                  <DraftLibrary coreUrl={coreUrl} projectId={project.id} />
                )}
                {activeSection === "system-health" && (
                  <SystemHealthPanel
                    coreStatus={coreStatus}
                    coreStatusLabel={coreStatusLabel}
                    lastRunAt={lastRunAt}
                  />
                )}
                {/* Individual tool routes - accessed via Main Suite */}
                {activeSection === "tools" && project && <ToolsList />}
                
                {/* Enterprise tools with dedicated UIs */}
                {activeSection === "product-seo" && <ProductSeoEngine />}
                {activeSection === "klaviyo-flow-automation" && <KlaviyoFlowAutomation />}
                {activeSection === "email-automation-builder" && <EmailAutomationBuilder />}
                {activeSection === "dynamic-pricing-engine" && <DynamicPricingEngine />}
                {activeSection === "upsell-cross-sell-engine" && <UpsellCrossSellEngine />}
                {activeSection === "ab-testing-suite" && <ABTestingSuite />}
                {activeSection === "customer-data-platform" && <CustomerDataPlatform />}
                {activeSection === "personalization-recommendation-engine" && <PersonalizationRecommendationEngine />}
                {activeSection === "customer-support-ai" && <CustomerSupportAI />}
                {activeSection === "ai-support-assistant" && <AiSupportAssistant />}
                {activeSection === "review-ugc-engine" && <ReviewUGCEngine />}
                {(activeSection === "loyalty-referral-programs" || activeSection === "loyalty-referral-program-v2") && <LoyaltyReferralPrograms />}
                {activeSection === "brand-mention-tracker" && <BrandMentionTracker />}
                {activeSection === "social-media-analytics-listening" && <SocialMediaAnalyticsListening />}
                {activeSection === "content-scoring-optimization" && <ContentScoringOptimization />}
                {activeSection === "ai-content-brief-generator" && <AIContentBriefGenerator />}
                {activeSection === "blog-seo" && <BlogSEO />}
                {activeSection === "weekly-blog-content-engine" && <WeeklyBlogContentEngine />}
                {activeSection === "blog-draft-engine" && <BlogDraftEngine />}
                {activeSection === "predictive-analytics-widgets" && <PredictiveAnalyticsWidgets />}
                {activeSection === "self-service-analytics" && <SelfServiceAnalytics />}
                {activeSection === "advanced-analytics-attribution" && <AdvancedAnalyticsAttribution />}
                
                {/* Additional tools */}
                {activeSection === "abandoned-checkout-winback" && <AbandonedCheckoutWinback />}
                {activeSection === "visual-workflow-builder" && <VisualWorkflowBuilder />}
                {activeSection === "workflow-automation-builder" && <WorkflowAutomationBuilder />}
                {(activeSection === "image-alt-media-seo" || activeSection === "ai-alt-text-engine") && <ImageAltMediaSEO />}
                {activeSection === "ltv-churn-predictor" && <LTVChurnPredictor />}
                {activeSection === "multi-channel-optimizer" && <MultiChannelOptimizer />}
                {activeSection === "churn-prediction-playbooks" && <ChurnPredictionPlaybooks />}
                {activeSection === "inventory-forecasting" && <InventoryForecasting />}
                {activeSection === "inventory-supplier-sync" && <InventorySupplierSync />}
                {activeSection === "finance-autopilot" && <FinanceAutopilot />}
                {activeSection === "inbox-assistant" && <InboxAssistant />}
                {activeSection === "inbox-reply-assistant" && <InboxReplyAssistant />}
                {activeSection === "creative-automation-engine" && <CreativeAutomationEngine />}
                {activeSection === "brand-intelligence-layer" && <BrandIntelligenceLayer />}
                {activeSection === "auto-insights" && <AutoInsights />}
                {activeSection === "aura-operations-ai" && <AuraOperationsAI />}
                {activeSection === "aura-api-sdk" && <AuraAPISDK />}
                {activeSection === "ai-launch-planner" && <AiLaunchPlanner />}
                
                {/* SEO Tools */}
                {activeSection === "on-page-seo-engine" && <OnPageSEOEngine initialUrl={toolInitUrl} onUrlConsumed={() => setToolInitUrl(null)} />}
                {activeSection === "technical-seo-auditor" && <TechnicalSEOAuditor />}
                {activeSection === "serp-tracker" && <SERPTracker />}
                {activeSection === "seo-site-crawler" && <SEOSiteCrawler />}
                {activeSection === "site-audit-health" && <SiteAuditHealth />}
                {activeSection === "schema-rich-results-engine" && <SchemaRichResultsEngine />}
                {activeSection === "rank-visibility-tracker" && <RankVisibilityTracker />}
                {activeSection === "entity-topic-explorer" && <EntityTopicExplorer />}
                {activeSection === "internal-linking-suggestions" && <InternalLinkingSuggestions />}
                {activeSection === "local-seo-toolkit" && <LocalSEOToolkit />}
                
                {/* Workflow & Automation */}
                {activeSection === "automation-templates" && <AutomationTemplates />}
                {activeSection === "conditional-logic-automation" && <ConditionalLogicAutomation />}
                {activeSection === "webhook-api-triggers" && <WebhookApiTriggers />}
                
                {/* Analytics & Reporting */}
                {activeSection === "reporting-integrations" && <ReportingIntegrations />}
                {activeSection === "custom-dashboard-builder" && <CustomDashboardBuilder />}
                {activeSection === "scheduled-export" && <ScheduledExport />}
                
                {/* Social & Content */}
                {activeSection === "social-scheduler-content-engine" && <SocialSchedulerContentEngine />}
                {activeSection === "returns-rma-automation" && <ReturnsRMAAutomation />}
                
                {/* Data & Integrations */}
                {activeSection === "data-warehouse-connector" && <DataWarehouseConnector />}
                {activeSection === "consent-privacy-management" && <ConsentPrivacyManagement />}
                {activeSection === "self-service-portal" && <SelfServicePortal />}
                {activeSection === "advanced-personalization-engine" && <AdvancedPersonalizationEngine />}
              </Suspense>
            </section>
          </div>
        </main>
        {/* Floating AI Chatbot widget - always visible at root */}
        <div style={{ position: "fixed", bottom: 32, right: 32, zIndex: 9999 }}>
          {!showChatbot && (
            <button
              onClick={() => setShowChatbot(true)}
              style={{
                background: "#232b3b",
                color: "#7fffd4",
                border: "none",
                borderRadius: 50,
                boxShadow: "0 2px 12px #22d3ee55",
                padding: "16px 22px",
                fontWeight: 700,
                fontSize: 18,
                cursor: "pointer"
              }}
              aria-label="Open AI Chatbot"
            >
              💬 Chat
            </button>
          )}
          {showChatbot && (
            <div style={{ position: "relative", width: 400, maxWidth: "90vw" }}>
              <div style={{ position: "absolute", top: -38, right: 0 }}>
                <button
                  onClick={() => setShowChatbot(false)}
                  style={{
                    background: "#ff4d4f",
                    color: "#fff",
                    border: "none",
                    borderRadius: 20,
                    padding: "4px 12px",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer"
                  }}
                  aria-label="Close AI Chatbot"
                >
                  ✕ Close
                </button>
              </div>
              <AiChatbot coreUrl={coreUrl} />
            </div>
          )}
        </div>
        <ShopifyReconnectButton shopDomain={project?.domain} />
      </div>
    </ErrorBoundary>
  );
}
export default App;
