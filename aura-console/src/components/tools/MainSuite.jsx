import React, { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../api";
import Toast from "../Toast";

export default function MainSuite() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeGroup, setActiveGroup] = useState(null);

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
      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          background: "#0b1220",
          border: "1px solid #1f2535",
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
                border: "1px solid " + (isActive ? "#3b82f6" : "#1f2937"),
                background: isActive ? "#111827" : "#0f172a",
                color: isActive ? "#e5e7eb" : "#9ca3af",
                fontWeight: 700,
                boxShadow: isActive ? "0 6px 16px rgba(59,130,246,0.28)" : "none",
                cursor: "pointer",
              }}
              aria-pressed={isActive}
            >
              {group.title}
              <span style={{ marginLeft: 8, fontSize: 12, color: isActive ? "#93c5fd" : "#6b7280" }}>
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
            background: "#111827",
            border: "1px solid #233047",
            borderRadius: 16,
            padding: 18,
            boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#7fffd4" }}>{active.title}</div>
              <div style={{ color: "#c7d2fe", fontSize: 14 }}>{active.summary}</div>
            </div>
            <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 700 }}>{active.modules?.length || 0} modules</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {(active.modules || []).map((m) => (
              <div
                key={m.id}
                style={{
                  background: "#0b1220",
                  border: "1px solid #1f2937",
                  borderRadius: 12,
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  minHeight: 120,
                }}
              >
                <div style={{ fontWeight: 700, color: "#e5e7eb" }}>{m.name}</div>
                <div style={{ color: "#9ca3af", fontSize: 13 }}>{m.description}</div>
                <div style={{ marginTop: "auto", color: "#60a5fa", fontSize: 12, fontWeight: 700 }}>
                  Tool ID: {m.id}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
