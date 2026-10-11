import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";
import CostBadge from "../../help/CostBadge";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px", maxWidth: 760 },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  h2: { fontSize: 16, margin: "0 0 10px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  label: { display: "block", fontSize: 12, color: "#a1a1aa", margin: "10px 0 4px", fontWeight: 600 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginRight: 6 },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  note: { background: "#0c1c12", border: "1px solid #14532d", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  muted: { color: "#71717a", fontSize: 12 },
  row: { padding: "12px 0", borderBottom: "1px solid #27272a", fontSize: 13 },
  tag: { display: "inline-block", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "1px 8px", marginRight: 8, background: "#a5b4fc", color: "#18181b" },
};
const API = "/api/social-scheduler-content-engine";

export default function SocialSchedulerContentEngine() {
  const [products, setProducts] = useState(null);
  const [meta, setMeta] = useState({ platforms: {}, tones: [] });
  const [posts, setPosts] = useState(null);
  const [form, setForm] = useState({ productId: "", platform: "instagram", tone: "friendly", text: "", date: "", product: "" });
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
  async function loadPosts() { const r = await call("posts", "/posts"); setPosts(r ? r.posts : []); }
  useEffect(() => {
    (async () => {
      const r = await call("products", "/products");
      setProducts(r ? r.products : []);
      if (r) setMeta({ platforms: r.platforms, tones: r.tones });
      loadPosts();
    })();
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function write() {
    setNote("");
    const r = await call("write", "/write", { method: "POST", body: JSON.stringify(form) });
    if (r) setForm((f) => ({ ...f, text: r.text, product: r.product.title }));
  }
  async function save() {
    const r = await call("save", "/posts", { method: "POST", body: JSON.stringify(form) });
    if (r) { setForm((f) => ({ ...f, text: "", date: "" })); setNote("Saved to your calendar."); loadPosts(); }
  }
  async function patch(id, body) { const r = await call("p" + id, `/posts/${id}`, { method: "PATCH", body: JSON.stringify(body) }); if (r) loadPosts(); }
  async function del(id) { const r = await call("d" + id, `/posts/${id}`, { method: "DELETE" }); if (r) loadPosts(); }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); setNote("Copied. Paste it into the app and post it."); setError(""); } catch { setError("Copying was blocked. Select the text and copy it by hand."); }
  }

  const writing = busy === "write";
  const platforms = Object.entries(meta.platforms);

  return (
    <div style={S.root}>
      <h1 style={S.title}>Social post planner</h1>
      <p style={S.subtitle}>Write posts from your real products and keep a simple calendar. AURA does not post for you, because no social accounts are connected. Copy the post when it is due and publish it yourself.</p>
      {error && <div style={S.error}>{error}</div>}
      {note && <div style={S.note}>{note}</div>}

      <div style={S.card}>
        <h2 style={S.h2}>Write a post</h2>
        <div style={S.grid}>
          <div>
            <label style={S.label}>Product</label>
            <select style={S.input} value={form.productId} onChange={set("productId")} disabled={!products}>
              <option value="">{products ? (products.length ? "Choose a product" : "No active products") : "Loading…"}</option>
              {(products || []).map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Platform</label>
            <select style={S.input} value={form.platform} onChange={set("platform")}>
              {platforms.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Tone</label>
            <select style={S.input} value={form.tone} onChange={set("tone")}>
              {meta.tones.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Post on (optional)</label>
            <input type="date" style={S.input} value={form.date} onChange={set("date")} />
          </div>
        </div>
        <label style={S.label}>Post text (write your own, or let AI write it)</label>
        <textarea style={{ ...S.input, minHeight: 110 }} maxLength={1500} value={form.text} onChange={set("text")} placeholder="Your post…" />
        <div style={{ marginTop: 12 }}>
          <button style={{ ...S.btn, ...(!form.productId || busy ? S.off : {}) }} disabled={!form.productId || !!busy} onClick={write}>
            {writing ? "Writing…" : <>AI write post <CostBadge action="social-post" style={{ marginLeft: 6 }} /></>}
          </button>
          <button style={{ ...S.btn, background: "#27272a", ...(form.text.trim().length < 3 || busy ? S.off : {}) }} disabled={form.text.trim().length < 3 || !!busy} onClick={save}>{busy === "save" ? "Saving…" : "Save to calendar"}</button>
        </div>
      </div>

      <div style={S.card}>
        <h2 style={S.h2}>Calendar</h2>
        {!posts ? <div style={S.muted}>Loading…</div>
          : posts.length === 0 ? <div style={S.muted}>Nothing planned yet. Write a post above and save it.</div>
          : posts.map((p) => (
            <div key={p.id} style={{ ...S.row, opacity: p.done ? 0.55 : 1 }}>
              <div style={{ marginBottom: 6 }}>
                <span style={S.tag}>{meta.platforms[p.platform] || p.platform}</span>
                <span style={S.muted}>{p.date || "No date"}{p.product ? ` · ${p.product}` : ""}{p.done ? " · posted" : ""}</span>
              </div>
              <div style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}>{p.text}</div>
              <button style={S.ghost} onClick={() => copy(p.text)}>Copy</button>
              <button style={S.ghost} disabled={busy === "p" + p.id} onClick={() => patch(p.id, { done: !p.done })}>{p.done ? "Mark as not posted" : "Mark as posted"}</button>
              <input type="date" style={{ ...S.input, width: 150, display: "inline-block", marginRight: 6 }} value={p.date || ""} onChange={(e) => patch(p.id, { date: e.target.value })} />
              <button style={S.ghost} disabled={busy === "d" + p.id} onClick={() => del(p.id)}>Delete</button>
            </div>
          ))}
      </div>
    </div>
  );
}
