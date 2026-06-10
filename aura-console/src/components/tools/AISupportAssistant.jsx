import React, { useState, useRef, useEffect } from "react";
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
  { id: "history",   label: "History" },
  { id: "guide",     label: "Support Guide" },
];

const QUICK_ACTIONS = [
  { label: "Order not received", prompt: "Customer says their order has not arrived after 10 days. How should I respond?" },
  { label: "Refund request",     prompt: "Customer is requesting a full refund for an item they are unhappy with. Draft a response that is empathetic and explains my policy." },
  { label: "Wrong item sent",    prompt: "Customer received the wrong item. How should I handle this and what should I offer?" },
  { label: "Item damaged",       prompt: "Customer received a damaged item. Draft a professional, empathetic reply and outline next steps." },
  { label: "Discount request",   prompt: "Customer is asking for a discount code. How should I respond in a way that retains them without devaluing my brand?" },
  { label: "Cancel order",       prompt: "Customer wants to cancel their order which has already been dispatched. What are my options and how should I communicate this?" },
];

export default function AISupportAssistant() {
  const [tab, setTab]         = useState("chat");
  const [messages, setMessages] = useState([
    { role: "system", content: "You are an expert AI support assistant for e-commerce merchants using Shopify. Help draft professional, empathetic customer service responses. Be concise and actionable." }
  ]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [history, setHistory] = useState([]);
  const [templates, setTemplates] = useState([
    { name: "Thank you for your order", body: "Thank you so much for your order! We're thrilled to have your support. Your order is being processed and you'll receive a shipping confirmation soon. Please don't hesitate to reach out if you have any questions." },
    { name: "Order delay apology",      body: "We sincerely apologise for the delay with your order. We're experiencing higher-than-usual demand and your order is taking a little longer than expected. We expect it to ship within [X] business days. Thank you so much for your patience." },
    { name: "Review request",            body: "Hi [Name], we hope you're loving your recent purchase! If you have a moment, we'd really appreciate it if you could leave us a quick review. Your feedback helps us improve and helps other customers make informed decisions. Thank you!" },
  ]);
  const [newTpl, setNewTpl]   = useState({ name: "", body: "" });
  const messagesEndRef         = useRef(null);

  const visibleMessages = messages.filter(m => m.role !== "system");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (overrideInput) => {
    const text = overrideInput || input.trim();
    if (!text) return;
    const userMsg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true); setError("");
    try {
      const r = await apiFetchJSON(`${API}/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      const assistantMsg = { role: "assistant", content: r.reply };
      setMessages(p => [...p, assistantMsg]);
      setHistory(p => [{ userMsg: text, reply: r.reply, ts: new Date().toISOString() }, ...p].slice(0, 20));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const newConversation = () => {
    setMessages([messages[0]]); // keep system message
    setError("");
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "support-history.json"; a.click();
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>AI Support Assistant</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered customer service co-pilot — draft professional replies, handle difficult situations, manage templates and maintain consistency across your support team.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* CHAT */}
      {tab === "chat" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {QUICK_ACTIONS.map(qa => (
              <button key={qa.label} style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => send(qa.prompt)}>{qa.label}</button>
            ))}
          </div>

          {/* Chat window */}
          <div style={{ background: "#0d0d0f", border: "1px solid #27272a", borderRadius: 14, padding: "16px 20px", minHeight: 300, maxHeight: 500, overflowY: "auto", marginBottom: 14 }}>
            {visibleMessages.length === 0 ? (
              <div style={{ color: "#52525b", fontSize: 13, textAlign: "center", padding: "60px 0" }}>
                Start a conversation or use a Quick Action above.<br />
                <span style={{ fontSize: 12, color: "#3f3f46" }}>Type a customer message or scenario to get a suggested response.</span>
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
                      <button onClick={() => navigator.clipboard?.writeText(m.content)} style={{ marginTop: 6, background: "transparent", border: "1px solid #3f3f46", borderRadius: 5, padding: "2px 8px", fontSize: 11, color: "#71717a", cursor: "pointer" }}>Copy</button>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#166534", display: "flex", alignItems: "center", justifyContent: "center" }}>🤖</div>
                <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 14px" }}><Spinner size={16} /></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <ErrorBox message={error} />

          <div style={{ display: "flex", gap: 8 }}>
            <textarea
              style={{ ...S.ta, minHeight: 60, maxHeight: 120, flex: 1 }}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder="Describe the customer's issue or paste their message… (Enter to send, Shift+Enter for newline)"
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button style={S.btn("primary")} onClick={() => send()} disabled={loading || !input.trim()}>Send</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={newConversation}>New Chat</button>
            </div>
          </div>
        </div>
      )}

      {/* TEMPLATES */}
      {tab === "templates" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Template</div>
            <input style={{ ...S.input, width: "100%", marginBottom: 8 }} value={newTpl.name} onChange={e => setNewTpl(p => ({ ...p, name: e.target.value }))} placeholder="Template name" />
            <textarea style={{ ...S.ta, minHeight: 80, marginBottom: 8 }} value={newTpl.body} onChange={e => setNewTpl(p => ({ ...p, body: e.target.value }))} placeholder="Response template body…" />
            <button style={S.btn("primary")} onClick={() => { if (newTpl.name && newTpl.body) { setTemplates(p => [...p, newTpl]); setNewTpl({ name: "", body: "" }); } }}>Save Template</button>
          </div>
          {templates.map((tpl, i) => (
            <div key={i} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#e4e4e7" }}>{tpl.name}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn("primary"), fontSize: 11, padding: "4px 10px" }} onClick={() => { setInput(tpl.body); setTab("chat"); }}>Use in Chat</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(tpl.body)}>Copy</button>
                  <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => setTemplates(p => p.filter((_, idx) => idx !== i))}>Delete</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>{tpl.body}</div>
            </div>
          ))}
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{history.length} conversations</div>
            {history.length > 0 && <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={exportHistory}>Export History</button>}
          </div>
          {history.length === 0 ? (
            <EmptyState icon="💬" title="No conversation history yet" description="Start chatting to build a history of support interactions." />
          ) : (
            history.map((h, i) => (
              <div key={i} style={S.card}>
                <div style={{ fontSize: 12, color: "#52525b", marginBottom: 8 }}>{new Date(h.ts).toLocaleString()}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 4 }}>Q: {h.userMsg.slice(0, 100)}{h.userMsg.length > 100 ? "…" : ""}</div>
                <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>A: {h.reply.slice(0, 200)}{h.reply.length > 200 ? "…" : ""}</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", marginTop: 8 }} onClick={() => { setInput(h.userMsg); setTab("chat"); }}>Re-use</button>
              </div>
            ))
          )}
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Customer Support Excellence Framework</div>
            {[
              { t: "Respond within 2 hours", d: "E-commerce benchmark for excellent support. Customers who wait longer than 24 hours are 60% more likely to churn. First response time is the #1 CSAT driver." },
              { t: "Acknowledge → Empathise → Resolve", d: "The ACR framework: start by acknowledging the issue ('I completely understand'), empathise with the frustration, then focus on the solution." },
              { t: "Never say 'unfortunately'", d: "Replace 'unfortunately' with 'what I can do is' — it immediately shifts the tone from negative/passive to proactive and solution-focused." },
              { t: "Offer before being asked", d: "Don't wait for the customer to ask for compensation. Proactively offering a discount, free shipping on next order, or express replacement builds trust." },
              { t: "Personalise every reply", d: "Use the customer's first name. Reference their specific order. Avoid copy-paste responses that feel generic — customers can tell immediately." },
              { t: "Close the loop", d: "Always end with a clear next step and invite follow-up. 'I'll have this resolved by Tuesday. Please reply if you have any other questions.'" },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", fontSize: 15 }}>💡</span>
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
