

import React, { useState, useMemo } from "react";
import toolsMeta from "../toolMeta";

function groupByCategory(tools) {
  return tools.reduce((acc, tool) => {
    const cat = tool.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {});
}

export default function Sidebar({ current, onSelect, onShowChangelog, changelogUnread }) {
  const [search, setSearch] = useState("");
  const grouped = useMemo(() => groupByCategory(
    toolsMeta.filter(tool =>
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.description?.toLowerCase().includes(search.toLowerCase())
    )
  ), [search]);

  return (
    <nav className="sidebar-nav-shell">
      <div style={{padding: '18px 18px 0 18px'}}>
        <input
          type="text"
          placeholder="Search tools..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border-color)', marginBottom: 16, fontSize: 15 }}
          aria-label="Search tools"
        />
        <button
          style={{ width: '100%', background: 'none', border: 'none', color: '#7fffd4', fontWeight: 700, fontSize: 15, cursor: 'pointer', margin: '18px 0 8px 0', padding: 0, textAlign: 'left', position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}
          aria-label="Show What’s New / Changelog"
          onClick={onShowChangelog}
        >
          <span style={{fontSize:18}}>✨</span> What’s New
          {changelogUnread && <span style={{width:10,height:10,borderRadius:'50%',background:'#ff4d4f',display:'inline-block',marginLeft:4}} aria-label="New update" />}
        </button>
      </div>
      <div className="sidebar-section-label">Tools</div>
      <div style={{overflowY:'auto', maxHeight:'calc(100vh - 180px)'}}>
        {Object.entries(grouped).map(([cat, tools]) => (
          <div key={cat} style={{marginBottom: 18}}>
            <div style={{fontWeight:900, color:'#7fffd4', fontSize:15, margin:'10px 0 4px 18px', letterSpacing:0.2}}>{cat}</div>
            <ul className="sidebar-nav sidebar-tools">
              {tools.map(tool => (
                <li
                  key={tool.id}
                  className={current === tool.id ? "sidebar-active" : ""}
                  style={{padding:'7px 18px', cursor:'pointer', fontWeight:600, color:current===tool.id?'var(--button-primary-text)':'var(--text-primary)', background:current===tool.id?'var(--button-primary-bg)':'none', borderRadius:8, marginBottom:2, fontSize:15, transition:'background 0.2s'}}
                  onClick={() => onSelect(tool.id)}
                  tabIndex={0}
                  aria-label={tool.name}
                  title={tool.description}
                >
                  {tool.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}


