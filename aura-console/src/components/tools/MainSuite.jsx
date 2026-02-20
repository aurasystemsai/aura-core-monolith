﻿import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api";
import Toast from "../Toast";
import usePlan, { canUseTool, requiredPlanFor, PLAN_LABEL, PLAN_PRICE, PLAN_COLOUR } from "../../hooks/usePlan";

const PREF_KEY = "main-suite-prefs";

export default function MainSuite({ setActiveSection }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [sortKey, setSortKey] = useState("az");
  const [preflightStatuses, setPreflightStatuses] = useState({});
  const { plan, planLoading } = usePlan();

  const STATUS_KEYS = {
    "visual-workflow-builder": "suite:status:visual-workflow-builder",
    "workflow-orchestrator": "suite:status:workflow-orchestrator",
    "workflow-automation-builder": "suite:status:workflow-automation-builder",
    "conditional-logic-automation": "suite:status:conditional-logic-automation",
    "webhook-api-triggers": "suite:status:webhook-api-triggers",
  };

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const resp = await apiFetch("/api/main-suite/modules");
        const data = await resp.json();
        if (!data.ok && !data.modules) {
          throw new Error(data.error || "Failed to load suite modules");
        }
        const groups = data.modules || [];
        if (mounted) {
          const stored = (() => {
            try { return JSON.parse(localStorage.getItem(PREF_KEY) || "{}"); } catch { return {}; }
          })();
          setModules(groups);
          setActiveGroup(stored.activeGroup || groups[0]?.id || null);
          setDarkMode(stored.darkMode ?? true);
          setSortKey(stored.sortKey || "az");
          setError(null);
        }
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load suite modules");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const hydrate = () => {
      const next = {};
      Object.entries(STATUS_KEYS).forEach(([id, key]) => {
        try {
          const val = JSON.parse(localStorage.getItem(key) || "null");
          if (val) next[id] = val;
        } catch (_) {}
      });
      setPreflightStatuses(next);
    };
    hydrate();
    const handler = () => hydrate();
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const active = useMemo(
    () => modules.find((g) => g.id === activeGroup) || modules[0],
    [modules, activeGroup]
  );

  const palette = darkMode
    ? {
        bg: "#18181b",
        card: "#18181b",
        border: "#18181b",
        text: "#fafafa",
        muted: "#a1a1aa",
        accent: "#818cf8",
        primary: "#3b82f6",
      }
    : {
        bg: "#f8fafc",
        card: "#ffffff",
        border: "#dbeafe",
        text: "#18181b",
        muted: "#475569",
        accent: "#0ea5e9",
        primary: "#2563eb",
      };

  const filteredModules = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term || !active) return active?.modules || [];
    return (active.modules || []).filter(
      (m) =>
        m.name.toLowerCase().includes(term) ||
        (m.description || "").toLowerCase().includes(term)
    );
  }, [active, filter]);

  const sortedModules = useMemo(() => {
    const list = [...filteredModules];
    switch (sortKey) {
      case "status":
        return list.sort((a, b) => ((b.status === "new") - (a.status === "new")) || ((b.status === "beta") - (a.status === "beta")) || a.name.localeCompare(b.name));
      case "az":
      default:
        return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [filteredModules, sortKey]);

  useEffect(() => {
    const prefs = { darkMode, activeGroup, sortKey };
    try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (_) {}
  }, [darkMode, activeGroup, sortKey]);

  if (loading) {
    return <div style={{ color: "#fff", padding: 16 }}>Loading Main Suite…</div>;
  }

  if (error) {
    return (
      <div style={{ padding: 16 }}>
        <Toast message={error} type="error" onClose={() => setError(null)} />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Top controls: theme, search, feedback */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <button
          onClick={() => setDarkMode((v) => !v)}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px solid ${palette.border}`,
            background: palette.card,
            color: palette.text,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {darkMode ? "Dark Mode" : "Light Mode"}
        </button>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          style={{
            padding: "8px 10px",
            borderRadius: 10,
            border: `1px solid ${palette.border}`,
            background: palette.card,
            color: palette.text,
            fontWeight: 700,
          }}
        >
          <option value="az">Sort: A → Z</option>
          <option value="status">Sort: New/Beta first</option>
        </select>
        <input
          type="search"
          placeholder="Search modules..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            flex: "1 1 260px",
            minWidth: 220,
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${palette.border}`,
            background: darkMode ? "#18181b" : "#fff",
            color: palette.text,
          }}
        />
        {filter && (
          <button
            onClick={() => setFilter("")}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${palette.border}`,
              background: palette.card,
              color: palette.text,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
        <button
          onClick={() => window.open("mailto:team@aurasystems.ai?subject=Main%20Suite%20Feedback", "_self")}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px solid ${palette.primary}`,
            background: palette.primary,
            color: "#fff",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Feedback / Suggest module
        </button>
        {setActiveSection && (
          <button
            onClick={() => setActiveSection("all-tools")}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: `1px solid ${palette.border}`,
              background: palette.card,
              color: palette.text,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Browse All Tools
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          background: palette.card,
          border: `1px solid ${palette.border}`,
          borderRadius: 14,
          padding: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.24)",
        }}
      >
        {modules.map((group) => {
          const isActive = group.id === active?.id;
          return (
            <button
              key={group.id}
              onClick={() => setActiveGroup(group.id)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid " + (isActive ? palette.primary : palette.border),
                background: isActive ? palette.bg : palette.card,
                color: isActive ? palette.text : palette.muted,
                fontWeight: 700,
                boxShadow: isActive ? `0 6px 16px ${darkMode ? "rgba(59,130,246,0.28)" : "rgba(37,99,235,0.24)"}` : "none",
                cursor: "pointer",
                transition: "all 200ms ease",
              }}
              aria-pressed={isActive}
            >
              {group.title}
              <span style={{ marginLeft: 8, fontSize: 12, color: isActive ? palette.muted : palette.muted }}>
                {group.modules?.length || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active group content */}
      {active && (
        <div
          style={{
            background: palette.bg,
            border: `1px solid ${palette.border}`,
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: palette.accent }}>{active.title}</div>
              <div style={{ color: palette.muted, fontSize: 14 }}>{active.summary}</div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: palette.muted, fontWeight: 700 }}>{filteredModules.length}/{active.modules?.length || 0} modules</span>
              <button
                onClick={() => setCollapsed((v) => !v)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 10,
                  border: `1px solid ${palette.border}`,
                  background: palette.card,
                  color: palette.text,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {collapsed ? "Expand" : "Collapse"}
              </button>
            </div>
          </div>
          {!collapsed && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, transition: "opacity 200ms ease", opacity: collapsed ? 0 : 1 }}>
            {(sortedModules || []).map((m) => {
              const locked = !planLoading && !canUseTool(plan, m.id);
              const reqPlan = requiredPlanFor(m.id);
              return (
              <div
                key={m.id}
                style={{
                  background: palette.card,
                  border: `1px solid ${locked ? "#52525b" : palette.border}`,
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  minHeight: 120,
                  cursor: "pointer",
                  transition: "transform 160ms ease, box-shadow 160ms ease",
                  position: "relative",
                  opacity: locked ? 0.75 : 1,
                }}
                onClick={() => {
                  if (locked) { setActiveSection && setActiveSection("settings"); return; }
                  setActiveSection && setActiveSection(m.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (locked) { setActiveSection && setActiveSection("settings"); return; }
                    setActiveSection && setActiveSection(m.id);
                  }
                }}
                tabIndex={0}
              >
                {locked && (
                  <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: "rgba(10,16,28,0.85)", backdropFilter: "blur(2px)", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5, padding: 10, textAlign: "center" }}>
                    <span style={{ fontSize: 24 }}></span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: PLAN_COLOUR[reqPlan] }}>{PLAN_LABEL[reqPlan]} Plan required</span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>from {PLAN_PRICE[reqPlan]}</span>
                    <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 700 }}>Upgrade Plan →</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 700, color: palette.text }}>{m.name}</div>
                  {m.status && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: palette.text,
                      background: m.status === "beta" ? "#f59e0b" : "#10b981",
                      padding: "2px 8px",
                      borderRadius: 999,
                    }}>
                      {m.status.toUpperCase()}
                    </span>
                  )}
                </div>
                {preflightStatuses[m.id] && (
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 8px", borderRadius: 999, border: `1px solid ${palette.border}`, background: preflightStatuses[m.id].ok ? (darkMode ? "#18181b" : "#e0f2fe") : "#332b17", color: preflightStatuses[m.id].ok ? "#22c55e" : preflightStatuses[m.id].issues ? "#f59e0b" : "#ef4444", fontWeight: 800, fontSize: 11 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: preflightStatuses[m.id].ok ? "#22c55e" : preflightStatuses[m.id].issues ? "#f59e0b" : "#ef4444" }} />
                    <span>{preflightStatuses[m.id].ok ? "Pass" : `${preflightStatuses[m.id].issues} issue${preflightStatuses[m.id].issues === 1 ? "" : "s"}`}</span>
                    {preflightStatuses[m.id].ts ? <span style={{ color: palette.muted, fontWeight: 600 }}>· {new Date(preflightStatuses[m.id].ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span> : null}
                  </div>
                )}
                <div style={{ color: palette.muted, fontSize: 13 }}>{m.description}</div>
                <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
                  <span style={{ color: palette.primary, fontSize: 12, fontWeight: 800 }}>Launch →</span>
                  {m.docUrl && (
                    <a
                      href={m.docUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: palette.accent, fontSize: 12, fontWeight: 700 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      Docs ↗
                    </a>
                  )}
                </div>
              </div>
            );
            })}
          </div>
          )}
        </div>
      )}
    </div>
  );
}



