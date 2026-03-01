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
 .replace(/_/g, "")
 .toLowerCase()
 .replace(/^\w/, (c) => c.toUpperCase())
 );
}

function lsKey(projectId) {
 return `aura.fixQueue.ui.${projectId || "unknown"}`;
}

export default function FixQueue({ coreUrl, projectId }) {
 // Show message if no projectId
 if (!projectId) {
 return (
 <div className="card fixqueue-empty"style={{ minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center'}} role="region"aria-label="No Project Selected">
 <div>
 <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>No project selected</div>
 <div style={{ fontSize: 14, opacity: 0.8 }}>Connect or create a project to use the Fix Queue.</div>
 </div>
 </div>
 );
 }
 const normalizedCoreUrl = useMemo(() => normaliseCoreUrl(coreUrl), [coreUrl]);

 // ---------- Persisted UI state ----------
 const [statusFilter, setStatusFilter] = useState("open"); // open | done | all
 const [limit, setLimit] = useState(200);

 useEffect(() => {
 if (!projectId) return;
 try {
 const raw = localStorage.getItem(lsKey(projectId));
 if (!raw) return;
 const parsed = JSON.parse(raw);
 if (parsed.statusFilter) setStatusFilter(parsed.statusFilter);
 if (parsed.limit) setLimit(parsed.limit);
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
 })
 );
 } catch {}
 }, [projectId, statusFilter, limit]);

 // ---------- Data ----------
 const [status, setStatus] = useState("idle"); // idle | loading | ok | error
 const [error, setError] = useState("");
 const [items, setItems] = useState([]);

 const [selected, setSelected] = useState({});
 const selectedIds = useMemo(
 () =>Object.entries(selected).filter(([, v]) => v).map(([k]) =>Number(k)),
 [selected]
 );

 const [toast, setToast] = useState("");

 // per-row loading states
 const [rowBusy, setRowBusy] = useState({}); // { [id]: { owner?:bool, notes?:bool, done?:bool, gen?:bool, applyTitle?:bool, applyMeta?:bool, applyH1?:bool } }

 // bulk job UI
 const [bulkJob, setBulkJob] = useState(null); // { jobId, status, processed, total, okCount, failCount, lastError }
 const bulkPollRef = useRef(null);

 // job history
 const [jobsStatus, setJobsStatus] = useState("idle"); // idle | loading | ok | error
 const [jobsError, setJobsError] = useState("");
 const [jobs, setJobs] = useState([]);
 const [jobDetailOpen, setJobDetailOpen] = useState(null); // jobId string
 const [jobItems, setJobItems] = useState([]);
 const jobDetailPollRef = useRef(null);

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

 const fetchJobs = async () => {
 if (!normalizedCoreUrl || !projectId) return;
 setJobsStatus("loading");
 setJobsError("");

 try {
 const data = await callJson(
 `${normalizedCoreUrl}/projects/${projectId}/fix-queue/jobs?limit=20`,
 { method: "GET"}
 );
 setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
 setJobsStatus("ok");
 } catch (e) {
 setJobsStatus("error");
 setJobsError(e?.message || "Failed to load job history");
 setJobs([]);
 }
 };

 useEffect(() => {
 fetchQueue();
 fetchJobs();
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
 headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
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

 const toMark = new Set(selectedIds);
 setItems((prev) => {
 if (statusFilter === "open") return prev.filter((x) => !toMark.has(x.id));
 return prev.map((x) => (toMark.has(x.id) ? { ...x, status: "done"} : x));
 });
 setSelected({});
 showToast(`Done: ${selectedIds.length}`);

 try {
 await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-done`, {
 method: "POST",
 headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
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
 headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
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
 setItems((prev) => prev.map((x) => (x.id === id ? { ...x, owner } : x)));

 try {
 await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
 body: JSON.stringify({ owner }),
 });
 showToast("Owner updated");
 } catch (e) {
 showToast(e?.message || "Failed to update owner");
 setItems((prev) => prev.map((x) => (x.id === id ? { ...x, owner: before.owner || ""} : x)));
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
 setItems((prev) => prev.map((x) => (x.id === id ? { ...x, notes: next } : x)));

 try {
 await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
 body: JSON.stringify({ notes: next }),
 });
 showToast("Notes saved");
 } catch (e) {
 showToast(e?.message || "Failed to save notes");
 setItems((prev) => prev.map((x) => (x.id === id ? { ...x, notes: existing } : x)));
 } finally {
 setBusy(id, { notes: false });
 }
 };

 const handleAutoFix = async (id) => {
 setBusy(id, { gen: true });
 setItems((prev) => prev.map((x) => (x.id === id ? { ...x, _generating: true } : x)));

 try {
 const data = await callJson(
 `${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/auto-fix`,
 { method: "POST", headers: { "Content-Type": "application/json", "csrf-token": csrfToken }, body: JSON.stringify({}) }
 );

 const suggestedTitle = data?.suggestedTitle || data?.result?.suggestedTitle;
 const suggestedMetaDescription =
 data?.suggestedMetaDescription || data?.result?.suggestedMetaDescription;
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
 fetchJobs();
 } catch (e) {
 showToast(e?.message || "Failed to generate suggestions");
 setItems((prev) => prev.map((x) => (x.id === id ? { ...x, _generating: false } : x)));
 } finally {
 setBusy(id, { gen: false });
 }
 };

 // ---------- Apply suggestion (webhook) ----------

 const handleApply = async (id, field) => {
 const busyKey =
 field === "title"? "applyTitle": field === "metaDescription"? "applyMeta": "applyH1";

 setBusy(id, { [busyKey]: true });

 try {
 await callJson(`${normalizedCoreUrl}/projects/${projectId}/fix-queue/${id}/apply`, {
 method: "POST",
 headers: { "Content-Type": "application/json", "csrf-token": csrfToken },
 body: JSON.stringify({ field }),
 });
 showToast(`Applied ${field}`);
 fetchJobs(); // apply logs audit server-side; jobs list may not change but keep consistent
 } catch (e) {
 showToast(e?.message || "Failed to apply");
 } finally {
 setBusy(id, { [busyKey]: false });
 }
 };

 // ---------- Bulk auto-fix job (server-side) ----------

 const startBulkPoll = (jobId) => {
 if (bulkPollRef.current) clearInterval(bulkPollRef.current);

 bulkPollRef.current = setInterval(async () => {
 try {
 const data = await callJson(
 `${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-auto-fix/${jobId}`,
 { method: "GET"}
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
 fetchJobs();
 }
 } catch {
 // ignore poll errors
 }
 }, 1000);
 };

 useEffect(() => {
 return () => {
 if (bulkPollRef.current) clearInterval(bulkPollRef.current);
 if (jobDetailPollRef.current) clearInterval(jobDetailPollRef.current);
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
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({
 ids: selectedIds,
 // leave concurrency/delay defaults server-side (safe)
 }),
 });

 const jobId = data?.jobId || data?.result?.jobId;
 if (!jobId) throw new Error("No jobId returned");

 setBulkJob((prev) => ({ ...(prev || {}), jobId, status: "queued"}));
 showToast(`Bulk started (${selectedIds.length})`);
 startBulkPoll(jobId);
 fetchJobs();
 } catch (e) {
 showToast(e?.message || "Failed to start bulk auto-fix");
 setBulkJob(null);
 }
 };

 const handleCancelBulk = async () => {
 if (!bulkJob?.jobId || bulkJob.jobId === "starting") return;
 try {
 await callJson(
 `${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-auto-fix/${bulkJob.jobId}/cancel`,
 { method: "POST", headers: { "Content-Type": "application/json"} }
 );
 showToast("Cancelling");
 } catch (e) {
 showToast(e?.message || "Failed to cancel");
 }
 };

 // ---------- Job detail (history) ----------

 const openJobDetail = async (jobId) => {
 setJobDetailOpen(jobId);
 setJobItems([]);

 // poll job detail with items
 if (jobDetailPollRef.current) clearInterval(jobDetailPollRef.current);

 const poll = async () => {
 try {
 const data = await callJson(
 `${normalizedCoreUrl}/projects/${projectId}/fix-queue/bulk-auto-fix/${jobId}?includeItems=1&itemsLimit=200`,
 { method: "GET"}
 );
 const j = data?.job;
 if (j) {
 setBulkJob({
 jobId: j.jobId,
 status: j.status,
 total: j.total,
 processed: j.processed,
 okCount: j.okCount,
 failCount: j.failCount,
 lastError: j.lastError || "",
 });
 }
 setJobItems(Array.isArray(data?.items) ? data.items : []);
 if (j && ["done", "failed", "cancelled"].includes(j.status)) {
 // stop polling when finished
 if (jobDetailPollRef.current) {
 clearInterval(jobDetailPollRef.current);
 jobDetailPollRef.current = null;
 }
 }
 } catch {
 // ignore
 }
 };

 await poll();
 jobDetailPollRef.current = setInterval(poll, 1200);
 };

 const closeJobDetail = () => {
 setJobDetailOpen(null);
 setJobItems([]);
 if (jobDetailPollRef.current) {
 clearInterval(jobDetailPollRef.current);
 jobDetailPollRef.current = null;
 }
 };

 const exportCsvUrl = useMemo(() => {
 const q = new URLSearchParams();
 q.set("status", statusFilter || "open");
 return `${normalizedCoreUrl}/projects/${projectId}/fix-queue/export.csv?${q.toString()}`;
 }, [normalizedCoreUrl, projectId, statusFilter]);

 return (
 <div className="fq-wrap">
 {status === "error"&& (
 <div className="card fixqueue-error"style={{ minHeight: 120, marginBottom: 16 }} role="region"aria-label="Fix Queue Error">
 <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Could not load Fix Queue</div>
 <div style={{ fontSize: 13, opacity: 0.85 }}>{error || "Unknown error"}</div>
 </div>
 )}
 <div className="fq-toolbar">
 <div className="fq-left">
 <div className="fq-filter">
 <div className="fq-label"title="Show only open, done, or all items in your Fix Queue">Status
 <span style={{color:'#4f46e5',marginLeft:4,cursor:'help'}} title="Filter your Fix Queue by status. 'Open'means not fixed yet; 'Done'means already fixed.">?</span>
 </div>
 <select
 className="fq-select"value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 title="Filter by item status (open, done, all)">
 <option value="open">Open</option>
 <option value="done">Done</option>
 <option value="all">All</option>
 </select>
 </div>

 <div className="fq-filter">
 <div className="fq-label"title="How many items to show at once">Limit
 <span style={{color:'#4f46e5',marginLeft:4,cursor:'help'}} title="Set the maximum number of Fix Queue items to display.">?</span>
 </div>
 <input
 className="fq-input"type="number"min={1}
 max={1000}
 value={limit}
 onChange={(e) => setLimit(Number(e.target.value))}
 title="Maximum number of Fix Queue items to show"/>
 </div>

 <button className="button button--ghost"type="button"onClick={fetchQueue} disabled={status === "loading"} title="Refresh the Fix Queue with the latest data from your store.">
 {status === "loading"? "Refreshing": "Refresh"}
 </button>

 <button className="button button--ghost"type="button"onClick={handleDedupe} title="Remove duplicate items from your Fix Queue.">
 Dedupe
 </button>

 <button className="button button--ghost"type="button"onClick={fetchJobs} disabled={jobsStatus === "loading"} title="Refresh the job history below.">
 {jobsStatus === "loading"? "Loading jobs": "Refresh jobs"}
 </button>

 <a className="button button--ghost"href={exportCsvUrl} target="_blank"rel="noreferrer"title="Export your Fix Queue as a CSV file for further analysis or sharing.">
 Export CSV
 </a>
 </div>

 <div className="fq-right"style={{ display: "flex", gap: 10, alignItems: "center"}}>
 <button
 className="button button--ghost"type="button"onClick={handleBulkAutoFix}
 disabled={!selectedIds.length || (bulkJob && ["queued", "running"].includes(bulkJob.status))}
 title="Generate suggestions for all selected items (server-side job). This will use AI to suggest fixes for each issue.">
 Generate selected ({selectedIds.length || 0})
 </button>

 <button
 className="button button--primary"type="button"onClick={handleBulkDone}
 disabled={!selectedIds.length}
 title="Mark all selected items as done. Use this when you've fixed multiple issues at once.">
 Done selected ({selectedIds.length || 0})
 </button>
 </div>
 </div>

 {toast ? <div className="fq-toast">{toast}</div> : null}

 {/* Job history */}
 <div className="fq-sub"style={{ marginBottom: 10 }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap"}}>
 <div>
 <strong>Job history</strong>{""}
 <span className="fq-muted">(last 20)</span>
 </div>
 {jobsStatus === "error"? <span className="fq-muted">Error: {jobsError}</span> : null}
 </div>

 {!jobs.length ? (
 <div className="fq-muted"style={{ marginTop: 6 }}>
 No jobs yet. Run Generate selected to create one.
 </div>
 ) : (
 <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
 {jobs.slice(0, 8).map((j) => (
 <div
 key={j.jobId}
 style={{
 display: "flex",
 justifyContent: "space-between",
 gap: 10,
 flexWrap: "wrap",
 alignItems: "center",
 padding: "8px 10px",
 borderRadius: 12,
 border: "1px solid rgba(148, 163, 184, 0.12)",
 background: "rgba(2, 6, 23, 0.35)",
 }}
 >
 <div>
 <span className="fq-mono">{j.jobId}</span>{""}
 <span className="fq-muted">({j.status})</span>{""}
 <span className="fq-muted">
 · {j.processed}/{j.total} · ok {j.okCount} · fail {j.failCount}
 </span>
 </div>

 <div style={{ display: "flex", gap: 8, alignItems: "center"}}>
 <button
 className="button button--ghost button--tiny"type="button"onClick={() => openJobDetail(j.jobId)}
 >
 View
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Job detail modal-ish */}
 {jobDetailOpen ? (
 <div className="fq-table-wrap"style={{ marginBottom: 12 }}>
 <div className="card fixqueue-job-detail-header"style={{ borderBottom: "1px solid rgba(148, 163, 184, 0.1)"}} role="region"aria-label="Job Detail Header">
 <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap"}}>
 <div>
 <strong>Job:</strong> <span className="fq-mono">{jobDetailOpen}</span>
 {bulkJob?.status ? <span className="fq-muted"> ({bulkJob.status})</span> : null}
 </div>

 <div style={{ display: "flex", gap: 8, alignItems: "center"}}>
 {bulkJob && ["queued", "running"].includes(bulkJob.status) ? (
 <button className="button button--ghost button--tiny"type="button"onClick={handleCancelBulk}>
 Cancel
 </button>
 ) : null}

 <button className="button button--ghost button--tiny"type="button"onClick={closeJobDetail}>
 Close
 </button>
 </div>
 </div>

 {bulkJob ? (
 <div className="fq-muted"style={{ marginTop: 6 }}>
 {bulkJob.processed}/{bulkJob.total} processed · {bulkJob.okCount} ok · {bulkJob.failCount} failed
 {bulkJob.lastError ? <> · last error: {bulkJob.lastError}</> : null}
 </div>
 ) : null}
 </div>

 <div className="card fixqueue-job-detail-body"role="region"aria-label="Job Detail Body">
 {!jobItems.length ? (
 <div className="fq-muted">No job items loaded yet</div>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {jobItems.slice(0, 50).map((it) => (
 <div
 key={it.itemId}
 className="card fixqueue-job-item"role="region"aria-label={`Job Item ${it.itemId}`}
 >
 <div>
 <span className="fq-mono">#{it.itemId}</span>{""}
 <span className="fq-muted">({it.status})</span>
 {it.error ? <div className="fq-muted">Error: {it.error}</div> : null}
 </div>
 <div style={{ display: "flex", gap: 8 }}>
 {it.suggestedTitle ? (
 <button className="button button--ghost button--tiny"type="button"onClick={() => safeCopy(it.suggestedTitle)}>
 Copy title
 </button>
 ) : null}
 {it.suggestedMetaDescription ? (
 <button className="button button--ghost button--tiny"type="button"onClick={() => safeCopy(it.suggestedMetaDescription)}>
 Copy meta
 </button>
 ) : null}
 {it.suggestedH1 ? (
 <button className="button button--ghost button--tiny"type="button"onClick={() => safeCopy(it.suggestedH1)}>
 Copy H1
 </button>
 ) : null}
 </div>
 </div>
 ))}
 {jobItems.length > 50 ? <div className="fq-muted">Showing first 50 items.</div> : null}
 </div>
 )}
 </div>
 </div>
 ) : null}

 {bulkJob ? (
 <div className="fq-sub"style={{ marginBottom: 10 }}>
 <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap"}}>
 <div>
 <strong>Active bulk job:</strong>{""}
 <span className="fq-mono">{bulkJob.jobId}</span>{""}
 <span className="fq-muted">({bulkJob.status})</span>
 </div>
 <div>
 {bulkJob.processed}/{bulkJob.total} processed · {bulkJob.okCount} ok · {bulkJob.failCount} failed
 {bulkJob.lastError ? <span className="fq-muted"> · last error: {bulkJob.lastError}</span> : null}
 </div>
 {["queued", "running"].includes(bulkJob.status) ? (
 <button className="button button--ghost button--tiny"type="button"onClick={handleCancelBulk}>
 Cancel
 </button>
 ) : (
 <button className="button button--ghost button--tiny"type="button"onClick={() => setBulkJob(null)}>
 Dismiss
 </button>
 )}
 </div>
 </div>
 ) : null}

 {status === "error"&& (
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
 type="checkbox"checked={items.length ? items.every((r) => selected[String(r.id)]) : false}
 onChange={toggleAll}
 />
 </th>
 <th>URL</th>
 <th style={{ width: 220 }}>Issues</th>
 <th style={{ width: 160 }}>Owner</th>
 <th style={{ width: 160 }}>Added</th>
 <th style={{ width: 280 }}>Auto-fix suggestions</th>
 <th style={{ width: 260 }}>Actions</th>
 </tr>
 </thead>

 <tbody>
 {status === "loading"&& !items.length ? (
 <tr>
 <td colSpan={7} className="fq-empty">
 Loading Fix Queue
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

 const hasSuggestion =
 !!row.suggestedTitle || !!row.suggestedMetaDescription || !!row.suggestedH1;

 const busy = rowBusy[String(row.id)] || {};
 const generating = !!row._generating || !!busy.gen;

 return (
 <tr key={row.id}>
 <td>
 <input
 type="checkbox"checked={!!selected[String(row.id)]}
 onChange={(e) => setRowSelected(row.id, e.target.checked)}
 />
 </td>

 <td className="fq-url">
 <a href={row.url} target="_blank"rel="noreferrer">
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
 <span className="fq-muted"></span>
 )}
 </td>

 <td>
 <select
 className="fq-select"value={row.owner || ""}
 onChange={(e) => handleOwner(row.id, e.target.value)}
 disabled={!!busy.owner}
 title={busy.owner ? "Updating": "Owner"}
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
 {row.createdAt ? new Date(row.createdAt).toLocaleString() : ""}
 </div>
 </td>

 <td>
 {!hasSuggestion ? (
 <div className="fq-muted">
 {generating ? "Generating": "No suggestion yet."}
 <div style={{ marginTop: 6 }}>
 <button
 className="button button--ghost button--tiny"type="button"onClick={() => handleAutoFix(row.id)}
 disabled={generating}
 >
 {generating ? "Generating": "Generate"}
 </button>
 </div>

 <div className="fq-sub"style={{ marginTop: 6 }}>
 Last suggested:{""}
 {suggestedAt ? new Date(suggestedAt).toLocaleString() : ""}
 </div>
 </div>
 ) : (
 <div className="fq-suggest">
 <div className="fq-suggest-row">
 <div className="fq-suggest-label">Title</div>
 <div className="fq-suggest-value">{row.suggestedTitle || ""}</div>
 <button
 className="button button--ghost button--tiny"type="button"onClick={() => safeCopy(row.suggestedTitle)}
 disabled={!row.suggestedTitle}
 >
 Copy
 </button>
 <button
 className="button button--ghost button--tiny"type="button"onClick={() => handleApply(row.id, "title")}
 disabled={!row.suggestedTitle || !!busy.applyTitle}
 title="Apply Title via webhook">
 {busy.applyTitle ? "Applying": "Apply"}
 </button>
 </div>

 <div className="fq-suggest-row">
 <div className="fq-suggest-label">Meta</div>
 <div className="fq-suggest-value">{row.suggestedMetaDescription || ""}</div>
 <button
 className="button button--ghost button--tiny"type="button"onClick={() => safeCopy(row.suggestedMetaDescription)}
 disabled={!row.suggestedMetaDescription}
 >
 Copy
 </button>
 <button
 className="button button--ghost button--tiny"type="button"onClick={() => handleApply(row.id, "metaDescription")}
 disabled={!row.suggestedMetaDescription || !!busy.applyMeta}
 title="Apply Meta via webhook">
 {busy.applyMeta ? "Applying": "Apply"}
 </button>
 </div>

 <div className="fq-suggest-row">
 <div className="fq-suggest-label">H1</div>
 <div className="fq-suggest-value">{row.suggestedH1 || ""}</div>
 <button
 className="button button--ghost button--tiny"type="button"onClick={() => safeCopy(row.suggestedH1)}
 disabled={!row.suggestedH1}
 >
 Copy
 </button>
 <button
 className="button button--ghost button--tiny"type="button"onClick={() => handleApply(row.id, "h1")}
 disabled={!row.suggestedH1 || !!busy.applyH1}
 title="Apply H1 via webhook">
 {busy.applyH1 ? "Applying": "Apply"}
 </button>
 </div>

 <div className="fq-sub">
 Last suggested:{""}
 {suggestedAt ? new Date(suggestedAt).toLocaleString() : ""}
 </div>
 </div>
 )}
 </td>

 <td>
 <div className="fq-action-row">
 <button
 className="button button--ghost button--tiny"type="button"onClick={() => safeCopy(row.url)}
 >
 Copy URL
 </button>

 <button
 className="button button--ghost button--tiny"type="button"onClick={() => handleNotes(row.id)}
 disabled={!!busy.notes}
 >
 {busy.notes ? "Saving": "Notes"}
 </button>

 <button
 className="button button--ghost button--tiny"type="button"onClick={() => handleDone(row.id)}
 disabled={row.status === "done"|| !!busy.done}
 >
 {busy.done ? "": "Done"}
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
