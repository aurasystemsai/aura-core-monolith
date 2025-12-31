import React, { useState, useEffect, Suspense, lazy } from "react";
import "./App.css";

import ProjectSetup from "./ProjectSetup";
import ProjectSwitcher from "./ProjectSwitcher";
import SystemHealthPanel from "./components/SystemHealthPanel";
import DraftLibrary from "./components/DraftLibrary";
import ContentIngestor from "./components/ContentIngestor";
import ProductsList from "./components/ProductsList.jsx";
import ToolPlaceholder from "./components/ToolPlaceholder.jsx";
import ToolScaffold from "./components/tools/ToolScaffold.jsx";
import AbandonedCheckoutWinback from "./components/tools/AbandonedCheckoutWinback.jsx";
import toolsMeta from "./toolMeta";
import Sidebar from "./components/Sidebar";
import ChangelogModal from "./components/ChangelogModal.jsx";
import DashboardHome from "./components/DashboardHome";
import FixQueue from "./components/FixQueue";
import Auth from "./auth/Auth.jsx";
import Onboarding from "./onboarding/Onboarding.jsx";
import OnboardingModal from "./components/OnboardingModal.jsx";
// import OnboardingChecklist from "./onboarding/OnboardingChecklist.jsx";
import Credits from "./credits/Credits.jsx";
import Dashboard from "./dashboard/Dashboard.jsx";

// Lazy-load only large or rarely-used tool components
const ContentHealthAuditor = lazy(() => import("./components/ContentHealthAuditor"));
const UserManagement = lazy(() => import("./components/UserManagement.jsx"));
const AutomationScheduler = lazy(() => import("./components/AutomationScheduler.jsx"));
const Reports = lazy(() => import("./components/Reports.jsx"));
const Orchestration = lazy(() => import("./orchestration/Orchestration.jsx"));
const ProductSeoEngine = lazy(() => import("./components/ProductSeoEngine"));
const AiAltTextEngine = lazy(() => import("./components/AiAltTextEngine"));
const InternalLinkOptimizer = lazy(() => import("./components/InternalLinkOptimizer"));
import AiChatbot from "./components/AiChatbot.jsx";

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
    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'frontend-error',
          error: error?.toString(),
          stack: error?.stack,
          info: errorInfo,
          url: window.location.href,
          ts: Date.now()
        })
      });
    } catch (e) {}
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
  // Floating AI Chatbot widget state
  const [showChatbot, setShowChatbot] = useState(false);
  // Onboarding modal state
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('auraOnboarded'));
  // Mark onboarding as complete
  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('auraOnboarded', '1');
  };
  // Toast state
  const [toast, setToast] = useState({ message: '', type: 'info' });
  // Helper to show toast
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 3200);
  };
  // Theme switching removed for a single clean look
  // Core state
  const [coreUrl, setCoreUrl] = useState("https://aura-core-monolith.onrender.com");
  const [coreStatus, setCoreStatus] = useState('checking');
  const [coreStatusLabel, setCoreStatusLabel] = useState('Checking Core API …');
  const [project, setProject] = useState(null);
  const [autoCreating, setAutoCreating] = useState(false);
  // Sidebar section state
  const [activeSection, setActiveSection] = useState('dashboard');
  // Checklist show/hide state
  const [showChecklist, setShowChecklist] = useState(false);
  // Product/blog fields
  const [productTitle, setProductTitle] = useState('Waterproof gold huggie earrings');
  const [productDescription, setProductDescription] = useState('Bold paperclip chain bracelet with a sweat-proof, waterproof coating. Adjustable fit for any wrist, perfect for everyday wear.');
  const [brand, setBrand] = useState('DTP Jewellery');
  const [tone, setTone] = useState('Elevated, modern, UK English');
  const [useCases, setUseCases] = useState('gym, everyday wear, gifting');
  // Weekly planner inputs
  const [weeklyBrand, setWeeklyBrand] = useState('DTP Jewellery');
  const [weeklyNiche, setWeeklyNiche] = useState('Waterproof everyday jewellery and gifting');
  const [weeklyAudience, setWeeklyAudience] = useState('UK women 18–34 who want affordable waterproof jewellery');
  const [weeklyCadence, setWeeklyCadence] = useState('2 posts per week');
  const [weeklyThemes, setWeeklyThemes] = useState('product education, styling tips, gifting ideas, lifestyle stories');
  const [weeklyTone, setWeeklyTone] = useState('Elevated, warm, UK English');
  // Output fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoSlug, setSeoSlug] = useState('');
  const [seoKeywords, setSeoKeywords] = useState([]);
  const [rawJson, setRawJson] = useState('');
  const [lastRunAt, setLastRunAt] = useState(null);
  // Weekly plan output
  const [weeklySummary, setWeeklySummary] = useState('');
  const [weeklyPosts, setWeeklyPosts] = useState([]);
  // Blog draft specific output
  const [draftSections, setDraftSections] = useState([]);
  const [draftCta, setDraftCta] = useState('');
  // Changelog modal state and unread badge
  const [showChangelog, setShowChangelog] = useState(false);
  const [changelogSeen, setChangelogSeen] = useState(() => localStorage.getItem("auraChangelogSeen") === "1");
  const handleShowChangelog = () => {
    setShowChangelog(true);
    setChangelogSeen(true);
    localStorage.setItem("auraChangelogSeen", "1");
  };
  // Handler to show error toast from error boundary
  const handleErrorBoundary = (err) => {
    showToast(err?.message || 'A fatal error occurred', 'error');
  };
  // Usage analytics: track page/tool views
  useEffect(() => {
    try {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'page-view', section: activeSection, ts: Date.now(), url: window.location.href })
      });
    } catch (e) {}
  }, [activeSection]);
  // Health check for Core API
  useEffect(() => {
    let cancelled = false;
    async function checkCoreHealth() {
      setCoreStatus('checking');
      setCoreStatusLabel('Checking Core API …');
      try {
        const res = await fetch(`${coreUrl.replace(/\/+$/, '')}/health`);
        if (!res.ok) throw new Error('Core API health check failed');
        const data = await res.json();
        if (data && data.ok) {
          if (!cancelled) {
            setCoreStatus('ok');
            setCoreStatusLabel('Core API online');
          }
        } else {
          if (!cancelled) {
            setCoreStatus('error');
            setCoreStatusLabel('Core API offline — check server or API key');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setCoreStatus('error');
          setCoreStatusLabel('Core API offline — check server or API key');
        }
      }
    }
    checkCoreHealth();
    const interval = setInterval(checkCoreHealth, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [coreUrl]);
  // Auto-create or load project (no manual onboarding)
  useEffect(() => {
    const id = localStorage.getItem("auraProjectId");
    if (id) {
      setProject({
        id,
        name: localStorage.getItem("auraProjectName") || "Untitled project",
        domain: localStorage.getItem("auraProjectDomain") || "—",
        platform: localStorage.getItem("auraPlatform") || "other",
      });
      return;
    }
    setAutoCreating(true);
    fetch(`${coreUrl}/projects`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "My Project",
        domain: window.location.hostname || "localhost",
        platform: "shopify",
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to create project");
        const data = await res.json();
        if (!data.ok || !data.project) throw new Error("Invalid project response");
        const proj = data.project;
        localStorage.setItem("auraProjectId", proj.id);
        localStorage.setItem("auraProjectName", proj.name || "Untitled project");
        localStorage.setItem("auraProjectDomain", proj.domain || "—");
        localStorage.setItem("auraPlatform", proj.platform || "shopify");
        setProject({
          id: proj.id,
          name: proj.name || "Untitled project",
          domain: proj.domain || "—",
          platform: proj.platform || "shopify",
        });
      })
      .catch((err) => {
        setProject(null);
      })
      .finally(() => setAutoCreating(false));
  }, [coreUrl]);

  return (
    <ErrorBoundary onError={handleErrorBoundary}>
      <OnboardingModal open={showOnboarding} onClose={handleCloseOnboarding} />
      <ChangelogModal open={showChangelog} onClose={() => setShowChangelog(false)} />
      <div className="app-shell">
        <Sidebar
          current={activeSection}
          onSelect={setActiveSection}
          onShowChangelog={handleShowChangelog}
          changelogUnread={!changelogSeen}
          extraItems={[
            { key: 'ai-chatbot', label: 'AI Chatbot' },
            { key: 'automation-scheduler', label: 'Automation Scheduler' },
            ...toolsMeta.map(tool => ({ key: tool.id, label: tool.name }))
          ]}
        />
        <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
        <main className="app-main">
          <div className="page-frame fade-in">
            <section className="tool-section">
              {activeSection === "dashboard" && project && <DashboardHome setActiveSection={setActiveSection} />}
              <Suspense fallback={<div style={{padding: 48, textAlign: 'center'}}>Loading…</div>}>
                {activeSection === "automation-scheduler" && <AutomationScheduler />}
                {activeSection === "reports" && <Reports />}
                {activeSection === "auth" && <Auth />}
                {activeSection === "user-management" && <UserManagement coreUrl={coreUrl} />}
                {activeSection === "onboarding" && <Onboarding />}
                {activeSection === "credits" && <Credits />}
                {activeSection === "orchestration" && <Orchestration />}
                {activeSection === "products" && (
                  <ProductsList 
                    shopDomain={project && project.domain ? String(project.domain).replace(/^https?:\/\//, "").replace(/\/$/, "") : undefined}
                    shopToken={localStorage.getItem("shopToken")}
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
                {/* Floating AI Chatbot widget */}
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
                {activeSection === "tools" && project && <ToolsList />}
                {/* Render a ToolScaffold for each tool in toolsMeta (fallback if no custom UI) */}
                {toolsMeta.map(tool => {
                  // List of tool IDs with custom UIs already implemented
                  const customUIs = [
                    "product-seo",
                    "ai-alt-text-engine",
                    "internal-link-optimizer",
                    "content-health-auditor",
                    "abandoned-checkout-winback",
                  ];
                  if (activeSection === tool.id) {
                    if (tool.id === "abandoned-checkout-winback") {
                      return <AbandonedCheckoutWinback key={tool.id} />;
                    }
                    if (customUIs.includes(tool.id)) {
                      // Let the custom UI route above handle it
                      return null;
                    }
                    // Define minimal fields for each tool (can be improved per tool)
                    const defaultFields = [
                      { name: "input", label: "Input", type: "textarea", required: false }
                    ];
                    return <ToolScaffold key={tool.id} toolId={tool.id} toolName={tool.name} fields={defaultFields} />;
                  }
                  return null;
                })}
              </Suspense>
            </section>
          </div>
        </main>
      </div>
    </ErrorBoundary>
  );
}
export default App;
