import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/aura-operations-ai";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "chat",    label: "Operations AI" },
  { id: "history", label: "History" },
  { id: "guide",   label: "Ops Guide" },
];

const QUICK_ACTIONS = [
  { label: "Fulfillment SOP",         prompt: "Create a standard operating procedure for order fulfilment from pick to dispatch." },
  { label: "Returns Process",         prompt: "Design an efficient returns and refund process for a Shopify store handling 50-100 returns per month." },
  { label: "Customer Service SLA",    prompt: "Create customer service SLA targets for a growing e-commerce brand: response times, resolution times, CSAT targets." },
  { label: "Inventory SOP",           prompt: "Create an inventory management SOP including stock counts, reorder procedures, and discrepancy handling." },
  { label: "Supplier Comms",          prompt: "Write a supplier communication template for requesting order status updates and ETA changes." },
  { label: "Scaling Checklist",       prompt: "What are the operational processes I need to formalise before scaling from £500k to £2M revenue?" },
];

export default function AuraOperationsAI() {
  const [tab, setTab]       = useState("chat");
  const [messages, setMessages] = useState([
    { role: "system", content: "You are an expert AI operations consultant for e-commerce businesses. Help with SOPs, process design, scaling operations, supplier management, fulfillment, customer service, and all operational aspects of running an online store." }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [history, setHistory] = useState([]);

  const visibleMessages = messages.filter(m => m.role !== "system");

  const send = async (overrideInput) => {
    const text = (overrideInput || input).trim();
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
      if (!r.ok) throw new Error(r.error || "Failed");
      const assistantMsg = { role: "assistant", content: r.reply };
      setMessages(p => [...p, assistantMsg]);
      setHistory(p => [{ userMsg: text, reply: r.reply, ts: new Date().toISOString() }, ...p].slice(0, 20));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Aura Operations AI</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered operations consultant for e-commerce — SOPs, process design, fulfillment workflows, supplier management, customer service frameworks, and scaling playbooks.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "chat" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {QUICK_ACTIONS.map(qa => (
              <button key={qa.label} style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => send(qa.prompt)}>{qa.label}</button>
            ))}
          </div>
          <div style={{ background: "#0d0d0f", border: "1px solid #27272a", borderRadius: 14, padding: "16px 20px", minHeight: 280, maxHeight: 480, overflowY: "auto", marginBottom: 12 }}>
            {visibleMessages.length === 0 ? (
              <div style={{ color: "#52525b", fontSize: 13, textAlign: "center", padding: "50px 0" }}>Use a Quick Action above or type your operations question below.</div>
            ) : (
              visibleMessages.map((m, i) => (
                <div key={i} style={{ display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 10, marginBottom: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: m.role === "user" ? "#4f46e5" : "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {m.role === "user" ? "👤" : "⚙️"}
                  </div>
                  <div style={{ maxWidth: "80%", background: m.role === "user" ? "#1e1b4b" : "#18181b", border: `1px solid ${m.role === "user" ? "#3730a3" : "#27272a"}`, borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.content}</div>
                    {m.role === "assistant" && <button onClick={() => navigator.clipboard?.writeText(m.content)} style={{ marginTop: 6, background: "transparent", border: "1px solid #3f3f46", borderRadius: 5, padding: "2px 8px", fontSize: 11, color: "#71717a", cursor: "pointer" }}>Copy</button>}
                  </div>
                </div>
              ))
            )}
            {loading && <div style={{ display: "flex", gap: 10, alignItems: "center" }}><div style={{ width: 32, height: 32, borderRadius: "50%", background: "#166534", display: "flex", alignItems: "center", justifyContent: "center" }}>⚙️</div><div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 14px" }}><Spinner size={16} /></div></div>}
          </div>
          <ErrorBox message={error} />
          <div style={{ display: "flex", gap: 8 }}>
            <textarea style={{ ...S.ta, minHeight: 56, maxHeight: 120, flex: 1 }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Ask about operations, SOPs, processes, or scaling… (Enter to send)" />
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <button style={S.btn("primary")} onClick={() => send()} disabled={loading || !input.trim()}>Send</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 10px" }} onClick={() => { setMessages([messages[0]]); setError(""); }}>New Chat</button>
            </div>
          </div>
        </div>
      )}

      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          {history.length === 0 ? (
            <EmptyState icon="⚙️" title="No history yet" description="Start a conversation to build a history." />
          ) : (
            history.map((h, i) => (
              <div key={i} style={S.card}>
                <div style={{ fontSize: 11, color: "#52525b", marginBottom: 6 }}>{new Date(h.ts).toLocaleString()}</div>
                <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 600, marginBottom: 4 }}>{h.userMsg.slice(0, 100)}{h.userMsg.length > 100 ? "…" : ""}</div>
                <div style={{ fontSize: 12, color: "#a1a1aa" }}>{h.reply.slice(0, 200)}{h.reply.length > 200 ? "…" : ""}</div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Operations Excellence Framework</div>
            {[
              { t: "Document before you scale",      d: "Every process you rely on must be documented before you hire. Undocumented processes create inconsistency and are impossible to delegate effectively." },
              { t: "Fulfillment is your brand",       d: "Customers judge you by how their order arrives. Packaging, accuracy, speed, and tracking communication all shape brand perception." },
              { t: "Build metrics before you optimise", d: "You can't improve what you don't measure. Track: orders fulfilled per day, error rate, return rate, dispatch-to-delivery time, CSAT." },
              { t: "The 80/20 of ops bottlenecks",   d: "80% of operational problems come from 3 areas: inventory accuracy, supplier reliability, and return handling. Fix these first." },
              { t: "Customer service is ops",         d: "CS ticket volume is a lagging indicator of operational failures. High 'where is my order' tickets = fulfilment/comms problem. Fix ops, not just CS." },
              { t: "Automate repetitive, humanise exceptions", d: "Automate: order confirmations, tracking emails, reorder triggers. Human touch: complaints, high-value customers, complex issues." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>⚙️</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
