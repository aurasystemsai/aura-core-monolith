import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import CostBadge from "../../help/CostBadge";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 20, marginBottom: 20 },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", padding: "8px 10px", fontSize: 13, width: "100%", boxSizing: "border-box", fontFamily: "inherit" },
  label: { display: "block", fontSize: 12, color: "#a1a1aa", margin: "0 0 4px", fontWeight: 600 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginRight: 8 },
  ghost: { background: "transparent", color: "#a1a1aa", border: "1px solid #3f3f46", borderRadius: 10, padding: "8px 14px", fontSize: 13, cursor: "pointer" },
  off: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 14 },
  muted: { color: "#71717a", fontSize: 12 },
  th: { textAlign: "left", fontSize: 12, color: "#a1a1aa", padding: "8px 10px", borderBottom: "1px solid #3f3f46" },
  td: { padding: "8px 10px", fontSize: 13, borderBottom: "1px solid #27272a", verticalAlign: "top", wordBreak: "break-word" },
  tag: (c) => ({ display: "inline-block", fontSize: 11, fontWeight: 700, borderRadius: 999, padding: "1px 8px", marginRight: 8, background: c, color: "#18181b" }),
};
const API = "/api/competitive-analysis";
const LEVEL = { fix: ["Fix", "#fcd34d"], gap: ["Gap", "#fdba74"], good: ["Good", "#86efac"] };

export default function CompetitiveAnalysis() {
  const [competitor, setCompetitor] = useState("");
  const [mine, setMine] = useState("");
  const [result, setResult] = useState(null);
  const [tips, setTips] = useState(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function call(name, url, body) {
    setBusy(name); setError("");
    try {
      const r = await apiFetchJSON(API + url, { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r;
    } catch (e) { setError(e.message); return null; } finally { setBusy(""); }
  }
  async function compare() {
    setTips(null);
    const r = await call("compare", "/compare", { competitor, mine });
    if (r) setResult(r);
  }
  async function advise() {
    const r = await call("advice", "/advice", { mine: result.mine, theirs: result.theirs });
    if (r) setTips(r.tips);
  }

  const rows = result ? [
    ["Title", (s) => `${s.title || "None"} (${s.titleLength} chars)`],
    ["Meta description", (s) => (s.description ? `${s.description} (${s.descriptionLength} chars)` : "None")],
    ["Main heading (H1)", (s) => (s.h1.length ? s.h1.join(" | ") : "None")],
    ["Sections (H2)", (s) => (s.h2Count ? `${s.h2Count}: ${s.h2.slice(0, 5).join(", ")}` : "None")],
    ["Search markup (schema)", (s) => (s.schemaTypes.length ? s.schemaTypes.join(", ") : "None")],
    ["Words on page", (s) => s.words],
    ["Images with alt text", (s) => `${s.imagesWithAlt} of ${s.images}`],
    ["Share image", (s) => (s.ogImage ? "Yes" : "No")],
    ["Server response", (s) => `${s.ms} ms`],
  ] : [];

  return (
    <div style={S.root}>
      <h1 style={S.title}>Competitor comparison</h1>
      <p style={S.subtitle}>Compare one of your pages with a competitor page, side by side, using what is actually on the pages. It does not estimate their traffic or rankings.</p>
      {error && <div style={S.error} role="alert">{error}</div>}
      <div style={S.card}>
        <label style={S.label} htmlFor="ca-comp">Competitor page</label>
        <input id="ca-comp" style={S.input} placeholder="example.com/products/running-shoes" value={competitor} onChange={(e) => setCompetitor(e.target.value)} maxLength={500} />
        <label style={{ ...S.label, marginTop: 12 }} htmlFor="ca-mine">Your page (leave blank for your home page)</label>
        <input id="ca-mine" style={S.input} placeholder="yourstore.com/products/your-shoes" value={mine} onChange={(e) => setMine(e.target.value)} maxLength={500} />
        <div style={{ marginTop: 14 }}>
          <button style={{ ...S.btn, ...(busy || !competitor.trim() ? S.off : {}) }} disabled={!!busy || !competitor.trim()} onClick={compare}>{busy === "compare" ? "Reading both pages..." : "Compare"}</button>
          <span style={S.muted}>Free</span>
        </div>
      </div>
      {!result && !busy && <div style={{ ...S.muted, textAlign: "center", padding: "10px 0" }}>Enter a competitor page to see how it compares with yours.</div>}
      {result && (
        <>
          <div style={S.card}>
            <h2 style={{ fontSize: 16, margin: "0 0 12px" }}>What stands out</h2>
            {result.observations.map((o, i) => (
              <div key={i} style={{ fontSize: 13, marginBottom: 8 }}><span style={S.tag(LEVEL[o.level][1])}>{LEVEL[o.level][0]}</span>{o.text}</div>
            ))}
            <div style={{ marginTop: 14 }}>
              <button style={{ ...S.ghost, ...(busy ? S.off : {}) }} disabled={!!busy} onClick={advise}>
                {busy === "advice" ? "Thinking..." : <>AI: suggest what to change <CostBadge action="competitive-analysis" style={{ marginLeft: 6 }} /></>}
              </button>
            </div>
            {tips && <ul style={{ margin: "14px 0 0", paddingLeft: 18, fontSize: 13, lineHeight: 1.6 }}>{tips.map((t, i) => <li key={i}>{t}</li>)}</ul>}
          </div>
          <div style={S.card}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={S.th}></th><th style={S.th}>Your page</th><th style={S.th}>Competitor</th></tr></thead>
              <tbody>
                <tr><td style={S.td}>Address</td><td style={S.td}>{result.mine.url}</td><td style={S.td}>{result.theirs.url}</td></tr>
                {rows.map(([name, fn]) => <tr key={name}><td style={{ ...S.td, color: "#a1a1aa" }}>{name}</td><td style={S.td}>{fn(result.mine)}</td><td style={S.td}>{fn(result.theirs)}</td></tr>)}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
