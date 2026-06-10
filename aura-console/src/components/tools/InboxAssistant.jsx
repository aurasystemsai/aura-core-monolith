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

 const [input, setInput] = useState("");
 const [response, setResponse] = useState("");
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [bulkUpload, setBulkUpload] = useState(null);
 const [channels, setChannels] = useState({ email: true, sms: false, chat: false, web: false, api: false });
 const [aiModel, setAiModel] = useState("gpt-4");
 const [analytics, setAnalytics] = useState(null);
 const [history, setHistory] = useState([]);
 const [darkMode, setDarkMode] = useState(false);
 const [collaborators, setCollaborators] = useState("");
 const [accessLevel, setAccessLevel] = useState("writer");
 const [privacy, setPrivacy] = useState("private");
 const [compliance, setCompliance] = useState({ gdpr: true, ccpa: false });
 const [notification, setNotification] = useState("");
 const [feedback, setFeedback] = useState("");
 const [reportUrl, setReportUrl] = useState("");
 const [education, setEducation] = useState("");

 const handleRun = async () => {
 setLoading(true);
 setError("");
 setResponse("");
 setAnalytics(null);
 setNotification("");
 try {
 const res = await fetch("/api/inbox-assistant/ai/reply", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({
 message: input,
 bulkUpload,
 channels,
 aiModel,
 collaborators,
 accessLevel,
 privacy,
 compliance,
 education
 })
 });
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setResponse(data.reply || "No response");
 setAnalytics(data.analytics || null);
 setNotification("Reply generated and saved.");
 setHistory(prev => [{
 message: input,
 bulkUpload,
 channels,
 aiModel,
 collaborators,
 accessLevel,
 privacy,
 compliance,
 education,
 reply: data.reply || "No response",
 analytics: data.analytics || null
 }, ...prev].slice(0, 10));
 setReportUrl(window.location.origin + window.location.pathname + "?reply="+ encodeURIComponent(data.reply || ""));
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 const handleExport = () => {
 if (!response) return;
 const blob = new Blob([response], { type: "text/plain"});
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = "inbox-assistant-reply.txt";
 a.click();
 URL.revokeObjectURL(url);
 };

 const handleShare = () => {
 if (!reportUrl) return;
 navigator.clipboard.writeText(reportUrl);
 setNotification("Share link copied!");
 setTimeout(() => setNotification("Reply generated and saved."), 2000);
 };

 const handleFeedback = async () => {
 if (!feedback) return;
 setNotification("Sending feedback...");
 try {
 await fetch("/api/inbox-assistant/feedback", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ feedback })
 });
 setNotification("Feedback sent. Thank you!");
 setFeedback("");
 } catch {
 setNotification("Failed to send feedback");
 }
 };

 return (
 <div
 style={{
 
 margin: "40px auto",
 background: darkMode ? "#09090b": "#fff",
 color: darkMode ? "#f4f4f5": "#09090b",
 borderRadius: 16,
 boxShadow: "0 2px 16px #0001",
 padding: 32,
 fontFamily: "Inter, Arial, sans-serif"}}
 aria-live="polite">
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center"}}>
 <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Inbox Assistant</h2>
 <button
 aria-label="Toggle dark mode"onClick={() => setDarkMode(d => !d)}
 style={{ background: darkMode ? "#f4f4f5": "#09090b", color: darkMode ? "#09090b": "#f4f4f5", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 15, cursor: "pointer"}}
 >
 {darkMode ? "Light": "Dark"}
 </button>
 </div>
 <p style={{ color: darkMode ? "#e0e7ff": "#444", marginBottom: 18 }}>
 Enter an inbox message below. The AI will generate a suggested reply. <span style={{ fontWeight: 600 }}>All features are fully accessible.</span>
 </p>
 <textarea
 value={input}
 onChange={e => setInput(e.target.value)}
 rows={5}
 style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555": "1px solid #ccc", marginBottom: 18, background: darkMode ? "#09090b": "#fff", color: darkMode ? "#f4f4f5": "#09090b"}}
 placeholder="Type your inbox message here..."aria-label="Inbox message input"/>
 <div style={{ marginBottom: 18 }}>
 <label style={{ fontWeight: 600, marginRight: 12 }}>Bulk Upload:</label>
 <input type="file"accept=".csv,.xlsx"onChange={e => setBulkUpload(e.target.files[0])} style={{ marginLeft: 8 }} />
 <label style={{ fontWeight: 600, marginLeft: 18 }}>Channels:</label>
 {Object.keys(channels).map((ch, i) => (
 <label key={ch} style={{ marginLeft: i === 0 ? 0 : 12 }}><input type="checkbox"checked={channels[ch]} onChange={e => setChannels(c => ({ ...c, [ch]: e.target.checked }))} /> {ch.charAt(0).toUpperCase() + ch.slice(1)}</label>
 ))}
 </div>
 <div style={{ marginBottom: 18 }}>
 <label style={{ fontWeight: 600, marginRight: 12 }}>AI Model:</label>
 <select value={aiModel} onChange={e => setAiModel(e.target.value)} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555": "1px solid #ccc"}}>
 <option value="gpt-4">GPT-4</option>
 <option value="gemini">Gemini</option>
 <option value="custom">Custom</option>
 </select>
 <label style={{ fontWeight: 600, marginLeft: 18 }}>Collaborators:</label>
 <input type="text"value={collaborators} onChange={e => setCollaborators(e.target.value)} placeholder="Emails, comma separated"style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555": "1px solid #ccc"}} />
 <label style={{ fontWeight: 600, marginLeft: 18 }}>Access Level:</label>
 <select value={accessLevel} onChange={e => setAccessLevel(e.target.value)} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555": "1px solid #ccc", marginLeft: 8 }}>
 <option value="writer">Writer</option>
 <option value="editor">Editor</option>
 <option value="reviewer">Reviewer</option>
 <option value="admin">Admin</option>
 </select>
 </div>
 <div style={{ marginBottom: 18 }}>
 <label style={{ fontWeight: 600, marginRight: 12 }}>Privacy:</label>
 <select value={privacy} onChange={e => setPrivacy(e.target.value)} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555": "1px solid #ccc"}}>
 <option value="private">Private</option>
 <option value="public">Public</option>
 </select>
 <label style={{ fontWeight: 600, marginLeft: 18 }}>Compliance:</label>
 <label><input type="checkbox"checked={compliance.gdpr} onChange={e => setCompliance(c => ({ ...c, gdpr: e.target.checked }))} />GDPR</label>
 <label style={{ marginLeft: 12 }}><input type="checkbox"checked={compliance.ccpa} onChange={e => setCompliance(c => ({ ...c, ccpa: e.target.checked }))} />CCPA</label>
 </div>
 <div style={{ marginBottom: 18 }}>
 <label style={{ fontWeight: 600, marginRight: 12 }}>Education:</label>
 <input type="text"value={education} onChange={e => setEducation(e.target.value)} placeholder="Inbox topic or question"style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555": "1px solid #ccc"}} />
 </div>
 <button
 onClick={handleRun}
 disabled={loading || !input}
 style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 2px 12px #22d3ee55", marginRight: 12 }}
 aria-label="Run reply">
 {loading ? "Running...": "Run Tool"}
 </button>
 <button
 onClick={handleExport}
 disabled={!response}
 style={{ background: "#e0e7ff", color: "#09090b", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: response ? "pointer": "not-allowed", marginRight: 12 }}
 aria-label="Export reply">
 Export
 </button>
 <button
 onClick={handleShare}
 disabled={!reportUrl}
 style={{ background: "#bae6fd", color: "#09090b", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: reportUrl ? "pointer": "not-allowed", marginRight: 12 }}
 aria-label="Share reply">
 Share
 </button>
 <button
 onClick={() => setInput("")}
 style={{ background: "#fca5a5", color: "#09090b", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer"}}
 aria-label="Reset">
 Reset
 </button>
 {notification && (
 <div style={{ color: "#0af", marginTop: 12, fontWeight: 600 }}>{notification}</div>
 )}
 {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
 {analytics && (
 <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap"}}>
 <div style={{ background: "#27272a", borderRadius: 10, padding: "12px 20px", border: "1px solid #27272a"}}>
 <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Replies Sent</div>
 <div style={{ fontSize: 26, fontWeight: 800, color: "#4f46e5", marginTop: 2 }}>{history.length}</div>
 </div>
 </div>
 )}
 {response && (
 <div style={{ marginTop: 32, background: darkMode ? "#09090b": "#fafafa", borderRadius: 12, padding: 24 }}>
 <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>AI Response:</div>
 <div style={{ fontSize: 16, color: darkMode ? "#e0e7ff": "#09090b"}}>{response}</div>
 </div>
 )}
 {history.length > 0 && (
 <div style={{ marginTop: 32, background: darkMode ? "#09090b": "#fafafa", borderRadius: 12, padding: 20 }}>
 <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Reply History</div>
 <ul style={{ paddingLeft: 18 }}>
 {history.map((h, i) => (
 <li key={i} style={{ marginBottom: 10 }}>
 <div><b>Message:</b> {h.message.slice(0, 60)}{h.message.length > 60 ? "...": ""}</div>
 <div><b>Bulk Upload:</b> {h.bulkUpload ? h.bulkUpload.name : "-"}</div>
 <div><b>Channels:</b> {Object.keys(h.channels).filter(k => h.channels[k]).join(", ")}</div>
 <div><b>AI Model:</b> {h.aiModel}</div>
 <div><b>Collaborators:</b> {h.collaborators}</div>
 <div><b>Access Level:</b> {h.accessLevel}</div>
 <div><b>Privacy:</b> {h.privacy}</div>
 <div><b>Compliance:</b> {Object.keys(h.compliance).filter(k => h.compliance[k]).join(", ")}</div>
 <div><b>Education:</b> {h.education}</div>
 <div><b>Analytics:</b> {h.analytics ? JSON.stringify(h.analytics) : "-"}</div>
 <div><b>Reply:</b> {h.reply.slice(0, 60)}{h.reply.length > 60 ? "...": ""}</div>
 </li>
 ))}
 </ul>
 </div>
 )}
 </div>
 );
}



