// aura-console/src/components/DraftLibrary.jsx
import React, { useEffect, useMemo, useState } from "react";

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

  const [format, setFormat] = useState("text"); // text | html

  const canUse = useMemo(() => {
    return Boolean(coreUrl) && Boolean(projectId);
  }, [coreUrl, projectId]);

  const copyToClipboard = (value) => {
    if (!value) return;
    navigator.clipboard.writeText(value).catch(() => {});
  };

  const loadList = async () => {
    if (!canUse) return;
    setStatus("loading");
    setError(null);

    try {
      const res = await fetch(
        `${coreUrl}/projects/${projectId}/drafts?limit=${encodeURIComponent(
          limit
        )}&offset=${encodeURIComponent(offset)}`
      );
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Failed to load drafts (${res.status})`);
      }

      setDrafts(Array.isArray(data.drafts) ? data.drafts : []);
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err.message || "Failed to load drafts");
    }
  };

  const loadOne = async (draftId) => {
    if (!canUse) return;
    setSelected(null);
    setError(null);

    try {
      const res = await fetch(
        `${coreUrl}/projects/${projectId}/drafts/${draftId}`
      );
      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Failed to load draft (${res.status})`);
      }

      setSelected(data.draft || null);
    } catch (err) {
      setError(err.message || "Failed to load draft");
    }
  };

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coreUrl, projectId, limit, offset]);

  useEffect(() => {
    if (!selectedId) return;
    loadOne(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const selectedBody =
    format === "html" ? selected?.articleHtml || "" : selected?.articleText || "";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 12 }}>
      <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", paddingRight: 12 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <button className="button button--ghost button--tiny" onClick={loadList} disabled={!canUse}>
            Refresh
          </button>

          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {projectId ? `Project: ${projectId}` : "No project connected"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center" }}>
          <div style={{ fontSize: 12, opacity: 0.7 }}>Per page</div>
          <select
            value={limit}
            onChange={(e) => {
              setOffset(0);
              setLimit(Number(e.target.value));
            }}
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "inherit",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "6px 8px",
              fontSize: 12,
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
            <button
              className="button button--ghost button--tiny"
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
              disabled={offset === 0}
            >
              Prev
            </button>
            <button
              className="button button--ghost button--tiny"
              onClick={() => setOffset((o) => o + limit)}
              disabled={drafts.length < limit}
            >
              Next
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.75 }}>
          {status === "loading" ? "Loading drafts…" : status === "error" ? "Error loading drafts" : "Drafts"}
        </div>

        {error && (
          <div className="error-banner" style={{ marginTop: 10 }}>
            <span className="error-dot" />
            {error}
          </div>
        )}

        <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
          {drafts.length === 0 ? (
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              No drafts yet. Run the <strong>Blog Draft Engine</strong> and it will auto-save here.
            </div>
          ) : (
            drafts.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                style={{
                  textAlign: "left",
                  background: selectedId === d.id ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 10,
                  color: "inherit",
                  cursor: "pointer",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {d.title || `Draft #${d.id}`}
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
                  {d.createdAt ? new Date(d.createdAt).toLocaleString() : "—"} · {d.primaryKeyword || "—"}
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
                  {d.slug || "—"}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div style={{ paddingLeft: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, opacity: 0.8 }}>
            {selected ? (
              <>
                <strong>{selected.title || `Draft #${selected.id}`}</strong>
                <span style={{ opacity: 0.7 }}> · {selected.slug || "—"}</span>
              </>
            ) : (
              "Select a draft to preview"
            )}
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
            >
              HTML
            </button>

            <button
              className="button button--ghost button--tiny"
              onClick={() => copyToClipboard(selectedBody)}
              disabled={!selectedBody}
              type="button"
            >
              Copy {format === "html" ? "HTML" : "text"}
            </button>
          </div>
        </div>

        {selected && (
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ fontSize: 12 }}>
                <div style={{ opacity: 0.7 }}>Meta description</div>
                <div style={{ fontWeight: 500 }}>{selected.metaDescription || "—"}</div>
              </div>
              <div style={{ fontSize: 12 }}>
                <div style={{ opacity: 0.7 }}>Primary keyword</div>
                <div style={{ fontWeight: 500 }}>{selected.primaryKeyword || "—"}</div>
              </div>
            </div>

            <pre className="raw-json-pre" style={{ marginTop: 0 }}>
              {selectedBody || "// No article body saved on this draft."}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default DraftLibrary;
