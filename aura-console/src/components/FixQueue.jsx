// aura-console/src/components/FixQueue.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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

function toLocalDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
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

  // Per-row busy flags: { [id]: { owner: true, notes: true, done: true, autoFix: true } }
  const [rowBusy, setRowBusy] = useState({});

  const [toast, setToast] = useState("");

  const endpoint = useMemo(() => {
    const q = new URLSearchParams();
    if (statusFilter) q.set("status", statusFilter);
    q.set("limit", String(limit));
    return `${normalizedCoreUrl}/projects/${projectId}/fix-queue?${q.toString()}`;
  }, [normalizedCoreUrl, projectId, statusFilter, limit]);

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(""), 1800);
  };

  const setBusy = (id, key, on) => {
    setRowBusy((prev) => {
      const next = { ...prev };
      const row = { ...(next[String(id)] || {}) };
      if (on) row[key] = true;
      else delete row[key];

      if (Object.keys(row).length) next[String(id)] = row;
      else delete next[String(id)];
      return next;
    });
  };

  const isRowBusy = (id) => {
    const row = rowBusy[String(id)];
    return !!(row && Object.keys(row).length);
  };

  const updateItemLocal = (id, patch) => {
    setItems((prev) =>
      prev.map((x) => {
        if (x.id !== id) return x;
        return { ...x, ...patch };
      })
    );
  };

  const fetchAbortRef = useRef(null);

  const fetchQueue = async () => {
    if (!normalizedCoreUrl || !projectId) return;

    // Abort any in-flight fetch
    if (fetchAbortRef.current) {
      try {
        fetchAbortRef.current.abort();
      } catch {}
    }
    const ac = new AbortController();
    fetchAbortRef.current = ac;

    setStatus("loading");
    setError("");

    try {
      const res = await fetch(endpoint, { signal: ac.signal });
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
      if (e?.name === "AbortError") return;
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
    const row = items.find((x) => x.id === id);
    if (!row) return;

    setBusy(id, "done", true);

    // Optimistic: mark done locally (and optionally remove if viewing open)
    const prevRow = { ...row };
    if (statusFilter === "open") {
      setItems((prev) => prev.filter((x) => x.id !== id));
    } else {
      updateItemLocal(id, { status: "done" });
    }

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/done`, {
        method: "POST",
      });
      showToast("Marked done");
      setSelected((prev) => {
        const next = { ...prev };
        delete next[String(id)];
        return next;
      });
    } catch (e) {
      // Revert
      if (statusFilter === "open") {
        setItems((prev) => {
          const exists = prev.some((x) => x.id === id);
          if (exists) return prev;
          return [prevRow, ...prev];
        });
      } else {
        updateItemLocal(id, { status: prevRow.status });
      }
      showToast(e?.message || "Failed to mark done");
    } finally {
      setBusy(id, "done", false);
    }
  };

  const handleBulkDone = async () => {
    if (!selectedIds.length) return;

    // Optimistic removal/marking
    const selectedSet = new Set(selectedIds);
    const prevItems = items;

    if (statusFilter === "open") {
      setItems((prev) => prev.filter((x) => !selectedSet.has(x.id)));
    } else {
      setItems((prev) =>
        prev.map((x) => (selectedSet.has(x.id) ? { ...x, status: "done" } : x))
      );
    }
    setSelected({});

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-done`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      showToast(`Done: ${selectedIds.length}`);
    } catch (e) {
      // Revert to known-good state
      setItems(prevItems);
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
    const row = items.find((x) => x.id === id);
    if (!row) return;

    setBusy(id, "owner", true);

    // Optimistic owner update
    const prevOwner = row.owner || "";
    updateItemLocal(id, { owner });

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner }),
      });
      showToast("Owner updated");
      // No refetch (optimistic is now source of truth)
    } catch (e) {
      // Revert
      updateItemLocal(id, { owner: prevOwner || null });
      showToast(e?.message || "Failed to update owner");
    } finally {
      setBusy(id, "owner", false);
    }
  };

  const handleNotes = async (id) => {
    const row = items.find((x) => x.id === id);
    if (!row) return;

    const existing = row?.notes || "";
    const next = window.prompt("Notes for this item:", existing);
    if (next === null) return;

    setBusy(id, "notes", true);

    // Optimistic notes update
    const prevNotes = existing;
    updateItemLocal(id, { notes: next });

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: next }),
      });
      showToast("Notes saved");
      // No refetch
    } catch (e) {
      // Revert
      updateItemLocal(id, { notes: prevNotes || null });
      showToast(e?.message || "Failed to save notes");
    } finally {
      setBusy(id, "notes", false);
    }
  };

  const handleAutoFix = async (id) => {
    setBusy(id, "autoFix", true);

    try {
      const data = await callJson(
        `${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/auto-fix`,
        { method: "POST" }
      );

      // Optimistic update from response payload (no refetch)
      // Your route returns: { ok, projectId, id, url, suggestedTitle, suggestedMetaDescription, suggestedH1, lastSuggestedAt?, ... }
      updateItemLocal(id, {
        suggestedTitle: data?.suggestedTitle || null,
        suggestedMetaDescription: data?.suggestedMetaDescription || null,
        suggestedH1: data?.suggestedH1 || null,
        lastSuggestedAt: data?.lastSuggestedAt || data?.suggestedAt || new Date().toISOString(),
      });

      showToast("Suggestions generated");
    } catch (e) {
      showToast(e?.message || "Failed to generate suggestions");
    } finally {
      setBusy(id, "autoFix", false);
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
              onChange={(e) => setLimit(Number(e.target.value || 200))}
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
              <th style={{ width: 260 }}>Auto-fix suggestions</th>
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
                const busy = isRowBusy(row.id);

                return (
                  <tr key={row.id} className={busy ? "fq-row-busy" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={!!selected[String(row.id)]}
                        onChange={(e) => setRowSelected(row.id, e.target.checked)}
                        disabled={busy}
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
                        disabled={!!rowBusy[String(row.id)]?.owner || busy}
                      >
                        <option value="">Unassigned</option>
                        <option value="Darren">Darren</option>
                        <option value="Dev">Dev</option>
                        <option value="Writer">Writer</option>
                        <option value="VA">VA</option>
                      </select>
                      {rowBusy[String(row.id)]?.owner ? (
                        <div className="fq-sub fq-muted">Saving owner…</div>
                      ) : null}
                    </td>

                    <td>
                      <div className="fq-date">{toLocalDateTime(row.createdAt)}</div>
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
                              disabled={!!rowBusy[String(row.id)]?.autoFix || busy}
                            >
                              {rowBusy[String(row.id)]?.autoFix ? "Generating…" : "Generate"}
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
                              disabled={!row.suggestedTitle || busy}
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
                              disabled={!row.suggestedMetaDescription || busy}
                            >
                              Copy
                            </button>
                          </div>

                          <div className="fq-sub">
                            Last suggested:{" "}
                            {row.lastSuggestedAt ? toLocalDateTime(row.lastSuggestedAt) : "—"}
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
                          disabled={busy}
                        >
                          Copy URL
                        </button>

                        <button
                          className="button button--ghost button--tiny"
                          type="button"
                          onClick={() => handleNotes(row.id)}
                          disabled={!!rowBusy[String(row.id)]?.notes || busy}
                        >
                          {rowBusy[String(row.id)]?.notes ? "Saving…" : "Notes"}
                        </button>

                        <button
                          className="button button--ghost button--tiny"
                          type="button"
                          onClick={() => handleDone(row.id)}
                          disabled={row.status === "done" || !!rowBusy[String(row.id)]?.done || busy}
                        >
                          {rowBusy[String(row.id)]?.done ? "…" : "Done"}
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
