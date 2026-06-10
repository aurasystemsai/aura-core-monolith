import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/inventory-forecasting";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "forecast", label: "AI Forecast" },
  { id: "skus",     label: "SKU Tracker" },
  { id: "reorder",  label: "Reorder Calc" },
  { id: "history",  label: "History" },
  { id: "guide",    label: "Strategy Guide" },
];

const getUrgency = (stock, threshold) => {
  if (!threshold) return { label: "No threshold", color: "#52525b", bg: "#27272a" };
  const n = Number(stock); const t = Number(threshold);
  if (n <= 0)       return { label: "Out of Stock", color: "#f87171", bg: "#3f1315" };
  if (n <= t * 0.5) return { label: "Critical",     color: "#fb923c", bg: "#431407" };
  if (n <= t)       return { label: "Low",           color: "#fbbf24", bg: "#3d2a0a" };
  return               { label: "OK",             color: "#4ade80", bg: "#052e16" };
};

const EMPTY_SKU = { productName: "", sku: "", currentStock: "", reorderThreshold: "", supplier: "", leadDays: "", category: "" };

const SAMPLE_QUERIES = [
  "Forecast demand for our best-selling winter coats over the next 30 days. Last month we sold 240 units.",
  "We have 500 units of a supplement. Average sales 80/week. When should we reorder and how many?",
  "Our electronics line is showing 15% week-on-week sales increase. How should we adjust stock levels?",
  "Predict which product line runs out first: A (200 units, 40/week), B (350 units, 90/week), C (120 units, 25/week).",
];

export default function InventoryForecasting() {
  const [tab, setTab]           = useState("forecast");
  const [query, setQuery]       = useState("");
  const [result, setResult]     = useState(null);
  const [queries, setQueries]   = useState([]);
  const [skus, setSkus]         = useState([]);
  const [skuForm, setSkuForm]   = useState(EMPTY_SKU);
  const [loading, setLoading]   = useState(false);
  const [skuLoading, setSkuLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError]       = useState("");
  const [skuError, setSkuError] = useState("");
  const [skuSuccess, setSkuSuccess] = useState("");

  useEffect(() => { loadHistory(); loadSkus(); }, []);

  const loadHistory = async () => {
    try { const r = await apiFetchJSON(`${API}/queries`); if (r.ok) setQueries(r.queries || []); } catch {}
  };
  const loadSkus = async () => {
    try { const r = await apiFetchJSON(`${API}/skus`); if (r.ok) setSkus(r.skus || []); } catch {}
  };

  const runForecast = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/query`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
      if (!r.ok) throw new Error(r.error || "Forecast failed");
      setResult(r.result); loadHistory();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const addSku = async () => {
    if (!skuForm.productName || !skuForm.currentStock) { setSkuError("Product name and current stock are required."); return; }
    setSkuLoading(true); setSkuError(""); setSkuSuccess("");
    try {
      const r = await apiFetchJSON(`${API}/skus`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(skuForm) });
      if (!r.ok) throw new Error(r.error || "Failed to add SKU");
      setSkuSuccess("SKU added."); setSkuForm(EMPTY_SKU); loadSkus();
      setTimeout(() => setSkuSuccess(""), 3000);
    } catch (e) { setSkuError(e.message); }
    setSkuLoading(false);
  };

  const deleteSku = async (id) => {
    setDeleting(`sku-${id}`);
    try { await apiFetchJSON(`${API}/skus/${id}`, { method: "DELETE" }); setSkus(p => p.filter(s => s.id !== id)); } catch {}
    setDeleting(null);
  };

  const deleteQuery = async (id) => {
    try { await apiFetchJSON(`${API}/queries/${id}`, { method: "DELETE" }); setQueries(p => p.filter(q => q.id !== id)); } catch {}
  };

  const exportHistory = () => {
    const blob = new Blob([JSON.stringify(queries, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "inventory-forecasts.json"; a.click();
  };

  const outOfStock    = skus.filter(s => Number(s.currentStock) <= 0).length;
  const belowThreshold = skus.filter(s => s.reorderThreshold && Number(s.currentStock) <= Number(s.reorderThreshold)).length;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Inventory Forecasting</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered demand forecasting, SKU tracking, and reorder planning. Describe your inventory scenario for data-driven recommendations, or track individual SKUs for automated reorder alerts.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Tracked SKUs",    value: skus.length,       color: "#818cf8" },
          { label: "Below Threshold", value: belowThreshold,    color: "#fbbf24" },
          { label: "Out of Stock",    value: outOfStock,        color: "#f87171" },
          { label: "Saved Forecasts", value: queries.length,    color: "#4ade80" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* AI FORECAST */}
      {tab === "forecast" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Describe Your Inventory Scenario</div>
            <textarea style={{ ...S.ta, minHeight: 130 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. 'Forecast demand for our best-selling winter boots over the next 30 days. Current stock: 380 units. Last month sales: 290 units. Sales trending up 12% week-on-week.'" />
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

      {/* SKU TRACKER */}
      {tab === "skus" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add SKU / Product</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { key: "productName",       label: "Product Name *",        placeholder: "Blue Denim Jacket" },
                { key: "sku",              label: "SKU / Item Code",       placeholder: "BDJ-XL-001" },
                { key: "category",         label: "Category",              placeholder: "Apparel" },
                { key: "currentStock",     label: "Current Stock *",       placeholder: "380" },
                { key: "reorderThreshold", label: "Reorder Threshold",     placeholder: "100" },
                { key: "leadDays",         label: "Supplier Lead (days)",  placeholder: "14" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>{f.label}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={skuForm[f.key]} onChange={e => setSkuForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Supplier Name</label>
              <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={skuForm.supplier} onChange={e => setSkuForm(p => ({ ...p, supplier: e.target.value }))} placeholder="Acme Suppliers Ltd" />
            </div>
            <ErrorBox message={skuError} />
            {skuSuccess && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 8 }}>{skuSuccess}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={addSku} disabled={skuLoading}>{skuLoading ? "Adding…" : "Add SKU"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setSkuForm(EMPTY_SKU)}>Clear</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{skus.length} SKUs tracked</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadSkus}>Refresh</button>
          </div>

          {skus.length === 0 ? (
            <EmptyState icon="📦" title="No SKUs tracked yet" description="Add your first product above to start tracking reorder points." />
          ) : (
            skus.map(sku => {
              const u = getUrgency(sku.currentStock, sku.reorderThreshold);
              return (
                <div key={sku.id} style={{ ...S.card, borderLeft: `4px solid ${u.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{sku.productName}</span>
                        {sku.sku && <span style={{ fontSize: 11, color: "#52525b", background: "#09090b", border: "1px solid #27272a", borderRadius: 4, padding: "1px 6px" }}>{sku.sku}</span>}
                        <span style={{ background: u.bg, color: u.color, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{u.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: "#71717a" }}>
                        <span>Stock: <strong style={{ color: "#fafafa" }}>{sku.currentStock ?? "—"}</strong></span>
                        {sku.reorderThreshold && <span>Reorder at: <strong style={{ color: "#fbbf24" }}>{sku.reorderThreshold}</strong></span>}
                        {sku.supplier && <span>Supplier: {sku.supplier}</span>}
                        {sku.leadDays && <span>Lead: {sku.leadDays}d</span>}
                        {sku.category && <span>Cat: {sku.category}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(`Forecast demand for ${sku.productName}. Current stock: ${sku.currentStock} units. Reorder threshold: ${sku.reorderThreshold || "N/A"}. Supplier lead time: ${sku.leadDays || "?"} days.`); setTab("forecast"); }}>Forecast</button>
                      <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteSku(sku.id)} disabled={deleting === `sku-${sku.id}`}>{deleting === `sku-${sku.id}` ? "…" : "Delete"}</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* REORDER CALC */}
      {tab === "reorder" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Reorder Point Calculator</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>Calculate exactly when to place a new order to avoid stockouts while minimising excess inventory.</p>
            <ReorderCalculator />
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Safety Stock Benchmarks by Category</div>
            {[
              { cat: "Apparel & Fashion",  leadTime: "14-21 days", safetyStock: "2-3 weeks", note: "High seasonality — buffer for trend spikes" },
              { cat: "Electronics",        leadTime: "7-14 days",  safetyStock: "1-2 weeks", note: "Lower margins — keep safety stock lean" },
              { cat: "Health & Beauty",    leadTime: "7-10 days",  safetyStock: "2-3 weeks", note: "Steady demand — moderate safety stock" },
              { cat: "Food & Beverage",    leadTime: "3-7 days",   safetyStock: "1-2 weeks", note: "Perishables — tight stock management required" },
              { cat: "Home & Garden",      leadTime: "14-30 days", safetyStock: "3-4 weeks", note: "Seasonal peaks — increase Q3/Q4 buffer" },
              { cat: "Sports & Outdoor",   leadTime: "10-21 days", safetyStock: "2-4 weeks", note: "High seasonality — forecast by quarter" },
            ].map(r => (
              <div key={r.cat} style={{ ...S.row, flexWrap: "wrap" }}>
                <div style={{ minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{r.cat}</div>
                  <div style={{ fontSize: 11, color: "#71717a" }}>{r.note}</div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#a1a1aa" }}>Lead: {r.leadTime}</span>
                  <span style={{ background: "#1a1a2e", border: "1px solid #3730a3", borderRadius: 6, padding: "3px 10px", fontSize: 11, color: "#818cf8" }}>Safety: {r.safetyStock}</span>
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
            <EmptyState icon="📋" title="No forecasts yet" description="Run your first AI demand forecast in the AI Forecast tab." />
          ) : (
            queries.map(q => (
              <div key={q.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ fontSize: 11, color: "#52525b", marginBottom: 4 }}>{q.createdAt ? new Date(q.createdAt).toLocaleString() : "Saved"}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", marginBottom: 6 }}>{q.query?.slice(0, 120)}{q.query?.length > 120 ? "…" : ""}</div>
                    {q.result && <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{(typeof q.result === "string" ? q.result : JSON.stringify(q.result)).slice(0, 200)}…</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(q.query); setTab("forecast"); }}>Re-use</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteQuery(q.id)}>Delete</button>
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
              { t: "Economic Order Quantity (EOQ)", d: "EOQ = √(2DS/H) where D=annual demand, S=order cost, H=holding cost per unit. Minimises total cost of ordering and holding inventory." },
              { t: "Safety Stock Formula", d: "Safety Stock = Z × σ_LT × √LT, where Z=service level factor (1.65 for 95%), σ_LT=demand standard deviation, LT=lead time in days." },
              { t: "Reorder Point (ROP)", d: "ROP = (Average daily demand × Lead time) + Safety stock. When stock reaches this level, place a new order to avoid stockouts." },
              { t: "Seasonal Adjustment", d: "Multiply base forecast by a seasonal index. Seasonal index = (Period avg sales) / (Overall avg sales). Apply 3-year rolling average for accuracy." },
              { t: "Demand Sensing", d: "Use real-time signals (ad spend, social trends, weather, competitor stockouts) to adjust near-term forecasts by ±15-30%. Most ERP systems miss this layer." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", fontSize: 15, flexShrink: 0 }}>📦</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>KPI Benchmarks</div>
            {[
              { kpi: "Inventory Turnover",   target: "4-8× per year",              note: "Higher = better. Less than 4 suggests overstocking." },
              { kpi: "Stockout Rate",        target: "< 2%",                       note: "% of SKUs out of stock at any given time." },
              { kpi: "Fill Rate",            target: "> 98%",                      note: "% of orders fulfilled from available stock." },
              { kpi: "Days of Supply",       target: "30-60 days",                 note: "How many days current inventory will last at avg sales rate." },
              { kpi: "Carrying Cost",        target: "20-30% of inventory value/yr", note: "Includes warehousing, insurance, depreciation." },
            ].map(r => (
              <div key={r.kpi} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{r.kpi}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>{r.target}</span>
                <span style={{ color: "#71717a" }}>{r.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ReorderCalculator() {
  const [avgDaily, setAvgDaily] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [safetyDays, setSafety] = useState("7");
  const rop    = avgDaily && leadTime ? Math.ceil(Number(avgDaily) * Number(leadTime) + Number(avgDaily) * Number(safetyDays)) : null;
  const suggest = rop ? Math.ceil(rop * 2) : null;
  const S2 = {
    label: { fontSize: 12, color: "#71717a", marginBottom: 4, display: "block" },
    inp: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 14, padding: "9px 14px", outline: "none", width: "100%" },
  };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div><label style={S2.label}>Avg daily sales (units)</label><input style={S2.inp} type="number" min="0" value={avgDaily} onChange={e => setAvgDaily(e.target.value)} placeholder="40" /></div>
        <div><label style={S2.label}>Supplier lead time (days)</label><input style={S2.inp} type="number" min="0" value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="14" /></div>
        <div><label style={S2.label}>Safety stock buffer (days)</label><input style={S2.inp} type="number" min="0" value={safetyDays} onChange={e => setSafety(e.target.value)} placeholder="7" /></div>
      </div>
      {rop !== null && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: "#0d0d0f", border: "1px solid #4f46e5", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4, textTransform: "uppercase" }}>Reorder Point</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#4f46e5" }}>{rop.toLocaleString()} units</div>
            <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>({avgDaily}/day × {leadTime}d lead) + ({avgDaily}/day × {safetyDays}d buffer)</div>
          </div>
          <div style={{ background: "#0d0d0f", border: "1px solid #166534", borderRadius: 10, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4, textTransform: "uppercase" }}>Suggested Order Qty</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#4ade80" }}>{suggest?.toLocaleString()} units</div>
            <div style={{ fontSize: 11, color: "#a1a1aa", marginTop: 4 }}>Covers full lead time + safety buffer × 2</div>
          </div>
        </div>
      )}
    </div>
  );
}
