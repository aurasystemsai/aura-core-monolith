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
const API = "/api/ai-content-brief-generator";

export default function AIContentBriefGenerator() {
  const [keyword, setKeyword] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [brief, setBrief] = useState(null);
  const [list, setList] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);

  const load = async () => { const r = await run("list", "/briefs"); if (r) setList(r.briefs); };
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function generate() {
    const r = await run("gen", "/generate", { method: "POST", body: JSON.stringify({ keyword, audience, goal }) });
    if (r) { setBrief(r.brief); load(); }
  }
  async function open(id) { const r = await run("open", `/briefs/${id}`); if (r) setBrief(r.brief); }
  async function remove(id) {
    if (!(await run("del", `/briefs/${id}`, { method: "DELETE" }))) return;
    if (brief && brief.id === id) setBrief(null);
    load();
  }

  return (
    <div style={S.root}>
      <h1 style={S.title}>Content Brief Generator</h1>
      <p style={S.subtitle}>Briefs built from your own products, blog posts and (when connected) Google search queries. No made-up volumes or competitor numbers.</p>
      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <h2 style={S.h}>New brief</h2>
        <input style={S.input} placeholder="Target keyword or topic, e.g. handmade ceramic mug" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <input style={S.input} placeholder="Audience (optional)" value={audience} onChange={(e) => setAudience(e.target.value)} />
        <input style={S.input} placeholder="Goal (optional)" value={goal} onChange={(e) => setGoal(e.target.value)} />
        <button style={{ ...S.btn, ...(busy || !keyword.trim() ? S.off : {}) }} disabled={!!busy || !keyword.trim()} onClick={generate}>
          {busy === "gen" ? "Writing brief…" : "AI generate brief (3 credits)"}
        </button>
      </div>

      {brief && (
        <div style={S.card}>
          <h2 style={S.h}>{brief.title}</h2>
          <p style={S.muted}>Intent: {brief.searchIntent} · Target length: ~{brief.targetWordCount} words · Keyword: {brief.keyword}</p>
          <p style={{ fontSize: 13 }}>{brief.summary}</p>
          <h3 style={S.h}>Outline</h3>
          {brief.outline.map((s, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{s.heading}</div>
              <ul style={{ margin: "4px 0", paddingLeft: 18, fontSize: 13, color: "#d4d4d8" }}>{s.points.map((p, j) => <li key={j}>{p}</li>)}</ul>
            </div>
          ))}
          {brief.questionsToAnswer.length > 0 && (<><h3 style={S.h}>Questions to answer</h3><ul style={{ fontSize: 13, color: "#d4d4d8" }}>{brief.questionsToAnswer.map((q, i) => <li key={i}>{q}</li>)}</ul></>)}
          {brief.relatedTerms.length > 0 && (<><h3 style={S.h}>Related terms</h3>{brief.relatedTerms.map((t) => <span key={t} style={S.pill}>{t}</span>)}</>)}
          {brief.internalLinks.length > 0 && (<><h3 style={S.h}>Internal links</h3>{brief.internalLinks.map((l) => <div key={l.url} style={S.row}><span>{l.anchor}</span><span style={S.muted}>{l.url}</span></div>)}</>)}
          {brief.realQueries.length > 0 && (<><h3 style={S.h}>Your real Google queries</h3>{brief.realQueries.map((q) => <div key={q.query} style={S.row}><span>{q.query}</span><span style={S.muted}>{q.impressions} impressions · pos {q.position}</span></div>)}</>)}
          {brief.cta && <p style={{ fontSize: 13 }}><b>Call to action:</b> {brief.cta}</p>}
          {brief.avoid.length > 0 && <p style={S.muted}>Avoid: {brief.avoid.join("; ")}</p>}
          <button style={S.ghost} onClick={() => navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(brief, null, 2))}>Copy brief</button>
        </div>
      )}

      <div style={S.card}>
        <h2 style={S.h}>Saved briefs</h2>
        {list === null ? <div style={S.empty}>Loading…</div> : list.length === 0 ? <div style={S.empty}>No briefs yet. Create your first one above.</div> :
          list.map((b) => (
            <div key={b.id} style={S.row}>
              <span>{b.title} <span style={S.muted}>· {b.keyword}</span></span>
              <span><button style={S.ghost} disabled={!!busy} onClick={() => open(b.id)}>Open</button><button style={S.ghost} disabled={!!busy} onClick={() => remove(b.id)}>Delete</button></span>
            </div>
          ))}
      </div>
    </div>
  );
}
