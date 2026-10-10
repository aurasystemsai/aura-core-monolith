import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  label: { color: "#a1a1aa", fontSize: 12, display: "block", margin: "0 0 4px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, marginBottom: 12 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer", marginRight: 8 },
  danger: { background: "transparent", color: "#fca5a5", border: "1px solid #7f1d1d", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer" },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { padding: 12, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  pill: { background: "#27272a", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "#d4d4d8", display: "inline-block", marginRight: 6 },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/discounts-bundles";
const BLANK = { kind: "basic", title: "", code: "", percent: 10, days: 14, minSubtotal: "", buyProductId: "", getProductId: "" };
const COLOR = { ACTIVE: "#86efac", SCHEDULED: "#fcd34d", EXPIRED: "#a1a1aa" };

async function call(setBusy, setError, name, url, options) {
  setBusy(name); setError("");
  try {
    const r = await apiFetchJSON(API + url, options);
    if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
    return r;
  } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
}

export default function DiscountsBundles() {
  const [list, setList] = useState(null);
  const [products, setProducts] = useState([]);
  const [insight, setInsight] = useState(null);
  const [offers, setOffers] = useState([]);
  const [goal, setGoal] = useState("");
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, u, o);
  const post = (body) => ({ method: "POST", body: JSON.stringify(body || {}) });
  const name = (id) => (products.find((p) => p.id === id) || {}).title || "";

  async function load() {
    const [l, p, i] = await Promise.all([run("list", "/list"), run("products", "/products"), run("insight", "/insight")]);
    if (l) setList(l.discounts);
    if (p) setProducts(p.products);
    if (i) setInsight(i);
  }
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function suggest() {
    setDone(""); setOffers([]);
    const r = await run("suggest", "/suggest", post({ goal }));
    if (r) setOffers(r.offers);
  }
  async function create(o) {
    setDone("");
    const r = await run("create", "/create", post(o));
    if (!r) return;
    setDone(`Code ${r.code} is live in your store.`);
    setOffers((l) => l.filter((x) => x !== o));
    if (o === form) setForm(BLANK);
    const l = await run("list", "/list"); if (l) setList(l.discounts);
  }
  async function act(action, d) {
    if (action === "delete" && !window.confirm(`Delete ${d.code}? This cannot be undone.`)) return;
    setDone("");
    const r = await run(action + d.id, `/${action}`, post({ id: d.id }));
    if (!r) return;
    const l = await run("list", "/list"); if (l) setList(l.discounts);
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const bundle = form.kind === "bundle";
  const canCreate = form.code.trim().length >= 3 && Number(form.percent) >= 1 && (!bundle || (form.buyProductId && form.getProductId && form.buyProductId !== form.getProductId));

  return (
    <div style={S.root}>
      <h1 style={S.title}>Discounts &amp; Bundles</h1>
      <p style={S.subtitle}>Real Shopify discount codes. AI builds offers from what your customers really buy together, or make your own.</p>
      {error && <div style={S.error}>{error}</div>}
      {done && <div style={S.ok}>{done}</div>}

      <div style={S.card}>
        <h2 style={S.h}>AI offers<HelpTip title="AI offers" toolId="discounts-bundles">AI looks at what your customers really buy together and suggests offers. You choose which to turn into a real Shopify discount code.</HelpTip></h2>
        {insight && <p style={S.muted}>Based on your last {insight.orders} orders{insight.orders ? `, average ${insight.currency} ${insight.averageOrder}` : ""}.</p>}
        <label style={S.label}>Goal (optional)</label>
        <input style={S.input} value={goal} maxLength={300} onChange={(e) => setGoal(e.target.value)} placeholder="e.g. Sell more mugs, or clear slow stock" />
        <p style={{ margin: "10px 0 0" }}>
          <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={suggest}>{busy === "suggest" ? "Thinking…" : "AI suggest offers"}</button>
          <CostBadge action="campaign-gen" />
        </p>
        {offers.map((o, i) => (
          <div key={i} style={{ ...S.row, marginTop: 10 }}>
            <strong>{o.title}</strong> <span style={S.pill}>{o.percent}% off</span><span style={S.pill}>{o.kind === "bundle" ? "Bundle" : "Whole order"}</span>
            <div style={S.muted}>Code {o.code} · {o.days} days{o.minSubtotal ? ` · min spend ${o.minSubtotal}` : ""}{o.kind === "bundle" ? ` · buy ${name(o.buyProductId) || "product"}, get ${name(o.getProductId) || "product"}` : ""}</div>
            <div style={{ margin: "6px 0 8px" }}>{o.reason}</div>
            <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => create(o)}>Create this code</button>
            <button style={S.ghost} onClick={() => setOffers((l) => l.filter((x) => x !== o))}>Dismiss</button>
          </div>
        ))}
        {insight && insight.pairs.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <div style={S.muted}>Bought together most often</div>
            {insight.pairs.slice(0, 4).map((p) => <div key={p.a.id + p.b.id} style={{ fontSize: 13, marginTop: 4 }}>{p.a.title} + {p.b.title} <span style={S.muted}>({p.count} orders)</span></div>)}
          </div>
        )}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Create a code yourself<HelpTip title="Manual codes" toolId="discounts-bundles">Make a code without AI. This uses no credits.</HelpTip></h2>
        <div style={S.grid}>
          <div><label style={S.label}>Type</label>
            <select style={S.input} value={form.kind} onChange={set("kind")}><option value="basic">Percent off the order</option><option value="bundle">Bundle (buy one, get one off)</option></select></div>
          <div><label style={S.label}>Code</label><input style={S.input} value={form.code} maxLength={30} onChange={set("code")} placeholder="SAVE10" /></div>
          <div><label style={S.label}>Percent off</label><input style={S.input} type="number" min="1" max="90" value={form.percent} onChange={set("percent")} /></div>
          <div><label style={S.label}>Days it runs</label><input style={S.input} type="number" min="1" max="365" value={form.days} onChange={set("days")} /></div>
          {!bundle && <div><label style={S.label}>Minimum spend (optional)</label><input style={S.input} type="number" min="0" value={form.minSubtotal} onChange={set("minSubtotal")} /></div>}
        </div>
        {bundle && (
          <div style={S.grid}>
            <div><label style={S.label}>Customer buys</label>
              <select style={S.input} value={form.buyProductId} onChange={set("buyProductId")}><option value="">Choose a product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
            <div><label style={S.label}>Customer gets discounted</label>
              <select style={S.input} value={form.getProductId} onChange={set("getProductId")}><option value="">Choose a product</option>{products.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
          </div>
        )}
        <button style={{ ...S.btn, ...(busy || !canCreate ? S.off : {}) }} disabled={!!busy || !canCreate} onClick={() => create({ ...form, title: form.title || form.code })}>{busy === "create" ? "Creating…" : "Create code"}</button>
        <span style={S.muted}>Manual codes cost no credits.</span>
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Your codes<HelpTip title="Your codes" toolId="discounts-bundles">Pause or delete any code here. Changes happen in Shopify straight away.</HelpTip></h2>
        {list === null && <div style={S.empty}>Loading…</div>}
        {list && list.length === 0 && <div style={S.empty}>No discount codes yet. Ask AI for an offer above.</div>}
        {list && list.map((d) => (
          <div key={d.id} style={S.row}>
            <strong>{d.code || d.title}</strong> <span style={{ ...S.pill, color: COLOR[d.status] || "#d4d4d8" }}>{d.status.toLowerCase()}</span><span style={S.pill}>{d.type === "bundle" ? "Bundle" : "Order"}</span>
            <div style={S.muted}>{d.summary} · used {d.used} times{d.endsAt ? ` · ends ${new Date(d.endsAt).toLocaleDateString()}` : ""}</div>
            <div style={{ marginTop: 8 }}>
              {d.status === "ACTIVE" && <button style={S.ghost} disabled={!!busy} onClick={() => act("deactivate", d)}>Pause</button>}
              {d.status !== "ACTIVE" && <button style={S.ghost} disabled={!!busy} onClick={() => act("activate", d)}>Turn on</button>}
              <button style={S.danger} disabled={!!busy} onClick={() => act("delete", d)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}