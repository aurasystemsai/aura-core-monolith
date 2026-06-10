
import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/inventory-supplier-sync";

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
  { id: "sync",    label: "Sync & Analyse" },
  { id: "suggest", label: "AI Optimise" },
  { id: "guide",   label: "Supplier Guide" },
];

const SAMPLE_DATA = `SKU001, Widget Pro, Supplier: TechParts Ltd, Stock: 240, Reorder: 50, Lead time: 7 days
SKU002, Blue T-Shirt (S/M/L), Supplier: FabricCo, Stock: 80, Reorder: 100, Lead time: 14 days
SKU003, Premium Candle Set, Supplier: WaxWorks, Stock: 15, Reorder: 30, Lead time: 21 days
SKU004, Wireless Earbuds, Supplier: AudioTech, Stock: 320, Reorder: 50, Lead time: 5 days`;

export default function InventorySupplierSync() {
  const [tab, setTab]           = useState("sync");
  const [data, setData]         = useState("");
  const [syncResult, setSyncResult] = useState(null);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [syncHistory, setSyncHistory] = useState([]);

  const runSync = async () => {
    if (!data.trim()) return;
    setLoading(true); setError(""); setSyncResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/sync`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierData: data }),
      });
      if (!r.ok) throw new Error(r.error || "Sync failed");
      setSyncResult(r.analytics);
      setSyncHistory(p => [{ data: data.slice(0, 100), result: r.analytics, ts: new Date().toISOString() }, ...p].slice(0, 10));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const runSuggest = async () => {
    if (!data.trim()) return;
    setLoading(true); setError(""); setSuggestion("");
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierData: data }),
      });
      if (!r.ok) throw new Error(r.error || "AI suggest failed");
      setSuggestion(r.suggestion || "");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const importFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setData(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Inventory Supplier Sync</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Import supplier inventory data, run AI-powered sync analysis to identify discrepancies and stockout risks, then get actionable optimisation recommendations.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* SYNC & ANALYSE */}
      {tab === "sync" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={S.sectionTitle}>Supplier Inventory Data</div>
              <div style={{ display: "flex", gap: 6 }}>
                <label style={{ ...S.btn(), fontSize: 11, padding: "5px 10px", cursor: "pointer" }}>
                  Import File<input type="file" accept=".csv,.xlsx,.json,.txt" style={{ display: "none" }} onChange={importFile} />
                </label>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => setData(SAMPLE_DATA)}>Load Sample</button>
                {data && <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => setData("")}>Clear</button>}
              </div>
            </div>
            <textarea style={{ ...S.ta, minHeight: 160 }} value={data} onChange={e => setData(e.target.value)} placeholder="Paste supplier inventory data here (CSV, JSON, or plain text)…&#10;Format: SKU, Product, Supplier, Stock qty, Reorder point, Lead time" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={runSync} disabled={loading || !data.trim()}>{loading ? "Syncing…" : "Run Sync Analysis"}</button>
              <button style={{ ...S.btn("green"), fontSize: 11, padding: "6px 12px" }} onClick={() => { setTab("suggest"); runSuggest(); }} disabled={loading || !data.trim()}>AI Optimise</button>
            </div>
          </div>

          <ErrorBox message={error} />
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {syncResult && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Sync Analysis Results</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(syncResult.summary || JSON.stringify(syncResult, null, 2))}>Copy</button>
              </div>
              {syncResult.summary && <pre style={S.pre}>{syncResult.summary}</pre>}
              {syncResult.syncedAt && <div style={{ fontSize: 11, color: "#52525b", marginTop: 8 }}>Synced: {new Date(syncResult.syncedAt).toLocaleString()}</div>}
            </div>
          )}

          {syncHistory.length > 0 && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Recent Syncs</div>
              {syncHistory.map((h, i) => (
                <div key={i} style={S.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "#52525b" }}>{new Date(h.ts).toLocaleString()}</div>
                    <div style={{ fontSize: 12, color: "#a1a1aa" }}>{h.data}…</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI OPTIMISE */}
      {tab === "suggest" && (
        <div style={{ marginTop: 20 }}>
          {!data.trim() && (
            <div style={S.card}>
              <div style={S.sectionTitle}>No Data Loaded</div>
              <p style={{ fontSize: 13, color: "#71717a" }}>Add supplier inventory data in the Sync & Analyse tab first, then come back here for AI optimisation recommendations.</p>
              <button style={S.btn("primary")} onClick={() => setTab("sync")}>Load Data</button>
            </div>
          )}
          {data.trim() && !suggestion && !loading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Data Loaded — Ready to Optimise</div>
              <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>{data.split("\n").filter(l => l.trim()).length} supplier lines loaded. Click below to get AI optimisation recommendations.</p>
              <button style={S.btn("primary")} onClick={runSuggest} disabled={loading}>Get AI Recommendations</button>
            </div>
          )}
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {suggestion && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI Optimisation Recommendations</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(suggestion)}>Copy</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={runSuggest}>Refresh</button>
                </div>
              </div>
              <pre style={S.pre}>{suggestion}</pre>
            </div>
          )}
          <ErrorBox message={error} />
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Supplier Relationship Management</div>
            {[
              { t: "Diversify supplier base",          d: "Never rely on a single supplier for more than 40% of your inventory. Two approved suppliers per category provides resilience without complexity." },
              { t: "Negotiate extended payment terms",  d: "Aim for net-45 to net-60 payment terms with key suppliers. This effectively provides free working capital and improves cash flow significantly." },
              { t: "Volume commitment discounts",       d: "Commit to quarterly minimums in exchange for 5-15% volume discounts. Model your expected growth and negotiate accordingly." },
              { t: "Implement vendor-managed inventory", d: "For A-class suppliers, explore VMI where the supplier manages replenishment. Reduces PO overhead and stockout risk." },
              { t: "Lead time audits",                  d: "Audit actual vs quoted lead times quarterly. Average supplier overpromises lead time by 15-20%. Build this buffer into your ROP calculations." },
              { t: "Supplier scorecards",               d: "Rate suppliers monthly on: on-time delivery, quality defect rate, fill rate, responsiveness, and price competitiveness. Share scores quarterly." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🔗</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Key Metrics to Track</div>
            {[
              { metric: "Fill Rate",               target: "> 98%",       desc: "% of orders fulfilled from stock without backorders" },
              { metric: "On-Time Delivery Rate",   target: "> 95%",       desc: "% of supplier deliveries arriving on or before promised date" },
              { metric: "Inventory Turnover",      target: "4-12× / year", desc: "Higher = faster-moving stock, lower holding costs" },
              { metric: "Days Sales of Inventory", target: "30-60 days",   desc: "Average days to sell current inventory — lower is better" },
              { metric: "Supplier Defect Rate",    target: "< 0.5%",      desc: "% of received units failing quality inspection" },
            ].map(r => (
              <div key={r.metric} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{r.metric}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>{r.target}</span>
                <span style={{ color: "#71717a" }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
