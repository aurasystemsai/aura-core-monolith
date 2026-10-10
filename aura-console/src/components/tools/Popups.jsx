import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
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
const API = "/api/popups";
const BLANK = { id: "", name: "", type: "email", trigger: "delay", delaySeconds: 8, headline: "", body: "", button: "Subscribe", discountCode: "", active: true };

// A leading = + - @ would run as a formula in a spreadsheet, so it is defused.
const cell = (v) => { const s = String(v ?? ""); return '"' + (/^[=+\-@\t\r]/.test(s) ? "'" + s : s).replace(/"/g, '""') + '"'; };

export default function Popups() {
  const [popups, setPopups] = useState(null);
  const [leads, setLeads] = useState([]);
  const [status, setStatus] = useState(null);
  const [form, setForm] = useState(null);
  const [goal, setGoal] = useState("");
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
    const [p, l, s] = await Promise.all([call("load", "/popups"), call("load", "/leads"), call("load", "/status")]);
    setPopups(p ? p.popups : []); if (l) setLeads(l.leads); if (s) setStatus(s);
  }
  useEffect(() => { refresh(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  async function save() {
    setNote("");
    const r = await call("save", "/save", { method: "POST", body: JSON.stringify(form) });
    if (r) { setForm(null); setNote("Saved."); refresh(); }
  }
  async function write() {
    setNote("");
    const r = await call("ai", "/ai-write", { method: "POST", body: JSON.stringify({ goal, type: form.type, offer: form.discountCode ? `Use code ${form.discountCode}` : "" }) });
    if (r) setForm((f) => ({ ...f, headline: r.headline, body: r.body, button: r.button || f.button }));
  }
  async function toggle(id) { if (await call("t", "/toggle", { method: "POST", body: JSON.stringify({ id }) })) refresh(); }
  async function del(id) { if (window.confirm("Delete this popup?") && await call("d", "/popups/" + id, { method: "DELETE" })) refresh(); }
  async function delLead(id) { if (window.confirm("Remove this signup?") && await call("dl", "/leads/" + id, { method: "DELETE" })) refresh(); }
  function exportCsv() {
    const rows = [["email", "popup", "signed up"], ...leads.map((l) => [l.email, l.popup, l.at])];
    const url = URL.createObjectURL(new Blob([rows.map((r) => r.map(cell).join(",")).join("\n")], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "signups.csv"; a.click(); URL.revokeObjectURL(url);
  }

  const snippet = status && status.scriptUrl ? `<script src="${status.scriptUrl}" defer></script>` : "";

  return (
    <div style={S.root}>
      <h1 style={S.title}>Popups &amp; Email Capture</h1>
      <p style={S.subtitle}>Show an email signup or announcement on your storefront and keep the signups. Writing the words with AI costs 2 credits, only when it works. Everything else is included in your plan.</p>
      {error && <div style={S.error}>{error}</div>}
      {note && <div style={S.ok}>{note}</div>}

      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Put it on your store</div>
        {snippet ? (
          <>
            <div style={{ ...S.muted, marginBottom: 8 }}>In Shopify go to Online Store, Themes, Edit code, open theme.liquid and paste this just before the closing &lt;/body&gt; tag. Only your first active popup is shown, once a week per visitor.</div>
            <div style={S.code}>{snippet}</div>
          </>
        ) : <div style={S.warn}>The storefront script is not available yet, because this server has no public address set (APP_URL). Popups you build here will appear once it is live.</div>}
      </div>

      {form ? (
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>{form.id ? "Edit popup" : "New popup"}</div>
          <label style={S.label}>Name (only you see this)</label>
          <input style={S.input} value={form.name} maxLength={60} onChange={(e) => set("name", e.target.value)} />
          <label style={S.label}>Type</label>
          <select style={S.input} value={form.type} onChange={(e) => set("type", e.target.value)}>
            <option value="email">Email signup</option><option value="announcement">Announcement</option>
          </select>
          <label style={S.label}>When it appears</label>
          <select style={S.input} value={form.trigger} onChange={(e) => set("trigger", e.target.value)}>
            <option value="delay">After a few seconds</option><option value="scroll">After scrolling halfway</option><option value="exit">When the visitor is about to leave</option>
          </select>
          {form.trigger === "delay" && (<><label style={S.label}>Seconds to wait</label><input style={S.input} type="number" min={0} max={120} value={form.delaySeconds} onChange={(e) => set("delaySeconds", e.target.value)} /></>)}
          {form.type === "email" && (<><label style={S.label}>Discount code to show after signup (optional, create it in Discounts &amp; Bundles first)</label><input style={S.input} value={form.discountCode} maxLength={40} onChange={(e) => set("discountCode", e.target.value)} /></>)}
          <div style={{ ...S.muted, margin: "14px 0 6px" }}>Let AI write it (optional)<HelpTip title="AI copywriter" toolId="popups">Describe your offer and AI writes the popup wording. Edit it, then switch the popup on.</HelpTip></div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={S.input} value={goal} maxLength={160} placeholder="e.g. welcome new visitors to our candle shop" onChange={(e) => setGoal(e.target.value)} />
            <button style={{ ...S.btn, marginRight: 0, whiteSpace: "nowrap", ...(busy || (status && !status.ai) ? S.off : {}) }} disabled={!!busy || (status && !status.ai)} onClick={write}>{busy === "ai" ? "Writing…" : <>Write<CostBadge action="email-gen" style={{ background: "#fff", marginLeft: 6 }} /></>}</button>
          </div>
          <label style={S.label}>Headline</label>
          <input style={S.input} value={form.headline} maxLength={80} onChange={(e) => set("headline", e.target.value)} />
          <label style={S.label}>Message</label>
          <textarea style={{ ...S.input, minHeight: 64 }} value={form.body} maxLength={240} onChange={(e) => set("body", e.target.value)} />
          <label style={S.label}>Button</label>
          <input style={S.input} value={form.button} maxLength={30} onChange={(e) => set("button", e.target.value)} />
          <label style={{ ...S.muted, display: "block", margin: "12px 0" }}><input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} /> Show on my store</label>
          <button style={{ ...S.btn, ...(busy || !form.name || !form.headline ? S.off : {}) }} disabled={!!busy || !form.name || !form.headline} onClick={save}>{busy === "save" ? "Saving…" : "Save popup"}</button>
          <button style={{ ...S.ghost, marginLeft: 0 }} onClick={() => setForm(null)}>Cancel</button>
        </div>
      ) : (
        <div style={S.card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>Your popups</div>
            <button style={{ ...S.btn, marginRight: 0 }} onClick={() => { setNote(""); setForm({ ...BLANK }); }}>New popup</button>
          </div>
          {popups === null && <div style={S.empty}>Loading…</div>}
          {popups && popups.length === 0 && <div style={S.empty}>No popups yet. Create one to start collecting emails.</div>}
          {(popups || []).map((p) => (
            <div key={p.id} style={S.row}>
              <span>{p.name} <span style={S.muted}>· {p.type === "email" ? "email signup" : "announcement"} · {p.signups || 0} signups</span> <span style={{ color: p.active ? "#86efac" : "#a1a1aa", fontSize: 12 }}>· {p.active ? "live" : "paused"}</span></span>
              <span>
                <button style={S.ghost} onClick={() => toggle(p.id)}>{p.active ? "Pause" : "Turn on"}</button>
                <button style={S.ghost} onClick={() => setForm({ ...BLANK, ...p })}>Edit</button>
                <button style={S.ghost} onClick={() => del(p.id)}>Delete</button>
              </span>
            </div>
          ))}
        </div>
      )}

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>Signups ({leads.length})</div>
          <button style={{ ...S.ghost, ...(leads.length ? {} : S.off) }} disabled={!leads.length} onClick={exportCsv}>Download CSV</button>
        </div>
        {leads.length === 0 && <div style={S.empty}>No signups yet.</div>}
        {leads.slice(0, 50).map((l) => (
          <div key={l.id} style={S.row}>
            <span>{l.email} <span style={S.muted}>· {l.popup}</span></span>
            <span><span style={S.muted}>{new Date(l.at).toLocaleDateString()}</span><button style={S.ghost} onClick={() => delLead(l.id)}>Remove</button></span>
          </div>
        ))}
        {leads.length > 50 && <div style={S.muted}>Showing the latest 50. Download the CSV for all of them.</div>}
      </div>
    </div>
  );
}