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
