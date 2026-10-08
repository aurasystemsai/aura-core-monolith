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
const API = "/api/review-ugc-engine";
const STAR = (n) => "★".repeat(n) + "☆".repeat(5 - n);
const BADGE = { pending: "#fcd34d", approved: "#86efac", rejected: "#fca5a5" };

export default function ReviewUGCEngine() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState({ productTitle: "", author: "", rating: 5, text: "" });
  const [bulk, setBulk] = useState("");
  const [drafts, setDrafts] = useState({});
  const [insights, setInsights] = useState(null);
  const [req, setReq] = useState(null);
  const [testTo, setTestTo] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const run = (n, u, o) => { setNotice(""); return call(setBusy, setError, n, API + u, o); };
  const post = (b, m = "POST") => ({ method: m, body: JSON.stringify(b) });

  const refresh = async () => {
    const [r, s] = await Promise.all([run("load", "/reviews"), run("load", "/status")]);
    if (r) setData(r); if (s) setStatus(s);
  };
  useEffect(() => { refresh(); }, []); // eslint-disable-line

  async function add() {
    const r = await run("add", "/reviews", post({ ...form, rating: Number(form.rating) }));
    if (r) { setForm({ productTitle: "", author: "", rating: 5, text: "" }); refresh(); }
  }
  async function importBulk() {
    // One review per line: rating | author | text
    const rows = bulk.split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p.length >= 3).map((p) => ({ rating: Number(p[0]), author: p[1], text: p.slice(2).join("|") }));
    const r = await run("import", "/reviews/import", post({ reviews: rows }));
    if (r) { setBulk(""); setNotice(`Added ${r.added} review(s)${r.skipped ? `, skipped ${r.skipped}` : ""}.`); refresh(); }
  }
  async function setReviewStatus(id, s) { await run("st", `/reviews/${id}/status`, post({ status: s })); refresh(); }
  async function remove(id) { if (window.confirm("Delete this review?")) { await run("rm", `/reviews/${id}`, { method: "DELETE" }); refresh(); } }
  async function draft(id) { const r = await run("draft:" + id, `/reviews/${id}/reply`, post({})); if (r) setDrafts((d) => ({ ...d, [id]: r.draft })); }
  async function saveReply(id) { const r = await run("reply:" + id, `/reviews/${id}/reply`, post({ reply: drafts[id] })); if (r) { setDrafts((d) => { const n = { ...d }; delete n[id]; return n; }); refresh(); } }
  async function getInsights() { const r = await run("ins", "/insights", post({})); if (r) setInsights(r.insights); }
  async function previewRequest() { const r = await run("prev", "/request/preview", post({})); if (r) setReq(r); }
  async function sendTest() {
    const r = await run("test", "/request/send-test", post({ to: testTo, subject: req.subject, bodyHtml: req.bodyHtml, url: req.product.url }));
    if (r) setNotice(r.sent ? `Test email sent to ${r.to}.` : "Preview only: email sending is not set up on the server, so nothing was sent.");
  }

  const reviews = data ? data.reviews.filter((r) => filter === "all" || r.status === filter) : [];
  const sm = data && data.summary;
  return (
    <div style={S.root}>
      <h1 style={S.title}>Reviews & UGC</h1>
      <p style={S.subtitle}>Your own review inbox. Add real reviews, then let AI draft replies, find what customers keep saying, and write review-request emails.</p>
      {error && <div style={S.error}>{error}</div>}
      {notice && <div style={S.ok}>{notice}</div>}
      {status && !status.ai && <div style={S.warn}>AI is not configured on the server, so AI buttons are disabled.</div>}

      {sm && (
        <div style={S.card}>
          <span style={S.pill}>{sm.total} reviews</span>
          <span style={S.pill}>Average {sm.average == null ? "–" : sm.average + " / 5"}</span>
          <span style={S.pill}>{sm.pending} waiting for approval</span>
          <span style={S.pill}>{sm.unanswered} unanswered</span>
          <div style={{ marginTop: 10 }}>
            <button style={{ ...S.btn, ...(busy || sm.total < 3 || !(status && status.ai) ? S.off : {}) }} disabled={!!busy || sm.total < 3 || !(status && status.ai)} onClick={getInsights}>{busy === "ins" ? "Analysing…" : "AI: what are customers saying? (2 credits)"}</button>
          </div>
          {insights && (
            <div style={{ marginTop: 12, fontSize: 13, color: "#d4d4d8" }}>
              <p>{insights.summary}</p>
              {[["Praise", insights.praise], ["Complaints", insights.complaints], ["Suggested actions", insights.actions]].map(([t, l]) => l.length > 0 && (
                <div key={t}><strong>{t}</strong><ul>{l.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
              ))}
              <div style={S.muted}>Based on {insights.basedOn} reviews.</div>
            </div>
          )}
        </div>
      )}

      <div style={S.card}>
        <h2 style={S.h}>Add a review</h2>
        <input style={S.input} placeholder="Product (optional)" value={form.productTitle} onChange={(e) => setForm({ ...form, productTitle: e.target.value })} />
        <input style={S.input} placeholder="Customer name" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        <select style={S.input} value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}</select>
        <textarea style={S.ta} placeholder="What the customer wrote" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        <button style={{ ...S.btn, ...(!form.text || busy ? S.off : {}) }} disabled={!form.text || !!busy} onClick={add}>Add review</button>
        <details style={{ marginTop: 14 }}>
          <summary style={S.muted}>Paste many at once</summary>
          <p style={S.muted}>One per line: rating | name | review text</p>
          <textarea style={S.ta} placeholder="5 | Sam | Love my mug, arrived fast" value={bulk} onChange={(e) => setBulk(e.target.value)} />
          <button style={{ ...S.btn, ...(!bulk || busy ? S.off : {}) }} disabled={!bulk || !!busy} onClick={importBulk}>Import</button>
        </details>
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Review request email</h2>
        <p style={S.muted}>AI writes a polite request from one of your real products. Send yourself a test; the review link is added automatically.</p>
        <button style={{ ...S.btn, ...(busy || !(status && status.ai) ? S.off : {}) }} disabled={!!busy || !(status && status.ai)} onClick={previewRequest}>{busy === "prev" ? "Writing…" : "AI write request (2 credits)"}</button>
        {req && (
          <div style={{ marginTop: 12 }}>
            <div style={S.muted}>For: {req.product.title}</div>
            <input style={S.input} value={req.subject} onChange={(e) => setReq({ ...req, subject: e.target.value })} />
            <textarea style={S.ta} value={req.bodyHtml} onChange={(e) => setReq({ ...req, bodyHtml: e.target.value })} />
            <input style={S.input} placeholder="Your email address" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            <button style={{ ...S.btn, ...(!testTo || busy ? S.off : {}) }} disabled={!testTo || !!busy} onClick={sendTest}>{busy === "test" ? "Sending…" : "Send test to me"}</button>
          </div>
        )}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Reviews</h2>
        {["all", "pending", "approved", "rejected"].map((f) => <button key={f} style={{ ...S.ghost, ...(filter === f ? { color: "#fafafa", borderColor: "#6366f1" } : {}) }} onClick={() => setFilter(f)}>{f}</button>)}
        {data === null && <div style={S.empty}>Loading…</div>}
        {data && reviews.length === 0 && <div style={S.empty}>{data.reviews.length ? "No reviews match this filter." : "No reviews yet. Add your first one above."}</div>}
        {reviews.map((r) => (
          <div key={r.id} style={{ ...S.row, flexDirection: "column", marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span><span style={{ color: "#fcd34d" }}>{STAR(r.rating)}</span> {r.author}{r.productTitle ? ` · ${r.productTitle}` : ""}</span>
              <span style={{ color: BADGE[r.status], fontSize: 12 }}>{r.status}</span>
            </div>
            <div style={{ color: "#d4d4d8", margin: "6px 0" }}>{r.text}</div>
            {r.reply && <div style={{ ...S.muted, borderLeft: "2px solid #3f3f46", paddingLeft: 8 }}>Your reply: {r.reply}</div>}
            {drafts[r.id] !== undefined && (
              <div style={{ marginTop: 8 }}>
                <textarea style={{ ...S.ta, minHeight: 70 }} value={drafts[r.id]} onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })} />
                <button style={S.btn} disabled={!!busy} onClick={() => saveReply(r.id)}>Save reply</button>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              {r.status !== "approved" && <button style={S.ghost} disabled={!!busy} onClick={() => setReviewStatus(r.id, "approved")}>Approve</button>}
              {r.status !== "rejected" && <button style={S.ghost} disabled={!!busy} onClick={() => setReviewStatus(r.id, "rejected")}>Reject</button>}
              <button style={{ ...S.ghost, ...(!(status && status.ai) ? S.off : {}) }} disabled={!!busy || !(status && status.ai)} onClick={() => draft(r.id)}>{busy === "draft:" + r.id ? "Writing…" : "AI reply (1 credit)"}</button>
              <button style={S.ghost} disabled={!!busy} onClick={() => remove(r.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}