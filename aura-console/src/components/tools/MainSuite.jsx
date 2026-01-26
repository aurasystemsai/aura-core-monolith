import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api";
import Toast from "../Toast";

export default function MainSuite({ setActiveSection }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);
  const [filter, setFilter] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

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
          setModules(groups);
          setActiveGroup(groups[0]?.id || null);
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

  const active = useMemo(
    () => modules.find((g) => g.id === activeGroup) || modules[0],
    [modules, activeGroup]
  );

  const palette = darkMode
    ? {
        bg: "#111827",
        card: "#0b1220",
        border: "#233047",
        text: "#e5e7eb",
        muted: "#9ca3af",
        accent: "#7fffd4",
        primary: "#3b82f6",
      }
    : {
        bg: "#f8fafc",
        card: "#ffffff",
        border: "#dbeafe",
        text: "#0f172a",
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
            background: darkMode ? "#0f172a" : "#fff",
            color: palette.text,
          }}
        />
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
            {(filteredModules || []).map((m) => (
              <div
                key={m.id}
                style={{
                  background: palette.card,
                  border: `1px solid ${palette.border}`,
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  minHeight: 120,
                  cursor: setActiveSection ? "pointer" : "default",
                  transition: "transform 160ms ease, box-shadow 160ms ease",
                }}
                onClick={() => setActiveSection && setActiveSection(m.id)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && setActiveSection) setActiveSection(m.id);
                }}
                tabIndex={0}
              >
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
                }}
              >
                <div style={{ color: palette.muted, fontSize: 13 }}>{m.description}</div>
                <div style={{ marginTop: "auto", color: palette.primary, fontSize: 12, fontWeight: 700 }}>
                  Tool ID: {m.id}
                </div>
                {m.docUrl && (
                  <a
                    href={m.docUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ marginTop: 6, color: palette.accent, fontSize: 12, fontWeight: 700 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Docs ↗
                  </a>
                )}
              </div>
            ))}
          </div>
          )}
        </div>
      )}
    </div>
  );
}
