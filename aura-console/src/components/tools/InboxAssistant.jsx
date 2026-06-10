import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/inbox-assistant";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "reply",   label: "Reply Generator" },
  { id: "history", label: "Reply History" },
  { id: "tips",    label: "Writing Tips" },
];

const TONES = ["Professional", "Friendly", "Empathetic", "Firm", "Apologetic", "Concise"];
const CHANNELS = ["Email", "Live Chat", "SMS", "Social DM", "App Message"];

export default function InboxAssistant() {
  const [tab, setTab]       = useState("reply");
  const [message, setMessage] = useState("");
  const [tone, setTone]     = useState("Professional");
  const [channel, setChannel] = useState("Email");
  const [context, setContext] = useState("");
  const [reply, setReply]   = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [history, setHistory] = useState([]);

  const generate = async () => {
    if (!message.trim()) return;
    setLoading(true); setError(""); setReply("");
    const prompt = `Generate a ${tone.toLowerCase()} customer support reply for a Shopify store.

Channel: ${channel}
${context ? `Store context: ${context}` : ""}

Customer message:
"${message}"

Write only the reply, no preamble.`;
    try {
      const r = await apiFetchJSON(`${API}/ai/reply`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, channels: [channel.toLowerCase()] }),
      });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      setReply(r.reply || "");
      setAnalytics(r.analytics || null);
      setHistory(p => [{ message, tone, channel, reply: r.reply, ts: new Date().toISOString() }, ...p].slice(0, 20));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Inbox Assistant</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered inbox reply generator — paste any customer message and get a professional, on-brand response in seconds. Supports email, chat, SMS, and social DMs.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* REPLY GENERATOR */}
      {tab === "reply" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>CHANNEL</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {CHANNELS.map(ch => (
                    <button key={ch} style={{ ...S.btn(ch === channel ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setChannel(ch)}>{ch}</button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>TONE</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {TONES.map(t => (
                    <button key={t} style={{ ...S.btn(t === tone ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setTone(t)}>{t}</button>
                  ))}
                </div>
              </div>
            </div>
            <input style={{ ...S.input, width: "100%", marginBottom: 10 }} value={context} onChange={e => setContext(e.target.value)} placeholder="Optional: store/brand context (e.g. 'Premium skincare brand, strict 30-day return policy')" />
            <textarea style={{ ...S.ta, minHeight: 120 }} value={message} onChange={e => setMessage(e.target.value)} placeholder="Paste the customer's message here…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={generate} disabled={loading || !message.trim()}>{loading ? "Generating…" : "Generate Reply"}</button>
              {reply && <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setMessage("")}>Clear</button>}
            </div>
          </div>

          <ErrorBox message={error} />
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {reply && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI-Generated Reply — {tone} · {channel}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(reply)}>Copy Reply</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => { const b = new Blob([reply], { type: "text/plain" }); const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "reply.txt"; a.click(); }}>Export</button>
                </div>
              </div>
              <pre style={S.pre}>{reply}</pre>
              {analytics && (
                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  {Object.entries(analytics).map(([k, v]) => (
                    <div key={k} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "6px 12px", fontSize: 11 }}>
                      <span style={{ color: "#71717a", textTransform: "uppercase" }}>{k}: </span>
                      <span style={{ color: "#4f46e5", fontWeight: 700 }}>{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!reply && !loading && !error && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Example Messages to Try</div>
              {[
                { label: "Shipping complaint",   msg: "Hi, I ordered 2 weeks ago and my package still hasn't arrived. This is unacceptable — where is my order?!" },
                { label: "Refund request",        msg: "I received my order but the product doesn't match the description on the website. I want a full refund immediately." },
                { label: "Positive review offer", msg: "Just received my order and I absolutely love it! The quality is amazing. Is there anything I can do to support your brand?" },
                { label: "Discount negotiation", msg: "I really want to buy your product but $89 is a bit steep for me. Do you offer any student discounts?" },
              ].map(({ label, msg }) => (
                <div key={label} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setMessage(msg)}>Load</button>
                  <div><div style={{ fontSize: 12, fontWeight: 600, color: "#818cf8", marginBottom: 2 }}>{label}</div><div style={{ fontSize: 12, color: "#71717a" }}>{msg.slice(0, 80)}…</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          {history.length === 0 ? (
            <EmptyState icon="📬" title="No reply history yet" description="Generate replies to build a history here." />
          ) : (
            history.map((h, i) => (
              <div key={i} style={S.card}>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <span style={{ background: "#1e1b4b", color: "#818cf8", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{h.tone}</span>
                  <span style={{ background: "#18181b", color: "#a1a1aa", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, border: "1px solid #27272a" }}>{h.channel}</span>
                  <span style={{ fontSize: 11, color: "#52525b", marginLeft: "auto" }}>{new Date(h.ts).toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>Customer: {h.message.slice(0, 100)}{h.message.length > 100 ? "…" : ""}</div>
                <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{h.reply.slice(0, 200)}{h.reply.length > 200 ? "…" : ""}</div>
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(h.reply)}>Copy</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setMessage(h.message); setTone(h.tone); setChannel(h.channel); setTab("reply"); }}>Re-use</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TIPS */}
      {tab === "tips" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Writing Great Customer Replies</div>
            {[
              { t: "Start with the customer's name", d: "'Hi Sarah' beats 'Dear Customer' every time. Personalisation increases CSAT by up to 15%." },
              { t: "Acknowledge before solving", d: "Before jumping to solutions, acknowledge the frustration. 'I completely understand how frustrating this must be' builds immediate rapport." },
              { t: "Use active language", d: "Replace 'This will be investigated by our team' with 'I'll investigate this now and get back to you within 2 hours.'" },
              { t: "Avoid negative phrases", d: "Remove 'unfortunately', 'I can't', 'it's not possible'. Every sentence should move toward a solution." },
              { t: "Set specific expectations", d: "Don't say 'soon'. Say 'by Thursday 5pm'. Vague timelines erode trust." },
              { t: "End with an open door", d: "Close with 'Please don't hesitate to reach out if you have any other questions — I'm here to help.'" },
              { t: "Match the channel tone", d: "Email replies can be longer. Live chat and SMS replies should be shorter, warmer, more casual. Social DMs should match the brand voice on that platform." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5" }}>💬</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Tone Guide by Situation</div>
            {[
              { situation: "Order not received (< 14 days)",     tone: "Empathetic + Proactive",    note: "Acknowledge anxiety, check status, provide tracking, offer update timeline" },
              { situation: "Refund request (valid reason)",       tone: "Apologetic + Efficient",    note: "Approve quickly, no barriers, confirm timeline clearly" },
              { situation: "Refund request (outside policy)",     tone: "Firm but empathetic",       note: "Acknowledge, explain policy clearly, offer store credit alternative" },
              { situation: "Positive feedback",                   tone: "Warm + Enthusiastic",       note: "Thank genuinely, ask for review, offer loyalty reward" },
              { situation: "Aggressive/angry customer",           tone: "Professional + Calm",       note: "Never match aggression. Acknowledge, de-escalate, solve." },
            ].map(r => (
              <div key={r.situation} style={{ ...S.row, flexDirection: "column", alignItems: "flex-start" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#e4e4e7" }}>{r.situation}</div>
                <div style={{ fontSize: 12, color: "#818cf8", fontWeight: 600 }}>Tone: {r.tone}</div>
                <div style={{ fontSize: 12, color: "#71717a" }}>{r.note}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
