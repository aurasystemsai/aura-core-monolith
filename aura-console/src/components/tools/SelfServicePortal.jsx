import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/self-service-portal";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "ai",       label: "AI Assistant" },
  { id: "faq",      label: "FAQ Builder" },
  { id: "requests", label: "Request Manager" },
  { id: "guide",    label: "Portal Guide" },
];

const FAQ_CATEGORIES = ["Orders & Tracking", "Returns & Refunds", "Shipping", "Product Questions", "Account & Billing", "Technical Support"];
const REQUEST_TYPES  = ["Order Inquiry", "Return Request", "Billing Question", "Technical Issue", "Product Question", "Complaint", "Other"];
const REQUEST_STATUS = { open: "#818cf8", "in-progress": "#fbbf24", resolved: "#4ade80", closed: "#52525b" };
const REQUEST_STATUS_BG = { open: "#1e1b4b", "in-progress": "#3d2a0a", resolved: "#052e16", closed: "#1c1c1e" };

const QUICK_QUERIES = [
  "What FAQ articles reduce 'where is my order' tickets by the most?",
  "How do I design a self-service returns flow in 3 steps or fewer?",
  "What are the 10 most common Shopify customer service questions?",
  "How should I structure a customer account portal to drive repeat purchase?",
  "What self-service features reduce CS headcount the most?",
];

export default function SelfServicePortal() {
  const [tab, setTab] = useState("ai");

  // AI Assistant
  const [query, setQuery]   = useState("");
  const [answer, setAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // FAQ Builder
  const [faqs, setFaqs]     = useState([]);
  const [faqForm, setFaqForm] = useState({ question: "", answer: "", category: "Orders & Tracking" });
  const [faqGen, setFaqGen]   = useState("");
  const [faqGenLoading, setFaqGenLoading] = useState(false);
  const [faqGenResult, setFaqGenResult]   = useState(null);
  const [editFaq, setEditFaq] = useState(null);

  // Request Manager
  const [requests, setRequests]   = useState([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [newReq, setNewReq] = useState({ title: "", description: "", type: "Order Inquiry" });
  const [aiResponse, setAiResponse] = useState({});
  const [aiRespLoading, setAiRespLoading] = useState(null);

  const [error, setError] = useState("");

  useEffect(() => { loadFaqs(); loadRequests(); }, []);

  const loadFaqs = async () => {
    try {
      const r = await apiFetchJSON(`${API}/faqs`);
      if (r.ok) setFaqs(r.faqs || []);
    } catch {}
  };

  const loadRequests = async () => {
    setReqLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/requests`);
      if (r.ok) setRequests(r.requests || []);
    } catch {}
    setReqLoading(false);
  };

  const runQuery = async (override) => {
    const q = (override || query).trim();
    if (!q) return;
    setAiLoading(true); setError(""); setAnswer(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!r.ok) throw new Error(r.error || "Query failed");
      setAnswer(r.answer || "");
    } catch (e) { setError(e.message); }
    setAiLoading(false);
  };

  const saveFaq = async () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) { setError("Question and answer required"); return; }
    setError("");
    try {
      if (editFaq !== null) {
        await apiFetchJSON(`${API}/faqs/${editFaq}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(faqForm),
        });
      } else {
        await apiFetchJSON(`${API}/faqs`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...faqForm, createdAt: new Date().toISOString() }),
        });
      }
      setFaqForm({ question: "", answer: "", category: "Orders & Tracking" });
      setEditFaq(null);
      loadFaqs();
    } catch (e) { setError(e.message); }
  };

  const deleteFaq = async (id) => {
    try {
      await apiFetchJSON(`${API}/faqs/${id}`, { method: "DELETE" });
      setFaqs(p => p.filter(f => f.id !== id));
    } catch (e) { setError(e.message); }
  };

  const generateFaqs = async () => {
    if (!faqGen.trim()) return;
    setFaqGenLoading(true); setFaqGenResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/generate-faqs`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: faqGen }),
      });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      setFaqGenResult(r.faqs || r.result || "");
    } catch (e) { setError(e.message); }
    setFaqGenLoading(false);
  };

  const createRequest = async () => {
    if (!newReq.title.trim()) { setError("Title required"); return; }
    setError("");
    try {
      const r = await apiFetchJSON(`${API}/requests`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newReq, status: "open", createdAt: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error(r.error || "Create failed");
      setNewReq({ title: "", description: "", type: "Order Inquiry" });
      loadRequests();
    } catch (e) { setError(e.message); }
  };

  const updateStatus = async (id, status) => {
    try {
      await apiFetchJSON(`${API}/requests/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setRequests(p => p.map(r => r.id === id ? { ...r, status } : r));
    } catch (e) { setError(e.message); }
  };

  const deleteRequest = async (id) => {
    try {
      await apiFetchJSON(`${API}/requests/${id}`, { method: "DELETE" });
      setRequests(p => p.filter(r => r.id !== id));
    } catch {}
  };

  const aiSuggestResponse = async (req) => {
    setAiRespLoading(req.id);
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest-response`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: req.title, description: req.description, type: req.type }),
      });
      if (!r.ok) throw new Error(r.error || "AI failed");
      setAiResponse(p => ({ ...p, [req.id]: r.response || r.result || "" }));
    } catch (e) { setError(e.message); }
    setAiRespLoading(null);
  };

  const faqsByCategory = FAQ_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = faqs.filter(f => f.category === cat);
    return acc;
  }, {});

  const openCount     = requests.filter(r => r.status === "open").length;
  const resolvedCount = requests.filter(r => r.status === "resolved").length;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Self-Service Portal</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Build your customer self-service experience — AI-powered FAQ generation, support request management with AI-suggested responses, and order tracking guidance. Reduce CS ticket volume by 30-50%.
        </p>
      </div>

      {(requests.length > 0 || faqs.length > 0) && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[
            { label: "FAQ Articles",    val: faqs.length,      color: "#818cf8" },
            { label: "Open Requests",   val: openCount,        color: "#fbbf24" },
            { label: "Resolved",        val: resolvedCount,    color: "#4ade80" },
            { label: "Total Requests",  val: requests.length,  color: "#71717a" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
              <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── AI ASSISTANT ── */}
      {tab === "ai" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Self-Service Strategy AI</div>
            <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, marginBottom: 14 }}>
              Ask about self-service best practices, FAQ design, return flows, order tracking setup, or chatbot strategy. The AI gives actionable, e-commerce-specific answers.
            </p>
            <textarea style={{ ...S.ta, minHeight: 80 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask about self-service strategy, FAQ content, returns flow, customer portal design…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={() => runQuery()} disabled={aiLoading || !query.trim()}>{aiLoading ? "Thinking…" : "Ask AI"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setQuery(""); setAnswer(null); }}>Clear</button>
            </div>
          </div>

          {aiLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {answer && !aiLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>AI Response</div>
                <button onClick={() => navigator.clipboard?.writeText(answer)} style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }}>Copy</button>
              </div>
              <pre style={S.pre}>{answer}</pre>
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Quick Strategy Questions</div>
            {QUICK_QUERIES.map((q, i) => (
              <div key={i} style={S.row}>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => { setQuery(q); runQuery(q); }}>Ask</button>
                <div style={{ fontSize: 13, color: "#a1a1aa" }}>{q}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FAQ BUILDER ── */}
      {tab === "faq" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Generate FAQ Articles</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 10 }}>Describe a theme or paste common customer questions — the AI writes complete FAQ articles ready to publish.</p>
            <textarea style={{ ...S.ta, minHeight: 70 }} value={faqGen} onChange={e => setFaqGen(e.target.value)} placeholder="e.g. 'Returns and refunds for a UK fashion brand with a 30-day policy' or 'Order tracking questions for a store that ships via DPD and Royal Mail'" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={generateFaqs} disabled={faqGenLoading || !faqGen.trim()}>{faqGenLoading ? "Generating…" : "AI Generate FAQs"}</button>
            </div>
          </div>

          {faqGenLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {faqGenResult && !faqGenLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>Generated FAQs</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof faqGenResult === "string" ? faqGenResult : JSON.stringify(faqGenResult, null, 2))}>Copy All</button>
              </div>
              <pre style={S.pre}>{typeof faqGenResult === "string" ? faqGenResult : JSON.stringify(faqGenResult, null, 2)}</pre>
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>{editFaq !== null ? "Edit FAQ Article" : "Add FAQ Article"}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 10, marginBottom: 10, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Category</label>
                <select style={{ ...S.select, width: "100%" }} value={faqForm.category} onChange={e => setFaqForm(p => ({ ...p, category: e.target.value }))}>
                  {FAQ_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Question *</label>
              <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={faqForm.question} onChange={e => setFaqForm(p => ({ ...p, question: e.target.value }))} placeholder="e.g. How do I return an item?" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Answer *</label>
              <textarea style={{ ...S.ta, minHeight: 80 }} value={faqForm.answer} onChange={e => setFaqForm(p => ({ ...p, answer: e.target.value }))} placeholder="Write a clear, complete answer customers can act on…" />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={saveFaq}>{editFaq !== null ? "Update FAQ" : "Add FAQ"}</button>
              {editFaq !== null && <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setEditFaq(null); setFaqForm({ question: "", answer: "", category: "Orders & Tracking" }); }}>Cancel</button>}
            </div>
          </div>

          {faqs.length === 0 ? (
            <EmptyState icon="❓" title="No FAQ articles yet" description="Add articles manually or use AI to generate them from common question themes." />
          ) : (
            FAQ_CATEGORIES.filter(cat => faqsByCategory[cat].length > 0).map(cat => (
              <div key={cat} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#818cf8" }}>{cat}</div>
                  <div style={{ fontSize: 11, color: "#52525b" }}>{faqsByCategory[cat].length} articles</div>
                </div>
                {faqsByCategory[cat].map((faq, i) => (
                  <div key={faq.id || i} style={{ padding: "10px 0", borderBottom: "1px solid #1f1f22" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7", marginBottom: 4 }}>Q: {faq.question}</div>
                        <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{faq.answer}</div>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 10 }}>
                        <button style={{ ...S.btn(), fontSize: 10, padding: "3px 8px" }} onClick={() => { setEditFaq(faq.id); setFaqForm({ question: faq.question, answer: faq.answer, category: faq.category }); }}>Edit</button>
                        <button style={{ ...S.btn("danger"), fontSize: 10, padding: "3px 8px" }} onClick={() => deleteFaq(faq.id)}>✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── REQUEST MANAGER ── */}
      {tab === "requests" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>New Support Request</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <input style={{ ...S.input, flex: 2, minWidth: 200 }} value={newReq.title} onChange={e => setNewReq(p => ({ ...p, title: e.target.value }))} placeholder="Request title…" />
              <select style={{ ...S.select }} value={newReq.type} onChange={e => setNewReq(p => ({ ...p, type: e.target.value }))}>
                {REQUEST_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <textarea style={{ ...S.ta, minHeight: 60, marginBottom: 10 }} value={newReq.description} onChange={e => setNewReq(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)…" />
            <button style={S.btn("primary")} onClick={createRequest}>Create Request</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{requests.length} requests · {openCount} open</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadRequests}>Refresh</button>
          </div>

          {reqLoading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : requests.length === 0 ? (
            <EmptyState icon="📋" title="No support requests" description="Create a request above to get started." />
          ) : (
            requests.map((req, i) => (
              <div key={req.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
                      {req.type && <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{req.type}</span>}
                      {req.status && <span style={{ background: REQUEST_STATUS_BG[req.status] || "#27272a", color: REQUEST_STATUS[req.status] || "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{req.status}</span>}
                      {req.createdAt && <span style={{ fontSize: 11, color: "#52525b" }}>{new Date(req.createdAt).toLocaleDateString()}</span>}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{req.title}</div>
                    {req.description && <div style={{ fontSize: 12, color: "#71717a", marginTop: 3 }}>{req.description}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 10, flexDirection: "column", alignItems: "flex-end" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {req.status === "open" && <button style={{ ...S.btn(), fontSize: 10, padding: "3px 8px" }} onClick={() => updateStatus(req.id, "in-progress")}>Start</button>}
                      {req.status === "in-progress" && <button style={{ ...S.btn("green"), fontSize: 10, padding: "3px 8px" }} onClick={() => updateStatus(req.id, "resolved")}>Resolve</button>}
                      <button style={{ ...S.btn("danger"), fontSize: 10, padding: "3px 8px" }} onClick={() => deleteRequest(req.id)}>✕</button>
                    </div>
                    <button style={{ ...S.btn("primary"), fontSize: 10, padding: "3px 8px" }} onClick={() => aiSuggestResponse(req)} disabled={aiRespLoading === req.id}>
                      {aiRespLoading === req.id ? "Thinking…" : "AI Suggest Response"}
                    </button>
                  </div>
                </div>
                {aiResponse[req.id] && (
                  <div style={{ background: "#0f172a", border: "1px solid #1e3a5f", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                    <div style={{ fontSize: 10, color: "#60a5fa", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>AI Suggested Response</div>
                    <div style={{ fontSize: 12, color: "#bfdbfe", lineHeight: 1.6 }}>{aiResponse[req.id]}</div>
                    <button style={{ ...S.btn(), fontSize: 10, padding: "3px 8px", marginTop: 8 }} onClick={() => navigator.clipboard?.writeText(aiResponse[req.id])}>Copy Response</button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── PORTAL GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Self-Service Reduction Framework</div>
            {[
              { t: "Order tracking eliminates 30-40% of CS volume",  d: "The #1 CS ticket globally is 'where is my order'. A branded tracking page with carrier integration eliminates this category entirely. Set it up before any other self-service feature." },
              { t: "Returns self-service requires 3 steps or fewer", d: "Customers abandon self-service returns if there are more than 3 steps. The ideal flow: 1) Enter order number, 2) Select items and reason, 3) Download prepaid label. That's it." },
              { t: "FAQ articles from real ticket data, not guesswork", d: "Don't write FAQs based on what you think customers ask. Mine your last 90 days of CS tickets for the top 20 questions. Those are your FAQ priorities." },
              { t: "Account dashboard drives 2.3× higher LTV",       d: "Customers who can view order history, track points, and manage subscriptions without CS involvement have significantly higher LTV. Prioritise account dashboard features over chatbots." },
              { t: "Chatbot + instant human fallback",               d: "AI chatbots resolve 60-70% of enquiries without human involvement. The critical design element: instant, frictionless handoff to a human when the bot can't help. Frustrating handoffs destroy trust." },
              { t: "Measure deflection rate, not just satisfaction",  d: "Track the % of customers who successfully resolved without contacting CS. This deflection rate is the core KPI for self-service. Target: 60%+ deflection on covered topics." },
              { t: "Proactive self-service beats reactive CS",        d: "Sending a proactive shipping update at dispatch eliminates 'where is my order' before it's asked. Proactive communication is cheaper than reactive CS at any scale." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>💡</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Self-Service Feature Priority Matrix</div>
            {[
              { feature: "Order tracking page",          impact: "Very High", effort: "Low",    roi: "Best ROI" },
              { feature: "FAQ / Help centre",            impact: "High",      effort: "Low",    roi: "High ROI" },
              { feature: "Self-service returns portal",  impact: "High",      effort: "Medium", roi: "High ROI" },
              { feature: "Customer account dashboard",   impact: "High",      effort: "Medium", roi: "High ROI" },
              { feature: "AI chatbot with handoff",      impact: "Medium",    effort: "High",   roi: "Medium ROI" },
              { feature: "Community / forum",            impact: "Low",       effort: "High",   roi: "Low ROI" },
            ].map(({ feature, impact, effort, roi }) => (
              <div key={feature} style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                <span style={{ color: "#e4e4e7" }}>{feature}</span>
                <span style={{ background: impact === "Very High" ? "#1e1b4b" : impact === "High" ? "#052e16" : "#27272a", color: impact === "Very High" ? "#818cf8" : impact === "High" ? "#4ade80" : "#71717a", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>{impact}</span>
                <span style={{ color: "#52525b" }}>{effort} effort</span>
                <span style={{ color: "#fbbf24", fontWeight: 700 }}>{roi}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
