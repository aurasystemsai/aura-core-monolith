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
  // Floating AI Chatbot widget state
  const [showChatbot, setShowChatbot] = useState(false);

function OnboardingModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: 'rgba(10,16,32,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.3s',
    }} role="dialog" aria-modal="true" aria-label="Welcome">
      <div style={{
        background: 'linear-gradient(120deg, #23263a 60%, #7fffd4 100%)',
        borderRadius: 18, boxShadow: '0 8px 40px #0008', padding: '44px 38px 32px', minWidth: 340, maxWidth: 420,
        display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1.5px solid #7fffd4',
        animation: 'popIn 0.18s',
      }}>
        <img src="/logo-aura.png" alt="AURA Logo" style={{height:54,width:54,objectFit:'contain',borderRadius:12,boxShadow:'0 2px 12px #22d3ee55',marginBottom:18}} />
        <h2 style={{color:'#7fffd4',fontWeight:900,marginBottom:10,fontSize:28,letterSpacing:'-0.01em'}}>Welcome</h2>
        <div style={{color:'#fff',fontSize:17,marginBottom:18,textAlign:'center',maxWidth:320}}>
          Get started with world-class automation for e-commerce. Use the sidebar to explore tools, check your dashboard, and optimize your store.
        </div>
        <ul style={{color:'#cbd5f5',fontSize:15,marginBottom:18,lineHeight:1.7,maxWidth:320}}>
          <li>Hover icons and cards for tooltips</li>
          <li>Click “Tools” for all automation engines</li>
          <li>Check “Fix Queue” for issues to resolve</li>
        </ul>
        <button onClick={onClose} style={{
          borderRadius: 8, padding: '10px 32px', fontSize: 17, fontWeight: 700, background:'#7fffd4', color:'#23263a', border:'none', boxShadow:'0 2px 12px #22d3ee55', cursor:'pointer', marginTop:8
        }}>Get Started</button>
      </div>
    </div>
  );
}
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
    // Enhanced logging for debugging
    if (typeof window !== 'undefined' && window.console) {
      console.error('ErrorBoundary caught:', error, errorInfo);
    }
    // Show toast if callback provided
    if (this.props.onError) {
      this.props.onError(error);
    }
    // Send error info to backend analytics
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
// Simple Toast component for user feedback
function Toast({ message, type, onClose }) {
  if (!message) return null;
  let label = '';
  if (type === 'error') label = 'Close error notification';
  else if (type === 'success') label = 'Close success notification';
  else label = 'Close notification';
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9999,
        background: type === 'error' ? '#ff4d4f' : type === 'success' ? '#4caf50' : '#23263a',
        color: '#fff',
        padding: '16px 32px',
        borderRadius: 12,
        boxShadow: '0 4px 24px #0006',
        fontWeight: 700,
        fontSize: 16,
        letterSpacing: '0.01em',
        minWidth: 220,
        textAlign: 'center',
        animation: 'fadeIn 0.5s',
        cursor: 'pointer',
      }}
      onClick={onClose}
      tabIndex={0}
      aria-label={label}
      role="alert"
    >
      {message}
    </div>
  );
}
// TODO: Refactor the main UI shell, navigation, and dashboard to match the new world-class, modern, professional standards set in ProductsList.jsx:
// - Consistent actionable tips, field targets, and device previews
// - Google-style SEO previews and export everywhere
// - Accessibility and keyword checks everywhere
// - Modern, clean, SEMrush/Ahrefs-level layout and visual polish
// - Propagate all advanced features and best practices to every tool and dashboard view
// aura-console/src/App.jsx


const DEFAULT_CORE_API = "https://aura-core-monolith.onrender.com";

// Single place to define engines used by the console
const ENGINES = {
  product: {
    key: "product",
    toolId: "product-seo",
    // ...other fields...
  },
  // ...other engines...
};

// ...existing code up to ENGINES...

// --- FULL FEATURED APP FUNCTION RESTORED ---
function sendAnalyticsEvent(event) {
  try {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...event, ts: Date.now(), url: window.location.href })
    });
  } catch (e) {}
}

function App() {
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
  const [coreUrl, setCoreUrl] = useState(DEFAULT_CORE_API);
  const [coreStatus, setCoreStatus] = useState('checking');
  const [coreStatusLabel, setCoreStatusLabel] = useState('Checking Core API …');
  const [project, setProject] = useState(null);
  const [autoCreating, setAutoCreating] = useState(false);

  // Sidebar section state
  const [activeSection, setActiveSection] = useState('dashboard');

  // Usage analytics: track page/tool views
  useEffect(() => {
    sendAnalyticsEvent({ type: 'page-view', section: activeSection });
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
    // Optionally, poll every 60s for live status
    const interval = setInterval(checkCoreHealth, 60000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [coreUrl]);

  // Auto-create or load project (no manual onboarding)
  useEffect(() => {
    const id = localStorage.getItem("auraProjectId");
    const shopToken = localStorage.getItem("shopToken");
    const shopDomain = localStorage.getItem("auraProjectDomain");
    if (id) {
      setProject({
        id,
        name: localStorage.getItem("auraProjectName") || "Untitled project",
        domain: localStorage.getItem("auraProjectDomain") || "—",
        platform: localStorage.getItem("auraPlatform") || "other",
      });
      return;
    }
    // No project found, auto-create one
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

  // ...existing code...
  // Handler to show error toast from error boundary
  const handleErrorBoundary = (err) => {
    showToast(err?.message || 'A fatal error occurred', 'error');
  };

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
            {/* Removed top-strip for a cleaner, more premium look */}
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
  // --- END FULL FEATURED APP FUNCTION RESTORED ---
}
export default App;
