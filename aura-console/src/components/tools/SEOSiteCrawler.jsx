import React, { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/seo-site-crawler";

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
  select: { background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 13, padding: "7px 10px" },
  error: { background: "#1c0c0c", border: "1px solid #7f1d1d", color: "#fca5a5", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  ok: { background: "#0c1c12", border: "1px solid #14532d", color: "#86efac", borderRadius: 10, padding: "10px 14px", fontSize: 13, marginBottom: 16 },
  empty: { color: "#71717a", fontSize: 13, padding: "24px 0", textAlign: "center" },
  stat: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 16px", minWidth: 110 },
  statVal: { fontSize: 22, fontWeight: 800 },
  statLbl: { fontSize: 11, color: "#71717a" },
  th: { textAlign: "left", fontSize: 11, color: "#71717a", padding: "8px 10px", borderBottom: "1px solid #27272a" },
  td: { fontSize: 13, padding: "8px 10px", borderBottom: "1px solid #27272a", verticalAlign: "top" },
};

const SEV = { high: "#f87171", medium: "#fbbf24", low: "#a1a1aa" };

function Stat({ label, value, color }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statVal, color: color || "#fafafa" }}>{value}</div>
      <div style={S.statLbl}>{label}</div>
    </div>
  );
}

export default function SEOSiteCrawler() {
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [sev, setSev] = useState("all");
  const [type, setType] = useState("all");
  const [selected, setSelected] = useState({});
  const [fixes, setFixes] = useState([]);
  const [compare, setCompare] = useState(null);

  const loadHistory = useCallback(async () => {
    const r = await apiFetchJSON(API + "/history");
    if (r.ok) setHistory(r.history || []);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function call(name, path, body) {
    setLoading(name);
    setError("");
    setNotice("");
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

  async function crawl() {
    const r = await call("crawl", "/crawl", {});
    if (!r) return;
    setResult(r.result);
    setSelected({});
    setFixes([]);
    setCompare(null);
    if (r.warnings && r.warnings.length) setNotice("Some content could not be read: " + r.warnings.join("; "));
    loadHistory();
  }

  async function openRun(id) {
    const r = await apiFetchJSON(API + "/history/" + id);
    if (!r.ok) return setError(r.error || "Could not load that crawl");
    setResult(r.entry.result);
    setSelected({});
    setFixes([]);
  }

  async function compareWithPrevious() {
    if (history.length < 2) return;
    const r = await apiFetchJSON(`${API}/compare?a=${history[1].id}&b=${history[0].id}`);
    if (!r.ok) return setError(r.error || "Compare failed");
    setCompare(r);
  }

  const issues = useMemo(() => (result ? result.issues : []), [result]);
  const types = useMemo(() => Array.from(new Set(issues.map(i => i.type))).sort(), [issues]);
  const shown = issues.filter(i => (sev === "all" || i.severity === sev) && (type === "all" || i.type === type));
  const selectedUrls = Object.keys(selected).filter(u => selected[u]);

  async function suggest() {
    const r = await call("suggest", "/suggest-fixes", { urls: selectedUrls });
    if (r) setFixes(r.fixes);
  }

  async function apply() {
    const valid = fixes.filter(f => !f.error);
    const r = await call("apply", "/apply-fixes", { fixes: valid });
    if (!r) return;
    setNotice(`Applied ${r.success} fix(es)` + (r.failed ? `, ${r.failed} failed.` : "."));
    setFixes(fixes.filter(f => f.error));
  }

  function exportCsv() {
    const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';
    const rows = [["severity", "type", "page", "detail"], ...shown.map(i => [i.severity, i.type, i.page, i.detail])];
    const blob = new Blob([rows.map(r => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "seo-audit.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div style={S.root}>
      <h1 style={S.title}>SEO Site Crawler</h1>
      <p style={S.subtitle}>Audits your products, pages, collections and blog articles straight from Shopify: titles, meta descriptions, thin content, alt text and duplicates.</p>

      {error && <div style={S.error}>{error}</div>}
      {notice && <div style={S.ok}>{notice}</div>}

      <div style={S.card}>
        <div style={S.row}>
          <button style={{ ...S.btn, ...(loading ? S.btnOff : {}) }} disabled={!!loading} onClick={crawl}>
            {loading === "crawl" ? "Scanning your store…" : "Run audit"}
          </button>
          {history.length >= 2 && (
            <button style={{ ...S.btnGhost, ...(loading ? S.btnOff : {}) }} disabled={!!loading} onClick={compareWithPrevious}>
              Compare latest two runs
            </button>
          )}
          <span style={{ color: "#71717a", fontSize: 12 }}>Reads up to 100 items of each type. 1 credit per audit; AI fixes use credits based on model.</span>
        </div>
        {history.length > 0 && (
          <div style={{ ...S.row, marginTop: 14 }}>
            <span style={{ fontSize: 12, color: "#a1a1aa" }}>Past runs:</span>
            {history.slice(0, 6).map(h => (
              <button key={h.id} style={S.btnGhost} onClick={() => openRun(h.id)}>
                {new Date(h.createdAt).toLocaleDateString()} · score {h.summary.score}
              </button>
            ))}
          </div>
        )}
      </div>

      {compare && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>Latest run vs previous</h3>
          <div style={S.row}>
            <Stat label="Score change" value={(compare.scoreChange > 0 ? "+" : "") + compare.scoreChange} color={compare.scoreChange >= 0 ? "#86efac" : "#f87171"} />
            <Stat label="Issues resolved" value={compare.resolved.length} color="#86efac" />
            <Stat label="New issues" value={compare.introduced.length} color={compare.introduced.length ? "#f87171" : "#fafafa"} />
          </div>
        </div>
      )}

      {!result && !loading && <div style={S.card}><div style={S.empty}>No audit yet. Run an audit to see your store's SEO issues.</div></div>}

      {result && (
        <>
          <div style={S.card}>
            <div style={S.row}>
              <Stat label="SEO score" value={result.score} color={result.score >= 80 ? "#86efac" : result.score >= 50 ? "#fbbf24" : "#f87171"} />
              <Stat label="Pages scanned" value={result.pagesScanned} />
              <Stat label="High" value={result.high} color={SEV.high} />
              <Stat label="Medium" value={result.medium} color={SEV.medium} />
              <Stat label="Low" value={result.low} color={SEV.low} />
            </div>
          </div>

          <div style={S.card}>
            <div style={{ ...S.row, marginBottom: 12 }}>
              <select style={S.select} value={sev} onChange={e => setSev(e.target.value)} aria-label="Severity">
                <option value="all">All severities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select style={S.select} value={type} onChange={e => setType(e.target.value)} aria-label="Issue type">
                <option value="all">All issue types</option>
                {types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button style={S.btnGhost} onClick={exportCsv} disabled={!shown.length}>Export CSV</button>
              <button style={{ ...S.btnGhost, ...(!selectedUrls.length || loading ? S.btnOff : {}) }} disabled={!selectedUrls.length || !!loading} onClick={suggest}>
                {loading === "suggest" ? "Writing…" : `AI-fix selected products (${selectedUrls.length})`}
              </button>
            </div>

            {shown.length === 0 ? (
              <div style={S.empty}>{issues.length ? "No issues match these filters." : "No issues found. Your store looks great."}</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={S.th}></th><th style={S.th}>Severity</th><th style={S.th}>Issue</th><th style={S.th}>Page</th></tr></thead>
                <tbody>
                  {shown.slice(0, 300).map((i, n) => (
                    <tr key={n}>
                      <td style={S.td}>
                        {i.page.includes("/products/") && (
                          <input type="checkbox" aria-label={"Select " + i.page} checked={!!selected[i.page]} onChange={e => setSelected({ ...selected, [i.page]: e.target.checked })} />
                        )}
                      </td>
                      <td style={{ ...S.td, color: SEV[i.severity], fontWeight: 700 }}>{i.severity}</td>
                      <td style={S.td}><div style={{ fontWeight: 600 }}>{i.type}</div><div style={{ color: "#71717a", fontSize: 12 }}>{i.detail}</div></td>
                      <td style={{ ...S.td, wordBreak: "break-all", fontSize: 12 }}>{i.page.replace(/^https:\/\/[^/]+/, "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {shown.length > 300 && <div style={{ ...S.empty, padding: 12 }}>Showing the first 300 of {shown.length}. Export CSV for the full list.</div>}
          </div>
        </>
      )}

      {fixes.length > 0 && (
        <div style={S.card}>
          <h3 style={S.cardTitle}>Review AI suggestions (nothing is saved until you apply)</h3>
          {fixes.map(f => (
            <div key={f.productId} style={{ borderBottom: "1px solid #27272a", padding: "10px 0" }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{f.productName}</div>
              {f.error ? <div style={{ color: "#fca5a5", fontSize: 12 }}>{f.error}</div> : (
                <>
                  <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>Title ({f.seoTitle.length}): {f.seoTitle}</div>
                  <div style={{ fontSize: 12, color: "#a1a1aa" }}>Description ({f.metaDescription.length}): {f.metaDescription}</div>
                </>
              )}
            </div>
          ))}
          <div style={{ ...S.row, marginTop: 14 }}>
            <button style={{ ...S.btn, ...(loading ? S.btnOff : {}) }} disabled={!!loading} onClick={apply}>
              {loading === "apply" ? "Applying…" : "Apply to Shopify"}
            </button>
            <button style={S.btnGhost} onClick={() => setFixes([])}>Discard</button>
          </div>
        </div>
      )}
    </div>
  );
}
