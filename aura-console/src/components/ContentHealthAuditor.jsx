// aura-console/src/components/ContentHealthAuditor.jsx
import React, { useEffect, useMemo, useState } from "react";

function safeText(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

function clampNumber(n, min, max, fallback) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  return Math.max(min, Math.min(max, x));
}

function buildQuery(params) {
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    const s = String(v).trim();
    if (!s) return;
    qp.set(k, s);
  });
  const qs = qp.toString();
  return qs ? `?${qs}` : "";
}

function scoreTone(score) {
  if (score === null || score === undefined) return "neutral";
  const n = Number(score);
  if (!Number.isFinite(n)) return "neutral";
  if (n <= 40) return "bad";
  if (n <= 70) return "warn";
  return "good";
}

function ScoreChip({ score }) {
  const tone = scoreTone(score);
  const label =
    score === null || score === undefined || score === ""
      ? "—"
      : `${Number(score)}`;

  const base = {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    border: "1px solid rgba(148,163,184,0.25)",
    background: "rgba(15,23,42,0.55)",
    color: "rgba(226,232,240,0.95)",
    whiteSpace: "nowrap",
  };

  const dot = {
    width: 8,
    height: 8,
    borderRadius: 999,
    background:
      tone === "good"
        ? "rgba(34,197,94,0.95)"
        : tone === "warn"
        ? "rgba(245,158,11,0.95)"
        : tone === "bad"
        ? "rgba(239,68,68,0.95)"
        : "rgba(148,163,184,0.95)",
    boxShadow: "0 0 0 4px rgba(148,163,184,0.08)",
  };

  return (
    <span style={base} title="SEO health score returned by Core API">
      <span style={dot} />
      {label}/100
    </span>
  );
}

export default function ContentHealthAuditor({ coreUrl, projectId }) {
  const [type, setType] = useState("all"); // all | product | blog | landing | category | docs | other
  const [maxScore, setMaxScore] = useState(70);
  const [limit, setLimit] = useState(100);

  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const effectiveType = type === "all" ? "" : type;

  const endpoint = useMemo(() => {
    const qs = buildQuery({
      type: effectiveType,
      maxScore,
      limit,
    });
    return `${coreUrl}/projects/${projectId}/content/health${qs}`;
  }, [coreUrl, projectId, effectiveType, maxScore, limit]);

  useEffect(() => {
    if (!coreUrl || !projectId) return;

    let cancelled = false;
    const controller = new AbortController();

    const fetchHealth = async () => {
      setStatus("loading");
      setError("");

      try {
        const res = await fetch(endpoint, { signal: controller.signal });
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(
            `Core API error (${res.status}): ${text || res.statusText}`
          );
        }

        const data = await res.json();
        if (!data?.ok) throw new Error(data?.error || "Core API returned ok=false");

        const list = Array.isArray(data.items) ? data.items : [];
        if (!cancelled) {
          setItems(list);
          setStatus("ok");
        }
      } catch (e) {
        if (cancelled) return;
        if (e?.name === "AbortError") return;
        setStatus("error");
        setError(e?.message || "Failed to load content health");
        setItems([]);
      }
    };

    // Small debounce so typing doesn't spam requests
    const t = setTimeout(fetchHealth, 250);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(t);
    };
  }, [endpoint, coreUrl, projectId]);

  const copy = async (value) => {
    const text = safeText(value);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  const normalised = items.map((it) => {
    const url =
      it.url ||
      it.pageUrl ||
      it.href ||
      it.link ||
      it.canonical ||
      it.path ||
      "";

    const title = it.title || it.h1 || it.pageTitle || "";
    const meta = it.metaDescription || it.description || it.meta || "";
    const s = it.score ?? it.seoScore ?? it.healthScore ?? null;
    const t = it.type || it.contentType || it.kind || "other";

    return {
      raw: it,
      type: safeText(t) || "other",
      url: safeText(url),
      title: safeText(title),
      meta: safeText(meta),
      score: s === null || s === undefined || s === "" ? null : Number(s),
    };
  });

  const summary = useMemo(() => {
    const total = normalised.length;
    const missingTitle = normalised.filter((x) => !x.title.trim()).length;
    const missingMeta = normalised.filter((x) => !x.meta.trim()).length;

    return { total, missingTitle, missingMeta };
  }, [normalised]);

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ minWidth: 180 }}>
          <div className="filters-label">Type</div>
          <select
            className="core-api-input"
            value={type}
            onChange={(e) => setType(e.target.value)}
            style={{ height: 36 }}
          >
            <option value="all">All types</option>
            <option value="product">Products</option>
            <option value="blog">Blog posts</option>
            <option value="landing">Landing pages</option>
            <option value="category">Collections / categories</option>
            <option value="docs">Docs</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ minWidth: 220 }}>
          <div className="filters-label">Max score (show items at or below)</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              className="core-api-input"
              value={maxScore}
              onChange={(e) => setMaxScore(clampNumber(e.target.value, 0, 100, 70))}
              style={{ height: 36, width: 90 }}
              inputMode="numeric"
            />
            <input
              type="range"
              min={0}
              max={100}
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: 12, opacity: 0.85, minWidth: 34 }}>
              {maxScore}
            </span>
          </div>
        </div>

        <div style={{ minWidth: 140 }}>
          <div className="filters-label">Limit</div>
          <input
            className="core-api-input"
            value={limit}
            onChange={(e) => setLimit(clampNumber(e.target.value, 1, 500, 100))}
            style={{ height: 36 }}
            inputMode="numeric"
          />
        </div>

        <div style={{ flex: 1, minWidth: 260 }}>
          <div className="filters-label">Status</div>
          <div
            className={[
              "core-status-chip",
              status === "loading"
                ? "core-status-chip--loading"
                : status === "ok"
                ? "core-status-chip--ok"
                : status === "error"
                ? "core-status-chip--error"
                : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="core-status-indicator" />
            <span className="core-status-text">
              {status === "loading"
                ? "Loading content health…"
                : status === "ok"
                ? `Loaded ${summary.total} item(s) • missing title: ${summary.missingTitle} • missing meta: ${summary.missingMeta}`
                : status === "error"
                ? error || "Failed to load"
                : "Not loaded yet"}
            </span>
          </div>
        </div>
      </div>

      <div className="run-history-table-wrapper" style={{ marginTop: 10 }}>
        <div className="run-history-table-header">
          <span className="run-history-table-title">Content health results</span>
          <span className="run-history-table-subtitle">
            Beginner workflow: open the URL, fix the title/meta, re-run your platform’s publish, then refresh this table.
          </span>
        </div>

        <table className="run-history-table">
          <thead>
            <tr>
              <th>Score</th>
              <th>Type</th>
              <th>URL</th>
              <th>Title</th>
              <th>Meta description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {normalised.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  {status === "loading"
                    ? "Loading…"
                    : "No items returned. Either your site is healthy at this threshold, or you need to ingest content first."}
                </td>
              </tr>
            ) : (
              normalised.map((row, idx) => (
                <tr key={`${row.url}-${idx}`}>
                  <td>
                    <ScoreChip score={row.score} />
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{row.type}</td>
                  <td style={{ maxWidth: 320 }}>
                    {row.url ? (
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "inherit" }}
                        title={row.url}
                      >
                        {row.url}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td style={{ maxWidth: 280 }}>
                    {row.title ? row.title : <span style={{ opacity: 0.7 }}>Missing title</span>}
                  </td>
                  <td style={{ maxWidth: 360 }}>
                    {row.meta ? row.meta : <span style={{ opacity: 0.7 }}>Missing meta description</span>}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button
                      className="button button--ghost button--tiny"
                      onClick={() => row.url && window.open(row.url, "_blank")}
                      disabled={!row.url}
                      type="button"
                    >
                      Open
                    </button>{" "}
                    <button
                      className="button button--ghost button--tiny"
                      onClick={() => copy(row.url)}
                      disabled={!row.url}
                      type="button"
                    >
                      Copy URL
                    </button>{" "}
                    <button
                      className="button button--ghost button--tiny"
                      onClick={() => copy(row.title)}
                      disabled={!row.title}
                      type="button"
                    >
                      Copy title
                    </button>{" "}
                    <button
                      className="button button--ghost button--tiny"
                      onClick={() => copy(row.meta)}
                      disabled={!row.meta}
                      type="button"
                    >
                      Copy meta
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="card" style={{ marginTop: 10 }}>
        <div className="card-header">
          <h2 className="card-title">What to fix first</h2>
          <p className="card-subtitle">
            Focus on the fastest wins. When these are cleaned up, your overall crawl quality improves quickly.
          </p>
        </div>

        <ol style={{ paddingLeft: 18, fontSize: 12, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>
            <strong>Missing titles / metas</strong> — fill these first. They are the easiest “score jumps”.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Low scores</strong> — work bottom-up (worst to best). Re-check after each batch.
          </li>
          <li>
            <strong>Keep it beginner simple</strong> — aim for clear product/page names and benefits; no keyword stuffing.
          </li>
        </ol>
      </div>
    </div>
  );
}
