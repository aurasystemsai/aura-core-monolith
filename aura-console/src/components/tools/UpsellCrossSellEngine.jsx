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
const API = "/api/upsell-cross-sell-engine";

export default function UpsellCrossSellEngine() {
  const [products, setProducts] = useState(null);
  const [aiOn, setAiOn] = useState(false);
  const [bundles, setBundles] = useState(null);
  const [sel, setSel] = useState("");
  const [rel, setRel] = useState(null);
  const [pitch, setPitch] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);

  useEffect(() => {
    run("load", "/products").then((r) => { if (r) { setProducts(r.products); setAiOn(r.ai); } });
    run("bundles", "/bundles").then((r) => r && setBundles(r));
  }, []); // eslint-disable-line

  async function choose(id) {
    setSel(id); setRel(null); setPitch({});
    if (!id) return;
    const r = await run("rel", "/related?productId=" + encodeURIComponent(id));
    if (r) setRel(r);
  }
  async function writePitch(item) {
    const r = await run("pitch:" + item.id, "/pitch", { method: "POST", body: JSON.stringify({ productId: sel, relatedId: item.id, reason: item.reason }) });
    if (r) setPitch((p) => ({ ...p, [item.id]: r.pitch }));
  }

  return (
    <div style={S.root}>
      <h1 style={S.title}>Upsell & Cross-sell</h1>
      <p style={S.subtitle}>What to offer next with each product. Uses what your customers really buy together when order history is available, otherwise how similar your products are.</p>
      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <h2 style={S.h}>Pick a product</h2>
        {products === null && <div style={S.empty}>Loading products…</div>}
        {products && products.length === 0 && <div style={S.empty}>No active products in your store yet.</div>}
        {products && products.length > 0 && (
          <select style={S.input} value={sel} onChange={(e) => choose(e.target.value)}>
            <option value="">Choose…</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        )}
        {busy === "rel" && <div style={S.empty}>Finding matches…</div>}
        {rel && (
          <>
            <div style={S.muted}>{rel.basis === "orders" ? "Based on your real orders." : "Based on product similarity."}</div>
            {rel.ordersNote && <div style={{ ...S.warn, marginTop: 8 }}>{rel.ordersNote}</div>}
            {rel.items.length === 0 && <div style={S.empty}>No good matches found for this product.</div>}
            {rel.items.map((it) => (
              <div key={it.id} style={{ ...S.row, flexDirection: "column", marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{it.title}</strong>
                  <button style={{ ...S.ghost, ...(!aiOn || busy ? S.off : {}) }} disabled={!aiOn || !!busy} onClick={() => writePitch(it)}>{busy === "pitch:" + it.id ? "Writing…" : "AI pitch (1 credit)"}</button>
                </div>
                <span style={S.muted}>{it.reason}</span>
                {pitch[it.id] && (
                  <div style={{ marginTop: 6, fontSize: 13, color: "#d4d4d8" }}>
                    <div><span style={S.pill}>Cart</span>{pitch[it.id].cartLine}</div>
                    <div><span style={S.pill}>Email</span>{pitch[it.id].emailLine}</div>
                    <div><span style={S.pill}>Bundle</span>{pitch[it.id].bundleName}</div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Bundles customers already buy</h2>
        {bundles === null && <div style={S.empty}>Loading…</div>}
        {bundles && !bundles.ordersAvailable && <div style={S.warn}>{bundles.note}</div>}
        {bundles && bundles.ordersAvailable && bundles.bundles.length === 0 && <div style={S.empty}>No products have been bought together yet.</div>}
        {bundles && bundles.bundles.map((b, i) => (
          <div key={i} style={S.row}><span>{b.products[0].title} + {b.products[1].title}</span><span style={S.muted}>together in {b.orders} orders</span></div>
        ))}
      </div>
    </div>
  );
}