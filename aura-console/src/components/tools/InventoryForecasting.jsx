import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/inventory-forecasting";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "forecast", label: "Demand Forecast" },
  { id: "reorder",  label: "Reorder Alerts" },
  { id: "history",  label: "Query History" },
  { id: "guide",    label: "Strategy Guide" },
];

const SAMPLE_QUERIES = [
  "Forecast demand for our best-selling winter coats over the next 30 days. Last month we sold 240 units.",
  "We have 500 units of a supplement product. Average sales are 80/week. When should we reorder and how many units?",
  "Our electronics product line is showing a 15% week-on-week sales increase. How should we adjust our stock levels?",
  "Predict which of our 3 product lines will run out of stock first: Product A (200 units, 40/week), Product B (350 units, 90/week), Product C (120 units, 25/week).",
];

export default function InventoryForecasting() {
  const [tab, setTab]         = useState("forecast");
  const [query, setQuery]     = useState("");
  const [result, setResult]   = useState(null);
  const [queries, setQueries] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { loadHistory(); loadAnalytics(); }, []);

  const loadHistory = async () => {
    try {
      const r = await apiFetchJSON(`${API}/queries`);
      if (r.ok) setQueries(r.queries || []);
    } catch {}
  };

  const loadAnalytics = async () => {
    try {
      const r = await apiFetchJSON(`${API}/analytics`);
      if (r.ok) setAnalytics(r.analytics);
    } catch {}
  };

  const runForecast = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!r.ok) throw new Error(r.error || "Forecast failed");
      setResult(r.result);
      loadHistory();
      loadAnalytics();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const deleteQuery = async (id) => {
    setDeleting(id);
    try {
      await apiFetchJSON(`${API}/queries/${id}`, { method: "DELETE" });
      setQueries(p => p.filter(q => q.id !== id));
    } catch {}
    setDeleting(null);
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(queries, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "inventory-forecasts.json"; a.click();
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Inventory Forecasting</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered demand forecasting, reorder planning and stock optimisation. Describe your inventory situation and get data-driven recommendations backed by market intelligence.</p>
      </div>

      {analytics && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total Forecasts</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#4f46e5", marginTop: 2 }}>{analytics.totalQueries || 0}</div>
          </div>
        </div>
      )}

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* FORECAST */}
      {tab === "forecast" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Describe Your Inventory Scenario</div>
            <textarea style={{ ...S.ta, minHeight: 130 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. 'Forecast demand for our best-selling winter boots over the next 30 days. Current stock: 380 units. Last month sales: 290 units. Sales are trending up 12% week-on-week.'" />
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <button style={S.btn("primary")} onClick={runForecast} disabled={loading || !query.trim()}>{loading ? "Forecasting…" : "Run AI Forecast"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setQuery("")}>Clear</button>
            </div>
          </div>

          {!query && !result && !loading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Sample Queries — Click to Load</div>
              {SAMPLE_QUERIES.map((q, i) => (
                <div key={i} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setQuery(q)}>Load</button>
                  <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{q}</div>
                </div>
              ))}
            </div>
          )}

          <ErrorBox message={error} />
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Forecast Result</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof result === "string" ? result : JSON.stringify(result, null, 2))}>Copy</button>
              </div>
              <pre style={S.pre}>{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* REORDER ALERTS */}
      {tab === "reorder" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Reorder Point Calculator</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>Use the Demand Forecast tab to get an AI-powered reorder plan, or use this manual calculator to find your reorder point.</p>
            <ReorderCalculator />
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Safety Stock Benchmarks by Category</div>
            {[
              { cat: "Apparel & Fashion",      leadTime: "14-21 days", safetyStock: "2-3 weeks",  note: "High seasonality — buffer for trend spikes" },
              { cat: "Electronics",            leadTime: "7-14 days",  safetyStock: "1-2 weeks",  note: "Lower margins — keep safety stock lean" },
              { cat: "Health & Beauty",        leadTime: "7-10 days",  safetyStock: "2-3 weeks",  note: "Steady demand — moderate safety stock" },
              { cat: "Food & Beverage",        leadTime: "3-7 days",   safetyStock: "1-2 weeks",  note: "Perishables — tight stock management required" },
              { cat: "Home & Garden",          leadTime: "14-30 days", safetyStock: "3-4 weeks",  note: "Seasonal peaks — increase Q3/Q4 buffer" },
              { cat: "Sports & Outdoor",       leadTime: "10-21 days", safetyStock: "2-4 weeks",  note: "High seasonality — forecast by quarter" },
            ].map(r => (
              <div key={r.cat} style={{ ...S.row, flexWrap: "wrap" }}>
                <div style={{ minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{r.cat}</div>
                  <div style={{ fontSize: 11, color: "#71717a" }}>{r.note}</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#a1a1aa" }}>Lead time: {r.leadTime}</span>
                  <span style={{ background: "#1a1a2e", border: "1px solid #3730a3", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#818cf8" }}>Safety stock: {r.safetyStock}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{queries.length} saved forecasts</div>
            <div style={{ display: "flex", gap: 6 }}>
              {queries.length > 0 && <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={exportHistory}>Export JSON</button>}
              <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadHistory}>Refresh</button>
            </div>
          </div>
          {queries.length === 0 ? (
            <EmptyState icon="📦" title="No forecasts yet" description="Run your first demand forecast in the Demand Forecast tab." />
          ) : (
            queries.map((q) => (
              <div key={q.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ fontSize: 12, color: "#52525b", marginBottom: 4 }}>{q.createdAt ? new Date(q.createdAt).toLocaleString() : "Saved forecast"}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", marginBottom: 6 }}>{q.query?.slice(0, 120)}{q.query?.length > 120 ? "…" : ""}</div>
                    {q.result && <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{(typeof q.result === "string" ? q.result : JSON.stringify(q.result)).slice(0, 200)}…</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(q.query); setTab("forecast"); }}>Re-use</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteQuery(q.id)} disabled={deleting === q.id}>{deleting === q.id ? "…" : "Delete"}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Inventory Optimisation Principles</div>
            {[
              { t: "ABC Analysis", d: "Classify inventory into A (top 20% items driving 80% revenue), B (moderate), and C (low-value). Focus forecasting effort on A items. Review C items for discontinuation." },
              { t: "Economic Order Quantity (EOQ)", d: "EOQ = √(2DS/H) where D=annual demand, S=order cost, H=holding cost per unit. Minimises the total cost of ordering and holding inventory." },
              { t: "Safety Stock Formula", d: "Safety Stock = Z × σ_LT × √LT, where Z=service level factor (1.65 for 95%), σ_LT=demand standard deviation, LT=lead time in days." },
              { t: "Reorder Point (ROP)", d: "ROP = (Average daily demand × Lead time) + Safety stock. When stock reaches this level, place a new order to avoid stockouts." },
              { t: "Seasonal Adjustment", d: "Multiply base forecast by a seasonal index. Calculate seasonal index = (Period avg sales) / (Overall avg sales). Apply 3-year rolling average for accuracy." },
              { t: "Demand Sensing", d: "Use real-time signals (ad spend, social trends, weather, competitor stockouts) to adjust near-term forecasts by ±15-30%. Most ERP systems miss this layer." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", fontSize: 15, flexShrink: 0 }}>📦</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReorderCalculator() {
  const [avgDaily, setAvgDaily]   = useState("");
  const [leadTime, setLeadTime]   = useState("");
  const [safetyDays, setSafety]   = useState("7");
  const rop = avgDaily && leadTime
    ? Math.ceil(Number(avgDaily) * Number(leadTime) + Number(avgDaily) * Number(safetyDays))
    : null;

  const S2 = {
    label: { fontSize: 12, color: "#71717a", marginBottom: 4, display: "block" },
    inp: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 14, padding: "9px 14px", outline: "none", width: "100%" },
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div>
          <label style={S2.label}>Avg daily sales (units)</label>
          <input style={S2.inp} type="number" min="0" value={avgDaily} onChange={e => setAvgDaily(e.target.value)} placeholder="e.g. 40" />
        </div>
        <div>
          <label style={S2.label}>Supplier lead time (days)</label>
          <input style={S2.inp} type="number" min="0" value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="e.g. 14" />
        </div>
        <div>
          <label style={S2.label}>Safety stock buffer (days)</label>
          <input style={S2.inp} type="number" min="0" value={safetyDays} onChange={e => setSafety(e.target.value)} placeholder="e.g. 7" />
        </div>
      </div>
      {rop !== null && (
        <div style={{ background: "#0d0d0f", border: "1px solid #4f46e5", borderRadius: 10, padding: "16px 20px" }}>
          <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>REORDER POINT</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: "#4f46e5" }}>{rop.toLocaleString()} units</div>
          <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 6 }}>
            ({avgDaily} units/day × {leadTime} day lead time) + ({avgDaily} × {safetyDays} day buffer) = {rop.toLocaleString()} units
          </div>
        </div>
      )}
    </div>
  );
}
