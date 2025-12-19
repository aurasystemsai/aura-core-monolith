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
  return `aura.fixQueue.ui.${projectId || "unknown"}`;
}

export default function FixQueue({ coreUrl, projectId }) {
  const normalizedCoreUrl = useMemo(() => normaliseCoreUrl(coreUrl), [coreUrl]);

  // Tag audit trail with a consistent actor (you can change this later to be dynamic)
  const updatedBy = "Darren";

  // ---------- Persisted UI state ----------
  const [statusFilter, setStatusFilter] = useState("open"); // open | done | all
  const [limit, setLimit] = useState(200);

  // Optional bulk controls (safe defaults)
  const [bulkConcurrency, setBulkConcurrency] = useState(1);
  const [bulkDelayMs, setBulkDelayMs] = useState(750);

  useEffect(() => {
    if (!projectId) return;
    try {
      const raw = localStorage.getItem(lsKey(projectId));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.statusFilter) setStatusFilter(parsed.statusFilter);
      if (parsed.limit) setLimit(parsed.limit);
      if (parsed.bulkConcurrency) setBulkConcurrency(Number(parsed.bulkConcurrency) || 1);
      if (parsed.bulkDelayMs !== undefined) setBulkDelayMs(Number(parsed.bulkDelayMs) || 0);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    try {
      localStorage.setItem(
        lsKey(projectId),
        JSON.stringify({
          statusFilter,
          limit,
          bulkConcurrency,
          bulkDelayMs,
        })
      );
    } catch {}
  }, [projectId, statusFilter, limit, bulkConcurrency, bulkDelayMs]);

  // ---------- Data ----------
  const [status, setStatus] = useState("idle"); // idle | loading | ok | error
  const [error, setError] = useState("");
  const [items, setItems] = useState([]);

  const [selected, setSelected] = useState({});
  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => Number(k)),
    [selected]
  );

  const [toast, setToast] = useState("");

  // per-row loading states
  const [rowBusy, setRowBusy] = useState({}); // { [id]: { owner?:bool, notes?:bool, done?:bool, gen?:bool } }

  // bulk job UI
  const [bulkJob, setBulkJob] = useState(null); // { jobId, status, processed, total, okCount, failCount }
  const bulkPollRef = useRef(null);

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

  const baseHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-aura-updated-by": updatedBy,
    }),
    [updatedBy]
  );

  const callJson = async (url, opts) => {
    const res = await fetch(url, opts);
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

  const setBusy = (id, patch) => {
    setRowBusy((prev) => ({
      ...prev,
      [String(id)]: { ...(prev[String(id)] || {}), ...patch },
    }));
  };

  // ---------- Optimistic actions ----------

  const handleDone = async (id) => {
    const row = items.find((x) => x.id === id);
    if (!row) return;

    setBusy(id, { done: true });

    // optimistic: mark done immediately
    setItems((prev) =>
      prev.map((x) => (x.id === id ? { ...x, status: "done", doneAt: new Date().toISOString() } : x))
    );

    // if filtering open, remove it from view immediately
    if (statusFilter === "open") {
      setItems((prev) => prev.filter((x) => x.id !== id));
      setSelected((prev) => {
        const next = { ...prev };
        delete next[String(id)];
        return next;
      });
    }

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/done`, {
        method: "POST",
        headers: baseHeaders,
      });
      showToast("Marked done");
    } catch (e) {
      showToast(e?.message || "Failed to mark done");
      await fetchQueue();
    } finally {
      setBusy(id, { done: false });
    }
  };

  const handleBulkDone = async () => {
    if (!selectedIds.length) return;

    // optimistic: remove from list if open filter
    const toMark = new Set(selectedIds);
    setItems((prev) => {
      if (statusFilter === "open") return prev.filter((x) => !toMark.has(x.id));
      return prev.map((x) => (toMark.has(x.id) ? { ...x, status: "done" } : x));
    });
    setSelected({});
    showToast(`Done: ${selectedIds.length}`);

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-done`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({ ids: selectedIds }),
      });
    } catch (e) {
      showToast(e?.message || "Failed bulk done");
      await fetchQueue();
    }
  };

  const handleDedupe = async () => {
    try {
      const data = await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/dedupe`, {
        method: "POST",
        headers: baseHeaders,
      });
      showToast(`Deduped (deleted ${data?.deleted || 0})`);
      fetchQueue();
    } catch (e) {
      showToast(e?.message || "Failed to dedupe");
    }
  };

  const handleOwner = async (id, owner) => {
    const before = items.find((x) => x.id === id);
    if (!before) return;

    setBusy(id, { owner: true });

    // optimistic
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, owner } : x)));

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
        method: "PATCH",
        headers: baseHeaders,
        body: JSON.stringify({ owner }),
      });
      showToast("Owner updated");
    } catch (e) {
      showToast(e?.message || "Failed to update owner");
      // revert
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, owner: before.owner || "" } : x)));
    } finally {
      setBusy(id, { owner: false });
    }
  };

  const handleNotes = async (id) => {
    const current = items.find((x) => x.id === id);
    const existing = current?.notes || "";
    const next = window.prompt("Notes for this item:", existing);
    if (next === null) return;

    setBusy(id, { notes: true });

    // optimistic
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, notes: next } : x)));

    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
        method: "PATCH",
        headers: baseHeaders,
        body: JSON.stringify({ notes: next }),
      });
      showToast("Notes saved");
    } catch (e) {
      showToast(e?.message || "Failed to save notes");
      // revert
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, notes: existing } : x)));
    } finally {
      setBusy(id, { notes: false });
    }
  };

  const handleAutoFix = async (id) => {
    setBusy(id, { gen: true });

    // optimistic: show "Generating…" by setting a temporary flag
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, _generating: true } : x)));

    try {
      const data = await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/auto-fix`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({}),
      });

      const suggestedTitle = data?.suggestedTitle || data?.result?.suggestedTitle;
      const suggestedMetaDescription = data?.suggestedMetaDescription || data?.result?.suggestedMetaDescription;
      const suggestedH1 = data?.suggestedH1 || data?.result?.suggestedH1;
      const suggestedAt = data?.suggestedAt || data?.result?.suggestedAt || new Date().toISOString();

      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                suggestedTitle: suggestedTitle || x.suggestedTitle,
                suggestedMetaDescription: suggestedMetaDescription || x.suggestedMetaDescription,
                suggestedH1: suggestedH1 || x.suggestedH1,
                suggestedAt,
                lastSuggestedAt: suggestedAt,
                _generating: false,
              }
            : x
        )
      );

      showToast("Suggestions generated");
    } catch (e) {
      showToast(e?.message || "Failed to generate suggestions");
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, _generating: false } : x)));
    } finally {
      setBusy(id, { gen: false });
    }
  };

  // ---------- Bulk auto-fix job (server-side) ----------

  const startBulkPoll = (jobId) => {
    if (bulkPollRef.current) clearInterval(bulkPollRef.current);

    bulkPollRef.current = setInterval(async () => {
      try {
        const data = await callJson(
          `${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-auto-fix/${jobId}`,
          { method: "GET" }
        );
        const j = data?.job;
        if (!j) return;

        setBulkJob({
          jobId: j.jobId,
          status: j.status,
          total: j.total,
          processed: j.processed,
          okCount: j.okCount,
          failCount: j.failCount,
          lastError: j.lastError || "",
        });

        if (["done", "failed", "cancelled"].includes(j.status)) {
          clearInterval(bulkPollRef.current);
          bulkPollRef.current = null;

          if (j.status === "done") showToast(`Bulk complete: ${j.okCount} ok, ${j.failCount} failed`);
          if (j.status === "failed") showToast(`Bulk failed: ${j.lastError || "unknown error"}`);
          if (j.status === "cancelled") showToast(`Bulk cancelled`);

          fetchQueue();
        }
      } catch {
        // ignore poll errors (temporary)
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (bulkPollRef.current) clearInterval(bulkPollRef.current);
    };
  }, []);

  const handleBulkAutoFix = async () => {
    if (!selectedIds.length) return;

    setBulkJob({
      jobId: "starting",
      status: "queued",
      total: selectedIds.length,
      processed: 0,
      okCount: 0,
      failCount: 0,
      lastError: "",
    });

    try {
      const data = await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-auto-fix`, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify({
          ids: selectedIds,
          concurrency: bulkConcurrency,
          delayMs: bulkDelayMs,
        }),
      });

      const jobId = data?.jobId || data?.result?.jobId;
      if (!jobId) throw new Error("No jobId returned");

      setBulkJob((prev) => ({
        ...(prev || {}),
        jobId,
        status: "queued",
      }));

      showToast(`Bulk started (${selectedIds.length})`);
      startBulkPoll(jobId);
    } catch (e) {
      showToast(e?.message || "Failed to start bulk auto-fix");
      setBulkJob(null);
    }
  };

  const handleCancelBulk = async () => {
    if (!bulkJob?.jobId || bulkJob.jobId === "starting") return;
    try {
      await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-auto-fix/${bulkJob.jobId}/cancel`, {
        method: "POST",
        headers: baseHeaders,
      });
      showToast("Cancelling…");
    } catch (e) {
      showToast(e?.message || "Failed to cancel");
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
            <select className="fq-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
              onChange={(e) => setLimit(Number(e.target.value))}
            />
          </div>

          <button className="button button--ghost" type="button" onClick={fetchQueue} disabled={status === "loading"}>
            {status === "loading" ? "Refreshing…" : "Refresh"}
          </button>

          <button className="button button--ghost" type="button" onClick={handleDedupe}>
            Dedupe
          </button>

          <a className="button button--ghost" href={exportCsvUrl} target="_blank" rel="noreferrer">
            Export CSV
          </a>
        </div>

        <div className="fq-right" style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div className="fq-filter" style={{ minWidth: 140 }}>
            <div className="fq-label">Bulk concurrency</div>
            <input
              className="fq-input"
              type="number"
              min={1}
              max={3}
              value={bulkConcurrency}
              onChange={(e) => setBulkConcurrency(Number(e.target.value))}
            />
          </div>

          <div className="fq-filter" style={{ minWidth: 140 }}>
            <div className="fq-label">Delay (ms)</div>
            <input
              className="fq-input"
              type="number"
              min={0}
              max={5000}
              value={bulkDelayMs}
              onChange={(e) => setBulkDelayMs(Number(e.target.value))}
            />
          </div>

          <button
            className="button button--ghost"
            type="button"
            onClick={handleBulkAutoFix}
            disabled={!selectedIds.length || (bulkJob && ["queued", "running"].includes(bulkJob.status))}
            title="Generate suggestions for all selected items (server-side job)"
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

      {bulkJob ? (
        <div className="fq-sub" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <strong>Bulk job:</strong> <span className="fq-mono">{bulkJob.jobId}</span>{" "}
              <span className="fq-muted">({bulkJob.status})</span>
            </div>
            <div>
              {bulkJob.processed}/{bulkJob.total} processed · {bulkJob.okCount} ok · {bulkJob.failCount} failed
              {bulkJob.lastError ? <span className="fq-muted"> · last error: {bulkJob.lastError}</span> : null}
            </div>
            {["queued", "running"].includes(bulkJob.status) ? (
              <button className="button button--ghost button--tiny" type="button" onClick={handleCancelBulk}>
                Cancel
              </button>
            ) : (
              <button className="button button--ghost button--tiny" type="button" onClick={() => setBulkJob(null)}>
                Dismiss
              </button>
            )}
          </div>
        </div>
      ) : null}

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
                const suggestedAt = row.suggestedAt || row.lastSuggestedAt || null;

                const hasSuggestion = !!row.suggestedTitle || !!row.suggestedMetaDescription || !!row.suggestedH1;

                const busy = rowBusy[String(row.id)] || {};
                const generating = !!row._generating || !!busy.gen;

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
                        disabled={!!busy.owner}
                        title={busy.owner ? "Updating…" : "Owner"}
                      >
                        <option value="">Unassigned</option>
                        <option value="Darren">Darren</option>
                        <option value="Dev">Dev</option>
                        <option value="Writer">Writer</option>
                        <option value="VA">VA</option>
                      </select>
                    </td>

                    <td>
                      <div className="fq-date">{row.createdAt ? new Date(row.createdAt).toLocaleString() : "—"}</div>
                    </td>

                    <td>
                      {!hasSuggestion ? (
                        <div className="fq-muted">
                          {generating ? "Generating…" : "No suggestion yet."}
                          <div style={{ marginTop: 6 }}>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => handleAutoFix(row.id)}
                              disabled={generating}
                            >
                              {generating ? "Generating…" : "Generate"}
                            </button>
                          </div>

                          <div className="fq-sub" style={{ marginTop: 6 }}>
                            Last suggested: {suggestedAt ? new Date(suggestedAt).toLocaleString() : "—"}
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
                            <div className="fq-suggest-value">{row.suggestedMetaDescription || "—"}</div>
                            <button
                              className="button button--ghost button--tiny"
                              type="button"
                              onClick={() => safeCopy(row.suggestedMetaDescription)}
                              disabled={!row.suggestedMetaDescription}
                            >
                              Copy
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
                          </div>

                          <div className="fq-sub">
                            Last suggested: {suggestedAt ? new Date(suggestedAt).toLocaleString() : "—"}
                          </div>
                        </div>
                      )}
                    </td>

                    <td>
                      <div className="fq-action-row">
                        <button className="button button--ghost button--tiny" type="button" onClick={() => safeCopy(row.url)}>
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
                          {busy.done ? "…" : "Done"}
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
