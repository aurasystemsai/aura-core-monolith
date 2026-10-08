import React, { useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/keyword-research-suite";

const S = {
  root: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  title: { fontSize: 24, fontWeight: 800, margin: "0 0 4px" },
  subtitle: { color: "#71717a", fontSize: 13, margin: "0 0 20px" },
  card: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 14, padding: 24, marginBottom: 20 },
  cardTitle: { fontSize: 14, fontWeight: 700, margin: "0 0 12px" },
  label: { fontSize: 12, fontWeight: 600, color: "#a1a1aa", marginBottom: 6, display: "block" },
  textarea: { width: "100%", minHeight: 140, background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: 12, boxSizing: "border-box", fontFamily: "inherit" },
  input: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "9px 12px" },
  row: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginTop: 12 },
  btn: { background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 14, fontWeight: 700, cursor: "pointer" },
  btnOff: { opacity: 0.5, cursor: "not-allowed" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginTop: 12 },
  empty: { color: "#71717a", fontSize: 13, padding: "24px 0", textAlign: "center" },
  tag: { display: "inline-block", background: "#27272a", borderRadius: 6, padding: "2px 8px", fontSize: 12, margin: "2px 4px 2px 0" },
  stat: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 16px", minWidth: 120 },
  note: { color: "#71717a", fontSize: 12, marginTop: 10 },
};

const METHODS = [
  { id: "semantic", label: "Semantic (shared words)" },
  { id: "topic", label: "Topic (most common word)" },
  { id: "intent", label: "Search intent" },
];

function parseKeywords(text) {
  return text.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
}

export default function KeywordResearchSuite() {
  const [input, setInput] = useState("");
  const [method, setMethod] = useState("semantic");
  const [minSize, setMinSize] = useState(2);
  const [maxClusters, setMaxClusters] = useState(20);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [silo, setSilo] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [frequency, setFrequency] = useState("weekly");

  const [seed, setSeed] = useState("");
  const [found, setFound] = useState(null);
  const [finding, setFinding] = useState("");
  const [findError, setFindError] = useState("");

  const keywords = parseKeywords(input);

  async function find(kind) {
    setFinding(kind);
    setFindError("");
    try {
      const r = kind === "ideas"
        ? await apiFetchJSON(API + "/ideas", { method: "POST", body: JSON.stringify({ seed }) })
        : await apiFetchJSON(API + (kind === "store" ? "/store-keywords" : "/opportunities"));
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      const rows = kind === "ideas"
        ? r.ideas.map(i => ({ keyword: i.keyword, note: `AI · ${i.intent}${i.searchConsole ? ` · ${i.searchConsole.impressions} impressions, pos ${i.searchConsole.position}` : ""}` }))
        : kind === "store"
          ? r.keywords.map(k => ({ keyword: k.keyword, note: k.sources.join(", ") }))
          : r.opportunities.map(o => ({ keyword: o.query, note: `position ${o.position} · ${o.impressions} impressions · ${o.clicks} clicks` }));
      setFound({ kind, rows });
    } catch (e) {
      setFound(null);
      setFindError(e.message);
    } finally {
      setFinding("");
    }
  }

  function addToList(rows) {
    const have = new Set(parseKeywords(input).map(k => k.toLowerCase()));
    const add = rows.map(r => r.keyword).filter(k => !have.has(k.toLowerCase()));
    setInput([...parseKeywords(input), ...add].join("\n"));
  }

  async function call(name, path, body) {
    setLoading(name);
    setError("");
    try {
      const r = await apiFetchJSON(API + path, { method: "POST", body: JSON.stringify(body) });
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r.data;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading("");
    }
  }

  async function runCluster() {
    const data = await call("cluster", "/cluster/create", { keywords, method, minClusterSize: Number(minSize), maxClusters: Number(maxClusters) });
    if (data) { setResult(data); setSilo(null); setCalendar(null); }
  }

  async function buildSilo() {
    const data = await call("silo", "/cluster/build-silo", { clusterIds: [result.id] });
    if (data) { setSilo(data); setCalendar(null); }
  }

  async function buildCalendar() {
    const data = await call("calendar", "/cluster/silo-calendar", { siloId: silo.id, startDate: new Date().toISOString(), publishingFrequency: frequency });
    if (data) setCalendar(data);
  }

  function exportCsv() {
    const rows = [["cluster", "intent", "keyword"]];
    result.clusters.forEach(c => c.keywords.forEach(k => rows.push([c.primaryTopic, c.intent, k])));
    result.unclustered.forEach(k => rows.push(["(unclustered)", "", k]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "keyword-clusters.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const canRun = keywords.length >= 2 && !loading;

  return (
    <div style={S.root}>
      <h1 style={S.title}>Keyword Research Suite</h1>
      <p style={S.subtitle}>Group your keyword list into topic clusters, plan content silos, and schedule publishing. Works on the keywords you provide.</p>

      <div style={S.card}>
        <h3 style={S.cardTitle}>Find keywords <span style={{ color: "#71717a", fontWeight: 400 }}>(optional, or type your own below)</span></h3>
        <div style={S.row}>
          <button style={{ ...S.btn, ...(finding ? S.btnOff : {}) }} disabled={!!finding} onClick={() => find("store")}>{finding === "store" ? "Reading store…" : "From my products (free)"}</button>
          <button style={{ ...S.btn, ...(finding ? S.btnOff : {}) }} disabled={!!finding} onClick={() => find("gsc")}>{finding === "gsc" ? "Loading…" : "Google opportunities (free)"}</button>
          <input aria-label="Seed topic" style={{ ...S.input, width: 220 }} value={seed} onChange={e => setSeed(e.target.value)} placeholder="Seed topic (optional)" />
          <button style={{ ...S.btn, background: "#7c3aed", ...(finding ? S.btnOff : {}) }} disabled={!!finding} onClick={() => find("ideas")}>{finding === "ideas" ? "Thinking…" : "AI ideas (2 credits)"}</button>
        </div>
        {findError && <div style={S.error} role="alert">{findError}</div>}
        {found && found.rows.length === 0 && <div style={S.empty}>Nothing found. For Google opportunities, connect Search Console in Rank Tracker.</div>}
        {found && found.rows.length > 0 && (
          <div style={{ marginTop: 14 }}>
            <button style={{ ...S.btn, padding: "6px 14px", fontSize: 12 }} onClick={() => addToList(found.rows)}>Add all {found.rows.length} to my list</button>
            <div style={{ marginTop: 10, maxHeight: 220, overflowY: "auto" }}>
              {found.rows.map(r => <div key={r.keyword} style={{ fontSize: 13, padding: "4px 0", borderBottom: "1px solid #27272a" }}>{r.keyword} <span style={{ color: "#71717a", fontSize: 12 }}>· {r.note}</span></div>)}
            </div>
          </div>
        )}
        <div style={S.note}>Ideas come from your catalogue, your own Search Console data, or AI suggestions (labelled). No search-volume numbers are shown because none are available.</div>
      </div>

      <div style={S.card}>
        <h3 style={S.cardTitle}>1. Your keywords</h3>
        <label style={S.label} htmlFor="kw-input">One keyword per line (or comma separated), up to 500</label>
        <textarea id="kw-input" style={S.textarea} value={input} onChange={e => setInput(e.target.value)} placeholder={"organic cotton t-shirt\nbuy organic cotton shirt\nbest organic t-shirts\nhow to wash cotton shirts"} />
        <div style={S.row}>
          <div>
            <label style={S.label} htmlFor="kw-method">Method</label>
            <select id="kw-method" style={S.input} value={method} onChange={e => setMethod(e.target.value)}>
              {METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label} htmlFor="kw-min">Min cluster size</label>
            <input id="kw-min" type="number" min={1} max={20} style={{ ...S.input, width: 90 }} value={minSize} onChange={e => setMinSize(e.target.value)} />
          </div>
          <div>
            <label style={S.label} htmlFor="kw-max">Max clusters</label>
            <input id="kw-max" type="number" min={1} max={100} style={{ ...S.input, width: 90 }} value={maxClusters} onChange={e => setMaxClusters(e.target.value)} />
          </div>
          <button style={{ ...S.btn, ...(canRun ? {} : S.btnOff) }} disabled={!canRun} onClick={runCluster}>
            {loading === "cluster" ? "Clusteringâ€¦" : "Cluster keywords"}
          </button>
        </div>
        <div style={S.note}>{keywords.length} keyword{keywords.length === 1 ? "" : "s"} entered{keywords.length < 2 ? " â€” add at least 2" : ""}. Search volume and difficulty are not available because no keyword data provider is connected.</div>
        {error && <div style={S.error} role="alert">{error}</div>}
      </div>

      <div style={S.card}>
        <h3 style={S.cardTitle}>2. Clusters</h3>
        {!result && <div style={S.empty}>Run clustering to see results.</div>}
        {result && (
          <>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 700 }}>{result.clusters.length}</div><div style={S.note}>clusters</div></div>
              <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 700 }}>{result.totalKeywords}</div><div style={S.note}>unique keywords</div></div>
              <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 700 }}>{Math.round(result.metrics.coverage)}%</div><div style={S.note}>clustered</div></div>
              <div style={S.stat}><div style={{ fontSize: 20, fontWeight: 700 }}>{result.silhouetteScore.toFixed(2)}</div><div style={S.note}>separation score (0â€“1)</div></div>
            </div>
            {result.clusters.length === 0 && <div style={S.empty}>No cluster reached the minimum size. Lower the minimum cluster size or add more related keywords.</div>}
            {result.clusters.map(c => (
              <div key={c.id} style={{ borderTop: "1px solid #27272a", padding: "12px 0" }}>
                <strong>{c.primaryTopic}</strong> <span style={S.tag}>{c.intent}</span> <span style={S.note}>{c.keywords.length} keywords</span>
                <div style={{ marginTop: 6 }}>{c.keywords.map(k => <span key={k} style={S.tag}>{k}</span>)}</div>
              </div>
            ))}
            {result.unclustered.length > 0 && (
              <div style={{ borderTop: "1px solid #27272a", padding: "12px 0" }}>
                <strong>Unclustered</strong> <span style={S.note}>{result.unclustered.length} keywords</span>
                <div style={{ marginTop: 6 }}>{result.unclustered.map(k => <span key={k} style={S.tag}>{k}</span>)}</div>
              </div>
            )}
            <div style={S.row}>
              <button style={S.btn} onClick={exportCsv}>Export CSV</button>
              <button style={{ ...S.btn, ...(result.clusters.length && !loading ? {} : S.btnOff) }} disabled={!result.clusters.length || !!loading} onClick={buildSilo}>
                {loading === "silo" ? "Planningâ€¦" : "Plan content silo"}
              </button>
            </div>
          </>
        )}
      </div>

      {silo && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>3. Content silo plan</h3>
          <div style={S.note}>{silo.estimatedContent.pillarPages} pillar pages, {silo.estimatedContent.supportingPages} supporting pages, {silo.internalLinks.length} internal links.</div>
          {silo.pillarPages.map(p => (
            <div key={p.id} style={{ borderTop: "1px solid #27272a", padding: "10px 0" }}>
              <strong>Pillar: {p.topic}</strong> <span style={S.tag}>{p.priority}</span> <span style={S.note}>~{p.targetWordCount} words</span>
              <ul style={{ margin: "6px 0 0", paddingLeft: 20, color: "#d4d4d8", fontSize: 13 }}>
                {silo.supportingContent.filter(s => s.pillarPageId === p.id).map(s => <li key={s.id}>{s.keyword}</li>)}
              </ul>
            </div>
          ))}
          <div style={S.row}>
            <div>
              <label style={S.label} htmlFor="kw-freq">Publishing frequency</label>
              <select id="kw-freq" style={S.input} value={frequency} onChange={e => setFrequency(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <button style={{ ...S.btn, ...(loading ? S.btnOff : {}) }} disabled={!!loading} onClick={buildCalendar}>
              {loading === "calendar" ? "Schedulingâ€¦" : "Create content calendar"}
            </button>
          </div>
        </div>
      )}

      {calendar && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>4. Content calendar</h3>
          <div style={S.note}>{calendar.timeline.length} items, estimated completion {calendar.estimatedCompletion}.</div>
          {calendar.timeline.length === 0 && <div style={S.empty}>Nothing to schedule.</div>}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8 }}>
            <tbody>
              {calendar.timeline.map(t => (
                <tr key={t.contentId} style={{ borderTop: "1px solid #27272a" }}>
                  <td style={{ padding: "8px 6px", color: "#a1a1aa", whiteSpace: "nowrap" }}>{t.date}</td>
                  <td style={{ padding: "8px 6px" }}><span style={S.tag}>{t.type}</span></td>
                  <td style={{ padding: "8px 6px" }}>{t.topic || t.keyword}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
