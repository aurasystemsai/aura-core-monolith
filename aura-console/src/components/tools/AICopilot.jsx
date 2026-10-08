import React, { useEffect, useRef, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", marginBottom: 10 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 999, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginRight: 8, marginBottom: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/ai-copilot";

export default function AICopilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [prompts, setPrompts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const end = useRef(null);

  useEffect(() => { apiFetchJSON(API + "/prompts").then((r) => r && r.ok && setPrompts(r.prompts)).catch(() => {}); }, []);
  useEffect(() => { if (end.current && end.current.scrollIntoView) end.current.scrollIntoView({ block: "end" }); }, [messages, busy]);

  async function send(text) {
    const message = (text || input).trim();
    if (!message || busy) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: message }]); setInput(""); setError(""); setBusy(true);
    try {
      const r = await apiFetchJSON(API + "/chat", { method: "POST", body: JSON.stringify({ message, history }) });
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      setMessages((m) => [...m, { role: "assistant", content: r.reply, asOf: r.dataAsOf }]);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }

  return (
    <div style={S.root}>
      <h1 style={S.title}>AI Copilot</h1>
      <p style={S.subtitle}>Ask questions about your store. It answers from a live look at your real products, stock and the last 60 days of sales, and says so when it doesn't know. It only reads; it never changes anything. 2 credits per answer.</p>
      {error && <div style={S.error}>{error}</div>}
      <div style={S.card}>
        <div style={{ minHeight: 220, maxHeight: 460, overflowY: "auto", marginBottom: 12 }}>
          {messages.length === 0 && (
            <div>
              <div style={S.empty}>Try one of these:</div>
              <div style={{ textAlign: "center" }}>{prompts.map((p) => <button key={p} style={S.ghost} onClick={() => send(p)}>{p}</button>)}</div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 10 }}>
              <div style={{ maxWidth: "78%", whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.5, padding: "9px 13px", borderRadius: 12, background: m.role === "user" ? "#4f46e5" : "#27272a", color: "#fafafa" }}>
                {m.content}
                {m.asOf && <div style={{ ...S.muted, marginTop: 4 }}>Store data as of {new Date(m.asOf).toLocaleTimeString()}</div>}
              </div>
            </div>
          ))}
          {busy && <div style={S.muted}>Thinking…</div>}
          <div ref={end} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={{ ...S.input, marginBottom: 0 }} placeholder="Ask about your products, stock or sales" maxLength={1000} value={input} disabled={busy} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} aria-label="Your question" />
          <button style={{ ...S.btn, marginRight: 0, ...(busy || !input.trim() ? S.off : {}) }} disabled={busy || !input.trim()} onClick={() => send()}>Ask</button>
        </div>
      </div>
    </div>
  );
}