import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";
import CostBadge from "../../help/CostBadge";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px", maxWidth: 760 },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h2: { fontSize: 16, margin: "0 0 4px" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  label: { display: "block", fontSize: 12, color: "#a1a1aa", margin: "10px 0 4px", fontWeight: 600 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginRight: 6 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  muted: { color: "#71717a", fontSize: 12 },
  row: { padding: "10px 0", borderBottom: "1px solid #27272a", fontSize: 13 },
  stat: { display: "inline-block", marginRight: 22, fontSize: 13, color: "#a1a1aa" },
  tag: (c) => ({ display: "inline-block", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "1px 8px", marginRight: 8, background: c, color: "#18181b" }),
  mail: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, padding: 14, fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.55, marginTop: 12 },
};
const API = "/api/backlink-explorer";
const STATUS = { live: ["Live", "#86efac"], nofollow: ["Nofollow", "#fcd34d"], missing: ["Link missing", "#fca5a5"], unreachable: ["Page not reachable", "#d4d4d8"] };
const KINDS = [["supplier", "A supplier or brand you sell"], ["blogger", "A blogger or reviewer"], ["directory", "A directory or resource list"], ["broken", "A site with a broken link"], ["mention", "A site that mentions you without a link"]];
const when = (d) => (d ? new Date(d).toLocaleDateString() : "");

export default function BacklinkExplorer() {
  const [links, setLinks] = useState(null);
  const [sum, setSum] = useState(null);
  const [pages, setPages] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [kind, setKind] = useState("supplier");
  const [site, setSite] = useState("");
  const [pageUrl, setPageUrl] = useState("");
  const [note, setNote] = useState("");
  const [mail, setMail] = useState(null);
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
  useEffect(() => {
    (async () => {
      const r = await call("load", "/links");
      if (r) { setLinks(r.links); setSum(r.summary); } else setLinks([]);
      const p = await call("pages", "/pages");
      if (p) { setPages(p.pages); setStoreName(p.storeName); if (p.pages[0]) setPageUrl(p.pages[0].url); }
    })();
  }, []);

  async function add() {
    const r = await call("add", "/links", { method: "POST", body: JSON.stringify({ source, target }) });
    if (!r) return;
    const next = [r.link, ...links];
    setLinks(next); setSum(tally(next)); setSource(""); setTarget("");
  }
  const tally = (l) => ({ total: l.length, live: l.filter((x) => x.status === "live").length, nofollow: l.filter((x) => x.status === "nofollow").length, missing: l.filter((x) => x.status === "missing").length });
  async function recheck(id) {
    const r = await call("check" + (id || "all"), "/links/check", { method: "POST", body: JSON.stringify(id ? { id } : {}) });
    if (r) { setLinks(r.links); setSum(r.summary); }
  }
  async function remove(id) {
    const r = await call("del" + id, "/links/" + id, { method: "DELETE" });
    if (!r) return;
    const next = links.filter((l) => l.id !== id);
    setLinks(next); setSum(tally(next));
  }
  async function write() {
    const pg = pages.find((p) => p.url === pageUrl);
    const r = await call("mail", "/outreach", { method: "POST", body: JSON.stringify({ kind, site, pageUrl, pageTitle: pg ? pg.title : "", storeName, note }) });
    if (r) { setMail({ subject: r.subject, body: r.body }); setCopied(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(`Subject: ${mail.subject}\n\n${mail.body}`); setCopied(true); } catch (e) { setError("Could not copy. Select the text and copy it by hand."); }
  }

  return (
    <div style={S.root}>
      <h1 style={S.title}>Link building</h1>
      <p style={S.subtitle}>Links from other sites help you rank in search and get cited in AI answers. Write outreach emails to earn them, then track each link you win and get told when one disappears. This does not estimate links you have not told it about.</p>
      {error && <div style={S.error} role="alert">{error}</div>}

      <div style={S.card}>
        <h2 style={S.h2}>1. Write an outreach email</h2>
        <div style={S.muted}>You send it yourself, from your own email.</div>
        <label style={S.label} htmlFor="lb-kind">Who are you writing to?</label>
        <select id="lb-kind" style={S.input} value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        <label style={S.label} htmlFor="lb-site">Their site or name</label>
        <input id="lb-site" style={S.input} value={site} maxLength={120} placeholder="acmeshoes.com" onChange={(e) => setSite(e.target.value)} />
        <label style={S.label} htmlFor="lb-page">Page of yours you would like linked</label>
        <select id="lb-page" style={S.input} value={pageUrl} onChange={(e) => setPageUrl(e.target.value)}>
          {pages.length === 0 && <option value="">{busy === "pages" ? "Loading your pages..." : "No published pages found"}</option>}
          {pages.map((p) => <option key={p.url} value={p.url}>{p.kind}: {p.title}</option>)}
        </select>
        <label style={S.label} htmlFor="lb-note">Anything they should know (optional)</label>
        <input id="lb-note" style={S.input} value={note} maxLength={400} placeholder="We have sold your range since 2022" onChange={(e) => setNote(e.target.value)} />
        <div style={{ marginTop: 14 }}>
          <button style={{ ...S.btn, ...(busy || !site.trim() || !pageUrl ? S.off : {}) }} disabled={!!busy || !site.trim() || !pageUrl} onClick={write}>
            {busy === "mail" ? "Writing..." : <>AI write email <CostBadge action="email-gen" style={{ marginLeft: 6 }} /></>}
          </button>
        </div>
        {mail && (
          <div style={S.mail}>
            <strong>Subject: {mail.subject}</strong>{"\n\n"}{mail.body}
            <div style={{ marginTop: 12 }}><button style={S.ghost} onClick={copy}>{copied ? "Copied" : "Copy email"}</button></div>
          </div>
        )}
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>2. Track your links</h2>
        <div style={S.muted}>When a site links to you, add the page here. It opens the page and checks the link is really there.</div>
        <label style={S.label} htmlFor="lb-src">Page that links to you</label>
        <input id="lb-src" style={S.input} value={source} maxLength={500} placeholder="blog.example.com/best-shoes" onChange={(e) => setSource(e.target.value)} />
        <label style={S.label} htmlFor="lb-tgt">Page of yours it should link to (optional, any page of your store counts if empty)</label>
        <input id="lb-tgt" style={S.input} value={target} maxLength={500} placeholder="yourstore.com/products/shoes" onChange={(e) => setTarget(e.target.value)} />
        <div style={{ marginTop: 14 }}>
          <button style={{ ...S.btn, ...(busy || !source.trim() ? S.off : {}) }} disabled={!!busy || !source.trim()} onClick={add}>{busy === "add" ? "Checking the page..." : "Add and check"}</button>
          <span style={S.muted}>No credits</span>
        </div>

        <div style={{ marginTop: 18 }}>
          {links === null && <div style={S.muted}>Loading...</div>}
          {links && links.length === 0 && <div style={{ ...S.muted, textAlign: "center", padding: "14px 0" }}>No links tracked yet. Add one above once a site has linked to you.</div>}
          {links && links.length > 0 && (
            <>
              <div style={{ marginBottom: 8 }}>
                <span style={S.stat}>{sum.total} tracked</span><span style={S.stat}>{sum.live} live</span>
                <span style={S.stat}>{sum.nofollow} nofollow</span><span style={S.stat}>{sum.missing} missing</span>
                <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => recheck(null)}>{busy === "checkall" ? "Checking..." : "Re-check all"}</button>
              </div>
              {links.map((l) => (
                <div key={l.id} style={S.row}>
                  <span style={S.tag(STATUS[l.status][1])}>{STATUS[l.status][0]}</span>
                  <strong>{l.site}</strong> <span style={S.muted}>{l.source}</span>
                  <div style={S.muted}>{l.note}{l.anchor ? ` Link text: "${l.anchor}".` : ""} Checked {when(l.checkedAt)}.</div>
                  <div style={{ marginTop: 6 }}>
                    <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => recheck(l.id)}>Re-check</button>
                    <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => remove(l.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
