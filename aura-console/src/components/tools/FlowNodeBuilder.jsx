import React, { useState, useRef, useEffect } from "react";

// Node-based, drag-and-drop flow builder foundation
export default function FlowNodeBuilder({ nodes, setNodes, edges, setEdges }) {
                                                                                                                                                          // Flow execution scheduling state
                                                                                                                                                          const [showSchedule, setShowSchedule] = useState(false);
                                                                                                                                                          const [schedule, setSchedule] = useState({ type: '', value: '' });
                                                                                                                                                          const [nextRun, setNextRun] = useState('');

                                                                                                                                                          function handleSaveSchedule() {
                                                                                                                                                            setShowSchedule(false);
                                                                                                                                                            // Compute next run time (simple demo: only supports daily/hourly)
                                                                                                                                                            let next = '';
                                                                                                                                                            const now = new Date();
                                                                                                                                                            if (schedule.type === 'daily') {
                                                                                                                                                              const [h, m] = schedule.value.split(':').map(Number);
                                                                                                                                                              const nextDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
                                                                                                                                                              if (nextDate <= now) nextDate.setDate(nextDate.getDate() + 1);
                                                                                                                                                              next = nextDate.toLocaleString();
                                                                                                                                                            } else if (schedule.type === 'hourly') {
                                                                                                                                                              const nextDate = new Date(now.getTime() + 60 * 60 * 1000);
                                                                                                                                                              next = nextDate.toLocaleString();
                                                                                                                                                            }
                                                                                                                                                            setNextRun(next);
                                                                                                                                                          }
                                                                                                                                    // Drag-and-drop node reordering state
                                                                                                                                    const [draggedNodeId, setDraggedNodeId] = useState(null);

                                                                                                                                    function handleDragStart(e, nodeId) {
                                                                                                                                      setDraggedNodeId(nodeId);
                                                                                                                                      e.dataTransfer.effectAllowed = "move";
                                                                                                                                    }
                                                                                                                                    function handleDragOver(e) {
                                                                                                                                      e.preventDefault();
                                                                                                                                      e.dataTransfer.dropEffect = "move";
                                                                                                                                    }
                                                                                                                                    function handleDrop(e, targetNodeId) {
                                                                                                                                      e.preventDefault();
                                                                                                                                      if (draggedNodeId === null || draggedNodeId === targetNodeId) return;
                                                                                                                                      // Reorder nodes array
                                                                                                                                      const idxFrom = nodes.findIndex(n => n.id === draggedNodeId);
                                                                                                                                      const idxTo = nodes.findIndex(n => n.id === targetNodeId);
                                                                                                                                      if (idxFrom === -1 || idxTo === -1) return;
                                                                                                                                      const updated = [...nodes];
                                                                                                                                      const [moved] = updated.splice(idxFrom, 1);
                                                                                                                                      updated.splice(idxTo, 0, moved);
                                                                                                                                      setNodes(updated);
                                                                                                                                      setDraggedNodeId(null);
                                                                                                                                    }
                                                                                                              // Custom node types/fields state
                                                                                                              const [showAddNode, setShowAddNode] = useState(false);
                                                                                                              const [newNodeType, setNewNodeType] = useState('');
                                                                                                              const [newNodeLabel, setNewNodeLabel] = useState('');
                                                                                                              const [newNodeFields, setNewNodeFields] = useState('');

                                                                                                              function handleAddCustomNode() {
                                                                                                                if (!newNodeLabel || !newNodeType) return;
                                                                                                                const id = newNodeLabel.toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(Math.random() * 10000);
                                                                                                                let fields = {};
                                                                                                                try {
                                                                                                                  fields = newNodeFields ? JSON.parse(newNodeFields) : {};
                                                                                                                } catch {}
                                                                                                                setNodes([...nodes, { id, label: newNodeLabel, type: newNodeType, ...fields }]);
                                                                                                                setShowAddNode(false);
                                                                                                                setNewNodeType('');
                                                                                                                setNewNodeLabel('');
                                                                                                                setNewNodeFields('');
                                                                                                              }
                                                                                        // Flow validation state
                                                                                        const [validationErrors, setValidationErrors] = useState([]);

                                                                                        // Validate flow structure (simple demo: check for orphan nodes, missing labels)
                                                                                        useEffect(() => {
                                                                                          const errors = [];
                                                                                          // Check for nodes with no label
                                                                                          nodes.forEach(n => {
                                                                                            if (!n.label || n.label.trim() === "") {
                                                                                              errors.push({ type: "node", id: n.id, msg: `Node ${n.id} is missing a label.` });
                                                                                            }
                                                                                          });
                                                                                          // Check for orphan nodes (no incoming or outgoing edges)
                                                                                          nodes.forEach(n => {
                                                                                            const hasEdge = edges.some(e => e.source === n.id || e.target === n.id);
                                                                                            if (!hasEdge) {
                                                                                              errors.push({ type: "node", id: n.id, msg: `Node ${n.label || n.id} is not connected to any edge.` });
                                                                                            }
                                                                                          });
                                                                                          // Check for edges with missing source/target
                                                                                          edges.forEach(e => {
                                                                                            if (!e.source || !e.target) {
                                                                                              errors.push({ type: "edge", id: e.id, msg: `Edge ${e.id} is missing source or target.` });
                                                                                            }
                                                                                          });
                                                                                          setValidationErrors(errors);
                                                                                        }, [nodes, edges]);
                                                                  // Real-time collaboration state
                                                                  const [collaborators, setCollaborators] = useState([]);
                                                                  const wsRef = useRef(null);

                                                                  useEffect(() => {
                                                                    // Connect to WebSocket server (replace URL with your backend)
                                                                    wsRef.current = new window.WebSocket('ws://localhost:8080/flow-sync');
                                                                    wsRef.current.onopen = () => {
                                                                      wsRef.current.send(JSON.stringify({ type: 'join', user: currentUser }));
                                                                    };
                                                                    wsRef.current.onmessage = (event) => {
                                                                      try {
                                                                        const msg = JSON.parse(event.data);
                                                                        if (msg.type === 'sync' && msg.nodes && msg.edges) {
                                                                          setNodes(msg.nodes);
                                                                          setEdges(msg.edges);
                                                                        }
                                                                        if (msg.type === 'collaborators' && Array.isArray(msg.list)) {
                                                                          setCollaborators(msg.list);
                                                                        }
                                                                      } catch {}
                                                                    };
                                                                    wsRef.current.onclose = () => {};
                                                                    return () => {
                                                                      wsRef.current && wsRef.current.close();
                                                                    };
                                                                    // eslint-disable-next-line
                                                                  }, []);

                                                                  // Broadcast changes to other collaborators
                                                                  useEffect(() => {
                                                                    if (wsRef.current && wsRef.current.readyState === 1) {
                                                                      wsRef.current.send(JSON.stringify({ type: 'sync', nodes, edges }));
                                                                    }
                                                                    // eslint-disable-next-line
                                                                  }, [JSON.stringify(nodes), JSON.stringify(edges)]);
                                            // Node grouping/collapsible groups state
                                            const [nodeGroups, setNodeGroups] = useState([
                                              { id: 'group1', name: 'Email Actions', collapsed: false },
                                              { id: 'group2', name: 'Triggers', collapsed: false }
                                            ]);
                                            // Assign nodes to groups (mock logic, could be dynamic)
                                            const nodeGroupMap = {
                                              'welcome-email': 'group1',
                                              'reminder-email': 'group1',
                                              'start': 'group2',
                                              'cart-check': 'group2'
                                            };
                                            function toggleGroupCollapse(groupId) {
                                              setNodeGroups(groups => groups.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
                                            }
                      // Auto-save drafts state
                      // Flow templates state
                      const [showTemplates, setShowTemplates] = useState(false);
                      const [selectedTemplate, setSelectedTemplate] = useState(null);
                      // Example templates (could be fetched from backend)
                      const flowTemplates = [
                        {
                          id: 'welcome-flow',
                          name: 'Welcome Flow',
                          description: 'Send a welcome email to new users.',
                          nodes: [
                            { id: 'start', label: 'Start', type: 'trigger' },
                            { id: 'welcome-email', label: 'Send Welcome Email', type: 'email' }
                          ],
                          edges: [
                            { id: 'e1', source: 'start', target: 'welcome-email' }
                          ]
                        },
                        {
                          id: 'abandoned-cart',
                          name: 'Abandoned Cart Recovery',
                          description: 'Recover abandoned carts with reminders.',
                          nodes: [
                            { id: 'cart-check', label: 'Cart Check', type: 'trigger' },
                            { id: 'reminder-email', label: 'Send Reminder', type: 'email' }
                          ],
                          edges: [
                            { id: 'e2', source: 'cart-check', target: 'reminder-email' }
                          ]
                        }
                      ];

                      function applyTemplate(template) {
                        setNodes(template.nodes);
                        setEdges(template.edges);
                        setShowTemplates(false);
                      }
                      const [lastDraft, setLastDraft] = useState(null);
                      const [autoSaveStatus, setAutoSaveStatus] = useState("");

                      // Auto-save draft every 60 seconds if nodes/edges changed
                      useEffect(() => {
                        const interval = setInterval(() => {
                          const draft = { nodes, edges, ts: Date.now(), comments: "Auto-saved draft", analytics: null, author: "You", action: "draft" };
                          if (JSON.stringify(draft.nodes) !== JSON.stringify(lastDraft?.nodes) || JSON.stringify(draft.edges) !== JSON.stringify(lastDraft?.edges)) {
                            setLastDraft(draft);
                            setAutoSaveStatus("Draft auto-saved at " + new Date(draft.ts).toLocaleTimeString());
                            // Optionally, POST to backend for persistent drafts
                            // fetch('/api/klaviyo-flow-automation/versions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: draft }) });
                          }
                        }, 60000); // 60 seconds
                        return () => clearInterval(interval);
                        // eslint-disable-next-line
                      }, [nodes, edges, lastDraft]);
                    // Tagging/favorites state
                    const [favoriteVersionIds, setFavoriteVersionIds] = useState([]);

                    function toggleFavoriteVersion(ver) {
                      setFavoriteVersionIds(favs =>
                        favs.includes(ver.id)
                          ? favs.filter(id => id !== ver.id)
                          : [...favs, ver.id]
                      );
                    }
                  // Undo/redo state
                  const [history, setHistory] = useState([]); // [{nodes, edges}]
                  const [future, setFuture] = useState([]); // [{nodes, edges}]

                  // Push to history on nodes/edges change
                  useEffect(() => {
                    setHistory(prev => [...prev, { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
                    // Clear redo stack on new change
                    setFuture([]);
                    // eslint-disable-next-line
                  }, [JSON.stringify(nodes), JSON.stringify(edges)]);

                  // Undo handler
                  function handleUndo() {
                    if (history.length < 2) return;
                    const prev = history[history.length - 2];
                    setFuture(f => [{ nodes, edges }, ...f]);
                    setHistory(h => h.slice(0, -1));
                    setNodes(prev.nodes);
                    setEdges(prev.edges);
                  }

                  // Redo handler
                  function handleRedo() {
                    if (future.length === 0) return;
                    const next = future[0];
                    setHistory(h => [...h, next]);
                    setNodes(next.nodes);
                    setEdges(next.edges);
                    setFuture(f => f.slice(1));
                  }
                // Mock current user (replace with real user context if available)
                const currentUser = "You";
              // Analytics dashboard state
              const [showAnalytics, setShowAnalytics] = useState(false);
              const [analyticsVersion, setAnalyticsVersion] = useState(null);
            // Node search/filter state
            const [nodeSearch, setNodeSearch] = useState("");
          // Export/import state
          const fileInputRef = useRef();
          const [importError, setImportError] = useState("");

          // Export flow as JSON
          function handleExportFlow() {
            const data = JSON.stringify({ nodes, edges }, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flow-export.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }

          // Import flow from JSON
          function handleImportFlow(e) {
            setImportError("");
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
              try {
                const data = JSON.parse(evt.target.result);
                if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error("Invalid flow format");
                setNodes(data.nodes);
                setEdges(data.edges);
              } catch (err) {
                setImportError("Import failed: " + err.message);
              }
            };
            reader.readAsText(file);
          }
        // Diff viewer state
        const [diffVersionA, setDiffVersionA] = useState(null);
        const [diffVersionB, setDiffVersionB] = useState(null);
        const [showDiff, setShowDiff] = useState(false);

        // Compute a simple diff between two versions (nodes/edges)
        function computeDiff(a, b) {
          if (!a || !b) return { nodes: '', edges: '' };
          const nodeDiff = JSON.stringify(a.nodes, null, 2) !== JSON.stringify(b.nodes, null, 2)
            ? `Nodes changed\nA: ${JSON.stringify(a.nodes, null, 2)}\nB: ${JSON.stringify(b.nodes, null, 2)}`
            : 'Nodes identical';
          const edgeDiff = JSON.stringify(a.edges, null, 2) !== JSON.stringify(b.edges, null, 2)
            ? `Edges changed\nA: ${JSON.stringify(a.edges, null, 2)}\nB: ${JSON.stringify(b.edges, null, 2)}`
            : 'Edges identical';
          return { nodes: nodeDiff, edges: edgeDiff };
        }
      // Version comments state
      const [versionComment, setVersionComment] = useState("");

    // Preview a node's execution (calls backend)
    async function handlePreviewNode(nodeId) {
      setPreviewNodeId(nodeId);
      setPreviewOutput("");
      setPreviewError("");
      try {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) throw new Error("Node not found");
        const res = await fetch(`/api/klaviyo-flow-automation/preview-node`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ node, nodes, edges })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Unknown error");
        setPreviewOutput(typeof data.output === "string" ? data.output : JSON.stringify(data.output, null, 2));
      } catch (err) {
        setPreviewError(err.message || "Error previewing node");
      }
    }
  // Flow versioning
  const [versions, setVersions] = useState([]); // [{id, ts, nodes, edges, comments, analytics}]
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [versionError, setVersionError] = useState("");

  // Node execution preview modal state
  const [previewNodeId, setPreviewNodeId] = useState(null);
  const [previewOutput, setPreviewOutput] = useState("");
  const [previewError, setPreviewError] = useState("");

  // Load versions from backend
  async function loadVersions() {
    setVersionError("");
    try {
      const res = await fetch("/api/klaviyo-flow-automation/versions");
      if (!res.ok) throw new Error("Failed to fetch versions");
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err) {
      setVersionError(err.message || "Error loading versions");
    }
  }

  // Save current version to backend
  async function saveVersion() {
    setVersionError("");
    try {
      const version = {
        nodes,
        edges,
        ts: Date.now(),
        comments: versionComment,
        analytics: null, // Placeholder, add analytics if available
        author: currentUser,
        action: "saved"
      };
      const res = await fetch("/api/klaviyo-flow-automation/versions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version })
      });
      if (!res.ok) throw new Error("Failed to save version");
      setVersionComment("");
      await loadVersions();
    } catch (err) {
      setVersionError(err.message || "Error saving version");
    }
  }

  // Restore a version (replace nodes/edges)
  function restoreVersion(ver) {
    if (!ver) return;
    setNodes(ver.nodes || []);
    setEdges(ver.edges || []);
    // Optionally, log restore action (mocked for now)
    ver.lastRestoredBy = currentUser;
    ver.lastRestoredAt = Date.now();
    setVersionModalOpen(false);
  }

  // Node execution preview modal handlers (stub)
  function closePreview() {
    setPreviewNodeId(null);
    setPreviewOutput("");
    setPreviewError("");
  }

  // Optionally, add useEffect to load versions when modal opens
  useEffect(() => {
    if (versionModalOpen) loadVersions();
    // eslint-disable-next-line
  }, [versionModalOpen]);

  // Place all logic above this line
        // Undo/redo buttons
        const canUndo = history.length > 1;
        const canRedo = future.length > 0;
      // Helper: get all versions with analytics
      const versionsWithAnalytics = versions.filter(v => v.analytics);
    // Filter nodes by search
    const filteredNodes = nodeSearch.trim()
      ? nodes.filter(n =>
          (n.label && n.label.toLowerCase().includes(nodeSearch.toLowerCase())) ||
          (n.type && n.type.toLowerCase().includes(nodeSearch.toLowerCase())) ||
          (n.id && n.id.toLowerCase().includes(nodeSearch.toLowerCase()))
        )
      : nodes;

    return (
      <div style={{ position: 'relative', minHeight: 600 }}>
        {/* Flow execution scheduling toolbar */}
        <div style={{ position: 'absolute', top: 18, left: 1020, zIndex: 10 }}>
          <button
            onClick={() => setShowSchedule(true)}
            style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Schedule Flow
          </button>
          {nextRun && (
            <span style={{ marginLeft: 12, background: '#22c55e', color: '#fff', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 14 }}>
              Next Run: {nextRun}
            </span>
          )}
        </div>
        {/* Flow execution scheduling modal */}
        {showSchedule && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 340, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
              <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 18 }}>Schedule Flow Execution</div>
              <button onClick={() => setShowSchedule(false)} style={{ position: 'absolute', top: 18, right: 18, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
              <div style={{ marginBottom: 12 }}>
                <select value={schedule.type} onChange={e => setSchedule(s => ({ ...s, type: e.target.value }))} style={{ fontSize: 15, borderRadius: 8, border: '1px solid #232336', padding: '8px 12px', minWidth: 220, marginBottom: 8 }}>
                  <option value="">Select schedule type</option>
                  <option value="daily">Daily</option>
                  <option value="hourly">Hourly</option>
                </select>
                {schedule.type === 'daily' && (
                  <input
                    type="time"
                    value={schedule.value}
                    onChange={e => setSchedule(s => ({ ...s, value: e.target.value }))}
                    style={{ fontSize: 15, borderRadius: 8, border: '1px solid #232336', padding: '8px 12px', minWidth: 220, marginBottom: 8 }}
                  />
                )}
                <button onClick={handleSaveSchedule} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Save Schedule</button>
              </div>
            </div>
          </div>
        )}
        {/* Add custom node modal trigger */}
        {/* Add custom node modal trigger */}
        <div style={{ position: 'absolute', top: 18, left: 820, zIndex: 10 }}>
          <button
            onClick={() => setShowAddNode(true)}
            style={{ background: '#f59e42', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Add Custom Node
          </button>
        </div>
        {/* Add custom node modal */}
        {showAddNode && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 340, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
                    <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 18 }}>Add Custom Node</div>
                    <button onClick={() => setShowAddNode(false)} style={{ position: 'absolute', top: 18, right: 18, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
                    <div style={{ marginBottom: 12 }}>
                      <input
                        type="text"
                        value={newNodeLabel}
                        onChange={e => setNewNodeLabel(e.target.value)}
                        placeholder="Node Label"
                        style={{ fontSize: 15, borderRadius: 8, border: '1px solid #232336', padding: '8px 12px', minWidth: 220, marginBottom: 8 }}
                      />
                      <input
                        type="text"
                        value={newNodeType}
                        onChange={e => setNewNodeType(e.target.value)}
                        placeholder="Node Type"
                        style={{ fontSize: 15, borderRadius: 8, border: '1px solid #232336', padding: '8px 12px', minWidth: 220, marginBottom: 8 }}
                      />
                      <textarea
                        value={newNodeFields}
                        onChange={e => setNewNodeFields(e.target.value)}
                        placeholder="Custom Fields (JSON)"
                        style={{ fontSize: 15, borderRadius: 8, border: '1px solid #232336', padding: '8px 12px', minWidth: 220, minHeight: 60, marginBottom: 8 }}
                      />
                      <button onClick={handleAddCustomNode} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Add Node</button>
                    </div>
                  </div>
                </div>
              )}
        {/* Flow validation errors toolbar (valid JSX placement) */}
        {/* Flow validation errors toolbar (valid JSX placement) */}
        <div style={{ position: 'absolute', top: 18, left: 620, zIndex: 10 }}>
          {validationErrors.length > 0 ? (
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 14 }}>
              {validationErrors.length} Flow Error{validationErrors.length > 1 ? 's' : ''}
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {validationErrors.map((err, i) => (
                  <li key={i} style={{ color: '#fff', fontSize: 13 }}>{err.msg}</li>
                ))}
              </ul>
            </span>
          ) : (
            <span style={{ background: '#22c55e', color: '#fff', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 14 }}>
              Flow Valid
            </span>
          )}
        </div>
        {/* Real-time collaborators indicator (valid JSX placement) */}
        <div style={{ position: 'absolute', top: 18, left: 420, zIndex: 10 }}>
          <span style={{ background: '#232336', color: '#a3e635', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 14 }}>
            Online: {collaborators.length > 0 ? collaborators.join(', ') : 'Just you'}
          </span>
        </div>
        {/* Flow Templates Toolbar */}
        <div style={{ position: 'absolute', top: 18, left: 220, zIndex: 10 }}>
          <button
            onClick={() => setShowTemplates(true)}
            style={{ background: '#a21caf', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Flow Templates
          </button>
        </div>
        {/* Flow Templates Modal */}
        {showTemplates && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 420, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Flow Templates</div>
              <button onClick={() => setShowTemplates(false)} style={{ position: 'absolute', top: 18, right: 18, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {flowTemplates.map(tmpl => (
                  <li key={tmpl.id} style={{ marginBottom: 18, background: '#18181b', borderRadius: 8, padding: 18, boxShadow: '0 2px 8px #0004' }}>
                    <div style={{ fontWeight: 700, fontSize: 17 }}>{tmpl.name}</div>
                    <div style={{ color: '#38bdf8', fontSize: 14, marginBottom: 6 }}>{tmpl.description}</div>
                    <button onClick={() => applyTemplate(tmpl)} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Use Template</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        {/* Auto-save draft status */}
        {autoSaveStatus && <div style={{ position: 'absolute', bottom: 18, left: 18, color: '#22c55e', fontWeight: 700, fontSize: 14, background: '#232336', borderRadius: 8, padding: '6px 14px', zIndex: 10 }}>{autoSaveStatus}</div>}
        {/* Undo/Redo toolbar */}
        <div style={{ position: 'absolute', top: 70, left: 18, zIndex: 10, display: 'flex', gap: 8 }}>
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            style={{ background: canUndo ? '#f59e42' : '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: canUndo ? 'pointer' : 'not-allowed' }}
          >
            Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            style={{ background: canRedo ? '#0ea5e9' : '#64748b', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: canRedo ? 'pointer' : 'not-allowed' }}
          >
            Redo
          </button>
        </div>
        {/* Node search/filter bar */}
        <div style={{ margin: '32px 0 0 0', padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="text"
            value={nodeSearch}
            onChange={e => setNodeSearch(e.target.value)}
            placeholder="Search nodes by name, type, or ID..."
            style={{ fontSize: 15, borderRadius: 8, border: '1px solid #232336', padding: '8px 12px', minWidth: 220 }}
          />
          {nodeSearch && (
            <button onClick={() => setNodeSearch("")} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Clear</button>
          )}
        </div>
        {/* Export/Import toolbar */}
        <div style={{ position: 'absolute', top: 18, left: 18, zIndex: 10, display: 'flex', gap: 8 }}>
          <button
            onClick={handleExportFlow}
            style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Export Flow
          </button>
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Import Flow
          </button>
          <input
            type="file"
            accept="application/json"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleImportFlow}
          />
        </div>
        {importError && <div style={{ color: '#ef4444', fontWeight: 700, marginTop: 8, marginLeft: 18 }}>{importError}</div>}
        {/* Main toolbar */}
        <div style={{ position: 'absolute', top: 18, right: 18, zIndex: 10 }}>
          <button
            onClick={() => setVersionModalOpen(true)}
            style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginRight: 8 }}
          >
            Version History
          </button>
        </div>

        {/* Node list with grouping and collapsible groups */}
        <div style={{ margin: '0', padding: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Nodes</div>
          {nodeGroups.map(group => {
            // Get nodes in this group
            const groupNodes = filteredNodes.filter(n => nodeGroupMap[n.id] === group.id);
            return (
              <React.Fragment key={group.id}>
                <div style={{ marginBottom: 18, background: '#18181b', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{group.name}</span>
                    <button onClick={() => toggleGroupCollapse(group.id)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 10px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                      {group.collapsed ? 'Expand' : 'Collapse'}
                    </button>
                  </div>
                  {!group.collapsed ? (
                    groupNodes.length > 0 ? (
                      <ul style={{ listStyle: 'none', padding: 0 }}>
                        {groupNodes.map(node => (
                          <li
                            key={node.id}
                            style={{ marginBottom: 10, background: validationErrors.some(e => e.type === 'node' && e.id === node.id) ? '#ef4444' : '#232336', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'move' }}
                            draggable
                            onDragStart={e => handleDragStart(e, node.id)}
                            onDragOver={handleDragOver}
                            onDrop={e => handleDrop(e, node.id)}
                          >
                            <span style={{ fontWeight: 600 }}>{node.label || node.id}</span>
                            <button
                              onClick={() => handlePreviewNode(node.id)}
                              style={{ background: '#a21caf', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginLeft: 12 }}
                            >
                              Preview
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ color: '#64748b', fontSize: 15 }}>No nodes in this group.</div>
                    )
                  ) : null}
                </div>
              </React.Fragment>
            );
          })}
          {/* Ungrouped nodes */}
          {(() => {
            const ungrouped = filteredNodes.filter(n => !nodeGroupMap[n.id]);
            if (ungrouped.length === 0) return null;
            return (
              <React.Fragment>
                <div style={{ marginBottom: 18, background: '#18181b', borderRadius: 8, padding: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Ungrouped</div>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {ungrouped.map(node => (
                      <li
                        key={node.id}
                        style={{ marginBottom: 10, background: validationErrors.some(e => e.type === 'node' && e.id === node.id) ? '#ef4444' : '#232336', borderRadius: 8, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'move' }}
                        draggable
                        onDragStart={e => handleDragStart(e, node.id)}
                        onDragOver={handleDragOver}
                        onDrop={e => handleDrop(e, node.id)}
                      >
                        <span style={{ fontWeight: 600 }}>{node.label || node.id}</span>
                        <button
                          onClick={() => handlePreviewNode(node.id)}
                          style={{ background: '#a21caf', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginLeft: 12 }}
                        >
                          Preview
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </React.Fragment>
            );
          })()}
        </div>
        {/* Analytics dashboard modal (root level) */}
        {showAnalytics && analyticsVersion && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 520, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Analytics Dashboard</div>
              <button onClick={() => { setShowAnalytics(false); setAnalyticsVersion(null); }} style={{ position: 'absolute', top: 18, right: 18, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
              <div style={{ marginBottom: 12, fontWeight: 700, fontSize: 16 }}>Version: {analyticsVersion.ts ? new Date(analyticsVersion.ts).toLocaleString() : 'Unknown'}</div>
              <pre style={{ background: '#18181b', color: '#a3e635', borderRadius: 6, padding: 12, fontSize: 15 }}>{JSON.stringify(analyticsVersion.analytics, null, 2)}</pre>
            </div>
          </div>
        )}
        {/* Version history modal */}
        {versionModalOpen && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 420, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
              <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Flow Version History</div>
              {versionError && <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 10 }}>{versionError}</div>}
              <button onClick={() => setVersionModalOpen(false)} style={{ position: 'absolute', top: 18, right: 18, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
              <button onClick={loadVersions} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 12 }}>Refresh</button>
              <div style={{ marginBottom: 10 }}>
                <textarea
                  value={versionComment}
                  onChange={e => setVersionComment(e.target.value)}
                  placeholder="Add a comment for this version (optional)"
                  style={{ width: '100%', minHeight: 38, borderRadius: 8, border: '1px solid #232336', padding: 8, fontSize: 15, marginBottom: 8 }}
                />
                <button onClick={saveVersion} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginBottom: 4 }}>Save Current Version</button>
              </div>
              <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                {versions.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: 15 }}>No versions saved yet.</div>
                ) : (
                  <>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {versions.map((ver, i) => (
                        <li key={ver.id || i} style={{ marginBottom: 18, background: '#18181b', borderRadius: 8, padding: 18, boxShadow: '0 2px 8px #0004' }}>
                          <div style={{ fontWeight: 700, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                            Version {i + 1}
                            <button
                              onClick={() => toggleFavoriteVersion(ver)}
                              style={{ background: favoriteVersionIds.includes(ver.id) ? '#fbbf24' : '#232336', color: favoriteVersionIds.includes(ver.id) ? '#232336' : '#fbbf24', border: 'none', borderRadius: 8, padding: '2px 10px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                              title={favoriteVersionIds.includes(ver.id) ? 'Unfavorite' : 'Favorite'}
                            >
                              ★
                            </button>
                          </div>
                          <div style={{ color: '#fbbf24', fontSize: 13, marginBottom: 4 }}>
                            {ver.author ? `By: ${ver.author}` : ''} {ver.action ? `(${ver.action})` : ''}
                          </div>
                          {ver.lastRestoredBy && (
                            <div style={{ color: '#0ea5e9', fontSize: 13, marginBottom: 4 }}>
                              Last restored by: {ver.lastRestoredBy} {ver.lastRestoredAt ? `at ${new Date(ver.lastRestoredAt).toLocaleString()}` : ''}
                            </div>
                          )}
                          <div style={{ color: '#eab308', fontSize: 14, marginBottom: 6 }}>{ver.ts ? new Date(ver.ts).toLocaleString() : 'Unknown time'}</div>
                          {ver.comments && <div style={{ color: '#38bdf8', fontSize: 14, marginBottom: 6 }}><b>Comment:</b> {ver.comments}</div>}
                          {ver.analytics && (
                            <div style={{ color: '#a3e635', fontSize: 13, marginBottom: 6 }}>
                              <b>Analytics:</b>
                              <pre style={{ background: '#232336', color: '#a3e635', borderRadius: 6, padding: 8, margin: 0 }}>{JSON.stringify(ver.analytics, null, 2)}</pre>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <button onClick={() => restoreVersion(ver)} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Restore</button>
                            <button onClick={() => { setDiffVersionA(ver); setShowDiff(true); }} style={{ background: '#f59e42', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Diff</button>
                            {ver.analytics && (
                              <button onClick={() => { setAnalyticsVersion(ver); setShowAnalytics(true); }} style={{ background: '#a3e635', color: '#232336', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Analytics</button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                    {/* Diff viewer modal (outside map loop and ul) */}
                    {showDiff && diffVersionA && (
                      <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 520, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
                          <div style={{ fontWeight: 800, fontSize: 22, marginBottom: 18 }}>Version Diff Viewer</div>
                          <div style={{ marginBottom: 12 }}>
                            <label style={{ fontWeight: 600, fontSize: 15, marginRight: 8 }}>Compare to:</label>
                            <select value={diffVersionB ? diffVersionB.id : ''} onChange={e => {
                              const v = versions.find(vv => vv.id === e.target.value);
                              setDiffVersionB(v);
                            }} style={{ fontSize: 15, borderRadius: 6, padding: 4, marginRight: 8 }}>
                              <option value=''>Select version</option>
                              {versions.filter(vv => vv !== diffVersionA).map((v, idx) => (
                                <option key={v.id || idx} value={v.id}>{`Version ${versions.indexOf(v) + 1}`}</option>
                              ))}
                            </select>
                            <button onClick={() => { setShowDiff(false); setDiffVersionA(null); setDiffVersionB(null); }} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
                          </div>
                          {diffVersionB ? (
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Nodes Diff</div>
                              <pre style={{ background: '#18181b', color: '#fbbf24', borderRadius: 6, padding: 10, marginBottom: 16, fontSize: 14 }}>{computeDiff(diffVersionA, diffVersionB).nodes}</pre>
                              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Edges Diff</div>
                              <pre style={{ background: '#18181b', color: '#fbbf24', borderRadius: 6, padding: 10, fontSize: 14 }}>{computeDiff(diffVersionA, diffVersionB).edges}</pre>
                            </div>
                          ) : (
                            <div style={{ color: '#64748b', fontSize: 15 }}>Select a version to compare.</div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Node execution preview modal */}
        {previewNodeId && (
          <div role="dialog" aria-modal="true" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#18181bcc', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#232336', borderRadius: 14, padding: 32, minWidth: 340, boxShadow: '0 2px 24px #000a', color: '#fafafa', position: 'relative' }}>
              <div style={{ fontWeight: 800, fontSize: 20, marginBottom: 18 }}>Node Execution Preview</div>
              {previewError ? (
                <div style={{ color: '#ef4444', fontWeight: 700 }}>{previewError}</div>
              ) : (
                <pre style={{ background: '#18181b', color: '#22c55e', padding: 16, borderRadius: 8, fontSize: 15, marginBottom: 18 }}>{previewOutput}</pre>
              )}
              <button onClick={closePreview} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        )}
      </div>
  );
}