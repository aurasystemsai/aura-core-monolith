import React, { useState, useEffect, useRef } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/aura-operations-ai";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "chat",  label: "Operations AI" },
  { id: "sops",  label: "SOP Library" },
  { id: "kpis",  label: "KPI Dashboard" },
  { id: "incidents", label: "Incident Log" },
  { id: "guide", label: "Ops Guide" },
];

const QUICK_PROMPTS = [
  { label: "Fulfilment SOP",       prompt: "Write a detailed standard operating procedure for order fulfilment in an e-commerce warehouse. Include receiving, picking, packing, and despatch steps." },
  { label: "Returns process",      prompt: "Create a step-by-step returns and refund process for a Shopify store. Include: customer initiation, item inspection, restocking, and refund timelines." },
  { label: "Customer SLA",         prompt: "Define customer service SLAs for a growing e-commerce brand: response times by channel, resolution targets, escalation procedures, and CSAT measurement." },
  { label: "Supplier onboarding",  prompt: "Create a supplier onboarding checklist covering: qualification, pricing negotiation, quality requirements, lead times, payment terms, and first order procedure." },
  { label: "Peak season prep",     prompt: "Write an operational readiness plan for peak sales season (Black Friday/Christmas). Cover: inventory pre-build, staffing, system capacity, customer service scaling, and contingency plans." },
  { label: "Inventory audit",      prompt: "Create a monthly inventory audit procedure including: cycle count schedules, discrepancy investigation, system reconciliation, and reporting format." },
  { label: "3PL evaluation",       prompt: "Create a framework for evaluating third-party logistics providers. Include: capability assessment, pricing structure, SLA requirements, technology integration, and scoring matrix." },
  { label: "Cost reduction",       prompt: "Analyse common operational cost leaks in e-commerce and recommend the top 5 areas to reduce costs without impacting customer experience. Include typical savings percentages." },
];

const KPI_GROUPS = [
  {
    group: "Fulfilment",
    kpis: [
      { name: "Order Accuracy Rate",       target: ">99.5%", benchmark: "99.2% industry avg",    desc: "% of orders despatched with correct items and quantity" },
      { name: "On-Time Despatch Rate",     target: ">98%",   benchmark: "97% industry avg",     desc: "% of orders despatched within committed SLA" },
      { name: "Same-Day Fulfilment Rate",  target: ">85%",   benchmark: "78% industry avg",     desc: "% of orders placed before cut-off despatched same day" },
      { name: "Returns Rate",              target: "<5%",    benchmark: "6.5% e-commerce avg",  desc: "% of orders returned (excluding exchange requests)" },
    ],
  },
  {
    group: "Customer Service",
    kpis: [
      { name: "First Response Time",       target: "<2h",   benchmark: "4.6h industry avg",   desc: "Average time to first agent response on new tickets" },
      { name: "Resolution Time",           target: "<24h",  benchmark: "20h industry avg",    desc: "Average time from ticket open to resolved" },
      { name: "CSAT Score",                target: ">90%",  benchmark: "83% industry avg",    desc: "% of customers satisfied or very satisfied" },
      { name: "First Contact Resolution",  target: ">75%",  benchmark: "68% industry avg",    desc: "% of tickets resolved in one interaction" },
    ],
  },
  {
    group: "Inventory",
    kpis: [
      { name: "Inventory Accuracy",           target: ">99%",     benchmark: "97% industry avg",    desc: "% match between system records and physical stock" },
      { name: "Stockout Rate",                target: "<1%",      benchmark: "3% industry avg",     desc: "% of SKUs that hit zero stock causing lost sales" },
      { name: "Inventory Turnover",           target: "6-12x/yr", benchmark: "5x e-commerce avg",  desc: "Revenue ÷ average inventory value" },
      { name: "Days Inventory Outstanding",   target: "<45d",     benchmark: "52d industry avg",    desc: "Average days stock sits in warehouse before selling" },
    ],
  },
];

const SEVERITY = { low: "#4ade80", medium: "#fbbf24", high: "#f87171", critical: "#ef4444" };
const SEV_BG   = { low: "#052e16", medium: "#3d2a0a", high: "#3f1315", critical: "#3f0d0d" };
const INCIDENT_STATUSES = ["Open", "Investigating", "Resolved", "Closed"];

export default function AuraOperationsAI() {
  const [tab, setTab]       = useState("chat");
  const [messages, setMessages] = useState([
    { role: "system", content: "You are an expert operations consultant for e-commerce businesses. You help create SOPs, optimise processes, analyse operational metrics, and solve fulfilment, logistics, and customer service challenges. Be specific, actionable, and practical." },
  ]);
  const [input, setInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError]   = useState("");
  const messagesEndRef      = useRef(null);

  const [sops, setSops]       = useState([]);
  const [sopsLoading, setSopsLoading] = useState(false);
  const [showNewSop, setShowNewSop]   = useState(false);
  const [newSop, setNewSop]           = useState({ title: "", category: "Warehouse", steps: [""] });
  const [sopSaving, setSopSaving]     = useState(false);
  const [activeKpiGroup, setActiveKpiGroup] = useState(0);

  const [incidents, setIncidents]     = useState([]);
  const [incForm, setIncForm]         = useState({ title: "", severity: "medium", area: "Fulfilment", description: "", status: "Open" });
  const [incSaving, setIncSaving]     = useState(false);
  const [showIncForm, setShowIncForm] = useState(false);

  const SOP_CATEGORIES = ["Warehouse", "Customer Service", "Procurement", "Marketing", "Finance", "HR", "General"];
  const INC_AREAS      = ["Fulfilment", "Inventory", "Customer Service", "Supplier", "IT / Systems", "Finance", "Marketing", "General"];

  const visibleMessages = messages.filter(m => m.role !== "system");

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { loadSops(); loadIncidents(); }, []);

  const loadSops = async () => {
    setSopsLoading(true);
    try { const r = await apiFetchJSON(`${API}/sops`); if (r.ok) setSops(r.sops || []); } catch {}
    setSopsLoading(false);
  };

  const loadIncidents = async () => {
    try { const r = await apiFetchJSON(`${API}/incidents`); if (r.ok) setIncidents(r.incidents || []); } catch {}
  };

  const send = async (overrideInput) => {
    const text = (overrideInput || input).trim();
    if (!text) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true); setError("");
    try {
      const r = await apiFetchJSON(`${API}/ai`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: newMessages }) });
      if (!r.ok && r.error) throw new Error(r.error);
      setMessages(p => [...p, { role: "assistant", content: r.reply || r.message || "" }]);
    } catch (e) { setError(e.message); }
    setChatLoading(false);
  };

  const saveSopFromChat = async () => {
    const lastMsg = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastMsg) return;
    const lines = lastMsg.content.split("\n").filter(l => l.trim() && l.match(/^\d+\.|^[-•]/));
    const steps = lines.length > 0 ? lines.map(l => l.replace(/^\d+\.\s*|^[-•]\s*/, "").trim()) : [lastMsg.content.slice(0, 100)];
    try {
      await apiFetchJSON(`${API}/sops`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "AI-Generated SOP", category: "General", steps, lastUpdated: new Date().toISOString().slice(0, 10) }) });
      loadSops(); setTab("sops");
    } catch (e) { setError(e.message); }
  };

  const saveNewSop = async () => {
    if (!newSop.title.trim()) return;
    setSopSaving(true);
    try {
      await apiFetchJSON(`${API}/sops`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newSop, steps: newSop.steps.filter(s => s.trim()), lastUpdated: new Date().toISOString().slice(0, 10) }) });
      setNewSop({ title: "", category: "Warehouse", steps: [""] }); setShowNewSop(false); loadSops();
    } catch (e) { setError(e.message); }
    setSopSaving(false);
  };

  const deleteSop = async (id) => {
    try { await apiFetchJSON(`${API}/sops/${id}`, { method: "DELETE" }); setSops(p => p.filter(s => s.id !== id)); } catch {}
  };

  const saveIncident = async () => {
    if (!incForm.title.trim()) return;
    setIncSaving(true);
    try {
      await apiFetchJSON(`${API}/incidents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...incForm, createdAt: new Date().toISOString() }) });
      setIncForm({ title: "", severity: "medium", area: "Fulfilment", description: "", status: "Open" }); setShowIncForm(false); loadIncidents();
    } catch (e) { setError(e.message); }
    setIncSaving(false);
  };

  const deleteIncident = async (id) => {
    try { await apiFetchJSON(`${API}/incidents/${id}`, { method: "DELETE" }); setIncidents(p => p.filter(i => i.id !== id)); } catch {}
  };

  const updateIncStatus = async (id, status) => {
    try { await apiFetchJSON(`${API}/incidents/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); } catch {}
    setIncidents(p => p.map(i => i.id === id ? { ...i, status } : i));
  };

  const addStep = () => setNewSop(p => ({ ...p, steps: [...p.steps, ""] }));
  const updateStep = (i, v) => setNewSop(p => ({ ...p, steps: p.steps.map((s, idx) => idx === i ? v : s) }));
  const removeStep = (i) => setNewSop(p => ({ ...p, steps: p.steps.filter((_, idx) => idx !== i) }));

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>AURA Operations AI</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI operations co-pilot — generate SOPs, track incidents, analyse KPIs, optimise fulfilment processes, and build the operational infrastructure your brand needs to scale.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "SOPs",            value: sops.length,                                      color: "#818cf8" },
          { label: "Incidents",       value: incidents.length,                                 color: "#fbbf24" },
          { label: "Open Incidents",  value: incidents.filter(i => i.status === "Open").length, color: incidents.filter(i => i.status === "Open").length > 0 ? "#f87171" : "#52525b" },
          { label: "KPI Groups",      value: KPI_GROUPS.length,                                color: "#4ade80" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* CHAT */}
      {tab === "chat" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            {QUICK_PROMPTS.map(qp => (
              <button key={qp.label} style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => send(qp.prompt)}>{qp.label}</button>
            ))}
          </div>
          <div style={{ background: "#0d0d0f", border: "1px solid #27272a", borderRadius: 14, padding: "16px 20px", minHeight: 320, maxHeight: 520, overflowY: "auto", marginBottom: 14 }}>
            {visibleMessages.length === 0 ? (
              <div style={{ color: "#52525b", fontSize: 13, textAlign: "center", padding: "80px 0" }}>Ask anything about operations, logistics, fulfilment, or click a quick prompt above.<br /><span style={{ fontSize: 12, color: "#3f3f46" }}>AI will generate detailed SOPs, checklists, and process documentation.</span></div>
            ) : (
              visibleMessages.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 10, marginBottom: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.role === "user" ? "#4f46e5" : "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{m.role === "user" ? "👤" : "⚙️"}</div>
                  <div style={{ maxWidth: "82%", background: m.role === "user" ? "#1e1b4b" : "#18181b", border: `1px solid ${m.role === "user" ? "#3730a3" : "#27272a"}`, borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{m.content}</div>
                    {m.role === "assistant" && (
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <button onClick={() => navigator.clipboard?.writeText(m.content)} style={{ background: "transparent", border: "1px solid #3f3f46", borderRadius: 5, padding: "2px 8px", fontSize: 11, color: "#71717a", cursor: "pointer" }}>Copy</button>
                        <button onClick={saveSopFromChat} style={{ background: "transparent", border: "1px solid #3f3f46", borderRadius: 5, padding: "2px 8px", fontSize: 11, color: "#818cf8", cursor: "pointer" }}>Save as SOP</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#166534", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙️</div>
                <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 14px" }}><Spinner size={16} /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea style={{ ...S.ta, minHeight: 60, maxHeight: 120, flex: 1 }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask about SOPs, process improvement, KPI targets, supplier management… (Enter to send)" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button style={S.btn("primary")} onClick={() => send()} disabled={chatLoading || !input.trim()}>Send</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setMessages(m => [m[0]])}>Clear Chat</button>
            </div>
          </div>
        </div>
      )}

      {/* SOP LIBRARY */}
      {tab === "sops" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{sops.length} standard operating procedures</div>
            <button style={S.btn("primary")} onClick={() => setShowNewSop(p => !p)}>{showNewSop ? "Cancel" : "+ Create SOP"}</button>
          </div>
          {showNewSop && (
            <div style={S.card}>
              <div style={S.sectionTitle}>New Standard Operating Procedure</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                <input style={{ ...S.input, flex: 2 }} value={newSop.title} onChange={e => setNewSop(p => ({ ...p, title: e.target.value }))} placeholder="SOP Title (e.g. Order Fulfilment Process)" />
                <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" }} value={newSop.category} onChange={e => setNewSop(p => ({ ...p, category: e.target.value }))}>
                  {SOP_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e4e4e7", marginBottom: 8 }}>Steps</div>
                {newSop.steps.map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 8 }}>{i + 1}</div>
                    <input style={{ ...S.input, flex: 1 }} value={step} onChange={e => updateStep(i, e.target.value)} placeholder={`Step ${i + 1}…`} />
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => removeStep(i)}>×</button>
                  </div>
                ))}
                <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px", marginTop: 4 }} onClick={addStep}>+ Add Step</button>
              </div>
              <button style={S.btn("primary")} onClick={saveNewSop} disabled={sopSaving || !newSop.title.trim()}>{sopSaving ? "Saving…" : "Save SOP"}</button>
            </div>
          )}
          {sopsLoading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : sops.length === 0 ? (
            <EmptyState icon="📋" title="No SOPs yet" description="Create your first SOP manually or use the Operations AI chat to generate one." />
          ) : (
            sops.map(sop => (
              <div key={sop.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#fafafa" }}>{sop.title}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{sop.category}</span>
                      {sop.lastUpdated && <span style={{ fontSize: 11, color: "#52525b" }}>Updated {sop.lastUpdated}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(sop.steps?.map((s, i) => `${i + 1}. ${s}`).join("\n") || "")}>Copy</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteSop(sop.id)}>Delete</button>
                  </div>
                </div>
                {(sop.steps || []).map((step, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, padding: "4px 0" }}>
                    <span style={{ width: 20, height: 20, borderRadius: "50%", background: "#1e1b4b", border: "1px solid #3730a3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#818cf8", flexShrink: 0, marginTop: 1 }}>{i + 1}</span>
                    <span style={{ fontSize: 13, color: "#e4e4e7" }}>{step}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* KPI DASHBOARD */}
      {tab === "kpis" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {KPI_GROUPS.map((g, i) => (
              <button key={g.group} style={S.btn(i === activeKpiGroup ? "primary" : null)} onClick={() => setActiveKpiGroup(i)}>{g.group}</button>
            ))}
          </div>
          {KPI_GROUPS[activeKpiGroup].kpis.map(kpi => (
            <div key={kpi.name} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#fafafa" }}>{kpi.name}</div>
                  <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{kpi.desc}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                  <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", marginBottom: 2 }}>Target</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>{kpi.target}</div>
                </div>
              </div>
              <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "#52525b" }}>Industry benchmark:</span>
                <span style={{ fontSize: 12, color: "#fbbf24", fontWeight: 600 }}>{kpi.benchmark}</span>
              </div>
            </div>
          ))}
          <div style={S.card}>
            <div style={S.sectionTitle}>KPI Review Cadence</div>
            {[
              { freq: "Daily",     items: "Orders despatched, CS tickets opened & resolved, stockout alerts" },
              { freq: "Weekly",    items: "Order accuracy rate, on-time despatch rate, CSAT, returns rate" },
              { freq: "Monthly",   items: "Inventory accuracy audit, supplier performance review, cost per order" },
              { freq: "Quarterly", items: "Full SOP review, 3PL contract review, team OKR assessment" },
            ].map(({ freq, items }) => (
              <div key={freq} style={S.row}>
                <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, minWidth: 72, textAlign: "center", flexShrink: 0 }}>{freq}</span>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>{items}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INCIDENT LOG */}
      {tab === "incidents" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{incidents.length} incidents · {incidents.filter(i => i.status === "Open").length} open</div>
            <button style={S.btn("primary")} onClick={() => setShowIncForm(p => !p)}>{showIncForm ? "Cancel" : "+ Log Incident"}</button>
          </div>
          {showIncForm && (
            <div style={S.card}>
              <div style={S.sectionTitle}>New Operational Incident</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Title *</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={incForm.title} onChange={e => setIncForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. 3PL picking error caused 200 wrong shipments" />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Area</label>
                  <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none", width: "100%" }} value={incForm.area} onChange={e => setIncForm(p => ({ ...p, area: e.target.value }))}>
                    {INC_AREAS.map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 6 }}>Severity</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.keys(SEVERITY).map(s => (
                    <button key={s} style={{ ...S.btn(incForm.severity === s ? "primary" : null), fontSize: 11, padding: "4px 10px", textTransform: "capitalize" }} onClick={() => setIncForm(p => ({ ...p, severity: s }))}>{s}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Description</label>
                <textarea style={{ ...S.ta, minHeight: 70 }} value={incForm.description} onChange={e => setIncForm(p => ({ ...p, description: e.target.value }))} placeholder="What happened, when, what was the impact…" />
              </div>
              <button style={S.btn("primary")} onClick={saveIncident} disabled={incSaving || !incForm.title.trim()}>{incSaving ? "Saving…" : "Log Incident"}</button>
            </div>
          )}
          {incidents.length === 0 ? (
            <EmptyState icon="🚨" title="No incidents logged" description="Log operational incidents to track issues, resolutions, and patterns over time." />
          ) : (
            incidents.map(inc => (
              <div key={inc.id} style={{ ...S.card, borderLeft: `4px solid ${SEVERITY[inc.severity] || "#71717a"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{inc.title}</span>
                      <span style={{ background: SEV_BG[inc.severity] || "#27272a", color: SEVERITY[inc.severity] || "#a1a1aa", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{inc.severity}</span>
                      <span style={{ background: inc.status === "Resolved" || inc.status === "Closed" ? "#052e16" : "#3d2a0a", color: inc.status === "Resolved" || inc.status === "Closed" ? "#4ade80" : "#fbbf24", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{inc.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>{inc.area}{inc.createdAt ? ` · ${new Date(inc.createdAt).toLocaleDateString()}` : ""}</div>
                    {inc.description && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>{inc.description}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {INCIDENT_STATUSES.filter(s => s !== inc.status).map(s => (
                        <button key={s} style={{ ...S.btn(), fontSize: 10, padding: "2px 8px" }} onClick={() => updateIncStatus(inc.id, s)}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px", flexShrink: 0, marginLeft: 12 }} onClick={() => deleteIncident(inc.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* OPS GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Operations Excellence Framework</div>
            {[
              { t: "Process before people, then people before technology",  d: "The most common ops mistake is buying software to fix a broken process. Define your ideal process on paper first (SOP). Then hire people who can follow it. Then automate it with technology. In that order." },
              { t: "The 1% rule: marginal gains compound",                  d: "Amazon's fulfilment dominance wasn't built in a day — it was thousands of 1% improvements across picking, packing, routing, and returns. Map every process, measure it, and improve it by 1% per month." },
              { t: "Measure what matters, ignore vanity metrics",          d: "Orders despatched, CSAT, and refund rate are outcome metrics — they measure what customers experience. Warehouse walk distance and email response volume are vanity metrics. Always optimise for outcome metrics." },
              { t: "Inventory is cash on shelves — treat it that way",      d: "Every unsold unit is capital locked up earning zero return. Aim for inventory turns of 8-12x/year. Run stock-age reports monthly. Discount or bundle anything over 90 days old. Dead stock destroys margin." },
              { t: "Build ops for the scale you plan to reach, not today", d: "Design processes for 10× your current volume. A 3PL contract that works at 500 orders/month may fail at 5,000. Document processes so they can be handed off. Automate anything done more than 3 times." },
              { t: "Customer experience is an operations problem first",   d: "The #1 reason for CSAT scores below 80% is operations: late despatch, wrong items, poor packaging. Before investing in marketing or support quality, fix your fulfilment accuracy and speed." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>⚙️</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Scaling Ops: Stage by Stage</div>
            {[
              { stage: "0–500 orders/month",     desc: "Do everything yourself. Learn every part of the process. Document what you do as simple SOPs. Focus on accuracy, not speed.", color: "#27272a" },
              { stage: "500–2k orders/month",    desc: "Hire your first ops person. Use your SOPs to train them. Consider a 3PL quote. Integrate Shopify + inventory management.", color: "#1e3a5f" },
              { stage: "2k–10k orders/month",    desc: "Move to 3PL or dedicated warehouse. Implement WMS. Hire ops manager. Build supplier relationships. Negotiate volume pricing.", color: "#1e1b4b" },
              { stage: "10k+ orders/month",      desc: "Multiple 3PL locations. Dedicated supply chain manager. Automated reorder triggers. Custom carrier contracts. Advanced demand forecasting.", color: "#052e16" },
            ].map(({ stage, desc, color }) => (
              <div key={stage} style={{ background: color, border: "1px solid #27272a", borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>{stage}</div>
                <div style={{ fontSize: 12, color: "#a1a1aa" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
