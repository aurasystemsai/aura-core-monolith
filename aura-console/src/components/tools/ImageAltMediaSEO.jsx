import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h: { fontSize: 15, fontWeight: 700, margin: "0 0 10px" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "7px 12px", fontSize: 12, cursor: "pointer", marginRight: 8 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { display: "flex", gap: 12, padding: 10, border: "1px solid #27272a", borderRadius: 8, marginBottom: 8, fontSize: 13, alignItems: "center", flexWrap: "wrap" },
  pill: { background: "#27272a", borderRadius: 999, padding: "3px 10px", fontSize: 12, color: "#d4d4d8", display: "inline-block", margin: "0 6px 6px 0" },
  muted: { color: "#71717a", fontSize: 12 },
};
const API = "/api/image-alt-media-seo";
const WHY = { missing: "No alt text", filename: "Looks like a file name", short: "Too short", long: "Too long (over 125)" };

async function call(setBusy, setError, name, url, options) {
  setBusy(name); setError("");
  try {
    const r = await apiFetchJSON(API + url, options);
    if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
    return r;
  } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
}

export default function ImageAltText() {
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [log, setLog] = useState([]);
  const [draft, setDraft] = useState({});
  const [picked, setPicked] = useState({});
  const [onlyBad, setOnlyBad] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, u, o);
  const post = (body) => ({ method: "POST", body: JSON.stringify(body || {}) });

  async function load(after) {
    const r = await run("load", "/images" + (after ? `?after=${encodeURIComponent(after)}` : ""));
    if (r) { setData(r); setImages((prev) => (after ? [...prev, ...r.images] : r.images)); }
  }
  async function loadLog() { const l = await run("log", "/log"); if (l) setLog(l.log); }
  useEffect(() => { load(); loadLog(); }, []); // eslint-disable-line

  const shown = images.filter((i) => !onlyBad || i.problem);
  const chosen = shown.filter((i) => picked[i.id]).slice(0, 10);

  async function generate(list) {
    setDone("");
    const titles = Object.fromEntries(list.map((i) => [i.id, i.productTitle]));
    const r = await run("gen", "/generate", post({ ids: list.map((i) => i.id), titles }));
    if (!r) return;
    const next = { ...draft }; let failed = 0;
    r.results.forEach((x) => { if (x.alt) next[x.id] = x.alt; else failed++; });
    setDraft(next);
    setDone(`Wrote ${r.results.length - failed} suggestion(s). Review them, then press Apply.${failed ? ` ${failed} could not be written.` : ""}`);
  }
  async function apply(i) {
    const alt = (draft[i.id] || "").trim();
    const r = await run("a:" + i.id, "/apply", post({ id: i.id, productId: i.productId, alt, label: `${i.productTitle} #${i.position}` }));
    if (r) {
      setImages((prev) => prev.map((x) => (x.id === i.id ? { ...x, alt, problem: "" } : x)));
      setDraft((d) => { const n = { ...d }; delete n[i.id]; return n; });
      setDone(`Alt text saved to Shopify for ${i.productTitle}.`); loadLog();
    }
  }
  async function undo(e) {
    const r = await run("u:" + e.id, "/revert", post({ id: e.id }));
    if (r) { setDone("Put the old alt text back."); load(); loadLog(); }
  }

  const s = data && data.summary;
  return (
    <div style={S.root}>
      <h1 style={S.title}>Image Alt Text</h1>
      <p style={S.subtitle}>Alt text helps Google Images, screen readers and accessibility. This checks your real product images; AI looks at each picture to write the text, and nothing changes in Shopify until you press Apply.</p>
      {error && <div style={S.error}>{error}</div>}
      {done && <div style={S.ok}>{done}</div>}

      <div style={S.card}>
        <h2 style={S.h}>Your images {s ? `(${images.length} checked)` : ""}<HelpTip title="Your images" toolId="image-alt-media-seo">Images with missing or weak alt text are listed. Tick the ones you want AI to write alt text for, check the result, then apply.</HelpTip></h2>
        {data && (
          <div style={{ marginBottom: 10 }}>
            <span style={S.pill}>{images.filter((i) => i.problem === "missing").length} missing</span>
            <span style={S.pill}>{images.filter((i) => i.problem === "filename" || i.problem === "short").length} poor</span>
            <span style={S.pill}>{images.filter((i) => !i.problem).length} good</span>
            <label style={{ ...S.muted, marginLeft: 8 }}><input type="checkbox" checked={onlyBad} onChange={(e) => setOnlyBad(e.target.checked)} /> Only show images that need work</label>
          </div>
        )}
        <div style={{ marginBottom: 12 }}>
          <button style={{ ...S.btn, ...(!chosen.length || busy || !(data && data.ai) ? S.off : {}) }} disabled={!chosen.length || !!busy || !(data && data.ai)} onClick={() => generate(chosen)}>
            {busy === "gen" ? "Looking at images…" : <>{`AI: write alt text for ${chosen.length || "selected"} (max 10)`}<CostBadge action="alt-text" times={chosen.length || 1} style={{ background: "#fff", marginLeft: 6 }} /></>}
          </button>
          {data && !data.ai && <span style={S.muted}>AI is not set up on this server. You can still type alt text yourself.</span>}
        </div>
        {busy === "load" && !data && <div style={S.empty}>Reading your product images…</div>}
        {data && images.length === 0 && <div style={S.empty}>No product images found in your store.</div>}
        {data && images.length > 0 && shown.length === 0 && <div style={S.empty}>Every image checked has good alt text.</div>}
        {shown.map((i) => (
          <div key={i.id} style={S.row}>
            <input type="checkbox" checked={!!picked[i.id]} onChange={(e) => setPicked({ ...picked, [i.id]: e.target.checked })} aria-label="Select image" />
            <img src={i.url} alt={i.alt || ""} width={56} height={56} style={{ objectFit: "cover", borderRadius: 8, background: "#09090b" }} />
            <div style={{ flex: "1 1 280px", minWidth: 220 }}>
              <div style={{ fontWeight: 600 }}>{i.productTitle} <span style={S.muted}>image {i.position}</span></div>
              <div style={S.muted}>{i.problem ? `${WHY[i.problem]}${i.alt ? `: "${i.alt}"` : ""}` : `Current: "${i.alt}"`}</div>
              <input style={{ ...S.input, marginTop: 6 }} placeholder="Type alt text, or let AI write it" maxLength={512} value={draft[i.id] || ""} onChange={(e) => setDraft({ ...draft, [i.id]: e.target.value })} aria-label="Alt text" />
            </div>
            <button style={{ ...S.btn, marginRight: 0, ...(!(draft[i.id] || "").trim() || busy ? S.off : {}) }} disabled={!(draft[i.id] || "").trim() || !!busy} onClick={() => apply(i)}>{busy === "a:" + i.id ? "Saving…" : "Apply"}</button>
          </div>
        ))}
        {data && data.hasMore && <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => load(data.cursor)}>{busy === "load" ? "Loading…" : "Check more products"}</button>}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Changes made</h2>
        {log.length === 0 && <div style={S.empty}>No alt text changed yet.</div>}
        {log.map((e) => (
          <div key={e.id} style={{ ...S.row, justifyContent: "space-between" }}>
            <span>{e.label || "Image"}: "{e.to}" <span style={S.muted}>{new Date(e.at).toLocaleString()}</span></span>
            {e.reverted ? <span style={S.muted}>Undone</span> : <button style={{ ...S.ghost, marginRight: 0, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => undo(e)}>{busy === "u:" + e.id ? "Undoing…" : "Undo"}</button>}
          </div>
        ))}
      </div>
    </div>
  );
}
