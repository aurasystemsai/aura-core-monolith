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
const API = "/api/abandoned-checkout-winback";

export default function AbandonedCheckoutWinback() {
  const [status, setStatus] = useState(null);
  const [checkouts, setCheckouts] = useState(null);
  const [sel, setSel] = useState(null);
  const [tone, setTone] = useState("friendly");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const run = (n, u, o) => { setNotice(""); return call(setBusy, setError, n, API + u, o); };
  const post = (b) => ({ method: "POST", body: JSON.stringify(b) });

  const load = async () => {
    const [s, c] = await Promise.all([run("load", "/status"), run("load", "/checkouts")]);
    if (s) setStatus(s); if (c) setCheckouts(c.checkouts);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const pick = (c) => { setSel(c); setSubject(""); setBody(""); };
  async function write() { const r = await run("gen", "/preview", post({ checkoutId: sel.id, tone })); if (r) { setSubject(r.email.subject); setBody(r.email.bodyHtml); } }
  async function send(test) {
    if (!test && !window.confirm(`Email ${sel.email} now?`)) return;
    const r = await run("send", "/send", post({ checkoutId: sel.id, subject, bodyHtml: body, ...(test ? { testTo } : { confirm: true }) }));
    if (r) { setNotice(r.sent ? (test ? `Test sent to ${r.to}.` : `Sent to ${r.to}.`) : "Preview only: email sending is not set up on the server."); if (!test) load(); }
  }

  return (
    <div style={S.root}>
      <h1 style={S.title}>Abandoned Checkout Winback</h1>
      <p style={S.subtitle}>Real abandoned checkouts from your store. AI writes a reminder from the actual cart; the return-to-cart link is added automatically. Shoppers are only emailed if they agreed to marketing.</p>
      {error && <div style={S.error}>{error}</div>}
      {notice && <div style={S.ok}>{notice}</div>}
      {status && !status.sending && <div style={S.warn}>Email sending is not set up on the server yet, so tests are previews only.</div>}

      <div style={S.card}>
        <h2 style={S.h}>Abandoned checkouts</h2>
        {checkouts === null ? <div style={S.empty}>Loading…</div> : checkouts.length === 0 ? <div style={S.empty}>No abandoned checkouts right now. When a shopper leaves without paying, they appear here.</div> :
          checkouts.map((c) => (
            <div key={c.id} style={{ ...S.row, cursor: "pointer", borderColor: sel && sel.id === c.id ? "#6366f1" : "#27272a" }} onClick={() => pick(c)}>
              <span>{c.firstName || c.email || "Unknown shopper"} <span style={S.muted}>· {c.items.map((i) => `${i.quantity}× ${i.title}`).join(", ") || "no items"}</span></span>
              <span style={S.muted}>{c.total} · {c.canEmail ? "can email" : "no marketing consent"}{c.lastSentAt ? " · emailed" : ""}</span>
            </div>
          ))}
      </div>

      {sel && (
        <div style={S.card}>
          <h2 style={S.h}>Reminder for {sel.firstName || sel.email || "this shopper"}</h2>
          <select style={S.input} value={tone} onChange={(e) => setTone(e.target.value)}>{["friendly", "professional", "playful", "urgent but polite"].map((t) => <option key={t}>{t}</option>)}</select>
          <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={write}>{busy === "gen" ? "Writing…" : "AI write reminder (2 credits)"}</button>
          <div style={{ marginTop: 14 }}>
            <input style={S.input} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
            <textarea style={S.ta} placeholder="Message" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <input style={S.input} placeholder="Your email, to send yourself a test" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          <button style={{ ...S.ghost, ...(busy || !subject.trim() || !body.trim() || !testTo.trim() ? S.off : {}) }} disabled={!!busy || !subject.trim() || !body.trim() || !testTo.trim()} onClick={() => send(true)}>Send test to me</button>
          <button style={{ ...S.btn, ...(busy || !subject.trim() || !body.trim() || !sel.canEmail || !(status && status.sending) ? S.off : {}) }} disabled={!!busy || !subject.trim() || !body.trim() || !sel.canEmail || !(status && status.sending)} onClick={() => send(false)}>Send to shopper</button>
          {!sel.canEmail && <p style={S.muted}>This shopper has not agreed to marketing emails, so sending is disabled.</p>}
        </div>
      )}
    </div>
  );
}
