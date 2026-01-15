import React, { useState, useRef, useEffect } from "react";

// Node-based, drag-and-drop flow builder foundation
export default function FlowNodeBuilder({ nodes, setNodes, edges, setEdges }) {
          // Edge labels/conditions
          const [editingEdge, setEditingEdge] = useState(null); // {from, to}
          const [edgeLabelDraft, setEdgeLabelDraft] = useState("");

          function handleEditEdgeLabel(edge) {
            setEditingEdge(edge);
            setEdgeLabelDraft(edge.label || "");
          }
          function handleSaveEdgeLabel() {
            setEdges(edges.map(e => (e.from === editingEdge.from && e.to === editingEdge.to) ? { ...e, label: edgeLabelDraft } : e));
            setEditingEdge(null);
            setEdgeLabelDraft("");
          }
        // Node grouping & collapse
        const [groups, setGroups] = useState([]); // [{id, name, nodeIds, collapsed}]
        const [groupDraft, setGroupDraft] = useState({ name: '', nodeIds: [] });
        const [groupModalOpen, setGroupModalOpen] = useState(false);

        function handleCreateGroup() {
          if (!groupDraft.name || groupDraft.nodeIds.length === 0) return;
          setGroups([...groups, { id: Math.random().toString(36).substr(2, 9), name: groupDraft.name, nodeIds: groupDraft.nodeIds, collapsed: false }]);
          setGroupDraft({ name: '', nodeIds: [] });
          setGroupModalOpen(false);
        }
        function handleToggleGroup(groupId) {
          setGroups(groups.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
        }
      // Node search & quick add
      const [searchOpen, setSearchOpen] = useState(false);
      const [searchQuery, setSearchQuery] = useState("");
      const [searchResults, setSearchResults] = useState([]);
      const allNodeOptions = [
        { type: 'trigger', label: 'Trigger', meta: null },
        { type: 'action', label: 'Action', meta: null },
        { type: 'condition', label: 'Condition', meta: null },
        ...templates.map(t => ({ type: 'template', label: t.name, meta: t }))
      ];
      useEffect(() => {
        if (!searchOpen) return;
        if (!searchQuery) setSearchResults(allNodeOptions);
        else setSearchResults(allNodeOptions.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase())));
      }, [searchQuery, searchOpen]);
    // Drag-to-connect edge state
    const [edgeDrag, setEdgeDrag] = useState({ from: null, to: null, pos: null });

    function handleEdgeDragStart(nodeId, e) {
      e.stopPropagation();
      setEdgeDrag({ from: nodeId, to: null, pos: { x: e.clientX, y: e.clientY } });
      window.addEventListener('mousemove', handleEdgeDragMove);
      window.addEventListener('mouseup', handleEdgeDragEnd);
    }

    function handleEdgeDragMove(e) {
      setEdgeDrag(prev => prev.from ? { ...prev, pos: { x: e.clientX, y: e.clientY } } : prev);
    }

    function handleEdgeDragEnd(e) {
      setEdgeDrag({ from: null, to: null, pos: null });
      window.removeEventListener('mousemove', handleEdgeDragMove);
      window.removeEventListener('mouseup', handleEdgeDragEnd);
    }

    function handleEdgeDrop(targetId) {
      if (edgeDrag.from && edgeDrag.from !== targetId) {
        setEdges([...edges, { from: edgeDrag.from, to: targetId }]);
        pushHistory(nodes, [...edges, { from: edgeDrag.from, to: targetId }]);
      }
      setEdgeDrag({ from: null, to: null, pos: null });
      window.removeEventListener('mousemove', handleEdgeDragMove);
      window.removeEventListener('mouseup', handleEdgeDragEnd);
    }
  // For MVP: nodes = [{id, type, label, data}], edges = [{from, to}]
  // Later: add branching, conditions, templates, etc.
  const [draggingNode, setDraggingNode] = useState(null);
  const builderRef = useRef();
  const [configNodeId, setConfigNodeId] = useState(null);
  const [configDraft, setConfigDraft] = useState({});
  const [configError, setConfigError] = useState("");
  // Undo/Redo history
  const [history, setHistory] = useState([{ nodes, edges }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Comments: { [nodeId]: [{user, text, ts}] }
  const [comments, setComments] = useState({});
  const [commentingNode, setCommentingNode] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");

  // Real collaborators
  const [collaborators, setCollaborators] = useState([{ name: "You", color: "#0ea5e9" }]);
  // Shop domain (for API)
  const shop = window?.SHOP_DOMAIN || window?.location?.hostname || "demo-shop";

   // AI Suggestions
   const [aiLoading, setAiLoading] = useState(false);
   const [aiError, setAiError] = useState("");
   const [aiSuggestion, setAiSuggestion] = useState("");

   async function handleAISuggest() {
     setAiLoading(true);
     setAiError("");
     setAiSuggestion("");
     try {
       const res = await fetch("/api/klaviyo-flow-automation/ai/suggest", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ nodes, edges })
       });
       const data = await res.json();
       if (!data.ok) throw new Error(data.error || "Unknown error");
       setAiSuggestion(data.suggestion || "No suggestion generated");
       // If suggestion contains nodes, add them
       if (data.nodes && Array.isArray(data.nodes)) {
         const now = Date.now();
         const newNodes = data.nodes.map((n, i) => ({
           id: `${now}-${i}-${Math.random().toString(36).substr(2, 5)}`,
           ...n
         }));
         const allNodes = [...nodes, ...newNodes];
         setNodes(allNodes);
         pushHistory(allNodes, edges);
       }
     } catch (err) {
       setAiError(err.message);
     } finally {
       setAiLoading(false);
     }
   }

  // Load flow, analytics, collaborators on mount and poll for changes every 2s
  useEffect(() => {
    let lastFlow = null;
    let lastAnalytics = null;
    let lastCollabs = null;
    async function loadAll() {
      try {
        const [flowRes, analyticsRes, collabRes] = await Promise.all([
          fetch("/api/klaviyo-flow-automation/flow", { headers: { "x-shopify-shop-domain": shop } }),
          fetch("/api/klaviyo-flow-automation/analytics", { headers: { "x-shopify-shop-domain": shop } }),
          fetch("/api/klaviyo-flow-automation/collaborators", { headers: { "x-shopify-shop-domain": shop } })
        ]);
        const flowData = await flowRes.json();
        if (flowData.ok && flowData.flow) {
          const { nodes: n, edges: e, comments: c } = flowData.flow;
          // Only update if changed
          const flowString = JSON.stringify({ n, e, c });
          if (flowString !== lastFlow) {
            setNodes(n || []);
            setEdges(e || []);
            setComments(c || {});
            lastFlow = flowString;
          }
        }
        const analyticsData = await analyticsRes.json();
        if (analyticsData.ok && analyticsData.analytics) {
          const analyticsString = JSON.stringify(analyticsData.analytics);
          if (analyticsString !== lastAnalytics) {
            setAnalytics(analyticsData.analytics);
            lastAnalytics = analyticsString;
          }
        }
        const collabData = await collabRes.json();
        if (collabData.ok && collabData.collaborators) {
          const collabString = JSON.stringify(collabData.collaborators);
          if (collabString !== lastCollabs) {
            setCollaborators(collabData.collaborators.map(name => ({ name, color: '#0ea5e9' })));
            lastCollabs = collabString;
          }
        }
      } catch (err) {
        // eslint-disable-next-line
        console.error("Failed to load flow/collaborators/analytics", err);
      }
    }
    loadAll();
    // Poll for all changes every 2s
    const interval = setInterval(loadAll, 2000);

    // --- WebSocket integration: add event listeners here for instant updates ---
    // Example:
    // const socket = io('/api/klaviyo-flow-automation');
    // socket.on('flow-update', data => { setNodes(data.nodes); setEdges(data.edges); setComments(data.comments); });
    // socket.on('analytics-update', setAnalytics);
    // socket.on('collaborators-update', setCollaborators);

    return () => {
      clearInterval(interval);
      // if (socket) socket.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  // Save flow to backend on change
  useEffect(() => {
    async function saveFlow() {
      try {
        await fetch("/api/klaviyo-flow-automation/flow", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-shopify-shop-domain": shop },
          body: JSON.stringify({ flow: { nodes, edges, comments } })
        });
      } catch (err) {
        // eslint-disable-next-line
        console.error("Failed to save flow", err);
      }
    }
    if (nodes && edges) saveFlow();
    // eslint-disable-next-line
  }, [nodes, edges, comments]);

  // Save analytics to backend on change
  useEffect(() => {
    async function saveAnalytics() {
      try {
        await fetch("/api/klaviyo-flow-automation/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-shopify-shop-domain": shop },
          body: JSON.stringify({ analytics })
        });
      } catch (err) {
        // eslint-disable-next-line
        console.error("Failed to save analytics", err);
      }
    }
    if (analytics) saveAnalytics();
    // eslint-disable-next-line
  }, [analytics]);

  // Analytics: { flowRuns, lastRun, nodeStats: { [nodeId]: { executions, lastExec } } }
  const [analytics, setAnalytics] = useState({
    flowRuns: 0,
    lastRun: null,
    nodeStats: {}
  });

  // Simulate a flow run (increments stats)
  // Flow simulation modal
  const [simModalOpen, setSimModalOpen] = useState(false);
  const [simSteps, setSimSteps] = useState([]);
  const [simError, setSimError] = useState("");
  const [simCurrent, setSimCurrent] = useState(0);

  function runFlow() {
    setSimModalOpen(true);
    setSimError("");
    // Simulate step-by-step execution
    const steps = nodes.map((n, i) => ({
      idx: i + 1,
      id: n.id,
      label: n.label,
      type: n.type,
      params: n.data?.params || "",
      output: `Simulated output for ${n.label}`,
      error: null
    }));
    setSimSteps(steps);
    setSimCurrent(0);
    // Update analytics as before
    const now = Date.now();
    setAnalytics(prev => ({
      ...prev,
      flowRuns: prev.flowRuns + 1,
      lastRun: now,
      nodeStats: nodes.reduce((acc, n) => {
        acc[n.id] = {
          executions: (prev.nodeStats[n.id]?.executions || 0) + 1,
          lastExec: now
        };
        return acc;
      }, { ...prev.nodeStats })
    }));
  }

  // Export/import
  function exportFlow() {
    const data = JSON.stringify({ nodes, edges, comments, analytics }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flow-export.json';
    a.click();
    URL.revokeObjectURL(url);
  }
  function importFlow(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target.result);
        setNodes(data.nodes || []);
        setEdges(data.edges || []);
        setComments(data.comments || {});
        setAnalytics(data.analytics || { flowRuns: 0, lastRun: null, nodeStats: {} });
      } catch {
        alert('Invalid flow file.');
      }
    };
    reader.readAsText(file);
  }

  // Helper: push new state to history
  function pushHistory(newNodes, newEdges) {
    const next = history.slice(0, historyIndex + 1);
    next.push({ nodes: newNodes, edges: newEdges });
    setHistory(next);
    setHistoryIndex(next.length - 1);
  }

  // Undo/Redo handlers
  function undo() {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setNodes(history[historyIndex - 1].nodes);
      setEdges(history[historyIndex - 1].edges);
    }
  }
  function redo() {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setNodes(history[historyIndex + 1].nodes);
      setEdges(history[historyIndex + 1].edges);
    }
  }

  // Sync history when nodes/edges change (but not from undo/redo)
  React.useEffect(() => {
    if (
      (history[historyIndex]?.nodes !== nodes || history[historyIndex]?.edges !== edges) &&
      (nodes.length !== 0 || edges.length !== 0)
    ) {
      pushHistory(nodes, edges);
    }
    // eslint-disable-next-line
  }, [nodes, edges]);

  // Add a new node
  // Custom node types & marketplace
  const [customNodeType, setCustomNodeType] = useState("");
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [marketplaceNodes, setMarketplaceNodes] = useState([]);
  const [marketplaceError, setMarketplaceError] = useState("");

  function addNode(type, meta) {
    const id = Math.random().toString(36).substr(2, 9);
    const label = meta?.name || type.charAt(0).toUpperCase() + type.slice(1);
    const newNodes = [
      ...nodes,
      {
        id,
        type,
        label,
        data: meta?.examplePayload ? { params: JSON.stringify(meta.examplePayload) } : {}
      }
    ];
    setNodes(newNodes);
    pushHistory(newNodes, edges);
  }

  async function loadMarketplace() {
    setMarketplaceError("");
    try {
      const res = await fetch("/api/tools/marketplace");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setMarketplaceNodes(data.tools || []);
    } catch (err) {
      setMarketplaceError(err.message);
    }
  }

  // Drag and drop handlers
  function onDragStart(id) {
    setDraggingNode(id);
  }

  function onDragOver(e) {
    e.preventDefault();
  }

  function onDrop(targetId) {
    if (draggingNode && draggingNode !== targetId) {
      const fromIdx = nodes.findIndex(n => n.id === draggingNode);
      const toIdx = nodes.findIndex(n => n.id === targetId);
      if (fromIdx !== -1 && toIdx !== -1) {
        const reordered = [...nodes];
        const [moved] = reordered.splice(fromIdx, 1);
        reordered.splice(toIdx, 0, moved);
        setNodes(reordered);
        pushHistory(reordered, edges);
      }
    }
    setDraggingNode(null);
  }

  // Templates
  const templates = [
    {
      name: 'Welcome Series',
      nodes: [
        { type: 'trigger', label: 'Signup Trigger', data: { params: '{"event":"signup"}' } },
        { type: 'action', label: 'Send Welcome Email', data: { params: '{"template":"welcome"}' } },
        { type: 'action', label: 'Add to Newsletter', data: { params: '{"list":"newsletter"}' } }
      ]
    },
    {
      name: 'Abandoned Cart',
      nodes: [
        { type: 'trigger', label: 'Cart Abandoned', data: { params: '{"event":"cart_abandoned"}' } },
        { type: 'action', label: 'Send Reminder Email', data: { params: '{"template":"cart_reminder"}' } }
      ]
    },
    {
      name: 'Order Confirmation',
      nodes: [
        { type: 'trigger', label: 'Order Placed', data: { params: '{"event":"order_placed"}' } },
        { type: 'action', label: 'Send Confirmation Email', data: { params: '{"template":"order_confirmation"}' } }
      ]
    }
  ];
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const handleAddTemplate = () => {
    const t = templates.find(t => t.name === selectedTemplate);
    if (t) {
      const now = Date.now();
      const newNodes = t.nodes.map((n, i) => ({
        id: `${now}-${i}-${Math.random().toString(36).substr(2, 5)}`,
        ...n
      }));
      const allNodes = [...nodes, ...newNodes];
      setNodes(allNodes);
      pushHistory(allNodes, edges);
    }
  };
  // Color map for node types
  const nodeColors = {
    trigger: { bg: '#0ea5e9', border: '#38bdf8', color: '#fff' },
    action: { bg: '#232336', border: '#22c55e', color: '#fafafa' },
    condition: { bg: '#232336', border: '#eab308', color: '#fafafa' }
  };

  // For edge drawing: get node positions after render
  const nodeRefs = useRef({});
  // Layout: vertical stack, so y = idx * spacing
  const nodePositions = nodes.map((n, idx) => ({
    id: n.id,
    x: 60, // left margin
    y: 40 + idx * 70 // top margin + spacing
  }));
  // Helper to get node position by id
  const getNodePos = id => nodePositions.find(p => p.id === id) || { x: 0, y: 0 };

  return (
    <div ref={builderRef} style={{ background: '#18181b', border: '1px solid #232336', borderRadius: 14, padding: 24, minHeight: 320, position: 'relative' }}>
      {/* Simulation Modal */}
      {simModalOpen && (
        <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 420, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
            <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Flow Simulation</div>
            {simSteps.length === 0 ? (
              <div>No nodes to simulate.</div>
            ) : (
              <div>
                <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 16 }}>Step {simCurrent + 1} of {simSteps.length}</div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 700 }}>{simSteps[simCurrent].label}</span> <span style={{ color: '#64748b', fontWeight: 400 }}>({simSteps[simCurrent].type})</span>
                </div>
                <div style={{ marginBottom: 8, fontSize: 14 }}><b>Params:</b> <span style={{ color: '#38bdf8' }}>{simSteps[simCurrent].params}</span></div>
                <div style={{ marginBottom: 8, fontSize: 14 }}><b>Output:</b> <span style={{ color: '#22c55e' }}>{simSteps[simCurrent].output}</span></div>
                {simSteps[simCurrent].error && <div style={{ color: '#ef4444', fontWeight: 700 }}>{simSteps[simCurrent].error}</div>}
                <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                  <button onClick={() => setSimCurrent(c => Math.max(0, c - 1))} disabled={simCurrent === 0} style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: simCurrent === 0 ? 'not-allowed' : 'pointer', opacity: simCurrent === 0 ? 0.6 : 1 }}>Prev</button>
                  <button onClick={() => setSimCurrent(c => Math.min(simSteps.length - 1, c + 1))} disabled={simCurrent === simSteps.length - 1} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: simCurrent === simSteps.length - 1 ? 'not-allowed' : 'pointer', opacity: simCurrent === simSteps.length - 1 ? 0.6 : 1 }}>Next</button>
                  <button onClick={() => setSimModalOpen(false)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* SVG edges */}
      <svg width="100%" height={Math.max(120, nodes.length * 70)} style={{ position: 'absolute', left: 0, top: 0, zIndex: 0, pointerEvents: 'none' }}>
                {/* Edge being dragged */}
                {edgeDrag.from && edgeDrag.pos && (() => {
                  const from = getNodePos(edgeDrag.from);
                  return (
                    <line
                      x1={from.x + 220}
                      y1={from.y + 28}
                      x2={edgeDrag.pos.x - builderRef.current.getBoundingClientRect().left}
                      y2={edgeDrag.pos.y - builderRef.current.getBoundingClientRect().top}
                      stroke="#eab308"
                      strokeWidth={3}
                      markerEnd="url(#arrowhead)"
                      opacity={0.9}
                      style={{ pointerEvents: 'none' }}
                    />
                  );
                })()}
        {edges && edges.map((edge, i) => {
          const from = getNodePos(edge.from);
          const to = getNodePos(edge.to);
          if (!from || !to) return null;
          const mx = (from.x + 180 + to.x) / 2;
          const my = (from.y + 28 + to.y + 28) / 2;
          return (
            <g key={i}>
              <line
                x1={from.x + 180}
                y1={from.y + 28}
                x2={to.x}
                y2={to.y + 28}
                stroke="#38bdf8"
                strokeWidth={3}
                markerEnd="url(#arrowhead)"
                opacity={0.7}
                onClick={() => handleEditEdgeLabel(edge)}
                style={{ cursor: 'pointer' }}
              />
              {edge.label && (
                <text x={mx} y={my - 8} fill="#eab308" fontSize="14" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>{edge.label}</text>
              )}
            </g>
          );
        })}
              {/* Edge label modal */}
              {editingEdge && (
                <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 340, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
                    <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 18 }}>Edit Edge Label/Condition</div>
                    <input value={edgeLabelDraft} onChange={e => setEdgeLabelDraft(e.target.value)} placeholder="Edge label (e.g. Yes/No)" style={{ width: '100%', borderRadius: 8, border: '1px solid #333', padding: '10px 14px', fontSize: 16, marginBottom: 18, background: '#18181b', color: '#fafafa' }} />
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={handleSaveEdgeLabel} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Save</button>
                      <button onClick={() => setEditingEdge(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </div>
                </div>
              )}
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="8" refY="4" orient="auto" markerUnits="strokeWidth">
            <polygon points="0 0, 8 4, 0 8" fill="#38bdf8" />
          </marker>
        </defs>
      </svg>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
        <button onClick={handleAISuggest} disabled={aiLoading} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: aiLoading ? 'not-allowed' : 'pointer', opacity: aiLoading ? 0.6 : 1 }}>AI Suggest</button>
        <button onClick={runFlow} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Run Flow</button>
        <button onClick={exportFlow} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Export</button>
        <label style={{ background: '#232336', color: '#fafafa', border: '1px solid #333', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 0 }}>
          Import
          <input type="file" accept="application/json" onChange={importFlow} style={{ display: 'none' }} />
        </label>
        <span style={{ color: '#64748b', fontSize: 14, marginLeft: 10 }}>
          Runs: <b>{analytics.flowRuns}</b> | Last: {analytics.lastRun ? new Date(analytics.lastRun).toLocaleString() : 'Never'}
        </span>
        {aiError && <span style={{ color: '#ef4444', fontWeight: 700, marginLeft: 10 }}>{aiError}</span>}
        {aiSuggestion && <span style={{ color: '#38bdf8', fontWeight: 700, marginLeft: 10 }}>{aiSuggestion}</span>}
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18, alignItems: 'center', position: 'relative', zIndex: 2 }}>
                                <button onClick={() => setGroupModalOpen(true)} style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Group Nodes</button>
                                {groupModalOpen && (
                                  <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 420, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
                                      <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Create Node Group</div>
                                      <button onClick={() => setGroupModalOpen(false)} style={{ position: 'absolute', top: 18, right: 18, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
                                      <input value={groupDraft.name} onChange={e => setGroupDraft(d => ({ ...d, name: e.target.value }))} placeholder="Group name" style={{ width: '100%', borderRadius: 8, border: '1px solid #333', padding: '10px 14px', fontSize: 16, marginBottom: 18, background: '#18181b', color: '#fafafa' }} />
                                      <div style={{ marginBottom: 12, fontWeight: 700 }}>Select nodes to group:</div>
                                      <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 18 }}>
                                        {nodes.map(n => (
                                          <label key={n.id} style={{ display: 'block', marginBottom: 6 }}>
                                            <input type="checkbox" checked={groupDraft.nodeIds.includes(n.id)} onChange={e => setGroupDraft(d => ({ ...d, nodeIds: e.target.checked ? [...d.nodeIds, n.id] : d.nodeIds.filter(id => id !== n.id) }))} />
                                            <span style={{ marginLeft: 8 }}>{n.label}</span>
                                          </label>
                                        ))}
                                      </div>
                                      <button onClick={handleCreateGroup} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Create Group</button>
                                    </div>
                                  </div>
                                )}
                        <button onClick={() => setSearchOpen(true)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Quick Add</button>
                        {searchOpen && (
                          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 420, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
                              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Quick Add Node/Template</div>
                              <button onClick={() => setSearchOpen(false)} style={{ position: 'absolute', top: 18, right: 18, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
                              <input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search node or template..." style={{ width: '100%', borderRadius: 8, border: '1px solid #333', padding: '10px 14px', fontSize: 16, marginBottom: 18, background: '#18181b', color: '#fafafa' }} />
                              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                                {searchResults.length === 0 ? (
                                  <div style={{ color: '#64748b', fontSize: 15 }}>No results found.</div>
                                ) : (
                                  <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {searchResults.map((opt, i) => (
                                      <li key={i} style={{ marginBottom: 14, background: '#18181b', borderRadius: 8, padding: 14, boxShadow: '0 2px 8px #0004', display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontWeight: 700, fontSize: 16 }}>{opt.label}</span>
                                        <button onClick={() => {
                                          if (opt.type === 'template' && opt.meta) {
                                            const t = opt.meta;
                                            const now = Date.now();
                                            const newNodes = t.nodes.map((n, idx) => ({
                                              id: `${now}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                                              ...n
                                            }));
                                            const allNodes = [...nodes, ...newNodes];
                                            setNodes(allNodes);
                                            pushHistory(allNodes, edges);
                                          } else {
                                            addNode(opt.type);
                                          }
                                          setSearchOpen(false);
                                        }} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Add</button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                <button onClick={() => setMarketplaceOpen(true)} style={{ background: '#eab308', color: '#232336', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Marketplace</button>
                <select value={customNodeType} onChange={e => setCustomNodeType(e.target.value)} style={{ marginLeft: 8, borderRadius: 8, border: '1px solid #333', padding: '8px 12px', background: '#232336', color: '#fafafa', fontWeight: 700, fontSize: 15 }}>
                  <option value="">+ Custom Node Type...</option>
                  <option value="trigger">Trigger</option>
                  <option value="action">Action</option>
                  <option value="condition">Condition</option>
                  {/* Dynamically add custom node types from marketplace */}
                  {marketplaceNodes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                <button onClick={() => {
                  if (!customNodeType) return;
                  const meta = marketplaceNodes.find(t => t.id === customNodeType);
                  addNode(customNodeType, meta);
                }} disabled={!customNodeType} style={{ background: '#eab308', color: '#232336', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: customNodeType ? 'pointer' : 'not-allowed', opacity: customNodeType ? 1 : 0.6 }}>Add Custom Node</button>
                {/* Marketplace Modal */}
                {marketplaceOpen && (
                  <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 520, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
                      <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Node Marketplace</div>
                      <button onClick={() => setMarketplaceOpen(false)} style={{ position: 'absolute', top: 18, right: 18, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
                      <button onClick={loadMarketplace} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 12 }}>Refresh</button>
                      {marketplaceError && <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 10 }}>{marketplaceError}</div>}
                      <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                        {marketplaceNodes.length === 0 ? (
                          <div style={{ color: '#64748b', fontSize: 15 }}>No custom nodes available.</div>
                        ) : (
                          <ul style={{ listStyle: 'none', padding: 0 }}>
                            {marketplaceNodes.map(t => (
                              <li key={t.id} style={{ marginBottom: 18, background: '#18181b', borderRadius: 8, padding: 18, boxShadow: '0 2px 8px #0004' }}>
                                <div style={{ fontWeight: 700, fontSize: 17 }}>{t.name}</div>
                                <div style={{ color: '#eab308', fontSize: 14, marginBottom: 6 }}>{t.category}</div>
                                <div style={{ color: '#64748b', fontSize: 14, marginBottom: 6 }}>{t.description}</div>
                                <button onClick={() => { addNode(t.id, t); setMarketplaceOpen(false); }} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8 }}>Add Node</button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                )}
        <button onClick={() => addNode('trigger')} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ Trigger</button>
        <button onClick={() => addNode('action')} style={{ background: '#232336', color: '#fafafa', border: '1px solid #333', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ Action</button>
        <button onClick={() => addNode('condition')} style={{ background: '#232336', color: '#fafafa', border: '1px solid #333', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ Condition</button>
        <select value={selectedTemplate} onChange={e => setSelectedTemplate(e.target.value)} style={{ marginLeft: 18, borderRadius: 8, border: '1px solid #333', padding: '8px 12px', background: '#232336', color: '#fafafa', fontWeight: 700, fontSize: 15 }}>
          <option value="">+ Add Template...</option>
          {templates.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}
        </select>
        <button onClick={handleAddTemplate} disabled={!selectedTemplate} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: selectedTemplate ? 'pointer' : 'not-allowed', opacity: selectedTemplate ? 1 : 0.6 }}>Insert</button>
        {/* Undo/Redo */}
        <button onClick={undo} disabled={historyIndex === 0} style={{ marginLeft: 18, background: '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 15, cursor: historyIndex === 0 ? 'not-allowed' : 'pointer', opacity: historyIndex === 0 ? 0.5 : 1 }}>Undo</button>
        <button onClick={redo} disabled={historyIndex === history.length - 1} style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontWeight: 700, fontSize: 15, cursor: historyIndex === history.length - 1 ? 'not-allowed' : 'pointer', opacity: historyIndex === history.length - 1 ? 0.5 : 1 }}>Redo</button>
      </div>
      {/* Version history panel */}
      <div style={{ marginBottom: 10, fontSize: 13, color: '#64748b', display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>History:</span>
        {history.map((h, i) => (
          <button key={i} onClick={() => {
            setHistoryIndex(i);
            setNodes(h.nodes);
            setEdges(h.edges);
          }} style={{
            background: i === historyIndex ? '#0ea5e9' : '#232336',
            color: i === historyIndex ? '#fff' : '#64748b',
            border: 'none',
            borderRadius: 6,
            padding: '2px 10px',
            fontWeight: 700,
            cursor: i === historyIndex ? 'default' : 'pointer',
            opacity: i === historyIndex ? 1 : 0.7
          }}>v{i + 1}</button>
        ))}
      </div>
      {/* Node list */}
      <div style={{ minHeight: 180, position: 'relative', zIndex: 2 }} role="list" aria-label="Flow nodes list">
        {nodes.length === 0 && <div style={{ color: '#64748b', fontSize: 15 }}>Add triggers, actions, or conditions to start building your flow.</div>}
        {/* Render groups and nodes */}
        {groups.map(group => (
          <div key={group.id} style={{ position: 'relative', marginBottom: 18, border: '2px solid #eab308', borderRadius: 10, background: '#232336', padding: 10, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontWeight: 800, color: '#eab308', fontSize: 16 }}>{group.name}</span>
              <button onClick={() => handleToggleGroup(group.id)} style={{ marginLeft: 12, background: '#eab308', color: '#232336', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{group.collapsed ? 'Expand' : 'Collapse'}</button>
            </div>
            {!group.collapsed && group.nodeIds.map(nodeId => {
              const node = nodes.find(n => n.id === nodeId);
              if (!node) return null;
              const color = nodeColors[node.type] || nodeColors.action;
              const pos = getNodePos(node.id);
              const nodeComments = comments?.[node.id] || [];
              return (
                <div
                  key={node.id}
                  ref={el => nodeRefs.current[node.id] = el}
                  draggable
                  onDragStart={() => onDragStart(node.id)}
                  onDragOver={onDragOver}
                  onDrop={() => onDrop(node.id)}
                  tabIndex={0}
                  role="listitem"
                  aria-label={`Node ${node.label}, type ${node.type}`}
                  aria-describedby={`node-desc-${node.id}`}
                  style={{
                    background: color.bg,
                    color: color.color,
                    borderRadius: 8,
                    padding: '14px 18px',
                    marginBottom: 10,
                    border: draggingNode === node.id ? `2px dashed ${color.border}` : `2px solid ${color.border}`,
                    opacity: draggingNode === node.id ? 0.7 : 1,
                    cursor: 'move',
                    fontWeight: 700,
                    fontSize: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    position: 'absolute',
                    left: pos.x,
                    top: pos.y,
                    width: 220,
                    boxShadow: draggingNode === node.id ? '0 0 0 2px #0ea5e9' : '0 2px 8px #0004',
                    zIndex: configNodeId === node.id ? 11 : 2,
                    transition: 'box-shadow 0.2s, border 0.2s, background 0.2s'
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') setConfigNodeId(node.id);
                    if (e.key === 'Delete') setNodes(nodes.filter(n => n.id !== node.id));
                    if (e.key === 'c' && e.ctrlKey) setCommentingNode(node.id);
                  }}
                  onMouseUp={() => edgeDrag.from && handleEdgeDrop(node.id)}
                >
                  {/* Edge handle (output) */}
                  <div
                    title="Drag to connect edge"
                    style={{ width: 16, height: 16, borderRadius: 8, background: '#eab308', marginRight: 6, cursor: 'crosshair', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseDown={e => handleEdgeDragStart(node.id, e)}
                  >
                    <span style={{ color: '#232336', fontWeight: 900, fontSize: 14 }}>→</span>
                  </div>
                  {/* ...existing code for node content... */}
                </div>
              );
            })}
          </div>
        ))}
        {/* Render ungrouped nodes */}
        {nodes.filter(n => !groups.some(g => g.nodeIds.includes(n.id))).map((node, idx) => {
          const color = nodeColors[node.type] || nodeColors.action;
          const pos = getNodePos(node.id);
          const nodeComments = comments?.[node.id] || [];
          return (
            <div
              key={node.id}
              ref={el => nodeRefs.current[node.id] = el}
              draggable
              onDragStart={() => onDragStart(node.id)}
              onDragOver={onDragOver}
              onDrop={() => onDrop(node.id)}
              tabIndex={0}
              role="listitem"
              aria-label={`Node ${node.label}, type ${node.type}`}
              aria-describedby={`node-desc-${node.id}`}
              style={{
                background: color.bg,
                color: color.color,
                borderRadius: 8,
                padding: '14px 18px',
                marginBottom: 10,
                border: draggingNode === node.id ? `2px dashed ${color.border}` : `2px solid ${color.border}`,
                opacity: draggingNode === node.id ? 0.7 : 1,
                cursor: 'move',
                fontWeight: 700,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                position: 'absolute',
                left: pos.x,
                top: pos.y,
                width: 220,
                boxShadow: draggingNode === node.id ? '0 0 0 2px #0ea5e9' : '0 2px 8px #0004',
                zIndex: configNodeId === node.id ? 11 : 2,
                transition: 'box-shadow 0.2s, border 0.2s, background 0.2s'
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') setConfigNodeId(node.id);
                if (e.key === 'Delete') setNodes(nodes.filter(n => n.id !== node.id));
                if (e.key === 'c' && e.ctrlKey) setCommentingNode(node.id);
              }}
              onMouseUp={() => edgeDrag.from && handleEdgeDrop(node.id)}
            >
              {/* Edge handle (output) */}
              <div
                title="Drag to connect edge"
                style={{ width: 16, height: 16, borderRadius: 8, background: '#eab308', marginRight: 6, cursor: 'crosshair', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseDown={e => handleEdgeDragStart(node.id, e)}
              >
                <span style={{ color: '#232336', fontWeight: 900, fontSize: 14 }}>→</span>
              </div>
              <span id={`node-desc-${node.id}`} style={{ minWidth: 80 }}>{node.label}</span>
              <span style={{ fontSize: 13, color: color === nodeColors.trigger ? '#fff' : '#64748b', fontWeight: 400 }}>{node.type}</span>
              {/* Node analytics */}
              <span title="Node executions" aria-label={`Node executions: ${analytics.nodeStats[node.id]?.executions || 0}`} style={{ fontSize: 12, color: '#22c55e', marginLeft: 4 }}>
                ▶ {analytics.nodeStats[node.id]?.executions || 0}
              </span>
              {analytics.nodeStats[node.id]?.lastExec && (
                <span title="Last executed" aria-label={`Last executed: ${new Date(analytics.nodeStats[node.id].lastExec).toLocaleTimeString()}`} style={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>
                  {new Date(analytics.nodeStats[node.id].lastExec).toLocaleTimeString()}
                </span>
              )}
              {/* Comment icon */}
              <button
                title="View/Add Comments"
                aria-label={`View or add comments for node ${node.label}`}
                onClick={e => { e.stopPropagation(); setCommentingNode(node.id); }}
                style={{ background: 'none', border: 'none', color: '#eab308', fontSize: 18, marginLeft: 2, cursor: 'pointer' }}>
                💬
                {nodeComments.length > 0 && <span style={{ fontSize: 12, color: '#eab308', marginLeft: 2 }}>({nodeComments.length})</span>}
              </button>
              {/* Comment panel */}
              {commentingNode === node.id && (
                <div role="dialog" aria-modal="true" aria-label={`Comments for node ${node.label}`} style={{ position: 'absolute', top: 50, left: 240, background: '#232336', border: '1.5px solid #eab308', borderRadius: 10, padding: 16, zIndex: 30, minWidth: 260, boxShadow: '0 2px 12px #0008' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: '#eab308' }}>Comments</div>
                  <div style={{ maxHeight: 120, overflowY: 'auto', marginBottom: 8 }}>
                    {nodeComments.length === 0 && <div style={{ color: '#64748b', fontSize: 14 }}>No comments yet.</div>}
                    {nodeComments.map((c, i) => (
                      <div key={i} style={{ marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, color: '#eab308', fontSize: 13 }}>{c.user}:</span>
                        <span style={{ marginLeft: 6, color: '#fafafa', fontSize: 14 }}>{c.text}</span>
                        <span style={{ marginLeft: 8, color: '#64748b', fontSize: 12 }}>{new Date(c.ts).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={commentDraft}
                      onChange={e => setCommentDraft(e.target.value)}
                      placeholder="Add a comment..."
                      aria-label="Add a comment"
                      style={{ flex: 1, borderRadius: 6, border: '1px solid #333', padding: '6px 10px', background: '#18181b', color: '#fafafa', fontSize: 14 }}
                    />
                    <button
                      aria-label="Send comment"
                      onClick={() => {
                        if (!commentDraft.trim()) return;
                        setComments(prev => ({
                          ...prev,
                          [node.id]: [...(prev[node.id] || []), { user: 'You', text: commentDraft, ts: Date.now() }]
                        }));
                        setCommentDraft("");
                      }}
                      style={{ background: '#eab308', color: '#232336', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                    >Send</button>
                    <button
                      aria-label="Close comments dialog"
                      onClick={() => { setCommentingNode(null); setCommentDraft(""); }}
                      style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                    >Close</button>
                  </div>
                </div>
              )}
              {/* ...existing code... */}
              <button onClick={() => setNodes(nodes.filter(n => n.id !== node.id))} style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Remove</button>
              <button onClick={() => {
                setConfigNodeId(node.id);
                setConfigDraft({ label: node.label, type: node.type, ...node.data });
              }} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Configure</button>
              {configNodeId === node.id && (
                <div style={{ position: 'absolute', top: 50, left: 0, background: '#18181b', border: '1.5px solid #0ea5e9', borderRadius: 10, padding: 18, zIndex: 20, minWidth: 280, boxShadow: '0 2px 12px #0008' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Configure Node</div>
                  <form>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label style={{ fontSize: 14, color: '#fafafa' }}>Label:</label>
                      <span title={'A human-friendly name for this node. Helps you identify it in the flow.'} style={{ color: '#38bdf8', cursor: 'help', fontSize: 16 }}>?</span>
                    </div>
                    <input value={configDraft.label || ''} onChange={e => setConfigDraft(d => ({ ...d, label: e.target.value }))} style={{ width: '100%', borderRadius: 6, border: '1px solid #333', padding: '6px 10px', background: '#232336', color: '#fafafa', marginBottom: 8 }} />
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label style={{ fontSize: 14, color: '#fafafa' }}>Type:</label>
                      <span title={'The kind of step: trigger (starts the flow), action (does something), or condition (branches logic).'} style={{ color: '#38bdf8', cursor: 'help', fontSize: 16 }}>?</span>
                    </div>
                    <select value={configDraft.type} onChange={e => setConfigDraft(d => ({ ...d, type: e.target.value }))} style={{ width: '100%', borderRadius: 6, border: '1px solid #333', padding: '6px 10px', background: '#232336', color: '#fafafa', marginBottom: 8 }}>
                      <option value="trigger">Trigger</option>
                      <option value="action">Action</option>
                      <option value="condition">Condition</option>
                    </select>
                    <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <label style={{ fontSize: 14, color: '#fafafa' }}>Parameters (JSON):</label>
                      <span title={'Extra settings for this node, in JSON format. Example: {"key":"value"}'} style={{ color: '#38bdf8', cursor: 'help', fontSize: 16 }}>?</span>
                    </div>
                    <textarea
                      value={configDraft.params || ''}
                      onChange={e => {
                        setConfigDraft(d => ({ ...d, params: e.target.value }));
                        // Validate JSON
                        try {
                          if (e.target.value.trim()) JSON.parse(e.target.value);
                          setConfigError("");
                        } catch {
                          setConfigError("Invalid JSON");
                        }
                      }}
                      rows={2}
                      style={{ width: '100%', borderRadius: 6, border: '1px solid #333', padding: '6px 10px', background: '#232336', color: '#fafafa', marginBottom: 4, fontFamily: 'monospace', fontSize: 14 }}
                      placeholder='{"key":"value"}'
                    />
                    {configError && <div style={{ color: '#ef4444', fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{configError}</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => {
                          // Validate before save
                          if (configDraft.params && configDraft.params.trim()) {
                            try {
                              JSON.parse(configDraft.params);
                            } catch {
                              setConfigError("Invalid JSON");
                              return;
                            }
                          }
                          setNodes(nodes.map(n => n.id === node.id ? { ...n, label: configDraft.label, type: configDraft.type, data: { params: configDraft.params } } : n));
                          setConfigNodeId(null);
                          setConfigError("");
                        }}
                        style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: configError ? 'not-allowed' : 'pointer', opacity: configError ? 0.6 : 1 }}
                        disabled={!!configError}
                      >Save</button>
                      <button type="button" onClick={() => { setConfigNodeId(null); setConfigError(""); }} style={{ background: '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
