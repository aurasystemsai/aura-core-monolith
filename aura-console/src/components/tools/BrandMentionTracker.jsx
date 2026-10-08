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
const API = "/api/brand-mention-tracker";
const SOURCES = ["review", "social", "press", "forum", "email", "other"];
const COLOUR = { positive: "#22c55e", neutral: "#a1a1aa", negative: "#ef4444" };

export default function BrandMentions() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [form, setForm] = useState({ text: "", source: "review", author: "", url: "" });
  const [insights, setInsights] = useState(null);
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);
  const load = async () => { const r = await run("load", "/state"); if (r) setData(r); };
  useEffect(() => { load(); }, []); // eslint-disable-line
  const post = (body) => ({ method: "POST", body: JSON.stringify(body || {}) });

  async function add() { const r = await run("add", "/mentions", post(form)); if (r) { setForm({ ...form, text: "", author: "", url: "" }); load(); } }
  async function analyse() { setNote(""); const r = await run("an", "/analyse", post()); if (r) { setNote("Labelled " + r.labelled + " mention(s)." + (r.remaining ? " " + r.remaining + " left, run again." : "")); load(); } }
  async function reply(m) { const r = await run("rp:" + m.id, "/mentions/" + m.id + "/reply", post()); if (r) load(); }
  async function del(m) { await run("d", "/mentions/" + m.id, { method: "DELETE" }); load(); }
  async function getInsights() { const r = await run("ins", "/insights", post()); if (r) setInsights(r.insights); }
  async function buildVoice() { const r = await run("voice", "/voice", post()); if (r) load(); }

  const s = data && data.summary;
  const off = (extra) => ({ ...(extra || {}), ...(busy ? S.off : {}) });
  return (
    <div style={S.root}>
      <h1 style={S.title}>Brand & Mentions</h1>
      <p style={S.subtitle}>Keep track of what people say about your brand. This can't search the web or social networks for you, so paste mentions in, then let AI label them, find themes and draft replies.</p>
      {error && <div style={S.error}>{error}</div>}
      {note && <div style={S.warn}>{note}</div>}
      {data && !data.ai && <div style={S.warn}>AI is not configured on the server, so the AI buttons are off.</div>}

      <div style={S.card}>
        <h2 style={S.h}>Add a mention</h2>
        <textarea style={{ ...S.input, minHeight: 70 }} placeholder="Paste what was said" value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
        <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
          <select style={S.input} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>{SOURCES.map((x) => <option key={x}>{x}</option>)}</select>
          <input style={S.input} placeholder="Who (optional)" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          <input style={S.input} placeholder="Link (optional)" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
        </div>
        <button style={{ ...S.btn, marginTop: 8, ...(!form.text.trim() || busy ? S.off : {}) }} disabled={!form.text.trim() || !!busy} onClick={add}>{busy === "add" ? "Adding…" : "Add mention"}</button>
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Overview</h2>
        {!data && <div style={S.empty}>Loading…</div>}
        {data && s.total === 0 && <div style={S.empty}>No mentions yet. Add your first one above.</div>}
        {data && s.total > 0 && (
          <>
            <div style={S.row}><span>{s.total} mentions</span><span style={S.muted}>{s.positiveShare === null ? "Not analysed yet" : s.positiveShare + "% positive"} · {s.needAttention} negative without a reply</span></div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              {["positive", "neutral", "negative"].map((k) => <span key={k} style={{ ...S.pill, color: COLOUR[k] }}>{k} {s.counts[k]}</span>)}
              <span style={S.pill}>unlabelled {s.counts.unlabelled}</span>
              {s.topTopics.map((t) => <span key={t.topic} style={S.pill}>{t.topic} ×{t.n}</span>)}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={{ ...S.btn, ...(!data.ai || busy || !s.counts.unlabelled ? S.off : {}) }} disabled={!data.ai || !!busy || !s.counts.unlabelled} onClick={analyse}>{busy === "an" ? "Analysing…" : "AI label mentions (2 credits)"}</button>
              <button style={{ ...S.ghost, ...(!data.ai || busy || s.total < 3 ? S.off : {}) }} disabled={!data.ai || !!busy || s.total < 3} onClick={getInsights}>{busy === "ins" ? "Thinking…" : "AI insights (2 credits)"}</button>
            </div>
            {insights && ["themes", "praise", "concerns", "actions"].map((k) => insights[k].length > 0 && (
              <div key={k} style={{ marginTop: 8 }}><strong style={{ textTransform: "capitalize" }}>{k}</strong><ul style={{ margin: "4px 0 0 18px", color: "#d4d4d8", fontSize: 13 }}>{insights[k].map((x, i) => <li key={i}>{x}</li>)}</ul></div>
            ))}
          </>
        )}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Brand voice</h2>
        {data && data.voice ? (
          <div style={{ fontSize: 13, color: "#d4d4d8" }}>
            <div>{data.voice.summary}</div>
            <div style={{ marginTop: 6 }}>{data.voice.traits.map((t) => <span key={t} style={S.pill}>{t}</span>)}</div>
            <div style={S.muted}>Learned from {data.voice.basedOn} pieces of your store content. Used when drafting replies.</div>
          </div>
        ) : <div style={S.empty}>Not built yet. It's learned from your own products, pages and articles.</div>}
        <button style={{ ...S.ghost, marginTop: 8, ...(!data || !data.ai || busy ? S.off : {}) }} disabled={!data || !data.ai || !!busy} onClick={buildVoice}>{busy === "voice" ? "Learning…" : (data && data.voice ? "Rebuild" : "Learn my brand voice") + " (5 credits)"}</button>
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Mentions</h2>
        {data && data.mentions.map((m) => (
          <div key={m.id} style={{ ...S.row, flexDirection: "column", marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={S.muted}>{m.source}{m.author ? " · " + m.author : ""}{m.sentiment ? " · " : ""}<span style={{ color: COLOUR[m.sentiment] }}>{m.sentiment || ""}</span>{m.topic ? " · " + m.topic : ""}</span>
              <span><button style={{ ...S.ghost, ...(!data.ai || busy ? S.off : {}) }} disabled={!data.ai || !!busy} onClick={() => reply(m)}>{busy === "rp:" + m.id ? "Writing…" : "AI reply (1 credit)"}</button> <button style={S.ghost} onClick={() => del(m)}>Delete</button></span>
            </div>
            <div style={{ fontSize: 13, color: "#d4d4d8", marginTop: 4 }}>{m.text}</div>
            {m.url && <a style={{ ...S.muted, marginTop: 2 }} href={m.url} target="_blank" rel="noreferrer">{m.url}</a>}
            {m.reply && <div style={{ marginTop: 6, fontSize: 13, borderLeft: "2px solid #3f3f46", paddingLeft: 8 }}>{m.reply}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}