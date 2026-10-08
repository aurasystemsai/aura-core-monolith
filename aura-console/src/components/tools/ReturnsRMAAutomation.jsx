import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

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
const API = "/api/returns-rma-automation";
const LABEL = { requested: "Requested", approved: "Approved", received: "Received", refunded: "Refunded", rejected: "Rejected" };
const COLOUR = { requested: "#f59e0b", approved: "#60a5fa", received: "#a78bfa", refunded: "#22c55e", rejected: "#ef4444" };
const VERB = { approved: "Approve", rejected: "Reject", received: "Mark received", refunded: "Mark refunded" };

export default function Returns() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({ order: "", reason: "faulty", note: "" });
  const [reply, setReply] = useState(null);
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);
  const send = (method, body) => ({ method, body: JSON.stringify(body || {}) });
  const load = async () => { const r = await run("load", "/overview"); if (r) setData(r); };
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function add() { const r = await run("add", "/returns", send("POST", form)); if (r) { setForm({ ...form, order: "", note: "" }); load(); } }
  async function move(id, status) { const r = await run("m:" + id, "/returns/" + id, send("PUT", { status })); if (r) load(); }
  async function remove(id) { const r = await run("d:" + id, "/returns/" + id, send("DELETE")); if (r) load(); }
  async function draft(id) { setReply(null); const r = await run("r:" + id, "/reply/" + id, send("POST")); if (r) setReply({ id, ...r }); }

  const st = data && data.stats;
  return (
    <div style={S.root}>
      <h1 style={S.title}>Returns</h1>
      <p style={S.subtitle}>Log a return request, check it against the real order, and track it to the end. Refunds themselves are still made in your Shopify admin.</p>
      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <h2 style={S.h}>New return</h2>
        <input style={S.input} placeholder="Order number, e.g. 1001" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
        <select style={S.input} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
          {(data ? data.reasons : ["faulty"]).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <input style={S.input} placeholder="Note (optional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
        <button style={{ ...S.btn, ...(!form.order.trim() || busy ? S.off : {}) }} disabled={!form.order.trim() || !!busy} onClick={add}>{busy === "add" ? "Checking order…" : "Log return"}</button>
      </div>

      {st && st.total > 0 && (
        <div style={S.card}>
          <h2 style={S.h}>Summary</h2>
          {Object.keys(LABEL).map((k) => <span key={k} style={S.pill}>{LABEL[k]}: {st.byStatus[k]}</span>)}
          <div style={{ marginTop: 8 }}>{Object.entries(st.byReason).sort((a, b) => b[1] - a[1]).map(([k, n]) => <span key={k} style={S.pill}>{k}: {n}</span>)}</div>
        </div>
      )}

      <div style={S.card}>
        <h2 style={S.h}>Requests</h2>
        {busy === "load" && !data && <div style={S.empty}>Loading…</div>}
        {data && data.returns.length === 0 && <div style={S.empty}>No returns logged yet.</div>}
        {data && data.returns.map((r) => (
          <div key={r.id} style={{ ...S.row, flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span><b>{r.order.name}</b> {r.order.customer} · {r.items} · {r.order.currency} {r.order.total.toLocaleString()}</span>
              <span style={{ color: COLOUR[r.status], fontWeight: 700 }}>{LABEL[r.status]}</span>
            </div>
            <div style={S.muted}>{r.reason}{r.note ? " · " + r.note : ""} · {new Date(r.createdAt).toLocaleDateString()}</div>
            <div style={{ marginTop: 8 }}>
              {data.next[r.status].map((n) => <button key={n} style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => move(r.id, n)}>{VERB[n]}</button>)}
              <button style={{ ...S.ghost, ...(!data.ai || busy ? S.off : {}) }} disabled={!data.ai || !!busy} onClick={() => draft(r.id)}>{busy === "r:" + r.id ? "Writing…" : "AI reply (1 credit)"}</button>
              <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => remove(r.id)}>Delete</button>
            </div>
            {reply && reply.id === r.id && (
              <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#d4d4d8", marginTop: 8 }}>
                {reply.reply}
                {!reply.usedPolicy && <div style={{ ...S.muted, marginTop: 6 }}>No returns policy page was found in your store, so this reply states no deadlines.</div>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}