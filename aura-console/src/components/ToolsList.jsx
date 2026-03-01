
import React, { useState, Suspense, lazy } from "react";
import ErrorBoundary from "./ErrorBoundary";
import { useGlobalApiError } from "../globalApiError";
import toolsMeta from "../toolMeta";
// ...existing code...
import ToolScaffold from "./tools/ToolScaffold";
import MainSuite from "./tools/MainSuite";
import AbandonedCheckoutWinback from "./tools/AbandonedCheckoutWinback";
import ProductSeoEngine from "./ProductSeoEngine";
import InternalLinkOptimizer from "./InternalLinkOptimizer";
import AdvancedAnalyticsAttribution from "./tools/AdvancedAnalyticsAttribution.jsx";
import Toast from "./Toast";
import "./ToolsList.css";

// Map tool IDs to dedicated components if available
const toolComponents = {
 "abandoned-checkout-winback": AbandonedCheckoutWinback,
 "main-suite": MainSuite,
 "product-seo": ProductSeoEngine,
 "internal-link-optimizer": InternalLinkOptimizer,
 "advanced-analytics-attribution": AdvancedAnalyticsAttribution,
 // Add more mappings as you build more UIs
};

function ToolDetailModal({ tool, onClose }) {
 const [globalApiError] = useGlobalApiError();
 if (!tool) return null;
 const ToolComponent = toolComponents[tool.id];
 // Example fields for generic tools (customize as needed)
 const genericFields = [
 { name: "input", label: "Input", type: "textarea", required: true }
 ];
 return (
 <div className="tool-modal-overlay"onClick={onClose}>
 <div className="tool-modal"onClick={e => e.stopPropagation()}>
 <button className="tool-modal-close"onClick={onClose}>&times;</button>
 <div className="tool-modal-header">
 <span className="tool-card-name">{tool.name}</span>
 </div>
 <div className="tool-modal-desc">{tool.description}</div>
 <div className="tool-modal-meta">
 <span className="tool-card-tag">{tool.shortTag || tool.category}</span>
 </div>
 {globalApiError && (
 <div style={{ color: '#fff', background: '#ef4444', padding: 16, borderRadius: 8, margin: '18px 0', fontWeight: 600, fontSize: 16 }}>
 {globalApiError}
 </div>
 )}
 <div className="tool-modal-actions"style={{ marginTop: 24 }}>
 <ErrorBoundary>
 <Suspense fallback={<div>Loading tool</div>}>
 {ToolComponent ? (
 <ToolComponent />
 ) : tool.id && tool.id.endsWith("engine") ? (
 <ToolScaffold toolId={tool.id} toolName={tool.name} fields={genericFields} />
 ) : null}
 </Suspense>
 </ErrorBoundary>
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
 className="tool-card"key={tool.id}
 tabIndex={0}
 onClick={() => setSelectedTool(tool)}
 onKeyDown={e => (e.key === 'Enter'|| e.key === '') && setSelectedTool(tool)}
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