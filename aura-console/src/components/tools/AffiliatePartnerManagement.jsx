import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px", maxWidth: 760 },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h2: { fontSize: 16, margin: "0 0 4px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  label: { display: "block", fontSize: 12, color: "#a1a1aa", margin: "10px 0 4px", fontWeight: 600 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginRight: 6 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  muted: { color: "#71717a", fontSize: 12 },
  row: { padding: "12px 0", borderBottom: "1px solid #27272a", fontSize: 13 },
  stat: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 14px" },
  big: { fontSize: 20, fontWeight: 800 },
  tag: (c) => ({ display: "inline-block", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "1px 8px", marginRight: 8, background: c, color: "#18181b" }),
};
const API = "/api/affiliate-partner-management";
const BLANK = { name: "", email: "", code: "", discount: "10", commission: "15" };

export default function AffiliatePartnerManagement() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [pay, setPay] = useState({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function call(name, url, options) {
    setBusy(name); setError("");
    try {
      const r = await apiFetchJSON(API + url, options);
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r;
    } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
  }
  async function load() {
    const r = await call("load", "/partners");
    setData(r || { partners: [], totals: null, currency: "", max: 25 });
  }
  useEffect(() => { load(); }, []);

  const m = (n) => `${data && data.currency ? data.currency + " " : ""}${Number(n || 0).toFixed(2)}`;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ready = form.name.trim() && form.code.trim() && Number(form.discount) > 0 && Number(form.commission) > 0;

  async function add() {
    const r = await call("add", "/partners", { method: "POST", body: JSON.stringify(form) });
    if (r) { setForm(BLANK); await load(); }
  }
  async function act(id, path, method, body) {
    const r = await call(path + id, `/partners/${id}${path === "del" ? "" : "/" + path}`, { method, body: body ? JSON.stringify(body) : undefined });
    if (r) { setPay((p) => ({ ...p, [id]: "" })); await load(); }
  }

  const partners = data ? data.partners : null;
  return (
    <div style={S.root}>
      <h1 style={S.title}>Affiliates</h1>
      <p style={S.subtitle}>Give each partner their own discount code. When customers use it, the sale and the commission you owe come from your real Shopify orders. You pay partners yourself and record it here. Figures cover the orders Shopify lets apps read (about the last 60 days).</p>
      {error && <div style={S.error} role="alert">{error}</div>}

      <div style={S.card}>
        <h2 style={S.h2}>Add a partner</h2>
        <div style={S.muted}>This creates a real discount code in your Shopify store straight away.</div>
        <div style={S.grid}>
          <div><label style={S.label} htmlFor="af-name">Name</label><input id="af-name" style={S.input} maxLength={80} value={form.name} onChange={set("name")} placeholder="Jo Blogs" /></div>
          <div><label style={S.label} htmlFor="af-email">Email (optional)</label><input id="af-email" style={S.input} maxLength={254} value={form.email} onChange={set("email")} placeholder="jo@example.com" /></div>
          <div><label style={S.label} htmlFor="af-code">Discount code</label><input id="af-code" style={S.input} maxLength={30} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="JO10" /></div>
          <div><label style={S.label} htmlFor="af-disc">Customer discount %</label><input id="af-disc" style={S.input} type="number" min="1" max="90" value={form.discount} onChange={set("discount")} /></div>
          <div><label style={S.label} htmlFor="af-com">Partner commission %</label><input id="af-com" style={S.input} type="number" min="1" max="90" value={form.commission} onChange={set("commission")} /></div>
        </div>
        <div style={{ marginTop: 14 }}>
          <button style={{ ...S.btn, ...(busy || !ready ? S.off : {}) }} disabled={!!busy || !ready} onClick={add}>{busy === "add" ? "Creating the code..." : "Create partner and code"}</button>
          <span style={S.muted}>No credits</span>
        </div>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Your partners</h2>
        {partners === null && <div style={S.muted}>Loading...</div>}
        {partners && partners.length === 0 && <div style={{ ...S.muted, textAlign: "center", padding: "16px 0" }}>No partners yet. Add your first one above.</div>}
        {partners && partners.length > 0 && (
          <>
            <div style={{ ...S.grid, margin: "12px 0" }}>
              <div style={S.stat}><div style={S.muted}>Orders</div><div style={S.big}>{data.totals.orders}</div></div>
              <div style={S.stat}><div style={S.muted}>Sales</div><div style={S.big}>{m(data.totals.sales)}</div></div>
              <div style={S.stat}><div style={S.muted}>Commission earned</div><div style={S.big}>{m(data.totals.earned)}</div></div>
              <div style={S.stat}><div style={S.muted}>Still to pay</div><div style={S.big}>{m(data.totals.owed)}</div></div>
            </div>
            {partners.map((p) => {
              const here = busy.endsWith(p.id);
              return (
                <div key={p.id} style={S.row}>
                  <span style={S.tag(p.active ? "#86efac" : "#d4d4d8")}>{p.active ? "Active" : "Stopped"}</span>
                  <strong>{p.name}</strong> <span style={S.muted}>{p.email}</span>
                  <div style={S.muted}>Code {p.code}: customers get {p.discount}% off, they earn {p.commission}%.</div>
                  <div style={{ margin: "6px 0" }}>{p.orders} orders, {m(p.sales)} in sales, {m(p.earned)} earned, {m(p.paid)} paid, <strong>{m(p.owed)} owed</strong>{p.more ? " (more orders exist than are counted here)" : ""}</div>
                  <div>
                    {p.owed > 0 && (
                      <>
                        <input style={{ ...S.input, width: 110, marginRight: 6 }} aria-label={`Amount paid to ${p.name}`} type="number" min="0" step="0.01" placeholder="Amount paid" value={pay[p.id] || ""} onChange={(e) => setPay((x) => ({ ...x, [p.id]: e.target.value }))} />
                        <button style={{ ...S.ghost, ...(here || !pay[p.id] ? S.off : {}) }} disabled={here || !pay[p.id]} onClick={() => act(p.id, "payout", "POST", { amount: pay[p.id] })}>Record payment</button>
                      </>
                    )}
                    {p.active && <button style={{ ...S.ghost, ...(here ? S.off : {}) }} disabled={here} onClick={() => act(p.id, "stop", "POST")}>Stop code</button>}
                    <button style={{ ...S.ghost, ...(here ? S.off : {}) }} disabled={here} onClick={() => act(p.id, "del", "DELETE")}>Remove</button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
