import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "5px 10px", fontSize: 12, cursor: "pointer" },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 10, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  label: { color: "#a1a1aa", fontSize: 12, margin: "10px 0 4px", display: "block" },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/ad-creative-optimizer";

export default function AdCreativeOptimizer() {
  const [products, setProducts] = useState(null);
  const [platforms, setPlatforms] = useState([]);
  const [productId, setProductId] = useState("");
  const [platform, setPlatform] = useState("google");
  const [angle, setAngle] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [p, pl] = await Promise.all([apiFetchJSON(API + "/products"), apiFetchJSON(API + "/platforms")]);
        if (!p.ok) throw new Error(p.error || "Could not load products");
        setProducts(p.products); setPlatforms(pl.platforms || []);
        if (p.products[0]) setProductId(p.products[0].id);
      } catch (e) { setError(e.message); setProducts([]); }
    })();
  }, []);

  async function generate() {
    setBusy(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(API + "/generate", { method: "POST", body: JSON.stringify({ productId, platform, angle }) });
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      setResult(r);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function copy(t) { navigator.clipboard && navigator.clipboard.writeText(t); setCopied(t); setTimeout(() => setCopied(""), 1500); }

  const list = (title, items, limit) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ ...S.muted, marginBottom: 6 }}>{title}</div>
      {items.map((i) => (
        <div key={i.text} style={S.row}>
          <span>{i.text} <span style={S.muted}>({i.length}/{limit})</span></span>
          <button style={S.ghost} onClick={() => copy(i.text)}>{copied === i.text ? "Copied" : "Copy"}</button>
        </div>
      ))}
    </div>
  );

  return (
    <div style={S.root}>
      <h1 style={S.title}>Ad Creative Optimizer</h1>
      <p style={S.subtitle}>AI writes ad copy for one of your real products, cut to each platform's character limits. No ad account needed. Costs 2 credits per run, only when it works.</p>
      {error && <div style={S.error}>{error}</div>}
      <div style={S.card}>
        {products === null && <div style={S.empty}>Loading products…</div>}
        {products && products.length === 0 && !error && <div style={S.empty}>No active products found in your store.</div>}
        {products && products.length > 0 && (
          <>
            <label style={S.label}>Product</label>
            <select style={S.input} value={productId} onChange={(e) => setProductId(e.target.value)}>
              {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
            <label style={S.label}>Platform</label>
            <select style={S.input} value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label style={S.label}>Angle (optional)</label>
            <input style={S.input} value={angle} maxLength={120} placeholder="e.g. a gift for dads" onChange={(e) => setAngle(e.target.value)} />
            <div style={{ marginTop: 14 }}>
              <button style={{ ...S.btn, ...(busy || !productId ? S.off : {}) }} disabled={busy || !productId} onClick={generate}>{busy ? "Writing…" : "Write ad copy (2 credits)"}</button>
            </div>
          </>
        )}
      </div>
      {result && (
        <div style={S.card}>
          <div style={{ ...S.muted, marginBottom: 10 }}>{result.product}. Check each line before you use it.</div>
          {list("Headlines", result.headlines, result.limits.headline)}
          {list("Descriptions", result.descriptions, result.limits.description)}
        </div>
      )}
    </div>
  );
}