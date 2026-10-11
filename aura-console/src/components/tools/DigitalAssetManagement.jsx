import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";
import CostBadge from "../../help/CostBadge";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "6px 8px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "5px 10px", fontSize: 12, cursor: "pointer", marginRight: 6 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#0c1c10", border: "1px solid #14532d", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  row: { display: "flex", gap: 14, alignItems: "flex-start", padding: 12, border: "1px solid #27272a", borderRadius: 10, marginBottom: 10, fontSize: 13 },
  thumb: { width: 84, height: 84, objectFit: "cover", borderRadius: 8, background: "#09090b", flexShrink: 0 },
  muted: { color: "#71717a", fontSize: 12 },
  stat: { display: "inline-block", marginRight: 22, fontSize: 13, color: "#a1a1aa" },
  tag: (c) => ({ display: "inline-block", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "1px 8px", marginRight: 6, background: c, color: "#18181b" }),
};
const API = "/api/digital-asset-management";
const LABEL = { alt: ["No useful alt text", "#fcd34d"], heavy: ["Heavy file", "#fdba74"], wide: ["Very wide", "#fdba74"], name: ["Unclear file name", "#d4d4d8"] };
const size = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB");

export default function DigitalAssetManagement() {
  const [files, setFiles] = useState(null);
  const [meta, setMeta] = useState({ hasMore: false, cursor: null, limits: null });
  const [only, setOnly] = useState("all");
  const [edit, setEdit] = useState({});
  const [undo, setUndo] = useState({});
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
  async function load(more) {
    const r = await call("load", "/files" + (more && meta.cursor ? `?after=${encodeURIComponent(meta.cursor)}` : ""));
    if (!r) { if (!more) setFiles([]); return; }
    setFiles((f) => (more && f ? [...f, ...r.files] : r.files));
    setMeta({ hasMore: r.hasMore, cursor: r.cursor, limits: r.limits });
  }
  useEffect(() => { load(false); }, []);

  async function draft(f) {
    const r = await call("ai" + f.id, "/draft", { method: "POST", body: JSON.stringify({ id: f.id }) });
    if (r) setEdit((e) => ({ ...e, [f.id]: r.alt }));
  }
  async function save(f, text, isUndo) {
    const r = await call("save" + f.id, "/apply", { method: "POST", body: JSON.stringify({ id: f.id, alt: text }) });
    if (!r) return;
    setFiles((list) => list.map((x) => (x.id === f.id ? { ...x, alt: r.alt, issues: r.alt.trim().length >= 10 && !/\.(jpe?g|png|webp|gif|avif)$/i.test(r.alt) ? x.issues.filter((i) => i !== "alt") : (x.issues.includes("alt") ? x.issues : [...x.issues, "alt"]) } : x)));
    setEdit((e) => { const n = { ...e }; delete n[f.id]; return n; });
    setUndo((u) => { const n = { ...u }; if (isUndo) delete n[f.id]; else n[f.id] = r.previous; return n; });
    setNote(isUndo ? "Restored the previous alt text." : "Saved to your store Files.");
  }

  const count = (k) => (files || []).filter((f) => f.issues.includes(k)).length;
  const shown = (files || []).filter((f) => only === "all" || f.issues.includes(only));

  return (
    <div style={S.root}>
      <h1 style={S.title}>Media library</h1>
      <p style={S.subtitle}>The images in your store Files, checked for alt text, file weight and size. Nothing changes until you save it, and every save can be undone.</p>
      {error && <div style={S.error} role="alert">{error}</div>}
      {note && <div style={S.ok}>{note}</div>}
      {files === null && <div style={S.empty}>Loading your files…</div>}
      {files && files.length === 0 && !error && <div style={S.card}><div style={S.empty}>No images found in your store Files yet.</div></div>}
      {files && files.length > 0 && (
        <div style={S.card}>
          <div style={{ marginBottom: 12 }}>
            <span style={S.stat}>{files.length} images loaded</span>
            <span style={S.stat}>{count("alt")} need alt text</span>
            <span style={S.stat}>{count("heavy")} over {meta.limits ? meta.limits.heavyKB : 500} KB</span>
            <span style={S.stat}>{count("wide")} wider than {meta.limits ? meta.limits.wide : 3000}px</span>
          </div>
          <div style={{ marginBottom: 14 }}>
            {[["all", "All"], ["alt", "Alt text"], ["heavy", "Heavy"], ["wide", "Very wide"], ["name", "File name"]].map(([k, l]) => (
              <button key={k} style={{ ...S.ghost, ...(only === k ? { color: "#fafafa", borderColor: "#6366f1" } : {}) }} onClick={() => setOnly(k)}>{l}</button>
            ))}
          </div>
          {shown.length === 0 && <div style={S.empty}>Nothing to fix in this view.</div>}
          {shown.map((f) => {
            const text = edit[f.id] !== undefined ? edit[f.id] : f.alt;
            const busyHere = busy === "ai" + f.id || busy === "save" + f.id;
            return (
              <div key={f.id} style={S.row}>
                <img src={f.url + (f.url.includes("?") ? "&" : "?") + "width=168"} alt={f.alt || ""} style={S.thumb} loading="lazy" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, wordBreak: "break-all" }}>{f.file}</div>
                  <div style={S.muted}>{f.width} × {f.height} px · {size(f.bytes)} · {f.type.replace("image/", "")}</div>
                  <div style={{ margin: "6px 0" }}>{f.issues.length === 0 ? <span style={S.tag("#86efac")}>Looks good</span> : f.issues.map((i) => <span key={i} style={S.tag(LABEL[i][1])}>{LABEL[i][0]}</span>)}</div>
                  <input style={S.input} aria-label={`Alt text for ${f.file}`} placeholder="Describe what is in the image" maxLength={125} value={text} onChange={(e) => setEdit((x) => ({ ...x, [f.id]: e.target.value }))} />
                  <div style={{ marginTop: 8 }}>
                    <button style={{ ...S.ghost, ...(busyHere ? S.off : {}) }} disabled={busyHere} onClick={() => draft(f)}>{busy === "ai" + f.id ? "Writing…" : <>AI write alt text<CostBadge action="alt-text" style={{ marginLeft: 6 }} /></>}</button>
                    <button style={{ ...S.btn, ...(busyHere || edit[f.id] === undefined || edit[f.id] === f.alt ? S.off : {}) }} disabled={busyHere || edit[f.id] === undefined || edit[f.id] === f.alt} onClick={() => save(f, edit[f.id], false)}>{busy === "save" + f.id ? "Saving…" : "Save"}</button>
                    {undo[f.id] !== undefined && <button style={S.ghost} disabled={busyHere} onClick={() => save(f, undo[f.id], true)}>Undo</button>}
                  </div>
                </div>
              </div>
            );
          })}
          {meta.hasMore && <button style={{ ...S.ghost, ...(busy === "load" ? S.off : {}) }} disabled={busy === "load"} onClick={() => load(true)}>{busy === "load" ? "Loading…" : "Load more images"}</button>}
          <p style={S.muted}>Heavy and very wide images are listed so you can replace them with smaller versions in Shopify. This tool does not resize files for you yet.</p>
        </div>
      )}
    </div>
  );
}
