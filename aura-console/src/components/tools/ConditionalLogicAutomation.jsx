import React, { useMemo, useState, useRef } from "react";
import { apiFetch } from "../../api";
import BackButton from "./BackButton";

const OPERATORS = [
  "equals",
  "not equals",
  "contains",
  "not contains",
  ">",
  "<",
  ">=",
  "<=",
  "is empty",
  "is not empty"
];

const TRIGGER_LIBRARY = [
  { title: "Abandoned Cart", type: "trigger", description: "Fire when cart is left idle", config: { event: "abandoned_cart" } },
  { title: "Browse Abandonment", type: "trigger", description: "Viewed product but no add-to-cart", config: { event: "browse_abandonment" } },
  { title: "High AOV Visitor", type: "trigger", description: "AOV exceeds threshold", config: { event: "aov_over", threshold: 150 } },
  { title: "Low LTV Drop", type: "trigger", description: "LTV declined vs last period", config: { event: "ltv_drop" } }
];

const CONDITION_LIBRARY = [
  { title: "Country / Region", type: "condition", description: "Match geo", config: { field: "country", operator: "equals", value: "US" } },
  { title: "Cart Value", type: "condition", description: "Cart total compared to target", config: { field: "cart_value", operator: ">=", value: "100" } },
  { title: "Segment", type: "condition", description: "VIP / High Intent", config: { field: "segment", operator: "equals", value: "VIP" } },
  { title: "Product Contains", type: "condition", description: "SKU or tag contains value", config: { field: "product_tags", operator: "contains", value: "bundle" } }
];

const ACTION_LIBRARY = [
  { title: "Send Email", type: "action", description: "Trigger lifecycle email", config: { channel: "email", template: "winback-1" } },
  { title: "Send SMS", type: "action", description: "Text with offer", config: { channel: "sms", template: "sms-nudge" } },
  { title: "Add To Flow", type: "action", description: "Route to orchestration flow", config: { channel: "flow", target: "vip-flow" } },
  { title: "Create Task", type: "action", description: "Push to CRM task queue", config: { channel: "task", queue: "cs-playbook" } }
];

const TEMPLATE_PRESETS = [
  {
    id: "winback",
    name: "Churn / Winback",
    description: "Abandoned cart with VIP split and SMS follow-up",
    flowNodes: [
      { type: "trigger", title: "Abandoned Cart", description: "Cart left idle 2h", config: { event: "abandoned_cart" } },
      { type: "condition", title: "Cart Value >= $120", description: "High intent filter", config: { field: "cart_value", operator: ">=", value: "120" } },
      { type: "condition", title: "Region == US", description: "Geo target", config: { field: "country", operator: "equals", value: "US" } }
    ],
    branchGroup: {
      branches: [
        {
          label: "VIP",
          condition: { field: "segment", operator: "equals", value: "VIP" },
          actions: [
            { type: "action", title: "VIP Email", description: "High-touch email", config: { channel: "email", template: "vip-offer" } },
            { type: "action", title: "SMS Reminder", description: "Direct SMS nudge", config: { channel: "sms", template: "vip-sms" } }
          ]
        },
        {
          label: "Non-VIP",
          condition: { field: "segment", operator: "not equals", value: "VIP" },
          actions: [
            { type: "action", title: "Standard Email", description: "Winback offer", config: { channel: "email", template: "winback" } }
          ]
        }
      ],
      elseActions: [
        { type: "action", title: "Fallback Flow", description: "Route to orchestration", config: { channel: "flow", target: "winback-default" } }
      ]
    }
  },
  {
    id: "high-aov",
    name: "High AOV Split",
    description: "A/B path based on cart value threshold",
    flowNodes: [
      { type: "trigger", title: "AOV Trigger", description: "Trigger on high AOV", config: { event: "aov_over", threshold: 200 } },
      { type: "condition", title: "Cart Value >= $200", description: "Top spenders", config: { field: "cart_value", operator: ">=", value: "200" } }
    ],
    branchGroup: {
      branches: [
        {
          label: "Tier A",
          condition: { field: "cart_value", operator: ">=", value: "300" },
          actions: [
            { type: "action", title: "Premium Flow", description: "White-glove sequence", config: { channel: "flow", target: "premium-flow" } }
          ]
        },
        {
          label: "Tier B",
          condition: { field: "cart_value", operator: ">=", value: "200" },
          actions: [
            { type: "action", title: "Standard Flow", description: "Standard AOV sequence", config: { channel: "flow", target: "aov-flow" } }
          ]
        }
      ],
      elseActions: [
        { type: "action", title: "Safety Net", description: "Drop to nurture", config: { channel: "flow", target: "nurture" } }
      ]
    }
  },
  {
    id: "geo-ltv",
    name: "Geo + LTV",
    description: "Geo match + LTV drop branching",
    flowNodes: [
      { type: "trigger", title: "LTV Drop", description: "LTV drops vs last period", config: { event: "ltv_drop" } },
      { type: "condition", title: "Region == EU", description: "EU cohort", config: { field: "region", operator: "equals", value: "EU" } }
    ],
    branchGroup: {
      branches: [
        {
          label: "EU - High Risk",
          condition: { field: "ltv_delta", operator: "<", value: "-50" },
          actions: [
            { type: "action", title: "Reactivation Email", description: "Localized content", config: { channel: "email", template: "eu-react" } },
            { type: "action", title: "CS Escalation", description: "Open task", config: { channel: "task", queue: "retention" } }
          ]
        }
      ],
      elseActions: [
        { type: "action", title: "Monitor", description: "Keep watching", config: { channel: "flow", target: "monitor" } }
      ]
    }
  }
];

const uniqueId = () => `node_${Date.now()}_${Math.random().toString(16).slice(2)}`;

export default function ConditionalLogicAutomation() {
  const [logicBlocks, setLogicBlocks] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [triggers, setTriggers] = useState([]);
  const [flowNodes, setFlowNodes] = useState([]);
  const [branchGroup, setBranchGroup] = useState({ branches: [], elseActions: [] });
  const [paletteFilter, setPaletteFilter] = useState("");
  const [simulationInput, setSimulationInput] = useState(`{
  "event": "abandoned_cart",
  "cart_value": 180,
  "country": "US",
  "segment": "VIP",
  "ltv_delta": -40
}`);
  const [simulationResult, setSimulationResult] = useState(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [validationIssues, setValidationIssues] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const fileInputRef = useRef();

  const goBackToSuite = () => {
    if (typeof window !== "undefined" && typeof window.__AURA_TO_SUITE === "function") {
      window.__AURA_TO_SUITE("workflows");
    }
  };

  const filteredPalette = useMemo(() => {
    const term = paletteFilter.toLowerCase();
    const predicate = item =>
      !term ||
      item.title.toLowerCase().includes(term) ||
      (item.description || "").toLowerCase().includes(term);
    return {
      triggers: TRIGGER_LIBRARY.filter(predicate),
      conditions: CONDITION_LIBRARY.filter(predicate),
      actions: ACTION_LIBRARY.filter(predicate)
    };
  }, [paletteFilter]);

  const fetchLogicBlocks = async () => {
    try {
      setError("");
      const res = await apiFetch("/api/conditional-logic-automation/logic-blocks");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setLogicBlocks(data.logicBlocks || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchWorkflows = async () => {
    try {
      setError("");
      const res = await apiFetch("/api/conditional-logic-automation/workflows");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setWorkflows(data.workflows || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchTriggers = async () => {
    try {
      setError("");
      const res = await apiFetch("/api/conditional-logic-automation/triggers");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setTriggers(data.triggers || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const addNode = item => {
    setFlowNodes(prev => [...prev, { ...item, id: uniqueId(), config: { ...(item.config || {}) } }]);
  };

  const updateNode = (id, patch) => {
    setFlowNodes(prev => prev.map(node => (node.id === id ? { ...node, ...patch } : node)));
  };

  const removeNode = id => {
    setFlowNodes(prev => prev.filter(n => n.id !== id));
  };

  const addBranch = () => {
    setBranchGroup(prev => ({
      ...prev,
      branches: [
        ...prev.branches,
        {
          id: uniqueId(),
          label: `Branch ${prev.branches.length + 1}`,
          condition: { field: "", operator: "equals", value: "" },
          actions: []
        }
      ]
    }));
  };

  const updateBranchCondition = (branchId, patch) => {
    setBranchGroup(prev => ({
      ...prev,
      branches: prev.branches.map(b => (b.id === branchId ? { ...b, condition: { ...b.condition, ...patch } } : b))
    }));
  };

  const addBranchAction = (branchId, action) => {
    setBranchGroup(prev => ({
      ...prev,
      branches: prev.branches.map(b =>
        b.id === branchId
          ? { ...b, actions: [...b.actions, { ...action, id: uniqueId(), config: { ...(action.config || {}) } }] }
          : b
      )
    }));
  };

  const removeBranchAction = (branchId, actionId) => {
    setBranchGroup(prev => ({
      ...prev,
      branches: prev.branches.map(b =>
        b.id === branchId ? { ...b, actions: b.actions.filter(a => a.id !== actionId) } : b
      )
    }));
  };

  const addElseAction = action => {
    setBranchGroup(prev => ({
      ...prev,
      elseActions: [...(prev.elseActions || []), { ...action, id: uniqueId(), config: { ...(action.config || {}) } }]
    }));
  };

  const removeElseAction = actionId => {
    setBranchGroup(prev => ({
      ...prev,
      elseActions: (prev.elseActions || []).filter(a => a.id !== actionId)
    }));
  };

  const applyTemplate = preset => {
    const mappedFlow = (preset.flowNodes || []).map(n => ({ ...n, id: uniqueId() }));
    const mappedBranches = (preset.branchGroup?.branches || []).map(b => ({
      ...b,
      id: uniqueId(),
      actions: (b.actions || []).map(a => ({ ...a, id: uniqueId() }))
    }));
    const mappedElse = (preset.branchGroup?.elseActions || []).map(a => ({ ...a, id: uniqueId() }));
    setFlowNodes(mappedFlow);
    setBranchGroup({ branches: mappedBranches, elseActions: mappedElse });
    setActiveTemplate(preset.name);
  };

  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        if (Array.isArray(data)) {
          // backward compat: simple workflow array
          setFlowNodes(data.map(item => ({ ...item, id: uniqueId() })));
        } else {
          setFlowNodes((data.flowNodes || []).map(item => ({ ...item, id: uniqueId() })));
          const mappedBranches = (data.branchGroup?.branches || []).map(b => ({
            ...b,
            id: uniqueId(),
            actions: (b.actions || []).map(a => ({ ...a, id: uniqueId() }))
          }));
          const mappedElse = (data.branchGroup?.elseActions || []).map(a => ({ ...a, id: uniqueId() }));
          setBranchGroup({ branches: mappedBranches, elseActions: mappedElse });
        }
        setImported(file.name);
        setError("");
      } catch (err) {
        setError("Failed to import: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const payload = { flowNodes, branchGroup };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/conditional-logic-automation/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  const evaluateCondition = (cond, payload) => {
    if (!cond) return false;
    const { field, operator, value } = cond;
    const payloadValue = field ? payload?.[field] : undefined;
    const toNumber = v => {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    switch (operator) {
      case "equals":
        return String(payloadValue) === String(value);
      case "not equals":
        return String(payloadValue) !== String(value);
      case "contains":
        return String(payloadValue || "").toLowerCase().includes(String(value || "").toLowerCase());
      case "not contains":
        return !String(payloadValue || "").toLowerCase().includes(String(value || "").toLowerCase());
      case ">":
        return toNumber(payloadValue) !== null && toNumber(value) !== null && toNumber(payloadValue) > toNumber(value);
      case "<":
        return toNumber(payloadValue) !== null && toNumber(value) !== null && toNumber(payloadValue) < toNumber(value);
      case ">=":
        return toNumber(payloadValue) !== null && toNumber(value) !== null && toNumber(payloadValue) >= toNumber(value);
      case "<=":
        return toNumber(payloadValue) !== null && toNumber(value) !== null && toNumber(payloadValue) <= toNumber(value);
      case "is empty":
        return payloadValue === undefined || payloadValue === null || payloadValue === "";
      case "is not empty":
        return !(payloadValue === undefined || payloadValue === null || payloadValue === "");
      default:
        return false;
    }
  };

  const simulate = () => {
    try {
      const payload = JSON.parse(simulationInput || "{}");
      let matchedBranch = null;
      let actions = [];
      for (const branch of branchGroup.branches || []) {
        if (evaluateCondition(branch.condition, payload)) {
          matchedBranch = branch.label;
          actions = branch.actions || [];
          break;
        }
      }
      if (!matchedBranch) {
        actions = branchGroup.elseActions || [];
      }
      setSimulationResult({ payload, matchedBranch: matchedBranch || "Else", actions });
      setError("");
    } catch (err) {
      setError("Simulation failed: " + err.message);
      setSimulationResult(null);
    }
  };

  const validate = () => {
    const issues = [];
    flowNodes.forEach((n, idx) => {
      if (n.type === "condition") {
        if (!n.config?.field) issues.push(`Node ${idx + 1}: condition missing field`);
        if (!n.config?.operator) issues.push(`Node ${idx + 1}: condition missing operator`);
      }
      if (n.type === "trigger" && !n.config?.event) {
        issues.push(`Node ${idx + 1}: trigger missing event`);
      }
      if (n.type === "action" && !n.config?.channel) {
        issues.push(`Node ${idx + 1}: action missing channel`);
      }
    });
    (branchGroup.branches || []).forEach((b, idx) => {
      if (!b.condition?.field) issues.push(`Branch ${idx + 1}: missing field`);
      if (!b.condition?.operator) issues.push(`Branch ${idx + 1}: missing operator`);
    });
    setValidationIssues(issues);
    return issues;
  };

  const askAssistant = async () => {
    if (!aiPrompt) return;
    setQueryLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/conditional-logic-automation/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: aiPrompt })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Assistant error");
      setAiResponse(data.result || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setQueryLoading(false);
    }
  };

  const stats = useMemo(() => ({
    triggers: flowNodes.filter(n => n.type === "trigger").length,
    conditions: flowNodes.filter(n => n.type === "condition").length,
    actions: flowNodes.filter(n => n.type === "action").length,
    branches: branchGroup.branches?.length || 0
  }), [flowNodes, branchGroup]);

  return (
    <div style={{ background: "#0f1115", borderRadius: 18, boxShadow: "0 15px 60px #0007", padding: 32, fontFamily: "Inter, sans-serif", color: "#e5e7eb", border: "1px solid #1f2937" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <BackButton label="← Back to Suite" onClick={goBackToSuite} />
        <div style={{ color: "#9ca3af", fontSize: 13 }}>Workflows Suite · Conditional Logic & Branching</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontWeight: 800, fontSize: 30, margin: 0, color: "#a5f3fc" }}>Conditional Logic & Branching</h2>
            <span style={{ background: "#1f2937", color: "#93c5fd", padding: "6px 10px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>Pro</span>
            {activeTemplate && (
              <span style={{ background: "#0ea5e91a", color: "#67e8f9", padding: "6px 10px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>Template: {activeTemplate}</span>
            )}
          </div>
          <div style={{ color: "#9ca3af", marginTop: 6 }}>
            Build multi-branch workflows, simulate outcomes, and export/import configs in one place.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={validate} style={{ background: "#1e293b", color: "#e0f2fe", border: "1px solid #334155", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
            ✅ Validate
          </button>
          <button onClick={simulate} style={{ background: "#22c55e", color: "#0f172a", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>
            ▶️ Simulate
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#1f2937", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>
            ⬆️ Import
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import workflows" />
          <button onClick={handleExport} style={{ background: "#0ea5e9", color: "white", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>
            ⬇️ Export
          </button>
          {exported && <a href={exported} download="conditional-logic.json" style={{ alignSelf: "center", color: "#0ea5e9", fontWeight: 700 }}>Download</a>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[{ label: "Triggers", value: stats.triggers, color: "#93c5fd" }, { label: "Conditions", value: stats.conditions, color: "#a5f3fc" }, { label: "Actions", value: stats.actions, color: "#c084fc" }, { label: "Branches", value: stats.branches, color: "#f59e0b" }].map(card => (
              <div key={card.label} style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
                <div style={{ color: card.color, fontSize: 24, fontWeight: 800 }}>{card.value}</div>
                <div style={{ color: "#9ca3af", fontWeight: 600 }}>{card.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700, color: "#e5e7eb" }}>Palette & Templates</div>
              <input
                value={paletteFilter}
                onChange={e => setPaletteFilter(e.target.value)}
                placeholder="Search triggers, conditions, actions"
                style={{ background: "#0b1221", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 10, padding: "8px 10px", width: 240 }}
              />
            </div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {[{ title: "Triggers", items: filteredPalette.triggers, accent: "#38bdf8" }, { title: "Conditions", items: filteredPalette.conditions, accent: "#a78bfa" }, { title: "Actions", items: filteredPalette.actions, accent: "#22c55e" }].map(group => (
                <div key={group.title} style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 10 }}>
                  <div style={{ color: group.accent, fontWeight: 700, marginBottom: 6 }}>{group.title}</div>
                  {group.items.map(item => (
                    <div key={item.title} style={{ marginBottom: 8, padding: 8, background: "#0f172a", borderRadius: 10, border: "1px solid #1f2937" }}>
                      <div style={{ fontWeight: 700, color: "#e5e7eb" }}>{item.title}</div>
                      <div style={{ color: "#9ca3af", fontSize: 13 }}>{item.description}</div>
                      <button onClick={() => addNode(item)} style={{ marginTop: 6, background: group.accent, color: "#0b1221", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Add</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TEMPLATE_PRESETS.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)} style={{ background: "#0f172a", color: "#a5f3fc", border: "1px solid #1f2937", borderRadius: 10, padding: "10px 12px", fontWeight: 700, cursor: "pointer" }}>
                  ⚡ {t.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Flow Canvas</div>
              <span style={{ color: "#9ca3af" }}>Drag-less inline editing</span>
            </div>
            {flowNodes.length === 0 && (
              <div style={{ color: "#9ca3af", background: "#0b1221", border: "1px dashed #1f2937", borderRadius: 10, padding: 16 }}>
                Add triggers/conditions/actions from the palette or load a template.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {flowNodes.map(node => (
                <div key={node.id} style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: "#111827", padding: "4px 10px", borderRadius: 999, color: "#cbd5f5", fontWeight: 700 }}>{node.type?.toUpperCase()}</span>
                      <input
                        value={node.title || ""}
                        onChange={e => updateNode(node.id, { title: e.target.value })}
                        style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", minWidth: 140 }}
                      />
                    </div>
                    <button onClick={() => removeNode(node.id)} style={{ background: "transparent", color: "#f87171", border: "none", fontWeight: 800, cursor: "pointer" }}>✕</button>
                  </div>
                  <textarea
                    value={node.description || ""}
                    onChange={e => updateNode(node.id, { description: e.target.value })}
                    rows={2}
                    style={{ width: "100%", background: "#0f172a", color: "#cbd5f5", border: "1px solid #1f2937", borderRadius: 10, padding: 8, marginTop: 8 }}
                    placeholder="Describe this step"
                  />
                  {node.type === "condition" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <input
                        value={node.config?.field || ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, field: e.target.value } })}
                        placeholder="field"
                        style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", flex: 1, minWidth: 120 }}
                      />
                      <select
                        value={node.config?.operator || "equals"}
                        onChange={e => updateNode(node.id, { config: { ...node.config, operator: e.target.value } })}
                        style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", minWidth: 130 }}
                      >
                        {OPERATORS.map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                      <input
                        value={node.config?.value || ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, value: e.target.value } })}
                        placeholder="value"
                        style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", flex: 1, minWidth: 120 }}
                      />
                    </div>
                  )}
                  {node.type === "trigger" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <input
                        value={node.config?.event || ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, event: e.target.value } })}
                        placeholder="event id"
                        style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", minWidth: 160 }}
                      />
                      <input
                        value={node.config?.threshold ?? ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, threshold: e.target.value } })}
                        placeholder="threshold (optional)"
                        style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", minWidth: 160 }}
                      />
                    </div>
                  )}
                  {node.type === "action" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <input
                        value={node.config?.channel || ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, channel: e.target.value } })}
                        placeholder="channel (email/sms/flow/task)"
                        style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", minWidth: 180 }}
                      />
                      <input
                        value={node.config?.template || node.config?.target || ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, template: e.target.value, target: e.target.value } })}
                        placeholder="template/target"
                        style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", minWidth: 160 }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Branching Builder</div>
              <button onClick={addBranch} style={{ background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>+ Add Branch</button>
            </div>
            {(branchGroup.branches || []).length === 0 && (
              <div style={{ color: "#9ca3af", background: "#0b1221", border: "1px dashed #1f2937", borderRadius: 10, padding: 14 }}>
                Define IF/ELSEIF branches. Each branch can have its own actions. Unmatched traffic will fall into Else.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(branchGroup.branches || []).map((branch, idx) => (
                <div key={branch.id} style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ background: "#111827", color: "#c084fc", padding: "4px 10px", borderRadius: 999, fontWeight: 800 }}>IF #{idx + 1}</span>
                    <input
                      value={branch.label || ""}
                      onChange={e => setBranchGroup(prev => ({ ...prev, branches: prev.branches.map(b => b.id === branch.id ? { ...b, label: e.target.value } : b) }))}
                      placeholder="Branch label"
                      style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", minWidth: 140 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <input
                      value={branch.condition?.field || ""}
                      onChange={e => updateBranchCondition(branch.id, { field: e.target.value })}
                      placeholder="field"
                      style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", minWidth: 140 }}
                    />
                    <select
                      value={branch.condition?.operator || "equals"}
                      onChange={e => updateBranchCondition(branch.id, { operator: e.target.value })}
                      style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", minWidth: 150 }}
                    >
                      {OPERATORS.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <input
                      value={branch.condition?.value || ""}
                      onChange={e => updateBranchCondition(branch.id, { value: e.target.value })}
                      placeholder="value"
                      style={{ background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", minWidth: 140 }}
                    />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#9ca3af", fontWeight: 700 }}>Actions</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {ACTION_LIBRARY.map(a => (
                          <button key={a.title + branch.id} onClick={() => addBranchAction(branch.id, a)} style={{ background: "#0f172a", color: "#22c55e", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontWeight: 700 }}>
                            + {a.title}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      {(branch.actions || []).length === 0 && (
                        <div style={{ color: "#6b7280", background: "#0f172a", borderRadius: 8, padding: 10, border: "1px dashed #1f2937" }}>No actions yet.</div>
                      )}
                      {(branch.actions || []).map(action => (
                        <div key={action.id} style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <div>
                            <div style={{ color: "#22c55e", fontWeight: 700 }}>{action.title}</div>
                            <div style={{ color: "#9ca3af", fontSize: 13 }}>{action.description}</div>
                          </div>
                          <button onClick={() => removeBranchAction(branch.id, action.id)} style={{ background: "transparent", color: "#f87171", border: "none", cursor: "pointer", fontWeight: 800 }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#f97316", fontWeight: 800 }}>Else</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {ACTION_LIBRARY.map(a => (
                    <button key={a.title + "else"} onClick={() => addElseAction(a)} style={{ background: "#0f172a", color: "#f59e0b", border: "1px solid #1f2937", borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontWeight: 700 }}>
                      + {a.title}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {(branchGroup.elseActions || []).length === 0 && (
                  <div style={{ color: "#6b7280", background: "#0f172a", borderRadius: 8, padding: 10, border: "1px dashed #1f2937" }}>No else actions yet.</div>
                )}
                {(branchGroup.elseActions || []).map(action => (
                  <div key={action.id} style={{ background: "#0f172a", border: "1px solid #1f2937", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <div style={{ color: "#f59e0b", fontWeight: 700 }}>{action.title}</div>
                      <div style={{ color: "#9ca3af", fontSize: 13 }}>{action.description}</div>
                    </div>
                    <button onClick={() => removeElseAction(action.id)} style={{ background: "transparent", color: "#f87171", border: "none", cursor: "pointer", fontWeight: 800 }}>✕</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800, color: "#e5e7eb" }}>Simulation Preview</div>
              <small style={{ color: "#9ca3af" }}>Paste sample payload to test pathing</small>
            </div>
            <textarea
              value={simulationInput}
              onChange={e => setSimulationInput(e.target.value)}
              rows={7}
              style={{ width: "100%", background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 12, padding: 10 }}
            />
            <button onClick={simulate} style={{ marginTop: 10, background: "#22c55e", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Run Simulation</button>
            {simulationResult && (
              <div style={{ marginTop: 10, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 12 }}>
                <div style={{ color: "#a5f3fc", fontWeight: 800 }}>Matched: {simulationResult.matchedBranch}</div>
                <div style={{ color: "#9ca3af", marginTop: 4 }}>Actions to fire:</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#e5e7eb" }}>
                  {simulationResult.actions.map(a => (
                    <li key={a.id}>{a.title} ({a.config?.channel || "action"})</li>
                  ))}
                  {simulationResult.actions.length === 0 && <li style={{ color: "#6b7280" }}>No actions</li>}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, color: "#e5e7eb", marginBottom: 8 }}>Data Explorer</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <button onClick={fetchLogicBlocks} style={{ background: "#0f172a", color: "#a5f3fc", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>Load Logic Blocks</button>
              <button onClick={fetchWorkflows} style={{ background: "#0f172a", color: "#22c55e", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>Load Workflows</button>
              <button onClick={fetchTriggers} style={{ background: "#0f172a", color: "#38bdf8", border: "1px solid #1f2937", borderRadius: 8, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>Load Triggers</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {logicBlocks.map(b => (
                <div key={b.id} style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 10, padding: 8 }}>
                  <div style={{ color: "#a5f3fc", fontWeight: 700 }}>{b.name}</div>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>{b.description}</div>
                  <button onClick={() => addNode({ ...b, type: "condition", title: b.name, description: b.description })} style={{ marginTop: 6, background: "#0ea5e9", color: "white", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Add to Flow</button>
                </div>
              ))}
              {workflows.map(w => (
                <div key={w.id} style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 10, padding: 8 }}>
                  <div style={{ color: "#22c55e", fontWeight: 700 }}>{w.name}</div>
                  <div style={{ color: "#9ca3af", fontSize: 13 }}>Steps: {(w.steps || []).join(", ")}</div>
                </div>
              ))}
              {triggers.map(t => (
                <div key={t.id} style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 10, padding: 8 }}>
                  <div style={{ color: "#38bdf8", fontWeight: 700 }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, color: "#e5e7eb", marginBottom: 8 }}>Assistant</div>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={4}
              placeholder="Ask for branching ideas, guardrails, or messaging logic"
              style={{ width: "100%", background: "#0f172a", color: "#e5e7eb", border: "1px solid #1f2937", borderRadius: 12, padding: 10 }}
            />
            <button onClick={askAssistant} disabled={queryLoading} style={{ marginTop: 8, background: "#6366f1", color: "white", border: "none", borderRadius: 10, padding: "10px 12px", fontWeight: 800, cursor: "pointer", opacity: queryLoading ? 0.7 : 1 }}>
              {queryLoading ? "Thinking..." : "Ask Assistant"}
            </button>
            {aiResponse && (
              <div style={{ marginTop: 8, background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 10, color: "#e5e7eb", whiteSpace: "pre-wrap" }}>{aiResponse}</div>
            )}
          </div>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, color: "#e5e7eb", marginBottom: 8 }}>Validation</div>
            {validationIssues.length === 0 ? (
              <div style={{ color: "#22c55e" }}>No blocking issues detected. Ready to ship.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, color: "#fca5a5" }}>
                {validationIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, color: "#e5e7eb", marginBottom: 8 }}>Feedback</div>
            <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} aria-label="Send feedback">
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={2}
                style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 10, border: "1px solid #1f2937", marginBottom: 10, background: "#0f172a", color: "#e5e7eb" }}
                placeholder="What should we improve next?"
                aria-label="Feedback input"
              />
              <button type="submit" style={{ background: "#7fffd4", color: "#0b1221", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Send Feedback</button>
            </form>
          </div>

          {(imported || error) && (
            <div style={{ background: "#0b1221", border: "1px solid #1f2937", borderRadius: 12, padding: 10 }}>
              {imported && <div style={{ color: "#22c55e" }}>Imported: {imported}</div>}
              {error && <div style={{ color: "#fca5a5" }}>{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
