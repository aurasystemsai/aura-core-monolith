import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
 FiActivity,
 FiBarChart2,
 FiBox,
 FiBriefcase,
 FiCode,
 FiGrid,
 FiHeart,
 FiHelpCircle,
 FiHome,
 FiMail,
 FiMessageCircle,
 FiSearch,
 FiSettings,
 FiTrendingUp,
 FiUsers,
} from "react-icons/fi";
import { apiFetch } from "../api";
import { getToolCatalogGroups } from "../toolMeta";
import usePlan, { canUseTool, requiredPlanFor, PLAN_LABEL, PLAN_COLOUR } from "../hooks/usePlan";

const GROUP_ICONS = {
 seo: FiSearch,
 lifecycle: FiMail,
 support: FiHeart,
 social: FiMessageCircle,
 ads: FiTrendingUp,
 analytics: FiBarChart2,
 personalization: FiUsers,
 finance: FiBriefcase,
 automation: FiActivity,
 ai: FiGrid,
 platform: FiCode,
};

const SIDEBAR_PREF_KEY = "aura-sidebar-prefs";

export default function AppSidebar({ activeSection, setActiveSection, plan }) {
 const [groups, setGroups] = useState(() => getToolCatalogGroups());
 const [loading, setLoading] = useState(false);
 const [collapsed, setCollapsed] = useState(() => {
 try { return JSON.parse(localStorage.getItem(SIDEBAR_PREF_KEY) || "{}").collapsed || false; } catch { return false; }
 });
 const [expandedGroups, setExpandedGroups] = useState(() => {
 try { return JSON.parse(localStorage.getItem(SIDEBAR_PREF_KEY) || "{}").expandedGroups || {}; } catch { return {}; }
 });
 const [search, setSearch] = useState("");

 /* Load tool groups from API */
 useEffect(() => {
 let mounted = true;
 async function load() {
 try {
 const resp = await apiFetch("/api/main-suite/modules");
 const data = await resp.json();
 if (Array.isArray(data.modules) && mounted) {
 const catalogGroups = getToolCatalogGroups(data.modules);
 setGroups(catalogGroups);
 // Auto-expand the group containing the active tool
 const activeGroup = catalogGroups.find(g =>
 g.modules?.some(m => m.id === activeSection)
 );
 if (activeGroup) {
 setExpandedGroups(prev => ({ ...prev, [activeGroup.id]: true }));
 }
 }
 } catch (err) {
 console.error("Sidebar: failed to load modules", err);
 } finally {
 if (mounted) setLoading(false);
 }
 }
 load();
 return () => { mounted = false; };
 }, []);

 /* Persist sidebar prefs */
 useEffect(() => {
 try {
 localStorage.setItem(SIDEBAR_PREF_KEY, JSON.stringify({ collapsed, expandedGroups }));
 } catch {}
 }, [collapsed, expandedGroups]);

 /* Auto-expand group when active section changes */
 useEffect(() => {
 const activeGroup = groups.find(g =>
 g.modules?.some(m => m.id === activeSection)
 );
 if (activeGroup && !expandedGroups[activeGroup.id]) {
 setExpandedGroups(prev => ({ ...prev, [activeGroup.id]: true }));
 }
 }, [activeSection, groups]);

 const toggleGroup = useCallback((groupId) => {
 setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
 }, []);

 /* Filtered groups/tools matching search */
 const filteredGroups = useMemo(() => {
 const term = search.trim().toLowerCase();
 if (!term) return groups;
 return groups.map(g => ({
 ...g,
 modules: (g.modules || []).filter(m =>
 m.name.toLowerCase().includes(term) ||
 (m.description || "").toLowerCase().includes(term)
 )
 })).filter(g => g.modules.length > 0);
 }, [groups, search]);

 const totalTools = useMemo(() =>
 groups.reduce((sum, g) => sum + (g.modules?.length || 0), 0)
 , [groups]);

 const isToolActive = (toolId) => activeSection === toolId;
 const isGroupActive = (groupId) => {
 const group = groups.find(g => g.id === groupId);
 return group?.modules?.some(m => m.id === activeSection);
 };

 /* Styles */
 const S = {
 sidebar: {
 width: collapsed ? 68 : 272,
 minWidth: collapsed ? 68 : 272,
 maxWidth: collapsed ? 68 : 272,
 height: "100vh",
 position: "sticky",
 top: 0,
 display: "flex",
 flexDirection: "column",
 background: "#ffffff",
 borderRight: "1px solid #e2e8f0",
 transition: "width 0.2s ease, min-width 0.2s ease, max-width 0.2s ease",
 overflow: "hidden",
 zIndex: 50,
 flexShrink: 0,
 },
 brandArea: {
 display: "flex",
 alignItems: "center",
 gap: 10,
 padding: collapsed ? "16px 0": "16px 16px",
 justifyContent: collapsed ? "center": "flex-start",
 borderBottom: "1px solid #e2e8f0",
 minHeight: 64,
 },
 logo: {
 width: 28,
 height: 28,
 borderRadius: 7,
 objectFit: "contain",
 flexShrink: 0,
 },
 brandText: {
 fontSize: 15,
 fontWeight: 800,
 color: "#172033",
 letterSpacing: "0.06em",
 display: collapsed ? "none": "block",
 whiteSpace: "nowrap",
 },
 searchWrap: {
 padding: collapsed ? "8px 8px": "10px 12px",
 display: collapsed ? "none": "block",
 },
 searchInput: {
 width: "100%",
 padding: "8px 10px 8px 32px",
 borderRadius: 8,
 border: "1px solid #d5deea",
 background: "#f8fafc",
 color: "#172033",
 fontSize: 13,
 outline: "none",
 boxSizing: "border-box",
 },
 searchIcon: {
 position: "absolute",
 left: 22,
 top: "50%",
 transform: "translateY(-50%)",
 fontSize: 13,
 color: "#64748b",
 pointerEvents: "none",
 },
 navArea: {
 flex: 1,
 overflowY: "auto",
 overflowX: "hidden",
 padding: collapsed ? "8px 0": "4px 0",
 },
 navItem: (active) => ({
 display: "flex",
 alignItems: "center",
 gap: 10,
 width: "100%",
 padding: collapsed ? "10px 0": "8px 16px",
 justifyContent: collapsed ? "center": "flex-start",
 border: "none",
 borderLeft: active ? "3px solid #2563eb": "3px solid transparent",
 background: active ? "#eff6ff": "transparent",
 color: active ? "#1d4ed8": "#334155",
 fontWeight: active ? 700 : 500,
 fontSize: 13,
 cursor: "pointer",
 transition: "all 0.15s ease",
 textAlign: "left",
 whiteSpace: "nowrap",
 overflow: "hidden",
 textOverflow: "ellipsis",
 borderRadius: 0,
 }),
 navItemIcon: {
 fontSize: 16,
 flexShrink: 0,
 width: 22,
 textAlign: "center",
 },
 navItemLabel: {
 display: collapsed ? "none": "block",
 overflow: "hidden",
 textOverflow: "ellipsis",
 },
 groupHeader: (active, expanded) => ({
 display: "flex",
 alignItems: "center",
 gap: 10,
 width: "100%",
 padding: collapsed ? "10px 0": "9px 16px",
 justifyContent: collapsed ? "center": "flex-start",
 border: "none",
 borderLeft: active ? "3px solid #2563eb": "3px solid transparent",
 background: active ? "#eff6ff": "transparent",
 color: active ? "#1d4ed8": "#334155",
 fontWeight: 700,
 fontSize: 12,
 cursor: "pointer",
 transition: "all 0.15s ease",
 textAlign: "left",
 whiteSpace: "nowrap",
 letterSpacing: "0.03em",
 textTransform: "uppercase",
 borderRadius: 0,
 }),
 groupChevron: (expanded) => ({
 display: collapsed ? "none": "inline-block",
 marginLeft: "auto",
 fontSize: 10,
 color: "#64748b",
 transition: "transform 0.2s ease",
 transform: expanded ? "rotate(90deg)": "rotate(0deg)",
 flexShrink: 0,
 }),
 toolItem: (active, locked) => ({
 display: "flex",
 alignItems: "center",
 gap: 8,
 width: "100%",
 padding: collapsed ? "7px 0": "6px 16px 6px 42px",
 justifyContent: collapsed ? "center": "flex-start",
 border: "none",
 borderLeft: active ? "3px solid #2563eb": "3px solid transparent",
 background: active ? "#eff6ff": "transparent",
 color: active ? "#1d4ed8": "#334155",
 fontWeight: active ? 600 : 400,
 fontSize: 13,
 cursor: locked ? "default": "pointer",
 transition: "all 0.12s ease",
 textAlign: "left",
 whiteSpace: "nowrap",
 overflow: "hidden",
 textOverflow: "ellipsis",
 opacity: 1,
 borderRadius: 0,
 }),
 toolDot: (status) => ({
 width: 5,
 height: 5,
 borderRadius: "50%",
 background: status === "new"? "#22d3ee": status === "beta"? "#f59e0b": "transparent",
 flexShrink: 0,
 }),
 footer: {
 borderTop: "1px solid #e2e8f0",
 padding: collapsed ? "10px 0": "8px 0",
 },
 collapseBtn: {
 display: "flex",
 alignItems: "center",
 justifyContent: "center",
 width: "100%",
 padding: "10px 0",
 border: "none",
 background: "transparent",
 color: "#64748b",
 fontSize: 16,
 cursor: "pointer",
 transition: "color 0.15s",
 },
 badge: (color) => ({
 fontSize: 9,
 fontWeight: 800,
 padding: "1px 5px",
 borderRadius: 4,
 background: color || "#2563eb",
 color: "#fff",
 marginLeft: 6,
 display: collapsed ? "none": "inline",
 flexShrink: 0,
 }),
 toolCount: {
 fontSize: 10,
 color: "#64748b",
 marginLeft: "auto",
 display: collapsed ? "none": "inline",
 flexShrink: 0,
 },
 };

 return (
 <aside style={S.sidebar} aria-label="App navigation">
 {/* Brand */}
 <div style={S.brandArea}>
 <button
 className="sidebar-brand-button"
 type="button"
 onClick={() => setActiveSection("dashboard")}
 aria-label="Go to AURA dashboard"
 style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
 >
 <img src="/logo-aura.png" alt="" style={S.logo} />
 <span className="sidebar-brand-text" style={S.brandText}>AURA</span>
 </button>
 </div>

 {/* Search */}
 <div className="sidebar-search" style={S.searchWrap}>
 <div style={{ position: "relative"}}>
 <FiSearch style={S.searchIcon} aria-hidden="true" />
 <input
 type="text"placeholder="Search tools…"value={search}
 onChange={e => setSearch(e.target.value)}
 style={S.searchInput}
 aria-label="Search tools"/>
 {search && (
 <button
 onClick={() => setSearch("")}
 style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#71717a", fontSize: 14, cursor: "pointer", padding: 0 }}
 aria-label="Clear search">
 ✕
 </button>
 )}
 </div>
 </div>

 {/* Navigation */}
 <nav style={S.navArea}>
 {/* Dashboard */}
 <button
 style={S.navItem(activeSection === "dashboard")}
 onClick={() => setActiveSection("dashboard")}
 title="Dashboard">
 <FiHome style={S.navItemIcon} aria-hidden="true" />
 <span className="sidebar-item-label" style={S.navItemLabel}>Dashboard</span>
 </button>

 {/* All Tools */}
 <button
 style={S.navItem(activeSection === "all-tools")}
 onClick={() => setActiveSection("all-tools")}
 title="All Tools">
 <FiGrid style={S.navItemIcon} aria-hidden="true" />
 <span className="sidebar-item-label" style={S.navItemLabel}>All Tools</span>
 {!collapsed && totalTools > 0 && (
 <span style={S.toolCount}>{totalTools}</span>
 )}
 </button>

 {/* Divider */}
 <div style={{ height: 1, background: "#263244", margin: "8px 12px"}} />

 {/* Loading skeleton */}
 {loading && !collapsed && (
 <div style={{ padding: "12px 16px", color: "#52525b", fontSize: 12 }}>Loading tools…</div>
 )}

 {/* Tool groups */}
 {filteredGroups.map(group => {
 const expanded = Boolean(search.trim()) || expandedGroups[group.id] || false;
 const groupActive = isGroupActive(group.id);
 const GroupIcon = GROUP_ICONS[group.id] || FiBox;
 const toolCount = group.modules?.length || 0;

 return (
 <div key={group.id}>
 <button
 style={S.groupHeader(groupActive, expanded)}
 onClick={() => {
 if (collapsed || window.innerWidth <= 640) {
 // In collapsed mode, clicking group navigates to all-tools
 setActiveSection("all-tools");
 } else {
 toggleGroup(group.id);
 }
 }}
 title={group.title}
 aria-expanded={expanded}
 >
 <GroupIcon style={S.navItemIcon} aria-hidden="true" />
 <span className="sidebar-item-label" style={S.navItemLabel}>{group.title}</span>
 {!collapsed && (
 <span style={S.toolCount}>{toolCount}</span>
 )}
 <span style={S.groupChevron(expanded)}>{"\u25B6"}</span>
 </button>
 {/* Expanded tool list */}
 {expanded && !collapsed && (
 <div>
 {(group.modules || []).sort((a, b) => a.name.localeCompare(b.name)).map(tool => {
 const active = isToolActive(tool.id);
 const locked = !canUseTool(plan, tool.id);
 return (
 <button
 key={tool.id}
 style={S.toolItem(active, locked)}
 onClick={() => {
 if (locked) {
 setActiveSection("settings");
 } else {
 setActiveSection(tool.id);
 }
 }}
 title={locked ? `${tool.name} (${PLAN_LABEL[requiredPlanFor(tool.id)] || "Upgrade"} plan required)` : tool.name}
 >
 {tool.status && <span style={S.toolDot(tool.status)} />}
 <span className="sidebar-tool-label" style={{ overflow: "hidden", textOverflow: "ellipsis"}}>{tool.name}</span>
 {locked && <span style={S.badge(PLAN_COLOUR[requiredPlanFor(tool.id)] || PLAN_COLOUR.pro)}>{(PLAN_LABEL[requiredPlanFor(tool.id)] || "PRO").toUpperCase()}</span>}
 </button>
 );
 })}
 </div>
 )}
 </div>
 );
 })}

 {/* No results */}
 {search && filteredGroups.length === 0 && !loading && (
 <div style={{ padding: "16px", color: "#52525b", fontSize: 12, textAlign: "center"}}>
 No tools matching {"\u201C"}{search}{"\u201D"}
 </div>
 )}
 </nav>

 {/* Footer */}
 <div style={S.footer}>
 <button
 style={S.navItem(activeSection === "help")}
 onClick={() => setActiveSection("help")}
 title="Help & support">
 <FiHelpCircle style={S.navItemIcon} aria-hidden="true" />
 <span className="sidebar-item-label" style={S.navItemLabel}>Help &amp; Support</span>
 </button>

 {/* Settings */}
 <button
 style={S.navItem(activeSection === "settings")}
 onClick={() => setActiveSection("settings")}
 title="Settings">
 <FiSettings style={S.navItemIcon} aria-hidden="true" />
 <span className="sidebar-item-label" style={S.navItemLabel}>Settings</span>
 </button>

 {/* Collapse toggle */}
 <button
 style={S.collapseBtn}
 onClick={() => setCollapsed(v => !v)}
 title={collapsed ? "Expand sidebar": "Collapse sidebar"}
 aria-label={collapsed ? "Expand sidebar": "Collapse sidebar"}
 >
 {collapsed ? "\u276F": "\u276E"}
 </button>
 </div>
 </aside>
 );
}
