// aura-console/src/components/DraftLibrary.jsx
import React, { useEffect, useMemo, useState } from "react";

function safeJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

function DraftLibrary({ coreUrl, projectId: projectIdProp }) {
  const projectId =
    projectIdProp || localStorage.getItem("auraProjectId") || "";

  const [status, setStatus] = useState("idle"); // idle | loading | error | ok
  const [error, setError] = useState(null);

  const [drafts, setDrafts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selected, setSelected] = useState(null);

  const [limit, setLimit] = useState(25);
  const [offset, setOffset] = useState(0);

  const [search, setSearch] = useState("");
  const [format, setFormat] = useState("text"); // text | html
  const [detailsView, setDetailsView] = useState("article"); // article | seo | json

  const canQuery = Boolean(coreUrl && projectId);

  const filteredDrafts = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return drafts;

    return drafts.filter((d) => {
      const title = (d.title || "").toLowerCase();
      const slug = (d.slug || "").toLowerCase();
      const kw = (d.primaryKeyword || "").toLowerCase();
      const meta = (d.metaDescription || "").toLowerCase();
      return (
        title.includes(q) ||
        slug.includes(q) ||
        kw.includes(q) ||
        meta.includes(q)
      );
    });
  }, [drafts, search]);

  const selectedArticleText =
    (selected && selected.articleText) || "";
  const selectedArticleHtml =
    (selected && selected.articleHtml) || "";

  const copyToClipboard = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error("Clipboard copy failed", err);
    }
  };

  const fetchDrafts = async () => {
    if (!canQuery) return;

    setStatus("loading");
    setError(null);

    try {
      const url = new URL(`${coreUrl}/projects/${projectId}/drafts`);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("offset", String(offset));

      const res = await fetch(url.toString());
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to load drafts (${res.status}): ${text || res.statusText}`
        );
      }

      const data = await res.json();
      const items = Array.isArray(data?.drafts) ? data.drafts : [];
      setDrafts(items);

      // If we don’t have a selection yet, auto-select the first draft.
      if (!selectedId && items.length) {
        setSelectedId(items[0].id);
      }

      setStatus("ok");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err.message || "Failed to load drafts");
    }
  };

  const fetchDraftById = async (id) => {
    if (!canQuery || !id) return;

    try {
      const res = await fetch(
        `${coreUrl}/projects/${projectId}/drafts/${id}`
      );
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to load draft (${res.status}): ${text || res.statusText}`
        );
      }

      const data = await res.json();
      const draft = data?.draft || data;
      setSelected(draft || null);
    } catch (err) {
      console.error(err);
      setSelected(null);
      setError(err.message || "Failed to load selected draft");
    }
  };

  // Initial load + whenever paging changes
  useEffect(() => {
    fetchDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coreUrl, projectId, limit, offset]);

  // Fetch the selected draft details
  useEffect(() => {
    if (!selectedId) return;
    fetchDraftById(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, coreUrl, projectId]);

  const selectedSummary = useMemo(() => {
    if (!selectedId) return null;
    return drafts.find((d) => d.id === selectedId) || null;
  }, [drafts, selectedId]);

  const createdAtLabel = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const articleForFormat =
    format === "html" ? selectedArticleHtml : selectedArticleText;

  const formatLabel = format === "html" ? "HTML" : "text";

  if (!projectId) {
    return (
      <div style={{ fontSize: 12 }}>
        <div style={{ marginBottom: 8, opacity: 0.8 }}>
          No project selected. Connect a project first so we can load drafts.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 12 }}>
      {/* LEFT: Draft list */}
      <div className="card" style={{ margin: 0 }}>
        <div className="card-header">
          <div
            className="card-title-row"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <h3 className="card-title" style={{ fontSize: 14, margin: 0 }}>
              Drafts
            </h3>

            <button
              className="button button--ghost button--tiny"
              onClick={fetchDrafts}
              type="button"
              disabled={!canQuery || status === "loading"}
            >
              {status === "loading" ? "Loading…" : "Refresh"}
            </button>
          </div>

          <p className="card-subtitle" style={{ marginTop: 6 }}>
            Showing {Math.min(limit, filteredDrafts.length)} of{" "}
            {drafts.length} loaded (page offset {offset}).
          </p>
        </div>

        <div style={{ padding: "0 14px 12px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="core-api-input"
              placeholder="Search title, slug, keyword…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 180 }}
            />

            <select
              className="core-api-input"
              value={limit}
              onChange={(e) => {
                setOffset(0);
                setLimit(Number(e.target.value) || 25);
              }}
              style={{ width: 110 }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginTop: 10,
              alignItems: "center",
            }}
          >
            <button
              className="button button--ghost button--tiny"
              type="button"
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              disabled={offset === 0 || status === "loading"}
            >
              Prev
            </button>
            <button
              className="button button--ghost button--tiny"
              type="button"
              onClick={() => setOffset((o) => o + limit)}
              disabled={status === "loading" || drafts.length < limit}
            >
              Next
            </button>
            <div style={{ fontSize: 11, opacity: 0.75 }}>
              Page {Math.floor(offset / limit) + 1}
            </div>
          </div>
        </div>

        <div style={{ padding: "0 8px 10px" }}>
          {status === "error" && (
            <div className="error-banner" style={{ margin: "0 6px 10px" }}>
              <span className="error-dot" />
              {error || "Failed to load drafts"}
            </div>
          )}

          {status !== "loading" && drafts.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, opacity: 0.8 }}>
              No drafts found for this project yet.
              <div style={{ marginTop: 6 }}>
                Run the <strong>Blog Draft Engine</strong> and save the output
                to your Draft Library.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredDrafts.map((d) => {
                const active = d.id === selectedId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedId(d.id)}
                    className={
                      "side-nav-item" + (active ? " side-nav-item--active" : "")
                    }
                    style={{
                      textAlign: "left",
                      padding: "10px 10px",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: active
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {d.title || "Untitled draft"}
                    </div>
                    <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>
                      {d.primaryKeyword ? (
                        <span>{d.primaryKeyword}</span>
                      ) : (
                        <span>—</span>
                      )}
                      <span style={{ margin: "0 8px", opacity: 0.4 }}>•</span>
                      <span>{createdAtLabel(d.createdAt)}</span>
                    </div>
                    {d.slug ? (
                      <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                        /{d.slug}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: Draft detail */}
      <div className="card" style={{ margin: 0 }}>
        <div className="card-header">
          <div
            className="card-title-row"
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <h3 className="card-title" style={{ fontSize: 14, margin: 0 }}>
              Draft details
            </h3>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <button
                className={"pill" + (detailsView === "article" ? " pill--active" : "")}
                onClick={() => setDetailsView("article")}
                type="button"
              >
                Article
              </button>
              <button
                className={"pill" + (detailsView === "seo" ? " pill--active" : "")}
                onClick={() => setDetailsView("seo")}
                type="button"
              >
                SEO
              </button>
              <button
                className={"pill" + (detailsView === "json" ? " pill--active" : "")}
                onClick={() => setDetailsView("json")}
                type="button"
              >
                JSON
              </button>
            </div>
          </div>

          <p className="card-subtitle" style={{ marginTop: 6 }}>
            {selectedSummary?.title || selected?.title
              ? "Select format, copy, and paste into your CMS."
              : "Select a draft from the left to view it here."}
          </p>
        </div>

        {!selectedId ? (
          <div style={{ padding: 14, fontSize: 12, opacity: 0.8 }}>
            Choose a draft from the left-hand list.
          </div>
        ) : (
          <div style={{ padding: 14 }}>
            {/* Header meta */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Title</div>
                <div style={{ fontSize: 13, fontWeight: 650 }}>
                  {selected?.title || selectedSummary?.title || "Untitled draft"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Created</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {createdAtLabel(selected?.createdAt || selectedSummary?.createdAt)}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Primary keyword</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {selected?.primaryKeyword || selectedSummary?.primaryKeyword || "—"}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Slug</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {selected?.slug || selectedSummary?.slug || "—"}
                </div>
              </div>
            </div>

            {/* SEO view */}
            {detailsView === "seo" && (
              <div className="card seo-table-card" style={{ marginTop: 0 }}>
                <div className="card-header" style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <h2 className="card-title" style={{ fontSize: 13 }}>
                    SEO fields (saved with the draft)
                  </h2>
                  <p className="card-subtitle">
                    Copy these into your CMS SEO panel if needed.
                  </p>
                </div>

                <table className="seo-table">
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Value</th>
                      <th className="actions-col">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Title</td>
                      <td>{selected?.title || selectedSummary?.title || "—"}</td>
                      <td>
                        <button
                          className="button button--ghost button--tiny"
                          onClick={() => copyToClipboard(selected?.title || selectedSummary?.title || "")}
                          type="button"
                          disabled={!(selected?.title || selectedSummary?.title)}
                        >
                          Copy
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Meta description</td>
                      <td>{selected?.metaDescription || selectedSummary?.metaDescription || "—"}</td>
                      <td>
                        <button
                          className="button button--ghost button--tiny"
                          onClick={() =>
                            copyToClipboard(selected?.metaDescription || selectedSummary?.metaDescription || "")
                          }
                          type="button"
                          disabled={!(selected?.metaDescription || selectedSummary?.metaDescription)}
                        >
                          Copy
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Slug</td>
                      <td>{selected?.slug || selectedSummary?.slug || "—"}</td>
                      <td>
                        <button
                          className="button button--ghost button--tiny"
                          onClick={() => copyToClipboard(selected?.slug || selectedSummary?.slug || "")}
                          type="button"
                          disabled={!(selected?.slug || selectedSummary?.slug)}
                        >
                          Copy
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <td>Primary keyword</td>
                      <td>{selected?.primaryKeyword || selectedSummary?.primaryKeyword || "—"}</td>
                      <td>
                        <button
                          className="button button--ghost button--tiny"
                          onClick={() =>
                            copyToClipboard(selected?.primaryKeyword || selectedSummary?.primaryKeyword || "")
                          }
                          type="button"
                          disabled={!(selected?.primaryKeyword || selectedSummary?.primaryKeyword)}
                        >
                          Copy
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Article view */}
            {detailsView === "article" && (
              <div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <button
                    className={"pill" + (format === "text" ? " pill--active" : "")}
                    onClick={() => setFormat("text")}
                    type="button"
                  >
                    Plain text
                  </button>
                  <button
                    className={"pill" + (format === "html" ? " pill--active" : "")}
                    onClick={() => setFormat("html")}
                    type="button"
                    disabled={!selectedArticleHtml}
                    title={!selectedArticleHtml ? "No HTML stored for this draft" : ""}
                  >
                    HTML
                  </button>

                  <button
                    className="button button--ghost button--tiny"
                    onClick={() => copyToClipboard(articleForFormat)}
                    disabled={!articleForFormat}
                    type="button"
                    style={{ marginLeft: "auto" }}
                  >
                    Copy {formatLabel}
                  </button>
                </div>

                <pre className="raw-json-pre" style={{ marginTop: 0 }}>
                  {articleForFormat
                    ? articleForFormat
                    : format === "html"
                    ? "// This draft has no saved HTML. Switch to Plain text, or save HTML from the engine."
                    : "// This draft has no saved article text yet."}
                </pre>

                <div style={{ marginTop: 10, fontSize: 11, opacity: 0.75 }}>
                  Tip: Plain text is usually safest for Shopify/WordPress editors. Use HTML only if your editor supports it cleanly.
                </div>
              </div>
            )}

            {/* JSON view */}
            {detailsView === "json" && (
              <div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <button
                    className="button button--ghost button--tiny"
                    onClick={() => copyToClipboard(safeJson(selected))}
                    disabled={!selected}
                    type="button"
                  >
                    Copy JSON
                  </button>

                  <button
                    className="button button--ghost button--tiny"
                    onClick={() => fetchDraftById(selectedId)}
                    type="button"
                  >
                    Reload details
                  </button>
                </div>

                <pre className="raw-json-pre" style={{ marginTop: 0 }}>
                  {selected ? safeJson(selected) : "// Loading draft JSON…"}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DraftLibrary;
