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
const API = "/api/entity-topic-explorer";

export default function EntityTopicExplorer() {
  const [data, setData] = useState(null);
  const [pages, setPages] = useState(null);
  const [ideas, setIdeas] = useState(null);
  const [busy, setBusy] = useState("load");
  const [error, setError] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);

  useEffect(() => { (async () => { const r = await run("load", "/topics"); if (r) setData(r); })(); }, []); // eslint-disable-line

  async function show(term) { const r = await run("topic", `/topic?term=${encodeURIComponent(term)}`); if (r) setPages(r); }
  async function expand() { const r = await run("ai", "/ai/expand", { method: "POST", body: "{}" }); if (r) setIdeas(r); }

  return (
    <div style={S.root}>
      <h1 style={S.title}>Entity & Topic Explorer</h1>
      <p style={S.subtitle}>The topics your store already covers, counted from your real products, collections, pages and posts.</p>
      {error && <div style={S.error}>{error}</div>}
      {busy === "load" && <div style={S.empty}>Reading your store…</div>}

      {data && (
        <>
          <div style={S.card}>
            <h2 style={S.h}>Covered topics <span style={S.muted}>({data.scanned} items scanned)</span></h2>
            {data.topics.length === 0 ? <div style={S.empty}>Not enough content yet to find repeated topics.</div> :
              data.topics.map((t) => <button key={t.term} style={S.ghost} onClick={() => show(t.term)}>{t.term} · {t.pages}</button>)}
          </div>
          <div style={S.card}>
            <h2 style={S.h}>Content gaps</h2>
            <p style={S.muted}>Topics found on products but never mentioned in a blog post.</p>
            {data.gaps.length === 0 ? <div style={S.empty}>No gaps found.</div> : data.gaps.map((t) => <span key={t.term} style={S.pill}>{t.term}</span>)}
          </div>
        </>
      )}

      {pages && (
        <div style={S.card}>
          <h2 style={S.h}>“{pages.term}” appears on {pages.total} page{pages.total === 1 ? "" : "s"}</h2>
          {pages.pages.map((p) => <div key={p.url} style={S.row}><span>{p.title}</span><span style={S.muted}>{p.type}{p.inTitle ? " · in title" : ""}</span></div>)}
        </div>
      )}

      <div style={S.card}>
        <h2 style={S.h}>AI related topics</h2>
        <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={expand}>{busy === "ai" ? "Thinking…" : "AI suggest related topics (2 credits)"}</button>
        {ideas && (ideas.suggestions.length === 0 ? <div style={S.empty}>No new suggestions.</div> :
          <div style={{ marginTop: 12 }}>{ideas.suggestions.map((s) => (
            <div key={s.topic} style={S.row}><span><b>{s.topic}</b> <span style={S.muted}>({s.type}) {s.why}</span></span><span style={S.muted}>{s.contentIdea}</span></div>
          ))}<p style={S.muted}>AI suggestions, not search data.</p></div>)}
      </div>
    </div>
  );
}
