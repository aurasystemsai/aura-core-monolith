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
const API = "/api/ai-content-image-gen";
const STYLES = [["studio", "Studio"], ["lifestyle", "Lifestyle"], ["flatlay", "Flat lay"], ["minimal", "Minimal"]];

export default function AIContentImageGen() {
  const [products, setProducts] = useState(null);
  const [productId, setProductId] = useState("");
  const [style, setStyle] = useState("studio");
  const [details, setDetails] = useState("");
  const [result, setResult] = useState(null);
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);

  useEffect(() => { (async () => { const r = await run("load", "/products"); if (r) { setProducts(r.products); if (r.products[0]) setProductId(r.products[0].id); } })(); }, []); // eslint-disable-line

  async function generate() {
    setResult(null); setApplied(false);
    const r = await run("gen", "/generate", { method: "POST", body: JSON.stringify({ productId, style, details }) });
    if (r) setResult(r);
  }
  async function apply() {
    const p = products.find((x) => x.id === productId);
    if (await run("apply", "/apply", { method: "POST", body: JSON.stringify({ productId, imageId: result.imageId, alt: p ? p.title : "" }) })) setApplied(true);
  }

  return (
    <div style={S.root}>
      <h1 style={S.title}>AI Product Images</h1>
      <p style={S.subtitle}>Create a new image for one of your products. Nothing changes in your store until you click Add to product, and existing images are never replaced.</p>
      {error && <div style={S.error}>{error}</div>}
      {products === null && busy === "load" && <div style={S.empty}>Loading your products…</div>}
      {products && products.length === 0 && <div style={S.empty}>No products found in your store.</div>}
      {products && products.length > 0 && (
        <div style={S.card}>
          <select style={S.input} value={productId} onChange={(e) => setProductId(e.target.value)}>
            {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
          <div style={{ marginBottom: 10 }}>
            {STYLES.map(([k, l]) => <button key={k} style={{ ...S.ghost, ...(style === k ? { borderColor: "#6366f1", color: "#fafafa" } : {}) }} onClick={() => setStyle(k)}>{l}</button>)}
          </div>
          <input style={S.input} placeholder="Extra details (optional), e.g. on a wooden table" value={details} onChange={(e) => setDetails(e.target.value)} />
          <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={generate}>{busy === "gen" ? "Creating image… (up to 30s)" : "AI generate image (10 credits)"}</button>
        </div>
      )}
      {result && (
        <div style={S.card}>
          <img src={result.preview} alt="Generated product" style={{ maxWidth: 420, width: "100%", borderRadius: 10, border: "1px solid #3f3f46" }} />
          <p style={S.muted}>Preview only. It is kept for 15 minutes.</p>
          {applied ? <div style={{ color: "#86efac", fontSize: 13 }}>Added to the product in your store.</div> :
            <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={apply}>{busy === "apply" ? "Adding…" : "Add to product"}</button>}
          <button style={S.ghost} disabled={!!busy} onClick={generate}>Try again (10 credits)</button>
        </div>
      )}
    </div>
  );
}
