// aura-console/src/components/DraftLibrary.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./DraftLibrary.css";

function DraftLibrary({ coreUrl, projectId }) {
  const [status, setStatus] = useState("idle"); // idle | loading | error | ok
  const [error, setError] = useState(null);

  const [drafts, setDrafts] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);

  const [format, setFormat] = useState("text"); // text | html

  const canLoad = Boolean(coreUrl && projectId);

  const selected = useMemo(() => {
    if (!selectedDraft) return null;
    return selectedDraft;
  }, [selectedDraft]);

  const copyToClipboard = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => {});
  };

  const loadList = async () => {
    if (!canLoad) return;

    setStatus("loading");
    setError(null);

    try {
      const res = await fetch(`${coreUrl}/projects/${projectId}/drafts?limit=50`);
      if (!res.ok) throw new Error(`Failed to load drafts (${res.status})`);
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.drafts)) {
        throw new Error("Draft list response invalid");
      }
      setDrafts(data.drafts);
      setStatus("ok");

      // Auto-select first item
      if (data.drafts.length && !selectedId) {
        setSelectedId(data.drafts[0].id);
      }
    } catch (err) {
      setStatus("error");
      setError(err.message || "Failed to load drafts");
    }
  };

  const loadOne = async (id) => {
    if (!canLoad || !id) return;

    try {
      const res = await fetch(`${coreUrl}/projects/${projectId}/drafts/${id}`);
      if (!res.ok) throw new Error(`Failed to load draft (${res.status})`);
      const data = await res.json();
      if (!data.ok || !data.draft) throw new Error("Draft response invalid");
      setSelectedDraft(data.draft);
    } catch (err) {
      setSelectedDraft(null);
      setError(err.message || "Failed to load draft");
      setStatus("error");
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coreUrl, projectId]);

  useEffect(() => {
    if (selectedId != null) loadOne(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  if (!canLoad) {
    return (
      <div style={{ fontSize: 12, opacity: 0.8 }}>
        Connect a project first so we know which Draft Library to load.
      </div>
    );
  }

  return (
    <div className="draft-library-grid" role="region" aria-label="Draft Library">
      <div className="draft-library-list" role="region" aria-label="Drafts List">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontWeight: 700 }} title="All your saved blog/article drafts appear here. Click one to view or copy.">Drafts
            <span style={{color:'#4f46e5',marginLeft:4,cursor:'help'}} title="This list shows all drafts saved by the Blog Draft Engine. Click a draft to view details and copy content.">?</span>
          </div>
          <button
            className="button button--ghost button--tiny"
            type="button"
            onClick={loadList}
            title="Reload the list of drafts from Core."
          >
            Refresh
          </button>
        </div>

        {status === "loading" && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            Loading drafts…
          </div>
        )}

        {status === "error" && (
          <div style={{ marginTop: 10, fontSize: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>Error</div>
            <div style={{ opacity: 0.85 }}>{error || "Unknown error"}</div>
          </div>
        )}

        {status === "ok" && drafts.length === 0 && (
          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
            No drafts saved yet. Run the Blog Draft Engine once — it will auto-save.
          </div>
        )}

        {drafts.length > 0 && (
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {drafts.map((d) => {
              const active = Number(selectedId) === Number(d.id);
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  className="button button--ghost"
                  style={{
                    textAlign: "left",
                    padding: 10,
                    border: active ? "1px solid rgba(255,255,255,0.25)" : "1px solid rgba(255,255,255,0.08)",
                    background: active ? "rgba(255,255,255,0.06)" : "transparent",
                  }}
                  title="Click to view this draft's details and copy content."
                >
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                    {d.title || "Untitled draft"}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.75 }}>
                    {d.primaryKeyword ? `KW: ${d.primaryKeyword} • ` : ""}
                    {d.createdAt ? new Date(d.createdAt).toLocaleString() : ""}
                  </div>
                  {d.metaDescription && (
                    <div style={{ fontSize: 11, opacity: 0.8, marginTop: 6 }}>
                      {d.metaDescription}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="draft-library-detail" role="region" aria-label="Draft Details">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }} title="The title of your selected draft.">
              {selected?.title || "Select a draft"}
            </div>
            <div style={{ fontSize: 11, opacity: 0.75 }}>
              {selected?.slug ? `Slug: ${selected.slug} • ` : ""}
              {selected?.primaryKeyword ? `Primary keyword: ${selected.primaryKeyword} • ` : ""}
              {selected?.createdAt ? new Date(selected.createdAt).toLocaleString() : ""}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className={"pill" + (format === "text" ? " pill--active" : "")}
              type="button"
              onClick={() => setFormat("text")}
              title="Show the draft as plain text (best for most CMS editors)."
            >
              Plain text
            </button>
            <button
              className={"pill" + (format === "html" ? " pill--active" : "")}
              type="button"
              onClick={() => setFormat("html")}
              title="Show the draft as HTML (for advanced use or HTML editors)."
            >
              HTML
            </button>

            <button
              className="button button--ghost button--tiny"
              type="button"
              disabled={!selected}
              onClick={() =>
                copyToClipboard(format === "html" ? selected?.articleHtml : selected?.articleText)
              }
              title={format === "html" ? "Copy the HTML version of this draft to your clipboard." : "Copy the plain text version of this draft to your clipboard."}
            >
              Copy {format === "html" ? "HTML" : "text"}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 6 }}>
            {format === "html"
              ? "HTML output (paste into an HTML editor). Use this if your CMS supports HTML."
              : "Plain text output (best for most CMS editors). Use this for Shopify, WordPress, etc."}
          </div>

          <pre className="raw-json-pre" style={{ minHeight: 420 }}>
            {selected
              ? format === "html"
                ? selected.articleHtml || "// No HTML saved for this draft."
                : selected.articleText || "// No text saved for this draft."
              : "// Select a draft from the left."}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default DraftLibrary;
