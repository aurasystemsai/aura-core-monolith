import React, { useState, useEffect, useCallback } from "react";
import { apiFetchJSON } from "../../api";

const API = "/api/ai-segmentation-engine";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  h1: { fontSize: 26, fontWeight: 800, margin: "0 0 4px" },
  sub: { color: "#71717a", fontSize: 14, margin: "0 0 24px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 },
  segCard: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "18px 20px", cursor: "pointer" },
  segName: { fontWeight: 700, fontSize: 15, marginBottom: 6 },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, background: c === "high" ? "#052e16" : c === "medium" ? "#1c1917" : "#27272a", color: c === "high" ? "#4ade80" : c === "medium" ? "#fbbf24" : "#a1a1aa" }),
  stat: { fontSize: 12, color: "#71717a", marginTop: 4 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer" }),
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "10px 16px", outline: "none" },
  row: { display: "flex", gap: 10, alignItems: "center", marginBottom: 12 },
  label: { fontSize: 12, color: "#71717a", marginBottom: 6 },
  err: { background: "#3f1315", border: "1px solid #7f1d1d", borderRadius: 8, padding: "12px 16px", color: "#fca5a5", fontSize: 13, marginBottom: 12 },
  tabRow: { display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #27272a", paddingBottom: 12 },
  tab: (a) => ({ background: a ? "#4f46e5" : "transparent", color: a ? "#fafafa" : "#71717a", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" }),
  insightBox: { background: "#0c0c0e", border: "1px solid #27272a", borderRadius: 10, padding: "14px 16px", marginTop: 12 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
};

const TABS = [
  { id: "segments", label: "Segments" },
  { id: "builder", label: "AI Builder" },
  { id: "attributes", label: "Attributes" },
];

export default function AiSegmentationEngine() {
  const [tab, setTab] = useState("segments");
  const [segments, setSegments] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buildLoading, setBuildLoading] = useState(false);
  const [desc, setDesc] = useState("");
  const [built, setBuilt] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const [s, a] = await Promise.all([
        apiFetchJSON(`${API}/segments`),
        apiFetchJSON(`${API}/attributes`),
      ]);
      setSegments(s.segments || []);
      setAttributes(a.attributes || []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadInsights = useCallback(async (id) => {
    try {
      const r = await apiFetchJSON(`${API}/segments/${id}/insights`);
      setInsights(r.insights || r);
    } catch {}
  }, []);

  const selectSegment = (seg) => {
    setSelected(seg);
    setInsights(null);
    loadInsights(seg.id);
  };

  const buildSegment = async () => {
    if (!desc.trim()) return;
    setBuildLoading(true);
    setErr(null);
    try {
      const r = await apiFetchJSON(`${API}/segments/build`, { method: "POST", body: JSON.stringify({ description: desc }) });
      setBuilt(r.segment || r);
    } catch (e) { setErr(e.message); }
    finally { setBuildLoading(false); }
  };

  return (
    <div style={S.page}>
      <h1 style={S.h1}>AI Segmentation Engine</h1>
      <p style={S.sub}>Build dynamic customer segments with ML attributes, churn risk scoring and actionable insights.</p>

      {err && <div style={S.err}>{err}</div>}

      <div style={S.tabRow}>
        {TABS.map(t => <button key={t.id} style={S.tab(tab === t.id)} onClick={() => setTab(t.id)}>{t.label}</button>)}
        <button style={{ ...S.btn(""), marginLeft: "auto", fontSize: 12, padding: "6px 14px" }} onClick={load}>↻ Refresh</button>
      </div>

      {tab === "segments" && (
        <>
          <div style={S.grid}>
            {loading && <p style={{ color: "#71717a" }}>Loading segments…</p>}
            {segments.map(seg => (
              <div key={seg.id} style={{ ...S.segCard, border: selected?.id === seg.id ? "1px solid #4f46e5" : "1px solid #27272a" }} onClick={() => selectSegment(seg)}>
                <div style={S.segName}>{seg.name}</div>
                <div style={S.stat}>{seg.size?.toLocaleString() || seg.customers?.toLocaleString()} customers</div>
                <div style={{ marginTop: 8 }}>
                  {seg.churnRisk && <span style={S.badge(seg.churnRisk)}>Churn: {seg.churnRisk}</span>}
                  {seg.avgLtv && <span style={{ ...S.badge(""), marginLeft: 6 }}>LTV £{seg.avgLtv}</span>}
                </div>
                <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 8 }}>{seg.description}</div>
              </div>
            ))}
          </div>

          {selected && (
            <div style={{ ...S.card, marginTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{selected.name} — Insights</div>
              {!insights && <p style={{ color: "#71717a", fontSize: 13 }}>Loading insights…</p>}
              {insights && (
                <div style={S.insightBox}>
                  <div style={S.sectionTitle}>Recommended Actions</div>
                  {(insights.recommendations || insights.actions || []).map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: "#4f46e5", fontWeight: 700 }}>→</span>
                      <span style={{ fontSize: 13, color: "#e4e4e7" }}>{typeof r === "string" ? r : r.action || r.recommendation}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === "builder" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Describe your segment</div>
          <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>Describe the customer group you want to target in plain English. AI will build the segment definition and estimate its size.</p>
          <div style={S.row}>
            <input style={S.input} value={desc} onChange={e => setDesc(e.target.value)} placeholder="e.g. High-value customers who haven't purchased in 60+ days with LTV > £300" />
            <button style={S.btn("primary")} onClick={buildSegment} disabled={buildLoading}>
              {buildLoading ? "Building…" : "Build Segment"}
            </button>
          </div>
          {built && (
            <div style={S.insightBox}>
              <div style={S.sectionTitle}>Generated Segment</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{built.name}</div>
              <div style={{ fontSize: 13, color: "#a1a1aa", marginBottom: 8 }}>{built.description}</div>
              <div style={{ display: "flex", gap: 20 }}>
                <div><div style={S.label}>Estimated Size</div><div style={{ fontWeight: 700 }}>{(built.estimatedSize || built.size || "~").toLocaleString()}</div></div>
                {built.churnRisk && <div><div style={S.label}>Churn Risk</div><span style={S.badge(built.churnRisk)}>{built.churnRisk}</span></div>}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "attributes" && (
        <div style={S.card}>
          <div style={S.sectionTitle}>Available Segment Attributes</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 10 }}>
            {attributes.map((a, i) => (
              <div key={i} style={{ background: "#0c0c0e", border: "1px solid #27272a", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{a.name || a.field}</div>
                <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>{a.type} · operators: {(a.operators || []).join(", ")}</div>
                {a.description && <div style={{ fontSize: 12, color: "#a1a1aa", marginTop: 4 }}>{a.description}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
