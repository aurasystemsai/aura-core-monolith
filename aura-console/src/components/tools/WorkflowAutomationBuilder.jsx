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
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "9px 10px", border: "1px solid #27272a", borderRadius: 8, marginBottom: 6, fontSize: 13 },
  warn: { background: "#1c1407", border: "1px solid #854d0e", color: "#fcd34d", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
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
const API = "/api/workflow-automation-builder";
const blank = { name: "", trigger: "low_stock", threshold: "", action: "email_me", email: "", tag: "" };

export default function Automations() {
  const [meta, setMeta] = useState(null);
  const [rules, setRules] = useState([]);
  const [runs, setRuns] = useState([]);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const run = (n, u, o) => call(setBusy, setError, n, API + u, o);
  const send = (method, body) => ({ method, body: JSON.stringify(body || {}) });
  const load = async () => {
    const [m, r] = await Promise.all([run("load", "/meta"), run("load", "/rules")]);
    if (m) setMeta(m);
    if (r) { setRules(r.rules); setRuns(r.runs); }
    setLoaded(true);
  };
  useEffect(() => { load(); }, []); // eslint-disable-line

  const trig = meta && meta.triggers[form.trigger];
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  async function add() { const r = await run("add", "/rules", send("POST", form)); if (r) { setForm(blank); load(); } }
  async function del(id) { await run("del", "/rules/" + id, { method: "DELETE" }); load(); }
  async function runOne(id) { const r = await run("run:" + id, "/rules/" + id + "/run", send("POST")); if (r) load(); }
  async function runAll() { const r = await run("all", "/run-all", send("POST")); if (r) load(); }
  async function suggest() { setSuggestion(""); const r = await run("sug", "/suggest", send("POST")); if (r) setSuggestion(r.suggestion); }

  return (
    <div style={S.root}>
      <h1 style={S.title}>Automations</h1>
      <p style={S.subtitle}>Simple rules that check your real store data and then email you or tag the matches in Shopify. Rules run when you press Run. Nothing runs in the background yet.</p>
      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <h2 style={S.h}>New rule</h2>
        <input style={S.input} placeholder="Rule name (optional)" value={form.name} onChange={set("name")} maxLength={80} />
        <select style={S.input} value={form.trigger} onChange={set("trigger")}>
          {meta && Object.entries(meta.triggers).map(([k, t]) => <option key={k} value={k}>When: {t.label}</option>)}
        </select>
        {trig && <input style={S.input} type="number" min="0" placeholder={`${trig.param} (default ${trig.def})`} value={form.threshold} onChange={set("threshold")} />}
        <select style={S.input} value={form.action} onChange={set("action")}>
          {meta && Object.entries(meta.actions).map(([k, l]) => <option key={k} value={k}>Then: {l}</option>)}
        </select>
        {form.action === "email_me"
          ? <input style={S.input} type="email" placeholder="Send the summary to (email)" value={form.email} onChange={set("email")} />
          : <input style={S.input} placeholder="Tag to add, e.g. lapsed" value={form.tag} onChange={set("tag")} maxLength={40} />}
        <button style={{ ...S.btn, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={add}>{busy === "add" ? "Saving..." : "Add rule"}</button>
        <button style={{ ...S.ghost, ...(!meta || !meta.ai || busy ? S.off : {}) }} disabled={!meta || !meta.ai || !!busy} onClick={suggest}>{busy === "sug" ? "Thinking..." : "AI: which rules should I add? (1 credit)"}</button>
        {suggestion && <div style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#d4d4d8", marginTop: 10 }}>{suggestion}</div>}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Your rules</h2>
        {!loaded ? <div style={S.empty}>Loading...</div> : !rules.length ? <div style={S.empty}>No rules yet. Add one above.</div> : (
          <>
            {rules.map((r) => (
              <div key={r.id} style={S.row}>
                <span>{r.name}<br /><span style={S.muted}>{meta && meta.triggers[r.trigger] ? meta.triggers[r.trigger].label : r.trigger} ({r.threshold}) then {r.action === "email_me" ? "email " + r.email : "tag \"" + r.tag + "\""}</span></span>
                <span>
                  <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => runOne(r.id)}>{busy === "run:" + r.id ? "Running..." : "Run"}</button>
                  <button style={{ ...S.ghost, marginRight: 0, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={() => del(r.id)}>Delete</button>
                </span>
              </div>
            ))}
            <button style={{ ...S.btn, marginTop: 8, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={runAll}>{busy === "all" ? "Running..." : "Run all rules"}</button>
          </>
        )}
      </div>

      <div style={S.card}>
        <h2 style={S.h}>Recent runs</h2>
        {!runs.length ? <div style={S.empty}>Nothing has run yet.</div> : runs.slice(0, 15).map((r) => (
          <div key={r.id} style={{ ...S.row, display: "block" }}>
            <b>{r.name}</b> <span style={S.muted}>{new Date(r.at).toLocaleString()}, {r.matched} matched</span>
            <div style={r.failed ? { color: "#fca5a5" } : { color: "#d4d4d8" }}>{r.outcome}</div>
            {r.preview && r.preview.length > 0 && <div style={S.muted}>{r.preview.join("; ")}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}