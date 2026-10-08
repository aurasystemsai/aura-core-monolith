import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/on-page-seo-engine";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 24, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: 700, margin: "0 0 12px" },
  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnGhost: { background: "#27272a", color: "#fafafa", border: "1px solid #3f3f46", borderRadius: 10, padding: "10px 14px", fontSize: 13, cursor: "pointer" },
  btnOff: { opacity: 0.5, cursor: "not-allowed" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 13, padding: "10px 12px", boxSizing: "border-box" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  ok: { background: "#0c1c10", border: "1px solid #14532d", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  empty: { color: "#71717a", fontSize: 13, padding: "16px 0" },
  label: { fontSize: 12, fontWeight: 600, color: "#a1a1aa", margin: "10px 0 6px", display: "block" },
};

const COLOR = { pass: "#86efac", warn: "#fcd34d", fail: "#f87171" };
const scoreColor = (n) => (n >= 80 ? "#86efac" : n >= 55 ? "#fcd34d" : "#f87171");

export default function OnPageSEOEngine() {
  const [items, setItems] = useState(null);
  const [id, setId] = useState("");
  const [keyword, setKeyword] = useState("");
  const [result, setResult] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let live = true;
    apiFetchJSON(`${API}/items`).then((r) => {
      if (!live) return;
      if (r.ok) setItems(r.items); else { setItems([]); setError(r.error || "Could not load your store content"); }
    }).catch(() => { if (live) { setItems([]); setError("Could not load your store content"); } });
    return () => { live = false; };
  }, []);

  const current = (items || []).find((i) => i.id === id);

  async function analyze() {
    setBusy("analyze"); setError(""); setNotice(""); setSuggestion(null);
    const r = await apiFetchJSON(`${API}/analyze`, { method: "POST", body: JSON.stringify({ id, keyword }) });
    setBusy("");
    if (!r.ok) return setError(r.error || "Analysis failed");
    setResult(r.result);
  }

  async function optimize() {
    setBusy("ai"); setError(""); setNotice("");
    const r = await apiFetchJSON(`${API}/ai/optimize`, { method: "POST", body: JSON.stringify({ id, keyword }) });
    setBusy("");
    if (!r.ok) return setError(r.error || "AI optimisation failed");
    setSuggestion({ ...r.suggestion, projectedScore: r.projectedScore });
  }

  async function apply() {
    setBusy("apply"); setError("");
    const r = await apiFetchJSON(`${API}/apply`, { method: "POST", body: JSON.stringify({ id, ...suggestion }) });
    setBusy("");
    if (!r.ok) return setError(r.error || "Could not update the product");
    setNotice("Saved to your store. Re-analyze to see the new score.");
    setSuggestion(null);
  }

  const canApply = suggestion && current && current.type === "product";

  return (
    <div style={S.root}>
      <h1 style={S.title}>On-Page SEO Engine</h1>
      <p style={S.subtitle}>Score any page against a target keyword, then let AI rewrite the title and meta description. Analysis 1 credit, AI rewrite 1+ credit.</p>
      {error && <div style={S.error}>{error}</div>}
      {notice && <div style={S.ok}>{notice}</div>}

      <div style={S.card}>
        {items === null ? <div style={S.empty}>Loading your store content…</div>
          : !items.length ? <div style={S.empty}>No products, pages, collections or articles found.</div> : (
            <>
              <label style={S.label}>Page</label>
              <select value={id} onChange={(e) => { setId(e.target.value); setResult(null); setSuggestion(null); }} style={{ ...S.input, width: "100%" }}>
                <option value="">Choose a page…</option>
                {items.map((i) => <option key={i.id} value={i.id}>[{i.type}] {i.title}</option>)}
              </select>
              <label style={S.label}>Target keyword</label>
              <div style={S.row}>
                <input style={{ ...S.input, flex: 1, minWidth: 220 }} value={keyword} maxLength={80} placeholder="e.g. handmade ceramic mug" onChange={(e) => setKeyword(e.target.value)} />
                <button style={{ ...S.btn, ...(!id || busy ? S.btnOff : {}) }} disabled={!id || !!busy} onClick={analyze}>{busy === "analyze" ? "Analyzing…" : "Analyze"}</button>
                <button style={{ ...S.btnGhost, ...(!id || !keyword.trim() || busy ? S.btnOff : {}) }} disabled={!id || !keyword.trim() || !!busy} onClick={optimize}>{busy === "ai" ? "Thinking…" : "AI optimise title & meta"}</button>
              </div>
            </>
          )}
      </div>

      {suggestion && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>AI suggestion · projected score {suggestion.projectedScore}</h3>
          <label style={S.label}>SEO title ({suggestion.seoTitle.length})</label>
          <input style={{ ...S.input, width: "100%" }} value={suggestion.seoTitle} onChange={(e) => setSuggestion({ ...suggestion, seoTitle: e.target.value })} />
          <label style={S.label}>Meta description ({suggestion.metaDescription.length})</label>
          <textarea style={{ ...S.input, width: "100%", minHeight: 70 }} value={suggestion.metaDescription} onChange={(e) => setSuggestion({ ...suggestion, metaDescription: e.target.value })} />
          <div style={{ ...S.row, marginTop: 12 }}>
            <button style={{ ...S.btn, ...(!canApply || busy ? S.btnOff : {}) }} disabled={!canApply || !!busy} onClick={apply}>{busy === "apply" ? "Saving…" : "Save to store"}</button>
            {!canApply && <span style={{ color: "#71717a", fontSize: 12 }}>Saving is available for products. Copy these into Shopify for other page types.</span>}
          </div>
        </div>
      )}

      {result && (
        <div style={S.card}>
          <div style={{ ...S.row, justifyContent: "space-between" }}>
            <h3 style={{ ...S.cardTitle, margin: 0 }}>{result.title}</h3>
            <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(result.score) }}>{result.score}<span style={{ fontSize: 12, color: "#71717a" }}>/100</span></div>
          </div>
          <div style={{ color: "#71717a", fontSize: 12, margin: "6px 0 14px" }}>{result.wordCount} words{result.keyword ? ` · "${result.keyword}" density ${result.density}%` : " · add a keyword for placement checks"}</div>
          {result.checks.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 10, padding: "7px 0", borderBottom: "1px solid #27272a", fontSize: 13 }}>
              <span style={{ color: COLOR[c.status], width: 40, fontWeight: 700 }}>{c.status.toUpperCase()}</span>
              <span style={{ width: 210 }}>{c.label}</span>
              <span style={{ color: "#a1a1aa" }}>{c.detail}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
