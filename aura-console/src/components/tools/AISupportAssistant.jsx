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
const API = "/api/ai-support-assistant";

export default function SupportAssistant() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [form, setForm] = useState({ customer: "", subject: "", message: "" });
  const [kb, setKb] = useState({ title: "", body: "" });
  const [open, setOpen] = useState("");
  const [tab, setTab] = useState("inbox");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);
  const load = async () => { const r = await run("load", "/state"); if (r) setData(r); };
  useEffect(() => { load(); }, []); // eslint-disable-line
  const json = (method, body) => ({ method, body: JSON.stringify(body) });

  async function addTicket() {
    const r = await run("add", "/tickets", json("POST", form));
    if (r) { setForm({ customer: "", subject: "", message: "" }); setOpen(r.ticket.id); load(); }
  }
  async function draft(t) { setNote(""); const r = await run("draft:" + t.id, "/tickets/" + t.id + "/draft", json("POST", {})); if (r) { setNote(r.usedKnowledge.length ? "Answered from: " + r.usedKnowledge.join(", ") : "Nothing in your knowledge base matched, so this is a holding reply. Add the answer below."); load(); } }
  async function setStatus(t, status) { await run("s", "/tickets/" + t.id, json("PATCH", { status })); load(); }
  async function saveReply(t, reply) { await run("r", "/tickets/" + t.id, json("PATCH", { reply })); }
  async function del(path) { await run("d", path, { method: "DELETE" }); load(); }
  async function addKb() { const r = await run("kb", "/kb", json("POST", kb)); if (r) { setKb({ title: "", body: "" }); load(); } }
  async function importPages() { const r = await run("imp", "/kb/import-pages", json("POST", {})); if (r) { setNote("Imported " + r.added + " page(s)."); load(); } }

  const tickets = data ? data.tickets : [];
  return (
    <div style={S.root}>
      <h1 style={S.title}>Support Assistant</h1>
      <p style={S.subtitle}>Paste in customer messages, get an AI reply drafted from your own policies. Nothing is sent to customers automatically.</p>
      {error && <div style={S.error}>{error}</div>}
      {note && <div style={S.warn}>{note}</div>}
      {data && !data.ai && <div style={S.warn}>AI is not configured on the server, so drafting is off. Everything else works.</div>}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["inbox", "knowledge"].map((t) => <button key={t} style={tab === t ? S.btn : S.ghost} onClick={() => setTab(t)}>{t === "inbox" ? "Inbox" + (data ? " (" + data.summary.open + " open)" : "") : "Knowledge base" + (data ? " (" + data.summary.kbEntries + ")" : "")}</button>)}
      </div>

      {tab === "inbox" && (
        <>
          <div style={S.card}>
            <h2 style={S.h}>Add a customer message</h2>
            <input style={S.input} placeholder="Customer name or email" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} />
            <input style={{ ...S.input, marginTop: 6 }} placeholder="Subject (optional)" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <textarea style={{ ...S.input, marginTop: 6, minHeight: 80 }} placeholder="Paste the message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <button style={{ ...S.btn, marginTop: 8, ...(!form.message.trim() || busy ? S.off : {}) }} disabled={!form.message.trim() || !!busy} onClick={addTicket}>{busy === "add" ? "Adding…" : "Add to inbox"}</button>
          </div>
          <div style={S.card}>
            <h2 style={S.h}>Inbox</h2>
            {!data && <div style={S.empty}>Loading…</div>}
            {data && tickets.length === 0 && <div style={S.empty}>No messages yet. Add one above.</div>}
            {tickets.map((t) => (
              <div key={t.id} style={{ ...S.row, flexDirection: "column", marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", cursor: "pointer" }} onClick={() => setOpen(open === t.id ? "" : t.id)}>
                  <strong>{t.subject}</strong>
                  <span style={S.muted}>{t.customer} · {t.status}{t.needsHuman && t.status !== "resolved" ? " · needs you" : ""}{t.urgency === "high" ? " · urgent" : ""}</span>
                </div>
                {open === t.id && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#d4d4d8" }}>{t.message}</div>
                    <textarea key={t.reply} style={{ ...S.input, marginTop: 8, minHeight: 90 }} defaultValue={t.reply} placeholder="Reply (write your own or use AI)" onBlur={(e) => e.target.value !== t.reply && saveReply(t, e.target.value)} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <button style={{ ...S.btn, ...(!data.ai || busy ? S.off : {}) }} disabled={!data.ai || !!busy} onClick={() => draft(t)}>{busy === "draft:" + t.id ? "Drafting…" : "AI draft reply (1 credit)"}</button>
                      {t.reply && <button style={S.ghost} onClick={() => navigator.clipboard && navigator.clipboard.writeText(t.reply)}>Copy reply</button>}
                      {t.status !== "resolved" ? <button style={S.ghost} onClick={() => setStatus(t, "resolved")}>Mark resolved</button> : <button style={S.ghost} onClick={() => setStatus(t, "open")}>Reopen</button>}
                      <button style={S.ghost} onClick={() => del("/tickets/" + t.id)}>Delete</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "knowledge" && (
        <>
          <div style={S.card}>
            <h2 style={S.h}>Add an answer</h2>
            <input style={S.input} placeholder="Question or topic, e.g. Returns policy" value={kb.title} onChange={(e) => setKb({ ...kb, title: e.target.value })} />
            <textarea style={{ ...S.input, marginTop: 6, minHeight: 90 }} placeholder="The answer, exactly as you want customers told" value={kb.body} onChange={(e) => setKb({ ...kb, body: e.target.value })} />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={{ ...S.btn, ...(!kb.title.trim() || !kb.body.trim() || busy ? S.off : {}) }} disabled={!kb.title.trim() || !kb.body.trim() || !!busy} onClick={addKb}>Save answer</button>
              <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={importPages}>{busy === "imp" ? "Importing…" : "Import my store pages"}</button>
            </div>
          </div>
          <div style={S.card}>
            <h2 style={S.h}>Your knowledge</h2>
            {data && data.kb.length === 0 && <div style={S.empty}>Nothing yet. Add your shipping, returns and FAQ answers so drafts can use them.</div>}
            {data && data.kb.map((e) => (
              <div key={e.id} style={S.row}><div><strong>{e.title}</strong><div style={S.muted}>{e.body.slice(0, 140)}{e.body.length > 140 ? "…" : ""}</div></div><button style={S.ghost} onClick={() => del("/kb/" + e.id)}>Delete</button></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}