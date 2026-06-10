import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/brand-intelligence-layer";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "analyse",  label: "Brand Analysis" },
  { id: "insights", label: "AI Insights" },
  { id: "guide",    label: "Brand Framework" },
];

const TREND_ICON = { up: "↑", down: "↓", stable: "→" };
const TREND_COLOR = { up: "#4ade80", down: "#f87171", stable: "#fbbf24" };
const PRIORITY_COLOR = { high: "#f87171", medium: "#fbbf24", low: "#4ade80" };
const PRIORITY_BG = { high: "#3f1315", medium: "#3d2a0a", low: "#052e16" };

export default function BrandIntelligenceLayer() {
  const [tab, setTab]         = useState("analyse");
  const [input, setInput]     = useState("");
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const run = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(""); setDashboard(null); setInsights(null);
    try {
      const [dashRes, insRes] = await Promise.all([
        apiFetchJSON(`${API}/dashboard`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) }),
        apiFetchJSON(`${API}/insights`,  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ input }) }),
      ]);
      if (!dashRes.ok) throw new Error(dashRes.error || "Dashboard failed");
      if (!insRes.ok)  throw new Error(insRes.error  || "Insights failed");
      setDashboard(dashRes.dashboard || []);
      setInsights(insRes.insights || []);
      setTab("analyse");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const SAMPLE_BRANDS = [
    "A premium sustainable activewear brand targeting eco-conscious women aged 25-40. Price point: $80-150. Currently selling on Shopify. Brand values: sustainability, empowerment, performance.",
    "An artisan coffee subscription brand delivering specialty coffee to offices and homes. AOV: $45/month. Strong Instagram presence. Competitors: Pact Coffee, Grind, Origin.",
    "A UK-based pet accessories brand. Products: collars, leads, bandanas. Dog niche. Growing TikTok channel with 15k followers. No paid advertising yet.",
  ];

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Brand Intelligence Layer</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered brand health analysis — dashboard metrics, strategic insights, positioning gaps and actionable recommendations for e-commerce brands.</p>
      </div>

      <div style={S.card}>
        <div style={S.sectionTitle}>Describe Your Brand</div>
        <textarea style={{ ...S.ta, minHeight: 100 }} value={input} onChange={e => setInput(e.target.value)} placeholder="Describe your brand: products, target audience, price point, current channels, brand values, competitors…" />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <button style={S.btn("primary")} onClick={run} disabled={loading || !input.trim()}>{loading ? "Analysing…" : "Run Brand Analysis"}</button>
          <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setInput("")}>Clear</button>
        </div>
        {!input && !dashboard && !loading && (
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "#52525b", marginBottom: 6 }}>SAMPLE BRANDS — CLICK TO LOAD</div>
            {SAMPLE_BRANDS.map((b, i) => (
              <div key={i} style={{ ...S.row, cursor: "pointer" }} onClick={() => setInput(b)}>
                <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{b.slice(0, 100)}…</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ErrorBox message={error} />
      {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

      {(dashboard || insights) && !loading && (
        <>
          <MozTabs tabs={TABS} active={tab} onChange={setTab} />

          {/* DASHBOARD */}
          {tab === "analyse" && dashboard && (
            <div style={{ marginTop: 20 }}>
              {Array.isArray(dashboard) && dashboard.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 12 }}>
                  {dashboard.map((item, i) => (
                    <div key={i} style={{ ...S.card, marginBottom: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div style={{ fontSize: 11, color: "#71717a", textTransform: "uppercase", letterSpacing: 1 }}>{item.metric}</div>
                        {item.trend && <span style={{ fontSize: 16, color: TREND_COLOR[item.trend] || "#a1a1aa" }}>{TREND_ICON[item.trend] || ""}</span>}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#fafafa", margin: "6px 0" }}>{item.value}</div>
                      <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{item.insight}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={S.card}>
                  <pre style={{ fontSize: 13, color: "#e4e4e7", whiteSpace: "pre-wrap" }}>{JSON.stringify(dashboard, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          {/* INSIGHTS */}
          {tab === "insights" && insights && (
            <div style={{ marginTop: 20 }}>
              {Array.isArray(insights) && insights.length > 0 ? (
                insights.map((ins, i) => (
                  <div key={i} style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <span style={{ background: ins.priority ? PRIORITY_BG[ins.priority] : "#27272a", color: ins.priority ? PRIORITY_COLOR[ins.priority] : "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginBottom: 6, display: "inline-block" }}>{ins.priority || "insight"}</span>
                        {ins.category && <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "uppercase", marginLeft: 4, display: "inline-block" }}>{ins.category}</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 6 }}>{ins.title || ins}</div>
                    {ins.description && <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>{ins.description}</div>}
                  </div>
                ))
              ) : (
                <div style={S.card}>
                  <pre style={{ fontSize: 13, color: "#e4e4e7", whiteSpace: "pre-wrap" }}>{JSON.stringify(insights, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          {/* FRAMEWORK */}
          {tab === "guide" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Brand Health Dimensions</div>
                {[
                  { dim: "Brand Awareness",      desc: "% of target audience who recognise your brand name and associate it with your category" },
                  { dim: "Brand Consideration",  desc: "% who would consider buying from you when they need your product category" },
                  { dim: "Net Promoter Score",   desc: "Likelihood of customers recommending you. Ecommerce benchmark: > 50 = excellent" },
                  { dim: "Brand Voice Clarity",  desc: "Consistency of tone, language, and values across all touchpoints (website, social, email, packaging)" },
                  { dim: "Visual Identity",      desc: "Logo, colour, typography recognition and consistency across channels" },
                  { dim: "Positioning Strength", desc: "How clearly differentiated you are from competitors in your target audience's mind" },
                ].map(({ dim, desc }) => (
                  <div key={dim} style={S.row}>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{dim}</div><div style={{ fontSize: 12, color: "#71717a" }}>{desc}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

 const [input, setInput] = useState("");
 const [bulkUpload, setBulkUpload] = useState(null);
 const [response, setResponse] = useState("");
 const [analytics, setAnalytics] = useState(null);
 const [history, setHistory] = useState([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 // Dark mode enforced, no toggle
 const [collaborators, setCollaborators] = useState("");
 const [notification, setNotification] = useState("");
 const [feedback, setFeedback] = useState("");
 const [showOnboarding, setShowOnboarding] = useState(false);
 const fileInputRef = useRef();

 // Additional state for dashboard, insights, imported/exported files
 const [dashboard, setDashboard] = useState([]);
 const [insights, setInsights] = useState([]);
 const [imported, setImported] = useState(null);
 const [exported, setExported] = useState(null);

 // Fetch dashboard
 const fetchDashboard = async () => {
 try {
 const res = await apiFetchJSON("/api/brand-intelligence-layer/dashboard", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ input })
 });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setDashboard(data.dashboard || []);
 } catch (err) {
 setError(err.message);
 }
 };

 // Fetch insights
 const fetchInsights = async () => {
 try {
 const res = await apiFetchJSON("/api/brand-intelligence-layer/insights", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ input })
 });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setInsights(data.insights || []);
 } catch (err) {
 setError(err.message);
 }
 };

 // Import
 const handleImport = e => {
 const file = e.target.files[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = evt => {
 setInput(evt.target.result);
 setImported(file.name);
 };
 reader.readAsText(file);
 };

 // Export
 const handleExport = () => {
 const blob = new Blob([JSON.stringify({ dashboard, insights }, null, 2)], { type: "application/json"});
 const url = URL.createObjectURL(blob);
 setExported(url);
 setTimeout(() =>URL.revokeObjectURL(url), 10000);
 };

 const handleRun = async () => {
 setLoading(true);
 setError("");
 setResponse("");
 setAnalytics(null);
 setNotification("");
 // Example: fetch dashboard and insights, then set notification
 await fetchDashboard();
 await fetchInsights();
 setNotification("Analysis complete.");
 setLoading(false);
 };

 const handleFeedback = async () => {
 if (!feedback) return;
 setNotification("Sending feedback...");
 try {
 await fetch("/api/brand-intelligence-layer/feedback", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ feedback })
 });
 setNotification("Feedback sent. Thank you!");
 setFeedback("");
 } catch {
 setNotification("Failed to send feedback");
 }
 };

 const onboardingContent = (
 <div style={{ padding: 24, background: "#09090b", borderRadius: 12, marginBottom: 18 }}>
 <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Brand Intelligence Layer</h3>
 <ul style={{ margin: "16px 0 0 18px", color: "#a3e635", fontSize: 16 }}>
 <li>Enter a brand question or upload a CSV/Excel file for bulk analysis</li>
 <li>Get AI-powered brand analytics, sentiment, and benchmarking</li>
 <li>Export results and review insights history</li>
 <li>Collaborate and share with your team</li>
 <li>Integrate with social, Shopify, and analytics APIs</li>
 <li>Accessible, secure, and fully compliant</li>
 </ul>
 <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#09090b", color: "#f4f4f5", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer"}}>Get Started</button>
 </div>
 );

 return (
 <div className="tool-main-flex"style={{
 color: "#a3e635",
 fontFamily: 'Inter, sans-serif',
 transition: "background 0.3s, color 0.3s"}}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
 <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Brand Intelligence Layer</h2>
 </div>
 <div style={{ marginBottom: 10, color: "#a3e635", fontWeight: 600 }}>
 <span role="img"aria-label="brand">?</span>AI-powered brand analytics, bulk upload, insights, and collaboration.
 </div>
 <button onClick={() => setShowOnboarding(true)} style={{ background: "#4f46e5", color: "#f4f4f5", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide": "Show"} Onboarding</button>
 {showOnboarding && onboardingContent}
 <textarea
 value={input}
 onChange={e => setInput(e.target.value)}
 rows={4}
 style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #555", marginBottom: 18, background: "#09090b", color: "#a3e635"}}
 placeholder="Type your brand question or data here..."aria-label="Brand input"/>
 <div style={{ marginBottom: 18 }}>
 <label style={{ fontWeight: 600, marginRight: 12 }}>Bulk Upload:</label>
 <input ref={fileInputRef} type="file"accept=".csv,.xlsx"onChange={e => setBulkUpload(e.target.files[0])} style={{ marginLeft: 8 }} aria-label="Bulk upload"/>
 <label style={{ fontWeight: 600, marginLeft: 18 }}>Collaborators:</label>
 <input type="text"value={collaborators} onChange={e => setCollaborators(e.target.value)} placeholder="Emails, comma separated"style={{ fontSize: 15, padding: 8, borderRadius: 8, border: "1px solid #555"}} />
 </div>
 <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
 <button onClick={handleRun} disabled={loading || (!input && !bulkUpload)} style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: loading ? "not-allowed": "pointer", boxShadow: "0 2px 12px #22d3ee55"}}>{loading ? "Running...": "Run Tool"}</button>
 <button onClick={handleExport} disabled={!response} style={{ background: "#e0e7ff", color: "#09090b", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: response ? "pointer": "not-allowed"}}>Export</button>
 </div>
 {notification && <div style={{ color: "#0af", marginTop: 12, fontWeight: 600 }}>{notification}</div>}
 {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
 {analytics && (
 <div style={{ marginTop: 24, background: "#52525b", borderRadius: 12, padding: 18 }}>
 <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Analytics</div>
 <div style={{ fontSize: 16 }}>{JSON.stringify(analytics)}</div>
 </div>
 )}
 {response && (
 <div style={{ marginTop: 32, background: "#09090b", borderRadius: 12, padding: 24 }}>
 <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>AI Response:</div>
 <div style={{ fontSize: 16, color: "#a3e635"}}>{response}</div>
 </div>
 )}
 {history.length > 0 && (
 <div style={{ marginTop: 32, background: "#09090b", borderRadius: 12, padding: 20 }}>
 <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Insights History</div>
 <ul style={{ paddingLeft: 18 }}>
 {history.map((h, i) => (
 <li key={i} style={{ marginBottom: 10 }}>
 <div><b>Prompt:</b> {h.prompt?.slice(0, 60)}{h.prompt?.length > 60 ? "...": ""}</div>
 <div><b>Bulk Upload:</b> {h.bulkUpload || "-"}</div>
 <div><b>Reply:</b> {h.reply?.slice(0, 60)}{h.reply?.length > 60 ? "...": ""}</div>
 <div><b>Analytics:</b> {h.analytics ? JSON.stringify(h.analytics) : "-"}</div>
 </li>
 ))}
 </ul>
 </div>
 )}
 <form
 onSubmit={e => { e.preventDefault(); handleFeedback(); }}
 style={{ marginTop: 32, background: "#09090b", color: "#f4f4f5", borderRadius: 12, padding: 20 }}
 aria-label="Send feedback">
 <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
 <textarea
 value={feedback}
 onChange={e => setFeedback(e.target.value)}
 rows={2}
 style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #555", marginBottom: 12, background: "#09090b", color: "#a3e635"}}
 placeholder="Share your feedback or suggestions..."aria-label="Feedback input"/>
 <button
 type="submit"style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer"}}
 >
 Send Feedback
 </button>
 </form>
 <div style={{ marginTop: 32, fontSize: 13, color: "#a3e635", textAlign: "center"}}>
 <span>Integrations: <b>Social</b>, <b>Shopify</b>, <b>Analytics APIs</b> | Accessible, secure, and best-in-class SaaS features.</span>
 </div>
 </div>
 );
}


