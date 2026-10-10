import React, { useState } from "react";
import { apiFetchJSON, apiFetch } from "../api";
import toolsMeta from "../toolMeta";
import GUIDES from "./guides";

const S = {
  page: { maxWidth: 820, margin: "0 auto", padding: "24px 16px", color: "#18181b" },
  h1: { fontSize: 24, fontWeight: 700, margin: "0 0 4px" },
  sub: { color: "#52525b", margin: "0 0 20px" },
  card: { background: "#fff", border: "1px solid #d4d4d8", borderRadius: 10, padding: 18, marginBottom: 16 },
  h2: { fontSize: 16, fontWeight: 700, margin: "0 0 10px" },
  input: { width: "100%", boxSizing: "border-box", padding: "9px 10px", border: "1px solid #a1a1aa", borderRadius: 8, fontSize: 14, marginBottom: 10, background: "#fff", color: "#18181b" },
  btn: { background: "#4f46e5", color: "#fff", border: 0, borderRadius: 8, padding: "9px 16px", fontWeight: 600, cursor: "pointer" },
  btnOff: { opacity: 0.6, cursor: "not-allowed" },
  danger: { background: "#b91c1c" },
  ghost: { background: "#fff", color: "#18181b", border: "1px solid #a1a1aa" },
  ok: { color: "#15803d", marginTop: 8 },
  err: { color: "#b91c1c", marginTop: 8 },
  q: { cursor: "pointer", fontWeight: 600, padding: "8px 0" },
};

const FAQ = [
  ["How do credits work?", "Every AI action uses credits. The cost is shown on the Credits page and depends on the action and the AI model you pick. Your balance is always in the top bar. Credits renew with your plan, and you can buy extra packs any time."],
  ["Will AI change my live store without asking?", "Anything that writes to your store (titles, descriptions, alt text, translations) shows you the result first. Review it and approve before it is saved. Where a tool supports it, you can undo afterwards."],
  ["An AI job failed or looks wrong. What now?", "Credits are only taken after a successful result. Try again, and if it keeps failing, send us a message below with the tool name and we will look at it."],
  ["How do I connect Google, Meta or TikTok Ads?", "Open the ad tool from All Tools and press Connect. You sign in on the platform's own page. We never see your password and you can disconnect at any time."],
  ["How do I cancel?", "Open Settings and cancel your plan. You keep access until the end of the billing period. You can also uninstall from your Shopify admin at any time."],
  ["What happens to my data if I uninstall?", "Shopify tells us when you uninstall, and your stored AURA data is removed after the period Shopify requires. You can also download or delete it yourself right now with the buttons further down this page."],
];

export default function Help({ setActiveSection }) {
  const [open, setOpen] = useState(-1);
  const [guide, setGuide] = useState("");
  const [form, setForm] = useState({ subject: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [dataNote, setDataNote] = useState(null);

  async function send(e) {
    e.preventDefault();
    setSending(true); setNote(null);
    const r = await apiFetchJSON("/api/help/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSending(false);
    if (r.ok) { setNote({ ok: true, text: "Thanks, we have your message. We aim to reply within one working day." }); setForm({ subject: "", email: "", message: "" }); }
    else setNote({ ok: false, text: r.error || "Could not send your message. Please try again." });
  }

  async function download() {
    setBusy(true); setDataNote(null);
    try {
      const resp = await apiFetch("/api/help/my-data");
      if (!resp.ok) throw new Error("Could not prepare your data.");
      const blob = new Blob([JSON.stringify(await resp.json(), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "aura-data.json"; a.click();
      URL.revokeObjectURL(a.href);
      setDataNote({ ok: true, text: "Your data has been downloaded." });
    } catch (err) { setDataNote({ ok: false, text: err.message }); }
    setBusy(false);
  }

  async function remove() {
    setBusy(true); setDataNote(null);
    const r = await apiFetchJSON("/api/help/delete-my-data", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirm: confirm.trim() }) });
    setBusy(false);
    if (r.ok) { setConfirm(""); setDataNote({ ok: true, text: `Deleted ${r.files_deleted} data file(s).` }); }
    else setDataNote({ ok: false, text: r.error || "Could not delete your data." });
  }

  const canSend = form.message.trim().length >= 10 && !sending;

  return (
    <div style={S.page}>
      <h1 style={S.h1}>Help &amp; support</h1>
      <p style={S.sub}>Find an answer fast, or send us a message and we will get back to you.</p>

      <div style={S.card}>
        <h2 style={S.h2}>Common questions</h2>
        {FAQ.map(([q, a], i) => (
          <div key={q} style={{ borderTop: i ? "1px solid #e4e4e7" : 0 }}>
            <div style={S.q} role="button" tabIndex={0} aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)} onKeyDown={(e) => { if (e.key === "Enter") setOpen(open === i ? -1 : i); }}>
              {open === i ? "− " : "+ "}{q}
            </div>
            {open === i && <p style={{ margin: "0 0 10px", color: "#3f3f46" }}>{a}</p>}
          </div>
        ))}
        {setActiveSection && <button style={{ ...S.btn, ...S.ghost, marginTop: 10 }} onClick={() => setActiveSection("credits")}>See what each action costs</button>}
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Tool guides</h2>
        {toolsMeta.filter((t) => GUIDES[t.id]).map((t) => (
          <div key={t.id} style={{ borderTop: "1px solid #e4e4e7" }}>
            <div style={S.q} role="button" tabIndex={0} aria-expanded={guide === t.id} onClick={() => setGuide(guide === t.id ? "" : t.id)} onKeyDown={(e) => { if (e.key === "Enter") setGuide(guide === t.id ? "" : t.id); }}>
              {guide === t.id ? "− " : "+ "}{t.name}
            </div>
            {guide === t.id && (
              <div style={{ margin: "0 0 10px", color: "#3f3f46" }}>
                <p style={{ margin: "0 0 6px" }}>{t.description}</p>
                <ol style={{ margin: "0 0 8px", paddingLeft: 20 }}>{GUIDES[t.id].steps.map((s) => <li key={s}>{s}</li>)}</ol>
                {GUIDES[t.id].video && <a href={GUIDES[t.id].video} target="_blank" rel="noopener noreferrer" style={{ color: "#4f46e5", fontWeight: 600 }}>Watch the video</a>}
                {setActiveSection && <button style={{ ...S.btn, ...S.ghost, marginLeft: 8 }} onClick={() => setActiveSection(t.id)}>Open {t.name}</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      <form style={S.card} onSubmit={send}>
        <h2 style={S.h2}>Contact us</h2>
        <input style={S.input} placeholder="Subject (optional)" maxLength={120} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} aria-label="Subject" />
        <input style={S.input} type="email" placeholder="Your email, so we can reply" maxLength={254} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="Your email" />
        <textarea style={{ ...S.input, minHeight: 110, resize: "vertical" }} placeholder="What do you need help with? Include the tool name if you can." maxLength={4000} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} aria-label="Message" />
        <button type="submit" disabled={!canSend} style={{ ...S.btn, ...(canSend ? {} : S.btnOff) }}>{sending ? "Sending…" : "Send message"}</button>
        {note && <div style={note.ok ? S.ok : S.err} role="status">{note.text}</div>}
      </form>

      <div style={S.card}>
        <h2 style={S.h2}>Your data</h2>
        <p style={{ margin: "0 0 10px", color: "#3f3f46" }}>Download everything AURA has stored for your shop, or delete it. Deleting cannot be undone. Your Shopify connection and billing are not affected.</p>
        <button style={{ ...S.btn, ...(busy ? S.btnOff : {}) }} disabled={busy} onClick={download}>Download my data</button>
        <div style={{ marginTop: 14 }}>
          <input style={S.input} placeholder="Type your shop domain (name.myshopify.com) to enable delete" value={confirm} onChange={(e) => setConfirm(e.target.value)} aria-label="Confirm shop domain" />
          <button style={{ ...S.btn, ...S.danger, ...(busy || !confirm.trim() ? S.btnOff : {}) }} disabled={busy || !confirm.trim()} onClick={remove}>Delete my data</button>
        </div>
        {dataNote && <div style={dataNote.ok ? S.ok : S.err} role="status">{dataNote.text}</div>}
      </div>
    </div>
  );
}
