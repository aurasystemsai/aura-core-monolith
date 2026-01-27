import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "collab-approvals:draft";
const WORKFLOW_PRESETS = [
  { id: "multi-approver", name: "Multi-approver", badge: "dev", workflow: "Submit -> Manager approves -> Legal signs -> Notify Slack #approvals" },
  { id: "deal-desk", name: "Deal Desk", badge: "dev", workflow: "AE submits > Deal Desk review > Finance signoff > Salesforce update" },
  { id: "content", name: "Content QA", badge: "dev", workflow: "Draft -> Editor review -> Brand QA -> Publish -> Retro" }
];

export default function CollaborationApprovalWorkflows() {
  const [workflow, setWorkflow] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  // Dark mode enforced, no toggle
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [env, setEnv] = useState("dev");
  const [draftStatus, setDraftStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [preflightIssues, setPreflightIssues] = useState([]);
  const [confirmationNote, setConfirmationNote] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("multi-approver");
  const [lastBuiltSnapshot, setLastBuiltSnapshot] = useState(null);
  const [role] = useState(() => {
    if (typeof window === "undefined") return "admin";
    return window.__AURA_USER?.role || window.localStorage.getItem("aura-role") || "admin";
  });
  const [accessRequested, setAccessRequested] = useState(false);
  const [dirtySinceSave, setDirtySinceSave] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const goBackToSuite = () => {
    if (typeof window !== "undefined" && typeof window.__AURA_TO_SUITE === "function") {
      window.__AURA_TO_SUITE("workflows");
    }
  };

  const handleManualSave = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      workflow,
      env,
      confirmationNote,
      selectedPreset,
      lastSavedAt: Date.now()
    }));
    setDraftStatus("saved");
    setLastSavedAt(Date.now());
    setDirtySinceSave(false);
  };

  const runPreflight = () => {
    const issues = [];
    if (!workflow.trim()) issues.push("Add a workflow description before building.");
    if (env === "prod" && !confirmationNote.trim()) issues.push("Add a prod confirmation note (who approved, intent).");
    if (workflow.length < 12) issues.push("Workflow is too short; add steps/owners.");
    setPreflightIssues(issues);
    return issues;
  };

  const handleBuild = async () => {
    if (isViewer) return setError("View-only mode: request access to build.");
    const issues = runPreflight();
    if (issues.length) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/collaboration-approval-workflows/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result);
      setLastBuiltSnapshot({ workflow, env, ts: Date.now() });
      setHistory(prev => [{ workflow, result: data.result }, ...prev].slice(0, 10));
      setDirtySinceSave(false);
      dirtySkipRef.current = true;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onboardingContent = (
    <div style={{ padding: 24, background: "#23263a", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Collaboration & Approval Workflows</h3>
      <ul style={{ margin: "16px 0 0 18px", color: "#a3e635", fontSize: 16 }}>
        <li>Design approval and collaboration workflows</li>
        <li>Integrate with Slack, email, and project tools</li>
        <li>Export, share, and review workflow history</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  // Flagship enhancements
  const [workflows, setWorkflows] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();
  const hydratedRef = useRef(false);
  const dirtySkipRef = useRef(true);

  const isViewer = role === "viewer";

  const snapshotState = () => ({
    workflow,
    env,
    confirmationNote,
    selectedPreset,
    lastBuiltSnapshot,
    history,
    result
  });

  const pushUndoSnapshot = () => {
    setUndoStack(prev => [...prev.slice(-9), JSON.parse(JSON.stringify(snapshotState()))]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack(r => [...r.slice(-9), JSON.parse(JSON.stringify(snapshotState()))]);
    setWorkflow(prev.workflow || "");
    setEnv(prev.env || "dev");
    setConfirmationNote(prev.confirmationNote || "");
    setSelectedPreset(prev.selectedPreset || "multi-approver");
    setLastBuiltSnapshot(prev.lastBuiltSnapshot || null);
    setHistory(prev.history || []);
    setResult(prev.result || null);
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack(u => [...u.slice(-9), JSON.parse(JSON.stringify(snapshotState()))]);
    setWorkflow(next.workflow || "");
    setEnv(next.env || "dev");
    setConfirmationNote(next.confirmationNote || "");
    setSelectedPreset(next.selectedPreset || "multi-approver");
    setLastBuiltSnapshot(next.lastBuiltSnapshot || null);
    setHistory(next.history || []);
    setResult(next.result || null);
  };

  const handleInputChange = (setter, parser = v => v) => e => {
    if (isViewer) {
      setError("View-only mode — request edit access to modify.");
      return;
    }
    pushUndoSnapshot();
    setter(parser(e.target.value));
  };

  const handleDirectChange = (setter, parser = v => v) => value => {
    if (isViewer) {
      setError("View-only mode — request edit access to modify.");
      return;
    }
    pushUndoSnapshot();
    setter(parser(value));
  };

  // Fetch workflows
  const fetchWorkflows = async () => {
    try {
      const res = await fetch("/api/collaboration-approval-workflows/workflows");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setWorkflows(data.workflows || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch approvals
  const fetchApprovals = async () => {
    try {
      const res = await fetch("/api/collaboration-approval-workflows/approvals");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setApprovals(data.approvals || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Import/Export
  const handleImport = e => {
    if (isViewer) return setError("View-only mode: request access to import.");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      pushUndoSnapshot();
      setWorkflows(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    if (isViewer) return setError("View-only mode: request access to export.");
    const blob = new Blob([JSON.stringify({ workflows, approvals }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    if (isViewer) return setError("View-only mode: request access to send feedback edits.");
    setError("");
    try {
      await fetch("/api/collaboration-approval-workflows/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.workflow) setWorkflow(parsed.workflow);
        if (parsed.env) setEnv(parsed.env);
        if (parsed.confirmationNote) setConfirmationNote(parsed.confirmationNote);
        if (parsed.selectedPreset) setSelectedPreset(parsed.selectedPreset);
        if (parsed.lastSavedAt) setLastSavedAt(parsed.lastSavedAt);
        dirtySkipRef.current = true;
        setDirtySinceSave(false);
      } catch (err) {
        console.warn("Failed to load draft", err);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDraftStatus("saving");
    const handle = setTimeout(() => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        workflow,
        env,
        confirmationNote,
        selectedPreset,
        lastSavedAt: Date.now()
      }));
      setDraftStatus("saved");
      setLastSavedAt(Date.now());
      setDirtySinceSave(false);
    }, 400);
    return () => clearTimeout(handle);
  }, [workflow, env, confirmationNote, selectedPreset]);

  useEffect(() => {
    const listener = e => {
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleBuild();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") || (e.ctrlKey && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        handleRedo();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      if (e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        runPreflight();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [workflow, env, confirmationNote, undoStack, redoStack]);

  const diffSummary = useMemo(() => {
    if (!lastBuiltSnapshot) return null;
    const delta = workflow.length - (lastBuiltSnapshot.workflow?.length || 0);
    return { delta, at: lastBuiltSnapshot.ts };
  }, [workflow, lastBuiltSnapshot]);

  const formatTime = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    if (dirtySkipRef.current) {
      dirtySkipRef.current = false;
      return;
    }
    setDirtySinceSave(true);
  }, [workflow, env, confirmationNote, selectedPreset]);

  useEffect(() => {
    const handler = (e) => {
      if (dirtySinceSave || preflightIssues.length) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirtySinceSave, preflightIssues.length]);

  return (
    <div style={{
      
      margin: "40px auto",
      background: "#18181b",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: "#a3e635",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button onClick={goBackToSuite} style={{ background: "transparent", color: "#a3e635", border: "1px solid #2f2f36", borderRadius: 10, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>← Back to Suite</button>
        <div style={{ color: "#a1a1aa", fontSize: 13 }}>Workflows Suite · Collaboration & Approvals</div>
      </div>
      {isViewer && (
        <div style={{ background: "#232336", border: "1px solid #2f2f36", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#fcd34d" }}>View-only mode</div>
            <div style={{ color: "#9ca3af", fontSize: 13 }}>You can inspect approvals but need elevated access to edit or build workflows.</div>
          </div>
          <button onClick={() => setAccessRequested(true)} disabled={accessRequested} style={{ background: accessRequested ? "#2f2f36" : "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: accessRequested ? "default" : "pointer" }}>
            {accessRequested ? "Request sent" : "Request edit access"}
          </button>
        </div>
      )}
      {showCommandPalette && (
        <div style={{ position: "fixed", inset: 0, background: "#0009", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 14, padding: 16, width: "min(520px, 92vw)", boxShadow: "0 18px 60px #000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, color: "#a5f3fc" }}>Command Palette</div>
              <button onClick={() => setShowCommandPalette(false)} style={{ background: "transparent", color: "#9ca3af", border: "none", cursor: "pointer", fontWeight: 700 }}>Esc</button>
            </div>
            {[{ label: "Save draft", action: handleManualSave, hotkey: "Ctrl+S", disabled: false }, { label: "Run preflight", action: runPreflight, hotkey: "Alt+P", disabled: false }, { label: "Build", action: handleBuild, hotkey: "Ctrl+Enter", disabled: isViewer }, { label: "Undo", action: handleUndo, hotkey: "Ctrl+Z", disabled: !undoStack.length || isViewer }, { label: "Redo", action: handleRedo, hotkey: "Ctrl+Shift+Z", disabled: !redoStack.length || isViewer }].map(cmd => (
              <button key={cmd.label} disabled={cmd.disabled} onClick={() => { cmd.action(); setShowCommandPalette(false); }} style={{ width: "100%", textAlign: "left", background: cmd.disabled ? "#1f2937" : "#111827", color: cmd.disabled ? "#6b7280" : "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: cmd.disabled ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{cmd.label}</span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>{cmd.hotkey}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ position: "sticky", top: 0, zIndex: 4, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", background: "#18181b", paddingBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#232336", border: "1px solid #2f2f36", borderRadius: 12, padding: "8px 12px" }}>
          <span style={{ color: "#d4d4d8", fontWeight: 700 }}>Env</span>
          {["dev", "stage", "prod"].map(opt => (
            <button key={opt} onClick={() => handleDirectChange(setEnv)(opt)} disabled={isViewer} style={{ background: env === opt ? "#a3e635" : "#111827", color: env === opt ? "#111827" : "#e5e7eb", border: "1px solid #2f2f36", borderRadius: 999, padding: "6px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>{opt.toUpperCase()}</button>
          ))}
          <span style={{ color: draftStatus === "saved" ? "#22c55e" : "#fbbf24", fontSize: 12 }}>{draftStatus === "saved" ? `Saved ${formatTime(lastSavedAt)}` : "Saving..."}</span>
          {dirtySinceSave && <span style={{ color: "#fbbf24", fontSize: 12 }}>· Unsaved changes</span>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={runPreflight} disabled={isViewer} style={{ background: "#1e293b", color: "#fcd34d", border: "1px solid #334155", borderRadius: 12, padding: "10px 12px", fontWeight: 800, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>🔍 Preflight (Alt+P)</button>
          <button onClick={handleBuild} disabled={isViewer} style={{ background: "#22c55e", color: "#0f172a", border: "none", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>{loading ? "Building…" : "Build (Ctrl+Enter)"}</button>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Collaboration & Approval Workflows</h2>
        <div style={{ color: "#9ca3af", fontSize: 13 }}>
          Hotkeys: Ctrl+S save draft, Ctrl+Enter build, Alt+P preflight, Ctrl+Z / Ctrl+Shift+Z undo/redo, Ctrl+K palette.
          {diffSummary && <span style={{ marginLeft: 10 }}>Δ chars since last build: {diffSummary.delta}</span>}
        </div>
      </div>
      {showOnboarding && onboardingContent}
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          {WORKFLOW_PRESETS.map(p => (
            <button key={p.id} onClick={() => { if (isViewer) return; pushUndoSnapshot(); setSelectedPreset(p.id); setWorkflow(p.workflow); }} disabled={isViewer} style={{ background: selectedPreset === p.id ? "#a3e635" : "#232336", color: selectedPreset === p.id ? "#111827" : "#e5e7eb", border: "1px solid #2f2f36", borderRadius: 10, padding: "8px 10px", fontWeight: 700, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>
              {p.name} <span style={{ marginLeft: 6, background: "#a3e6351a", color: "#bef264", padding: "2px 6px", borderRadius: 999, fontSize: 12 }}>{p.badge}</span>
            </button>
          ))}
        </div>
        <input
          value={workflow}
          onChange={handleInputChange(setWorkflow)}
          disabled={isViewer}
          style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12, opacity: isViewer ? 0.7 : 1 }}
          placeholder="Describe your workflow or approval chain..."
          aria-label="Workflow input"
        />
        <button onClick={handleBuild} disabled={loading || isViewer} style={{ background: "#6366f1", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: loading || isViewer ? "not-allowed" : "pointer", opacity: loading || isViewer ? 0.7 : 1 }}>Build Workflow</button>
      </div>
      {preflightIssues.length > 0 && (
        <div style={{ marginBottom: 12, background: "#232336", border: "1px solid #2f2f36", borderRadius: 12, padding: 12 }}>
          <div style={{ color: "#fcd34d", fontWeight: 800 }}>Preflight</div>
          <ul style={{ margin: 6, paddingLeft: 18, color: "#e5e7eb" }}>
            {preflightIssues.map((i, idx) => <li key={idx}>{i}</li>)}
          </ul>
          {env === "prod" && (
            <div style={{ marginTop: 8 }}>
              <input value={confirmationNote} onChange={handleInputChange(setConfirmationNote)} disabled={isViewer} placeholder="Who approved? What changed?" style={{ width: "100%", background: "#0f172a", color: "#e5e7eb", border: "1px solid #2f2f36", borderRadius: 10, padding: "8px 10px", opacity: isViewer ? 0.7 : 1 }} />
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={fetchWorkflows} style={{ background: "#6366f1", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Load Workflows</button>
        <button onClick={fetchApprovals} style={{ background: "#0ea5e9", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Load Approvals</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Workflows</div>
          <ul style={{ paddingLeft: 18 }}>
            {workflows.map((wf, idx) => (
              <li key={wf.id || idx} style={{ marginBottom: 8, background: "#232336", borderRadius: 8, padding: 8, color: '#e5e7eb' }}>{wf.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Approvals</div>
          <ul style={{ paddingLeft: 18 }}>
            {approvals.map((ap, idx) => (
              <li key={ap.id || idx} style={{ marginBottom: 8, background: "#18181b", borderRadius: 8, padding: 8, color: '#7fffd4' }}>{ap.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} disabled={isViewer} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import workflows" disabled={isViewer} />
        <button onClick={handleExport} disabled={isViewer} style={{ background: "#0ea5e9", color: "#f3f4f6", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: isViewer ? "not-allowed" : "pointer", opacity: isViewer ? 0.7 : 1 }}>Export</button>
        {exported && <a href={exported} download="collaboration-workflows.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#232336", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #555", marginBottom: 12, background: "#23263a", color: "#f3f4f6" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
      {/* ...existing code... */}
      {result && (
        <div style={{ marginTop: 24, background: "#23263a", borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 20 }}>Workflow Result</h3>
          <pre style={{ fontSize: 15, color: "#a3e635" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontWeight: 700, fontSize: 18 }}>History</h3>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, idx) => (
              <li key={idx} style={{ marginBottom: 8, background: "#23263a", borderRadius: 8, padding: 8 }}>
                <b>Workflow:</b> {h.workflow} <br />
                <b>Result:</b> {JSON.stringify(h.result)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
