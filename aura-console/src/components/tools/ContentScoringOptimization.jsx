import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/content-scoring-optimization";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  stat: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 16px", minWidth: 110 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "24px 0", textAlign: "center" },
  row: { display: "flex", justifyContent: "space-between", gap: 12, padding: "9px 10px", border: "1px solid #27272a", borderRadius: 8, marginBottom: 6, cursor: "pointer", fontSize: 13 },
};

const color = (s) => (s >= 80 ? "#86efac" : s >= 50 ? "#fcd34d" : "#fca5a5");

export default function ContentScoringOptimization() {
  const [data, setData] = useState(null);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [rewrite, setRewrite] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function call(name, path, options) {
    setBusy(name); setError(""); setMessage("");
    try {
      const r = await apiFetchJSON(API + path, options);
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r;
    } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
  }
  const post = (body) => ({ method: "POST", body: JSON.stringify(body) });

  async function load() {
    const r = await call("load", "/overview");
    if (r) setData(r);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function open(item) {
    setSel(item); setRewrite(null); setDetail(null);
    const r = await call("score", "/score", post({ id: item.id }));
    if (r) setDetail(r);
  }
  async function doRewrite() {
    const r = await call("rewrite", "/ai/rewrite", post({ id: sel.id }));
    if (r) setRewrite(r);
  }
  async function apply() {
    if (!window.confirm("Replace this product's description in Shopify with the rewritten copy?")) return;
    const r = await call("apply", "/apply", post({ id: sel.id, html: rewrite.html }));
    if (r) { setMessage("Description updated in Shopify."); setRewrite(null); load(); open(sel); }
  }

  const off = !!busy;
  const result = detail && detail.result;

  return (
    <div style={S.root}>
      <h1 style={S.title}>Content Scoring</h1>
      <p style={S.subtitle}>Scores the real copy on your products, pages, collections and blog posts for length, readability and structure. Fix the weakest first with an AI rewrite.</p>
      {error && <div style={S.error} role="alert">{error}</div>}
      {message && <div style={S.ok}>{message}</div>}

      <div style={S.card}>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button style={{ ...S.btn, ...(off ? S.off : {}) }} disabled={off} onClick={load}>{busy === "load" ? "Scoring your store…" : "Re-score store"}</button>
          {data && [["Average", data.average ?? "–"], ["Items", data.total], ["Good (80+)", data.bands.good], ["Needs work", data.bands.ok], ["Poor (<50)", data.bands.poor]].map(([k, v]) => (
            <div key={k} style={S.stat}><div style={{ fontSize: 11, color: "#71717a" }}>{k}</div><div style={{ fontSize: 20, fontWeight: 800 }}>{v}</div></div>
          ))}
        </div>
        {data && data.warnings && data.warnings.length > 0 && <div style={{ ...S.error, marginTop: 12, marginBottom: 0 }}>Some content could not be read: {data.warnings.join("; ")}</div>}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(300px,420px) 1fr", gap: 20, alignItems: "start" }}>
        <div style={S.card}>
          {!data && busy === "load" && <div style={S.empty}>Reading your store…</div>}
          {data && data.items.length === 0 && <div style={S.empty}>No products, pages or posts found in your store.</div>}
          {data && data.items.map((i) => (
            <div key={i.id} style={{ ...S.row, borderColor: sel && sel.id === i.id ? "#4f46e5" : "#27272a" }} onClick={() => open(i)}>
              <span>{i.title}<span style={{ color: "#71717a", fontSize: 12 }}> · {i.type} · {i.words} words</span></span>
              <strong style={{ color: color(i.score) }}>{i.score}</strong>
            </div>
          ))}
        </div>

        <div style={S.card}>
          {!sel && <div style={S.empty}>Pick an item to see what is holding its score back.</div>}
          {sel && (
            <>
              <h3 style={{ margin: "0 0 4px" }}>{sel.title}</h3>
              <div style={{ color: "#71717a", fontSize: 12, marginBottom: 12 }}>{sel.type} · <a href={sel.url} target="_blank" rel="noreferrer" style={{ color: "#a5b4fc" }}>view page</a></div>
              {busy === "score" && <div style={S.empty}>Scoring…</div>}
              {result && (
                <>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {[["Score", result.score], ["Words", result.words], ["Readability", result.flesch ?? "–"], ["Avg sentence", result.avgSentence], ["Subheadings", result.headings]].map(([k, v]) => (
                      <div key={k} style={S.stat}><div style={{ fontSize: 11, color: "#71717a" }}>{k}</div><div style={{ fontSize: 18, fontWeight: 800 }}>{v}</div></div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    {result.issues.length === 0 && <div style={{ color: "#86efac", fontSize: 13 }}>No issues found. This copy is in good shape.</div>}
                    {result.issues.map((i, n) => <div key={n} style={{ fontSize: 13, padding: "3px 0", color: i.severity === "high" ? "#fca5a5" : i.severity === "medium" ? "#fcd34d" : "#a1a1aa" }}>• {i.text}</div>)}
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <button style={{ ...S.btn, ...(off ? S.off : {}) }} disabled={off} onClick={doRewrite}>{busy === "rewrite" ? "Rewriting…" : "Rewrite with AI (3 credits)"}</button>
                  </div>
                </>
              )}
              {rewrite && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>Score <strong style={{ color: color(rewrite.before) }}>{rewrite.before}</strong> → <strong style={{ color: color(rewrite.after) }}>{rewrite.after}</strong></div>
                  <textarea aria-label="Rewritten copy" style={{ width: "100%", minHeight: 240, background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 12, padding: 12, boxSizing: "border-box", fontFamily: "ui-monospace,Consolas,monospace" }} value={rewrite.html} onChange={(e) => setRewrite({ ...rewrite, html: e.target.value })} />
                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    {sel.type === "product"
                      ? <button style={{ ...S.btn, background: "#166534", ...(off ? S.off : {}) }} disabled={off} onClick={apply}>{busy === "apply" ? "Saving…" : "Apply to Shopify"}</button>
                      : <span style={{ color: "#71717a", fontSize: 12 }}>Copy this into your Shopify admin (automatic apply works for products only).</span>}
                    <button style={{ ...S.btn, background: "#27272a" }} onClick={() => setRewrite(null)}>Discard</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
