import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { padding: 12, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  muted: { color: "#71717a", fontSize: 12 },
  pre: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, padding: 12, fontSize: 12, color: "#d4d4d8", whiteSpace: "pre-wrap", maxHeight: 320, overflow: "auto" },
};
const API = "/api/ai-shopping-readiness";
const scoreColor = (n) => (n >= 80 ? "#4ade80" : n >= 50 ? "#fbbf24" : "#f87171");
const POLICY = { refund: "Refund policy", shipping: "Shipping policy", privacy: "Privacy policy", terms: "Terms of service" };

export default function AIShoppingReadiness() {
  const [data, setData] = useState(null);
  const [llms, setLlms] = useState(null);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function call(name, url) {
    setBusy(name); setError("");
    try {
      const r = await apiFetchJSON(API + url);
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r;
    } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
  }
  async function scan() { const r = await call("scan", "/scan"); if (r) setData(r); }
  useEffect(() => { scan(); }, []); // eslint-disable-line

  async function makeLlms() {
    setDone("");
    const r = await call("llms", "/llms-txt?summary=" + encodeURIComponent(summary));
    if (r) setLlms(r);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(llms.text); setDone("Copied."); } catch { setError("Could not copy. Select the text and copy it by hand."); }
  }

  const missing = data ? Object.values(data.coverage).filter((c) => c.count < data.total) : [];

  return (
    <div style={S.root}>
      <h1 style={S.title}>AI Shopping Readiness</h1>
      <p style={S.subtitle}>Checks every product for the details AI shopping assistants such as ChatGPT and Google AI Mode need. Free, read-only, and uses no credits.</p>
      {error && <div style={S.error}>{error}</div>}
      {done && <div style={S.ok}>{done}</div>}

      <div style={S.card}>
        <h2 style={S.h}>Your store score</h2>
        {busy === "scan" && !data && <div style={S.empty}>Checking your products…</div>}
        {data && data.total === 0 && <div style={S.empty}>No active products found. Publish a product and scan again.</div>}
        {data && data.total > 0 && (
          <>
            <div style={{ fontSize: 36, fontWeight: 800, color: scoreColor(data.average) }}>{data.average}<span style={{ fontSize: 16, color: "#71717a" }}> / 100</span></div>
            <div style={S.muted}>{data.ready} of {data.total} products have everything required{data.truncated ? " (first products only, your store has more)" : ""}.</div>
            <div style={{ marginTop: 14 }}>
              {Object.values(data.coverage).map((c) => (
                <div key={c.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0", borderBottom: "1px solid #27272a" }}>
                  <span>{c.label}{c.required ? "" : " (helpful)"}</span>
                  <span style={{ color: c.count === data.total ? "#4ade80" : c.required ? "#f87171" : "#fbbf24" }}>{c.count} / {data.total}</span>
                </div>
              ))}
            </div>
            {data.policies ? (
              <div style={{ marginTop: 14 }}>
                {Object.entries(POLICY).map(([k, label]) => (
                  <span key={k} style={{ ...S.muted, marginRight: 14, color: data.policies[k] ? "#4ade80" : "#f87171" }}>{data.policies[k] ? "✓" : "✗"} {label}</span>
                ))}
              </div>
            ) : <div style={{ ...S.muted, marginTop: 14 }}>Policies were not checked because AURA does not have permission to read them yet.</div>}
          </>
        )}
        <div style={{ marginTop: 14 }}>
          <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={scan}>{busy === "scan" ? "Scanning…" : "Scan again"}</button>
        </div>
      </div>

      {data && missing.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h}>Products to fix first</h2>
          {data.products.filter((p) => p.missingRequired.length || p.missingHelpful.length).slice(0, 20).map((p) => (
            <div key={p.id} style={S.row}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{p.title}</strong><span style={{ color: scoreColor(p.score), fontWeight: 700 }}>{p.score}</span>
              </div>
              {p.missingRequired.length > 0 && <div style={{ color: "#f87171", fontSize: 12 }}>Required, missing: {p.missingRequired.join(", ")}</div>}
              {p.missingHelpful.length > 0 && <div style={{ color: "#fbbf24", fontSize: 12 }}>Helpful, missing: {p.missingHelpful.join(", ")}</div>}
            </div>
          ))}
          <div style={S.muted}>Fix titles and descriptions with AI in the Product Feed tool.</div>
        </div>
      )}

      <div style={S.card}>
        <h2 style={S.h}>llms.txt for your store</h2>
        <p style={S.muted}>A plain-text guide that AI assistants can read. Built only from your public products and policies.</p>
        <label style={S.muted} htmlFor="llms-summary">One or two sentences about your store (optional)</label>
        <textarea id="llms-summary" style={{ ...S.input, minHeight: 60, margin: "6px 0 10px" }} maxLength={300} value={summary} onChange={(e) => setSummary(e.target.value)} />
        <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={makeLlms}>{busy === "llms" ? "Building…" : "Build llms.txt"}</button>
        {llms && (
          <div style={{ marginTop: 14 }}>
            <pre style={S.pre}>{llms.text}</pre>
            {llms.truncated && <div style={S.muted}>Showing the first {llms.productCount} products.</div>}
            <button style={{ ...S.btn, marginTop: 10 }} onClick={copy}>Copy</button>
            <p style={S.muted}>Shopify cannot serve a file at yourstore.com/llms.txt directly. Create a page with this text, then add a URL redirect from /llms.txt to that page in Online Store, Navigation, URL redirects.</p>
          </div>
        )}
      </div>
    </div>
  );
}
