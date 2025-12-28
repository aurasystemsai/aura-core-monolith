
import React, { useState } from "react";
import toolsMeta from "../toolMeta";
import "./ToolsList.css";

  const { t } = useTranslation();
  if (!tool) return null;
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
        <div className="tool-modal-actions">
          <button className="tool-modal-action-btn" disabled>{t('coming_soon_launch_tool')}</button>
        </div>
      </div>
    </div>
  );
}

export default function ToolsList() {
  const { t } = useTranslation();
  const [selectedTool, setSelectedTool] = useState(null);
  return (
    <div className="tools-list-shell">
      <h2 className="tools-list-title">{t('all_tools')}</h2>
      <div className="tools-list-grid">
        {toolsMeta.map((tool) => (
          <div
            className="tool-card"
            key={tool.id}
            tabIndex={0}
            onClick={() => setSelectedTool(tool)}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setSelectedTool(tool)}
            aria-label={`${t('open_details')} ${tool.name}`}
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