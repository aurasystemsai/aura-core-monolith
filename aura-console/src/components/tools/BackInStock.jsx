import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "5px 10px", fontSize: 12, cursor: "pointer" },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#0c1c10", border: "1px solid #14532d", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 10, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  label: { color: "#a1a1aa", fontSize: 12, margin: "10px 0 4px", display: "block" },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/back-in-stock";

export default function BackInStock() {
  const [subs, setSubs] = useState(null);
  const [ready, setReady] = useState(0);
  const [status, setStatus] = useState(null);
  const [soldOut, setSoldOut] = useState([]);
  const [email, setEmail] = useState("");
  const [variantId, setVariantId] = useState("");
  const [consent, setConsent] = useState(false);
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
    const [s, l, o] = await Promise.all([call("load", "/status"), call("load", "/subscribers"), call("load", "/soldout")]);
    if (s) setStatus(s);
    setSubs(l ? l.subscribers : []); setReady(l ? l.readyToSend : 0);
    if (o) { setSoldOut(o.variants); if (o.variants[0] && !variantId) setVariantId(o.variants[0].id); }
  }
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, []);

  async function add() {
    setNote("");
    const r = await call("add", "/add", { method: "POST", body: JSON.stringify({ email, variantId, consent }) });
    if (r) { setEmail(""); setConsent(false); setNote("Added. They will be emailed once it is back."); refresh(); }
  }
  async function send() {
    if (!window.confirm(`Email ${ready} shopper${ready === 1 ? "" : "s"} now?`)) return;
    setNote("");
    const r = await call("send", "/send", { method: "POST", body: JSON.stringify({ confirm: true }) });
    if (r) { setNote(r.message || `Sent ${r.sent}${r.failed ? `, ${r.failed} failed (still waiting)` : ""}${r.limited ? `, ${r.limited} held back by the daily limit` : ""}.`); refresh(); }
  }
  async function remove(id) {
    const r = await call("del", "/subscribers/" + id, { method: "DELETE" });
    if (r) refresh();
  }

  const waiting = (subs || []).filter((s) => !s.notifiedAt);
  const done = (subs || []).filter((s) => s.notifiedAt);

  return (
    <div style={S.root}>
      <h1 style={S.title}>Back-in-Stock Alerts</h1>
      <p style={S.subtitle}>Shoppers who asked to be told get one email when a sold-out item is available again. Stock is checked live in Shopify. Free to run, no credits.</p>
      {error && <div style={S.error}>{error}</div>}
      {note && <div style={S.ok}>{note}</div>}
      {status && !status.sending && <div style={S.error}>Email sending is not set up on the server yet, so alerts cannot be sent.</div>}

      <div style={S.card}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Add a shopper</div>
        <div style={S.muted}>For someone who has asked you to tell them. Signups from your storefront will land here too once the live app is connected.</div>
        {subs === null && <div style={S.empty}>Loading…</div>}
        {subs !== null && soldOut.length === 0 && <div style={S.empty}>No sold-out products right now, so there is nothing to wait for.</div>}
        {soldOut.length > 0 && (
          <>
            <label style={S.label}>Sold-out product</label>
            <select style={S.input} value={variantId} onChange={(e) => setVariantId(e.target.value)}>
              {soldOut.map((v) => <option key={v.id} value={v.id}>{v.title}</option>)}
            </select>
            <label style={S.label}>Shopper email</label>
            <input style={S.input} type="email" value={email} maxLength={254} placeholder="name@example.com" onChange={(e) => setEmail(e.target.value)} />
            <label style={{ ...S.muted, display: "block", margin: "10px 0" }}>
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /> This shopper asked to be emailed when it is back.
            </label>
            <button style={{ ...S.btn, ...(busy || !email || !consent ? S.off : {}) }} disabled={!!busy || !email || !consent} onClick={add}>{busy === "add" ? "Adding…" : "Add shopper"}</button>
          </>
        )}
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>Waiting ({waiting.length})</div>
          <button style={{ ...S.btn, marginRight: 0, ...(busy || !ready || (status && !status.sending) ? S.off : {}) }} disabled={!!busy || !ready || (status && !status.sending)} onClick={send}>
            {busy === "send" ? "Sending…" : ready ? `Email ${ready} now` : "None back in stock yet"}
          </button>
        </div>
        {subs !== null && waiting.length === 0 && <div style={S.empty}>Nobody is waiting.</div>}
        {waiting.map((s) => (
          <div key={s.id} style={S.row}>
            <span>{s.email} <span style={S.muted}>· {s.product}</span> {s.inStockNow && <span style={{ color: "#86efac", fontSize: 12 }}>· back in stock</span>}</span>
            <button style={S.ghost} onClick={() => remove(s.id)}>Remove</button>
          </div>
        ))}
      </div>

      {done.length > 0 && (
        <div style={S.card}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Already emailed ({done.length})</div>
          {done.slice(0, 20).map((s) => (
            <div key={s.id} style={S.row}><span>{s.email} <span style={S.muted}>· {s.product}</span></span><span style={S.muted}>{new Date(s.notifiedAt).toLocaleDateString()}</span></div>
          ))}
        </div>
      )}
    </div>
  );
}