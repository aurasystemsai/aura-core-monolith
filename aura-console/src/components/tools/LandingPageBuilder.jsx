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
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 999, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginRight: 8, marginBottom: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/landing-page-builder";
const TONES = ["friendly", "professional", "playful", "luxury"];

export default function LandingPageBuilder() {
  const [products, setProducts] = useState(null);
  const [ai, setAi] = useState(true);
  const [pages, setPages] = useState([]);
  const [form, setForm] = useState({ productId: "", goal: "", audience: "", tone: "friendly" });
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(null);

  async function call(name, url, options) {
    setBusy(name); setError("");
    try {
      const r = await apiFetchJSON(API + url, options);
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r;
    } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
  }
  const post = (b) => ({ method: "POST", body: JSON.stringify(b) });
  useEffect(() => {
    call("load", "/products").then((r) => { if (r) { setProducts(r.products); setAi(r.ai); } });
    call("pages", "/pages").then((r) => r && setPages(r.pages));
  }, []); // eslint-disable-line

  async function generate() {
    setDone(null); setDraft(null);
    const r = await call("gen", "/generate", post(form));
    if (r) setDraft({ title: r.title, html: r.html });
  }
  async function publish() {
    const r = await call("pub", "/publish", post(draft));
    if (r) {
      setDone(r); setDraft(null);
      const p = await call("pages", "/pages"); if (p) setPages(p.pages);
    }
  }
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={S.root}>
      <h1 style={S.title}>Landing Page Builder</h1>
      <p style={S.subtitle}>Pick one of your real products and AI drafts a page for it (3 credits). You can edit the text before saving. It is saved to Shopify as a hidden page, so nothing goes live until you publish it from Shopify.</p>
      {error && <div style={S.error}>{error}</div>}
      {done && <div style={S.ok}>Saved as a hidden page. <a style={{ color: "#86efac" }} href={done.adminUrl} target="_top">Open it in Shopify</a> to review and publish.</div>}

      <div style={S.card}>
        <h2 style={S.h}>1. Describe the page</h2>
        {busy === "load" && !products && <div style={S.empty}>Loading your products…</div>}
        {products && products.length === 0 && <div style={S.empty}>No active products found in your store.</div>}
        {products && products.length > 0 && (
          <>
            <select style={S.input} value={form.productId} onChange={set("productId")} aria-label="Product">
              <option value="">Choose a product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.price} {p.currency})</option>)}
            </select>
            <input style={S.input} placeholder="Goal, e.g. launch offer, back in stock (optional)" maxLength={200} value={form.goal} onChange={set("goal")} />
            <input style={S.input} placeholder="Who is it for? (optional)" maxLength={200} value={form.audience} onChange={set("audience")} />
            <select style={S.input} value={form.tone} onChange={set("tone")} aria-label="Tone">{TONES.map((t) => <option key={t}>{t}</option>)}</select>
            <button style={{ ...S.btn, ...(!form.productId || busy || !ai ? S.off : {}) }} disabled={!form.productId || !!busy || !ai} onClick={generate}>{busy === "gen" ? "Writing…" : "AI: write the page (3 credits)"}</button>
            {!ai && <span style={S.muted}>AI is not set up on this server.</span>}
          </>
        )}
      </div>

      {draft && (
        <div style={S.card}>
          <h2 style={S.h}>2. Review and save</h2>
          <input style={S.input} value={draft.title} maxLength={120} onChange={(e) => setDraft({ ...draft, title: e.target.value })} aria-label="Page title" />
          <iframe title="Preview" sandbox="" srcDoc={`<body style="font:14px/1.5 system-ui;padding:16px;color:#111">${draft.html}</body>`} style={{ width: "100%", height: 320, border: "none", borderRadius: 10, background: "#fff", marginBottom: 12 }} />
          <textarea style={{ ...S.input, minHeight: 140, fontFamily: "monospace" }} value={draft.html} onChange={(e) => setDraft({ ...draft, html: e.target.value })} aria-label="Page HTML" />
          <button style={{ ...S.btn, ...(busy || !draft.title.trim() ? S.off : {}) }} disabled={!!busy || !draft.title.trim()} onClick={publish}>{busy === "pub" ? "Saving…" : "Save to Shopify as a hidden page"}</button>
        </div>
      )}

      <div style={S.card}>
        <h2 style={S.h}>Pages you saved</h2>
        {pages.length === 0 && <div style={S.empty}>No pages saved yet.</div>}
        {pages.map((p) => (
          <div key={p.id} style={{ padding: "8px 0", borderBottom: "1px solid #27272a", fontSize: 13 }}>
            {p.title} <span style={S.muted}>{new Date(p.at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}