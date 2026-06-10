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

 const [input, setInput] = useState("");
 const [response, setResponse] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [history, setHistory] = useState([]);
 const [showOnboarding, setShowOnboarding] = useState(false);
 const [feedback, setFeedback] = useState("");
 const [imported, setImported] = useState(null);
 const [exported, setExported] = useState(null);
 const fileInputRef = useRef();

 // Run handler
 const handleRun = async () => {
 setLoading(true);
 setError("");
 setResponse("");
 try {
 const res = await fetch("/api/aura-operations-ai/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ prompt: input })
 });
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setResponse(data.reply || "No response");
 setHistory(prev => [{ input, reply: data.reply || "No response"}, ...prev].slice(0, 10));
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // Import/export handlers
 const handleImport = e => {
 const file = e.target.files[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = evt => {
 try {
 const importedHistory = JSON.parse(evt.target.result);
 setHistory(importedHistory);
 setImported(file.name);
 } catch (err) {
 setError("Invalid file format");
 }
 };
 reader.readAsText(file);
 };
 const handleExport = () => {
 const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json"});
 const url = URL.createObjectURL(blob);
 setExported(url);
 setTimeout(() =>URL.revokeObjectURL(url), 10000);
 };

 // Feedback handler
 const handleFeedback = async () => {
 if (!feedback) return;
 setError("");
 try {
 await fetch("/api/aura-operations-ai/feedback", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ feedback })
 });
 setFeedback("");
 } catch (err) {
 setError("Failed to send feedback");
 }
 };

 // Onboarding content
 const onboardingContent = (
 <div style={{ padding: 24, background: '#3f3f46', borderRadius: 12, marginBottom: 18, color: '#fafafa'}}>
 <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Aura Operations AI</h3>
 <ul style={{ margin: '16px 0 0 18px', color: '#52525b', fontSize: 16 }}>
 <li>Enter an operations question or task to get AI-powered solutions</li>
 <li>Review analytics, export results, and view history</li>
 <li>Accessible, secure, and fully compliant</li>
 </ul>
 <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: '#09090b', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer'}}>Get Started</button>
 </div>
 );

 // Main UI
 return (
 <div style={{ background: "#18181b", borderRadius: 16, boxShadow: "0 2px 16px #0008", padding: 32, color: '#fafafa'}}>
 <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Aura Operations AI</h2>
 <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide": "Show"} Onboarding</button>
 {showOnboarding && onboardingContent}
 <p style={{ color: "#444", marginBottom: 18 }}>
 Enter an operations question or task below. The AI will generate a suggested solution or workflow.
 </p>
 <textarea
 value={input}
 onChange={e => setInput(e.target.value)}
 rows={5}
 style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
 placeholder="Type your operations task here..."aria-label="AuraOperationsAI input"/>
 <button
 onClick={handleRun}
 disabled={loading || !input}
 style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 2px 12px #22d3ee55"}}
 >
 {loading ? "Running...": "Run Tool"}
 </button>
 {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
 {response && (
 <div style={{ marginTop: 32, background: "#3f3f46", borderRadius: 12, padding: 24, color: '#fafafa'}}>
 <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>AI Response:</div>
 <div style={{ fontSize: 16, color: "#09090b"}}>{response}</div>
 </div>
 )}

 {/* Import/Export */}
 <div style={{ marginTop: 24, marginBottom: 24 }}>
 <input type="file"accept="application/json"ref={fileInputRef} style={{ display: 'none'}} onChange={handleImport} />
 <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import History</button>
 <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer'}}>Export History</button>
 {imported && <span style={{ marginLeft: 12, color: '#4f46e5'}}>Imported: {imported}</span>}
 {exported && <a href={exported} download="aura-operations-ai-history.json"style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline'}}>Download Export</a>}
 </div>

 {/* History */}
 {history.length > 0 && (
 <div style={{ marginTop: 24, background: "#f4f4f5", borderRadius: 12, padding: 18 }}>
 <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Insights History</div>
 <ul style={{ paddingLeft: 18 }}>
 {history.map((h, i) => (
 <li key={i} style={{ marginBottom: 10 }}>
 <div><b>Input:</b> {h.input?.slice(0, 60)}{h.input?.length > 60 ? "...": ""}</div>
 <div><b>Reply:</b> {h.reply?.slice(0, 120)}{h.reply?.length > 120 ? "...": ""}</div>
 </li>
 ))}
 </ul>
 </div>
 )}

 {/* Accessibility & Compliance */}
 <div style={{ marginTop: 32, fontSize: 13, color: '#71717a', textAlign: 'center'}}>
 <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai"style={{ color: '#0ea5e9', textDecoration: 'underline'}}>Contact Support</a></span>
 </div>
 </div>
 );
}



