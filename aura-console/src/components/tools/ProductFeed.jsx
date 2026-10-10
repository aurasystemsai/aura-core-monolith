import React, { useEffect, useState } from "react";
import { apiFetch, apiFetchJSON } from "../../api";
import HelpTip from "../../help/HelpTip";
import CostBadge from "../../help/CostBadge";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer", marginRight: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { padding: 12, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  pill: { background: "#27272a", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "#d4d4d8", display: "inline-block", margin: "0 6px 6px 0" },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/product-feed";
const COLOR = { error: "#f87171", warn: "#fbbf24", info: "#a1a1aa" };
const scoreColor = (n) => (n >= 80 ? "#4ade80" : n >= 50 ? "#fbbf24" : "#f87171");

async function call(setBusy, setError, name, url, options) {
  setBusy(name); setError("");
  try {
    const r = await apiFetchJSON(API + url, options);
    if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
    return r;
  } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
}

export default function ProductFeed() {
  const [data, setData] = useState(null);
  const [log, setLog] = useState([]);
  const [open, setOpen] = useState("");
  const [draft, setDraft] = useState({});
  const [onlyBad, setOnlyBad] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, u, o);
  const post = (body) => ({ method: "POST", body: JSON.stringify(body || {}) });

  async function load() { const r = await run("load", "/audit"); if (r) setData(r); }
  async function loadLog() { const l = await run("log", "/log"); if (l) setLog(l.log); }
  useEffect(() => { load(); loadLog(); }, []); // eslint-disable-line

  async function suggest(p) {
    setDone("");
    const r = await run("s:" + p.id, "/suggest", post({ id: p.id }));
    if (r) { setDraft((d) => ({ ...d, [p.id]: { title: r.suggestion.title, description: r.suggestion.description } })); setOpen(p.id); }
  }
  async function apply(p) {
    const d = draft[p.id] || {};
    const r = await run("a:" + p.id, "/apply", post({ id: p.id, title: d.title, description: d.description }));
    if (r) { setDone(`Saved to Shopify: ${d.title}`); setDraft((x) => { const n = { ...x }; delete n[p.id]; return n; }); setOpen(""); load(); loadLog(); }
  }
  async function undo(e) {
    const r = await run("u:" + e.id, "/revert", post({ id: e.id }));
    if (r) { setDone("Put the old title and description back."); load(); loadLog(); }
  }
  async function download() {
    setBusy("export"); setError(""); setDone("");
    try {
      const res = await apiFetch(API + "/export");
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const text = await res.text();
      const url = URL.createObjectURL(new Blob([text], { type: "text/tab-separated-values" }));
      const a = document.createElement("a"); a.href = url; a.download = "aura-product-feed.tsv"; a.click(); URL.revokeObjectURL(url);
      const skipped = Number(res.headers.get("X-Feed-Skipped") || 0);
      setDone(`Feed downloaded: ${res.headers.get("X-Feed-Rows")} rows.${skipped ? ` ${skipped} product(s) were left out because they have errors Google would reject. Fix them below and download again.` : ""}`);
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }

  const s = data && data.summary;
  const shown = data ? data.products.filter((p) => !onlyBad || p.issues.length) : [];
  return (
    <div style={S.root}>
      <h1 style={S.title}>Product Feed</h1>
      <p style={S.subtitle}>Google Shopping rejects or buries products with weak listings. This checks every active product against its rules, lets AI fix titles and descriptions, and builds a feed file you can upload to Google Merchant Center. Nothing changes in Shopify until you press Apply.</p>
      {error && <div style={S.error}>{error}</div>}
      {done && <div style={S.ok}>{done}</div>}

      <div style={S.card}>
        <h2 style={S.h}>Feed health<HelpTip title="Feed health" toolId="product-feed">Every active product is checked against Google Shopping rules. Products with problems may be rejected or ranked lower, so fix the ones listed below.</HelpTip></h2>
        {busy === "load" && !data && <div style={S.empty}>Reading your products...</div>}
        {data && data.products.length === 0 && <div style={S.empty}>You have no active products yet.</div>}
        {s && s.total > 0 && (
          <>
            <div style={{ marginBottom: 12 }}>
              <span style={{ ...S.pill, color: scoreColor(s.average), fontWeight: 700 }}>Average score {s.average}/100</span>
              <span style={S.pill}>{s.ready} of {s.total} ready for Google</span>
              <span style={S.pill}>{s.withErrors} with errors</span>
              <span style={S.pill}>{s.withWarnings} with warnings</span>
              {data.truncated && <span style={S.pill}>Only the first products were checked</span>}
            </div>
            <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={download}>{busy === "export" ? "Building..." : "Download feed for Google Merchant Center"}</button>
            <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={load}>Check again</button>
            <div style={{ ...S.muted, marginTop: 8 }}>In Merchant Center: Products, then Feeds, then add a feed and upload this file. Your product pages must be public (no store password).</div>
          </>
        )}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Products to improve<HelpTip title="Fixing with AI" toolId="product-feed">AI rewrites the title and description for you to read. Nothing changes in Shopify until you press Apply.</HelpTip></h2>
        <label style={{ ...S.muted, display: "block", marginBottom: 10 }}><input type="checkbox" checked={onlyBad} onChange={(e) => setOnlyBad(e.target.checked)} /> Only show products with issues</label>
        {data && data.products.length > 0 && shown.length === 0 && <div style={S.empty}>No issues found. Your feed is in good shape.</div>}
        {shown.map((p) => {
          const d = draft[p.id];
          const canAI = data.ai && p.issues.some((i) => ["short-title", "caps-title", "promo-text", "no-description", "short-description"].includes(i.code));
          return (
            <div key={p.id} style={S.row}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                {p.image ? <img src={p.image} alt="" width={48} height={48} style={{ objectFit: "cover", borderRadius: 8, background: "#09090b" }} /> : <div style={{ width: 48, height: 48, borderRadius: 8, background: "#27272a" }} />}
                <div style={{ flex: "1 1 260px", minWidth: 200 }}>
                  <div style={{ fontWeight: 600 }}>{p.title} <span style={{ color: scoreColor(p.score), fontWeight: 700 }}>{p.score}</span></div>
                  {p.issues.map((i) => <div key={i.code} style={{ fontSize: 12, color: COLOR[i.level] }}>{i.level === "error" ? "Error" : i.level === "warn" ? "Warning" : "Tip"}: {i.msg}</div>)}
                </div>
                {canAI && !d && <button style={{ ...S.btn, marginRight: 0, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => suggest(p)}>{busy === "s:" + p.id ? "Writing..." : <>AI: fix title and description<CostBadge action="product-description" style={{ background: "#fff", marginLeft: 6 }} /></>}</button>}
              </div>
              {d && open === p.id && (
                <div style={{ marginTop: 10 }}>
                  <input style={S.input} maxLength={150} value={d.title} onChange={(e) => setDraft({ ...draft, [p.id]: { ...d, title: e.target.value } })} aria-label="Title" />
                  <textarea style={{ ...S.input, marginTop: 6, minHeight: 90 }} maxLength={1000} value={d.description} onChange={(e) => setDraft({ ...draft, [p.id]: { ...d, description: e.target.value } })} aria-label="Description" />
                  <div style={{ marginTop: 8 }}>
                    <button style={{ ...S.btn, ...(!d.title.trim() || !d.description.trim() || busy ? S.off : {}) }} disabled={!d.title.trim() || !d.description.trim() || !!busy} onClick={() => apply(p)}>{busy === "a:" + p.id ? "Saving..." : "Apply to Shopify"}</button>
                    <button style={S.ghost} onClick={() => { setOpen(""); setDraft((x) => { const n = { ...x }; delete n[p.id]; return n; }); }}>Discard</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Changes made<HelpTip title="Changes made" toolId="product-feed">A record of what you applied, so you can see what changed.</HelpTip></h2>
        {log.length === 0 && <div style={S.empty}>No listings changed yet.</div>}
        {log.map((e) => (
          <div key={e.id} style={{ ...S.row, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span>{e.fromTitle} to "{e.toTitle}" <span style={S.muted}>{new Date(e.at).toLocaleString()}</span></span>
            {e.reverted ? <span style={S.muted}>Undone</span> : <button style={{ ...S.ghost, marginRight: 0, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => undo(e)}>{busy === "u:" + e.id ? "Undoing..." : "Undo"}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}