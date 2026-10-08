import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/blog-draft-engine";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  grid: { display: "grid", gridTemplateColumns: "minmax(280px,340px) 1fr", gap: 20, alignItems: "start" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: 700, margin: "0 0 12px" },
  label: { fontSize: 12, fontWeight: 600, color: "#a1a1aa", margin: "10px 0 6px", display: "block" },
  input: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "9px 12px", boxSizing: "border-box", fontFamily: "inherit" },
  area: { minHeight: 320, fontFamily: "ui-monospace,Consolas,monospace", fontSize: 12 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  ghost: { background: "#27272a", color: "#fafafa" },
  off: { opacity: 0.5, cursor: "not-allowed" },
  row: { display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  ok: { background: "#052e16", border: "1px solid #166534", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  empty: { color: "#71717a", fontSize: 13, padding: "20px 0", textAlign: "center" },
  item: { padding: "8px 10px", border: "1px solid #27272a", borderRadius: 8, marginBottom: 6, cursor: "pointer", fontSize: 13 },
  note: { color: "#71717a", fontSize: 12, marginTop: 8 },
};

export default function BlogDraftEngine() {
  const [status, setStatus] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [form, setForm] = useState({ title: "", keyword: "", tone: "friendly and practical", notes: "" });
  const [topic, setTopic] = useState("");
  const [current, setCurrent] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [instruction, setInstruction] = useState("");

  async function call(name, path, options) {
    setBusy(name);
    setError("");
    setMessage("");
    try {
      const r = await apiFetchJSON(API + path, options);
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setBusy("");
    }
  }

  const post = (body, method = "POST") => ({ method, body: JSON.stringify(body) });

  async function refresh() {
    const r = await call("list", "/drafts");
    if (r) setDrafts(r.drafts);
  }

  useEffect(() => {
    (async () => {
      const s = await call("status", "/status");
      if (s) setStatus(s);
      refresh();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getIdeas() {
    const r = await call("ideas", "/ideas", post({ topic }));
    if (r) setIdeas(r.ideas);
  }

  async function generate() {
    const r = await call("generate", "/drafts/generate", post(form));
    if (r) { setCurrent(r.draft); refresh(); }
  }

  async function open(id) {
    const r = await call("open", `/drafts/${id}`);
    if (r) setCurrent(r.draft);
  }

  async function save() {
    const r = await call("save", `/drafts/${current.id}`, post({ title: current.title, keyword: current.keyword, metaDescription: current.metaDescription, bodyHtml: current.bodyHtml }, "PUT"));
    if (r) { setCurrent(r.draft); setMessage("Saved."); refresh(); }
  }

  async function improve() {
    const r = await call("improve", `/drafts/${current.id}/improve`, post({ instruction }));
    if (r) { setCurrent(r.draft); setMessage("Draft improved."); refresh(); }
  }

  async function publish(live) {
    if (live && !window.confirm("Publish this post live on your store now?")) return;
    const r = await call("publish", `/drafts/${current.id}/publish`, post({ live }));
    if (r) { setMessage(live ? "Published live to your blog." : "Saved to Shopify as a hidden draft."); open(current.id); refresh(); }
  }

  async function remove() {
    if (!window.confirm("Delete this draft?")) return;
    const r = await call("delete", `/drafts/${current.id}`, { method: "DELETE" });
    if (r) { setCurrent(null); refresh(); }
  }

  const disabled = !!busy;
  const aiOff = status && !status.ai;
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div style={S.root}>
      <h1 style={S.title}>Blog Draft Engine</h1>
      <p style={S.subtitle}>AI writes blog posts that link to your real products. Edit by hand, improve with AI, then send to Shopify as a hidden draft or publish live.</p>
      {aiOff && <div style={S.error} role="alert">AI is not configured on the server, so generating is unavailable. You can still edit and publish saved drafts.</div>}
      {error && <div style={S.error} role="alert">{error}</div>}
      {message && <div style={S.ok}>{message}</div>}

      <div style={S.grid}>
        <div>
          <div style={S.card}>
            <h3 style={S.cardTitle}>New draft</h3>
            <label style={S.label} htmlFor="bd-title">Working title</label>
            <input id="bd-title" style={S.input} value={form.title} onChange={set("title")} placeholder="How to care for a handmade mug" />
            <label style={S.label} htmlFor="bd-kw">Primary keyword (optional)</label>
            <input id="bd-kw" style={S.input} value={form.keyword} onChange={set("keyword")} />
            <label style={S.label} htmlFor="bd-tone">Tone</label>
            <input id="bd-tone" style={S.input} value={form.tone} onChange={set("tone")} />
            <label style={S.label} htmlFor="bd-notes">Notes for the writer (optional)</label>
            <textarea id="bd-notes" style={{ ...S.input, minHeight: 70 }} value={form.notes} onChange={set("notes")} />
            <div style={S.row}>
              <button style={{ ...S.btn, ...(disabled || aiOff || !form.title.trim() ? S.off : {}) }} disabled={disabled || aiOff || !form.title.trim()} onClick={generate}>
                {busy === "generate" ? "Writing…" : "Write with AI (3 credits)"}
              </button>
            </div>
          </div>

          <div style={S.card}>
            <h3 style={S.cardTitle}>Need ideas?</h3>
            <input aria-label="Topic" style={S.input} value={topic} onChange={e => setTopic(e.target.value)} placeholder="Topic (optional)" />
            <div style={S.row}>
              <button style={{ ...S.btn, ...S.ghost, ...(disabled || aiOff ? S.off : {}) }} disabled={disabled || aiOff} onClick={getIdeas}>{busy === "ideas" ? "Thinking…" : "Suggest ideas (2 credits)"}</button>
            </div>
            <div style={{ marginTop: 10 }}>
              {ideas.map(i => (
                <div key={i.title} style={S.item} onClick={() => setForm({ ...form, title: i.title, keyword: i.keyword })} title={i.angle}>
                  {i.title}<div style={{ color: "#71717a", fontSize: 12 }}>{i.keyword}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <h3 style={S.cardTitle}>Saved drafts</h3>
            {drafts.length === 0 && <div style={S.empty}>No drafts yet.</div>}
            {drafts.map(d => (
              <div key={d.id} style={{ ...S.item, borderColor: current && current.id === d.id ? "#4f46e5" : "#27272a" }} onClick={() => open(d.id)}>
                {d.title}<div style={{ color: "#71717a", fontSize: 12 }}>{d.words} words · {d.status}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          {!current && <div style={S.empty}>{busy === "generate" ? "Writing your draft…" : "Write a new draft or open a saved one."}</div>}
          {current && (
            <>
              <label style={{ ...S.label, marginTop: 0 }} htmlFor="bd-t2">Title</label>
              <input id="bd-t2" style={S.input} value={current.title} onChange={e => setCurrent({ ...current, title: e.target.value })} />
              <label style={S.label} htmlFor="bd-meta">Meta description ({current.metaDescription.length} characters)</label>
              <input id="bd-meta" style={S.input} value={current.metaDescription} onChange={e => setCurrent({ ...current, metaDescription: e.target.value })} />
              <label style={S.label} htmlFor="bd-body">Article HTML</label>
              <textarea id="bd-body" style={{ ...S.input, ...S.area }} value={current.bodyHtml} onChange={e => setCurrent({ ...current, bodyHtml: e.target.value })} />
              {current.quality && (
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 4 }}>Checks: {current.quality.passed}/{current.quality.total} passed (saved version)</div>
                  {current.quality.checks.map(c => <div key={c.id} style={{ fontSize: 12, color: c.ok ? "#86efac" : "#fca5a5" }}>{c.ok ? "✓" : "✗"} {c.detail}</div>)}
                </div>
              )}
              <div style={S.row}>
                <button style={{ ...S.btn, ...(disabled ? S.off : {}) }} disabled={disabled} onClick={save}>{busy === "save" ? "Saving…" : "Save"}</button>
                <button style={{ ...S.btn, ...S.ghost, ...(disabled ? S.off : {}) }} disabled={disabled} onClick={() => publish(false)}>{busy === "publish" ? "Sending…" : "Send to Shopify as draft"}</button>
                <button style={{ ...S.btn, background: "#166534", ...(disabled ? S.off : {}) }} disabled={disabled} onClick={() => publish(true)}>Publish live</button>
                <button style={{ ...S.btn, background: "#7f1d1d", ...(disabled ? S.off : {}) }} disabled={disabled} onClick={remove}>Delete</button>
              </div>
              <div style={S.note}>Save before publishing so Shopify gets your latest edits.</div>
              <label style={S.label} htmlFor="bd-ins">Improve with AI</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input id="bd-ins" style={S.input} value={instruction} onChange={e => setInstruction(e.target.value)} placeholder="e.g. make it shorter and add a section on care" />
                <button style={{ ...S.btn, ...(disabled || aiOff ? S.off : {}), whiteSpace: "nowrap" }} disabled={disabled || aiOff} onClick={improve}>{busy === "improve" ? "Improving…" : "Improve (3 credits)"}</button>
              </div>
              {current.published && <div style={S.note}>Sent to Shopify {new Date(current.published.at).toLocaleString()} ({current.published.live ? "live" : "hidden draft"}).</div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
