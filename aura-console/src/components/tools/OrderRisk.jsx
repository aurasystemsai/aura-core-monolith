import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer", marginRight: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  warn: { background: "#1c1500", border: "1px solid #854d0e", color: "#fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { padding: 12, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/order-risk";
const RANGES = [7, 14, 30, 90];
const COLOR = { high: "#f87171", review: "#fbbf24" };

export default function OrderRisk() {
  const [days, setDays] = useState(14);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [needsScopes, setNeedsScopes] = useState(false);

  async function load(d = days) {
    setBusy(true); setError(""); setNeedsScopes(false);
    try {
      const r = await apiFetchJSON(`${API}/orders?days=${d}`);
      if (!r.ok) { setNeedsScopes(!!r.needsScopes); throw new Error(r.error || `Request failed (${r.status})`); }
      setData(r);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  useEffect(() => { load(days); }, [days]); // eslint-disable-line

  return (
    <div style={S.root}>
      <h1 style={S.title}>Order Risk</h1>
      <p style={S.subtitle}>Orders worth a second look before they ship, from Shopify's fraud checks plus a few plain rules. It only flags, it never cancels anything. Uses no credits.</p>
      {error && <div style={S.error}>{error}</div>}
      {needsScopes && <div style={S.warn}>Approve the updated permissions for AURA in your Shopify admin, then press Refresh.</div>}
      <div style={{ marginBottom: 14 }}>
        {RANGES.map((d) => (
          <button key={d} style={{ ...S.ghost, ...(d === days ? { color: "#fafafa", borderColor: "#4f46e5" } : {}) }} disabled={busy} onClick={() => setDays(d)}>Last {d} days</button>
        ))}
        <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={busy} onClick={() => load(days)}>Refresh</button>
      </div>
      {busy && !data && <div style={S.empty}>Checking your orders…</div>}
      {data && (
        <div style={S.card}>
          <div style={S.muted}>{data.total} orders checked: <span style={{ color: COLOR.high }}>{data.high} high risk</span>, <span style={{ color: COLOR.review }}>{data.review} to review</span>.{data.truncated ? " Only the newest orders were checked." : ""}</div>
          {data.orders.length === 0 && <div style={S.empty}>{data.total === 0 ? `No orders in the last ${data.days} days.` : "Nothing looks risky. Nice."}</div>}
          <div style={{ marginTop: 12 }}>
            {data.orders.map((o) => (
              <div key={o.id} style={S.row}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong>{o.name} <span style={{ ...S.muted, fontWeight: 400 }}>{o.email}</span></strong>
                  <span style={{ color: COLOR[o.level], fontWeight: 700 }}>{o.level === "high" ? "High risk" : "Review"}</span>
                </div>
                <div style={S.muted}>{data.currency} {o.total.toFixed(2)} · {o.payment} · {o.fulfilment}</div>
                <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 12, color: "#d4d4d8" }}>{o.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
