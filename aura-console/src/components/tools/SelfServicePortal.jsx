import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/self-service-portal";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "ai",       label: "AI Assistant" },
  { id: "requests", label: "Support Requests" },
  { id: "guide",    label: "Portal Guide" },
];

const QUICK_QUERIES = [
  "What are the most common customer self-service needs for a Shopify store?",
  "How do I set up an automated returns self-service portal for my customers?",
  "What FAQ content reduces customer service tickets the most?",
  "How should I structure order tracking self-service to reduce 'where is my order' tickets?",
];

export default function SelfServicePortal() {
  const [tab, setTab]       = useState("ai");
  const [requests, setRequests] = useState([]);
  const [query, setQuery]   = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const [newReq, setNewReq] = useState({ title: "", description: "", type: "Order Inquiry" });
  const setF = (k, v) => setNewReq(p => ({ ...p, [k]: v }));

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      const r = await apiFetchJSON(`${API}/requests`);
      if (r.ok) setRequests(r.requests || []);
    } catch {}
  };

  const runQuery = async (override) => {
    const q = (override || query).trim();
    if (!q) return;
    setLoading(true); setError(""); setAnswer(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!r.ok) throw new Error(r.error || "Query failed");
      setAnswer(r.answer || "");
      if (!override) setQuery("");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const createRequest = async () => {
    if (!newReq.title.trim()) { setError("Title required"); return; }
    setLoading(true); setError("");
    try {
      const r = await apiFetchJSON(`${API}/requests`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newReq, status: "open", createdAt: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error(r.error || "Create failed");
      setNewReq({ title: "", description: "", type: "Order Inquiry" });
      loadRequests();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const deleteRequest = async (id) => {
    try {
      await apiFetchJSON(`${API}/requests/${id}`, { method: "DELETE" });
      setRequests(p => p.filter(r => r.id !== id));
    } catch {}
  };

  const REQUEST_TYPES = ["Order Inquiry", "Return Request", "Billing Question", "Technical Issue", "Product Question", "Other"];
  const STATUS_COLOR = { open: "#1e1b4b", "in-progress": "#3d2a0a", resolved: "#052e16" };
  const STATUS_TEXT  = { open: "#818cf8", "in-progress": "#fbbf24", resolved: "#4ade80" };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Self-Service Portal</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered customer self-service toolkit — manage support requests, design self-service flows, and get expert advice on reducing customer service workload.</p>
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "ai" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {QUICK_QUERIES.map((q, i) => (
              <button key={i} style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => runQuery(q)}>{q.slice(0, 40)}…</button>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Ask the Portal AI</div>
            <textarea style={{ ...S.ta, minHeight: 80 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask about self-service strategy, FAQ design, return flows, order tracking pages…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={() => runQuery()} disabled={loading || !query.trim()}>{loading ? "Thinking…" : "Ask AI"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setQuery(""); setAnswer(null); }}>Clear</button>
            </div>
          </div>
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {answer && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>AI Response</div>
                <button onClick={() => navigator.clipboard?.writeText(answer)} style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }}>Copy</button>
              </div>
              <pre style={S.pre}>{answer}</pre>
            </div>
          )}
        </div>
      )}

      {tab === "requests" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Create Support Request</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <input style={{ ...S.input, flex: 2, minWidth: 200 }} value={newReq.title} onChange={e => setF("title", e.target.value)} placeholder="Request title…" />
              <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 12, padding: "10px 14px", outline: "none" }} value={newReq.type} onChange={e => setF("type", e.target.value)}>
                {REQUEST_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <textarea style={{ ...S.ta, minHeight: 60, marginBottom: 10 }} value={newReq.description} onChange={e => setF("description", e.target.value)} placeholder="Description (optional)…" />
            <button style={S.btn("primary")} onClick={createRequest} disabled={loading}>Create Request</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{requests.length} requests</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadRequests}>Refresh</button>
          </div>
          {requests.length === 0 ? (
            <EmptyState icon="📋" title="No support requests" description="Create a request above to get started." />
          ) : (
            requests.map((req, i) => (
              <div key={req.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                      {req.type && <span style={{ background: "#27272a", color: "#a1a1aa", padding: "1px 7px", borderRadius: 4, fontSize: 11 }}>{req.type}</span>}
                      {req.status && <span style={{ background: STATUS_COLOR[req.status] || "#27272a", color: STATUS_TEXT[req.status] || "#a1a1aa", padding: "1px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{req.status}</span>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{req.title}</div>
                    {req.description && <div style={{ fontSize: 12, color: "#71717a", marginTop: 3 }}>{req.description}</div>}
                    {req.createdAt && <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{new Date(req.createdAt).toLocaleDateString()}</div>}
                  </div>
                  <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteRequest(req.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Self-Service Portal Best Practices</div>
            {[
              { t: "Order tracking page reduces CS volume by 35%", d: "The most common CS ticket is 'where is my order'. A branded order tracking page with real-time updates reduces this category by 25-35%." },
              { t: "Returns self-service must be frictionless",     d: "Customers abandon returns if the process has more than 3 steps. Offer: 1) Enter order number, 2) Select items, 3) Print label. That's it." },
              { t: "FAQ that actually answers questions",           d: "Most FAQ pages answer the questions brands want to answer, not the questions customers ask. Mine your CS tickets for the top 20 questions." },
              { t: "Account dashboard drives repeat purchase",      d: "Customers with accounts and access to order history, points, and wishlists have 2.3× higher LTV than guest purchasers." },
              { t: "Chatbot + human handoff",                       d: "AI chatbots resolve 60-70% of enquiries without human involvement. The key is fast, graceful handoff to human agents for the other 30%." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>💡</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

 const [showOnboarding, setShowOnboarding] = React.useState(true);
 const [integrations, setIntegrations] = React.useState([]);
 const [billing, setBilling] = React.useState([]);
 const [supportTickets, setSupportTickets] = React.useState([]);
 const [imported, setImported] = React.useState(null);
 const [exported, setExported] = React.useState(null);
 const [analytics, setAnalytics] = React.useState([]);
 const [feedback, setFeedback] = React.useState("");
 const [error, setError] = React.useState("");
 const fileInputRef = React.useRef();

 // Onboarding content
 const onboardingContent = (
 <div style={{ padding: 24, background: '#3f3f46', borderRadius: 12, marginBottom: 18, color: '#fafafa'}}>
 <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Self-Service Portal</h3>
 <ul style={{ margin: '16px 0 0 18px', color: '#52525b', fontSize: 16 }}>
 <li>Manage integrations, billing, and support in one place</li>
 <li>Import/export account data, analyze usage</li>
 <li>Accessible, secure, and fully compliant</li>
 </ul>
 <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: '#09090b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer'}}>Get Started</button>
 </div>
 );

 // Import/export
 const handleImport = e => {
 const file = e.target.files[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = evt => {
 setIntegrations(JSON.parse(evt.target.result));
 setImported(file.name);
 };
 reader.readAsText(file);
 };
 const handleExport = () => {
 const blob = new Blob([JSON.stringify(integrations, null, 2)], { type: 'application/json'});
 const url = URL.createObjectURL(blob);
 setExported(url);
 setTimeout(() =>URL.revokeObjectURL(url), 10000);
 };

 // Feedback
 const handleFeedback = async () => {
 if (!feedback) return;
 setError("");
 try {
 await fetch("/api/self-service-portal/feedback", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ feedback })
 });
 setFeedback("");
 } catch (err) {
 setError("Failed to send feedback");
 }
 };

 // Main UI
 return (
 <div style={{ padding: 24 }}>
 <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Self-Service Portal</h2>
 <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide": "Show"} Onboarding</button>
 {showOnboarding && onboardingContent}
 {/* Integrations Table */}
 <div style={{ marginBottom: 32 }}>
 <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Integrations</div>
 <div style={{ fontSize: 15, color: '#09090b'}}>
 {integrations.length ? (
 <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(integrations, null, 2)}</pre>
 ) : (
 <span>No integrations yet. Add or import to see results.</span>
 )}
 </div>
 </div>
 {/* Billing Table */}
 <div style={{ marginBottom: 32 }}>
 <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Billing</div>
 <div style={{ fontSize: 15, color: '#09090b'}}>
 {billing.length ? (
 <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(billing, null, 2)}</pre>
 ) : (
 <span>No billing data yet. Add or import to see results.</span>
 )}
 </div>
 </div>
 {/* Support Tickets Table */}
 <div style={{ marginBottom: 32 }}>
 <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Support Tickets</div>
 <div style={{ fontSize: 15, color: '#09090b'}}>
 {supportTickets.length ? (
 <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(supportTickets, null, 2)}</pre>
 ) : (
 <span>No support tickets yet. Add or import to see results.</span>
 )}
 </div>
 </div>
 {/* Import/Export */}
 <div style={{ marginBottom: 24 }}>
 <input type="file"accept="application/json"ref={fileInputRef} style={{ display: 'none'}} onChange={handleImport} />
 <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import Integrations</button>
 <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer'}}>Export Integrations</button>
 {imported && <span style={{ marginLeft: 12, color: '#4f46e5'}}>Imported: {imported}</span>}
 {exported && <a href={exported} download="integrations.json"style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline'}}>Download Export</a>}
 </div>
 {/* Analytics Dashboard */}
 <div style={{ marginBottom: 32 }}>
 <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
 <div style={{ fontSize: 15, color: '#09090b'}}>
 {analytics.length ? (
 <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
 ) : (
 <span>No analytics yet. Manage or import integrations to see results.</span>
 )}
 </div>
 </div>
 {/* Feedback */}
 <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: '#3f3f46', borderRadius: 12, padding: 20 }} aria-label="Send feedback">
 <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
 <textarea
 value={feedback}
 onChange={e => setFeedback(e.target.value)}
 rows={3}
 style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}
 placeholder="Share your feedback or suggestions..."aria-label="Feedback"/>
 <button type="submit"style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer'}}>Send Feedback</button>
 {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
 </form>
 {/* Accessibility & Compliance */}
 <div style={{ marginTop: 32, fontSize: 13, color: '#71717a', textAlign: 'center'}}>
 <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai"style={{ color: '#0ea5e9', textDecoration: 'underline'}}>Contact Support</a></span>
 </div>
 </div>
 );
}



