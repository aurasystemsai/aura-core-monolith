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
const API = "/api/dynamic-pricing-engine";

export default function PricingAdvisor() {
  const [data, setData] = useState(null);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [brief, setBrief] = useState("");
  const [custom, setCustom] = useState({});
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);
  const post = (body) => ({ method: "POST", body: JSON.stringify(body || {}) });
  const load = async () => {
    const r = await run("load", "/suggestions"); if (r) setData(r);
    const l = await run("log", "/log"); if (l) setLog(l.log);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function apply(s) {
    const price = Number(custom[s.variantId] !== undefined && custom[s.variantId] !== "" ? custom[s.variantId] : s.suggested);
    setDone("");
    const r = await run("a:" + s.variantId, "/apply", post({ variantId: s.variantId, price }));
    if (r) { setDone(`Price of ${s.title} changed to ${price.toFixed(2)} in Shopify.`); load(); }
  }
  async function undo(e) { const r = await run("u:" + e.id, "/revert", post({ id: e.id })); if (r) { setDone(`Price of ${e.title} put back to ${e.from.toFixed(2)}.`); load(); } }
  async function getBrief() { const r = await run("brief", "/brief", post()); if (r) setBrief(r.brief); }

  const list = data ? data.suggestions : [];
  return (
    <div style={S.root}>
      <h1 style={S.title}>Pricing Advisor</h1>
      <p style={S.subtitle}>Suggested price changes based on your real stock and the last {data ? data.windowDays : 60} days of sales. Nothing changes in Shopify until you press Apply, and every change can be undone.</p>
      {error && <div style={S.error}>{error}</div>}
      {done && <div style={S.ok}>{done}</div>}
      {data && data.note && <div style={S.warn}>{data.note}</div>}

      <div style={S.card}>
        <h2 style={S.h}>Suggestions</h2>
        {busy === "load" && !data && <div style={S.empty}>Checking your products…</div>}
        {data && data.ordersAvailable && list.length === 0 && <div style={S.empty}>No changes suggested. Checked {data.checked} products; none are overstocked, selling out or priced too close to cost.</div>}
        {list.map((s) => (
          <div key={s.variantId} style={{ ...S.row, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px" }}>
              <div style={{ fontWeight: 600 }}>{s.title}</div>
              <div style={S.muted}>{s.why}</div>
            </div>
            <div style={{ color: s.changePct < 0 ? "#f59e0b" : "#22c55e", fontWeight: 700 }}>{s.price.toFixed(2)} → {s.suggested.toFixed(2)} ({s.changePct > 0 ? "+" : ""}{s.changePct}%)</div>
            <input style={{ ...S.input, width: 90, marginBottom: 0 }} placeholder={String(s.suggested)} value={custom[s.variantId] || ""} onChange={(e) => setCustom({ ...custom, [s.variantId]: e.target.value })} aria-label="Your own price" />
            <button style={{ ...S.btn, marginRight: 0, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => apply(s)}>{busy === "a:" + s.variantId ? "Applying…" : "Apply"}</button>
          </div>
        ))}
        {list.length > 0 && (
          <div style={{ marginTop: 10 }}>
            <button style={{ ...S.ghost, ...(!data.ai || busy ? S.off : {}) }} disabled={!data.ai || !!busy} onClick={getBrief}>{busy === "brief" ? "Writing…" : "AI: what to do first (2 credits)"}</button>
            {!data.ai && <span style={S.muted}>AI is not set up on this server.</span>}
            {brief && <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#d4d4d8", marginTop: 8 }}>{brief}</div>}
          </div>
        )}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Changes made</h2>
        {log.length === 0 && <div style={S.empty}>No price changes yet.</div>}
        {log.map((e) => (
          <div key={e.id} style={{ ...S.row, alignItems: "center" }}>
            <span>{e.title}: {e.from.toFixed(2)} → {e.to.toFixed(2)} <span style={S.muted}>{new Date(e.at).toLocaleString()}</span></span>
            {e.reverted ? <span style={S.muted}>Undone</span> : <button style={{ ...S.ghost, marginRight: 0, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => undo(e)}>{busy === "u:" + e.id ? "Undoing…" : "Undo"}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}