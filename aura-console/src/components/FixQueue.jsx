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
  return `aura:fixQueue:${projectId || "unknown"}`;
}

export default function FixQueue({ coreUrl, projectId }) {
  const normalizedCoreUrl = useMemo(() => normaliseCoreUrl(coreUrl), [coreUrl]);

  // ---- persisted UI state per project ----
  const [statusFilter, setStatusFilter] = useState("open"); // open | done | all
  const [limit, setLimit] = useState(200);

  // hydrate persisted state when project changes
  useEffect(() => {
    if (!projectId) return;
    try {
      const raw = localStorage.getItem(lsKey(projectId));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (parsed.statusFilter) setStatusFilter(parsed.statusFilter);
        if (parsed.limit) setLimit(parsed.limit);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // persist whenever state changes
  useEffect(() => {
    if (!projectId) return;
    try {
      localStorage.setItem(
        lsKey(projectId),
        JSON.stringify({
          statusFilter,
          limit,
        })
      );
    } catch {
      // ignore
    }
  }, [projectId, statusFilter, limit]);

  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [selected, setSelected] = useState({});
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k)),
    [selected]
  );

  const [toast, setToast] = useState("");
  const toastTimerRef = useRef(null);

  const [rowBusy, setRowBusy] = useState({}); // { [id]: { owner?:bool, notes?:bool, done?:bool, autoFix?:bool, applyTitle?:bool, applyMeta?:bool, applyH1?:bool } }

  const endpoint = useMemo(() => {
    const q = new URLSearchParams();
    if (statusFilter) q.set("status", statusFilter);
    q.set("limit", String(limit));
    return `${normalizedCoreUrl}/projects/${projectId}/fix-queue?${q.toString()}`;
  }, [normalizedCoreUrl, projectId, statusFilter, limit]);

  const showToast = (msg) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(""), 1800);
  };

  const setBusy = (id, key, on) => {
    setRowBusy((prev) => ({
      ...prev,
      [String(id)]: {
        ...(prev[String(id)] || {}),
        [key]: !!on,
      },
    }));
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

  // -------- optimistic helpers (no refetch after PATCH) --------
  const updateItemLocal = (id, patch) => {
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
    );
  };

  const handleDone = async (id) => {
    setBusy(id, "done", true);

    // optimistic
    const before = items.find((x) => x.id === id);
    updateItemLocal(id, { status: "done", doneAt: new Date().toISOString() });

    try {
      await callJson(
        `${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/done`,
        { method: "POST" }
      );
      showToast("Marked done");
    } catch (e) {
      // rollback
      if (before) updateItemLocal(id, before);
      showToast(e?.message || "Failed to mark done");
    } finally {
      setBusy(id, "done", false);
    }
  };

  const handleBulkDone = async () => {
    if (!selectedIds.length) return;

    // optimistic: mark locally
    const beforeMap = new Map(items.map((x) => [x.id, x]));
    selectedIds.forEach((id) => {
      updateItemLocal(id, { status: "done", doneAt: new Date().toISOString() });
      setBusy(id, "done", true);
    });

    try {
      await callJson(
        `${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-done`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds }),
        }
      );
      showToast(`Done: ${selectedIds.length}`);
      setSelected({});
    } catch (e) {
      // rollback
      setItems((prev) =>
        prev.map((x) => (beforeMap.has(x.id) ? beforeMap.get(x.id) : x))
      );
      showToast(e?.message || "Failed bulk done");
    } finally {
      selectedIds.forEach((id) => setBusy(id, "done", false));
    }
  };

  const handleDedupe = async () => {
    try {
      const data = await callJson(
        `${normalizedCoreUrl}/projects/${projectId}/fix-queue/dedupe`,
        { method: "POST" }
      );
      showToast(`Deduped (deleted ${data?.deleted || 0})`);
      // dedupe changes result set, so refetch is correct here
      fetchQueue();
    } catch (e) {
      showToast(e?.message || "Failed to dedupe");
    }
  };

  const handleOwner = async (id, owner) => {
    setBusy(id, "owner", true);

    const before = items.find((x) => x.id === id);
    updateItemLocal(id, { owner: owner || null });

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner }),
      });
      showToast("Owner updated");
    } catch (e) {
      if (before) updateItemLocal(id, before);
      showToast(e?.message || "Failed to update owner");
    } finally {
      setBusy(id, "owner", false);
    }
  };

  const handleNotes = async (id) => {
    const current = items.find((x) => x.id === id);
    const existing = current?.notes || "";
    const next = window.prompt("Notes for this item:", existing);
    if (next === null) return;

    setBusy(id, "notes", true);

    const before = items.find((x) => x.id === id);
    updateItemLocal(id, { notes: next || null });

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: next }),
      });
      showToast("Notes saved");
    } catch (e) {
      if (before) updateItemLocal(id, before);
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
        { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }
      );

      // update locally from response (no refetch)
      updateItemLocal(id, {
        suggestedTitle: data?.suggestedTitle ?? null,
        suggestedMetaDescription: data?.suggestedMetaDescription ?? null,
        suggestedH1: data?.suggestedH1 ?? null,
        lastSuggestedAt: data?.lastSuggestedAt ?? new Date().toISOString(),
      });

      showToast("Suggestions generated");
    } catch (e) {
      showToast(e?.message || "Failed to generate suggestions");
    } finally {
      setBusy(id, "autoFix", false);
    }
  };

  const handleBulkAutoFix = async () => {
    if (!selectedIds.length) return;

    // mark all selected as busy
    selectedIds.forEach((id) => setBusy(id, "autoFix", true));

    try {
      const data = await callJson(
        `${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-auto-fix`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: selectedIds }),
        }
      );

      const results = Array.isArray(data?.results) ? data.results : [];
      // apply local updates
      results.forEach((r) => {
        if (!r || !r.id) return;
        updateItemLocal(Number(r.id), {
          suggestedTitle: r.suggestedTitle ?? null,
          suggestedMetaDescription: r.suggestedMetaDescription ?? null,
          suggestedH1: r.suggestedH1 ?? null,
          lastSuggestedAt: r.lastSuggestedAt ?? new Date().toISOString(),
        });
      });

      showToast(`Generated: ${results.length}`);
    } catch (e) {
      showToast(e?.message || "Failed bulk auto-fix");
    } finally {
      selectedIds.forEach((id) => setBusy(id, "autoFix", false));
    }
  };

  const handleApply = async (id, field) => {
    const key =
      field === "title"
        ? "applyTitle"
        : field === "meta"
        ? "applyMeta"
        : "applyH1";

    setBusy(id, key, true);

    try {
      const data = await callJson(
        `${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/apply`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field }),
        }
      );

      // Apply updates locally
      updateItemLocal(id, {
        status: data?.status ?? "open",
        notes: data?.notes ?? null,
        updatedAt: data?.updatedAt ?? new Date().toISOString(),
      });

      showToast(`Applied ${field}`);
    } catch (e) {
      showToast(e?.message || `Failed to apply ${field}`);
    } finally {
      setBusy(id, key, false);
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

          <button
            className="button button--ghost"
            type="button"
            onClick={handleDedupe}
          >
            Dedupe
          </button>

          <a
            className="button button--ghost"
            href={exportCsvUrl}
            target="_blank"
            rel="noreferrer"
          >
            Export CSV
          </a>
        </div>

        <div className="fq-right">
          <button
            className="button button--ghost"
            type="button"
            onClick={handleBulkAutoFix}
            disabled={!selectedIds.length}
            title="Generate suggestions for all selected items"
          >
            Generate selected ({selectedIds.length || 0})
          </button>

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
                  checked={
                    items.length ? items.every((r) => selected[String(r.id)]) : false
                  }
                  onChange={toggleAll}
                />
              </th>
              <th>URL</th>
              <th style={{ width: 220 }}>Issues</th>
              <th style={{ width: 160 }}>Owner</th>
              <th style={{ width: 160 }}>Added</th>
              <th style={{ width: 320 }}>Suggestions</th>
              <th style={{ width: 260 }}>Actions</th>
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
                const hasSuggestion =
                  !!row.suggestedTitle ||
                  !!row.suggestedMetaDescription ||
                  !!row.suggestedH1;

                const busy = rowBusy[String(row.id)] || {};

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
                      {row.notes ? (
                        <div className="fq-sub">Notes: {row.notes}</div>
                      ) : null}
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
                        disabled={!!busy.owner}
                        title={busy.owner ? "Updating…" : "Assign owner"}
                      >
                        <option value="">Unassigned</option>
                        <option value="Darren">Darren</option>
                        <option value="Dev">Dev</option>
                        <option value="Writer">Writer</option>
                        <option value="VA">VA</option>
                      </select>
                      {busy.owner ? (
                        <div className="fq-sub fq-muted">Saving…</div>
                      ) : null}
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
                          <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => handleAutoFix(row.id)}
                              disabled={!!busy.autoFix}
                            >
                              {busy.autoFix ? "Generating…" : "Generate"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="fq-suggest">
                          <div className="fq-suggest-row">
                            <div className="fq-suggest-label">Title</div>
                            <div className="fq-suggest-value">
                              {row.suggestedTitle || "—"}
                            </div>
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
                              onClick={() => handleApply(row.id, "title")}
                              disabled={!row.suggestedTitle || !!busy.applyTitle}
                              title="Apply suggestion to AURA records (audit logged)"
                            >
                              {busy.applyTitle ? "Applying…" : "Apply"}
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
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => handleApply(row.id, "meta")}
                              disabled={!row.suggestedMetaDescription || !!busy.applyMeta}
                              title="Apply suggestion to AURA records (audit logged)"
                            >
                              {busy.applyMeta ? "Applying…" : "Apply"}
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
                              onClick={() => handleApply(row.id, "h1")}
                              disabled={!row.suggestedH1 || !!busy.applyH1}
                              title="Apply suggestion to AURA records (audit logged)"
                            >
                              {busy.applyH1 ? "Applying…" : "Apply"}
                            </button>
                          </div>

                          <div className="fq-sub">
                            Suggested:{" "}
                            {row.lastSuggestedAt
                              ? new Date(row.lastSuggestedAt).toLocaleString()
                              : "—"}
                          </div>

                          <div style={{ marginTop: 8 }}>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => handleAutoFix(row.id)}
                              disabled={!!busy.autoFix}
                              title="Regenerate suggestions"
                            >
                              {busy.autoFix ? "Generating…" : "Regenerate"}
                            </button>
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
                          disabled={!!busy.notes}
                        >
                          {busy.notes ? "Saving…" : "Notes"}
                        </button>

                        <button
                          className="button button--ghost button--tiny"
                          type="button"
                          onClick={() => handleDone(row.id)}
                          disabled={row.status === "done" || !!busy.done}
                        >
                          {busy.done ? "Saving…" : "Done"}
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
