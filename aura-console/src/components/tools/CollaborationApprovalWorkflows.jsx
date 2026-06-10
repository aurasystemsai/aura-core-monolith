import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/collaboration-approval-workflows";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  stepNode: { background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#c7d2fe", fontWeight: 600, whiteSpace: "nowrap" },
  arrow: { fontSize: 16, color: "#52525b", flexShrink: 0, alignSelf: "center" },
};

const TABS = [
  { id: "builder",  label: "Workflow Builder" },
  { id: "ai",       label: "AI Generate" },
  { id: "history",  label: "History" },
  { id: "guide",    label: "Approval Guide" },
];

const PRESETS = [
  {
    id: "multi-approver",
    name: "Multi-Approver Sign-off",
    category: "Legal / Finance",
    workflow: "Submit → Manager reviews → Legal signs → Finance approves → Notify Slack #approvals → Archive",
    description: "Standard multi-stakeholder sign-off for contracts, budgets, and legal agreements.",
  },
  {
    id: "deal-desk",
    name: "Deal Desk",
    category: "Sales",
    workflow: "AE submits quote → Deal Desk reviews → Finance discount check → VP signs → Salesforce update → Customer notified",
    description: "Sales deal approval with discount gates and CRM auto-update.",
  },
  {
    id: "content-qa",
    name: "Content QA Pipeline",
    category: "Marketing",
    workflow: "Draft submitted → Editor review → Brand QA → Legal check → Publish → Analytics tag → Retro review",
    description: "Full content approval chain from draft to live publication.",
  },
  {
    id: "vendor-onboard",
    name: "Vendor Onboarding",
    category: "Operations",
    workflow: "Application → Procurement review → Legal vetting → Security scan → Finance terms → IT provisioning → Welcome",
    description: "New supplier or vendor onboarding with compliance and security gates.",
  },
  {
    id: "product-launch",
    name: "Product Launch",
    category: "Product",
    workflow: "Brief → Design sign-off → Engineering review → QA pass → Marketing ready → CEO/founder → Launch → Monitor",
    description: "Full product or feature launch approval with multi-department gates.",
  },
  {
    id: "refund-auth",
    name: "Refund Authorisation",
    category: "Customer Service",
    workflow: "CS raise request → Reason validated → Amount check (>£200 → manager) → Approve → Process refund → Log",
    description: "Conditional refund approval with value-based routing.",
  },
];

function parseSteps(workflow) {
  return workflow.split(/→|->|>/).map(s => s.trim()).filter(Boolean);
}

export default function CollaborationApprovalWorkflows() {
  const [tab, setTab]       = useState("builder");
  const [workflow, setWorkflow] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");

  const buildWorkflow = async (wf) => {
    const wfText = (wf || workflow).trim();
    if (!wfText) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/build`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflow: wfText }),
      });
      if (!r.ok) throw new Error(r.error || "Build failed");
      setResult(r.result);
      setHistory(p => [{ workflow: wfText, result: r.result, ts: new Date().toISOString() }, ...p].slice(0, 20));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const loadPreset = (preset) => {
    setWorkflow(preset.workflow);
    setTab("builder");
  };

  const steps = workflow ? parseSteps(workflow) : [];

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Collaboration & Approval Workflows</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Design and automate multi-step approval workflows — deal desk, content QA, vendor onboarding, product launches, and any process requiring sequential sign-offs.</p>
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* BUILDER */}
      {tab === "builder" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Define Your Workflow (use → to separate steps)</div>
            <textarea style={{ ...S.ta, minHeight: 80 }} value={workflow} onChange={e => setWorkflow(e.target.value)} placeholder="Submit → Manager review → Legal sign-off → Finance check → Notify team → Archive" />

            {steps.length > 1 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
                {steps.map((step, i) => (
                  <React.Fragment key={i}>
                    <div style={S.stepNode}>{step}</div>
                    {i < steps.length - 1 && <span style={S.arrow}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={() => buildWorkflow()} disabled={loading || !workflow.trim()}>{loading ? "Building…" : "Build & Analyse Workflow"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setWorkflow(""); setResult(null); }}>Clear</button>
            </div>
          </div>

          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>Workflow Analysis</div>
                <button onClick={() => navigator.clipboard?.writeText(typeof result === "string" ? result : JSON.stringify(result, null, 2))} style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }}>Copy</button>
              </div>
              <pre style={S.pre}>{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          <div style={{ ...S.card, marginTop: 4 }}>
            <div style={S.sectionTitle}>Workflow Templates — Click to Load</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10, marginTop: 8 }}>
              {PRESETS.map(p => (
                <div key={p.id} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 14px", cursor: "pointer" }} onClick={() => loadPreset(p)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{p.name}</div>
                    <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700 }}>{p.category}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#71717a", lineHeight: 1.5 }}>{p.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI GENERATE */}
      {tab === "ai" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ ...S.card }}>
            <div style={S.sectionTitle}>AI Workflow Suggestions</div>
            <div style={{ fontSize: 12, color: "#71717a", marginBottom: 12 }}>Select a preset below or enter a custom workflow in the Builder tab, then use "Build & Analyse" to get AI-powered analysis, bottleneck detection, and optimisation suggestions.</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PRESETS.map(p => (
                <button key={p.id} style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => { setWorkflow(p.workflow); buildWorkflow(p.workflow); setTab("builder"); }}>{p.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          {history.length === 0 ? (
            <EmptyState icon="📋" title="No workflow history" description="Build your first workflow to see history here." />
          ) : (
            history.map((h, i) => (
              <div key={i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#52525b", marginBottom: 4 }}>{new Date(h.ts).toLocaleString()}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                      {parseSteps(h.workflow).map((step, i2) => (
                        <React.Fragment key={i2}>
                          <span style={{ ...S.stepNode, fontSize: 10, padding: "2px 8px" }}>{step}</span>
                          {i2 < parseSteps(h.workflow).length - 1 && <span style={{ color: "#52525b", fontSize: 12 }}>→</span>}
                        </React.Fragment>
                      ))}
                    </div>
                    {h.result && <div style={{ fontSize: 12, color: "#a1a1aa" }}>{(typeof h.result === "string" ? h.result : JSON.stringify(h.result)).slice(0, 150)}…</div>}
                  </div>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => { setWorkflow(h.workflow); setTab("builder"); }}>Re-use</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Approval Workflow Design Principles</div>
            {[
              { t: "Map current state before automating",          d: "Document exactly how approvals happen today — email chains, Slack threads, spreadsheets. You can't improve what you haven't mapped. Shadow 3 live approvals before designing the workflow." },
              { t: "Each step needs a clear owner and SLA",        d: "Undefined ownership kills workflows. Every step needs: who approves, what criteria they use, and how long they have. No owner + no deadline = infinite delay." },
              { t: "Conditional routing cuts cycle time by 30-50%", d: "Use value thresholds (>£500 needs manager, >£5k needs VP), risk levels, or department to auto-route. Most approvals are routine — only escalate the exceptions." },
              { t: "Notifications must be actionable",             d: "Don't send 'you have a pending approval' with no context. Include: what is it, what decision is needed, deadline, and a one-click link to the item. Reduce clicks to zero." },
              { t: "Audit trail is non-negotiable",                d: "Every approval decision must be logged with: who, when, what they approved, and any notes. This protects the business legally and enables process improvement." },
              { t: "Design for the exception, not the rule",       d: "Most approvals are routine and should auto-proceed. Design your workflow for the 5% that need human judgment, not the 95% that don't." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>✅</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
