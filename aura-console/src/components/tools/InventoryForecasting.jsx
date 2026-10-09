import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";
import PurchaseOrders from "./PurchaseOrders.jsx";

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
const API = "/api/inventory-forecasting";
const LABEL = { out: "Out of stock", reorder: "Reorder", "no-sales": "No sales", ok: "OK" };
const COLOUR = { out: "#ef4444", reorder: "#f59e0b", "no-sales": "#a1a1aa", ok: "#22c55e" };

export default function InventoryCash() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [sup, setSup] = useState({ name: "", email: "", leadDays: "14" });
  const [po, setPo] = useState(null);
  const [brief, setBrief] = useState(null);
  const [filter, setFilter] = useState("attention");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);
  const load = async () => { const r = await run("load", "/overview"); if (r) setData(r); };
  useEffect(() => { load(); }, []); // eslint-disable-line
  const send = (method, body) => ({ method, body: JSON.stringify(body || {}) });

  async function addSupplier() { const r = await run("sup", "/suppliers", send("POST", sup)); if (r) { setSup({ name: "", email: "", leadDays: "14" }); load(); } }
  async function assign(productId, supplierId) { await run("as", "/assign", send("PUT", { productId, supplierId })); load(); }
  async function draftPo(s) { setPo(null); const r = await run("po:" + s.id, "/po-draft", send("POST", { supplierId: s.id })); if (r) setPo(r); }
  async function getBrief() { const r = await run("brief", "/brief", send("POST")); if (r) setBrief(r.brief); }

  const f = data && data.finance; const money = (n) => (f ? f.currency + " " + n.toLocaleString() : n);
  const items = data ? data.items.filter((i) => filter === "all" || i.status === "out" || i.status === "reorder") : [];
  return (
    <div style={S.root}>
      <h1 style={S.title}>Inventory & Cash</h1>
      <p style={S.subtitle}>Stock levels, how fast things sell, what to reorder from which supplier, and where your money is. Calculated from your real stock and the last {data ? data.windowDays : 60} days of orders.</p>
      {error && <div style={S.error}>{error}</div>}
      {data && data.note && <div style={S.warn}>{data.note}</div>}

      {f && (
        <div style={S.card}>
          <h2 style={S.h}>Money, last 30 days</h2>
          <div style={S.row}><span>Revenue {money(f.last30.revenue)} from {f.last30.orders} orders (average {money(f.last30.aov)})</span><span style={S.muted}>{f.revenueChangePct === null ? "No earlier period to compare" : (f.revenueChangePct >= 0 ? "+" : "") + f.revenueChangePct + "% vs previous 30 days"}</span></div>
          <div style={S.row}><span>Stock worth {money(f.stockAtRetail)} at retail</span><span style={S.muted}>{f.stockAtCost === null ? "Cost per item not set in Shopify, so stock cost is unknown" : money(f.stockAtCost) + " at cost"}</span></div>
          <button style={{ ...S.btn, marginTop: 8, ...(!data.ai || busy ? S.off : {}) }} disabled={!data.ai || !!busy} onClick={getBrief}>{busy === "brief" ? "Writing…" : "AI daily brief (2 credits)"}</button>
          {brief && <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#d4d4d8", marginTop: 8 }}>{brief}</div>}
        </div>
      )}

      <div style={S.card}>
        <h2 style={S.h}>Stock</h2>
        {!data && <div style={S.empty}>Loading…</div>}
        {data && data.counts && <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>{Object.keys(LABEL).map((k) => <span key={k} style={{ ...S.pill, color: COLOUR[k] }}>{LABEL[k]} {data.counts[k]}</span>)}</div>}
        {data && <div style={{ display: "flex", gap: 8, marginBottom: 8 }}><button style={filter === "attention" ? S.btn : S.ghost} onClick={() => setFilter("attention")}>Needs attention</button><button style={filter === "all" ? S.btn : S.ghost} onClick={() => setFilter("all")}>All items</button></div>}
        {data && data.items.length === 0 && <div style={S.empty}>No active products found.</div>}
        {data && filter === "attention" && !data.ordersAvailable && <div style={S.empty}>Switch to "All items" to see stock levels.</div>}
        {data && (filter === "all" ? data.items : items).map((i) => (
          <div key={i.id} style={S.row}>
            <div><strong>{i.title}</strong><div style={S.muted}>{i.qty} in stock{data.ordersAvailable ? " · " + i.sold60 + " sold in 60 days" + (i.daysCover !== null ? " · " + i.daysCover + " days left" : "") : ""}{i.status === "reorder" ? " · suggest ordering " + i.suggestedQty : ""}</div></div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select style={{ ...S.input, width: 140 }} value={data.map[i.productId] || ""} onChange={(e) => assign(i.productId, e.target.value)}>
                <option value="">No supplier</option>{data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {data.ordersAvailable && <span style={{ ...S.pill, color: COLOUR[i.status] }}>{LABEL[i.status]}</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Suppliers</h2>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input style={S.input} placeholder="Supplier name" value={sup.name} onChange={(e) => setSup({ ...sup, name: e.target.value })} />
          <input style={S.input} placeholder="Email (optional)" value={sup.email} onChange={(e) => setSup({ ...sup, email: e.target.value })} />
          <input style={{ ...S.input, width: 110 }} type="number" min="1" placeholder="Lead days" value={sup.leadDays} onChange={(e) => setSup({ ...sup, leadDays: e.target.value })} />
          <button style={{ ...S.btn, ...(!sup.name.trim() || busy ? S.off : {}) }} disabled={!sup.name.trim() || !!busy} onClick={addSupplier}>Add</button>
        </div>
        {data && data.suppliers.length === 0 && <div style={S.empty}>No suppliers yet. Add one, then assign it to your products so reorder timing uses its real lead time (otherwise 14 days is assumed).</div>}
        {data && data.suppliers.map((s) => (
          <div key={s.id} style={S.row}>
            <span>{s.name} <span style={S.muted}>· {s.leadDays} day lead{s.email ? " · " + s.email : ""}</span></span>
            <span>
              <button style={{ ...S.ghost, ...(!data.ai || !data.ordersAvailable || busy ? S.off : {}) }} disabled={!data.ai || !data.ordersAvailable || !!busy} onClick={() => draftPo(s)}>{busy === "po:" + s.id ? "Writing…" : "AI order email (1 credit)"}</button>{" "}
              <button style={S.ghost} onClick={() => run("d", "/suppliers/" + s.id, { method: "DELETE" }).then(load)}>Delete</button>
            </span>
          </div>
        ))}
        {po && (
          <div style={{ marginTop: 10 }}>
            <strong>Order for {po.supplier.name}</strong>
            <ul style={{ margin: "4px 0 0 18px", fontSize: 13, color: "#d4d4d8" }}>{po.lines.map((l, i) => <li key={i}>{l.qty} × {l.title}</li>)}</ul>
            <textarea style={{ ...S.input, minHeight: 140, marginTop: 6 }} defaultValue={po.email} />
            <div style={S.muted}>Copy this into your own email, or save a purchase order below to email it from here.</div>
          </div>
        )}
      </div>

      {data && <PurchaseOrders items={data.items} suppliers={data.suppliers} onStockChanged={load} />}
    </div>
  );
}