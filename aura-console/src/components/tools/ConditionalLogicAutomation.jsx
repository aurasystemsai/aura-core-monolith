﻿import React, { useEffect, useMemo, useState, useRef } from "react";
import { apiFetch } from "../../api";
import BackButton from "./BackButton";

const STORAGE_KEY = "conditional-logic-automation:draft";

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

const PAYLOAD_PRESETS = [
  { id: "abandoned-cart", name: "Abandoned Cart", payload: { event: "abandoned_cart", cart_value: 180, country: "US", segment: "VIP" }, badge: "dev" },
  { id: "ltv-drop", name: "LTV Drop EU", payload: { event: "ltv_drop", region: "EU", ltv_delta: -60 }, badge: "dev" },
  { id: "high-aov", name: "High AOV", payload: { event: "aov_over", cart_value: 320, segment: "High AOV" }, badge: "dev" }
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
  const [issueHelp, setIssueHelp] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [env, setEnv] = useState("dev");
  const [draftStatus, setDraftStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [preflightIssues, setPreflightIssues] = useState([]);
  const [preflightTrace, setPreflightTrace] = useState([]);
  const [preflightStatus, setPreflightStatus] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return JSON.parse(window.localStorage.getItem("suite:status:conditional-logic-automation")) || null;
    } catch {
      return null;
    }
  });
  const [showPreflightPopover, setShowPreflightPopover] = useState(false);
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [disabled, setDisabled] = useState(false);
  const devSandbox = env === "dev";
  const applyQuickFix = (kind) => {
    if (isViewer) return;
    if (kind === "approver") {
      setConfirmationNote(prev => prev || "Approval note: ops@shopify-brand.com signed off.");
    }
    if (kind === "prod-note") {
      if (env === "prod") {
        setConfirmationNote(prev => prev || "Prod rollout intent: safe to launch.");
      } else {
        setEnv("prod");
        setConfirmationNote("Prod rollout intent: safe to launch.");
      }
    }
    if (kind === "trigger-action") {
      setFlowNodes(prev => {
        if (!prev.length) {
          return [
            { type: "trigger", title: "Abandoned Cart", description: "Cart idle", config: { event: "abandoned_cart" } },
            { type: "action", title: "Notify Slack", description: "Alert #ops", config: { channel: "slack", template: "ops-alert" } }
          ];
        }
        const next = [...prev];
        if (!next[0] || next[0].type !== "trigger") {
          next.unshift({ type: "trigger", title: "Abandoned Cart", description: "Cart idle", config: { event: "abandoned_cart" } });
        }
        if (!next.find(n => n.type === "action")) {
          next.push({ type: "action", title: "Notify Slack", description: "Alert #ops", config: { channel: "slack", template: "ops-alert" } });
        }
        return next;
      });
    }
    if (kind === "dedupe-labels") {
      setFlowNodes(prev => {
        const seen = new Map();
        return prev.map(node => {
          const base = node.title || "Node";
          const key = base.trim().toLowerCase();
          const count = seen.get(key) || 0;
          seen.set(key, count + 1);
          return count === 0 ? node : { ...node, title: `${base} (${count + 1})` };
        });
      });
      setBranchGroup(prev => {
        const seenBranches = new Map();
        const branches = (prev.branches || []).map(branch => {
          const base = branch.label || "Branch";
          const key = base.trim().toLowerCase();
          const count = seenBranches.get(key) || 0;
          seenBranches.set(key, count + 1);
          return count === 0 ? branch : { ...branch, label: `${base} (${count + 1})` };
        });
        return { ...prev, branches };
      });
    }
  };

  const quickFixForIssue = (issue = "") => {
    const lower = issue.toLowerCase();
    if (lower.includes("approver") || lower.includes("approval")) return "approver";
    if (lower.includes("prod") || lower.includes("ship") || lower.includes("note")) return "prod-note";
    if (lower.includes("trigger") || lower.includes("action")) return "trigger-action";
    if (lower.includes("branch") || lower.includes("duplicate")) return "dedupe-labels";
    return null;
  };

  const restoreSnapshot = (snap) => {
    if (!snap) return;
    if (snap.flowNodes) setFlowNodes(snap.flowNodes);
    if (snap.branchGroup) setBranchGroup(snap.branchGroup);
    if (snap.simulationInput) setSimulationInput(snap.simulationInput);
    if (snap.env) setEnv(snap.env);
    if (snap.confirmationNote !== undefined) setConfirmationNote(snap.confirmationNote);
    setLastSimulatedSnapshot(snap);
  };
  const clearPreflightStatus = () => {
    setPreflightStatus(null);
    setPreflightIssues([]);
    setPreflightTrace([]);
    try { window.localStorage.removeItem("suite:status:conditional-logic-automation"); } catch (_) {}
  };

  const downloadPreflightReport = () => {
    const payload = { status: preflightStatus, issues: preflightIssues, trace: preflightTrace, generatedAt: Date.now() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conditional-logic-preflight.json";
    a.click();
    setTimeout(() =>URL.revokeObjectURL(url), 2000);
  };

  const attachPreflightForReviewer = () => {
    const payload = {
      reviewer: reviewerEmail || "reviewer@shopify-brand.com",
      status: preflightStatus,
      issues: preflightIssues,
      trace: preflightTrace,
      generatedAt: Date.now()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conditional-logic-preflight-review.json";
    a.click();
    setTimeout(() =>URL.revokeObjectURL(url), 2000);
  };
  const [selectedPayloadPreset, setSelectedPayloadPreset] = useState("abandoned-cart");
  const [lastSimulatedSnapshot, setLastSimulatedSnapshot] = useState(null);
  const [confirmationNote, setConfirmationNote] = useState("");
  const fileInputRef = useRef();
  const [role] = useState(() => {
    if (typeof window === "undefined") return "admin";
    return window.__AURA_USER?.role || window.localStorage.getItem("aura-role") || "admin";
  });
  const [accessRequested, setAccessRequested] = useState(false);
  const [dirtySinceSave, setDirtySinceSave] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const hydratedRef = useRef(false);
  const dirtySkipRef = useRef(true);

  const isViewer = role === "viewer";

  const goBackToSuite = () => {
    if (typeof window !== "undefined" && typeof window.__AURA_TO_SUITE === "function") {
      window.__AURA_TO_SUITE("workflows");
    }
  };

  const pushUndoSnapshot = () => {
    setUndoStack(prev => [...prev.slice(-9), JSON.parse(JSON.stringify({ flowNodes, branchGroup, simulationInput, env }))]);
    setRedoStack([]);
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
    if (isViewer) return;
    pushUndoSnapshot();
    setFlowNodes(prev => [...prev, { ...item, id: uniqueId(), config: { ...(item.config || {}) } }]);
  };

  const updateNode = (id, patch) => {
    if (isViewer) return;
    pushUndoSnapshot();
    setFlowNodes(prev => prev.map(node => (node.id === id ? { ...node, ...patch } : node)));
  };

  const removeNode = id => {
    if (isViewer) return;
    pushUndoSnapshot();
    setFlowNodes(prev => prev.filter(n => n.id !== id));
  };

  const addBranch = () => {
    if (isViewer) return;
    pushUndoSnapshot();
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
    if (isViewer) return;
    pushUndoSnapshot();
    setBranchGroup(prev => ({
      ...prev,
      branches: prev.branches.map(b => (b.id === branchId ? { ...b, condition: { ...b.condition, ...patch } } : b))
    }));
  };

  const addBranchAction = (branchId, action) => {
    if (isViewer) return;
    pushUndoSnapshot();
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
    if (isViewer) return;
    pushUndoSnapshot();
    setBranchGroup(prev => ({
      ...prev,
      branches: prev.branches.map(b =>
        b.id === branchId ? { ...b, actions: b.actions.filter(a => a.id !== actionId) } : b
      )
    }));
  };

  const addElseAction = action => {
    if (isViewer) return;
    pushUndoSnapshot();
    setBranchGroup(prev => ({
      ...prev,
      elseActions: [...(prev.elseActions || []), { ...action, id: uniqueId(), config: { ...(action.config || {}) } }]
    }));
  };

  const removeElseAction = actionId => {
    if (isViewer) return;
    pushUndoSnapshot();
    setBranchGroup(prev => ({
      ...prev,
      elseActions: (prev.elseActions || []).filter(a => a.id !== actionId)
    }));
  };

  const applyTemplate = preset => {
    if (isViewer) return;
    pushUndoSnapshot();
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
    if (isViewer) return;
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
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
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
    if (isViewer) return;
    if (devSandbox) {
      setError("Sandbox mode: switch to stage/prod to run a full simulation.");
      return;
    }
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
      const snapshot = {
        flowNodes,
        branchGroup,
        simulatedAt: Date.now(),
        payload,
        env
      };
      setSimulationResult({ payload, matchedBranch: matchedBranch || "Else", actions });
      setLastSimulatedSnapshot(snapshot);
      setError("");
      setDirtySinceSave(false);
    } catch (err) {
      setError("Simulation failed: " + err.message);
      setSimulationResult(null);
    }
  };

  const runDryRun = () => {
    if (isViewer) return;
    setEnv("dev");
    runPreflight();
  };

  const rollbackToLastSimulation = () => {
    if (isViewer) return;
    if (!lastSimulatedSnapshot) return;
    setFlowNodes(lastSimulatedSnapshot.flowNodes || []);
    setBranchGroup(lastSimulatedSnapshot.branchGroup || { branches: [], elseActions: [] });
    if (lastSimulatedSnapshot.payload) {
      try {
        setSimulationInput(JSON.stringify(lastSimulatedSnapshot.payload, null, 2));
      } catch (_) {
        /* ignore */
      }
    }
    if (lastSimulatedSnapshot.env) setEnv(lastSimulatedSnapshot.env);
  };

  const runPreflight = () => {
    const issues = [];
    const trace = [];
    const record = (status, detail) => trace.push({ status, detail });
    const triggersCount = flowNodes.filter(n => n.type === "trigger").length;
    const actionsCount = flowNodes.filter(n => n.type === "action").length;
    const branches = branchGroup.branches || [];

    if (env === "prod") {
      if (!confirmationNote.trim()) {
        issues.push("Add a ship note/intent before running in prod.");
        record("fail", "Prod mode requires a confirmation note.");
      } else {
        record("pass", "Prod note present.");
      }
    } else {
      record("pass", `Env set to ${env.toUpperCase()}.`);
    }

    if (!flowNodes.length) {
      issues.push("Add at least one node to start the flow.");
      record("fail", "No nodes configured yet.");
    } else {
      record("pass", `Flow has ${flowNodes.length} node(s).`);
    }

    if (!flowNodes[0] || flowNodes[0].type !== "trigger") {
      issues.push("First step must be a trigger.");
      record("fail", "First node is not a trigger.");
    } else {
      record("pass", "Flow starts with a trigger.");
    }

    if (!triggersCount) {
      issues.push("Add at least one trigger to start the flow.");
      record("fail", "No triggers detected.");
    } else {
      record("pass", `${triggersCount} trigger(s) configured.`);
    }

    if (actionsCount === 0) {
      issues.push("No actions configured yet.");
      record("fail", "No actions present.");
    } else {
      record("pass", `${actionsCount} action(s) configured.`);
    }

    const allowedTypes = ["trigger", "condition", "action"];
    flowNodes.forEach((node, idx) => {
      if (!allowedTypes.includes(node.type)) {
        issues.push(`Node ${idx + 1} has invalid type: ${node.type}`);
        record("fail", `Node ${idx + 1} type ${node.type || "unknown"} is invalid.`);
      }
      if (node.type === "trigger" && !node.config?.event) {
        issues.push(`Node ${idx + 1}: trigger missing event`);
        record("fail", `Trigger ${idx + 1} missing event.`);
      }
      if (node.type === "condition") {
        if (!node.config?.field) issues.push(`Node ${idx + 1}: condition missing field`);
        if (!node.config?.operator) issues.push(`Node ${idx + 1}: condition missing operator`);
        if (!node.config?.field || !node.config?.operator) record("fail", `Condition ${idx + 1} incomplete.`);
      }
      if (node.type === "action" && !node.config?.channel) {
        issues.push(`Node ${idx + 1}: action missing channel`);
        record("fail", `Action ${idx + 1} missing channel.`);
      }
    });

    if (branches.length === 0) {
      issues.push("Define at least one IF branch for routing.");
      record("fail", "No branches configured.");
    } else {
      record("pass", `${branches.length} branch(es) configured.`);
    }

    const branchLabels = branches.map(b => (b.label || "").trim()).filter(Boolean);
    const duplicateBranchLabels = branchLabels.filter((label, idx) => branchLabels.indexOf(label) !== idx);
    if (duplicateBranchLabels.length) {
      const unique = [...new Set(duplicateBranchLabels)];
      issues.push(`Duplicate branch labels: ${unique.join(", ")}`);
      record("fail", `Duplicate branch labels found: ${unique.join(", ")}.`);
    }

    branches.forEach((b, idx) => {
      if (!b.condition?.field || !b.condition?.operator) {
        issues.push(`Branch ${idx + 1}: condition incomplete`);
        record("fail", `Branch ${idx + 1} condition missing field/operator.`);
      }
      if (!(b.actions || []).length) {
        issues.push(`Branch ${idx + 1}: add at least one action`);
        record("fail", `Branch ${idx + 1} has no actions.`);
      }
    });

    if (!(branchGroup.elseActions || []).length) {
      record("warn", "No ELSE fallback actions configured.");
    } else {
      record("pass", "Else path has actions.");
    }

    if (validationIssues.length) {
      issues.push(...validationIssues);
      record("warn", "Validation issues bubbled into preflight.");
    } else {
      record("pass", "Validation checks clear.");
    }

    setPreflightIssues(issues);
    setPreflightTrace(trace);
    const status = { ok: issues.length === 0, ts: Date.now(), issues: issues.length };
    setPreflightStatus(status);
    try { window.localStorage.setItem("suite:status:conditional-logic-automation", JSON.stringify(status)); } catch (_) {}
    return issues;
  };

  useEffect(() => {
    if (!hydratedRef.current) return;
    if (env === "prod" || (branchGroup.branches || []).length > 2) {
      runPreflight();
    }
  }, [env, branchGroup.branches?.length]);

  const handleUndo = () => {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(undoStack.slice(0, -1));
    setRedoStack(r => [...r.slice(-9), JSON.parse(JSON.stringify({ flowNodes, branchGroup, simulationInput, env }))]);
    setFlowNodes(prev.flowNodes || []);
    setBranchGroup(prev.branchGroup || { branches: [], elseActions: [] });
    if (prev.simulationInput) setSimulationInput(prev.simulationInput);
    if (prev.env) setEnv(prev.env);
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setUndoStack(u => [...u.slice(-9), JSON.parse(JSON.stringify({ flowNodes, branchGroup, simulationInput, env }))]);
    setFlowNodes(next.flowNodes || []);
    setBranchGroup(next.branchGroup || { branches: [], elseActions: [] });
    if (next.simulationInput) setSimulationInput(next.simulationInput);
    if (next.env) setEnv(next.env);
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

  const diffSummary = useMemo(() => {
    if (!lastSimulatedSnapshot) return null;
    const prevFlow = lastSimulatedSnapshot.flowNodes || [];
    const prevBranches = lastSimulatedSnapshot.branchGroup?.branches || [];
    const added = flowNodes.filter(n => !prevFlow.find(p => p.id === n.id));
    const removed = prevFlow.filter(p => !flowNodes.find(n => n.id === p.id));
    const changed = flowNodes.filter(n => {
      const prev = prevFlow.find(p => p.id === n.id);
      if (!prev) return false;
      return prev.title !== n.title || prev.type !== n.type || JSON.stringify(prev.config || {}) !== JSON.stringify(n.config || {});
    });
    const branchDelta = (branchGroup.branches || []).length - prevBranches.length;
    return { added, removed, changed, branchDelta };
  }, [flowNodes, branchGroup, lastSimulatedSnapshot]);

  const healthSignals = useMemo(() => {
    const guardrailsOk = preflightIssues.length === 0;
    const triggerOk = stats.triggers > 0;
    const branchDepth = (branchGroup.branches || []).length;
    const coverage = Math.min(100, (flowNodes.length * 12) + (branchDepth * 6) + (guardrailsOk ? 16 : 0) + (triggerOk ? 10 : 0) + (simulationResult ? 6 : 0));
    return {
      guardrailsOk,
      triggerOk,
      coverage,
      summary: `${stats.triggers} triggers · ${stats.conditions} conditions · ${stats.actions} actions · ${branchDepth} branches`
    };
  }, [flowNodes.length, branchGroup.branches, stats, preflightIssues.length, simulationResult]);

  const healthChecklist = useMemo(() => ([
    { label: "Trigger present", ok: stats.triggers > 0 },
    { label: "Branch paths defined", ok: (branchGroup.branches || []).length > 0 },
    { label: "Preflight clear", ok: preflightIssues.length === 0 },
    { label: "Prod note when required", ok: env !== "prod" ? true : !!confirmationNote.trim() }
  ]), [stats.triggers, branchGroup.branches, preflightIssues.length, env, confirmationNote]);

  const formatTime = ts => ts ? new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

  const handleManualSave = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      flowNodes,
      branchGroup,
      simulationInput,
      env,
      lastSavedAt: Date.now()
    }));
    setDraftStatus("saved");
    setLastSavedAt(Date.now());
    setDirtySinceSave(false);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.flowNodes) setFlowNodes(parsed.flowNodes);
        if (parsed.branchGroup) setBranchGroup(parsed.branchGroup);
        if (parsed.simulationInput) setSimulationInput(parsed.simulationInput);
        if (parsed.env) setEnv(parsed.env);
        if (parsed.lastSavedAt) setLastSavedAt(parsed.lastSavedAt);
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
        flowNodes,
        branchGroup,
        simulationInput,
        env,
        lastSavedAt: Date.now()
      }));
      setDraftStatus("saved");
      setLastSavedAt(Date.now());
      setDirtySinceSave(false);
    }, 400);
    return () => clearTimeout(handle);
  }, [flowNodes, branchGroup, simulationInput, env]);

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
  }, [flowNodes, branchGroup, simulationInput, env, confirmationNote]);

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

  useEffect(() => {
    const listener = e => {
      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleManualSave();
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        simulate();
      }
      if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        addBranch();
      }
      if (!e.ctrlKey && !e.metaKey && e.key.toLowerCase() === "a") {
        e.preventDefault();
        addNode(ACTION_LIBRARY[0]);
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
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [flowNodes, branchGroup, undoStack, redoStack]);

  return (
    <div style={{ background: "#0a0b0f", borderRadius: 18, boxShadow: "0 15px 60px #0007", padding: 32, fontFamily: "Inter, sans-serif", color: "#f6f7fb", border: "1px solid #283044" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
        <BackButton label="← Back to Suite" onClick={goBackToSuite} />
        <div style={{ color: "#b8bed2", fontSize: 13 }}>Workflows Suite · Conditional Logic & Branching</div>
      </div>

      {isViewer && (
        <div style={{ background: "#283044", border: "1px solid #4b5780", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#fcd34d" }}>View-only mode</div>
            <div style={{ color: "#b8bed2", fontSize: 13 }}>You can inspect conditional flows but need elevated access to edit or run simulations.</div>
          </div>
          <button onClick={() => setAccessRequested(true)} disabled={accessRequested} style={{ background: accessRequested ? "#4b5780" : "#22c55e", color: "#1f2433", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: accessRequested ? "default" : "pointer" }}>
            {accessRequested ? "Request sent" : "Request edit access"}
          </button>
        </div>
      )}
      {devSandbox && !isViewer && (
        <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 800, color: "#f59e0b" }}>Sandbox only</div>
            <div style={{ color: "#b8bed2", fontSize: 13 }}>Publishing is disabled in dev. Switch to Stage/Prod to run full simulations and attach preflight.</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setEnv("stage")} style={{ background: "#283044", color: "#f6f7fb", border: "1px solid #4b5780", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Switch to Stage</button>
            <button onClick={() => setEnv("prod")} style={{ background: "#22c55e", color: "#1f2433", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Go Prod</button>
          </div>
        </div>
      )}
      {issueHelp && (
        <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: 10, display: "grid", gap: 8, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ color: "#a5f3fc", fontWeight: 800 }}>Issue help</div>
            <button onClick={() => setIssueHelp(null)} style={{ background: "#283044", color: "#f6f7fb", border: "1px solid #4b5780", borderRadius: 8, padding: "4px 8px", fontWeight: 700, cursor: "pointer" }}>Close</button>
          </div>
          <div style={{ color: "#f6f7fb" }}>{issueHelp}</div>
          <div style={{ color: "#b8bed2", fontSize: 13 }}>Recommended fix: {issueHelp.toLowerCase().includes("branch") ? "Define branch conditions and ensure at least one action per branch." : issueHelp.toLowerCase().includes("trigger") ? "Add or enable a trigger node." : issueHelp.toLowerCase().includes("approval") ? "Capture an approver email or disable approvals." : "Review the trace, adjust conditions/actions, then rerun preflight."}</div>
        </div>
      )}

      {history.length > 0 && (
        <div style={{ marginBottom: 12, background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 10, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 800 }}>Recent simulations</div>
            <div style={{ color: "#b8bed2", fontSize: 12 }}>Last {Math.min(3, history.length)} shown</div>
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {history.slice(0, 3).map((h, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: "8px 10px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#f6f7fb" }}>{h.summary || "Run"} · {h.env}</div>
                  <div style={{ color: "#b8bed2", fontSize: 12 }}>Saved {h.at ? new Date(h.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "recent"}</div>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button aria-label={`Load simulation ${idx + 1}`} onClick={() => restoreSnapshot(h)} style={{ background: "#283044", color: "#f6f7fb", border: "1px solid #4b5780", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Load</button>
                  <button aria-label={`Re-run simulation ${idx + 1}`} onClick={() => { restoreSnapshot(h); setTimeout(() => simulate(), 0); }} disabled={devSandbox || isViewer} style={{ background: devSandbox ? "#283044" : "#22c55e", color: "#1f2433", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: devSandbox || isViewer ? "not-allowed" : "pointer", opacity: devSandbox || isViewer ? 0.6 : 1 }}>{devSandbox ? "Sandbox" : "Re-run"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showCommandPalette && (
        <div style={{ position: "fixed", inset: 0, background: "#0009", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 14, padding: 16, width: "min(520px, 92vw)", boxShadow: "0 18px 60px #000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontWeight: 800, color: "#a5f3fc" }}>Command Palette</div>
              <button onClick={() => setShowCommandPalette(false)} style={{ background: "transparent", color: "#b8bed2", border: "none", cursor: "pointer", fontWeight: 700 }}>Esc</button>
            </div>
            {[{ label: "Save draft", action: handleManualSave, hotkey: "Ctrl+S", disabled: false }, { label: "Run preflight", action: runPreflight, hotkey: "Alt+P", disabled: false }, { label: "Simulate", action: simulate, hotkey: "Ctrl+Enter", disabled: isViewer }, { label: "Undo", action: handleUndo, hotkey: "Ctrl+Z", disabled: !undoStack.length || isViewer }, { label: "Redo", action: handleRedo, hotkey: "Ctrl+Shift+Z", disabled: !redoStack.length || isViewer }].map(cmd => (
              <button key={cmd.label} disabled={cmd.disabled} onClick={() => { cmd.action(); setShowCommandPalette(false); }} style={{ width: "100%", textAlign: "left", background: cmd.disabled ? "#283044" : "#1f2433", color: cmd.disabled ? "#9aa3b8" : "#f6f7fb", border: "1px solid #283044", borderRadius: 10, padding: "10px 12px", marginBottom: 8, cursor: cmd.disabled ? "not-allowed" : "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{cmd.label}</span>
                <span style={{ fontSize: 12, color: "#b8bed2" }}>{cmd.hotkey}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ position: "sticky", top: 0, zIndex: 4, display: "flex", gap: 12, flexWrap: "wrap", background: "#0a0b0f", paddingBottom: 10 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: "8px 12px" }}>
          <span style={{ color: "#b8bed2", fontWeight: 700 }}>Env</span>
          {["dev", "stage", "prod"].map(opt => (
            <button key={opt} onClick={() => setEnv(opt)} style={{ background: env === opt ? "#0ea5e9" : "#1f2433", color: env === opt ? "#1f2433" : "#f6f7fb", border: "1px solid #283044", borderRadius: 999, padding: "6px 12px", fontWeight: 800, cursor: "pointer" }}>
              {opt.toUpperCase()}
            </button>
          ))}
          <label style={{ display: "flex", alignItems: "center", gap: 6, background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: "6px 10px", fontWeight: 700 }}>
            <input type="checkbox" checked={disabled} onChange={e => setDisabled(e.target.checked)} />Disabled
          </label>
          <span style={{ color: draftStatus === "saved" ? "#22c55e" : "#fbbf24", fontSize: 12 }}>{draftStatus === "saved" ? `Saved ${formatTime(lastSavedAt)}` : "Saving..."}</span>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={runPreflight} style={{ background: "#283044", color: "#fcd34d", border: "1px solid #4b5780", borderRadius: 12, padding: "10px 12px", fontWeight: 800, cursor: "pointer" }}>Preflight (Ctrl+S)</button>
          <button onClick={runDryRun} style={{ background: "#22c55e", color: "#1f2433", border: "none", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: "pointer" }}>Dry-run (dev)</button>
          {preflightStatus && (
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, border: "1px solid #283044", background: preflightStatus.ok ? "#1f2433" : "#283044", color: preflightStatus.ok ? "#22c55e" : preflightStatus.issues ? "#fcd34d" : "#f87171", fontWeight: 800, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: preflightStatus.ok ? "#22c55e" : preflightStatus.issues ? "#f59e0b" : "#ef4444" }} />
              <span>{preflightStatus.ok ? "Preflight pass" : preflightStatus.issues ? `${preflightStatus.issues} issues` : "Preflight failed"}</span>
              {preflightStatus.ts ? <span style={{ color: "#b8bed2", fontWeight: 600 }}>· {new Date(preflightStatus.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> : null}
              <button onClick={() => setShowPreflightPopover(v => !v)} style={{ background: "transparent", border: "none", color: "#f6f7fb", cursor: "pointer", fontWeight: 800 }}>Trace</button>
              <button onClick={clearPreflightStatus} style={{ marginLeft: 2, background: "transparent", border: "none", color: "#b8bed2", cursor: "pointer", fontWeight: 800 }}>Clear</button>
              <button onClick={downloadPreflightReport} style={{ background: "transparent", border: "none", color: "#67e8f9", cursor: "pointer", fontWeight: 800 }}>Save</button>
              {showPreflightPopover && (
                <div style={{ position: "absolute", top: "110%", right: 0, minWidth: 220, background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: 10, boxShadow: "0 10px 30px rgba(0,0,0,0.4)", zIndex: 10 }}>
                  <div style={{ fontWeight: 800, color: "#fcd34d", marginBottom: 6 }}>Preflight issues</div>
                  <div style={{ color: "#b8bed2", fontSize: 12, marginBottom: 6 }}>Why this matters: stops broken branches from impacting Shopify customers.</div>
                  {preflightIssues.length === 0 ? <div style={{ color: "#22c55e" }}>Clear</div> : (
                    <ul style={{ margin: 0, paddingLeft: 16, color: "#f6f7fb", maxHeight: 160, overflow: "auto" }}>
                      {preflightIssues.slice(0, 6).map((p, i) => <li key={i}>{p}</li>)}
                      {preflightIssues.length > 6 && <li style={{ color: "#b8bed2" }}>…{preflightIssues.length - 6} more</li>}
                    </ul>
                  )}
                  <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button onClick={() => applyQuickFix("approver")} style={{ background: "#0ea5e9", color: "#1f2433", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add approver note</button>
                    <button onClick={() => applyQuickFix("prod-note")} style={{ background: "#f59e0b", color: "#1f2433", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add prod note</button>
                    <button onClick={() => applyQuickFix("trigger-action")} style={{ background: "#22c55e", color: "#1f2433", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Add trigger/action</button>
                    <button onClick={() => applyQuickFix("dedupe-labels")} style={{ background: "#4f46e5", color: "#f6f7fb", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 800, cursor: "pointer" }}>Fix duplicates</button>
                  </div>
                  {preflightTrace.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ color: "#67e8f9", fontWeight: 700 }}>Trace</div>
                      <ul style={{ margin: 0, paddingLeft: 16, color: "#f6f7fb", maxHeight: 140, overflow: "auto" }}>
                        {preflightTrace.slice(0, 5).map((t, i) => (
                          <li key={i}>{t.label}: {t.issues?.join("; ")}</li>
                        ))}
                        {preflightTrace.length > 5 && <li style={{ color: "#b8bed2" }}>…{preflightTrace.length - 5} more</li>}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </span>
          )}
          <button aria-label="Run simulation" onClick={simulate} disabled={devSandbox || isViewer} style={{ background: devSandbox ? "#283044" : "#22c55e", color: devSandbox ? "#b8bed2" : "#1f2433", border: "none", borderRadius: 12, padding: "10px 12px", fontWeight: 900, cursor: devSandbox || isViewer ? "not-allowed" : "pointer", opacity: devSandbox || isViewer ? 0.65 : 1 }}>{devSandbox ? "Sandbox (set Stage)" : "️ Run Simulation (Ctrl+Enter)"}</button>
          <button onClick={rollbackToLastSimulation} disabled={!lastSimulatedSnapshot} style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 12, padding: "10px 12px", fontWeight: 800, cursor: lastSimulatedSnapshot ? "pointer" : "not-allowed", opacity: lastSimulatedSnapshot ? 1 : 0.5 }}>Rollback to last sim</button>
          <button onClick={() => setSelectedPayloadPreset(p => p)} style={{ background: "#0ea5e91a", color: "#67e8f9", border: "1px solid #283044", borderRadius: 12, padding: "10px 12px", fontWeight: 800 }}>Dev Payload Presets</button>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginLeft: "auto" }}>
          <span style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 999, padding: "6px 10px", color: (flowNodes.filter(n => n.type === "action").length >= 4 || (branchGroup.branches || []).length >= 3) ? "#f97316" : "#22c55e", fontWeight: 700 }}>Perf guardrail: {(flowNodes.filter(n => n.type === "action").length >= 4 || (branchGroup.branches || []).length >= 3) ? "tighten" : "OK"}</span>
          <span style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 999, padding: "6px 10px", color: disabled ? "#f97316" : "#22c55e", fontWeight: 700 }}>Disabled: {disabled ? "Yes" : "No"}</span>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <input value={reviewerEmail} onChange={e => setReviewerEmail(e.target.value)} placeholder="Reviewer email" style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 10, padding: "6px 10px", minWidth: 220 }} />
        <button onClick={attachPreflightForReviewer} style={{ background: "#8b5cf6", color: "#1f2433", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>Attach preflight</button>
        <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: "6px 10px", color: preflightIssues.length ? "#f97316" : "#22c55e", fontWeight: 700 }}>Guardrails: {preflightIssues.length ? `${preflightIssues.length} issues` : "clear"}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2 style={{ fontWeight: 800, fontSize: 30, margin: 0, color: "#a5f3fc" }}>Conditional Logic & Branching</h2>
            <span style={{ background: "#283044", color: "#93c5fd", padding: "6px 10px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>Pro</span>
            {activeTemplate && (
              <span style={{ background: "#0ea5e91a", color: "#67e8f9", padding: "6px 10px", borderRadius: 999, fontSize: 13, fontWeight: 700 }}>Template: {activeTemplate}</span>
            )}
          </div>
          <div style={{ color: "#b8bed2", marginTop: 6 }}>
            Build multi-branch workflows, simulate outcomes, and export/import configs in one place.
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={validate} style={{ background: "#283044", color: "#e0f2fe", border: "1px solid #4b5780", borderRadius: 10, padding: "10px 14px", fontWeight: 700, cursor: "pointer" }}>
             Validate
          </button>
          <button onClick={simulate} style={{ background: "#22c55e", color: "#1f2433", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>
            ️ Simulate
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#283044", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>
            ️ Import
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import workflows" />
          <button onClick={handleExport} style={{ background: "#0ea5e9", color: "white", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>
            ️ Export
          </button>
          {exported && <a href={exported} download="conditional-logic.json" style={{ alignSelf: "center", color: "#0ea5e9", fontWeight: 700 }}>Download</a>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginBottom: 12 }}>
        <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 12 }}>
          <div style={{ color: "#b8bed2", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.4 }}>Readiness</div>
          <div style={{ fontWeight: 800, fontSize: 22, color: healthSignals.coverage >= 85 ? "#22c55e" : "#fbbf24" }}>{healthSignals.coverage}%</div>
          <div style={{ color: "#b8bed2", fontSize: 13 }}>{healthSignals.summary}</div>
        </div>
        <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Guardrails</div>
          <div style={{ color: healthSignals.guardrailsOk ? "#22c55e" : "#f59e0b", fontWeight: 700 }}>{healthSignals.guardrailsOk ? "Clear" : `${preflightIssues.length} issue${preflightIssues.length === 1 ? "" : "s"}`}</div>
          <div style={{ color: "#b8bed2", fontSize: 12, marginBottom: preflightIssues.length ? 6 : 0 }}>Trigger ready: {healthSignals.triggerOk ? "Yes" : "No"}</div>
          {(flowNodes.length >= 6 || (branchGroup.branches || []).length >= 3) && (
            <div style={{ color: "#fbbf24", fontSize: 12, marginBottom: 6 }}>Perf detail: {flowNodes.length} nodes / {(branchGroup.branches || []).length} branches — consider splitting flows.</div>
          )}
          {preflightIssues.length > 0 && (
            <ul style={{ margin: 0, paddingLeft: 16, color: "#f6f7fb", fontSize: 12, display: "grid", gap: 4 }}>
              {preflightIssues.slice(0, 3).map((issue, idx) => (
                <li key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span>{issue}</span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button aria-label={`Explain ${issue}`} onClick={() => setIssueHelp(issue)} style={{ background: "#283044", border: "1px solid #4b5780", color: "#a5f3fc", borderRadius: 8, padding: "2px 8px", fontWeight: 700, cursor: "pointer" }}>Explain</button>
                    {quickFixForIssue(issue) && (
                      <button aria-label={`Fix ${issue}`} onClick={() => applyQuickFix(quickFixForIssue(issue))} style={{ background: "#22c55e", color: "#1f2433", border: "none", borderRadius: 8, padding: "2px 8px", fontWeight: 800, cursor: "pointer" }}>Fix</button>
                    )}
                  </div>
                </li>
              ))}
              {preflightIssues.length > 3 && <li style={{ color: "#b8bed2" }}>+{preflightIssues.length - 3} more (open Trace)</li>}
            </ul>
          )}
        </div>
        <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>Workflow hygiene</div>
          <div style={{ color: dirtySinceSave ? "#fbbf24" : "#22c55e", fontWeight: 700 }}>{dirtySinceSave ? "Unsaved edits" : "Clean"}</div>
          <div style={{ color: "#b8bed2", fontSize: 12 }}>Last saved {lastSavedAt ? formatTime(lastSavedAt) : "—"}</div>
        </div>
      </div>

      <div style={{ marginBottom: 12, background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 6 }}>
          <div style={{ fontWeight: 800 }}>Operational checklist</div>
          <div style={{ color: "#b8bed2", fontSize: 12 }}>Keeps you honest before shipping</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 8 }}>
          {healthChecklist.map(item => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: "8px 10px" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: item.ok ? "#22c55e" : "#f97316" }} />
              <div style={{ color: "#f6f7fb", fontWeight: 600 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {[{ label: "Triggers", value: stats.triggers, color: "#93c5fd" }, { label: "Conditions", value: stats.conditions, color: "#a5f3fc" }, { label: "Actions", value: stats.actions, color: "#c084fc" }, { label: "Branches", value: stats.branches, color: "#f59e0b" }].map(card => (
              <div key={card.label} style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 12 }}>
                <div style={{ color: card.color, fontSize: 24, fontWeight: 800 }}>{card.value}</div>
                <div style={{ color: "#b8bed2", fontWeight: 600 }}>{card.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700, color: "#f6f7fb" }}>Palette & Templates</div>
              <input
                value={paletteFilter}
                onChange={e => setPaletteFilter(e.target.value)}
                placeholder="Search triggers, conditions, actions"
                style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 10, padding: "8px 10px", width: 240 }}
              />
            </div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {[{ title: "Triggers", items: filteredPalette.triggers, accent: "#38bdf8" }, { title: "Conditions", items: filteredPalette.conditions, accent: "#a78bfa" }, { title: "Actions", items: filteredPalette.actions, accent: "#22c55e" }].map(group => (
                <div key={group.title} style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 10 }}>
                  <div style={{ color: group.accent, fontWeight: 700, marginBottom: 6 }}>{group.title}</div>
                  {group.items.map(item => (
                    <div key={item.title} style={{ marginBottom: 8, padding: 8, background: "#1f2433", borderRadius: 10, border: "1px solid #283044" }}>
                      <div style={{ fontWeight: 700, color: "#f6f7fb" }}>{item.title}</div>
                      <div style={{ color: "#b8bed2", fontSize: 13 }}>{item.description}</div>
                      <button onClick={() => addNode(item)} style={{ marginTop: 6, background: group.accent, color: "#1f2433", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Add</button>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TEMPLATE_PRESETS.map(t => (
                <button key={t.id} onClick={() => applyTemplate(t)} style={{ background: "#1f2433", color: "#a5f3fc", border: "1px solid #283044", borderRadius: 10, padding: "10px 12px", fontWeight: 700, cursor: "pointer" }}>
                   {t.name}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800, color: "#f6f7fb" }}>Flow Canvas</div>
              <span style={{ color: "#b8bed2" }}>Drag-less inline editing</span>
            </div>
            {flowNodes.length === 0 && (
              <div style={{ color: "#b8bed2", background: "#1f2433", border: "1px dashed #283044", borderRadius: 10, padding: 16 }}>
                Add triggers/conditions/actions from the palette or load a template.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {flowNodes.map(node => (
                <div key={node.id} style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ background: "#1f2433", padding: "4px 10px", borderRadius: 999, color: "#e9ebf5", fontWeight: 700 }}>{node.type?.toUpperCase()}</span>
                      <input
                        value={node.title || ""}
                        onChange={e => updateNode(node.id, { title: e.target.value })}
                        style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", minWidth: 140 }}
                      />
                    </div>
                    <button onClick={() => removeNode(node.id)} style={{ background: "transparent", color: "#f87171", border: "none", fontWeight: 800, cursor: "pointer" }}></button>
                  </div>
                  <textarea
                    value={node.description || ""}
                    onChange={e => updateNode(node.id, { description: e.target.value })}
                    rows={2}
                    style={{ width: "100%", background: "#1f2433", color: "#e9ebf5", border: "1px solid #283044", borderRadius: 10, padding: 8, marginTop: 8 }}
                    placeholder="Describe this step"
                  />
                  {node.type === "condition" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <input
                        value={node.config?.field || ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, field: e.target.value } })}
                        placeholder="field"
                        style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", flex: 1, minWidth: 120 }}
                      />
                      <select
                        value={node.config?.operator || "equals"}
                        onChange={e => updateNode(node.id, { config: { ...node.config, operator: e.target.value } })}
                        style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", minWidth: 130 }}
                      >
                        {OPERATORS.map(op => (
                          <option key={op} value={op}>{op}</option>
                        ))}
                      </select>
                      <input
                        value={node.config?.value || ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, value: e.target.value } })}
                        placeholder="value"
                        style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", flex: 1, minWidth: 120 }}
                      />
                    </div>
                  )}
                  {node.type === "trigger" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <input
                        value={node.config?.event || ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, event: e.target.value } })}
                        placeholder="event id"
                        style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", minWidth: 160 }}
                      />
                      <input
                        value={node.config?.threshold ?? ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, threshold: e.target.value } })}
                        placeholder="threshold (optional)"
                        style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", minWidth: 160 }}
                      />
                    </div>
                  )}
                  {node.type === "action" && (
                    <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                      <input
                        value={node.config?.channel || ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, channel: e.target.value } })}
                        placeholder="channel (email/sms/flow/task)"
                        style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", minWidth: 180 }}
                      />
                      <input
                        value={node.config?.template || node.config?.target || ""}
                        onChange={e => updateNode(node.id, { config: { ...node.config, template: e.target.value, target: e.target.value } })}
                        placeholder="template/target"
                        style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", minWidth: 160 }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800, color: "#f6f7fb" }}>Branching Builder</div>
              <button onClick={addBranch} style={{ background: "#22c55e", color: "#1f2433", border: "none", borderRadius: 10, padding: "8px 12px", fontWeight: 800, cursor: "pointer" }}>+ Add Branch</button>
            </div>
            {(branchGroup.branches || []).length === 0 && (
              <div style={{ color: "#b8bed2", background: "#1f2433", border: "1px dashed #283044", borderRadius: 10, padding: 14 }}>
                Define IF/ELSEIF branches. Each branch can have its own actions. Unmatched traffic will fall into Else.
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(branchGroup.branches || []).map((branch, idx) => (
                <div key={branch.id} style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ background: "#1f2433", color: "#c084fc", padding: "4px 10px", borderRadius: 999, fontWeight: 800 }}>IF #{idx + 1}</span>
                    <input
                      value={branch.label || ""}
                      onChange={e => setBranchGroup(prev => ({ ...prev, branches: prev.branches.map(b => b.id === branch.id ? { ...b, label: e.target.value } : b) }))}
                      placeholder="Branch label"
                      style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", minWidth: 140 }}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                    <input
                      value={branch.condition?.field || ""}
                      onChange={e => updateBranchCondition(branch.id, { field: e.target.value })}
                      placeholder="field"
                      style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", minWidth: 140 }}
                    />
                    <select
                      value={branch.condition?.operator || "equals"}
                      onChange={e => updateBranchCondition(branch.id, { operator: e.target.value })}
                      style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", minWidth: 150 }}
                    >
                      {OPERATORS.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>
                    <input
                      value={branch.condition?.value || ""}
                      onChange={e => updateBranchCondition(branch.id, { value: e.target.value })}
                      placeholder="value"
                      style={{ background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", minWidth: 140 }}
                    />
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ color: "#b8bed2", fontWeight: 700 }}>Actions</div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {ACTION_LIBRARY.map(a => (
                          <button key={a.title + branch.id} onClick={() => addBranchAction(branch.id, a)} style={{ background: "#1f2433", color: "#22c55e", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontWeight: 700 }}>
                            + {a.title}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                      {(branch.actions || []).length === 0 && (
                        <div style={{ color: "#9aa3b8", background: "#1f2433", borderRadius: 8, padding: 10, border: "1px dashed #283044" }}>No actions yet.</div>
                      )}
                      {(branch.actions || []).map(action => (
                        <div key={action.id} style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <div>
                            <div style={{ color: "#22c55e", fontWeight: 700 }}>{action.title}</div>
                            <div style={{ color: "#b8bed2", fontSize: 13 }}>{action.description}</div>
                          </div>
                          <button onClick={() => removeBranchAction(branch.id, action.id)} style={{ background: "transparent", color: "#f87171", border: "none", cursor: "pointer", fontWeight: 800 }}></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#f97316", fontWeight: 800 }}>Else</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {ACTION_LIBRARY.map(a => (
                    <button key={a.title + "else"} onClick={() => addElseAction(a)} style={{ background: "#1f2433", color: "#f59e0b", border: "1px solid #283044", borderRadius: 8, padding: "6px 8px", cursor: "pointer", fontWeight: 700 }}>
                      + {a.title}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {(branchGroup.elseActions || []).length === 0 && (
                  <div style={{ color: "#9aa3b8", background: "#1f2433", borderRadius: 8, padding: 10, border: "1px dashed #283044" }}>No else actions yet.</div>
                )}
                {(branchGroup.elseActions || []).map(action => (
                  <div key={action.id} style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: 8, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <div style={{ color: "#f59e0b", fontWeight: 700 }}>{action.title}</div>
                      <div style={{ color: "#b8bed2", fontSize: 13 }}>{action.description}</div>
                    </div>
                    <button onClick={() => removeElseAction(action.id)} style={{ background: "transparent", color: "#f87171", border: "none", cursor: "pointer", fontWeight: 800 }}></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 14, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontWeight: 800, color: "#f6f7fb" }}>Simulation Preview</div>
              <small style={{ color: "#b8bed2" }}>Paste sample payload to test pathing</small>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {PAYLOAD_PRESETS.map(p => (
                <button key={p.id} onClick={() => { setSelectedPayloadPreset(p.id); setSimulationInput(JSON.stringify(p.payload, null, 2)); }} style={{ background: selectedPayloadPreset === p.id ? "#0ea5e9" : "#1f2433", color: selectedPayloadPreset === p.id ? "#1f2433" : "#f6f7fb", border: "1px solid #283044", borderRadius: 10, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>
                  {p.name} <span style={{ marginLeft: 6, background: "#0ea5e91a", color: "#67e8f9", padding: "2px 6px", borderRadius: 999, fontSize: 12 }}>{p.badge}</span>
                </button>
              ))}
            </div>
            <textarea
              value={simulationInput}
              onChange={e => setSimulationInput(e.target.value)}
              rows={7}
              style={{ width: "100%", background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 12, padding: 10 }}
            />
            <button onClick={simulate} style={{ marginTop: 10, background: "#22c55e", color: "#1f2433", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Run Simulation</button>
            {simulationResult && (
              <div style={{ marginTop: 10, background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 12 }}>
                <div style={{ color: "#a5f3fc", fontWeight: 800 }}>Matched: {simulationResult.matchedBranch}</div>
                <div style={{ color: "#b8bed2", marginTop: 4 }}>Actions to fire:</div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#f6f7fb" }}>
                  {simulationResult.actions.map(a => (
                    <li key={a.id}>{a.title} ({a.config?.channel || "action"})</li>
                  ))}
                  {simulationResult.actions.length === 0 && <li style={{ color: "#9aa3b8" }}>No actions</li>}
                </ul>
                {diffSummary && (
                  <div style={{ marginTop: 10, color: "#b8bed2", fontSize: 13 }}>
                    <div style={{ color: "#f6f7fb", fontWeight: 700 }}>Changes since last simulation</div>
                    <div>Added nodes: {diffSummary.added.length}, Removed: {diffSummary.removed.length}, Changed: {diffSummary.changed.length}, Branch delta: {diffSummary.branchDelta}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, color: "#f6f7fb", marginBottom: 8 }}>Data Explorer</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              <button onClick={fetchLogicBlocks} style={{ background: "#1f2433", color: "#a5f3fc", border: "1px solid #283044", borderRadius: 8, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>Load Logic Blocks</button>
              <button onClick={fetchWorkflows} style={{ background: "#1f2433", color: "#22c55e", border: "1px solid #283044", borderRadius: 8, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>Load Workflows</button>
              <button onClick={fetchTriggers} style={{ background: "#1f2433", color: "#38bdf8", border: "1px solid #283044", borderRadius: 8, padding: "8px 10px", fontWeight: 700, cursor: "pointer" }}>Load Triggers</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
              {logicBlocks.map(b => (
                <div key={b.id} style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: 8 }}>
                  <div style={{ color: "#a5f3fc", fontWeight: 700 }}>{b.name}</div>
                  <div style={{ color: "#b8bed2", fontSize: 13 }}>{b.description}</div>
                  <button onClick={() => addNode({ ...b, type: "condition", title: b.name, description: b.description })} style={{ marginTop: 6, background: "#0ea5e9", color: "white", border: "none", borderRadius: 8, padding: "6px 10px", fontWeight: 700, cursor: "pointer" }}>Add to Flow</button>
                </div>
              ))}
              {workflows.map(w => (
                <div key={w.id} style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: 8 }}>
                  <div style={{ color: "#22c55e", fontWeight: 700 }}>{w.name}</div>
                  <div style={{ color: "#b8bed2", fontSize: 13 }}>Steps: {(w.steps || []).join(", ")}</div>
                </div>
              ))}
              {triggers.map(t => (
                <div key={t.id} style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: 8 }}>
                  <div style={{ color: "#38bdf8", fontWeight: 700 }}>{t.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, color: "#f6f7fb", marginBottom: 8 }}>Assistant</div>
            <textarea
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              rows={4}
              placeholder="Ask for branching ideas, guardrails, or messaging logic"
              style={{ width: "100%", background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 12, padding: 10 }}
            />
            <button onClick={askAssistant} disabled={queryLoading} style={{ marginTop: 8, background: "#4f46e5", color: "white", border: "none", borderRadius: 10, padding: "10px 12px", fontWeight: 800, cursor: "pointer", opacity: queryLoading ? 0.7 : 1 }}>
              {queryLoading ? "Thinking..." : "Ask Assistant"}
            </button>
            {aiResponse && (
              <div style={{ marginTop: 8, background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 10, color: "#f6f7fb", whiteSpace: "pre-wrap" }}>{aiResponse}</div>
            )}
          </div>

          <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, color: "#f6f7fb", marginBottom: 8 }}>Validation</div>
            {validationIssues.length === 0 ? (
              <div style={{ color: "#22c55e" }}>No blocking issues detected. Ready to ship.</div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, color: "#fca5a5" }}>
                {validationIssues.map((issue, idx) => (
                  <li key={idx}>{issue}</li>
                ))}
              </ul>
            )}
            {preflightIssues.length > 0 && (
              <div style={{ marginTop: 10, background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: 10 }}>
                <div style={{ color: "#fcd34d", fontWeight: 800 }}>Preflight</div>
                <ul style={{ margin: 6, paddingLeft: 18, color: "#f6f7fb" }}>
                  {preflightIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
            {preflightTrace.length > 0 && (
              <div style={{ marginTop: 10, background: "#1f2433", border: "1px solid #283044", borderRadius: 10, padding: 10 }}>
                <div style={{ color: "#a5f3fc", fontWeight: 800 }}>Preflight Trace</div>
                <ul style={{ margin: 6, paddingLeft: 18, color: "#f6f7fb", display: "flex", flexDirection: "column", gap: 6 }}>
                  {preflightTrace.map((item, idx) => {
                    const color = item.status === "pass" ? "#22c55e" : item.status === "warn" ? "#f59e0b" : "#f87171";
                    return (
                      <li key={idx} style={{ listStyle: "none", display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: color }}>{item.status === "pass" ? "" : item.status === "warn" ? "!" : ""}</span>
                        <span>{item.detail}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            {env === "prod" && (
              <div style={{ marginTop: 10, background: "#0ea5e91a", border: "1px solid #0ea5e9", borderRadius: 10, padding: 10 }}>
                <div style={{ color: "#67e8f9", fontWeight: 800 }}>Prod note required</div>
                <input
                  value={confirmationNote}
                  onChange={e => setConfirmationNote(e.target.value)}
                  placeholder="Who approved? What changed?"
                  style={{ marginTop: 6, width: "100%", background: "#1f2433", color: "#f6f7fb", border: "1px solid #283044", borderRadius: 8, padding: "8px 10px" }}
                />
              </div>
            )}
          </div>

          <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 14, padding: 14 }}>
            <div style={{ fontWeight: 800, color: "#f6f7fb", marginBottom: 8 }}>Feedback</div>
            <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} aria-label="Send feedback">
              <textarea
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                rows={2}
                style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 10, border: "1px solid #283044", marginBottom: 10, background: "#1f2433", color: "#f6f7fb" }}
                placeholder="What should we improve next?"
                aria-label="Feedback input"
              />
              <button type="submit" style={{ background: "#4f46e5", color: "#1f2433", border: "none", borderRadius: 10, padding: "10px 14px", fontWeight: 800, cursor: "pointer" }}>Send Feedback</button>
            </form>
          </div>

          {(imported || error) && (
            <div style={{ background: "#1f2433", border: "1px solid #283044", borderRadius: 12, padding: 10 }}>
              {imported && <div style={{ color: "#22c55e" }}>Imported: {imported}</div>}
              {error && <div style={{ color: "#fca5a5" }}>{error}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


