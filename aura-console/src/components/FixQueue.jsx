// aura-console/src/components/FixQueue.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./FixQueue.css";

function normaliseCoreUrl(coreUrl) {
  return String(coreUrl || "").replace(/\/+$/, "");
}

function safeCopy(value) {
  const v = String(value || "");
  if (!v.trim()) return;
  navigator.clipboard.writeText(v).catch(() => {});
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

export default function FixQueue({ coreUrl, projectId }) {
  const normalizedCoreUrl = useMemo(() => normaliseCoreUrl(coreUrl), [coreUrl]);

  const [statusFilter, setStatusFilter] = useState("open"); // open | done | all
  const [limit, setLimit] = useState(200);

  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [selected, setSelected] = useState({});
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k)),
    [selected]
  );

  const [toast, setToast] = useState("");

  const endpoint = useMemo(() => {
    const q = new URLSearchParams();
    if (statusFilter) q.set("status", statusFilter);
    q.set("limit", String(limit));
    return `${normalizedCoreUrl}/projects/${projectId}/fix-queue?${q.toString()}`;
  }, [normalizedCoreUrl, projectId, statusFilter, limit]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 1800);
  };

  const fetchQueue = async () => {
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
      setSelected({});
    } catch (e) {
      setStatus("error");
      setError(e?.message || "Failed to load Fix Queue");
      setItems([]);
    }
  };

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const toggleAll = () => {
    if (!items.length) return;
    const allOn = items.every((r) => selected[String(r.id)]);
    if (allOn) {
      setSelected({});
      return;
    }
    const next = {};
    items.forEach((r) => (next[String(r.id)] = true));
    setSelected(next);
  };

  const setRowSelected = (id, on) => {
    setSelected((prev) => ({ ...prev, [String(id)]: !!on }));
  };

  const callJson = async (url, opts) => {
    const res = await fetch(url, opts);
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Core API error (${res.status}): ${t || res.statusText}`);
    }
    return res.json();
  };

  const handleDone = async (id) => {
    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/done`, {
        method: "POST",
      });
      showToast("Marked done");
      fetchQueue();
    } catch (e) {
      showToast(e?.message || "Failed to mark done");
    }
  };

  const handleBulkDone = async () => {
    if (!selectedIds.length) return;
    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      showToast(`Done: ${selectedIds.length}`);
      fetchQueue();
    } catch (e) {
      showToast(e?.message || "Failed bulk done");
    }
  };

  const handleDedupe = async () => {
    try {
      const data = await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/dedupe`, {
        method: "POST",
      });
      showToast(`Deduped (deleted ${data?.deleted || 0})`);
      fetchQueue();
    } catch (e) {
      showToast(e?.message || "Failed to dedupe");
    }
  };

  const handleOwner = async (id, owner) => {
    try {
      // IMPORTANT: Send null for "Unassigned" so backend can clear it.
      const payloadOwner = owner && String(owner).trim() ? owner : null;

      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: payloadOwner }),
      });
      showToast("Owner updated");
      fetchQueue();
    } catch (e) {
      showToast(e?.message || "Failed to update owner");
    }
  };

  const handleNotes = async (id) => {
    const current = items.find((x) => x.id === id);
    const existing = current?.notes || "";
    const next = window.prompt("Notes for this item:", existing);
    if (next === null) return;

    try {
      // Allow clearing notes by sending null
      const payloadNotes = String(next).trim() ? next : null;

      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: payloadNotes }),
      });
      showToast("Notes saved");
      fetchQueue();
    } catch (e) {
      showToast(e?.message || "Failed to save notes");
    }
  };

  const handleAutoFix = async (id) => {
    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/auto-fix`, {
        method: "POST",
      });
      showToast("Suggestions generated");
      fetchQueue();
    } catch (e) {
      showToast(e?.message || "Failed to generate suggestions");
    }
  };

  const exportCsvUrl = useMemo(() => {
    const q = new URLSearchParams();
    q.set("status", statusFilter || "open");
    return `${normalizedCoreUrl}/projects/${projectId}/fix-queue/export.csv?${q.toString()}`;
  }, [normalizedCoreUrl, projectId, statusFilter]);

  return (
    <div className="fq-wrap">
      <div className="fq-toolbar">
        <div className="fq-left">
          <div className="fq-filter">
            <div className="fq-label">Status</div>
            <select
              className="fq-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="open">Open</option>
              <option value="done">Done</option>
              <option value="all">All</option>
            </select>
          </div>

          <div className="fq-filter">
            <div className="fq-label">Limit</div>
            <input
              className="fq-input"
              type="number"
              min={1}
              max={1000}
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>

          <button
            className="button button--ghost"
            type="button"
            onClick={fetchQueue}
            disabled={status === "loading"}
          >
            {status === "loading" ? "Refreshing…" : "Refresh"}
          </button>

          <button className="button button--ghost" type="button" onClick={handleDedupe}>
            Dedupe
          </button>

          <a className="button button--ghost" href={exportCsvUrl} target="_blank" rel="noreferrer">
            Export CSV
          </a>
        </div>

        <div className="fq-right">
          <button
            className="button button--primary"
            type="button"
            onClick={handleBulkDone}
            disabled={!selectedIds.length}
            title="Mark all selected items as done"
          >
            Done selected ({selectedIds.length || 0})
          </button>
        </div>
      </div>

      {toast ? <div className="fq-toast">{toast}</div> : null}

      {status === "error" && (
        <div className="fq-error">
          <div className="fq-error-title">Could not load Fix Queue</div>
          <div className="fq-error-body">{error}</div>
        </div>
      )}

      <div className="fq-table-wrap">
        <table className="fq-table">
          <thead>
            <tr>
              <th style={{ width: 44 }}>
                <input
                  type="checkbox"
                  checked={items.length ? items.every((r) => selected[String(r.id)]) : false}
                  onChange={toggleAll}
                />
              </th>
              <th>URL</th>
              <th style={{ width: 220 }}>Issues</th>
              <th style={{ width: 160 }}>Owner</th>
              <th style={{ width: 160 }}>Added</th>
              <th style={{ width: 220 }}>Auto-fix suggestions</th>
              <th style={{ width: 220 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" && !items.length ? (
              <tr>
                <td colSpan={7} className="fq-empty">
                  Loading Fix Queue…
                </td>
              </tr>
            ) : !items.length ? (
              <tr>
                <td colSpan={7} className="fq-empty">
                  No items in the Fix Queue for these filters.
                </td>
              </tr>
            ) : (
              items.map((row) => {
                const prettyIssues = issuesPretty(row.issues);
                const hasSuggestion = !!row.suggestedTitle || !!row.suggestedMetaDescription;

                return (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!selected[String(row.id)]}
                        onChange={(e) => setRowSelected(row.id, e.target.checked)}
                      />
                    </td>

                    <td className="fq-url">
                      <a href={row.url} target="_blank" rel="noreferrer">
                        {row.url}
                      </a>
                      {row.notes ? <div className="fq-sub">Notes: {row.notes}</div> : null}
                    </td>

                    <td>
                      {prettyIssues.length ? (
                        <div className="fq-issues">
                          {prettyIssues.map((i) => (
                            <span key={i} className="fq-issue-pill">
                              {i}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="fq-muted">—</span>
                      )}
                    </td>

                    <td>
                      <select
                        className="fq-select"
                        value={row.owner || ""}
                        onChange={(e) => handleOwner(row.id, e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        <option value="Darren">Darren</option>
                        <option value="Dev">Dev</option>
                        <option value="Writer">Writer</option>
                        <option value="VA">VA</option>
                      </select>
                    </td>

                    <td>
                      <div className="fq-date">
                        {row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}
                      </div>
                    </td>

                    <td>
                      {!hasSuggestion ? (
                        <div className="fq-muted">
                          No suggestion yet.
                          <div style={{ marginTop: 6 }}>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => handleAutoFix(row.id)}
                            >
                              Generate
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="fq-suggest">
                          <div className="fq-suggest-row">
                            <div className="fq-suggest-label">Title</div>
                            <div className="fq-suggest-value">{row.suggestedTitle || "—"}</div>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => safeCopy(row.suggestedTitle)}
                              disabled={!row.suggestedTitle}
                            >
                              Copy
                            </button>
                          </div>
                          <div className="fq-suggest-row">
                            <div className="fq-suggest-label">Meta</div>
                            <div className="fq-suggest-value">
                              {row.suggestedMetaDescription || "—"}
                            </div>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => safeCopy(row.suggestedMetaDescription)}
                              disabled={!row.suggestedMetaDescription}
                            >
                              Copy
                            </button>
                          </div>

                          <div className="fq-sub">
                            Suggested:{" "}
                            {row.lastSuggestedAt
                              ? new Date(row.lastSuggestedAt).toLocaleString()
                              : "—"}
                          </div>
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="fq-action-row">
                        <button
                          className="button button--ghost button--tiny"
                          type="button"
                          onClick={() => safeCopy(row.url)}
                        >
                          Copy URL
                        </button>

                        <button
                          className="button button--ghost button--tiny"
                          type="button"
                          onClick={() => handleNotes(row.id)}
                        >
                          Notes
                        </button>

                        <button
                          className="button button--ghost button--tiny"
                          type="button"
                          onClick={() => handleDone(row.id)}
                          disabled={row.status === "done"}
                        >
                          Done
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

      <div className="fq-footer">
        Endpoint: <span className="fq-mono">{endpoint}</span>
      </div>
    </div>
  );
}
