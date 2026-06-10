import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/inventory-supplier-sync";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "suppliers", label: "Suppliers" },
  { id: "reorder",   label: "Reorder Dashboard" },
  { id: "sync",      label: "Sync & AI Analyse" },
  { id: "orders",    label: "Purchase Orders" },
  { id: "guide",     label: "Supplier Guide" },
];

const CATEGORIES  = ["Electronics", "Clothing & Apparel", "Home & Garden", "Health & Beauty", "Sports", "Food & Beverage", "Stationery", "Toys", "Automotive", "Other"];
const TERMS_OPTS  = ["Net 7", "Net 15", "Net 30", "Net 45", "Net 60", "Prepayment", "COD", "Consignment"];
const PO_STATUSES = ["Draft", "Sent", "Confirmed", "Shipped", "Received", "Cancelled"];

const SAMPLE_DATA = `SKU001, Widget Pro, Supplier: TechParts Ltd, Stock: 240, Reorder: 50, Lead time: 7 days
SKU002, Blue T-Shirt S/M/L, Supplier: FabricCo, Stock: 80, Reorder: 100, Lead time: 14 days
SKU003, Premium Candle Set, Supplier: WaxWorks, Stock: 15, Reorder: 30, Lead time: 21 days
SKU004, Wireless Earbuds, Supplier: AudioTech, Stock: 320, Reorder: 50, Lead time: 5 days`;

export default function InventorySupplierSync() {
  const [tab, setTab] = useState("suppliers");

  // Suppliers
  const [suppliers, setSuppliers]   = useState([]);
  const [sLoading, setSLoading]     = useState(false);
  const [newSup, setNewSup] = useState({ name: "", contact: "", email: "", phone: "", website: "", paymentTerms: "Net 30", leadDays: "", category: "Other", notes: "" });
  const setSup = (k, v) => setNewSup(p => ({ ...p, [k]: v }));

  // Reorder
  const [stockData, setStockData]     = useState("");
  const [reorderItems, setReorderItems] = useState(null);

  // Sync & Analyse
  const [syncData, setSyncData]       = useState("");
  const [syncResult, setSyncResult]   = useState(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // Purchase Orders
  const [orders, setOrders]         = useState([]);
  const [oLoading, setOLoading]     = useState(false);
  const [newOrder, setNewOrder] = useState({ supplier: "", items: "", totalValue: "", status: "Draft", expectedDate: "" });
  const setOrd = (k, v) => setNewOrder(p => ({ ...p, [k]: v }));

  const [error, setError] = useState("");

  const fetchSuppliers = useCallback(async () => {
    setSLoading(true);
    try { const r = await apiFetchJSON(`${API}/suppliers`); if (r.ok) setSuppliers(r.suppliers || []); } catch {}
    setSLoading(false);
  }, []);

  const fetchOrders = useCallback(async () => {
    setOLoading(true);
    try { const r = await apiFetchJSON(`${API}/orders`); if (r.ok) setOrders(r.orders || []); } catch {}
    setOLoading(false);
  }, []);

  useEffect(() => { fetchSuppliers(); fetchOrders(); }, [fetchSuppliers, fetchOrders]);

  const createSupplier = async () => {
    if (!newSup.name.trim()) { setError("Supplier name required"); return; }
    setError("");
    try {
      const r = await apiFetchJSON(`${API}/suppliers`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newSup, createdAt: new Date().toISOString() }),
      });
      if (r.ok) { fetchSuppliers(); setNewSup({ name: "", contact: "", email: "", phone: "", website: "", paymentTerms: "Net 30", leadDays: "", category: "Other", notes: "" }); }
    } catch (e) { setError(e.message); }
  };

  const deleteSupplier = async (id) => {
    try { await apiFetchJSON(`${API}/suppliers/${id}`, { method: "DELETE" }); fetchSuppliers(); } catch {}
  };

  const analyseReorder = () => {
    if (!stockData.trim()) return;
    const lines = stockData.trim().split("\n").filter(l => l.trim());
    const items = lines.map(line => {
      const parts = line.split(",").map(s => s.trim());
      const stock = parseInt((line.match(/[Ss]tock[:\s]+(\d+)/)?.[1] || parts[2] || "0"));
      const reorder = parseInt((line.match(/[Rr]eorder[:\s]+(\d+)/)?.[1] || parts[3] || "0"));
      const sku = parts[0] || "";
      const product = parts[1] || line.slice(0, 30);
      const urgency = stock === 0 ? "out" : stock < reorder * 0.5 ? "critical" : stock < reorder ? "low" : "ok";
      return { sku, product, stock, reorder, urgency };
    });
    setReorderItems(items);
  };

  const runSync = async () => {
    if (!syncData.trim()) return;
    setSyncLoading(true); setError(""); setSyncResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/sync`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierData: syncData }),
      });
      if (!r.ok) throw new Error(r.error || "Sync failed");
      setSyncResult(r.analytics);
    } catch (e) { setError(e.message); }
    setSyncLoading(false);
  };

  const createOrder = async () => {
    if (!newOrder.supplier.trim() || !newOrder.items.trim()) { setError("Supplier and items required"); return; }
    setError("");
    try {
      const r = await apiFetchJSON(`${API}/orders`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newOrder, createdAt: new Date().toISOString() }),
      });
      if (r.ok) { fetchOrders(); setNewOrder({ supplier: "", items: "", totalValue: "", status: "Draft", expectedDate: "" }); }
    } catch (e) { setError(e.message); }
  };

  const updateOrderStatus = async (id, status) => {
    try { await apiFetchJSON(`${API}/orders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); } catch {}
    setOrders(p => p.map(o => o.id === id ? { ...o, status } : o));
  };

  const deleteOrder = async (id) => {
    try { await apiFetchJSON(`${API}/orders/${id}`, { method: "DELETE" }); } catch {}
    setOrders(p => p.filter(o => o.id !== id));
  };

  const urgColor = (u) => u === "out" ? "#f87171" : u === "critical" ? "#fb923c" : u === "low" ? "#fbbf24" : "#4ade80";
  const urgBg    = (u) => u === "out" ? "#3f1315" : u === "critical" ? "#431407" : u === "low" ? "#3d2a0a" : "#052e16";
  const urgLabel = (u) => u === "out" ? "OUT OF STOCK" : u === "critical" ? "CRITICAL" : u === "low" ? "LOW STOCK" : "OK";

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Inventory Supplier Sync</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Manage your supplier network, monitor reorder points, run AI-powered inventory analysis, and track purchase orders from draft to delivery.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Suppliers",    val: suppliers.length,                        color: "#4f46e5" },
          { label: "Open Orders",  val: orders.filter(o => !["Received","Cancelled"].includes(o.status)).length, color: "#818cf8" },
          { label: "Order Value",  val: `£${orders.filter(o => o.status !== "Cancelled").reduce((s, o) => s + (Number(o.totalValue) || 0), 0).toLocaleString()}`, color: "#4ade80" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── SUPPLIERS ── */}
      {tab === "suppliers" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Supplier</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[["name","Supplier Name *","TechParts Ltd"],["contact","Contact Person","Jane Smith"],["email","Email","orders@supplier.com"],["phone","Phone","+44 20 0000 0000"],["website","Website","https://supplier.com"],["leadDays","Lead Time (days)","7"]].map(([k,l,ph]) => (
                <div key={k}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>{l}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newSup[k]} onChange={e => setSup(k, e.target.value)} placeholder={ph} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Category</label>
                <select style={{ ...S.select, width: "100%" }} value={newSup.category} onChange={e => setSup("category", e.target.value)}>{CATEGORIES.map(c => <option key={c}>{c}</option>)}</select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Payment Terms</label>
                <select style={{ ...S.select, width: "100%" }} value={newSup.paymentTerms} onChange={e => setSup("paymentTerms", e.target.value)}>{TERMS_OPTS.map(t => <option key={t}>{t}</option>)}</select>
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Notes (MOQ, restrictions, specialisms)</label>
              <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newSup.notes} onChange={e => setSup("notes", e.target.value)} placeholder="e.g. MOQ 100 units, no returns accepted, specialist in organic cotton" />
            </div>
            <button style={S.btn("primary")} onClick={createSupplier}>Add Supplier</button>
          </div>

          {sLoading ? <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
            : suppliers.length === 0 ? <EmptyState icon="🏭" title="No suppliers yet" description="Add your first supplier above to build your supplier network." />
            : suppliers.map((s, i) => (
              <div key={s.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{s.name}</div>
                      <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{s.category}</span>
                      {s.paymentTerms && <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{s.paymentTerms}</span>}
                      {s.leadDays && <span style={{ background: "#052e16", color: "#4ade80", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{s.leadDays}d lead</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>
                      {[s.contact, s.email, s.phone].filter(Boolean).join(" · ")}
                    </div>
                    {s.notes && <div style={{ fontSize: 11, color: "#52525b", marginTop: 3 }}>{s.notes}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 10 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 8px" }} onClick={() => { setNewOrder(p => ({ ...p, supplier: s.name })); setTab("orders"); }}>New PO</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deleteSupplier(s.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── REORDER DASHBOARD ── */}
      {tab === "reorder" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={S.sectionTitle}>Paste Stock Snapshot</div>
              <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => setStockData(SAMPLE_DATA)}>Load Sample</button>
            </div>
            <textarea style={{ ...S.ta, minHeight: 130 }} value={stockData} onChange={e => setStockData(e.target.value)} placeholder={"Paste your inventory snapshot (CSV or plain text):\nSKU001, Product Name, Stock: 80, Reorder: 100, Lead time: 14 days\n\nSupports: stock/Stock:, reorder/Reorder: patterns"} />
            <button style={{ ...S.btn("primary"), marginTop: 10 }} onClick={analyseReorder} disabled={!stockData.trim()}>Analyse Reorder Points</button>
          </div>

          {reorderItems && (
            <>
              <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
                {["out","critical","low","ok"].map(u => {
                  const count = reorderItems.filter(i => i.urgency === u).length;
                  return (
                    <div key={u} style={{ background: urgBg(u), border: `1px solid ${urgColor(u)}33`, borderRadius: 10, padding: "8px 16px" }}>
                      <div style={{ fontSize: 10, color: urgColor(u), fontWeight: 700, textTransform: "uppercase" }}>{urgLabel(u)}</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: urgColor(u) }}>{count}</div>
                    </div>
                  );
                })}
              </div>
              <div style={S.card}>
                <div style={S.sectionTitle}>Reorder Status — {reorderItems.length} items</div>
                {reorderItems.filter(i => i.urgency !== "ok").concat(reorderItems.filter(i => i.urgency === "ok")).map((item, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 1fr 80px 80px 120px", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                    <span style={{ color: "#52525b", fontSize: 11 }}>{item.sku}</span>
                    <span style={{ color: "#e4e4e7", fontWeight: item.urgency !== "ok" ? 700 : 400 }}>{item.product}</span>
                    <span style={{ color: urgColor(item.urgency), fontWeight: 700 }}>{item.stock} stock</span>
                    <span style={{ color: "#71717a" }}>ROP: {item.reorder}</span>
                    <span style={{ background: urgBg(item.urgency), color: urgColor(item.urgency), padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 700, textAlign: "center" }}>{urgLabel(item.urgency)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!reorderItems && (
            <div style={S.card}>
              <div style={S.sectionTitle}>How Reorder Levels Work</div>
              {[
                { t: "Reorder Point (ROP)", d: "The stock level at which a new order must be placed. Formula: ROP = (Daily sales rate × Lead time) + Safety stock" },
                { t: "Safety Stock",         d: "Buffer stock to protect against demand spikes and supplier delays. Typically 1-2× the maximum lead time demand." },
                { t: "Economic Order Quantity", d: "Optimal order size balancing order costs vs holding costs. Use EOQ = √(2DS/H) where D=demand, S=order cost, H=holding cost per unit." },
                { t: "ABC Analysis",          d: "A items (top 20% by value): tight control, frequent orders. B items (next 30%): moderate control. C items (bottom 50%): loose control, bulk orders." },
              ].map(({ t, d }) => (
                <div key={t} style={S.row}>
                  <span style={{ color: "#4f46e5" }}>📦</span>
                  <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SYNC & AI ANALYSE ── */}
      {tab === "sync" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={S.sectionTitle}>Supplier Inventory Data</div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => setSyncData(SAMPLE_DATA)}>Load Sample</button>
                {syncData && <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => setSyncData("")}>Clear</button>}
              </div>
            </div>
            <textarea style={{ ...S.ta, minHeight: 160 }} value={syncData} onChange={e => setSyncData(e.target.value)} placeholder="Paste supplier inventory data (CSV, JSON, or plain text)&#10;Format: SKU, Product, Supplier, Stock qty, Reorder point, Lead time" />
            <button style={{ ...S.btn("primary"), marginTop: 10 }} onClick={runSync} disabled={syncLoading || !syncData.trim()}>{syncLoading ? "Analysing…" : "Run AI Sync Analysis"}</button>
          </div>
          <ErrorBox message={error} />
          {syncLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {syncResult && !syncLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI Sync Analysis</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(syncResult.summary || JSON.stringify(syncResult, null, 2))}>Copy</button>
              </div>
              <pre style={S.pre}>{syncResult.summary || JSON.stringify(syncResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* ── PURCHASE ORDERS ── */}
      {tab === "orders" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Create Purchase Order</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Supplier *</label>
                <select style={{ ...S.select, width: "100%" }} value={newOrder.supplier} onChange={e => setOrd("supplier", e.target.value)}>
                  <option value="">Select supplier…</option>
                  {suppliers.map(s => <option key={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Total Value (£)</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newOrder.totalValue} onChange={e => setOrd("totalValue", e.target.value)} type="number" placeholder="0.00" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Expected Delivery</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newOrder.expectedDate} onChange={e => setOrd("expectedDate", e.target.value)} type="date" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Items *</label>
              <textarea style={{ ...S.ta, minHeight: 70 }} value={newOrder.items} onChange={e => setOrd("items", e.target.value)} placeholder="e.g. SKU001 × 200, SKU003 × 50, SKU007 × 100" />
            </div>
            <button style={S.btn("primary")} onClick={createOrder}>Create Purchase Order</button>
          </div>

          {oLoading ? <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
            : orders.length === 0 ? <EmptyState icon="📋" title="No purchase orders yet" description="Create your first PO above to track supplier orders." />
            : orders.map((o, i) => (
              <div key={o.id || i} style={{ ...S.card, borderLeft: `3px solid ${o.status === "Received" ? "#4ade80" : o.status === "Cancelled" ? "#f87171" : o.status === "Shipped" ? "#818cf8" : o.status === "Confirmed" ? "#fbbf24" : "#3f3f46"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{o.supplier}</div>
                      {o.totalValue && <span style={{ color: "#4ade80", fontWeight: 700, fontSize: 13 }}>£{Number(o.totalValue).toLocaleString()}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>{o.items?.slice(0, 100)}{(o.items?.length || 0) > 100 ? "…" : ""}</div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>
                      Created: {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                      {o.expectedDate ? ` · Expected: ${new Date(o.expectedDate).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    <select style={{ ...S.select, fontSize: 11, padding: "4px 8px" }} value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value)}>
                      {PO_STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deleteOrder(o.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* ── SUPPLIER GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Supplier Relationship Management</div>
            {[
              { t: "Diversify your supplier base",      d: "Never rely on a single supplier for more than 40% of your inventory. Two approved suppliers per category provides resilience without excessive complexity." },
              { t: "Negotiate extended payment terms",  d: "Aim for net-45 to net-60 payment terms with key suppliers. This effectively provides free working capital and significantly improves cash flow." },
              { t: "Volume commitment discounts",       d: "Commit to quarterly minimums in exchange for 5-15% volume discounts. Model your expected growth and negotiate SKU-by-SKU, not on total spend." },
              { t: "Implement vendor-managed inventory", d: "For A-class suppliers, explore VMI where the supplier manages replenishment. Reduces PO overhead and stockout risk simultaneously." },
              { t: "Audit actual vs quoted lead times",  d: "Average suppliers overpromise lead time by 15-20%. Audit quarterly. Build real-world buffers into ROP calculations, not quoted times." },
              { t: "Supplier scorecards (monthly)",     d: "Rate suppliers on: on-time delivery %, quality defect rate, fill rate, responsiveness, and price competitiveness. Share scores quarterly." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🔗</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Key Supplier & Inventory KPIs</div>
            {[
              { metric: "Fill Rate",               target: "> 98%",        desc: "% of orders fulfilled from stock without backorders" },
              { metric: "On-Time Delivery Rate",   target: "> 95%",        desc: "% of supplier deliveries arriving on or before promised date" },
              { metric: "Inventory Turnover",      target: "4-12× / year", desc: "Higher = faster-moving stock, lower holding costs. Benchmark by industry." },
              { metric: "Days Sales of Inventory", target: "30-60 days",   desc: "Average days to sell current inventory. Lower is better." },
              { metric: "Supplier Defect Rate",    target: "< 0.5%",       desc: "% of received units failing quality inspection at goods-in." },
              { metric: "Perfect Order Rate",      target: "> 96%",        desc: "Orders delivered on time, complete, undamaged, with correct documentation." },
            ].map(r => (
              <div key={r.metric} style={{ display: "grid", gridTemplateColumns: "1fr 100px 2fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: "#e4e4e7" }}>{r.metric}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>{r.target}</span>
                <span style={{ color: "#71717a", fontSize: 12 }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
