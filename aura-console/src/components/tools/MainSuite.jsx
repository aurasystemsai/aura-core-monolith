import React, { useEffect, useState } from "react";
import { apiFetch } from "../../api";
import Toast from "../Toast";

export default function MainSuite() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const resp = await apiFetch("/api/main-suite/modules");
        const data = await resp.json();
        if (!data.ok && !data.modules) {
          throw new Error(data.error || "Failed to load suite modules");
        }
        if (mounted) {
          setModules(data.modules || []);
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
      {modules.map((group) => (
        <div
          key={group.id}
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
              <div style={{ fontWeight: 800, fontSize: 18, color: "#7fffd4" }}>{group.title}</div>
              <div style={{ color: "#c7d2fe", fontSize: 14 }}>{group.summary}</div>
            </div>
            <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 700 }}>{group.modules?.length || 0} modules</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {(group.modules || []).map((m) => (
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
      ))}
    </div>
  );
}
