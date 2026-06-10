import React, { useState, useRef, useEffect, useCallback } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/ai-support-assistant";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "chat",      label: "AI Chat" },
  { id: "templates", label: "Quick Replies" },
  { id: "knowledge", label: "Knowledge Base" },
  { id: "history",   label: "History" },
  { id: "guide",     label: "Support Guide" },
];

const QUICK_ACTIONS = [
  { label: "Order not received", prompt: "Customer says their order has not arrived after 10 days. How should I respond?" },
  { label: "Refund request",     prompt: "Customer requesting a full refund for an item they are unhappy with. Draft a response that is empathetic and explains my policy." },
  { label: "Wrong item sent",    prompt: "Customer received the wrong item. How should I handle this and what should I offer?" },
  { label: "Item damaged",       prompt: "Customer received a damaged item. Draft a professional, empathetic reply and outline next steps." },
  { label: "Discount request",   prompt: "Customer asking for a discount code. How should I respond in a way that retains them without devaluing my brand?" },
  { label: "Cancel order",       prompt: "Customer wants to cancel an order already dispatched. What are my options and how should I communicate this?" },
];

const KB_CATEGORIES = ["Shipping & Delivery", "Returns & Refunds", "Product Info", "Account & Orders", "Promotions", "Complaints", "General"];

export default function AISupportAssistant() {
  const [tab, setTab] = useState("chat");

  // Chat
  const [messages, setMessages] = useState([
    { role: "system", content: "You are an expert AI support assistant for e-commerce merchants using Shopify. Help draft professional, empathetic customer service responses. Be concise and actionable." }
  ]);
  const [input, setInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Templates
  const [templates, setTemplates]     = useState([]);
  const [tplLoading, setTplLoading]   = useState(false);
  const [tplSearch, setTplSearch]     = useState("");
  const [newTpl, setNewTpl] = useState({ name: "", category: "General", body: "" });
  const setTp = (k, v) => setNewTpl(p => ({ ...p, [k]: v }));

  // Knowledge Base
  const [knowledge, setKnowledge]       = useState([]);
  const [kbLoading, setKbLoading]       = useState(false);
  const [kbSearch, setKbSearch]         = useState("");
  const [kbCategory, setKbCategory]     = useState("All");
  const [newKb, setNewKb] = useState({ question: "", answer: "", category: "General", tags: "" });
  const setKb = (k, v) => setNewKb(p => ({ ...p, [k]: v }));

  const [error, setError] = useState("");

  const fetchTemplates = useCallback(async () => {
    setTplLoading(true);
    try { const r = await apiFetchJSON(`${API}/templates`); if (r.ok) setTemplates(r.templates || []); } catch {}
    setTplLoading(false);
  }, []);

  const fetchKnowledge = useCallback(async () => {
    setKbLoading(true);
    try { const r = await apiFetchJSON(`${API}/knowledge`); if (r.ok) setKnowledge(r.knowledge || r.entries || []); } catch {}
    setKbLoading(false);
  }, []);

  useEffect(() => { fetchTemplates(); fetchKnowledge(); }, [fetchTemplates, fetchKnowledge]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const visibleMessages = messages.filter(m => m.role !== "system");

  const send = async (overrideInput) => {
    const text = (overrideInput || input).trim();
    if (!text) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true); setError("");
    try {
      const r = await apiFetchJSON(`${API}/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      setMessages(p => [...p, { role: "assistant", content: r.reply }]);
      setHistory(p => [{ userMsg: text, reply: r.reply, ts: new Date().toISOString() }, ...p].slice(0, 20));
    } catch (e) { setError(e.message); }
    setChatLoading(false);
  };

  const saveTemplate = async () => {
    if (!newTpl.name.trim() || !newTpl.body.trim()) { setError("Name and body required"); return; }
    setError("");
    try {
      await apiFetchJSON(`${API}/templates`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newTpl, createdAt: new Date().toISOString() }),
      });
      fetchTemplates();
      setNewTpl({ name: "", category: "General", body: "" });
    } catch (e) { setError(e.message); }
  };

  const deleteTemplate = async (id) => {
    try { await apiFetchJSON(`${API}/templates/${id}`, { method: "DELETE" }); } catch {}
    setTemplates(p => p.filter(t => t.id !== id));
  };

  const saveKnowledge = async () => {
    if (!newKb.question.trim() || !newKb.answer.trim()) { setError("Question and answer required"); return; }
    setError("");
    try {
      await apiFetchJSON(`${API}/knowledge`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newKb, createdAt: new Date().toISOString() }),
      });
      fetchKnowledge();
      setNewKb({ question: "", answer: "", category: "General", tags: "" });
    } catch (e) { setError(e.message); }
  };

  const deleteKnowledge = async (id) => {
    try { await apiFetchJSON(`${API}/knowledge/${id}`, { method: "DELETE" }); } catch {}
    setKnowledge(p => p.filter(k => k.id !== id));
  };

  const filteredTemplates = templates.filter(t => !tplSearch.trim() || [t.name, t.category, t.body].join(" ").toLowerCase().includes(tplSearch.toLowerCase()));
  const filteredKnowledge = knowledge.filter(k =>
    (kbCategory === "All" || k.category === kbCategory) &&
    (!kbSearch.trim() || [k.question, k.answer, k.tags].join(" ").toLowerCase().includes(kbSearch.toLowerCase()))
  );

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>AI Support Assistant</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered customer service co-pilot — draft professional replies, manage a knowledge base, save response templates, and maintain consistency across your whole support team.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "KB Entries",     val: knowledge.length,  color: "#4f46e5" },
          { label: "Templates",      val: templates.length,  color: "#818cf8" },
          { label: "Conversations",  val: history.length,    color: "#4ade80" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── AI CHAT ── */}
      {tab === "chat" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {QUICK_ACTIONS.map(qa => (
              <button key={qa.label} style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => send(qa.prompt)}>{qa.label}</button>
            ))}
          </div>
          <div style={{ background: "#0d0d0f", border: "1px solid #27272a", borderRadius: 14, padding: "16px 20px", minHeight: 300, maxHeight: 500, overflowY: "auto", marginBottom: 14 }}>
            {visibleMessages.length === 0 ? (
              <div style={{ color: "#52525b", fontSize: 13, textAlign: "center", padding: "60px 0" }}>
                Use a Quick Action above or describe a customer support scenario to get a suggested response.
              </div>
            ) : (
              visibleMessages.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 10, marginBottom: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.role === "user" ? "#4f46e5" : "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {m.role === "user" ? "👤" : "🤖"}
                  </div>
                  <div style={{ maxWidth: "80%", background: m.role === "user" ? "#1e1b4b" : "#18181b", border: `1px solid ${m.role === "user" ? "#3730a3" : "#27272a"}`, borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.content}</div>
                    {m.role === "assistant" && (
                      <div style={{ display: "flex", gap: 5, marginTop: 6 }}>
                        <button onClick={() => navigator.clipboard?.writeText(m.content)} style={{ background: "transparent", border: "1px solid #3f3f46", borderRadius: 5, padding: "2px 8px", fontSize: 11, color: "#71717a", cursor: "pointer" }}>Copy</button>
                        <button onClick={() => { setNewTpl(p => ({ ...p, body: m.content, name: "Chat reply" })); setTab("templates"); }} style={{ background: "transparent", border: "1px solid #3f3f46", borderRadius: 5, padding: "2px 8px", fontSize: 11, color: "#71717a", cursor: "pointer" }}>Save as Template</button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#166534", display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
                <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 14px" }}><Spinner size={16} /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              style={{ ...S.ta, minHeight: 60, maxHeight: 120, flex: 1 }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Describe the customer's issue or paste their message… (Enter to send, Shift+Enter for newline)"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button style={S.btn("primary")} onClick={() => send()} disabled={chatLoading || !input.trim()}>Send</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setMessages([messages[0]]); setError(""); }}>New Chat</button>
            </div>
          </div>
        </div>
      )}

      {/* ── TEMPLATES ── */}
      {tab === "templates" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Template</div>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Template Name *</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newTpl.name} onChange={e => setTp("name", e.target.value)} placeholder="e.g. Order Delay Apology" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Category</label>
                <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none", width: "100%" }} value={newTpl.category} onChange={e => setTp("category", e.target.value)}>
                  {KB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <textarea style={{ ...S.ta, minHeight: 80, marginBottom: 10 }} value={newTpl.body} onChange={e => setTp("body", e.target.value)} placeholder="Response template body… Use [Name], [OrderNumber], [ProductName] as dynamic placeholders." />
            <button style={S.btn("primary")} onClick={saveTemplate}>Save Template</button>
          </div>

          <input style={{ ...S.input, width: "100%", boxSizing: "border-box", marginBottom: 12 }} value={tplSearch} onChange={e => setTplSearch(e.target.value)} placeholder="Search templates…" />

          {tplLoading ? <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
            : filteredTemplates.length === 0 ? <EmptyState icon="📝" title="No templates yet" description="Save reply templates above or generate them in the AI Chat tab." />
            : filteredTemplates.map((tpl, i) => (
              <div key={tpl.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#e4e4e7" }}>{tpl.name}</div>
                      {tpl.category && <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{tpl.category}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{(tpl.body || "").slice(0, 150)}{(tpl.body || "").length > 150 ? "…" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 10 }}>
                    <button style={{ ...S.btn("primary"), fontSize: 11, padding: "4px 8px" }} onClick={() => { setInput(tpl.body); setTab("chat"); }}>Use in Chat</button>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 8px" }} onClick={() => navigator.clipboard?.writeText(tpl.body || "")}>Copy</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deleteTemplate(tpl.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── KNOWLEDGE BASE ── */}
      {tab === "knowledge" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Knowledge Entry</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
              Build a searchable knowledge base of Q&amp;A pairs. Entries are used to provide the AI with accurate information about your store's policies, products, and procedures.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Question / Policy *</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newKb.question} onChange={e => setKb("question", e.target.value)} placeholder="e.g. What is your return policy?" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Category</label>
                <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none", width: "100%" }} value={newKb.category} onChange={e => setKb("category", e.target.value)}>
                  {KB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Tags (comma-separated)</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newKb.tags} onChange={e => setKb("tags", e.target.value)} placeholder="returns, refund, 30-day" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Answer / Policy Details *</label>
              <textarea style={{ ...S.ta, minHeight: 80 }} value={newKb.answer} onChange={e => setKb("answer", e.target.value)} placeholder="e.g. We offer a 30-day no-questions-asked return policy. Items must be unopened and in original packaging. Contact support@store.com to initiate a return." />
            </div>
            <button style={S.btn("primary")} onClick={saveKnowledge}>Add to Knowledge Base</button>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input style={S.input} value={kbSearch} onChange={e => setKbSearch(e.target.value)} placeholder="Search knowledge base…" />
            <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" }} value={kbCategory} onChange={e => setKbCategory(e.target.value)}>
              <option value="All">All Categories</option>
              {KB_CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          {kbLoading ? <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
            : filteredKnowledge.length === 0 ? <EmptyState icon="📚" title="Knowledge base is empty" description="Add Q&A entries above. The AI will use this information to answer customer questions accurately." />
            : filteredKnowledge.map((kb, i) => (
              <div key={kb.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>Q: {kb.question}</div>
                      <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{kb.category}</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5, marginBottom: 4 }}>A: {kb.answer}</div>
                    {kb.tags && <div style={{ fontSize: 11, color: "#52525b" }}>{kb.tags}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 10 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 8px" }} onClick={() => { setInput(`Using this information: "${kb.answer}" — draft a customer reply for someone asking: ${kb.question}`); setTab("chat"); }}>Use in Chat</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deleteKnowledge(kb.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{history.length} conversations</div>
            {history.length > 0 && (
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => { const b = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "support-history.json"; a.click(); }}>Export</button>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => setHistory([])}>Clear</button>
              </div>
            )}
          </div>
          {history.length === 0 ? <EmptyState icon="💬" title="No conversation history yet" description="Start chatting to build a history of support interactions." />
            : history.map((h, i) => (
              <div key={i} style={S.card}>
                <div style={{ fontSize: 12, color: "#52525b", marginBottom: 8 }}>{new Date(h.ts).toLocaleString()}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 4 }}>Q: {h.userMsg?.slice(0, 100)}{(h.userMsg?.length || 0) > 100 ? "…" : ""}</div>
                <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>A: {h.reply?.slice(0, 200)}{(h.reply?.length || 0) > 200 ? "…" : ""}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(h.reply || "")}>Copy</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setInput(h.userMsg); setTab("chat"); }}>Re-use</button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Customer Support Excellence Framework</div>
            {[
              { t: "Respond within 2 hours",          d: "E-commerce benchmark for excellent support. Customers who wait >24h are 60% more likely to churn. First response time is the #1 CSAT driver." },
              { t: "Acknowledge → Empathise → Resolve", d: "The ACR framework: acknowledge the issue, empathise with the frustration, then focus entirely on the solution." },
              { t: "Never say 'unfortunately'",        d: "Replace 'unfortunately' with 'what I can do is' — it shifts the tone from passive-negative to proactive." },
              { t: "Offer before being asked",         d: "Don't wait for the customer to ask for compensation. Proactively offering a discount or express replacement builds trust." },
              { t: "Personalise every reply",          d: "Use the customer's first name. Reference their specific order. Avoid copy-paste responses — customers detect them immediately." },
              { t: "Close the loop",                   d: "Always end with a clear next step. 'I'll have this resolved by Tuesday. Reply if you have any other questions.'" },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5" }}>💡</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>CSAT Benchmarks by Ticket Type</div>
            {[
              { type: "Shipping enquiry",  csat: "94%", target: "< 2h response" },
              { type: "Refund/return",     csat: "88%", target: "Same-day resolution" },
              { type: "Product complaint", csat: "76%", target: "Proactive compensation" },
              { type: "Wrong item",        csat: "91%", target: "Express replacement" },
              { type: "Damaged item",      csat: "89%", target: "Immediate apology + replacement" },
            ].map(r => (
              <div key={r.type} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                <span style={{ color: "#e4e4e7", fontWeight: 600 }}>{r.type}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>Avg CSAT: {r.csat}</span>
                <span style={{ color: "#818cf8" }}>{r.target}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
