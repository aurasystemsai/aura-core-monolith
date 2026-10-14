import React, { useEffect, useState } from "react";
import { apiFetch, apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#a1a1aa", fontSize: 13, margin: "0 0 20px", maxWidth: 800, lineHeight: 1.55 },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  label: { display: "block", fontSize: 12, color: "#a1a1aa", margin: "0 0 5px", fontWeight: 600 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  secondary: { background: "transparent", color: "#d4d4d8", border: "1px solid #3f3f46", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  disabled: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  warning: { background: "#211b0b", border: "1px solid #854d0e", color: "#fde68a", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  muted: { color: "#71717a", fontSize: 12 },
  stat: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 14px" },
  statLabel: { color: "#a1a1aa", fontSize: 12 },
  statValue: { fontSize: 22, fontWeight: 800, marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  th: { textAlign: "left", color: "#a1a1aa", fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5, padding: "9px 8px", borderBottom: "1px solid #3f3f46" },
  td: { padding: "9px 8px", borderBottom: "1px solid #27272a" },
};

const API = "/api/self-service-analytics";
const isoDay = (date) => date.toISOString().slice(0, 10);
const initialDates = () => {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 29);
  return { start: isoDay(start), end: isoDay(end) };
};

export default function SelfServiceAnalytics() {
  const [dates, setDates] = useState(initialDates);
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setBusy(true);
    setError("");
    try {
      const params = new URLSearchParams(dates);
      const result = await apiFetchJSON(`${API}/report?${params}`);
      if (!result.ok) throw new Error(result.error || `Request failed (${result.status})`);
      setData(result.report);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function download() {
    setExportBusy(true);
    setError("");
    try {
      const params = new URLSearchParams(dates);
      const response = await apiFetch(`${API}/export.csv?${params}`);
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        throw new Error(result.error || `Export failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aura-orders-${dates.start}-to-${dates.end}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setExportBusy(false);
    }
  }

  const setDate = (key) => (e) => setDates((d) => ({ ...d, [key]: e.target.value }));
  const currency = (amount) => {
    if (data?.summary.currency) {
      try { return new Intl.NumberFormat(undefined, { style: "currency", currency: data.summary.currency }).format(amount); } catch { /* fall through to numeric display */ }
    }
    return Number(amount || 0).toFixed(2);
  };

  return (
    <div style={S.root}>
      <h1 style={S.title}>Shopify order reports</h1>
      <p style={S.subtitle}>Build a report from your real Shopify orders: sales by day and order status. This does not include store visits, ad attribution or forecasts. Shopify only makes recent order history available to this app; reports are limited to 60 days and show when a result set is capped.</p>
      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <div style={{ ...S.grid, alignItems: "end" }}>
          <div><label style={S.label}>From</label><input aria-label="From date" type="date" style={S.input} value={dates.start} onChange={setDate("start")} /></div>
          <div><label style={S.label}>To</label><input aria-label="To date" type="date" style={S.input} value={dates.end} onChange={setDate("end")} /></div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ ...S.btn, ...(busy ? S.disabled : {}) }} disabled={busy} onClick={load}>{busy ? "Building report…" : "Build report"}</button>
            <button style={{ ...S.secondary, ...(!data || exportBusy ? S.disabled : {}) }} disabled={!data || exportBusy} onClick={download}>{exportBusy ? "Preparing…" : "Download CSV"}</button>
          </div>
        </div>
      </div>

      {!data && busy && <div style={S.muted}>Loading real order data from Shopify…</div>}
      {!data && !busy && !error && <div style={S.card}><div style={S.muted}>Choose a date range and build your first report.</div></div>}
      {data && <>
        {data.dataQuality.truncated && <div style={S.warning}>Shopify returned the maximum number of orders this report can read. Totals cover the {data.dataQuality.returnedOrders.toLocaleString()} returned orders only, so the report may be incomplete. Narrow the date range and build it again.</div>}
        <div style={{ ...S.grid, marginBottom: 20 }}>
          <div style={S.stat}><div style={S.statLabel}>Non-cancelled orders</div><div style={S.statValue}>{data.summary.orders.toLocaleString()}</div></div>
          <div style={S.stat}><div style={S.statLabel}>Net subtotal</div><div style={S.statValue}>{currency(data.summary.netSubtotal)}</div></div>
          <div style={S.stat}><div style={S.statLabel}>Average order value</div><div style={S.statValue}>{currency(data.summary.averageOrderValue)}</div></div>
          <div style={S.stat}><div style={S.statLabel}>Purchasing customers</div><div style={S.statValue}>{data.summary.purchasingCustomers.toLocaleString()}</div></div>
        </div>

        <div style={S.card}>
          <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Daily sales</h2>
          {!data.daily.some((d) => d.orders) ? <div style={S.muted}>No non-cancelled orders in this date range.</div> : (
            <div style={{ overflowX: "auto" }}><table style={S.table}>
              <thead><tr><th style={S.th}>Date</th><th style={S.th}>Orders</th><th style={S.th}>Net subtotal</th></tr></thead>
              <tbody>{data.daily.map((d) => <tr key={d.date}><td style={S.td}>{d.date}</td><td style={S.td}>{d.orders}</td><td style={S.td}>{currency(d.sales)}</td></tr>)}</tbody>
            </table></div>
          )}
        </div>

        <div style={S.card}>
          <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>Financial status</h2>
          {data.financialStatuses.length === 0 ? <div style={S.muted}>No order status data for this range.</div> : data.financialStatuses.map((s) => <div key={s.status} style={{ padding: "8px 0", borderBottom: "1px solid #27272a", fontSize: 13 }}>{s.status.replace(/_/g, " ")} <span style={{ float: "right", color: "#a1a1aa" }}>{s.orders} orders</span></div>)}
          {data.summary.cancelledOrders > 0 && <div style={{ ...S.muted, marginTop: 10 }}>{data.summary.cancelledOrders} cancelled orders excluded from sales totals.</div>}
        </div>
        <div style={S.muted}>Based on {data.dataQuality.returnedOrders.toLocaleString()} Shopify orders returned for {data.range.start} through {data.range.end}. Sales use Shopify's current subtotal; customer count is distinct purchasing customers with an order in this period.</div>
      </>}
    </div>
  );
}
