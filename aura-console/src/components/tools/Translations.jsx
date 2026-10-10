import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";
import HelpTip from "../../help/HelpTip";
import CostBadge from "../../help/CostBadge";


const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer", marginRight: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { padding: 12, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13 },
  pill: { background: "#27272a", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "#d4d4d8", display: "inline-block", margin: "0 6px 6px 0" },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/translations";

async function call(setBusy, setError, name, url, options) {
  setBusy(name); setError("");
  try {
    const r = await apiFetchJSON(API + url, options);
    if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
    return r;
  } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
}
const LABEL = { title: "Title", body_html: "Description", meta_title: "Search title", meta_description: "Search description" };

export default function Translations() {
  const [locales, setLocales] = useState(null);
  const [locale, setLocale] = useState("");
  const [list, setList] = useState([]);
  const [next, setNext] = useState(null);
  const [draft, setDraft] = useState(null);
  const [log, setLog] = useState([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, u, o);
  const post = (body) => ({ method: "POST", body: JSON.stringify(body || {}) });

  async function loadLog() { const l = await run("log", "/log"); if (l) setLog(l.log); }
  useEffect(() => {
    (async () => { const r = await run("status", "/status"); if (r) { setLocales(r.locales); if (r.locales[0]) setLocale(r.locales[0].locale); } })();
    loadLog();
  }, []); // eslint-disable-line

  async function load(more) {
    if (!locale) return;
    const r = await run("load", `/products?locale=${encodeURIComponent(locale)}` + (more && next ? `&after=${encodeURIComponent(next)}` : ""));
    if (r) { setList((l) => (more ? [...l, ...r.products] : r.products)); setNext(r.next); }
  }
  useEffect(() => { setDraft(null); setList([]); setNext(null); if (locale) load(false); }, [locale]); // eslint-disable-line

  async function suggest(p) {
    setDone("");
    const r = await run("s:" + p.id, "/suggest", post({ id: p.id, locale }));
    if (r) setDraft({ id: p.id, title: p.title, items: r.items });
  }
  async function apply() {
    const r = await run("apply", "/apply", post({ id: draft.id, locale, items: draft.items.map((i) => ({ key: i.key, value: i.value })) }));
    if (r) { setDone("Saved to Shopify: " + draft.title); setDraft(null); load(false); loadLog(); }
  }
  async function undo(e) {
    const r = await run("u:" + e.id, "/revert", post({ id: e.id }));
    if (r) { setDone("Put the previous translation back."); load(false); loadLog(); }
  }
  const edit = (key, value) => setDraft((d) => ({ ...d, items: d.items.map((i) => (i.key === key ? { ...i, value } : i)) }));
  const name = (code) => (locales && (locales.find((l) => l.locale === code) || {}).name) || code;

  return (
    <div style={S.root}>
      <h1 style={S.title}>Translations</h1>
      <p style={S.subtitle}>Sell in more languages. AI translates your product titles, descriptions and search text, you can edit the result, and nothing is saved to Shopify until you press Apply. Every save can be undone.</p>
      {error && <div style={S.error}>{error}</div>}
      {done && <div style={S.ok}>{done}</div>}

      {busy === "status" && !locales && <div style={S.empty}>Reading your store languages...</div>}
      {locales && locales.length === 0 && (
        <div style={S.card}><div style={S.empty}>Your store has only one language. In Shopify go to Settings, then Languages, and add one. It will appear here.</div></div>
      )}

      {locales && locales.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h}>Products<HelpTip title="Translating a product" toolId="translations">Press the AI button on a product to translate its title, description and search text into each store language. You can edit the result. Nothing reaches Shopify until you press Apply.</HelpTip></h2>
          <label style={S.muted}>Language </label>
          <select style={{ ...S.input, width: "auto", marginBottom: 12 }} value={locale} onChange={(e) => setLocale(e.target.value)} aria-label="Language">
            {locales.map((l) => <option key={l.locale} value={l.locale}>{l.name}{l.published ? "" : " (not published)"}</option>)}
          </select>
          {busy === "load" && list.length === 0 && <div style={S.empty}>Reading your products...</div>}
          {busy !== "load" && list.length === 0 && <div style={S.empty}>No products with text to translate.</div>}
          {list.map((p) => (
            <div key={p.id} style={S.row}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 260px", minWidth: 200 }}>
                  <div style={{ fontWeight: 600 }}>{p.title}</div>
                  <div style={{ fontSize: 12, color: p.done === p.total ? "#4ade80" : "#fbbf24" }}>{p.done} of {p.total} fields translated{p.outdated ? `, ${p.outdated} out of date` : ""}</div>
                </div>
                <button style={{ ...S.btn, marginRight: 0, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => suggest(p)}>{busy === "s:" + p.id ? "Translating..." : <>{p.done === p.total ? "Redo with AI" : "AI: translate"}<CostBadge action="product-description" style={{ background: "#fff", marginLeft: 6 }} /></>}</button>
              </div>
              {draft && draft.id === p.id && (
                <div style={{ marginTop: 10 }}>
                  {draft.items.map((i) => (
                    <div key={i.key} style={{ marginBottom: 10 }}>
                      <div style={S.muted}>{LABEL[i.key]} in {name(locale)}. Original: {i.source.replace(/<[^>]+>/g, " ").slice(0, 120)}</div>
                      <textarea style={{ ...S.input, minHeight: i.key === "body_html" ? 110 : 40 }} value={i.value} onChange={(e) => edit(i.key, e.target.value)} aria-label={LABEL[i.key]} />
                    </div>
                  ))}
                  <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={apply}>{busy === "apply" ? "Saving..." : "Apply to Shopify"}</button>
                  <button style={S.ghost} onClick={() => setDraft(null)}>Discard</button>
                </div>
              )}
            </div>
          ))}
          {next && <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => load(true)}>Load more products</button>}
        </div>
      )}

      <div style={S.card}>
        <h2 style={S.h}>Changes made<HelpTip title="Undo" toolId="translations">Every translation you apply is listed here. Press Undo on a line to put the old text back.</HelpTip></h2>
        {log.length === 0 && <div style={S.empty}>No translations saved yet.</div>}
        {log.map((e) => (
          <div key={e.id} style={{ ...S.row, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <span>{e.title} in {name(e.locale)} <span style={S.muted}>{e.keys.map((k) => LABEL[k]).join(", ")} - {new Date(e.at).toLocaleString()}</span></span>
            {e.reverted ? <span style={S.muted}>Undone</span> : <button style={{ ...S.ghost, marginRight: 0, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => undo(e)}>{busy === "u:" + e.id ? "Undoing..." : "Undo"}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}