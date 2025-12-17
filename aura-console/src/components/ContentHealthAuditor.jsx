// aura-console/src/components/ContentHealthAuditor.jsx
import React, { useEffect, useMemo, useState } from "react";

function ContentHealthAuditor({ coreUrl, projectId }) {
  const [type, setType] = useState("");
  const [maxScore, setMaxScore] = useState(70);
  const [limit, setLimit] = useState(100);

  const [loading, setLoading] = useState(false);
  const [refreshingUrl, setRefreshingUrl] = useState(null);
  const [error, setError] = useState(null);

  const [items, setItems] = useState([]);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);

    try {
      const qs = new URLSearchParams();
      if (type) qs.set("type", type);
      qs.set("maxScore", String(maxScore));
      qs.set("limit", String(limit));

      const res = await fetch(
        `${coreUrl}/projects/${projectId}/content/health?${qs.toString()}`
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Failed (${res.status})`);
      }
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (e) {
      setError(e.message || "Failed to load content health");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const summary = useMemo(() => {
    const missingTitle = items.filter(
      (r) => !((r.effectiveTitle || "").trim().length)
    ).length;
    const missingMeta = items.filter(
      (r) => !((r.effectiveMetaDescription || "").trim().length)
    ).length;
    return { missingTitle, missingMeta };
  }, [items]);

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch (e) {
      console.error("Clipboard copy failed", e);
    }
  };

  const openUrl = (url) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const refreshMeta = async (url) => {
    if (!url) return;
    setRefreshingUrl(url);
    setError(null);

    try {
      const res = await fetch(
        `${coreUrl}/projects/${projectId}/content/refresh`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Refresh failed (${res.status})`);
      }

      // Reload list so scores + fields update immediately
      await load();
    } catch (e) {
      setError(e.message || "Failed to refresh URL meta");
    } finally {
      setRefreshingUrl(null);
    }
  };

  const statusLabel = loading
    ? "Loading…"
    : `Loaded ${items.length} item(s) • missing title: ${summary.missingTitle} • missing meta: ${summary.missingMeta}`;

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "240px 1fr 1fr 1fr",
          gap: 12,
          alignItems: "end",
          marginBottom: 12,
        }}
      >
        <div>
          <div className="filters-label">Type</div>
          <select
            className="core-api-input"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All types</option>
            <option value="page">page</option>
            <option value="blog">blog</option>
            <option value="product">product</option>
            <option value="landing">landing</option>
            <option value="category">category</option>
            <option value="docs">docs</option>
            <option value="other">other</option>
          </select>
        </div>

        <div>
          <div className="filters-label">Max score (show items at or below)</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              className="core-api-input"
              type="number"
              min={0}
              max={100}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              style={{ width: 90 }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              style={{ width: "100%" }}
            />
            <div style={{ width: 40, textAlign: "right", fontSize: 12 }}>
              {maxScore}
            </div>
          </div>
        </div>

        <div>
          <div className="filters-label">Limit</div>
          <input
            className="core-api-input"
            type="number"
            min={1}
            max={500}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <div
            className="core-status-chip core-status-chip--ok"
            style={{ whiteSpace: "nowrap" }}
          >
            <span className="core-status-indicator" />
            <span className="core-status-text">{statusLabel}</span>
          </div>
          <button
            className="button button--primary"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: 12 }}>
          <span className="error-dot" />
          {error}
        </div>
      )}

      <div className="field-help" style={{ marginBottom: 8 }}>
        Beginner workflow: open the URL, fix the title/meta in your platform,
        then click Refresh. If your site is JS-rendered (Framer), the “Refresh
        meta” button may not see tags in raw HTML — in that case ingest with
        <code> url|title|meta </code> so we store manual overrides.
      </div>

      <div className="run-history-table-wrapper">
        <table className="run-history-table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Score</th>
              <th style={{ width: 120 }}>Type</th>
              <th>URL</th>
              <th>Title</th>
              <th>Meta description</th>
              <th style={{ width: 360 }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  {loading
                    ? "Loading…"
                    : "No items returned. Either your site is healthy at this threshold, or you need to ingest content first."}
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const title =
                  row.effectiveTitle ||
                  row.manualTitle ||
                  row.title ||
                  "Missing title";
                const meta =
                  row.effectiveMetaDescription ||
                  row.manualMetaDescription ||
                  row.metaDescription ||
                  "Missing meta description";

                return (
                  <tr key={row.id}>
                    <td>
                      <span
                        className="system-health-chip"
                        style={{
                          display: "inline-flex",
                          gap: 8,
                          alignItems: "center",
                        }}
                        title={(row.issues || []).join(", ")}
                      >
                        <span className="system-health-dot" />
                        <span style={{ fontWeight: 700 }}>
                          {row.score}/100
                        </span>
                      </span>
                    </td>

                    <td>{row.type || "other"}</td>

                    <td>
                      <a href={row.url} target="_blank" rel="noreferrer">
                        {row.url}
                      </a>
                    </td>

                    <td style={{ maxWidth: 360 }}>
                      {title || "Missing title"}
                    </td>

                    <td style={{ maxWidth: 420 }}>
                      {meta || "Missing meta description"}
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button
                          className="button button--ghost button--tiny"
                          onClick={() => openUrl(row.url)}
                        >
                          Open
                        </button>

                        <button
                          className="button button--ghost button--tiny"
                          onClick={() => copy(row.url)}
                        >
                          Copy URL
                        </button>

                        <button
                          className="button button--ghost button--tiny"
                          onClick={() => copy(title)}
                          disabled={!title || title === "Missing title"}
                        >
                          Copy title
                        </button>

                        <button
                          className="button button--ghost button--tiny"
                          onClick={() => copy(meta)}
                          disabled={!meta || meta === "Missing meta description"}
                        >
                          Copy meta
                        </button>

                        <button
                          className="button button--primary button--tiny"
                          onClick={() => refreshMeta(row.url)}
                          disabled={refreshingUrl === row.url}
                          title="Fetch <title>, meta description, and H1 from the live URL and update this row"
                        >
                          {refreshingUrl === row.url
                            ? "Refreshing…"
                            : "Refresh meta"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-header">
          <h3 className="card-title" style={{ fontSize: 14 }}>
            What to fix first
          </h3>
          <p className="card-subtitle">
            Focus on the fastest wins. When these are cleaned up, your overall
            crawl quality improves quickly.
          </p>
        </div>

        <ol style={{ paddingLeft: 18, fontSize: 12, margin: 0 }}>
          <li style={{ marginBottom: 6 }}>
            <strong>Missing titles / metas</strong> — fill these first. They are
            the easiest “score jumps”.
          </li>
          <li style={{ marginBottom: 6 }}>
            <strong>Low scores</strong> — work bottom-up (worst to best).
            Re-check after each batch.
          </li>
          <li>
            <strong>Keep it beginner simple</strong> — aim for clear page names
            and benefits; avoid keyword stuffing.
          </li>
        </ol>
      </div>
    </div>
  );
}

export default ContentHealthAuditor;
