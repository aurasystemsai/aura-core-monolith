// aura-console/src/components/DraftLibrary.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Draft Library UI (project-scoped)
 *
 * Matches Core drafts schema:
 *  - list: id, projectId, toolId, createdAt, title, slug, metaDescription, primaryKeyword
 *  - detail: + inputJson/outputJson parsed as input/output, articleText, articleHtml
 *
 * Expected API routes:
 *  GET /projects/:projectId/drafts?limit=50&offset=0
 *  GET /projects/:projectId/drafts/:draftId
 *
 * Props:
 *  - coreUrl (string)    e.g. https://aura-core-monolith.onrender.com
 *  - projectId (string)  current project id
 */

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function pickId(d) {
  return d?.id ?? d?._id ?? d?.draftId ?? d?.key ?? null;
}

function pickTitle(d) {
  return d?.title || d?.name || d?.slug || "Untitled draft";
}

function pickCreatedAt(d) {
  return d?.createdAt || d?.created_at || null;
}

function formatDate(iso) {
  if (!iso) return "—";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return String(iso);
  return dt.toLocaleString();
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function ensureHtmlDoc(html, title = "Draft") {
  const trimmed = String(html || "").trim();
  if (!trimmed) {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body>
</body>
</html>`;
  }

  const hasHtmlTag = /<html[\s>]/i.test(trimmed);
  const hasDoctype = /<!doctype html>/i.test(trimmed);

  if (hasHtmlTag) return hasDoctype ? trimmed : `<!doctype html>\n${trimmed}`;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body>
${trimmed}
</body>
</html>`;
}

function downloadFile(filename, content, mime = "text/plain;charset=utf-8") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function DraftLibrary({ coreUrl, projectId }) {
  const base = String(coreUrl || "").replace(/\/$/, "");
  const pid = String(projectId || "").trim();

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [error, setError] = useState("");

  const [drafts, setDrafts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);

  const [query, setQuery] = useState("");
  const [format, setFormat] = useState("plain"); // "plain" | "html"
  const [copied, setCopied] = useState(false);

  // Basic pagination (optional but useful)
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);

  function apiUrl(path) {
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  }

  async function fetchDrafts({ reset = false } = {}) {
    if (!base || !pid) return;

    setError("");
    setLoadingList(true);

    try {
      const useOffset = reset ? 0 : offset;
      const res = await fetch(
        apiUrl(
          `/projects/${encodeURIComponent(pid)}/drafts?limit=${encodeURIComponent(
            limit
          )}&offset=${encodeURIComponent(useOffset)}`
        ),
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const text = await res.text();
      const payload = safeJsonParse(text) ?? text;

      if (!res.ok) {
        throw new Error(
          (payload && payload.error) ||
            `Failed to load drafts (HTTP ${res.status})`
        );
      }

      const list = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.drafts)
        ? payload.drafts
        : Array.isArray(payload?.items)
        ? payload.items
        : [];

      if (reset) {
        setDrafts(list);
        setOffset(0);
        if (!selectedId && list.length > 0) {
          setSelectedId(pickId(list[0]));
        }
      } else {
        // Append (if API supports offset paging)
        const merged = [...drafts, ...list];
        setDrafts(merged);
      }
    } catch (e) {
      setError(e?.message || "Failed to load drafts");
    } finally {
      setLoadingList(false);
    }
  }

  async function fetchDraftById(draftId) {
    if (!base || !pid || !draftId) return;

    setError("");
    setLoadingDraft(true);
    setSelectedDraft(null);

    try {
      const res = await fetch(
        apiUrl(
          `/projects/${encodeURIComponent(pid)}/drafts/${encodeURIComponent(
            draftId
          )}`
        ),
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const text = await res.text();
      const payload = safeJsonParse(text) ?? text;

      if (!res.ok) {
        throw new Error(
          (payload && payload.error) ||
            `Failed to load draft (HTTP ${res.status})`
        );
      }

      const draft =
        payload?.draft || (payload?.ok && payload?.draft) ? payload.draft : payload;

      setSelectedDraft(draft || null);
    } catch (e) {
      setError(e?.message || "Failed to load draft");
    } finally {
      setLoadingDraft(false);
    }
  }

  // Refresh whenever coreUrl/projectId changes
  useEffect(() => {
    setDrafts([]);
    setSelectedId(null);
    setSelectedDraft(null);
    setOffset(0);

    if (base && pid) {
      fetchDrafts({ reset: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [base, pid]);

  useEffect(() => {
    if (selectedId) fetchDraftById(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, base, pid]);

  const filteredDrafts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return drafts;

    return drafts.filter((d) => {
      const title = pickTitle(d).toLowerCase();
      const id = String(pickId(d) || "").toLowerCase();
      const keyword = String(d?.primaryKeyword || "").toLowerCase();
      const slug = String(d?.slug || "").toLowerCase();
      return (
        title.includes(q) ||
        id.includes(q) ||
        keyword.includes(q) ||
        slug.includes(q)
      );
    });
  }, [drafts, query]);

  const exportTitle = pickTitle(selectedDraft || {}) || "Draft";

  const plainOutput = useMemo(() => {
    if (!selectedDraft) return "";
    // Core schema uses articleText
    const body =
      selectedDraft?.articleText ??
      selectedDraft?.article_text ??
      selectedDraft?.text ??
      selectedDraft?.plainText ??
      "";
    return String(body || "");
  }, [selectedDraft]);

  const htmlOutput = useMemo(() => {
    if (!selectedDraft) return "";
    // Core schema uses articleHtml
    const html =
      selectedDraft?.articleHtml ??
      selectedDraft?.article_html ??
      selectedDraft?.html ??
      "";

    if (html && String(html).trim()) {
      return ensureHtmlDoc(html, exportTitle);
    }

    const escaped = escapeHtml(plainOutput);
    return ensureHtmlDoc(`<pre>${escaped}</pre>`, exportTitle);
  }, [selectedDraft, plainOutput, exportTitle]);

  const outputText = format === "html" ? htmlOutput : plainOutput;

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = outputText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  }

  function downloadCurrent() {
    const safeName =
      exportTitle
        .replace(/[^\w\- ]+/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 80) || "draft";

    if (format === "html") {
      downloadFile(`${safeName}.html`, htmlOutput, "text/html;charset=utf-8");
    } else {
      downloadFile(`${safeName}.txt`, plainOutput, "text/plain;charset=utf-8");
    }
  }

  const canUse = Boolean(base && pid);

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <div style={styles.h1}>Draft Library</div>
          <div style={styles.sub}>
            Project drafts stored in Core SQLite. Export as Plain text or HTML.
          </div>
        </div>

        <div style={styles.headerRight}>
          <button
            type="button"
            onClick={() => fetchDrafts({ reset: true })}
            style={styles.btn}
            disabled={!canUse || loadingList}
            title="Reload drafts"
          >
            {loadingList ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {!canUse ? (
        <div style={styles.errorBox}>
          <div style={styles.errorTitle}>Draft Library unavailable</div>
          <div style={styles.errorText}>
            Missing Core API base URL or Project ID. Ensure you are connected to
            a project and Core API is set in the top strip.
          </div>
        </div>
      ) : null}

      {error ? (
        <div style={styles.errorBox}>
          <div style={styles.errorTitle}>Error</div>
          <div style={styles.errorText}>{error}</div>
        </div>
      ) : null}

      <div style={styles.grid}>
        {/* Left: list */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>Saved drafts</div>
            <div style={styles.badge}>{filteredDrafts.length}</div>
          </div>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search title, slug, keyword…"
            style={styles.input}
            disabled={!canUse}
          />

          <div style={styles.list}>
            {loadingList && drafts.length === 0 ? (
              <div style={styles.muted}>Loading drafts…</div>
            ) : filteredDrafts.length === 0 ? (
              <div style={styles.muted}>No drafts found for this project.</div>
            ) : (
              filteredDrafts.map((d) => {
                const id = pickId(d);
                const isActive = id && id === selectedId;

                return (
                  <button
                    key={id || pickTitle(d)}
                    type="button"
                    onClick={() => setSelectedId(id)}
                    style={{
                      ...styles.listItem,
                      ...(isActive ? styles.listItemActive : {}),
                    }}
                  >
                    <div style={styles.listItemTop}>
                      <div style={styles.listItemTitle}>{pickTitle(d)}</div>
                    </div>

                    <div style={styles.listItemMeta}>
                      <span style={styles.mono}>
                        {d?.primaryKeyword ? d.primaryKeyword : `ID ${String(id || "—")}`}
                      </span>
                      <span style={styles.dot}>•</span>
                      <span>{formatDate(pickCreatedAt(d))}</span>
                    </div>

                    {d?.metaDescription ? (
                      <div style={styles.listItemDesc}>
                        {String(d.metaDescription).slice(0, 120)}
                        {String(d.metaDescription).length > 120 ? "…" : ""}
                      </div>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          <div style={styles.pagerRow}>
            <div style={styles.pagerLeft}>
              <span style={styles.pagerLabel}>Limit</span>
              <select
                value={limit}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  setLimit(next);
                  setOffset(0);
                  setDrafts([]);
                  setSelectedId(null);
                  setSelectedDraft(null);
                  setTimeout(() => fetchDrafts({ reset: true }), 0);
                }}
                style={styles.select}
                disabled={!canUse || loadingList}
              >
                {[25, 50, 100, 200].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const nextOffset = offset + limit;
                setOffset(nextOffset);
                // load more (append)
                setTimeout(() => fetchDrafts({ reset: false }), 0);
              }}
              style={styles.btnSecondary}
              disabled={!canUse || loadingList}
              title="Load more drafts"
            >
              Load more
            </button>
          </div>
        </div>

        {/* Right: preview/export */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}>Draft</div>

            <div style={styles.controls}>
              <div style={styles.toggleWrap}>
                <button
                  type="button"
                  onClick={() => setFormat("plain")}
                  style={{
                    ...styles.toggleBtn,
                    ...(format === "plain" ? styles.toggleBtnActive : {}),
                  }}
                  disabled={!selectedDraft}
                >
                  Plain text
                </button>
                <button
                  type="button"
                  onClick={() => setFormat("html")}
                  style={{
                    ...styles.toggleBtn,
                    ...(format === "html" ? styles.toggleBtnActive : {}),
                  }}
                  disabled={!selectedDraft}
                >
                  HTML
                </button>
              </div>

              <button
                type="button"
                onClick={copyToClipboard}
                style={styles.btn}
                disabled={!selectedDraft || loadingDraft}
                title="Copy output to clipboard"
              >
                {copied ? "Copied" : "Copy"}
              </button>

              <button
                type="button"
                onClick={downloadCurrent}
                style={styles.btnSecondary}
                disabled={!selectedDraft || loadingDraft}
                title="Download as .txt or .html"
              >
                Download
              </button>
            </div>
          </div>

          {!selectedId ? (
            <div style={styles.muted}>Select a draft to view it.</div>
          ) : loadingDraft ? (
            <div style={styles.muted}>Loading draft…</div>
          ) : !selectedDraft ? (
            <div style={styles.muted}>Draft not found.</div>
          ) : (
            <>
              <div style={styles.metaRow}>
                <div style={styles.metaBlock}>
                  <div style={styles.metaLabel}>Title</div>
                  <div style={styles.metaValue}>{pickTitle(selectedDraft)}</div>
                </div>
                <div style={styles.metaBlock}>
                  <div style={styles.metaLabel}>Created</div>
                  <div style={styles.metaValue}>
                    {formatDate(pickCreatedAt(selectedDraft))}
                  </div>
                </div>
                <div style={styles.metaBlock}>
                  <div style={styles.metaLabel}>Primary keyword</div>
                  <div style={styles.metaValue}>
                    {selectedDraft?.primaryKeyword || "—"}
                  </div>
                </div>
                <div style={styles.metaBlock}>
                  <div style={styles.metaLabel}>Slug</div>
                  <div style={{ ...styles.metaValue, ...styles.mono }}>
                    {selectedDraft?.slug || "—"}
                  </div>
                </div>
              </div>

              <textarea
                value={outputText}
                readOnly
                style={styles.textarea}
                spellCheck={false}
              />

              <div style={styles.hint}>
                Note: if a draft has no <b>articleHtml</b>, HTML export wraps the
                plain text into a <b>&lt;pre&gt;</b>.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    width: "100%",
    padding: 0,
    boxSizing: "border-box",
  },
  header: {
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerRight: {
    display: "flex",
    gap: 10,
    alignItems: "center",
  },
  h1: { fontSize: 16, fontWeight: 800, lineHeight: 1.2 },
  sub: { fontSize: 12, opacity: 0.8, marginTop: 4 },
  grid: {
    display: "grid",
    gridTemplateColumns: "360px 1fr",
    gap: 12,
    alignItems: "start",
  },
  panel: {
    border: "1px solid rgba(148, 163, 184, 0.20)",
    borderRadius: 16,
    padding: 12,
    background: "rgba(2, 6, 23, 0.30)",
    boxShadow: "0 10px 30px rgba(0,0,0,0.20)",
    backdropFilter: "blur(8px)",
    minHeight: 520,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  panelTitle: { fontSize: 13, fontWeight: 800, opacity: 0.95 },
  badge: {
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid rgba(148, 163, 184, 0.20)",
    opacity: 0.9,
  },
  input: {
    width: "100%",
    padding: "10px 10px",
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.20)",
    background: "rgba(2, 6, 23, 0.22)",
    color: "inherit",
    outline: "none",
    boxSizing: "border-box",
    marginBottom: 10,
    fontSize: 12,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    maxHeight: 390,
    overflow: "auto",
    paddingRight: 2,
  },
  listItem: {
    textAlign: "left",
    width: "100%",
    borderRadius: 14,
    border: "1px solid rgba(148, 163, 184, 0.16)",
    background: "rgba(2, 6, 23, 0.16)",
    color: "inherit",
    padding: 10,
    cursor: "pointer",
  },
  listItemActive: {
    border: "1px solid rgba(0, 240, 255, 0.45)",
    background: "rgba(0, 240, 255, 0.08)",
  },
  listItemTop: { display: "flex", alignItems: "center", gap: 8 },
  listItemTitle: { fontSize: 12, fontWeight: 800, lineHeight: 1.2 },
  listItemMeta: { marginTop: 6, fontSize: 11, opacity: 0.75 },
  listItemDesc: { marginTop: 6, fontSize: 11, opacity: 0.7, lineHeight: 1.3 },
  mono: {
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  dot: { margin: "0 6px" },
  controls: { display: "flex", gap: 8, alignItems: "center" },
  toggleWrap: {
    display: "flex",
    border: "1px solid rgba(148, 163, 184, 0.20)",
    borderRadius: 12,
    overflow: "hidden",
  },
  toggleBtn: {
    padding: "8px 10px",
    fontSize: 12,
    border: "none",
    cursor: "pointer",
    background: "transparent",
    color: "inherit",
    opacity: 0.8,
  },
  toggleBtnActive: {
    background: "rgba(148, 163, 184, 0.12)",
    opacity: 1,
    fontWeight: 800,
  },
  btn: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.20)",
    background: "rgba(2, 6, 23, 0.22)",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
  },
  btnSecondary: {
    padding: "8px 10px",
    borderRadius: 12,
    border: "1px solid rgba(148, 163, 184, 0.20)",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    fontSize: 12,
    opacity: 0.9,
  },
  muted: { opacity: 0.7, fontSize: 12, padding: 6 },
  textarea: {
    width: "100%",
    height: 320,
    resize: "vertical",
    borderRadius: 16,
    border: "1px solid rgba(148, 163, 184, 0.20)",
    background: "rgba(2, 6, 23, 0.22)",
    color: "inherit",
    padding: 12,
    boxSizing: "border-box",
    fontFamily:
      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: 12,
    lineHeight: 1.5,
    outline: "none",
  },
  hint: { marginTop: 10, fontSize: 12, opacity: 0.75 },
  metaRow: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
    gap: 10,
    marginBottom: 10,
  },
  metaBlock: {
    border: "1px solid rgba(148, 163, 184, 0.16)",
    borderRadius: 16,
    padding: 10,
    background: "rgba(2, 6, 23, 0.16)",
  },
  metaLabel: { fontSize: 11, opacity: 0.7, marginBottom: 4 },
  metaValue: { fontSize: 12, fontWeight: 800, opacity: 0.95 },
  errorBox: {
    border: "1px solid rgba(239, 68, 68, 0.35)",
    background: "rgba(239, 68, 68, 0.08)",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  errorTitle: { fontSize: 13, fontWeight: 900, marginBottom: 4 },
  errorText: { fontSize: 12, opacity: 0.9 },
  pagerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  pagerLeft: { display: "flex", alignItems: "center", gap: 8 },
  pagerLabel: { fontSize: 12, opacity: 0.75 },
  select: {
    borderRadius: 10,
    border: "1px solid rgba(148, 163, 184, 0.20)",
    background: "rgba(2, 6, 23, 0.22)",
    color: "inherit",
    padding: "8px 10px",
    fontSize: 12,
    outline: "none",
  },
};
