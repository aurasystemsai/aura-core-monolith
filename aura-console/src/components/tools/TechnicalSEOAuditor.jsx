import React, { useCallback, useEffect, useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/technical-seo-auditor";

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
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  warn: { background: "#1c1708", border: "1px solid #713f12", color: "#fcd34d", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  empty: { color: "#71717a", fontSize: 13, padding: "24px 0", textAlign: "center" },
  stat: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 16px", minWidth: 110 },
  statVal: { fontSize: 22, fontWeight: 800 },
  statLbl: { fontSize: 11, color: "#71717a" },
  finding: { borderBottom: "1px solid #27272a", padding: "8px 0", fontSize: 13 },
  plan: { whiteSpace: "pre-wrap", fontSize: 13, lineHeight: 1.6, color: "#d4d4d8" },
};

const SEV = { high: "#f87171", medium: "#fbbf24", low: "#a1a1aa" };
const scoreColor = (s) => (s >= 80 ? "#86efac" : s >= 50 ? "#fbbf24" : "#f87171");

function Findings({ list }) {
  if (!list.length) return <div style={{ color: "#86efac", fontSize: 13 }}>No issues found.</div>;
  return list.map((f, i) => (
    <div key={i} style={S.finding}>
      <span style={{ color: SEV[f.severity], fontWeight: 700, marginRight: 8 }}>{f.severity}</span>
      <strong>{f.title}</strong>
      <div style={{ color: "#71717a", fontSize: 12, marginTop: 2 }}>{f.detail}</div>
    </div>
  ));
}

export default function TechnicalSEOAuditor() {
  const [audit, setAudit] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [plan, setPlan] = useState("");

  const loadHistory = useCallback(async () => {
    const r = await apiFetchJSON(API + "/history");
    if (r.ok) setHistory(r.history || []);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function post(name, path, body) {
    setLoading(name);
    setError("");
    try {
      const r = await apiFetchJSON(API + path, { method: "POST", body: JSON.stringify(body || {}) });
      if (!r.ok) throw new Error(r.error || `Request failed (${r.status})`);
      return r;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading("");
    }
  }

  async function run() {
    const r = await post("audit", "/audit");
    if (!r) return;
    setAudit({ id: r.id, createdAt: r.createdAt, ...r.result });
    setPlan("");
    loadHistory();
  }

  async function open(id) {
    const r = await apiFetchJSON(API + "/history/" + id);
    if (!r.ok) return setError(r.error || "Could not load that audit");
    setAudit({ id: r.entry.id, createdAt: r.entry.createdAt, ...r.entry.result });
    setPlan("");
  }

  async function makePlan() {
    const r = await post("plan", "/ai/plan", { id: audit.id });
    if (r) setPlan(r.plan);
  }

  const siteFindings = audit ? [...audit.robots.findings, ...audit.sitemap.findings] : [];

  return (
    <div style={S.root}>
      <h1 style={S.title}>Technical SEO Auditor</h1>
      <p style={S.subtitle}>Fetches your live storefront (home page plus a sample product, collection, page and article), robots.txt and sitemap, and checks what search engines actually see.</p>

      {error && <div style={S.error}>{error}</div>}

      <div style={S.card}>
        <div style={S.row}>
          <button style={{ ...S.btn, ...(loading ? S.btnOff : {}) }} disabled={!!loading} onClick={run}>
            {loading === "audit" ? "Auditing your storefront…" : "Run technical audit"}
          </button>
          <span style={{ color: "#71717a", fontSize: 12 }}>1 credit per audit. The AI action plan uses credits based on model.</span>
        </div>
        {history.length > 0 && (
          <div style={{ ...S.row, marginTop: 14 }}>
            <span style={{ fontSize: 12, color: "#a1a1aa" }}>Past audits:</span>
            {history.slice(0, 6).map(h => (
              <button key={h.id} style={S.btnGhost} onClick={() => open(h.id)}>
                {new Date(h.createdAt).toLocaleDateString()}{typeof h.score === "number" ? ` · ${h.score}` : ""}
              </button>
            ))}
          </div>
        )}
      </div>

      {!audit && loading !== "audit" && <div style={S.card}><div style={S.empty}>No audit yet. Run one to see technical issues on your live store.</div></div>}

      {audit && audit.warnings.map((w, i) => <div key={i} style={S.warn}>{w}</div>)}

      {audit && (
        <>
          <div style={S.card}>
            <div style={S.row}>
              <div style={S.stat}><div style={{ ...S.statVal, color: typeof audit.score === "number" ? scoreColor(audit.score) : "#71717a" }}>{typeof audit.score === "number" ? audit.score : "—"}</div><div style={S.statLbl}>Technical score</div></div>
              <div style={S.stat}><div style={S.statVal}>{audit.pages.length}</div><div style={S.statLbl}>Pages checked</div></div>
              <div style={S.stat}><div style={S.statVal}>{audit.totalFindings}</div><div style={S.statLbl}>Issues</div></div>
              <div style={S.stat}><div style={S.statVal}>{audit.sitemap.exists ? audit.sitemap.urlCount : "None"}</div><div style={S.statLbl}>Sitemap URLs</div></div>
            </div>
            <div style={{ ...S.row, marginTop: 14 }}>
              <button style={{ ...S.btnGhost, ...(loading || !audit.totalFindings ? S.btnOff : {}) }} disabled={!!loading || !audit.totalFindings} onClick={makePlan}>
                {loading === "plan" ? "Writing plan…" : "AI action plan"}
              </button>
            </div>
            {plan && <div style={{ ...S.plan, marginTop: 14 }}>{plan}</div>}
          </div>

          <div style={S.card}>
            <h3 style={S.cardTitle}>Site-wide (robots.txt and sitemap)</h3>
            <Findings list={siteFindings} />
          </div>

          {audit.pages.map(p => (
            <div key={p.url} style={S.card}>
              <h3 style={S.cardTitle}>{p.kind} · <span style={{ fontWeight: 400, color: "#a1a1aa", wordBreak: "break-all" }}>{p.url}</span></h3>
              {p.title !== undefined && (
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>
                  HTTP {p.status} · {p.responseMs} ms · {p.htmlSizeKb} KB · structured data: {p.structuredDataTypes.length ? p.structuredDataTypes.join(", ") : "none"}
                </div>
              )}
              <Findings list={p.findings} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}
