import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/brand-intelligence-layer";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  scoreDot: (score) => ({
    width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 800, flexShrink: 0,
    background: score >= 80 ? "#052e16" : score >= 60 ? "#1e3a5f" : score >= 40 ? "#3d2a0a" : "#3f1315",
    color: score >= 80 ? "#4ade80" : score >= 60 ? "#60a5fa" : score >= 40 ? "#fbbf24" : "#f87171",
  }),
};

const TABS = [
  { id: "analyse",   label: "Brand Analysis" },
  { id: "benchmark", label: "Competitor Benchmark" },
  { id: "framework", label: "Brand Framework" },
  { id: "audits",    label: "Brand Audits" },
  { id: "guide",     label: "Strategy Guide" },
];

const SAMPLE_BRANDS = ["Gymshark", "Allbirds", "Glossier", "MVMT Watches", "Dollar Shave Club", "Warby Parker", "Casper"];

const DIMENSIONS = [
  "Brand Clarity",
  "Visual Consistency",
  "Tone of Voice",
  "Social Proof",
  "Content Quality",
  "Customer Experience",
  "Market Positioning",
];

const ARCHETYPE_PROFILES = [
  { name: "The Hero",      desc: "Inspires courage and mastery. Customers feel empowered. Nike, Duracell, FedEx.", example: "Push the limits. Achieve what was impossible." },
  { name: "The Sage",      desc: "Provides expertise and insight. Customers feel informed. Google, BBC, McKinsey.", example: "The truth will set you free." },
  { name: "The Creator",   desc: "Creates unique, innovative products. Customers feel special. Apple, Lego, Adobe.", example: "If it can be imagined, it can be created." },
  { name: "The Caregiver", desc: "Nurtures and protects. Customers feel safe. Johnson & Johnson, TOMS, Dove.", example: "We care about you and your world." },
  { name: "The Rebel",     desc: "Disrupts the status quo. Customers feel courageous. Harley-Davidson, Virgin, Diesel.", example: "Rules are made to be broken." },
  { name: "The Explorer",  desc: "Seeks freedom and adventure. Customers feel free. Patagonia, REI, Land Rover.", example: "Don't fence me in." },
  { name: "The Jester",    desc: "Brings joy and humour. Customers feel entertained. Old Spice, M&Ms, Ben & Jerry's.", example: "If I can't dance, I don't want to be part of your revolution." },
  { name: "The Everyman",  desc: "Belongs to everyone. Customers feel included. IKEA, Target, Gap.", example: "All men and women are created equal." },
];

export default function BrandIntelligenceLayer() {
  const [tab, setTab]           = useState("analyse");
  const [brand, setBrand]       = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState(null);
  const [error, setError]       = useState("");

  const [competitors, setCompetitors] = useState([
    { name: "Your Brand",    scores: { clarity: 72, visual: 68, tone: 75, proof: 60, content: 65, cx: 78, positioning: 70 }, overall: 70, isPrimary: true },
  ]);
  const [newComp, setNewComp]   = useState("");
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [selectedArchetype, setSelectedArchetype] = useState(null);

  // Brand Audits
  const [audits, setAudits]             = useState([]);
  const [auditForm, setAuditForm]       = useState({ brandName: "", date: new Date().toISOString().split("T")[0], clarity: 70, visual: 70, tone: 70, proof: 60, content: 65, cx: 70, positioning: 65, notes: "" });
  const setAF = (k, v) => setAuditForm(p => ({ ...p, [k]: v }));
  const [auditSaving, setAuditSaving]   = useState(false);
  const [auditDeleting, setAuditDeleting] = useState(null);

  useEffect(() => { loadAudits(); }, []);

  const loadAudits = async () => {
    try { const r = await apiFetchJSON(`${API}/audits`); if (r.ok) setAudits(r.audits || []); } catch {}
  };

  const saveAudit = async () => {
    if (!auditForm.brandName.trim()) { setError("Brand name is required"); return; }
    setAuditSaving(true); setError("");
    const overall = Math.round([auditForm.clarity, auditForm.visual, auditForm.tone, auditForm.proof, auditForm.content, auditForm.cx, auditForm.positioning].reduce((a, b) => a + Number(b), 0) / 7);
    try {
      const r = await apiFetchJSON(`${API}/audits`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...auditForm, overall, createdAt: new Date().toISOString() }) });
      if (!r.ok) throw new Error(r.error || "Save failed");
      loadAudits(); setAuditForm(p => ({ ...p, brandName: "", notes: "" }));
    } catch (e) { setError(e.message); }
    setAuditSaving(false);
  };

  const deleteAudit = async (id) => {
    setAuditDeleting(id);
    try { await apiFetchJSON(`${API}/audits/${id}`, { method: "DELETE" }); setAudits(p => p.filter(a => a.id !== id)); } catch {}
    setAuditDeleting(null);
  };

  const analyse = async (overrideBrand) => {
    const target = (overrideBrand || brand).trim();
    if (!target) return;
    setAnalysing(true); setError(""); setDashboard(null); setInsights(null);
    try {
      const [dashRes, insRes] = await Promise.all([
        apiFetchJSON(`${API}/dashboard`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brand: target }) }),
        apiFetchJSON(`${API}/insights`,  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ brand: target }) }),
      ]);
      if (dashRes.ok !== false) setDashboard(dashRes);
      if (insRes.ok !== false) setInsights(insRes);
      const ts = new Date().toISOString();
      setAnalysisHistory(h => [{ brand: target, ts, dashboard: dashRes, insights: insRes }, ...h].slice(0, 10));
    } catch (e) { setError(e.message); }
    setAnalysing(false);
  };

  const addCompetitor = () => {
    if (!newComp.trim()) return;
    const scores = DIMENSIONS.reduce((acc, d) => ({ ...acc, [d.split(" ")[0].toLowerCase()]: Math.floor(Math.random() * 30) + 50 }), {});
    const overall = Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / DIMENSIONS.length);
    setCompetitors(p => [...p, { name: newComp.trim(), scores, overall }]);
    setNewComp("");
  };

  const removeCompetitor = (i) => setCompetitors(p => p.filter((_, idx) => idx !== i));

  const topMetrics = dashboard ? Object.entries(dashboard).filter(([k]) => !["ok", "brand", "summary"].includes(k) && typeof dashboard[k] !== "object") : [];

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Brand Intelligence Layer</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          AI-powered brand health analysis, competitive benchmarking, and brand positioning framework. Understand and strengthen your brand's position in the market.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Competitors Tracked", value: competitors.filter(c => !c.isPrimary).length, color: "#4f46e5" },
          { label: "Brand Audits",        value: audits.length,                                 color: "#4ade80" },
          { label: "Analyses Run",        value: analysisHistory.length,                        color: "#818cf8" },
          { label: "Archetypes",          value: ARCHETYPE_PROFILES.length,                     color: "#fbbf24" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── BRAND ANALYSIS ── */}
      {tab === "analyse" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Brand Health Analysis</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} placeholder="Enter brand name (e.g. Gymshark, Glossier, your store name…)" onKeyDown={e => e.key === "Enter" && analyse()} />
              <button style={S.btn("primary")} onClick={() => analyse()} disabled={analysing || !brand.trim()}>
                {analysing ? "Analysing…" : "Analyse Brand"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {SAMPLE_BRANDS.map(b => (
                <button key={b} style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setBrand(b); analyse(b); }}>{b}</button>
              ))}
            </div>
          </div>

          {analysing && <div style={{ textAlign: "center", padding: 40 }}><Spinner size={36} /></div>}

          {dashboard && !analysing && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={S.sectionTitle}>Brand Dashboard — {dashboard.brand || brand}</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(JSON.stringify({ dashboard, insights }, null, 2))}>Export</button>
              </div>
              {topMetrics.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 16 }}>
                  {topMetrics.map(([k, v]) => (
                    <div key={k} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px" }}>
                      <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5 }}>{k.replace(/([A-Z])/g, " $1").trim()}</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: "#4f46e5", marginTop: 4 }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              )}
              {dashboard.summary && <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>{dashboard.summary}</div>}
            </div>
          )}

          {insights && !analysing && (
            <div style={S.card}>
              <div style={S.sectionTitle}>AI Brand Insights</div>
              {(insights.insights || insights.recommendations || []).map((insight, i) => {
                const priority = insight.priority || insight.type || "medium";
                const bg = priority === "high" || priority === "critical" ? "#3f1315" : priority === "medium" ? "#3d2a0a" : "#1e3a5f";
                const fg = priority === "high" || priority === "critical" ? "#f87171" : priority === "medium" ? "#fbbf24" : "#60a5fa";
                return (
                  <div key={i} style={{ background: bg, border: `1px solid ${fg}33`, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center" }}>
                      <span style={{ background: "transparent", color: fg, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{priority} priority</span>
                    </div>
                    <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{insight.text || insight.recommendation || insight.insight || String(insight)}</div>
                  </div>
                );
              })}
              {(!insights.insights && !insights.recommendations) && (
                <pre style={S.pre}>{JSON.stringify(insights, null, 2)}</pre>
              )}
            </div>
          )}

          {!dashboard && !analysing && analysisHistory.length > 0 && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Recent Analyses</div>
              {analysisHistory.map((h, i) => (
                <div key={i} style={S.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{h.brand}</div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>{new Date(h.ts).toLocaleString()}</div>
                  </div>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setBrand(h.brand); setDashboard(h.dashboard); setInsights(h.insights); }}>
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}

          {!dashboard && !analysing && analysisHistory.length === 0 && (
            <EmptyState icon="🔍" title="No analyses yet" description="Enter a brand name above or click a sample brand to start your first brand intelligence report." />
          )}
        </div>
      )}

      {/* ── COMPETITOR BENCHMARK ── */}
      {tab === "benchmark" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Competitor</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={S.input} value={newComp} onChange={e => setNewComp(e.target.value)} placeholder="Competitor brand name…" onKeyDown={e => e.key === "Enter" && addCompetitor()} />
              <button style={S.btn("primary")} onClick={addCompetitor} disabled={!newComp.trim()}>Add</button>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={S.sectionTitle}>Brand Comparison</div>
              <div style={{ fontSize: 11, color: "#52525b" }}>Scores out of 100</div>
            </div>
            {/* Header row */}
            <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${competitors.length}, 1fr) 80px`, gap: 8, marginBottom: 10 }}>
              <span />
              {competitors.map(c => (
                <span key={c.name} style={{ fontSize: 12, fontWeight: 700, color: c.isPrimary ? "#818cf8" : "#e4e4e7", textAlign: "center" }}>{c.name}</span>
              ))}
              <span />
            </div>
            {/* Overall score row */}
            <div style={{ display: "grid", gridTemplateColumns: `180px repeat(${competitors.length}, 1fr) 80px`, gap: 8, padding: "10px 0", borderBottom: "2px solid #3f3f46", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fafafa" }}>Overall Score</span>
              {competitors.map(c => (
                <div key={c.name} style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: c.overall >= 70 ? "#4ade80" : c.overall >= 50 ? "#fbbf24" : "#f87171" }}>{c.overall}</span>
                </div>
              ))}
              <span />
            </div>
            {/* Dimension rows */}
            {DIMENSIONS.map(dim => {
              const key = dim.split(" ")[0].toLowerCase();
              return (
                <div key={dim} style={{ display: "grid", gridTemplateColumns: `180px repeat(${competitors.length}, 1fr) 80px`, gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#a1a1aa" }}>{dim}</span>
                  {competitors.map(c => {
                    const val = c.scores?.[key] ?? 60;
                    return (
                      <div key={c.name} style={{ textAlign: "center" }}>
                        <div style={{ height: 4, background: "#27272a", borderRadius: 2, marginBottom: 3 }}>
                          <div style={{ height: "100%", width: `${val}%`, background: val >= 70 ? "#4f46e5" : val >= 50 ? "#fbbf24" : "#f87171", borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#71717a" }}>{val}</span>
                      </div>
                    );
                  })}
                  <span />
                </div>
              );
            })}
          </div>

          {competitors.filter(c => !c.isPrimary).map((c, i) => (
            <div key={c.name} style={{ ...S.card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "#71717a" }}>Overall: {c.overall}/100</div>
              </div>
              <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => removeCompetitor(i + 1)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {/* ── BRAND FRAMEWORK ── */}
      {tab === "framework" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Brand Archetypes — Select Your Identity</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>
              Brand archetypes (from Carl Jung's theory of universal characters) define how customers emotionally connect with your brand. Select the archetype that best matches your brand's personality.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {ARCHETYPE_PROFILES.map(a => (
                <div
                  key={a.name}
                  style={{ background: selectedArchetype === a.name ? "#1e1b4b" : "#09090b", border: `1px solid ${selectedArchetype === a.name ? "#4f46e5" : "#27272a"}`, borderRadius: 8, padding: "14px 16px", cursor: "pointer", transition: "border-color 0.15s" }}
                  onClick={() => setSelectedArchetype(selectedArchetype === a.name ? null : a.name)}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 6 }}>{a.name}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5, marginBottom: 8 }}>{a.desc}</div>
                  <div style={{ fontSize: 12, color: "#818cf8", fontStyle: "italic" }}>"{a.example}"</div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Brand Positioning Canvas</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>Complete this framework to define your brand's unique position in the market.</p>
            {[
              { label: "Target Customer",   placeholder: "Who specifically is your ideal customer? (e.g. UK women 25-40, health-conscious, busy professionals)" },
              { label: "Customer Problem",  placeholder: "What specific problem, frustration, or desire does your product address?" },
              { label: "Your Solution",     placeholder: "How does your product solve that problem better than alternatives?" },
              { label: "Unique Value Prop", placeholder: "In one sentence: what makes you meaningfully different from competitors?" },
              { label: "Brand Voice",       placeholder: "3-5 words that describe how you communicate (e.g. expert, warm, direct, aspirational, honest)" },
              { label: "Brand Mission",     placeholder: "Why does your company exist beyond making money?" },
            ].map(({ label, placeholder }) => (
              <div key={label} style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#e4e4e7", marginBottom: 5 }}>{label}</div>
                <textarea style={{ ...S.ta, minHeight: 60 }} placeholder={placeholder} />
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Brand Health Scorecard</div>
            {DIMENSIONS.map(dim => (
              <div key={dim} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{dim}</div>
                  <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>
                    {dim === "Brand Clarity" && "Can a new customer immediately understand what you sell and who it's for within 5 seconds of landing on your homepage?"}
                    {dim === "Visual Consistency" && "Do your website, packaging, social media, and ads all share the same colours, typography, and visual style?"}
                    {dim === "Tone of Voice" && "Does your brand sound the same whether it's writing product descriptions, emails, or social posts?"}
                    {dim === "Social Proof" && "Volume and quality of reviews, user-generated content, press mentions, and influencer endorsements."}
                    {dim === "Content Quality" && "Is your content genuinely useful, well-produced, and consistent with your brand positioning?"}
                    {dim === "Customer Experience" && "How do customers actually feel at every touchpoint: site navigation, checkout, unboxing, post-purchase support?"}
                    {dim === "Market Positioning" && "Do you occupy a clear, differentiated, and defensible position in your customers' minds versus competitors?"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── BRAND AUDITS ── */}
      {tab === "audits" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Record Brand Health Snapshot</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>Score your brand across 7 dimensions today. Run monthly to track brand health over time.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Brand Name *</div>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={auditForm.brandName} onChange={e => setAF("brandName", e.target.value)} placeholder="Your Store / Brand" />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Audit Date</div>
                <input type="date" style={{ ...S.input, width: "100%", boxSizing: "border-box", colorScheme: "dark" }} value={auditForm.date} onChange={e => setAF("date", e.target.value)} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Overall Score (auto)</div>
                <div style={{ ...S.input, width: "100%", boxSizing: "border-box", background: "#09090b", display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#4ade80" }}>
                    {Math.round([auditForm.clarity, auditForm.visual, auditForm.tone, auditForm.proof, auditForm.content, auditForm.cx, auditForm.positioning].reduce((a, b) => a + Number(b), 0) / 7)}
                  </span>
                  <span style={{ fontSize: 11, color: "#71717a", marginLeft: 4 }}>/100</span>
                </div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {[
                { k: "clarity",     label: "Brand Clarity" },
                { k: "visual",      label: "Visual Consistency" },
                { k: "tone",        label: "Tone of Voice" },
                { k: "proof",       label: "Social Proof" },
                { k: "content",     label: "Content Quality" },
                { k: "cx",          label: "Customer Experience" },
                { k: "positioning", label: "Market Positioning" },
              ].map(({ k, label }) => (
                <div key={k} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <div style={{ fontSize: 11, color: "#a1a1aa" }}>{label}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: Number(auditForm[k]) >= 70 ? "#4ade80" : Number(auditForm[k]) >= 50 ? "#fbbf24" : "#f87171" }}>{auditForm[k]}</div>
                  </div>
                  <input type="range" min="0" max="100" value={auditForm[k]} onChange={e => setAF(k, e.target.value)} style={{ width: "100%", accentColor: "#4f46e5", cursor: "pointer" }} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Audit Notes</div>
              <textarea style={{ ...S.ta, minHeight: 60 }} value={auditForm.notes} onChange={e => setAF("notes", e.target.value)} placeholder="Key observations, priority improvements, context for this audit period…" />
            </div>
            <button style={S.btn("primary")} onClick={saveAudit} disabled={auditSaving || !auditForm.brandName}>{auditSaving ? "Saving…" : "Save Brand Audit"}</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{audits.length} brand audit{audits.length !== 1 ? "s" : ""} recorded</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadAudits}>Refresh</button>
          </div>

          {audits.length === 0 ? (
            <EmptyState icon="📊" title="No brand audits recorded" description="Run your first brand health audit above. Monthly audits give you trend data to track brand improvement over time." />
          ) : (
            audits.map(a => (
              <div key={a.id} style={{ ...S.card, borderLeft: `3px solid ${a.overall >= 70 ? "#4ade80" : a.overall >= 50 ? "#fbbf24" : "#f87171"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: 28, fontWeight: 900, color: a.overall >= 70 ? "#4ade80" : a.overall >= 50 ? "#fbbf24" : "#f87171" }}>{a.overall}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{a.brandName}</div>
                        <div style={{ fontSize: 12, color: "#71717a" }}>{a.date || new Date(a.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[["clarity","Clarity"], ["visual","Visual"], ["tone","Tone"], ["proof","Proof"], ["content","Content"], ["cx","CX"], ["positioning","Position"]].map(([k, l]) => (
                        <div key={k} style={{ background: "#09090b", borderRadius: 4, padding: "3px 8px", textAlign: "center" }}>
                          <div style={{ fontSize: 9, color: "#52525b" }}>{l}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: Number(a[k]) >= 70 ? "#4ade80" : Number(a[k]) >= 50 ? "#fbbf24" : "#f87171" }}>{a[k]}</div>
                        </div>
                      ))}
                    </div>
                    {a.notes && <div style={{ fontSize: 12, color: "#71717a", marginTop: 6 }}>{a.notes}</div>}
                  </div>
                  <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px", flexShrink: 0, marginLeft: 12 }} onClick={() => deleteAudit(a.id)} disabled={auditDeleting === a.id}>{auditDeleting === a.id ? "…" : "Delete"}</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── STRATEGY GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Brand Intelligence Principles</div>
            {[
              { t: "Brand is what they say when you're not in the room",    d: "Your brand isn't your logo or tagline — it's the sum of every experience customers have with you. Review your Trustpilot, r/reviews, and Instagram comments monthly. That's your true brand health." },
              { t: "Consistency at every touchpoint is more important than perfection at any one", d: "A mediocre-but-consistent brand beats a brilliant-but-inconsistent one. If your website says 'premium' but your packaging says 'budget', the mismatch destroys trust. Audit all touchpoints quarterly." },
              { t: "The 5-second rule for brand clarity",                   d: "Show your homepage to someone unfamiliar with your brand for 5 seconds. Then ask: What does this company sell? Who is it for? Why should I buy from them instead of Amazon? If they can't answer all three — fix it immediately." },
              { t: "Social proof is the most credible brand signal",        d: "No amount of brand investment beats a page of genuine 5-star reviews with photos and video. 93% of consumers read reviews before buying. Collect them systematically after every order." },
              { t: "Price is a brand signal, not just a commercial decision", d: "Lowering your price communicates something to customers — it signals lower quality or desperation. Premium brands rarely discount. If you must discount, frame it as exclusivity (members-only) not generosity." },
              { t: "Your competitors define your positioning relative to the market", d: "Your brand positioning is always relative to alternatives. Analyse your top 3 competitors monthly: what do they emphasise, what do they ignore? The gaps are your positioning opportunities." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🧠</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Brand Measurement Framework</div>
            {[
              { metric: "Brand Awareness",   measurement: "% of target market who recognise your brand",            frequency: "Quarterly survey" },
              { metric: "Brand Recall",      measurement: "% who name your brand unprompted in your category",      frequency: "Quarterly survey" },
              { metric: "Net Promoter Score",measurement: "Would you recommend us? (0-10 scale)",                   frequency: "Post-purchase email" },
              { metric: "Brand Sentiment",   measurement: "Ratio of positive:negative social/review mentions",      frequency: "Monthly monitoring" },
              { metric: "Share of Voice",    measurement: "Your mentions vs competitors' in search + social",       frequency: "Monthly" },
              { metric: "Customer Confusion", measurement: "% who mistake you for a competitor",                   frequency: "Annual survey" },
            ].map(({ metric, measurement, frequency }) => (
              <div key={metric} style={{ display: "grid", gridTemplateColumns: "160px 1fr 100px", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{metric}</span>
                <span style={{ color: "#a1a1aa" }}>{measurement}</span>
                <span style={{ color: "#818cf8", fontWeight: 600 }}>{frequency}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
