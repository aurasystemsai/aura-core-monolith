import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, boxSizing: "border-box", fontFamily: "inherit" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "6px 10px", fontSize: 12, cursor: "pointer", marginRight: 6 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  row: { padding: 12, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/inventory-forecasting/pos";
const COLOUR = { draft: "#a1a1aa", sent: "#60a5fa", partial: "#f59e0b", received: "#22c55e", cancelled: "#ef4444" };

export default function PurchaseOrders({ items, suppliers, onStockChanged }) {
  const [orders, setOrders] = useState(null);
  const [mailerOn, setMailerOn] = useState(true);
  const [supplierId, setSupplierId] = useState("");
  const [lines, setLines] = useState([]);
  const [pick, setPick] = useState("");
  const [open, setOpen] = useState("");
  const [recv, setRecv] = useState({});
  const [updateCost, setUpdateCost] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function call(name, url, method, body) {
    setBusy(name); setError("");
    try {
      const r = await apiFetchJSON(API + url, method ? { method, body: body ? JSON.stringify(body) : undefined } : undefined);
      if (!r.ok) { const e = new Error(r.error || `Request failed (${r.status})`); e.data = r; throw e; }
      return r;
    } catch (e) { setError(e.message); if (e.data && e.data.received && e.data.received.length) { onStockChanged && onStockChanged(); load(); } return null; } finally { setBusy(""); }
  }
  async function load() { const r = await call("load", ""); if (r) { setOrders(r.orders); setMailerOn(r.mailer); } }
  useEffect(() => { load(); }, []); // eslint-disable-line

  const forSupplier = items.filter((i) => i.supplierId === supplierId);
  const fromSuggestions = () => setLines(forSupplier.filter((i) => i.suggestedQty > 0).map((i) => ({ variantId: i.id, title: i.title, sku: i.sku, qty: i.suggestedQty, unitCost: i.cost == null ? "" : i.cost })));
  const addItem = () => {
    const i = items.find((x) => x.id === pick);
    if (!i || lines.some((l) => l.variantId === i.id)) return;
    setLines([...lines, { variantId: i.id, title: i.title, sku: i.sku, qty: Math.max(1, i.suggestedQty || 1), unitCost: i.cost == null ? "" : i.cost }]);
    setPick("");
  };
  const setLine = (idx, k, v) => setLines(lines.map((l, j) => (j === idx ? { ...l, [k]: v } : l)));

  async function create() {
    const r = await call("create", "", "POST", { supplierId, lines });
    if (r) { setLines([]); setDone(`Created ${r.order.number}.`); load(); }
  }
  async function act(o, what, msg) { setDone(""); const r = await call(what + o.id, `/${o.id}/${what}`, "POST", {}); if (r) { setDone(msg); load(); } }
  async function remove(o) { const r = await call("del" + o.id, `/${o.id}`, "DELETE"); if (r) load(); }
  async function receive(o) {
    const receipts = o.lines.map((l) => ({ variantId: l.variantId, qty: Number(recv[l.variantId] || 0) })).filter((r) => r.qty > 0);
    const r = await call("recv" + o.id, `/${o.id}/receive`, "POST", { receipts, updateCost });
    if (r) { setDone(`Added ${r.received.reduce((n, x) => n + x.qty, 0)} items to your Shopify stock.`); setOpen(""); setRecv({}); load(); onStockChanged && onStockChanged(); }
  }

  const canCreate = supplierId && lines.length > 0 && lines.every((l) => Number(l.qty) >= 1) && !busy;
  return (
    <div style={S.card}>
      <h2 style={S.h}>Purchase orders</h2>
      <p style={S.muted}>Order from a supplier, email it, then receive the stock. Receiving adds the quantity to your Shopify stock and can save the unit cost, which Profit Analytics uses.</p>
      {error && <div style={S.error}>{error}</div>}
      {done && <div style={S.ok}>{done}</div>}

      {suppliers.length === 0 ? <div style={S.muted}>Add a supplier above to start a purchase order.</div> : (
        <div style={{ ...S.row, background: "#09090b" }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            <select aria-label="Supplier" style={S.input} value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setLines([]); }}>
              <option value="">Choose supplier…</option>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button style={{ ...S.ghost, ...(!supplierId ? S.off : {}) }} disabled={!supplierId} onClick={fromSuggestions}>Fill from reorder suggestions</button>
            <select aria-label="Add item" style={{ ...S.input, maxWidth: 260 }} value={pick} onChange={(e) => setPick(e.target.value)}>
              <option value="">Add an item…</option>
              {items.map((i) => <option key={i.id} value={i.id}>{i.title}</option>)}
            </select>
            <button style={{ ...S.ghost, ...(!pick ? S.off : {}) }} disabled={!pick} onClick={addItem}>Add</button>
          </div>
          {supplierId && lines.length === 0 && <div style={S.muted}>{forSupplier.some((i) => i.suggestedQty > 0) ? "Press “Fill from reorder suggestions”, or add items by hand." : "Nothing needs reordering from this supplier right now. You can still add items by hand."}</div>}
          {lines.map((l, idx) => (
            <div key={l.variantId} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
              <span style={{ flex: 1, minWidth: 160 }}>{l.title}</span>
              <input aria-label="Quantity" style={{ ...S.input, width: 80 }} type="number" min="1" value={l.qty} onChange={(e) => setLine(idx, "qty", e.target.value)} />
              <input aria-label="Unit cost" style={{ ...S.input, width: 100 }} type="number" min="0" step="0.01" placeholder="Unit cost" value={l.unitCost} onChange={(e) => setLine(idx, "unitCost", e.target.value)} />
              <button style={S.ghost} onClick={() => setLines(lines.filter((_, j) => j !== idx))}>Remove</button>
            </div>
          ))}
          {lines.length > 0 && <button style={{ ...S.btn, ...(!canCreate ? S.off : {}) }} disabled={!canCreate} onClick={create}>{busy === "create" ? "Saving…" : "Save purchase order"}</button>}
        </div>
      )}

      {orders && orders.length === 0 && <div style={S.muted}>No purchase orders yet.</div>}
      {orders && orders.map((o) => (
        <div key={o.id} style={S.row}>
          <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
            <strong>{o.number} <span style={{ ...S.muted, fontWeight: 400 }}>· {o.supplierName}{o.total ? ` · ${o.total.toFixed(2)}` : ""}{o.costMissing ? " · some costs missing" : ""}</span></strong>
            <span style={{ color: COLOUR[o.status], fontWeight: 700 }}>{o.status}</span>
          </div>
          <ul style={{ margin: "6px 0", paddingLeft: 18, color: "#d4d4d8" }}>{o.lines.map((l) => <li key={l.variantId}>{l.received}/{l.qty} × {l.title}</li>)}</ul>
          {open === o.id && (
            <div style={{ marginBottom: 8 }}>
              {o.lines.filter((l) => l.qty > l.received).map((l) => (
                <div key={l.variantId} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <span style={{ flex: 1 }}>{l.title} <span style={S.muted}>({l.qty - l.received} left)</span></span>
                  <input aria-label={`Received ${l.title}`} style={{ ...S.input, width: 80 }} type="number" min="0" max={l.qty - l.received} value={recv[l.variantId] ?? ""} onChange={(e) => setRecv({ ...recv, [l.variantId]: e.target.value })} />
                </div>
              ))}
              <label style={S.muted}><input type="checkbox" checked={updateCost} onChange={(e) => setUpdateCost(e.target.checked)} /> Save unit costs to Shopify</label>
              <div style={{ marginTop: 6 }}>
                <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => receive(o)}>{busy === "recv" + o.id ? "Adding to Shopify…" : "Add to stock"}</button>
                <button style={S.ghost} onClick={() => setOpen("")}>Close</button>
              </div>
            </div>
          )}
          <div>
            {["draft", "sent", "partial"].includes(o.status) && <button style={{ ...S.ghost, ...(busy || !mailerOn ? S.off : {}) }} disabled={!!busy || !mailerOn} title={mailerOn ? "" : "Email is not set up on the server yet"} onClick={() => act(o, "send", `Emailed ${o.number} to ${o.supplierName}.`)}>{o.sentAt ? "Send again" : "Email supplier"}</button>}
            {["draft", "sent", "partial"].includes(o.status) && <button style={S.ghost} onClick={() => { setOpen(open === o.id ? "" : o.id); setRecv({}); }}>Receive stock</button>}
            {!o.lines.some((l) => l.received > 0) && o.status !== "cancelled" && <button style={S.ghost} onClick={() => act(o, "cancel", `Cancelled ${o.number}.`)}>Cancel</button>}
            {["draft", "cancelled"].includes(o.status) && <button style={S.ghost} onClick={() => remove(o)}>Delete</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
