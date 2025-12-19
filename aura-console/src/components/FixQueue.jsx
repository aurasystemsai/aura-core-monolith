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

function lsKey(projectId) {
  return `aura.fixqueue.v1.${String(projectId || "unknown")}`;
}

function safeJsonParse(text, fallback) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export default function FixQueue({ coreUrl, projectId }) {
  const normalizedCoreUrl = useMemo(() => normaliseCoreUrl(coreUrl), [coreUrl]);

  // --------- Persisted UI State ---------
  const [statusFilter, setStatusFilter] = useState("open"); // open | done | all
  const [limit, setLimit] = useState(200);
  const [market, setMarket] = useState("UK"); // UK | US | EU
  const [operator, setOperator] = useState("Darren");

  const didLoadPersisted = useRef(false);

  useEffect(() => {
    if (!projectId) return;

    // Load once per mount (or when project changes)
    didLoadPersisted.current = false;
    const raw = localStorage.getItem(lsKey(projectId));
    if (raw) {
      const saved = safeJsonParse(raw, {});
      if (saved && typeof saved === "object") {
        if (saved.statusFilter) setStatusFilter(saved.statusFilter);
        if (saved.limit) setLimit(Number(saved.limit) || 200);
        if (saved.market) setMarket(saved.market);
        if (saved.operator) setOperator(saved.operator);
      }
    }
    didLoadPersisted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    if (!didLoadPersisted.current) return;

    const next = {
      statusFilter,
      limit,
      market,
      operator,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(lsKey(projectId), JSON.stringify(next));
  }, [projectId, statusFilter, limit, market, operator]);

  // --------- Data State ---------
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [selected, setSelected] = useState({});
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k)),
    [selected]
  );

  const [toast, setToast] = useState("");

  // Per-row loading flags (owner/notes/done/apply)
  const [rowLoading, setRowLoading] = useState({}); // { [id]: boolean }
  const [bulkLoading, setBulkLoading] = useState(false);

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

  const setRowBusy = (id, busy) => {
    setRowLoading((prev) => ({ ...prev, [String(id)]: !!busy }));
  };

  const updateLocalRow = (id, patch) => {
    const itemId = Number(id);
    setItems((prev) =>
      prev.map((r) => (r.id === itemId ? { ...r, ...patch } : r))
    );
  };

  const removeLocalRow = (id) => {
    const itemId = Number(id);
    setItems((prev) => prev.filter((r) => r.id !== itemId));
    setSelected((prev) => {
      const next = { ...prev };
      delete next[String(itemId)];
      return next;
    });
  };

  const callJson = async (url, opts = {}) => {
    const headers = {
      ...(opts.headers || {}),
      ...(opts.method && opts.method !== "GET" ? { "Content-Type": "application/json" } : {}),
      ...(operator ? { "x-aura-user": operator } : {}),
    };

    const res = await fetch(url, { ...opts, headers });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      throw new Error(`Core API error (${res.status}): ${t || res.statusText}`);
    }
    return res.json();
  };

  const fetchQueue = async () => {
    if (!normalizedCoreUrl || !projectId) return;
    setStatus("loading");
    setError("");

    try {
      const res = await fetch(endpoint, {
        headers: operator ? { "x-aura-user": operator } : {},
      });
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

  // --------- Actions (Optimistic) ---------

  const handleDone = async (id) => {
    const row = items.find((x) => x.id === id);
    if (!row) return;

    setRowBusy(id, true);

    // Optimistic: mark done locally (and remove if filter is open)
    if (statusFilter === "open") {
      removeLocalRow(id);
    } else {
      updateLocalRow(id, { status: "done", doneAt: new Date().toISOString() });
    }

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/done`, {
        method: "POST",
      });
      showToast("Marked done");
    } catch (e) {
      // Roll back by refetching (only on failure)
      showToast(e?.message || "Failed to mark done");
      fetchQueue();
    } finally {
      setRowBusy(id, false);
    }
  };

  const handleBulkDone = async () => {
    if (!selectedIds.length) return;
    setBulkLoading(true);

    // Optimistic: remove or mark done
    const idsSet = new Set(selectedIds);
    if (statusFilter === "open") {
      setItems((prev) => prev.filter((r) => !idsSet.has(r.id)));
      setSelected({});
    } else {
      setItems((prev) =>
        prev.map((r) =>
          idsSet.has(r.id) ? { ...r, status: "done", doneAt: new Date().toISOString() } : r
        )
      );
      setSelected({});
    }

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-done`, {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds }),
      });
      showToast(`Done: ${selectedIds.length}`);
    } catch (e) {
      showToast(e?.message || "Failed bulk done");
      fetchQueue();
    } finally {
      setBulkLoading(false);
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

    const prevOwner = row.owner || "";
    setRowBusy(id, true);

    // Optimistic
    updateLocalRow(id, { owner: owner || null, updatedAt: new Date().toISOString() });

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ owner }),
      });
      showToast("Owner updated");
    } catch (e) {
      // Roll back
      updateLocalRow(id, { owner: prevOwner || null });
      showToast(e?.message || "Failed to update owner");
    } finally {
      setRowBusy(id, false);
    }
  };

  const handleNotes = async (id) => {
    const current = items.find((x) => x.id === id);
    const existing = current?.notes || "";
    const next = window.prompt("Notes for this item:", existing);
    if (next === null) return;

    const prevNotes = existing;
    setRowBusy(id, true);

    // Optimistic
    updateLocalRow(id, { notes: next || null, updatedAt: new Date().toISOString() });

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ notes: next }),
      });
      showToast("Notes saved");
    } catch (e) {
      updateLocalRow(id, { notes: prevNotes || null });
      showToast(e?.message || "Failed to save notes");
    } finally {
      setRowBusy(id, false);
    }
  };

  const handleAutoFix = async (id) => {
    setRowBusy(id, true);
    try {
      const data = await callJson(
        `${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/auto-fix`,
        {
          method: "POST",
          body: JSON.stringify({
            market: market === "UK" ? "United Kingdom" : market === "US" ? "United States" : "European Union",
          }),
        }
      );

      // Optimistic update with returned suggestions (no refetch)
      updateLocalRow(id, {
        suggestedTitle: data?.suggestedTitle ?? null,
        suggestedMetaDescription: data?.suggestedMetaDescription ?? null,
        suggestedH1: data?.suggestedH1 ?? null,
        lastSuggestedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      showToast("Suggestions generated");
    } catch (e) {
      showToast(e?.message || "Failed to generate suggestions");
    } finally {
      setRowBusy(id, false);
    }
  };

  const handleBulkAutoFix = async () => {
    if (!selectedIds.length) return;

    setBulkLoading(true);
    try {
      const data = await callJson(
        `${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-auto-fix`,
        {
          method: "POST",
          body: JSON.stringify({
            ids: selectedIds,
            market: market === "UK" ? "United Kingdom" : market === "US" ? "United States" : "European Union",
          }),
        }
      );

      const results = Array.isArray(data?.results) ? data.results : [];
      const byId = new Map(results.map((r) => [Number(r.id), r]));

      setItems((prev) =>
        prev.map((row) => {
          const r = byId.get(row.id);
          if (!r) return row;
          return {
            ...row,
            suggestedTitle: r.suggestedTitle ?? row.suggestedTitle ?? null,
            suggestedMetaDescription: r.suggestedMetaDescription ?? row.suggestedMetaDescription ?? null,
            suggestedH1: r.suggestedH1 ?? row.suggestedH1 ?? null,
            lastSuggestedAt: r.lastSuggestedAt ?? row.lastSuggestedAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        })
      );

      showToast(`Bulk suggestions: ${results.length}`);
    } catch (e) {
      showToast(e?.message || "Failed bulk auto-fix");
    } finally {
      setBulkLoading(false);
    }
  };

  // “Apply suggestion” = enqueue apply job for Framer plugin to execute
  const handleApplySuggestion = async (id, field, value) => {
    if (!value) return;
    setRowBusy(id, true);
    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/apply`, {
        method: "POST",
        body: JSON.stringify({
          target: "framer",
          field,
          value,
        }),
      });
      showToast("Queued for Framer apply");
    } catch (e) {
      showToast(e?.message || "Failed to queue apply");
    } finally {
      setRowBusy(id, false);
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
              onChange={(e) => setLimit(Number(e.target.value) || 200)}
            />
          </div>

          <div className="fq-filter">
            <div className="fq-label">Market</div>
            <select className="fq-select" value={market} onChange={(e) => setMarket(e.target.value)}>
              <option value="UK">UK</option>
              <option value="US">US</option>
              <option value="EU">EU</option>
            </select>
          </div>

          <div className="fq-filter">
            <div className="fq-label">Operator</div>
            <select
              className="fq-select"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              title="Used for audit trail (x-aura-user header)"
            >
              <option value="Darren">Darren</option>
              <option value="Dev">Dev</option>
              <option value="Writer">Writer</option>
              <option value="VA">VA</option>
            </select>
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

          <button
            className="button button--ghost"
            type="button"
            onClick={handleBulkAutoFix}
            disabled={!selectedIds.length || bulkLoading}
            title="Generate suggestions for selected rows"
          >
            {bulkLoading ? "Generating…" : `Generate (bulk) (${selectedIds.length || 0})`}
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
            disabled={!selectedIds.length || bulkLoading}
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
              <th style={{ width: 240 }}>Actions</th>
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
                const busy = !!rowLoading[String(row.id)];
                const prettyIssues = issuesPretty(row.issues);
                const hasSuggestion = !!row.suggestedTitle || !!row.suggestedMetaDescription || !!row.suggestedH1;

                return (
                  <tr key={row.id} style={busy ? { opacity: 0.85 } : undefined}>
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
                        disabled={busy}
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
                              disabled={busy}
                            >
                              {busy ? "Generating…" : "Generate"}
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
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => handleApplySuggestion(row.id, "title", row.suggestedTitle)}
                              disabled={!row.suggestedTitle || busy}
                              title="Queue this to apply in Framer (plugin executes it)"
                            >
                              Apply
                            </button>
                          </div>

                          <div className="fq-suggest-row">
                            <div className="fq-suggest-label">Meta</div>
                            <div className="fq-suggest-value">{row.suggestedMetaDescription || "—"}</div>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => safeCopy(row.suggestedMetaDescription)}
                              disabled={!row.suggestedMetaDescription}
                            >
                              Copy
                            </button>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() =>
                                handleApplySuggestion(row.id, "metaDescription", row.suggestedMetaDescription)
                              }
                              disabled={!row.suggestedMetaDescription || busy}
                              title="Queue this to apply in Framer (plugin executes it)"
                            >
                              Apply
                            </button>
                          </div>

                          <div className="fq-suggest-row">
                            <div className="fq-suggest-label">H1</div>
                            <div className="fq-suggest-value">{row.suggestedH1 || "—"}</div>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => safeCopy(row.suggestedH1)}
                              disabled={!row.suggestedH1}
                            >
                              Copy
                            </button>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => handleApplySuggestion(row.id, "h1", row.suggestedH1)}
                              disabled={!row.suggestedH1 || busy}
                              title="Queue this to apply in Framer (plugin executes it)"
                            >
                              Apply
                            </button>
                          </div>

                          <div className="fq-sub">
                            Suggested:{" "}
                            {row.lastSuggestedAt ? new Date(row.lastSuggestedAt).toLocaleString() : "—"}
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
                          disabled={busy}
                        >
                          Notes
                        </button>

                        <button
                          className="button button--ghost button--tiny"
                          type="button"
                          onClick={() => handleDone(row.id)}
                          disabled={busy || row.status === "done"}
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
