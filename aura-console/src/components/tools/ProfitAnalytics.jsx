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
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer", marginRight: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  warn: { background: "#1c1500", border: "1px solid #854d0e", color: "#fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  muted: { color: "#71717a", fontSize: 12 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 14 },
  stat: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 12 },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, padding: "6px 8px", borderBottom: "1px solid #27272a" },
  td: { fontSize: 13, padding: "6px 8px", borderBottom: "1px solid #27272a" },
};
const API = "/api/profit-analytics";
const RANGES = [7, 30, 90, 365];

export default function ProfitAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [needsScopes, setNeedsScopes] = useState(false);
  const [done, setDone] = useState("");

  async function load(d = days) {
    setBusy("load"); setError(""); setNeedsScopes(false);
    try {
      const r = await apiFetchJSON(`${API}/report?days=${d}`);
      if (!r.ok) { setNeedsScopes(!!r.needsScopes); throw new Error(r.error || `Request failed (${r.status})`); }
      setData(r); setSettings(r.settings);
    } catch (e) { setError(e.message); } finally { setBusy(""); }
  }
  useEffect(() => { load(days); }, [days]); // eslint-disable-line

  async function save() {
    setBusy("save"); setError(""); setDone("");
    try {
      const r = await apiFetchJSON(`${API}/settings`, { method: "POST", body: JSON.stringify(settings) });
      if (!r.ok) throw new Error(r.error || "Could not save.");
      setDone("Saved."); await load(days);
    } catch (e) { setError(e.message); setBusy(""); }
  }
  const set = (k, v) => setSettings((s) => ({ ...s, [k]: v }));
  const setAd = (i, k, v) => set("adSpend", settings.adSpend.map((a, j) => (j === i ? { ...a, [k]: v } : a)));
  const addMonth = () => set("adSpend", [{ month: new Date().toISOString().slice(0, 7), amount: 0 }, ...settings.adSpend]);
  const money = (n) => (n == null ? "—" : `${data.currency} ${Number(n).toFixed(2)}`);

  return (
    <div style={S.root}>
      <h1 style={S.title}>Profit Analytics</h1>
      <p style={S.subtitle}>What you actually kept: your real orders minus product cost, fees, shipping and ads. Read-only, and uses no credits.</p>
      {error && <div style={S.error}>{error}</div>}
      {needsScopes && <div style={S.warn}>Approve the updated permissions for AURA in your Shopify admin, then press Refresh.</div>}
      {done && <div style={S.ok}>{done}</div>}

      <div style={{ marginBottom: 14 }}>
        {RANGES.map((d) => (
          <button key={d} style={{ ...S.ghost, ...(d === days ? { color: "#fafafa", borderColor: "#4f46e5" } : {}) }} disabled={!!busy} onClick={() => setDays(d)}>Last {d} days</button>
        ))}
        <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => load(days)}>Refresh</button>
      </div>

      {busy === "load" && !data && <div style={S.empty}>Working out your profit…</div>}
      {data && data.orders === 0 && <div style={S.card}><div style={S.empty}>No orders in the last {data.days} days.</div></div>}
      {data && data.orders > 0 && (
        <div style={S.card}>
          {data.costCoverage < 100 && (
            <div style={S.warn}>
              {data.costCoverage === 0 ? "None of the products you sold have a cost price" : `Only ${data.costCoverage}% of your sales have a product cost`}, so profit below is overstated.
              Add a "Cost per item" to each product in Shopify (Products, the variant, Cost per item) for a true figure.
            </div>
          )}
          {data.truncated && <div style={S.warn}>Your store has more orders than we can read at once, so these figures cover only part of the period.</div>}
          <div style={S.grid}>
            <div style={S.stat}><div style={S.muted}>Sales (after refunds, no tax)</div><div style={{ fontSize: 20, fontWeight: 800 }}>{money(data.netRevenue)}</div></div>
            <div style={S.stat}><div style={S.muted}>Estimated profit</div><div style={{ fontSize: 20, fontWeight: 800, color: data.profit >= 0 ? "#4ade80" : "#f87171" }}>{money(data.profit)}</div></div>
            <div style={S.stat}><div style={S.muted}>Margin</div><div style={{ fontSize: 20, fontWeight: 800 }}>{data.margin == null ? "—" : `${data.margin}%`}</div></div>
            <div style={S.stat}><div style={S.muted}>Orders</div><div style={{ fontSize: 20, fontWeight: 800 }}>{data.orders}</div></div>
          </div>
          <div style={S.muted}>
            Taken off: product cost {money(data.productCost)}, payment fees {money(data.fees)}, shipping {money(data.shippingCost)}, ads {money(data.adSpend)}.
            Refunds {money(data.refunds)} and tax {money(data.tax)} are removed from sales first.
          </div>
        </div>
      )}

      {data && data.orders > 0 && data.products.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h}>By product</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr><th style={S.th}>Product</th><th style={S.th}>Sold</th><th style={S.th}>Sales</th><th style={S.th}>Cost</th><th style={S.th}>Profit</th><th style={S.th}>Margin</th></tr></thead>
            <tbody>
              {data.products.slice(0, 25).map((p) => (
                <tr key={p.title}>
                  <td style={S.td}>{p.title}</td><td style={S.td}>{p.units}</td><td style={S.td}>{money(p.revenue)}</td>
                  <td style={S.td}>{p.cost == null ? <span style={{ color: "#fbbf24" }}>no cost</span> : money(p.cost)}</td>
                  <td style={S.td}>{money(p.profit)}</td><td style={S.td}>{p.margin == null ? "—" : `${p.margin}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {settings && (
        <div style={S.card}>
          <h2 style={S.h}>Your costs</h2>
          <p style={S.muted}>Shopify does not tell us these, so enter your own. Change them any time.</p>
          <div style={S.grid}>
            <label style={S.muted}>Payment fee (%)<input style={S.input} type="number" min="0" max="30" step="0.1" value={settings.feePercent} onChange={(e) => set("feePercent", e.target.value)} /></label>
            <label style={S.muted}>Fixed fee per order<input style={S.input} type="number" min="0" max="10" step="0.01" value={settings.feeFixed} onChange={(e) => set("feeFixed", e.target.value)} /></label>
            <label style={S.muted}>Your shipping cost per order<input style={S.input} type="number" min="0" step="0.01" value={settings.shippingCostPerOrder} onChange={(e) => set("shippingCostPerOrder", e.target.value)} /></label>
          </div>
          <div style={{ ...S.muted, marginBottom: 6 }}>Ad spend by month (from your ad accounts)</div>
          {settings.adSpend.length === 0 && <div style={S.muted}>None entered, so ads count as zero.</div>}
          {settings.adSpend.map((a, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
              <input aria-label="Month" style={S.input} type="month" value={a.month} onChange={(e) => setAd(i, "month", e.target.value)} />
              <input aria-label="Amount" style={S.input} type="number" min="0" step="0.01" value={a.amount} onChange={(e) => setAd(i, "amount", e.target.value)} />
              <button style={S.ghost} onClick={() => set("adSpend", settings.adSpend.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <button style={S.ghost} onClick={addMonth}>Add a month</button>
            <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={save}>{busy === "save" ? "Saving…" : "Save costs"}</button>
          </div>
        </div>
      )}
    </div>
  );
}
