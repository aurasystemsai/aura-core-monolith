import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer", marginRight: 8 },
  chip: { background: "#27272a", border: "1px solid #3f3f46", borderRadius: 999, padding: "5px 12px", fontSize: 12, color: "#d4d4d8", cursor: "pointer", marginRight: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { padding: 12, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  pill: { background: "#27272a", borderRadius: 999, padding: "3px 10px", fontSize: 12, marginLeft: 8 },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/order-tracking";
const COLOR = { late: "#fca5a5", waiting: "#fcd34d", partial: "#93c5fd", shipped: "#86efac", cancelled: "#a1a1aa" };
const LABEL = { late: "Late", waiting: "Waiting", partial: "Part shipped", shipped: "Shipped", cancelled: "Cancelled" };

export default function OrderTracking() {
  const [data, setData] = useState(null);
  const [filter, setFilter] = useState("all");
  const [lateDays, setLateDays] = useState(3);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function call(name, url, options) {
    setBusy(name); setError("");
    try {
      const r = await apiFetchJSON(API + url, options);
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r;
    } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
  }
  async function load() { const r = await call("load", `/orders?lateDays=${lateDays}`); if (r) setData(r); }
  useEffect(() => { load(); }, [lateDays]); // eslint-disable-line

  async function write(o) {
    setCopied(false); setDraft(null);
    const r = await call(o.id, "/draft", { method: "POST", body: JSON.stringify({ id: o.id, lateDays }) });
    if (r) setDraft({ name: o.name, subject: r.subject, body: r.body });
  }
  async function copy() {
    try { await navigator.clipboard.writeText(`${draft.subject}\n\n${draft.body}`); setCopied(true); } catch { setError("Copy failed. Select the text and copy it by hand."); }
  }
  const shown = data ? data.orders.filter((o) => filter === "all" || o.state === filter) : [];

  return (
    <div style={S.root}>
      <h1 style={S.title}>Order Tracking</h1>
      <p style={S.subtitle}>Your latest 100 real orders. Late ones are flagged, and AI drafts the customer update for you to send.</p>
      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {["all", "late", "waiting", "partial", "shipped", "cancelled"].map((f) => (
            <button key={f} style={{ ...S.chip, ...(filter === f ? { background: "#4f46e5", color: "#fff" } : {}) }} onClick={() => setFilter(f)}>
              {f === "all" ? "All" : LABEL[f]}{data ? ` (${f === "all" ? data.orders.length : data.counts[f]})` : ""}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <label style={S.muted}>Late after</label>
          <select style={{ ...S.input, width: 90 }} value={lateDays} onChange={(e) => setLateDays(Number(e.target.value))}>
            {[1, 2, 3, 5, 7, 14].map((n) => <option key={n} value={n}>{n} days</option>)}
          </select>
          <button style={{ ...S.ghost, marginRight: 0, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={load}>{busy === "load" ? "Loading…" : "Refresh"}</button>
        </div>
      </div>

      {draft && (
        <div style={S.card}>
          <strong>Draft for {draft.name}</strong>
          <p style={{ margin: "10px 0 4px" }}><span style={S.muted}>Subject</span><br />{draft.subject}</p>
          <p style={{ whiteSpace: "pre-wrap", margin: "8px 0 12px" }}>{draft.body}</p>
          <button style={S.btn} onClick={copy}>{copied ? "Copied" : "Copy"}</button>
          <button style={S.ghost} onClick={() => setDraft(null)}>Close</button>
          <span style={S.muted}>Check it, then send it from your own email.</span>
        </div>
      )}

      <div style={S.card}>
        {!data && !error && <div style={S.empty}>Loading…</div>}
        {data && shown.length === 0 && <div style={S.empty}>{data.orders.length ? "No orders match this filter." : "No orders yet."}</div>}
        {shown.map((o) => (
          <div key={o.id} style={S.row}>
            <strong>{o.name}</strong><span style={{ ...S.pill, color: COLOR[o.state] }}>{LABEL[o.state]}</span>
            <span style={S.muted}> · {o.ageDays} days ago{o.customer ? ` · ${o.customer}` : ""}{o.place ? ` · ${o.place}` : ""}</span>
            <div style={S.muted}>{o.items.join(", ")}</div>
            {o.tracking.map((t, i) => <div key={i} style={{ fontSize: 12, marginTop: 4 }}>{t.company || "Carrier"} {t.url ? <a style={{ color: "#a5b4fc" }} href={t.url} target="_blank" rel="noreferrer">{t.number}</a> : t.number}</div>)}
            {o.state !== "cancelled" && <div style={{ marginTop: 8 }}><button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => write(o)}>{busy === o.id ? "Writing…" : <>AI write update<CostBadge action="email-gen" /></>}</button></div>}
          </div>
        ))}
      </div>
    </div>
  );
}