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
const API = "/api/weekly-blog-content-engine";

export default function WeeklyBlogContentEngine() {
  const [items, setItems] = useState(null);
  const [perWeek, setPerWeek] = useState(3);
  const [focus, setFocus] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);
  const j = (method, body) => ({ method, body: JSON.stringify(body || {}) });

  const load = async () => { const r = await run("load", "/items"); if (r) setItems(r.items); };
  useEffect(() => { load(); }, []); // eslint-disable-line

  async function plan() { if (await run("plan", "/plan", j("POST", { postsPerWeek: perWeek, focus }))) load(); }
  async function add() { if (await run("add", "/items", j("POST", { title }))) { setTitle(""); load(); } }
  async function setStatus(id, status) { if (await run("s" + id, `/items/${id}`, j("PATCH", { status }))) load(); }
  async function remove(id) { if (await run("d" + id, `/items/${id}`, { method: "DELETE" })) load(); }

  return (
    <div style={S.root}>
      <h1 style={S.title}>Weekly Blog Planner</h1>
      <p style={S.subtitle}>A week of post ideas based on your real products and what you have already published. Write each one in Blog Draft Engine.</p>
      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <h2 style={S.h}>Plan the week</h2>
        <select style={S.input} value={perWeek} onChange={(e) => setPerWeek(Number(e.target.value))}>
          {[1, 2, 3, 4, 5, 7].map((n) => <option key={n} value={n}>{n} post{n > 1 ? "s" : ""} this week</option>)}
        </select>
        <input style={S.input} placeholder="Focus (optional), e.g. summer gifts" value={focus} onChange={(e) => setFocus(e.target.value)} />
        <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={plan}>{busy === "plan" ? "Planning…" : "AI plan my week (2 credits)"}</button>
        <div style={{ marginTop: 14 }}>
          <input style={S.input} placeholder="Or add your own post idea" value={title} onChange={(e) => setTitle(e.target.value)} />
          <button style={{ ...S.ghost, ...(busy || !title.trim() ? S.off : {}) }} disabled={!!busy || !title.trim()} onClick={add}>Add manually</button>
        </div>
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Calendar</h2>
        {items === null ? <div style={S.empty}>Loading…</div> : items.length === 0 ? <div style={S.empty}>Nothing planned yet. Let AI plan your week above.</div> :
          items.map((i) => (
            <div key={i.id} style={{ ...S.row, opacity: i.status === "skipped" ? 0.5 : 1 }}>
              <span>
                <span style={S.muted}>{i.date}</span> <b>{i.title}</b> {i.status !== "planned" && <span style={S.pill}>{i.status}</span>}
                <div style={S.muted}>{i.keyword && `Keyword: ${i.keyword}. `}{i.angle}{i.linkedProduct && ` Links to ${i.linkedProduct.title}.`}</div>
              </span>
              <span style={{ whiteSpace: "nowrap" }}>
                {i.status !== "written" && <button style={S.ghost} disabled={!!busy} onClick={() => setStatus(i.id, "written")}>Mark written</button>}
                {i.status !== "skipped" && <button style={S.ghost} disabled={!!busy} onClick={() => setStatus(i.id, "skipped")}>Skip</button>}
                <button style={S.ghost} disabled={!!busy} onClick={() => remove(i.id)}>Delete</button>
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
