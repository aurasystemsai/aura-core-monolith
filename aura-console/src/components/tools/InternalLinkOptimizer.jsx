import React, { useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/internal-link-optimizer";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 24, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: 700, margin: "0 0 12px" },
  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnGhost: { background: "#27272a", color: "#fafafa", border: "1px solid #3f3f46", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer" },
  btnOff: { opacity: 0.5, cursor: "not-allowed" },
  stat: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px", minWidth: 120 },
  statNum: { fontSize: 22, fontWeight: 800 },
  statLbl: { fontSize: 11, color: "#71717a" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  ok: { background: "#0c1c10", border: "1px solid #14532d", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  empty: { color: "#71717a", fontSize: 13, padding: "16px 0" },
  th: { textAlign: "left", fontSize: 11, color: "#71717a", padding: "6px 8px", borderBottom: "1px solid #27272a" },
  td: { fontSize: 12, padding: "8px", borderBottom: "1px solid #27272a", verticalAlign: "top" },
};

const keyOf = (s) => `${s.sourceId}|${s.targetUrl}|${s.anchor}`;
const short = (u) => u.replace(/^https?:\/\/[^/]+/, "");

export default function InternalLinkOptimizer() {
  const [data, setData] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [picked, setPicked] = useState({});
  const [extra, setExtra] = useState([]);
  const [aiSource, setAiSource] = useState("");

  useEffect(() => {
    let live = true;
    apiFetchJSON(`${API}/latest`).then((r) => { if (live && r.ok && r.analysis) setData(r.analysis); }).catch(() => {});
    return () => { live = false; };
  }, []);

  async function analyze() {
    setLoading(true); setError(""); setNotice(""); setPicked({}); setExtra([]);
    const r = await apiFetchJSON(`${API}/analyze`, { method: "POST", body: JSON.stringify({}) });
    setLoading(false);
    if (!r.ok) return setError(r.error || "Analysis failed");
    setData(r); setWarnings(r.warnings || []);
  }

  async function aiSuggest() {
    if (!aiSource) return;
    setAiBusy(true); setError("");
    const r = await apiFetchJSON(`${API}/ai/suggest`, { method: "POST", body: JSON.stringify({ sourceId: aiSource }) });
    setAiBusy(false);
    if (!r.ok) return setError(r.error || "AI suggestion failed");
    setExtra(r.suggestions || []);
    if (!(r.suggestions || []).length) setNotice("AI found no safe link opportunities on that page.");
  }

  async function apply() {
    const all = [...extra, ...((data && data.suggestions) || [])];
    const chosen = all.filter((s) => picked[keyOf(s)]).slice(0, 10);
    if (!chosen.length) return;
    setApplying(true); setError(""); setNotice("");
    const r = await apiFetchJSON(`${API}/apply`, { method: "POST", body: JSON.stringify({ suggestions: chosen }) });
    setApplying(false);
    if (!r.ok) return setError(r.error || "Apply failed");
    const fails = r.results.filter((x) => !x.ok).map((x) => x.error);
    setNotice(`${r.success} link(s) added to your store.${fails.length ? ` ${fails.length} skipped: ${[...new Set(fails)].join("; ")}` : ""} Re-run analysis to refresh.`);
    setPicked({});
  }

  const suggestions = [...extra, ...((data && data.suggestions) || [])];
  const selected = Object.values(picked).filter(Boolean).length;
  const orphans = data ? data.nodes.filter((n) => n.inbound === 0) : [];

  return (
    <div style={S.root}>
      <h1 style={S.title}>Internal Link Optimizer</h1>
      <p style={S.subtitle}>Maps links across your products, pages, collections and articles, finds orphan pages, and adds links you approve. 1 credit per analysis.</p>
      {error && <div style={S.error}>{error}</div>}
      {notice && <div style={S.ok}>{notice}</div>}
      {warnings.map((w, i) => <div key={i} style={S.error}>{w}</div>)}

      <div style={S.card}>
        <div style={S.row}>
          <button style={{ ...S.btn, ...(loading ? S.btnOff : {}) }} disabled={loading} onClick={analyze}>
            {loading ? "Analyzing store…" : data ? "Re-run analysis" : "Analyze my store"}
          </button>
          {data && <span style={{ color: "#71717a", fontSize: 12 }}>Last run {new Date(data.createdAt).toLocaleString()}</span>}
        </div>
        {!data && !loading && <div style={S.empty}>No analysis yet. Run one to see your link structure.</div>}
      </div>

      {data && (
        <>
          <div style={{ ...S.row, marginBottom: 20 }}>
            {[["Pages", data.stats.pages], ["Internal links", data.stats.totalLinks], ["No inbound links", data.stats.withoutInbound], ["No outbound links", data.stats.withoutOutbound]].map(([l, n]) => (
              <div key={l} style={S.stat}><div style={S.statNum}>{n}</div><div style={S.statLbl}>{l}</div></div>
            ))}
          </div>

          <div style={S.card}>
            <h3 style={S.cardTitle}>AI link finder</h3>
            <div style={S.row}>
              <select value={aiSource} onChange={(e) => setAiSource(e.target.value)} style={{ ...S.btnGhost, minWidth: 260, padding: "9px 10px" }}>
                <option value="">Choose a page to add links to…</option>
                {data.nodes.map((n) => <option key={n.url} value={n.id || n.url} disabled={!n.id}>{n.title}</option>)}
              </select>
              <button style={{ ...S.btn, ...(!aiSource || aiBusy ? S.btnOff : {}) }} disabled={!aiSource || aiBusy} onClick={aiSuggest}>
                {aiBusy ? "Thinking…" : "AI suggest (1 credit)"}
              </button>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ ...S.row, justifyContent: "space-between", marginBottom: 12 }}>
              <h3 style={{ ...S.cardTitle, margin: 0 }}>Suggested links ({suggestions.length})</h3>
              <button style={{ ...S.btn, ...(!selected || applying ? S.btnOff : {}) }} disabled={!selected || applying} onClick={apply}>
                {applying ? "Applying…" : `Add ${selected} selected to store`}
              </button>
            </div>
            {!suggestions.length ? <div style={S.empty}>No safe link opportunities found.</div> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={S.th}></th><th style={S.th}>From</th><th style={S.th}>Anchor text</th><th style={S.th}>To</th></tr></thead>
                <tbody>
                  {suggestions.map((s) => (
                    <tr key={keyOf(s)}>
                      <td style={S.td}><input type="checkbox" checked={!!picked[keyOf(s)]} onChange={(e) => setPicked({ ...picked, [keyOf(s)]: e.target.checked })} /></td>
                      <td style={S.td}>{s.sourceTitle}<div style={{ color: "#71717a" }}>{short(s.sourceUrl)}</div></td>
                      <td style={S.td}><b>{s.anchor}</b>{s.context && <div style={{ color: "#71717a" }}>…{s.context}…</div>}</td>
                      <td style={S.td}>{s.targetTitle}<div style={{ color: "#71717a" }}>{short(s.targetUrl)}</div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div style={S.card}>
            <h3 style={S.cardTitle}>Pages with no inbound links ({orphans.length})</h3>
            {!orphans.length ? <div style={S.empty}>Every page has at least one internal link pointing to it.</div> : orphans.map((n) => (
              <div key={n.url} style={{ fontSize: 13, padding: "4px 0" }}>{n.title} <span style={{ color: "#71717a" }}>{short(n.url)} · {n.type}</span></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
