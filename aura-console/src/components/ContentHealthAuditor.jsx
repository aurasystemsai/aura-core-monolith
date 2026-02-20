// TODO: Refactor this component to match the new ProductsList.jsx standards:
// - Show actionable tips for each issue
// - Highlight missing primary keyword in title/meta
// - Show current/target values for each field
// - Add Google-style SEO preview snippet (with device toggle)
// - Suggest keywords if missing
// - Enable export of full SEO audit
// - Track SEO improvements over time
// - Add accessibility checks (alt text, etc)
// - Use modern, professional UI layout
//
// Repeat for all other tool components in this directory.
import React, { useEffect, useMemo, useState } from "react";
import "./ContentHealthAuditor.css";

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function normaliseCoreUrl(coreUrl) {
  return String(coreUrl || "").replace(/\/+$/, "");
}

function buildQuery(params) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

function scoreTone(score) {
  if (score <= 40) return "score-badge score-badge--bad";
  if (score <= 70) return "score-badge score-badge--warn";
  return "score-badge score-badge--good";
}

function truncate(str, max = 90) {
  const s = String(str || "");
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function issuesPretty(issues) {
  const list = Array.isArray(issues) ? issues : [];
  if (!list.length) return [];
  return list.map((i) =>
    String(i)
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase())
  );
}

function safeCopy(value) {
  const v = String(value || "");
  if (!v.trim()) return;
  navigator.clipboard.writeText(v).catch(() => {});
}

function toCsv(rows) {
  const header = [
    "score",
    "type",
    "url",
    "title",
    "metaDescription",
    "h1",
    "issues",
    "updatedAt",
  ];
  const esc = (v) => {
    const s = String(v ?? "");
    const needs = /[,"\n]/.test(s);
    const out = s.replace(/"/g, '""');
    return needs ? `"${out}"` : out;
  };
  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push(
      [
        r.score,
        r.type,
        r.url,
        r.title,
        r.metaDescription,
        r.h1,
        (Array.isArray(r.issues) ? r.issues.join("|") : "") || "",
        r.updatedAt,
      ]
        .map(esc)
        .join(",")
    );
  }
  return lines.join("\n");
}

function download(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ContentHealthAuditor({ coreUrl, projectId }) {
  // Filters (beginner-friendly)
  const [type, setType] = useState(""); // "" = all
  const [maxScore, setMaxScore] = useState(70);
  const [limit, setLimit] = useState(100);

  // UI state
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const normalizedCoreUrl = useMemo(() => normaliseCoreUrl(coreUrl), [coreUrl]);

  const endpoint = useMemo(() => {
    const query = buildQuery({
      type: type || undefined,
      maxScore: clampNumber(maxScore, 0, 100, 70),
      limit: clampNumber(limit, 1, 500, 100),
    });
    return `${normalizedCoreUrl}/projects/${projectId}/content/health${query}`;
  }, [normalizedCoreUrl, projectId, type, maxScore, limit]);

  const fetchHealth = async () => {
    if (!normalizedCoreUrl || !projectId) return;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch(endpoint);
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`Core API error (${res.status}): ${t || res.statusText}`);
      }

      const data = await res.json();
      const rows = Array.isArray(data?.items) ? data.items : [];
      setItems(rows);
      setStatus("ok");
    } catch (e) {
      setStatus("error");
      setError(e?.message || "Failed to load content health");
      setItems([]);
    }
  };

  useEffect(() => {
    fetchHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const counts = useMemo(() => {
    const total = items.length;
    const worst = total ? items[0]?.score : null; // endpoint already sorts worst-first
    return { total, worst };
  }, [items]);

  const csvName = useMemo(() => {
    const t = type ? type : "all";
    return `aura-content-health-${projectId}-${t}-max${clampNumber(
      maxScore,
      0,
      100,
      70
    )}.csv`;
  }, [projectId, type, maxScore]);

  // Debug panel for aggressive troubleshooting
  function DebugPanel() {
    return (
      <div className="cha-debug-panel">
        <b>DEBUG PANEL</b><br/>
        <div>coreUrl: <span className="cha-debug-accent">{String(coreUrl)}</span></div>
        <div>projectId: <span className="cha-debug-accent">{String(projectId)}</span></div>
        <div>endpoint: <span className="cha-debug-accent">{endpoint}</span></div>
        <div>status: <span className="cha-debug-accent">{status}</span></div>
        <div>error: <span className="cha-debug-error">{error}</span></div>
        <div>items: <span className="cha-debug-accent">{items.length}</span></div>
        <div>type: <span className="cha-debug-accent">{type}</span></div>
        <div>maxScore: <span className="cha-debug-accent">{maxScore}</span></div>
        <div>limit: <span className="cha-debug-accent">{limit}</span></div>
        <div>Timestamp: {new Date().toISOString()}</div>
      </div>
    );
  }

  return (
    <div className="cha-root">
      <h1 className="cha-title" title="Check and improve your store's SEO and content quality">Content Health Auditor
        <span style={{
          display: 'inline-block',
          marginLeft: 8,
          fontSize: 18,
          color: '#4f46e5',
          cursor: 'help',
        }}
        title="This panel checks your products, blogs, and pages for SEO and content issues. Use the filters and tips to improve your store's health.">
          
        </span>
      </h1>
      <div className="cha-toolbar">
        <div className="cha-filters">
          <div className="cha-filter">
            <div className="cha-label" title="Choose which type of content to audit (products, blogs, etc)">Type
              <span style={{color:'#4f46e5',marginLeft:4,cursor:'help'}} title="Select a content type to focus your audit. 'All' checks everything.">?</span>
            </div>
            <select className="cha-select" value={type} onChange={e => setType(e.target.value)} title="Filter by content type (product, blog, etc)">
              <option value="">All</option>
              <option value="product">Product</option>
              <option value="blog">Blog</option>
              <option value="landing">Landing</option>
              <option value="category">Category</option>
              <option value="docs">Docs</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="cha-filter">
            <div className="cha-label" title="Show only items with a score at or below this value">Max score
              <span style={{color:'#4f46e5',marginLeft:4,cursor:'help'}} title="Lower scores mean more issues. Set a max to focus on the worst content.">?</span>
            </div>
            <input className="cha-input" type="number" min={0} max={100} value={maxScore} onChange={e => setMaxScore(e.target.value)} title="Show only content with a score at or below this value (lower = more issues)" />
            <div className="cha-help">Shows items at or below this score. Lower scores = more issues.</div>
          </div>
          <div className="cha-filter">
            <div className="cha-label" title="How many results to show at once">Limit
              <span style={{color:'#4f46e5',marginLeft:4,cursor:'help'}} title="Set the maximum number of results to display. Useful for large stores.">?</span>
            </div>
            <input className="cha-input" type="number" min={1} max={500} value={limit} onChange={e => setLimit(e.target.value)} title="Maximum number of results to show" />
            <div className="cha-help">Max rows returned from Core. Increase for bigger audits.</div>
          </div>
        </div>
        <div className="cha-actions">
          <button className="button button--ghost" type="button" onClick={fetchHealth} disabled={status === "loading"} title="Refresh the audit results with the latest data from your store.">
            {status === "loading" ? "Refreshing…" : "Refresh"}
          </button>
          <button className="button button--ghost" type="button" onClick={() => download(csvName, toCsv(items))} disabled={!items.length} title="Export your audit results as a CSV file for further analysis or sharing.">
            Export CSV
          </button>
          <a className="button button--ghost" href={endpoint} target="_blank" rel="noreferrer" title="Open the Core API JSON for this view (for advanced users)">
            Open JSON
          </a>
        </div>
      </div>
      <div className="cha-summary">
        <div className="cha-summary-item">
          <div className="cha-summary-label" title="How many content items matched your filters">Rows</div>
          <div className="cha-summary-value">{counts.total}</div>
        </div>
        <div className="cha-summary-item">
          <div className="cha-summary-label" title="The lowest (worst) score in your results. Lower = more issues.">Worst score</div>
          <div className="cha-summary-value">{counts.worst ?? "—"}</div>
        </div>
        <div className="cha-summary-item cha-summary-item--grow">
          <div className="cha-summary-label" title="Quick advice for using this panel">Tip</div>
          <div className="cha-summary-value cha-summary-tip" title="Start with the worst content and fix the biggest issues first. Refresh to see your progress.">
            Work top-to-bottom. Fix title/meta/H1, then refresh and watch rows disappear.
          </div>
        </div>
      </div>
      {status === "error" && (
        <div className="cha-error">
          <div className="cha-error-title">Could not load Content Health</div>
          <div className="cha-error-body">{error}</div>
          <DebugPanel />
        </div>
      )}
      {status === "loading" && !items.length && (
        <div className="cha-loading">Loading content health from Core…<DebugPanel /></div>
      )}
      {!status.startsWith("error") && !status.startsWith("loading") && !items.length && (
        <div className="cha-empty">No items found for these filters. Either everything is healthy, or you have not ingested content yet.<DebugPanel /></div>
      )}
      {items.length > 0 && (
        <div className="cha-table-wrap">
          <table className="cha-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Score</th>
                <th style={{ width: 110 }}>Type</th>
                <th>URL</th>
                <th>Title</th>
                <th>Meta description</th>
                <th style={{ width: 220 }}>Issues</th>
                <th style={{ width: 150 }}>Updated</th>
                <th style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => {
                const prettyIssues = issuesPretty(row.issues);
                const canQueue = Array.isArray(row.issues) && row.issues.length;
                return (
                  <tr key={`${row.id}-${row.url}`}>
                    <td>
                      <span className={scoreTone(row.score)}>{row.score ?? "—"}</span>
                      <div className="cha-sub">T{row.titleLength ?? "—"} · M{row.metaLength ?? "—"}</div>
                    </td>
                    <td>
                      <span className="cha-type">{row.type || "other"}</span>
                      <div className="cha-sub">{row.platform || "—"}</div>
                    </td>
                    <td className="cha-url">
                      <a href={row.url} target="_blank" rel="noreferrer">{truncate(row.url, 70)}</a>
                      <div className="cha-sub">{row.externalId || "—"}</div>
                    </td>
                    <td title={row.title || ""}>{truncate(row.title || "—", 80)}</td>
                    <td title={row.metaDescription || ""}>{truncate(row.metaDescription || "—", 95)}</td>
                    <td>
                      {prettyIssues.length ? (
                        <div className="cha-issues">
                          {prettyIssues.map((i) => (
                            <span key={i} className="cha-issue-pill">{i}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="cha-muted">—</span>
                      )}
                      {/* Actionable SEO tips placeholder */}
                      <div className="cha-seo-tips">
                        <b title="Actionable advice for fixing this content">SEO Tips:</b>
                        <ul className="cha-tips-list" title="Each issue below has a tip to help you fix it">
                          {prettyIssues.length ? prettyIssues.map((issue, i) => (
                            <li key={i} className="cha-tip--warn">{issue} <span className="cha-tip-detail">(Actionable tip placeholder)</span></li>
                          )) : <li className="cha-tip--good">No major issues detected.</li>}
                        </ul>
                        {/* Google-style preview placeholder */}
                        <div className="cha-preview-placeholder" title="Preview how your content might look in Google search results">[Google-style SEO preview coming soon]</div>
                      </div>
                    </td>
                    <td>
                      <div className="cha-date">{row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "—"}</div>
                    </td>
                    <td>
                      <div className="cha-action-row">
                        <button className="button button--ghost button--tiny" type="button" onClick={() => safeCopy(row.url)} title="Copy this item's URL to your clipboard.">Copy URL</button>
                        <button className="button button--ghost button--tiny" type="button" onClick={() => safeCopy(row.title)} title="Copy this item's title to your clipboard." disabled={!row.title}>Copy title</button>
                        <button className="button button--ghost button--tiny" type="button" onClick={() => safeCopy(row.metaDescription)} title="Copy this item's meta description to your clipboard." disabled={!row.metaDescription}>Copy meta</button>
                        <button className="button button--ghost button--tiny" type="button" onClick={async () => {
                          try {
                            const res = await fetch(`${normalizedCoreUrl}/projects/${projectId}/fix-queue`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ url: row.url, issues: row.issues || [] }),
                            });
                            if (!res.ok) {
                              const t = await res.text().catch(() => "");
                              throw new Error(`Fix Queue error (${res.status}): ${t || res.statusText}`);
                            }
                            alert("Added to Fix Queue");
                          } catch (e) {
                            alert(e?.message || "Failed to add to Fix Queue");
                          }
                        }} disabled={!canQueue} title={canQueue ? "Add this item and its issues to your Fix Queue for later fixing." : "Nothing to queue (no issues on this row)"}>Add to Fix Queue</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="cha-footer">
        <div className="cha-footer-left">Endpoint: <span className="cha-mono">{endpoint}</span></div>
        <div className="cha-footer-right"><span className="cha-muted">Scoring is currently length-based (title/meta) + H1 present. We can upgrade this later to real SEO heuristics.</span></div>
      </div>
      <DebugPanel />
    </div>
  );
}
