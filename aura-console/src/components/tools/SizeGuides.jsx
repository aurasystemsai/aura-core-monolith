import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";
import HelpTip from "../../help/HelpTip";
import CostBadge from "../../help/CostBadge";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "6px 8px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "5px 10px", fontSize: 12, cursor: "pointer", marginLeft: 6 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#0c1c10", border: "1px solid #14532d", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  warn: { background: "#1c1608", border: "1px solid #713f12", color: "#fcd34d", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 10, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  label: { color: "#a1a1aa", fontSize: 12, margin: "10px 0 4px", display: "block" },
  muted: { color: "#71717a", fontSize: 12 },
  code: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, padding: 10, fontSize: 12, fontFamily: "monospace", wordBreak: "break-all", color: "#d4d4d8" },
};
const API = "/api/size-guides";
const BLANK = { id: "", name: "", match: "all", title: "Size guide", note: "", columns: ["Size", "Chest"], rows: [["", ""]], active: true };

export default function SizeGuides() {
  const [guides, setGuides] = useState(null);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState(null);
  const [item, setItem] = useState("");
  const [unit, setUnit] = useState("cm");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function call(name, url, options) {
    setBusy(name); setError("");
    try {
      const r = await apiFetchJSON(API + url, options);
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r;
    } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
  }
  async function refresh() {
    const [g, s] = await Promise.all([call("load", "/guides"), call("load", "/status")]);
    setGuides(g ? g.guides : []); if (s) setStatus(s);
  }
  useEffect(() => { refresh(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setCol = (i, v) => setForm((f) => ({ ...f, columns: f.columns.map((c, j) => (j === i ? v : c)) }));
  const setCell = (r, c, v) => setForm((f) => ({ ...f, rows: f.rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)) }));
  const addCol = () => setForm((f) => (f.columns.length >= 8 ? f : { ...f, columns: [...f.columns, ""], rows: f.rows.map((r) => [...r, ""]) }));
  const addRow = () => setForm((f) => (f.rows.length >= 20 ? f : { ...f, rows: [...f.rows, f.columns.map(() => "")] }));
  const delRow = (i) => setForm((f) => ({ ...f, rows: f.rows.filter((_, j) => j !== i) }));

  async function save() {
    setNote("");
    const r = await call("save", "/save", { method: "POST", body: JSON.stringify(form) });
    if (r) { setForm(null); setNote("Saved."); refresh(); }
  }
  async function draft() {
    const r = await call("ai", "/ai-draft", { method: "POST", body: JSON.stringify({ item, unit }) });
    if (r) setForm((f) => ({ ...f, columns: r.columns, rows: r.rows, note: f.note || `Measurements are in ${r.unit}.` }));
  }
  async function toggle(id) { if (await call("t", "/toggle", { method: "POST", body: JSON.stringify({ id }) })) refresh(); }
  async function del(id) { if (window.confirm("Delete this size guide?") && await call("d", "/guides/" + id, { method: "DELETE" })) refresh(); }

  const snippet = status && status.scriptUrl ? `<script src="${status.scriptUrl}" defer></script>` : "";

  return (
    <div style={S.root}>
      <h1 style={S.title}>Size Guides</h1>
      <p style={S.subtitle}>Show a size table on your product pages to cut down on wrong-size returns. AI can draft a table for 2 credits, only when it works. Everything else is included in your plan.</p>
      {error && <div style={S.error}>{error}</div>}
      {note && <div style={S.ok}>{note}</div>}

      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Put it on your store</div>
        {snippet ? (
          <>
            <div style={{ ...S.muted, marginBottom: 8 }}>In Shopify go to Online Store, Themes, Edit code, open theme.liquid and paste this just before the closing &lt;/body&gt; tag. A "Size guide" button then appears above the add-to-cart button on matching products.</div>
            <div style={S.code}>{snippet}</div>
          </>
        ) : <div style={S.warn}>The storefront script is not available yet, because this server has no public address set (APP_URL). Guides you build here will appear once it is live.</div>}
      </div>

      {form ? (
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{form.id ? "Edit size guide" : "New size guide"}</div>
          <label style={S.label}>Name (only you see this)</label>
          <input style={S.input} value={form.name} maxLength={60} onChange={(e) => set("name", e.target.value)} />
          <label style={S.label}>Shows on products of this type (type "all" for every product). It must match the Product type in Shopify exactly.</label>
          <input style={S.input} value={form.match} maxLength={60} onChange={(e) => set("match", e.target.value)} />
          <label style={S.label}>Button and window title</label>
          <input style={S.input} value={form.title} maxLength={60} onChange={(e) => set("title", e.target.value)} />

          <div style={{ ...S.muted, margin: "14px 0 6px" }}>Let AI draft the table (optional)<HelpTip title="AI size table" toolId="size-guides">Type the kind of item, pick cm or inches, and AI fills in a typical size table. These are typical figures, so check each number against your own products before you switch the guide on.</HelpTip></div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={S.input} value={item} maxLength={80} placeholder="e.g. women's t-shirts" onChange={(e) => setItem(e.target.value)} />
            <select style={{ ...S.input, width: 90 }} value={unit} onChange={(e) => setUnit(e.target.value)}><option value="cm">cm</option><option value="in">inches</option></select>
            <button style={{ ...S.btn, marginRight: 0, whiteSpace: "nowrap", ...(busy || !item || (status && !status.ai) ? S.off : {}) }} disabled={!!busy || !item || (status && !status.ai)} onClick={draft}>{busy === "ai" ? "Drafting…" : <>Draft<CostBadge action="product-description" style={{ background: "#fff", marginLeft: 6 }} /></>}</button>
          </div>
          <div style={{ ...S.warn, marginTop: 8 }}>AI sizes are typical figures, not yours. Check every number against your own products before you turn this on.</div>

          <label style={S.label}>Table</label>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
              <thead><tr>{form.columns.map((c, i) => <th key={i} style={{ padding: 3 }}><input style={{ ...S.input, fontWeight: 700 }} value={c} maxLength={24} onChange={(e) => setCol(i, e.target.value)} /></th>)}<th /></tr></thead>
              <tbody>{form.rows.map((row, r) => (
                <tr key={r}>{row.map((c, j) => <td key={j} style={{ padding: 3 }}><input style={S.input} value={c} maxLength={24} onChange={(e) => setCell(r, j, e.target.value)} /></td>)}<td><button style={S.ghost} onClick={() => delRow(r)}>×</button></td></tr>
              ))}</tbody>
            </table>
          </div>
          <div style={{ marginTop: 8 }}>
            <button style={{ ...S.ghost, marginLeft: 0, ...(form.rows.length >= 20 ? S.off : {}) }} onClick={addRow}>Add row</button>
            <button style={{ ...S.ghost, ...(form.columns.length >= 8 ? S.off : {}) }} onClick={addCol}>Add column</button>
          </div>
          <label style={S.label}>Note under the table (optional)</label>
          <input style={S.input} value={form.note} maxLength={200} placeholder="e.g. Measurements are in cm" onChange={(e) => set("note", e.target.value)} />
          <label style={{ ...S.muted, display: "block", margin: "12px 0" }}><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Show on my store</label>
          <button style={{ ...S.btn, ...(busy || !form.name ? S.off : {}) }} disabled={!!busy || !form.name} onClick={save}>{busy === "save" ? "Saving…" : "Save size guide"}</button>
          <button style={{ ...S.ghost, marginLeft: 0 }} onClick={() => setForm(null)}>Cancel</button>
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>Your size guides</div>
            <button style={{ ...S.btn, marginRight: 0 }} onClick={() => { setNote(""); setForm({ ...BLANK, columns: [...BLANK.columns], rows: [["", ""]] }); }}>New size guide</button>
          </div>
          {guides === null && <div style={S.empty}>Loading…</div>}
          {guides && guides.length === 0 && <div style={S.empty}>No size guides yet. Create one to show on your product pages.</div>}
          {(guides || []).map((g) => (
            <div key={g.id} style={S.row}>
              <span>{g.name} <span style={S.muted}>· for {g.match === "all" ? "all products" : g.match} · {g.rows.length} sizes</span> <span style={{ color: g.active ? "#86efac" : "#a1a1aa", fontSize: 12 }}>· {g.active ? "live" : "paused"}</span></span>
              <span>
                <button style={S.ghost} onClick={() => toggle(g.id)}>{g.active ? "Pause" : "Turn on"}</button>
                <button style={S.ghost} onClick={() => setForm({ ...BLANK, ...g })}>Edit</button>
                <button style={S.ghost} onClick={() => del(g.id)}>Delete</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}