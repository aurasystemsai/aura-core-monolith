
import React, { useState, Suspense, lazy } from "react";
import toolsMeta from "../toolMeta";
import ToolPlaceholder from "./ToolPlaceholder";
import ToolScaffold from "./tools/ToolScaffold";
import AbandonedCheckoutWinback from "./tools/AbandonedCheckoutWinback";
import ProductSeoEngine from "./ProductSeoEngine";
import AiAltTextEngine from "./AiAltTextEngine";
import ContentHealthAuditor from "./ContentHealthAuditor";
import InternalLinkOptimizer from "./InternalLinkOptimizer";
import Toast from "./Toast";
import "./ToolsList.css";

// Map tool IDs to dedicated components if available
const toolComponents = {
  "abandoned-checkout-winback": AbandonedCheckoutWinback,
  "product-seo": ProductSeoEngine,
  "ai-alt-text-engine": AiAltTextEngine,
  "content-health-auditor": ContentHealthAuditor,
  "internal-link-optimizer": InternalLinkOptimizer,
  // Add more mappings as you build more UIs
};

function ToolDetailModal({ tool, onClose }) {
  if (!tool) return null;
  const ToolComponent = toolComponents[tool.id];
  // Example fields for generic tools (customize as needed)
  const genericFields = [
    { name: "input", label: "Input", type: "textarea", required: true }
  ];
  return (
    <div className="tool-modal-overlay" onClick={onClose}>
      <div className="tool-modal" onClick={e => e.stopPropagation()}>
        <button className="tool-modal-close" onClick={onClose}>&times;</button>
        <div className="tool-modal-header">
          <span className="tool-card-name">{tool.name}</span>
        </div>
        <div className="tool-modal-desc">{tool.description}</div>
        <div className="tool-modal-meta">
          <span className="tool-card-tag">{tool.shortTag || tool.category}</span>
        </div>
        <div className="tool-modal-actions" style={{ marginTop: 24 }}>
          <Suspense fallback={<div>Loading tool…</div>}>
            {ToolComponent ? (
              <ToolComponent />
            ) : tool.id && tool.id.endsWith("engine") ? (
              <ToolScaffold toolId={tool.id} toolName={tool.name} fields={genericFields} />
            ) : (
              <ToolPlaceholder name={tool.name} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}

export default function ToolsList() {
  const [selectedTool, setSelectedTool] = useState(null);
  return (
    <div className="tools-list-shell">
      <h2 className="tools-list-title">All Tools</h2>
      <div className="tools-list-grid">
        {toolsMeta.map((tool) => (
          <div
            className="tool-card"
            key={tool.id}
            tabIndex={0}
            onClick={() => setSelectedTool(tool)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedTool(tool)}
            aria-label={`Open details for ${tool.name}`}
            title={tool.description || tool.name}
          >
            <div className="tool-card-header">
              <span className="tool-card-name">{tool.name}</span>
            </div>
            <div className="tool-card-desc">{tool.description}</div>
            <div className="tool-card-meta">
              <span className="tool-card-tag">{tool.shortTag || tool.category}</span>
            </div>
          </div>
        ))}
      </div>
      <ToolDetailModal tool={selectedTool} onClose={() => setSelectedTool(null)} />
    </div>
  );
}