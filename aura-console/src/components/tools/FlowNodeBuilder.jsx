import React, { useState, useRef } from "react";

// Node-based, drag-and-drop flow builder foundation
export default function FlowNodeBuilder({ nodes, setNodes, edges, setEdges }) {
  // For MVP: nodes = [{id, type, label, data}], edges = [{from, to}]
  // Later: add branching, conditions, templates, etc.
  const [draggingNode, setDraggingNode] = useState(null);
  const builderRef = useRef();

  // Add node
  const addNode = (type) => {
    const id = Date.now() + Math.random();
    setNodes([...nodes, { id, type, label: type.charAt(0).toUpperCase() + type.slice(1), data: {} }]);
  };

  // Connect nodes (MVP: connect last node to new node)
  const connectNodes = (from, to) => {
    setEdges([...edges, { from, to }]);
  };

  // Drag-and-drop logic (MVP: vertical list, later: absolute positioning)
  const onDragStart = (id) => setDraggingNode(id);
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (id) => {
    if (draggingNode && draggingNode !== id) {
      // Reorder nodes
      const idxFrom = nodes.findIndex(n => n.id === draggingNode);
      const idxTo = nodes.findIndex(n => n.id === id);
      if (idxFrom > -1 && idxTo > -1) {
        const reordered = [...nodes];
        const [moved] = reordered.splice(idxFrom, 1);
        reordered.splice(idxTo, 0, moved);
        setNodes(reordered);
      }
    }
    setDraggingNode(null);
  };

  return (
    <div ref={builderRef} style={{ background: '#18181b', border: '1px solid #232336', borderRadius: 14, padding: 24, minHeight: 320 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <button onClick={() => addNode('trigger')} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ Trigger</button>
        <button onClick={() => addNode('action')} style={{ background: '#232336', color: '#fafafa', border: '1px solid #333', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ Action</button>
        <button onClick={() => addNode('condition')} style={{ background: '#232336', color: '#fafafa', border: '1px solid #333', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>+ Condition</button>
      </div>
      <div style={{ minHeight: 180 }}>
        {nodes.length === 0 && <div style={{ color: '#64748b', fontSize: 15 }}>Add triggers, actions, or conditions to start building your flow.</div>}
        {nodes.map((node, idx) => (
          <div
            key={node.id}
            draggable
            onDragStart={() => onDragStart(node.id)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(node.id)}
            style={{
              background: '#232336',
              color: '#fafafa',
              borderRadius: 8,
              padding: '14px 18px',
              marginBottom: 10,
              border: draggingNode === node.id ? '2px dashed #0ea5e9' : '1px solid #333',
              opacity: draggingNode === node.id ? 0.7 : 1,
              cursor: 'move',
              fontWeight: 700,
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}
          >
            <span style={{ minWidth: 80 }}>{node.label}</span>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 400 }}>{node.type}</span>
            <button onClick={() => setNodes(nodes.filter(n => n.id !== node.id))} style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 14px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  );
}
