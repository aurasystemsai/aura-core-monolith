import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", marginBottom: 10 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "8px 14px", fontSize: 12, cursor: "pointer", marginRight: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 10px", border: "1px solid #27272a", borderRadius: 8, marginBottom: 6, fontSize: 13 },
  pill: { background: "#27272a", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "#d4d4d8", display: "inline-block", margin: "0 6px 6px 0" },
  ta: { background: '#09090b', border: '1px solid #3f3f46', borderRadius: 8, color: '#fafafa', padding: '9px 12px', fontSize: 13, width: '100%', boxSizing: 'border-box', marginBottom: 10, minHeight: 140, fontFamily: 'inherit' },
  ok: { background: '#052e16', border: '1px solid #166534', color: '#86efac', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 },
  warn: { background: '#1c1407', border: '1px solid #854d0e', color: '#fcd34d', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 },
  muted: { color: "#71717a", fontSize: 12 },
};

async function call(setBusy, setError, name, url, options) {
  setBusy(name); setError("");
  try {
    const r = await apiFetchJSON(url, options);
    if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
    return r;
  } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
}
const API = "/api/sms-whatsapp-marketing";

export default function SMSWhatsAppMarketing() {
  const [status, setStatus] = useState(null);
  const [audience, setAudience] = useState(null);
  const [campaigns, setCampaigns] = useState(null);
  const [goal, setGoal] = useState("");
  const [options, setOptions] = useState([]);
  const [text, setText] = useState("");
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const run = (n, u, o) => { setNotice(""); return call(setBusy, setError, n, API + u, o); };
  const post = (b) => ({ method: "POST", body: JSON.stringify(b) });

  const refresh = async () => {
    const [s, a, c] = await Promise.all([run("load", "/status"), run("load", "/audience"), run("load", "/campaigns")]);
    if (s) setStatus(s); if (a) setAudience(a); if (c) setCampaigns(c.campaigns);
  };
  useEffect(() => { refresh(); }, []); // eslint-disable-line

  async function generate() { const r = await run("gen", "/generate", post({ goal })); if (r) { setOptions(r.messages); setText(r.messages[0]); } }
  async function sendTest() {
    const r = await run("test", "/send-test", post({ to: testTo, body: text }));
    if (r) setNotice(r.sent ? `Test text sent to ${r.to}.` : "Preview only: text sending is not set up on the server, so nothing was sent.");
  }
  async function sendAll() {
    if (!window.confirm(`Text ${audience ? audience.subscribed : 0} subscribed customers? This cannot be undone.`)) return;
    const r = await run("send", "/send", post({ body: text, confirm: true }));
    if (r) { setNotice(`Sent to ${r.sent} of ${r.recipients} customers.`); refresh(); }
  }
  const live = status && status.sending;

  return (
    <div style={S.root}>
      <h1 style={S.title}>SMS Marketing</h1>
      <p style={S.subtitle}>AI writes short texts from your real products. Test on your own phone first, then text customers who agreed to SMS marketing. "Reply STOP to opt out" is added automatically.</p>
      {error && <div style={S.error}>{error}</div>}
      {notice && <div style={S.ok}>{notice}</div>}
      {status && !live && <div style={S.warn}>Text sending is not set up on the server yet, so tests are previews only.</div>}

      <div style={S.card}>
        <h2 style={S.h}>1. Write it</h2>
        <input style={S.input} placeholder="What is the text for? e.g. New mugs are in" value={goal} onChange={(e) => setGoal(e.target.value)} />
        <button style={{ ...S.btn, ...(busy || !goal.trim() ? S.off : {}) }} disabled={!!busy || !goal.trim()} onClick={generate}>{busy === "gen" ? "Writing…" : "AI write 3 options (1 credit)"}</button>
        <div style={{ marginTop: 12 }}>{options.map((o) => <button key={o} style={S.ghost} onClick={() => setText(o)}>{o.slice(0, 40)}…</button>)}</div>
        <textarea style={{ ...S.ta, minHeight: 80, marginTop: 10 }} maxLength={160} placeholder="Your message (max 160 characters)" value={text} onChange={(e) => setText(e.target.value)} />
        <div style={S.muted}>{text.length}/160</div>
      </div>

      <div style={S.card}>
        <h2 style={S.h}>2. Test it</h2>
        <input style={S.input} placeholder="Your mobile, international format e.g. +447960000000" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
        <button style={{ ...S.btn, ...(busy || !text.trim() || !testTo.trim() ? S.off : {}) }} disabled={!!busy || !text.trim() || !testTo.trim()} onClick={sendTest}>{busy === "test" ? "Sending…" : "Send test to me"}</button>
      </div>

      <div style={S.card}>
        <h2 style={S.h}>3. Send to customers</h2>
        <p style={S.muted}>{audience ? `${audience.subscribed} customer${audience.subscribed === 1 ? "" : "s"} have agreed to SMS marketing.` : "Checking your audience…"}</p>
        <button style={{ ...S.btn, ...(busy || !text.trim() || !audience || !audience.subscribed || !live ? S.off : {}) }} disabled={!!busy || !text.trim() || !audience || !audience.subscribed || !live} onClick={sendAll}>{busy === "send" ? "Sending…" : "Send to subscribers"}</button>
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Sent campaigns</h2>
        {campaigns === null ? <div style={S.empty}>Loading…</div> : campaigns.length === 0 ? <div style={S.empty}>Nothing sent yet.</div> :
          campaigns.map((c) => <div key={c.id} style={S.row}><span>{c.body}</span><span style={S.muted}>{new Date(c.at).toLocaleString()} · {c.sent}/{c.recipients}</span></div>)}
      </div>
    </div>
  );
}
