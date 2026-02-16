import React, { useState, useEffect, Suspense, lazy } from "react";
import { apiFetch } from "./api";
import "./App.css";

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
const MainSuite = lazy(() => import("./components/tools/MainSuite.jsx"));
const SeoMasterSuite = lazy(() => import("./components/tools/SeoMasterSuite.jsx"));
const FixQueue = lazy(() => import("./components/FixQueue"));
const Auth = lazy(() => import("./auth/Auth.jsx"));
const Onboarding = lazy(() => import("./onboarding/Onboarding.jsx"));
const Credits = lazy(() => import("./credits/Credits.jsx"));
const Settings = lazy(() => import("./components/Settings.jsx"));
const Billing = lazy(() => import("./components/Billing.jsx"));
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
  const [activeSection, setActiveSection] = useState('dashboard');
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
        {/* Top tab navigation */}
        <nav className="top-tabs-nav">
          <div className="tab-group tab-group-main">
            <button
              className={activeSection === 'dashboard' ? 'tab-active' : ''}
              onClick={() => setActiveSection('dashboard')}
            >Dashboard</button>
            <button
              className={activeSection === 'main-suite' ? 'tab-active' : ''}
              onClick={() => setActiveSection('main-suite')}
            >Main Suite</button>
            <button
              className={activeSection === 'pricing' ? 'tab-active' : ''}
              onClick={() => setActiveSection('pricing')}
            >Pricing</button>
            <button
              className={activeSection === 'automation-scheduler' ? 'tab-active' : ''}
              onClick={() => setActiveSection('automation-scheduler')}
            >Automation</button>
            <button
              className={activeSection === 'user-management' ? 'tab-active' : ''}
              onClick={() => setActiveSection('user-management')}
            >User Management</button>
            <button
              className={activeSection === 'ai-chatbot' ? 'tab-active' : ''}
              onClick={() => setActiveSection('ai-chatbot')}
            >AI Chatbot</button>
            <button
              className={activeSection === 'settings' ? 'tab-active' : ''}
              onClick={() => setActiveSection('settings')}
            >Settings</button>
            <button
              className={activeSection === 'billing' ? 'tab-active' : ''}
              onClick={() => setActiveSection('billing')}
            >Billing</button>
          </div>
          <div
            className="mega-menu"
            onMouseLeave={() => setShowToolsMenu(false)}
          >
            <button
              className="tools-dropdown-btn"
              onClick={() => setShowToolsMenu((v) => !v)}
              aria-expanded={showToolsMenu}
            >
              Browse Tools ▾
            </button>
            {showToolsMenu && (
              <div className="tools-mega-menu-list">
                <div className="tools-mega-menu-columns">
                  {(() => {
                    // Group tools by category
                    const grouped = toolsMeta.reduce((acc, tool) => {
                      const cat = tool.category || 'Other';
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(tool);
                      return acc;
                    }, {});
                    return Object.entries(grouped).map(([cat, tools]) => (
                      <div className="tools-mega-menu-col" key={cat}>
                        <div className="tools-mega-menu-col-label">{cat}</div>
                        {tools.map(tool => (
                          <button
                            key={tool.id}
                            className={activeSection === tool.id ? 'tab-active' : ''}
                            onClick={() => {
                              const targetGroup = toolToMainSuiteGroup[tool.id];
                              setShowToolsMenu(false);
                              if (targetGroup || tool.id === 'main-suite') {
                                navigateToMainSuite(targetGroup);
                              } else {
                                setActiveSection(tool.id);
                              }
                            }}
                            title={tool.description}
                          >
                            {tool.name}
                          </button>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}
          </div>
        </nav>
        <main className="app-main">
          <div className="page-frame fade-in">
            <section className="tool-section">
              {/* DEBUG: dashboard render path */}
              <Suspense fallback={<div style={{padding: 48, textAlign: 'center'}}>Loading…</div>}>
                {activeSection === "dashboard" && !project && <div style={{color:'#ff0',background:'#232336',padding:16}}>DEBUG: No project found, dashboard not rendered</div>}
                {activeSection === "dashboard" && project && <Dashboard setActiveSection={setActiveSection} />}
                {activeSection === "main-suite" && <MainSuite setActiveSection={setActiveSection} />}
                {activeSection === "seo-master-suite" && <SeoMasterSuite />}
              </Suspense>
              <Suspense fallback={<div style={{padding: 48, textAlign: 'center'}}>Loading…</div>}>
                {activeSection === "pricing" && <PricingPage />}
                {activeSection === "automation-scheduler" && <AutomationScheduler />}
                {activeSection === "reports" && <Reports />}
                {activeSection === "settings" && <Settings />}
                {activeSection === "billing" && <Billing />}
                {activeSection === "auth" && <Auth />}
                {activeSection === "user-management" && <UserManagement coreUrl={coreUrl} />}
                {activeSection === "onboarding" && <Onboarding />}
                {activeSection === "credits" && <Credits />}
                {(activeSection === "workflow-orchestrator" || activeSection === "orchestration") && <WorkflowOrchestrator />}
                {activeSection === "products" && (
                  <ProductsList 
                    shopDomain={project && project.domain ? String(project.domain).replace(/^https?:\/\//, "").replace(/\/$/, "") : undefined}
                    shopToken={undefined /* rely on backend persisted token; avoid stale local token */}
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
                {activeSection === "ai-chatbot" && (
                  <AiChatbot coreUrl={coreUrl} />
                )}
                {activeSection === "tools" && project && <ToolsList />}
                {/* Render a ToolScaffold for each tool in toolsMeta (fallback if no custom UI) */}
                {/* Render ProductSeoEngine with its own Suspense and ErrorBoundary */}
                {activeSection === "product-seo" && (
                  <ErrorBoundary>
                    <Suspense fallback={<div style={{padding: 48, textAlign: 'center'}}>Loading Product SEO Engine…</div>}>
                      <ProductSeoEngine />
                    </Suspense>
                  </ErrorBoundary>
                )}
                {/* Other custom UIs and fallback ToolScaffold */}
                {toolsMeta.map(tool => {
                  if (activeSection === tool.id) {
                    if (tool.id === "main-suite") return null; // main suite handled by top-level render
                    if (tool.id === "seo-master-suite") return null; // seo master suite handled by top-level render
                    switch (tool.id) {
                      case "abandoned-checkout-winback": return <AbandonedCheckoutWinback key={tool.id} />;
                      case "customer-data-platform": return <CustomerDataPlatform key={tool.id} />;
                      case "visual-workflow-builder": return <VisualWorkflowBuilder key={tool.id} />;
                      case "self-service-portal": return <SelfServicePortal key={tool.id} />;
                      case "advanced-personalization-engine": return <AdvancedPersonalizationEngine key={tool.id} />;
                      case "ab-testing-suite": return <ABTestingSuite key={tool.id} />;
                      case "data-warehouse-connector": return <DataWarehouseConnector key={tool.id} />;
                      case "consent-privacy-management": return <ConsentPrivacyManagement key={tool.id} />;
                      case "entity-topic-explorer": return <EntityTopicExplorer key={tool.id} />;
                      case "internal-linking-suggestions": return <InternalLinkingSuggestions key={tool.id} />;
                      case "ai-content-brief-generator": return <AIContentBriefGenerator key={tool.id} />;
                      case "brand-mention-tracker": return <BrandMentionTracker key={tool.id} />;
                      case "local-seo-toolkit": return <LocalSEOToolkit key={tool.id} />;
                      case "automation-templates": return <AutomationTemplates key={tool.id} />;
                      case "conditional-logic-automation": return <ConditionalLogicAutomation key={tool.id} />;
                      case "webhook-api-triggers": return <WebhookApiTriggers key={tool.id} />;
                      case "workflow-automation-builder": return <WorkflowAutomationBuilder key={tool.id} />;
                      case "reporting-integrations": return <ReportingIntegrations key={tool.id} />;
                      case "custom-dashboard-builder": return <CustomDashboardBuilder key={tool.id} />;
                      case "scheduled-export": return <ScheduledExport key={tool.id} />;
                      case "churn-prediction-playbooks": return <ChurnPredictionPlaybooks key={tool.id} />;
                      case "upsell-cross-sell-engine": return <UpsellCrossSellEngine key={tool.id} />;
                      case "inventory-forecasting": return <InventoryForecasting key={tool.id} />;
                      case "blog-draft-engine": return <BlogDraftEngine key={tool.id} />;
                      case "blog-seo": return <BlogSEO key={tool.id} />;
                      case "weekly-blog-content-engine": return <WeeklyBlogContentEngine key={tool.id} />;
                      case "on-page-seo-engine": return <OnPageSEOEngine key={tool.id} />;
                      case "technical-seo-auditor": return <TechnicalSEOAuditor key={tool.id} />;
                      case "serp-tracker": return <SERPTracker key={tool.id} />;
                      case "seo-site-crawler": return <SEOSiteCrawler key={tool.id} />;
                      case "social-scheduler-content-engine": return <SocialSchedulerContentEngine key={tool.id} />;
                      case "social-media-analytics-listening": return <SocialMediaAnalyticsListening key={tool.id} />;
                      case "site-audit-health": return <SiteAuditHealth key={tool.id} />;
                      case "schema-rich-results-engine": return <SchemaRichResultsEngine key={tool.id} />;
                      case "review-ugc-engine": return <ReviewUGCEngine key={tool.id} />;
                      case "returns-rma-automation": return <ReturnsRMAAutomation key={tool.id} />;
                      case "rank-visibility-tracker": return <RankVisibilityTracker key={tool.id} />;
                      case "product-seo": return <ProductSeoEngine key={tool.id} />;
                      case "multi-channel-optimizer": return <MultiChannelOptimizer key={tool.id} />;
                      case "ltv-churn-predictor": return <LTVChurnPredictor key={tool.id} />;
                      case "klaviyo-flow-automation": return <KlaviyoFlowAutomation key={tool.id} />;
                      case "inventory-supplier-sync": return <InventorySupplierSync key={tool.id} />;
                      case "inbox-reply-assistant": return <InboxReplyAssistant key={tool.id} />;
                      case "inbox-assistant": return <InboxAssistant key={tool.id} />;
                      case "image-alt-media-seo": return <ImageAltMediaSEO key={tool.id} />;
                      case "finance-autopilot": return <FinanceAutopilot key={tool.id} />;
                      case "email-automation-builder": return <EmailAutomationBuilder key={tool.id} />;
                      case "dynamic-pricing-engine": return <DynamicPricingEngine key={tool.id} />;
                      case "customer-support-ai": return <CustomerSupportAI key={tool.id} />;
                      case "creative-automation-engine": return <CreativeAutomationEngine key={tool.id} />;
                      case "brand-intelligence-layer": return <BrandIntelligenceLayer key={tool.id} />;
                      case "auto-insights": return <AutoInsights key={tool.id} />;
                      case "aura-operations-ai": return <AuraOperationsAI key={tool.id} />;
                      case "aura-api-sdk": return <AuraAPISDK key={tool.id} />;
                      case "ai-support-assistant": return <AiSupportAssistant key={tool.id} />;
                      case "ai-launch-planner": return <AiLaunchPlanner key={tool.id} />;
                      case "advanced-analytics-attribution": return <AdvancedAnalyticsAttribution key={tool.id} />;
                      case "ai-alt-text-engine": return <ImageAltMediaSEO key={tool.id} />;
                      case "workflow-orchestrator":
                        return null; // custom UI rendered earlier; skip scaffold duplicate
                      case "google-ads-integration":
                        return (
                          <ToolScaffold
                            key={tool.id}
                            toolId={tool.id}
                            toolName={tool.name}
                            fields={[
                              { name: "customerId", label: "Google Ads Customer ID", type: "text", required: true },
                              { name: "developerToken", label: "Developer Token", type: "password", required: true },
                              { name: "refreshToken", label: "OAuth Refresh Token", type: "password", required: true },
                              { name: "notes", label: "Notes", type: "textarea" },
                            ]}
                          />
                        );
                      case "facebook-ads-integration":
                        return (
                          <ToolScaffold
                            key={tool.id}
                            toolId={tool.id}
                            toolName={tool.name}
                            fields={[
                              { name: "adAccountId", label: "Ad Account ID", type: "text", required: true },
                              { name: "accessToken", label: "Access Token", type: "password", required: true },
                              { name: "appId", label: "App ID", type: "text" },
                              { name: "appSecret", label: "App Secret", type: "password" },
                            ]}
                          />
                        );
                      case "tiktok-ads-integration":
                        return (
                          <ToolScaffold
                            key={tool.id}
                            toolId={tool.id}
                            toolName={tool.name}
                            fields={[
                              { name: "advertiserId", label: "Advertiser ID", type: "text", required: true },
                              { name: "accessToken", label: "Access Token", type: "password", required: true },
                              { name: "notes", label: "Notes", type: "textarea" },
                            ]}
                          />
                        );
                      case "ads-anomaly-guard":
                        return (
                          <ToolScaffold
                            key={tool.id}
                            toolId={tool.id}
                            toolName={tool.name}
                            fields={[
                              { name: "channels", label: "Channels (Google, Meta, TikTok)", type: "text", required: true },
                              { name: "alertEmails", label: "Alert Emails", type: "text" },
                              { name: "alertThreshold", label: "Alert Threshold (%)", type: "number", required: true },
                            ]}
                          />
                        );
                      case "ad-creative-optimizer":
                        return (
                          <ToolScaffold
                            key={tool.id}
                            toolId={tool.id}
                            toolName={tool.name}
                            fields={[
                              { name: "productOrOffer", label: "Product/Offer", type: "text", required: true },
                              { name: "targetAudience", label: "Target Audience", type: "textarea" },
                              { name: "tone", label: "Tone/Voice", type: "text" },
                              { name: "channels", label: "Channels (Google, Meta, TikTok)", type: "text" },
                            ]}
                          />
                        );
                      case "omnichannel-campaign-builder":
                        return (
                          <ToolScaffold
                            key={tool.id}
                            toolId={tool.id}
                            toolName={tool.name}
                            fields={[
                              { name: "campaignName", label: "Campaign Name", type: "text", required: true },
                              { name: "channels", label: "Channels (Email, SMS, Ads)", type: "text", required: true },
                              { name: "goal", label: "Goal (Launch, Winback, Retarget)", type: "text" },
                              { name: "budget", label: "Budget", type: "text" },
                            ]}
                          />
                        );
                      case "ai-segmentation-engine":
                        return (
                          <ToolScaffold
                            key={tool.id}
                            toolId={tool.id}
                            toolName={tool.name}
                            fields={[
                              { name: "seedSignals", label: "Seed Signals (events, traits)", type: "textarea" },
                              { name: "minAudienceSize", label: "Min Audience Size", type: "number" },
                            ]}
                          />
                        );
                      case "predictive-analytics-widgets":
                        return (
                          <PredictiveAnalyticsWidgets key={tool.id} />
                        );
                      case "ai-content-image-gen":
                        return (
                          <ToolScaffold
                            key={tool.id}
                            toolId={tool.id}
                            toolName={tool.name}
                            fields={[
                              { name: "purpose", label: "Purpose (Ad, Email, Landing)", type: "text", required: true },
                              { name: "productDetails", label: "Product/Offer Details", type: "textarea" },
                              { name: "tone", label: "Tone/Voice", type: "text" },
                              { name: "imageStyle", label: "Image Style", type: "text" },
                            ]}
                          />
                        );
                      case "self-service-analytics":
                          return <SelfServiceAnalytics key={tool.id} />;
                      case "compliance-privacy-suite":
                        return (
                          <ToolScaffold
                            key={tool.id}
                            toolId={tool.id}
                            toolName={tool.name}
                            fields={[
                              { name: "regions", label: "Regions (GDPR/CCPA)", type: "text", required: true },
                              { name: "dpoEmail", label: "DPO / Compliance Email", type: "text" },
                              { name: "dataExport", label: "Data Export Requested", type: "checkbox" },
                              { name: "notes", label: "Notes", type: "textarea" },
                            ]}
                          />
                        );
                      default:
                        // Fallback to generic scaffold for any tool not custom-mapped
                        const defaultFields = [
                          { name: "input", label: "Input", type: "textarea", required: false }
                        ];
                        return <ToolScaffold key={tool.id} toolId={tool.id} toolName={tool.name} fields={defaultFields} />;
                    }
                  }
                  return null;
                })}
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
