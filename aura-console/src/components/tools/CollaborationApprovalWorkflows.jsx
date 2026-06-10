import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/collaboration-approval-workflows";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : v === "amber" ? "#78350f" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "create",    label: "Create Workflow" },
  { id: "active",    label: "Active Workflows" },
  { id: "templates", label: "Workflow Templates" },
  { id: "guide",     label: "Process Guide" },
];

const WORKFLOW_TYPES = ["Content Approval", "Discount Approval", "Refund Approval", "Campaign Launch", "Pricing Change", "New Product Launch", "Policy Change", "Budget Request"];
const APPROVAL_MODES = ["Single approver", "Sequential (ordered chain)", "Parallel (all must approve)", "Majority vote", "Any one of approvers"];
const URGENCY        = ["Low (7 days)", "Normal (3 days)", "High (24 hours)", "Critical (4 hours)"];
const STATUS_COLORS  = { pending: "#fbbf24", approved: "#4ade80", rejected: "#f87171", draft: "#71717a", escalated: "#c084fc" };

const WORKFLOW_TEMPLATES = [
  {
    name: "Blog Content Approval",
    type: "Content Approval",
    desc: "Two-stage approval: Editor review then Marketing Manager sign-off. 3-day SLA.",
    steps: ["Writer submits draft", "Editor reviews for quality/accuracy (48h)", "Marketing Manager approves/rejects (24h)", "Published if approved"],
    mode: "Sequential (ordered chain)",
    urgency: "Normal (3 days)",
  },
  {
    name: "High-Value Discount Approval",
    type: "Discount Approval",
    desc: "Discounts >20% require Finance and Marketing approval before publishing.",
    steps: ["Team member submits discount request with business case", "Marketing Manager approves alignment with strategy (24h)", "Finance approves margin impact (24h)", "Applied if both approve"],
    mode: "Parallel (all must approve)",
    urgency: "High (24 hours)",
  },
  {
    name: "Refund Over £500",
    type: "Refund Approval",
    desc: "Large refunds need Operations or Account Manager approval before processing.",
    steps: ["Support agent flags refund request", "Operations Manager reviews case (4h)", "Processes if approved; escalates to Director if rejected"],
    mode: "Single approver",
    urgency: "High (24 hours)",
  },
  {
    name: "Major Campaign Launch",
    type: "Campaign Launch",
    desc: "All major campaigns (>£1000 budget) need multi-team sign-off before launch.",
    steps: ["Marketing creates brief + estimated spend", "Finance approves budget (48h)", "Creative Director approves assets (24h)", "CMO or founder final sign-off (24h)", "Launch approved"],
    mode: "Sequential (ordered chain)",
    urgency: "Normal (3 days)",
  },
  {
    name: "Pricing Change",
    type: "Pricing Change",
    desc: "Any price change >5% requires Finance and Product approval. Protects margins.",
    steps: ["Request submitted with justification and competitive data", "Finance reviews margin impact (24h)", "Product Manager reviews positioning (24h)", "Apply change if both approve"],
    mode: "Parallel (all must approve)",
    urgency: "Normal (3 days)",
  },
  {
    name: "New Product Launch Checklist",
    type: "New Product Launch",
    desc: "Full cross-functional sign-off before any new product goes live in Shopify.",
    steps: ["Product Manager submits launch brief", "Operations confirms inventory is ready (48h)", "Marketing confirms content + SEO ready (48h)", "Tech confirms product page + variants configured (24h)", "Founder final approval (24h)"],
    mode: "Sequential (ordered chain)",
    urgency: "Normal (3 days)",
  },
];

export default function CollaborationApprovalWorkflows() {
  const [tab, setTab]         = useState("create");
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const [form, setForm]   = useState({ name: "", type: "Content Approval", mode: "Sequential (ordered chain)", urgency: "Normal (3 days)", approvers: "", description: "", steps: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch]             = useState("");

  useEffect(() => { loadWorkflows(); }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/workflows`);
      if (r.ok) setWorkflows(r.workflows || []);
    } catch (e) { /* silently ignore */ }
    setLoading(false);
  };

  const saveWorkflow = async () => {
    if (!form.name.trim()) { setError("Workflow name is required"); return; }
    if (!form.approvers.trim()) { setError("At least one approver is required"); return; }
    setSaving(true); setError("");
    try {
      const r = await apiFetchJSON(`${API}/workflows`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "draft", createdAt: new Date().toISOString() }),
      });
      if (!r.ok) throw new Error(r.error || "Save failed");
      setWorkflows(p => [r.workflow || { ...form, id: Date.now(), status: "draft", createdAt: new Date().toISOString() }, ...p]);
      setForm({ name: "", type: "Content Approval", mode: "Sequential (ordered chain)", urgency: "Normal (3 days)", approvers: "", description: "", steps: "" });
      setTab("active");
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const updateStatus = async (id, status) => {
    try {
      await apiFetchJSON(`${API}/workflows/${id}/status`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setWorkflows(p => p.map(w => w.id === id ? { ...w, status } : w));
    } catch (e) { setError(e.message); }
  };

  const deleteWorkflow = async (id) => {
    try {
      await apiFetchJSON(`${API}/workflows/${id}`, { method: "DELETE" });
      setWorkflows(p => p.filter(w => w.id !== id));
    } catch (e) { setError(e.message); }
  };

  const applyTemplate = (tpl) => {
    setForm({ name: tpl.name, type: tpl.type, mode: tpl.mode, urgency: tpl.urgency, approvers: "", description: tpl.desc, steps: tpl.steps.join("\n") });
    setTab("create");
  };

  const filtered = workflows.filter(w => {
    const matchesStatus = filterStatus === "all" || w.status === filterStatus;
    const matchesSearch = !search || w.name?.toLowerCase().includes(search.toLowerCase()) || w.type?.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Collaboration & Approval Workflows</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Build structured approval chains for content, campaigns, discounts, refunds, and pricing changes. Eliminate ad-hoc decisions, ensure accountability, and maintain brand standards at scale.
        </p>
      </div>

      {workflows.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Total",    val: workflows.length,                                  color: "#71717a" },
            { label: "Active",   val: workflows.filter(w => w.status === "pending").length,  color: "#fbbf24" },
            { label: "Approved", val: workflows.filter(w => w.status === "approved").length, color: "#4ade80" },
            { label: "Draft",    val: workflows.filter(w => w.status === "draft").length,    color: "#a1a1aa" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
              <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── CREATE WORKFLOW ── */}
      {tab === "create" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Workflow Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Workflow Name *</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Blog Post Approval" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Type</label>
                <select style={{ ...S.select, width: "100%" }} value={form.type} onChange={e => set("type", e.target.value)}>
                  {WORKFLOW_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Approval Mode</label>
                <select style={{ ...S.select, width: "100%" }} value={form.mode} onChange={e => set("mode", e.target.value)}>
                  {APPROVAL_MODES.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Urgency / SLA</label>
                <select style={{ ...S.select, width: "100%" }} value={form.urgency} onChange={e => set("urgency", e.target.value)}>
                  {URGENCY.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Approvers * (names or email, comma-separated)</label>
              <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={form.approvers} onChange={e => set("approvers", e.target.value)} placeholder="Sarah (Marketing Manager), finance@company.com" />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Description</label>
              <textarea style={{ ...S.ta, minHeight: 60 }} value={form.description} onChange={e => set("description", e.target.value)} placeholder="What does this workflow approve and when should it be used?" />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Approval Steps (one per line)</label>
              <textarea style={{ ...S.ta, minHeight: 90 }} value={form.steps} onChange={e => set("steps", e.target.value)} placeholder={"Step 1: Creator submits draft\nStep 2: Editor reviews (24h)\nStep 3: Manager approves (24h)\nStep 4: Published"} />
            </div>

            <button style={S.btn("primary")} onClick={saveWorkflow} disabled={saving}>{saving ? "Saving…" : "Create Workflow"}</button>
          </div>
        </div>
      )}

      {/* ── ACTIVE WORKFLOWS ── */}
      {tab === "active" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
            <input style={{ ...S.input, maxWidth: 260 }} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workflows…" />
            {["all", "draft", "pending", "approved", "rejected", "escalated"].map(s => (
              <button key={s} style={{ ...S.btn(s === filterStatus ? "primary" : null), fontSize: 11, padding: "5px 10px", textTransform: "capitalize" }} onClick={() => setFilterStatus(s)}>{s}</button>
            ))}
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadWorkflows}>Refresh</button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="✅" title="No workflows found" description={workflows.length === 0 ? "Create your first workflow or apply a template to get started." : "No workflows match your current filters."} />
          ) : (
            filtered.map((w, i) => (
              <div key={w.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e7" }}>{w.name}</div>
                      <span style={{ background: (STATUS_COLORS[w.status] || "#71717a") + "22", color: STATUS_COLORS[w.status] || "#71717a", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "capitalize" }}>{w.status}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>{w.type} · {w.mode} · {w.urgency}</div>
                    {w.approvers && <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>Approvers: {w.approvers}</div>}
                    {w.description && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4, lineHeight: 1.5 }}>{w.description}</div>}
                    {w.steps && (
                      <div style={{ marginTop: 8 }}>
                        {(typeof w.steps === "string" ? w.steps.split("\n") : w.steps).filter(Boolean).map((step, si) => (
                          <div key={si} style={{ fontSize: 11, color: "#71717a", padding: "2px 0" }}>→ {step}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 12 }}>
                    {w.status === "draft" && <button style={{ ...S.btn("amber"), fontSize: 11, padding: "4px 8px" }} onClick={() => updateStatus(w.id, "pending")}>Activate</button>}
                    {w.status === "pending" && <button style={{ ...S.btn("green"), fontSize: 11, padding: "4px 8px" }} onClick={() => updateStatus(w.id, "approved")}>Approve</button>}
                    {w.status === "pending" && <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => updateStatus(w.id, "rejected")}>Reject</button>}
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deleteWorkflow(w.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── WORKFLOW TEMPLATES ── */}
      {tab === "templates" && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>Pre-built approval workflows for common business scenarios. Apply a template to auto-fill the creation form.</p>
          {WORKFLOW_TEMPLATES.map((tpl, i) => (
            <div key={i} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 4 }}>{tpl.name}</div>
                  <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>{tpl.desc}</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{tpl.type}</span>
                    <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{tpl.mode}</span>
                    <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{tpl.urgency}</span>
                  </div>
                </div>
                <button style={{ ...S.btn("primary"), fontSize: 11, padding: "6px 12px", flexShrink: 0, marginLeft: 12 }} onClick={() => applyTemplate(tpl)}>Apply Template</button>
              </div>
              <div style={S.sectionTitle}>Approval Steps</div>
              {tpl.steps.map((step, si) => (
                <div key={si} style={{ fontSize: 12, color: "#a1a1aa", padding: "4px 0", borderBottom: "1px solid #1f1f22" }}>
                  <span style={{ color: "#4f46e5", fontWeight: 700 }}>{si + 1}.</span> {step}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── PROCESS GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Approval Workflow Best Practices</div>
            {[
              { t: "Define the trigger, not just the approvers",        d: "Every workflow must have a clear trigger condition: 'When discount >20%', 'When blog post is complete', 'When order value >£500'. Without a clear trigger, workflows get skipped." },
              { t: "Sequential vs parallel approval",                    d: "Use sequential when each approver needs the previous one's context or changes. Use parallel when approvers are independent (e.g., Finance and Legal reviewing the same contract simultaneously)." },
              { t: "Set SLAs — never leave approvals open-ended",        d: "Every approval request must have a deadline. 24 hours for urgent items, 3 days for normal content, 7 days for low-priority policy changes. Auto-escalate overdue items to the next manager." },
              { t: "The fewer approvers the better",                     d: "Each additional approver adds 24-72 hours. Only include people who are truly accountable for the outcome. 'FYI' people should get a notification, not a blocking approval step." },
              { t: "Approve the policy, not individual instances",       d: "Create workflows with rules (e.g., 'Approve all refunds under £200 automatically') rather than reviewing every single case. Approvals should catch exceptions, not be the default." },
              { t: "Document rejections with reasons",                   d: "Every rejection should require a reason. This builds an institutional knowledge base: why things were rejected in the past prevents the same mistakes recurring and helps new team members understand standards." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>✅</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Approval Mode Reference</div>
            {[
              { mode: "Single approver",                desc: "One person approves. Fastest. Best for operational decisions where one role owns the outcome." },
              { mode: "Sequential (ordered chain)",     desc: "Each approver must review in order. Best when later approvers depend on earlier feedback (e.g., editor then manager)." },
              { mode: "Parallel (all must approve)",    desc: "All approvers work simultaneously. Best for cross-functional sign-off where everyone is independent (e.g., Finance + Legal + Marketing)." },
              { mode: "Majority vote",                  desc: "More than 50% must approve. Best for committee decisions where one blocker shouldn't stop the whole process." },
              { mode: "Any one of approvers",           desc: "First approver to respond decides. Best for redundancy — ensures approvals don't block when one approver is unavailable." },
            ].map(({ mode, desc }) => (
              <div key={mode} style={S.row}>
                <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>{mode}</span>
                <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
