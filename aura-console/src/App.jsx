import React, { useState, useEffect, Suspense, lazy } from "react";
import { apiFetch, apiFetchJSON } from "./api";
import "./App.css";
import usePlan, { canUseTool, PLAN_LABEL, PLAN_COLOUR } from "./hooks/usePlan";

import toolsMeta from "./toolMeta";
import AiChatbot from "./components/AiChatbot.jsx";
import ChangelogModal from "./components/ChangelogModal.jsx";
import Toast from "./components/Toast.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";
import ShopifyReconnectButton from "./components/ShopifyReconnectButton.jsx";
import AppSidebar from "./components/AppSidebar.jsx";

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
const ProductSeoEngine = lazy(() => import("./components/ProductSeoEngine"));
const InternalLinkOptimizer = lazy(() => import("./components/InternalLinkOptimizer"));
const Dashboard = lazy(() => import("./dashboard/Dashboard.jsx"));
const AllTools = lazy(() => import("./components/AllTools.jsx"));
const MainSuite = lazy(() => import("./components/tools/MainSuite.jsx"));
const FixQueue = lazy(() => import("./components/FixQueue"));
const Auth = lazy(() => import("./auth/Auth.jsx"));
const Onboarding = lazy(() => import("./onboarding/Onboarding.jsx"));
const Credits = lazy(() => import("./credits/Credits.jsx"));
const Settings = lazy(() => import("./components/Settings.jsx"));

// Tool components — organized by suite
const AbandonedCheckoutWinback = lazy(() => import("./components/tools/AbandonedCheckoutWinback.jsx"));
const CustomerDataPlatform = lazy(() => import("./components/tools/CustomerDataPlatform.jsx"));
const SelfServicePortal = lazy(() => import("./components/tools/SelfServicePortal.jsx"));
const AdvancedPersonalizationEngine = lazy(() => import("./components/tools/AdvancedPersonalizationEngine.jsx"));
const DataWarehouseConnector = lazy(() => import("./components/tools/DataWarehouseConnector.jsx"));
const AIContentBriefGenerator = lazy(() => import("./components/tools/AIContentBriefGenerator.jsx"));
const BrandMentionTracker = lazy(() => import("./components/tools/BrandMentionTracker.jsx"));
const LocalSEOToolkit = lazy(() => import("./components/tools/LocalSEOToolkit.jsx"));
const AutomationTemplates = lazy(() => import("./components/tools/AutomationTemplates.jsx"));
const WebhookApiTriggers = lazy(() => import("./components/tools/WebhookApiTriggers.jsx"));
const ReportingIntegrations = lazy(() => import("./components/tools/ReportingIntegrations.jsx"));
const CustomDashboardBuilder = lazy(() => import("./components/tools/CustomDashboardBuilder.jsx"));
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
const SEOSiteCrawler = lazy(() => import("./components/tools/SEOSiteCrawler.jsx"));
const SocialSchedulerContentEngine = lazy(() => import("./components/tools/SocialSchedulerContentEngine.jsx"));
const SchemaRichResultsEngine = lazy(() => import("./components/tools/SchemaRichResultsEngine.jsx"));
const ReviewUGCEngine = lazy(() => import("./components/tools/ReviewUGCEngine.jsx"));
const ReturnsRMAAutomation = lazy(() => import("./components/tools/ReturnsRMAAutomation.jsx"));
const RankVisibilityTracker = lazy(() => import("./components/tools/RankVisibilityTracker.jsx"));
const LTVChurnPredictor = lazy(() => import("./components/tools/LTVChurnPredictor.jsx"));
const InventorySupplierSync = lazy(() => import("./components/tools/InventorySupplierSync.jsx"));
const InboxAssistant = lazy(() => import("./components/tools/InboxAssistant.jsx"));
const ImageAltMediaSEO = lazy(() => import("./components/tools/ImageAltMediaSEO.jsx"));
const FinanceAutopilot = lazy(() => import("./components/tools/FinanceAutopilot.jsx"));
const EmailAutomationBuilder = lazy(() => import("./components/tools/EmailAutomationBuilder.jsx"));
const DynamicPricingEngine = lazy(() => import("./components/tools/DynamicPricingEngine.jsx"));
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
const ContentScoringOptimization = lazy(() => import("./components/tools/ContentScoringOptimization.jsx"));
const AIVisibilityTracker = lazy(() => import("./components/tools/AIVisibilityTracker.jsx"));
const BacklinkExplorer = lazy(() => import("./components/tools/BacklinkExplorer.jsx"));
const CompetitiveAnalysis = lazy(() => import("./components/tools/CompetitiveAnalysis.jsx"));
const KeywordResearchSuite = lazy(() => import("./components/tools/KeywordResearchSuite.jsx"));
const LinkIntersectOutreach = lazy(() => import("./components/tools/LinkIntersectOutreach.jsx"));
const CollaborationApprovalWorkflows = lazy(() => import("./components/tools/CollaborationApprovalWorkflows.jsx"));
const CustomerJourneyMapping = lazy(() => import("./components/tools/CustomerJourneyMapping.jsx"));
const CustomerSegmentationEngine = lazy(() => import("./components/tools/CustomerSegmentationEngine.jsx"));
const DataEnrichmentSuite = lazy(() => import("./components/tools/DataEnrichmentSuite.jsx"));
const ProductSEOEngine = lazy(() => import("./components/tools/ProductSEOEngine.jsx"));
const PersonalizationRecommendationEngine = lazy(() => import("./components/tools/PersonalizationRecommendationEngine.jsx"));
const SocialMediaAnalyticsListening = lazy(() => import("./components/tools/SocialMediaAnalyticsListening.jsx"));
const AIContentImageGen = lazy(() => import("./components/tools/AIContentImageGen.jsx"));

const MAIN_SUITE_PREF_KEY = "main-suite-prefs";

// Map tool ids to Main Suite group ids so the sidebar can deep-link into suites.
// Groups come from src/tools/main-suite/modules.js (9 suites)
const toolToMainSuiteGroup = {
  // SEO & Content
  "product-seo": "seo",
  "blog-seo": "seo",
  "blog-draft-engine": "seo",
  "weekly-blog-content-engine": "seo",
  "on-page-seo-engine": "seo",
  "technical-seo-auditor": "seo",
  "schema-rich-results-engine": "seo",
  "image-alt-media-seo": "seo",
  "rank-visibility-tracker": "seo",
  "ai-visibility-tracker": "seo",
  "seo-site-crawler": "seo",
  "internal-link-optimizer": "seo",
  "ai-content-brief-generator": "seo",
  "content-scoring-optimization": "seo",
  "keyword-research-suite": "seo",
  "backlink-explorer": "seo",
  "link-intersect-outreach": "seo",
  "local-seo-toolkit": "seo",
  "competitive-analysis": "seo",
  "ai-content-image-gen": "seo",
  // Email & Lifecycle
  "email-automation-builder": "lifecycle",
  "abandoned-checkout-winback": "lifecycle",
  "returns-rma-automation": "lifecycle",
  "automation-templates": "lifecycle",
  "collaboration-approval-workflows": "lifecycle",
  // Customer Support
  "ai-support-assistant": "support",
  "inbox-assistant": "support",
  "review-ugc-engine": "support",
  "self-service-portal": "support",
  // Social & Brand
  "social-scheduler-content-engine": "social",
  "social-media-analytics-listening": "social",
  "brand-mention-tracker": "social",
  "brand-intelligence-layer": "social",
  "creative-automation-engine": "social",
  // Ads & Acquisition
  "google-ads-integration": "ads",
  "facebook-ads-integration": "ads",
  "tiktok-ads-integration": "ads",
  "ads-anomaly-guard": "ads",
  "ad-creative-optimizer": "ads",
  "omnichannel-campaign-builder": "ads",
  // Analytics & Intelligence
  "advanced-analytics-attribution": "analytics",
  "predictive-analytics-widgets": "analytics",
  "self-service-analytics": "analytics",
  "auto-insights": "analytics",
  "ai-segmentation-engine": "analytics",
  "reporting-integrations": "analytics",
  "custom-dashboard-builder": "analytics",
  "scheduled-export": "analytics",
  "data-warehouse-connector": "analytics",
  // Personalization & Revenue
  "dynamic-pricing-engine": "personalization",
  "upsell-cross-sell-engine": "personalization",
  "customer-data-platform": "personalization",
  "personalization-recommendation-engine": "personalization",
  "advanced-personalization-engine": "personalization",
  "ltv-churn-predictor": "personalization",
  "churn-prediction-playbooks": "personalization",
  "customer-segmentation-engine": "personalization",
  "customer-journey-mapping": "personalization",
  "data-enrichment-suite": "personalization",
  // Finance & Operations
  "finance-autopilot": "finance",
  "inventory-supplier-sync": "finance",
  "inventory-forecasting": "finance",
  "compliance-privacy-suite": "finance",
  // Platform & Developer
  "aura-operations-ai": "platform",
  "ai-launch-planner": "platform",
  "aura-api-sdk": "platform",
  "webhook-api-triggers": "platform",
  "loyalty-referral-programs": "platform",
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
          background: '#09090b',
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
          <pre style={{ color: '#fff', fontSize: 13, marginTop: 18, textAlign: 'left', background: '#27272a', padding: 16, borderRadius: 8, overflowX: 'auto' }}>
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
            const res = await apiFetchJSON('/api/session');
            if (res.ok) {
              const data = res;
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
      setToast({ message: ' Plan upgraded successfully! Your new features are now active.', type: 'success' });
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
          // No history: go to dashboard (safe in Shopify iframe — don't call history.back())
          navModeRef.current = 'back';
          setActiveSectionRaw('dashboard');
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
      <div className="app-shell" style={{ flexDirection: 'row' }}>
        {/* Persistent left sidebar — HubSpot/Semrush/Klaviyo pattern */}
        <AppSidebar
          activeSection={activeSection}
          setActiveSection={(section, url) => { if (url) setToolInitUrl(url); setActiveSection(section); }}
          plan={plan}
        />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Slim top bar — brand actions only */}
          <header className="top-bar-slim">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {plan && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: plan === 'free' ? '#27272a' : `${PLAN_COLOUR[plan]}18`, color: PLAN_COLOUR[plan] || '#a1a1aa', border: `1px solid ${PLAN_COLOUR[plan] || '#27272a'}44`, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {PLAN_LABEL[plan]}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {project?.name && (
                <div className="nav-shop-info">
                  <span className="shop-name">{String(project.name).replace(/\.myshopify\.com$/i, '')}</span>
                </div>
              )}
            </div>
          </header>
        <main className="app-main">
          <div className="page-frame fade-in">
            <section className="tool-section">
              {/* Main content routing */}
              <Suspense fallback={<div className="loading-spinner"><div className="spinner"></div><p>Loading…</p></div>}>
                {/* Core sections */}
                {activeSection === "dashboard" && <Dashboard setActiveSection={(section, url) => { if (url) setToolInitUrl(url); setActiveSection(section); }} />}
                {activeSection === "all-tools" && <AllTools setActiveSection={setActiveSection} />}
                {activeSection === "main-suite" && <MainSuite setActiveSection={setActiveSection} />}
                {activeSection === "settings" && <Settings setActiveSection={setActiveSection} />}
                
                {/* Legacy sections */}
                {activeSection === "pricing" && <PricingPage />}
                {activeSection === "automation-scheduler" && <AutomationScheduler />}
                {activeSection === "reports" && <Reports />}
                {activeSection === "auth" && <Auth />}
                {activeSection === "user-management" && <UserManagement coreUrl={coreUrl} />}
                {activeSection === "onboarding" && <Onboarding />}
                {activeSection === "credits" && <Credits plan={plan} />}
                {activeSection === "ai-chatbot" && <AiChatbot coreUrl={coreUrl} />}

                {/* Utility sections */}
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
                {activeSection === "tools" && project && <ToolsList />}

                {/* -- SEO & Content -- */}
                {activeSection === "product-seo" && <ProductSeoEngine />}
                {activeSection === "blog-seo" && <BlogSEO />}
                {activeSection === "blog-draft-engine" && <BlogDraftEngine />}
                {activeSection === "weekly-blog-content-engine" && <WeeklyBlogContentEngine />}
                {activeSection === "on-page-seo-engine" && <OnPageSEOEngine initialUrl={toolInitUrl} onUrlConsumed={() => setToolInitUrl(null)} />}
                {activeSection === "technical-seo-auditor" && <TechnicalSEOAuditor />}
                {activeSection === "schema-rich-results-engine" && <SchemaRichResultsEngine />}
                {(activeSection === "image-alt-media-seo" || activeSection === "ai-alt-text-engine") && <ImageAltMediaSEO />}
                {activeSection === "rank-visibility-tracker" && <RankVisibilityTracker />}
                {activeSection === "ai-visibility-tracker" && <AIVisibilityTracker />}
                {activeSection === "seo-site-crawler" && <SEOSiteCrawler />}
                {activeSection === "internal-link-optimizer" && <InternalLinkOptimizer />}
                {activeSection === "ai-content-brief-generator" && <AIContentBriefGenerator />}
                {activeSection === "content-scoring-optimization" && <ContentScoringOptimization />}
                {activeSection === "keyword-research-suite" && <KeywordResearchSuite />}
                {activeSection === "backlink-explorer" && <BacklinkExplorer />}
                {activeSection === "link-intersect-outreach" && <LinkIntersectOutreach />}
                {activeSection === "local-seo-toolkit" && <LocalSEOToolkit />}
                {activeSection === "competitive-analysis" && <CompetitiveAnalysis />}
                {activeSection === "ai-content-image-gen" && <AIContentImageGen />}

                {/* -- Email & Lifecycle -- */}
                {(activeSection === "email-automation-builder" || activeSection === "klaviyo-flow-automation" || activeSection === "ab-testing-suite" || activeSection === "visual-workflow-builder" || activeSection === "workflow-automation-builder" || activeSection === "workflow-orchestrator" || activeSection === "orchestration" || activeSection === "multi-channel-optimizer" || activeSection === "conditional-logic-automation") && <EmailAutomationBuilder />}
                {activeSection === "abandoned-checkout-winback" && <AbandonedCheckoutWinback />}
                {activeSection === "returns-rma-automation" && <ReturnsRMAAutomation />}
                {activeSection === "automation-templates" && <AutomationTemplates />}
                {activeSection === "collaboration-approval-workflows" && <CollaborationApprovalWorkflows />}

                {/* -- Customer Support -- */}
                {activeSection === "ai-support-assistant" && <AiSupportAssistant />}
                {activeSection === "inbox-assistant" && <InboxAssistant />}
                {activeSection === "review-ugc-engine" && <ReviewUGCEngine />}
                {activeSection === "self-service-portal" && <SelfServicePortal />}

                {/* -- Social & Brand -- */}
                {activeSection === "social-scheduler-content-engine" && <SocialSchedulerContentEngine />}
                {activeSection === "brand-mention-tracker" && <BrandMentionTracker />}
                {activeSection === "social-media-analytics-listening" && <SocialMediaAnalyticsListening />}
                {activeSection === "brand-intelligence-layer" && <BrandIntelligenceLayer />}
                {activeSection === "creative-automation-engine" && <CreativeAutomationEngine />}

                {/* -- Ads & Acquisition -- */}

                {/* -- Analytics & Intelligence -- */}
                {activeSection === "advanced-analytics-attribution" && <AdvancedAnalyticsAttribution />}
                {activeSection === "predictive-analytics-widgets" && <PredictiveAnalyticsWidgets />}
                {activeSection === "self-service-analytics" && <SelfServiceAnalytics />}
                {activeSection === "auto-insights" && <AutoInsights />}
                {activeSection === "reporting-integrations" && <ReportingIntegrations />}
                {activeSection === "custom-dashboard-builder" && <CustomDashboardBuilder />}
                {activeSection === "scheduled-export" && <ScheduledExport />}
                {activeSection === "data-warehouse-connector" && <DataWarehouseConnector />}

                {/* -- Personalization & Revenue -- */}
                {activeSection === "dynamic-pricing-engine" && <DynamicPricingEngine />}
                {activeSection === "upsell-cross-sell-engine" && <UpsellCrossSellEngine />}
                {activeSection === "customer-data-platform" && <CustomerDataPlatform />}
                {activeSection === "personalization-recommendation-engine" && <PersonalizationRecommendationEngine />}
                {activeSection === "advanced-personalization-engine" && <AdvancedPersonalizationEngine />}
                {activeSection === "ltv-churn-predictor" && <LTVChurnPredictor />}
                {activeSection === "churn-prediction-playbooks" && <ChurnPredictionPlaybooks />}
                {activeSection === "customer-segmentation-engine" && <CustomerSegmentationEngine />}
                {activeSection === "customer-journey-mapping" && <CustomerJourneyMapping />}
                {activeSection === "data-enrichment-suite" && <DataEnrichmentSuite />}

                {/* -- Finance & Operations -- */}
                {activeSection === "finance-autopilot" && <FinanceAutopilot />}
                {activeSection === "inventory-supplier-sync" && <InventorySupplierSync />}
                {activeSection === "inventory-forecasting" && <InventoryForecasting />}

                {/* -- Platform & Developer -- */}
                {activeSection === "aura-operations-ai" && <AuraOperationsAI />}
                {activeSection === "ai-launch-planner" && <AiLaunchPlanner />}
                {activeSection === "aura-api-sdk" && <AuraAPISDK />}
                {activeSection === "webhook-api-triggers" && <WebhookApiTriggers />}
                {(activeSection === "loyalty-referral-programs" || activeSection === "loyalty-referral-program-v2") && <LoyaltyReferralPrograms />}
              </Suspense>
            </section>
          </div>
        </main>
        </div>{/* end content column */}
        {/* Floating AI Chatbot widget - always visible at root */}
        <div style={{ position: "fixed", bottom: 28, right: 28, zIndex: 9999 }}>
          {!showChatbot && (
            <button
              onClick={() => setShowChatbot(true)}
              style={{
                background: "#ffffff",
                color: "#000000",
                border: "none",
                borderRadius: 10,
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                padding: "11px 20px",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                letterSpacing: "0.01em"
              }}
              aria-label="Open AI Chatbot"
            >
              AI Chat
            </button>
          )}
          {showChatbot && (
            <div style={{ position: "relative", width: 400, maxWidth: "90vw" }}>
              <div style={{ position: "absolute", top: -40, right: 0 }}>
                <button
                  onClick={() => setShowChatbot(false)}
                  style={{
                    background: "#27272a",
                    color: "#a1a1aa",
                    border: "1px solid #27272a",
                    borderRadius: 8,
                    padding: "5px 14px",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer"
                  }}
                  aria-label="Close AI Chatbot"
                >
                  Close
                </button>
              </div>
              <AiChatbot coreUrl={coreUrl} />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
export default App;

