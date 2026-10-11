import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/competitive-analysis";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "analyse",     label: "AI Analyse" },
  { id: "competitors", label: "Competitor Tracker" },
  { id: "gaps",        label: "Feature Gaps" },
  { id: "history",     label: "Analysis History" },
  { id: "guide",       label: "Strategy Guide" },
];

const SAMPLE_QUERIES = [
  "Analyse the competitive landscape for an online DTC skincare brand. Main competitors: The Ordinary, CeraVe, Facetheory.",
  "We sell premium pet accessories. Analyse competitors Pets at Home, Fetch, MrAnimal. Find gap opportunities.",
  "Compare my email marketing approach vs Klaviyo's positioning. What features and messaging should I highlight to win customers considering Klaviyo?",
  "Benchmark my Shopify store vs Amazon marketplace listings for the same products. What are the key trust and conversion rate differences?",
];

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Critical"];
const EMPTY_COMP = { name: "", website: "", strengths: "", weaknesses: "", estimatedDA: "", marketShare: "", pricing: "", notes: "" };
const EMPTY_GAP  = { feature: "", description: "", priority: "Medium", competitor: "", effort: "", impact: "" };

export default function CompetitiveAnalysis() {
  const [tab, setTab]         = useState("analyse");
  const [query, setQuery]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [result, setResult]   = useState(null);

  const [competitors, setCompetitors] = useState([]);
  const [compForm, setCompForm]       = useState(EMPTY_COMP);
  const [compSaving, setCompSaving]   = useState(false);
  const [compError, setCompError]     = useState("");
  const [compSuccess, setCompSuccess] = useState("");

  const [gaps, setGaps]           = useState([]);
  const [gapForm, setGapForm]     = useState(EMPTY_GAP);
  const [gapSaving, setGapSaving] = useState(false);
  const [gapError, setGapError]   = useState("");

  const [history, setHistory]     = useState([]);
  const [deleting, setDeleting]   = useState(null);

  useEffect(() => { loadCompetitors(); loadGaps(); loadHistory(); }, []);

  const loadCompetitors = async () => {
    try { const r = await apiFetchJSON(`${API}/competitors`); if (r.ok) setCompetitors(r.competitors || []); } catch {}
  };
  const loadGaps = async () => {
    try { const r = await apiFetchJSON(`${API}/gaps`); if (r.ok) setGaps(r.gaps || []); } catch {}
  };
  const loadHistory = async () => {
    try { const r = await apiFetchJSON(`${API}/analyses`); if (r.ok) setHistory(r.analyses || []); } catch {}
  };

  const runAnalysis = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
      if (!r.ok) throw new Error(r.error || "Analysis failed");
      setResult(r.result); loadHistory();
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const addCompetitor = async () => {
    if (!compForm.name) { setCompError("Competitor name is required."); return; }
    setCompSaving(true); setCompError(""); setCompSuccess("");
    try {
      const r = await apiFetchJSON(`${API}/competitors`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(compForm) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setCompSuccess("Competitor added."); setCompForm(EMPTY_COMP); loadCompetitors();
      setTimeout(() => setCompSuccess(""), 3000);
    } catch (e) { setCompError(e.message); }
    setCompSaving(false);
  };

  const deleteCompetitor = async (id) => {
    setDeleting(`comp-${id}`);
    try { await apiFetchJSON(`${API}/competitors/${id}`, { method: "DELETE" }); setCompetitors(p => p.filter(c => c.id !== id)); } catch {}
    setDeleting(null);
  };

  const addGap = async () => {
    if (!gapForm.feature) { setGapError("Feature name is required."); return; }
    setGapSaving(true); setGapError("");
    try {
      const r = await apiFetchJSON(`${API}/gaps`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(gapForm) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setGapForm(EMPTY_GAP); loadGaps();
    } catch (e) { setGapError(e.message); }
    setGapSaving(false);
  };

  const deleteGap = async (id) => {
    setDeleting(`gap-${id}`);
    try { await apiFetchJSON(`${API}/gaps/${id}`, { method: "DELETE" }); setGaps(p => p.filter(g => g.id !== id)); } catch {}
    setDeleting(null);
  };

  const deleteAnalysis = async (id) => {
    try { await apiFetchJSON(`${API}/analyses/${id}`, { method: "DELETE" }); setHistory(p => p.filter(h => h.id !== id)); } catch {}
  };

  const priorityColor = (p) => p === "Critical" ? "#f87171" : p === "High" ? "#fb923c" : p === "Medium" ? "#fbbf24" : "#4ade80";
  const priorityBg    = (p) => p === "Critical" ? "#3f1315" : p === "High" ? "#431407" : p === "Medium" ? "#3d2a0a" : "#052e16";

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Competitive Analysis</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered competitor intelligence, feature gap identification, and strategic benchmarking. Track competitors, identify gaps to exploit, and get AI-driven positioning recommendations.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Competitors Tracked", value: competitors.length,                                       color: "#818cf8" },
          { label: "Feature Gaps",        value: gaps.length,                                              color: "#fbbf24" },
          { label: "Critical Gaps",       value: gaps.filter(g => g.priority === "Critical").length,       color: "#f87171" },
          { label: "Analyses Run",        value: history.length,                                           color: "#4ade80" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* AI ANALYSE */}
      {tab === "analyse" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Describe Your Competitive Analysis Need</div>
            <textarea style={{ ...S.ta, minHeight: 130 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. 'Analyse the competitive landscape for my DTC supplements brand. Main competitors: Huel, Bulk, Myprotein. Identify their positioning gaps and where I can win on messaging, pricing, and product differentiation.'" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={runAnalysis} disabled={loading || !query.trim()}>{loading ? "Analysing…" : "Run Competitive Analysis"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setQuery(""); setResult(null); }}>Clear</button>
            </div>
          </div>

          {!query && !result && !loading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Sample Queries — Click to Load</div>
              {SAMPLE_QUERIES.map((q, i) => (
                <div key={i} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setQuery(q)}>Load</button>
                  <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{q}</div>
                </div>
              ))}
            </div>
          )}
          <ErrorBox message={error} />
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Competitive Intelligence Report</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof result === "string" ? result : JSON.stringify(result, null, 2))}>Copy</button>
                </div>
              </div>
              <pre style={S.pre}>{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* COMPETITOR TRACKER */}
      {tab === "competitors" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Competitor</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { key: "name",         label: "Competitor Name *",    placeholder: "The Ordinary" },
                { key: "website",      label: "Website",              placeholder: "theordinary.com" },
                { key: "estimatedDA",  label: "Domain Authority",     placeholder: "74" },
                { key: "marketShare",  label: "Est. Market Share %",  placeholder: "12" },
                { key: "pricing",      label: "Pricing Tier",         placeholder: "Budget / Mid / Premium" },
                { key: "notes",        label: "Notes",                placeholder: "Focus on science-backed formulas…" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>{f.label}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={compForm[f.key]} onChange={e => setCompForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { key: "strengths",  label: "Key Strengths",  placeholder: "Strong brand, dermatologist-endorsed…" },
                { key: "weaknesses", label: "Key Weaknesses", placeholder: "Poor customer service, slow shipping…" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>{f.label}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={compForm[f.key]} onChange={e => setCompForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <ErrorBox message={compError} />
            {compSuccess && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 8 }}>{compSuccess}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={addCompetitor} disabled={compSaving}>{compSaving ? "Adding…" : "Track Competitor"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setCompForm(EMPTY_COMP)}>Clear</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{competitors.length} competitors tracked</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadCompetitors}>Refresh</button>
          </div>

          {competitors.length === 0 ? (
            <EmptyState icon="🔍" title="No competitors tracked" description="Add your main competitors to build an intelligence database." />
          ) : (
            competitors.map(c => (
              <div key={c.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e7" }}>{c.name}</span>
                      {c.website && <span style={{ fontSize: 11, color: "#4f46e5" }}>{c.website}</span>}
                      {c.pricing && <span style={{ background: "#27272a", color: "#a1a1aa", borderRadius: 5, padding: "2px 8px", fontSize: 11 }}>{c.pricing}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#71717a", marginBottom: 6 }}>
                      {c.estimatedDA && <span>DA: <strong style={{ color: "#818cf8" }}>{c.estimatedDA}</strong></span>}
                      {c.marketShare && <span>Market share: <strong style={{ color: "#fafafa" }}>{c.marketShare}%</strong></span>}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                      {c.strengths  && <div><span style={{ color: "#4ade80", fontWeight: 600 }}>Strengths: </span><span style={{ color: "#a1a1aa" }}>{c.strengths}</span></div>}
                      {c.weaknesses && <div><span style={{ color: "#f87171", fontWeight: 600 }}>Weaknesses: </span><span style={{ color: "#a1a1aa" }}>{c.weaknesses}</span></div>}
                    </div>
                    {c.notes && <div style={{ fontSize: 11, color: "#52525b", marginTop: 6 }}>{c.notes}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(`Provide a detailed competitive analysis of ${c.name} (${c.website || ""}). Strengths: ${c.strengths || "unknown"}. Weaknesses: ${c.weaknesses || "unknown"}. How should I position against them?`); setTab("analyse"); }}>Analyse</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteCompetitor(c.id)} disabled={deleting === `comp-${c.id}`}>{deleting === `comp-${c.id}` ? "…" : "Delete"}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* FEATURE GAPS */}
      {tab === "gaps" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Log Feature Gap / Opportunity</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { key: "feature",    label: "Feature / Capability *", placeholder: "Subscription model" },
                { key: "competitor", label: "Who has it",             placeholder: "Huel, Bulk" },
                { key: "effort",     label: "Effort to build",        placeholder: "Low / Medium / High" },
                { key: "impact",     label: "Revenue impact",         placeholder: "High — est. 15% AOV lift" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>{f.label}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={gapForm[f.key]} onChange={e => setGapForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Description</label>
              <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={gapForm.description} onChange={e => setGapForm(p => ({ ...p, description: e.target.value }))} placeholder="What is the gap and why does it matter…" />
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 14, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#71717a" }}>Priority:</span>
              {PRIORITY_OPTIONS.map(p => (
                <button key={p} style={{ ...S.btn(gapForm.priority === p ? "primary" : null), fontSize: 11, padding: "4px 10px" }} onClick={() => setGapForm(f => ({ ...f, priority: p }))}>{p}</button>
              ))}
            </div>
            <ErrorBox message={gapError} />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={addGap} disabled={gapSaving}>{gapSaving ? "Adding…" : "Log Gap"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setGapForm(EMPTY_GAP)}>Clear</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{gaps.length} gaps tracked</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadGaps}>Refresh</button>
          </div>

          {gaps.length === 0 ? (
            <EmptyState icon="⚡" title="No feature gaps logged" description="Log competitor capabilities you need to build or match to close competitive gaps." />
          ) : (
            [...gaps].sort((a, b) => PRIORITY_OPTIONS.indexOf(b.priority) - PRIORITY_OPTIONS.indexOf(a.priority)).map(g => (
              <div key={g.id} style={{ ...S.card, borderLeft: `4px solid ${priorityColor(g.priority)}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{g.feature}</span>
                      <span style={{ background: priorityBg(g.priority), color: priorityColor(g.priority), borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{g.priority}</span>
                    </div>
                    {g.description && <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>{g.description}</div>}
                    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12, color: "#a1a1aa" }}>
                      {g.competitor && <span>Has it: {g.competitor}</span>}
                      {g.effort && <span>Effort: {g.effort}</span>}
                      {g.impact && <span style={{ color: "#4ade80" }}>Impact: {g.impact}</span>}
                    </div>
                  </div>
                  <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px", flexShrink: 0, marginLeft: 12 }} onClick={() => deleteGap(g.id)} disabled={deleting === `gap-${g.id}`}>{deleting === `gap-${g.id}` ? "…" : "Delete"}</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ANALYSIS HISTORY */}
      {tab === "history" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{history.length} saved analyses</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadHistory}>Refresh</button>
          </div>
          {history.length === 0 ? (
            <EmptyState icon="📋" title="No analysis history" description="Run competitive analyses in the AI Analyse tab — they'll be saved here automatically." />
          ) : (
            history.map(h => (
              <div key={h.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ fontSize: 11, color: "#52525b", marginBottom: 4 }}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : ""}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 4 }}>{(h.query || "").slice(0, 120)}{(h.query || "").length > 120 ? "…" : ""}</div>
                    {h.result && <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{(typeof h.result === "string" ? h.result : JSON.stringify(h.result)).slice(0, 180)}…</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(h.query); setResult(h.result); setTab("analyse"); }}>Load</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteAnalysis(h.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* STRATEGY GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Competitive Intelligence Framework</div>
            {[
              { t: "Analyse first, position second",                d: "Most brands position themselves in isolation ('We're premium!') without studying what competitors already own in customers' minds. Map competitor positioning first, then find the unclaimed space." },
              { t: "The Jobs-to-be-Done lens for competitor analysis", d: "Ask not 'who are your competitors' but 'what are customers hiring my product to do?'. Other products solving the same job are true competitors — even if they're in a different category." },
              { t: "Monitor competitor content and pricing weekly",  d: "Competitors' pricing, product launches, and content strategy change constantly. Set up Google Alerts for competitor names and weekly checks of their Shopify stores, pricing pages, and job listings." },
              { t: "Feature gap priority = frequency × customer frustration", d: "Track which missing features customers mention in reviews of your competitors and yours. High-frequency, high-frustration gaps are your highest-ROI development priorities." },
              { t: "Customer review mining is free competitor intel", d: "Your competitors' negative reviews are your positioning gold. Search '★★ [competitor name]' on Google/Trustpilot to find recurring complaints. Turn their weaknesses into your explicit differentiators." },
              { t: "Win/loss analysis reveals true competitive dynamics", d: "Interview every customer who considered you vs a competitor. Ask: what almost made you choose them? What finally made you choose us? 10 interviews reveal patterns no amount of market research can match." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🔍</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Competitive Positioning Matrix</div>
            {[
              { quad: "Leader",     desc: "High market share, strong brand, pricing power. Defend position.",                      action: "Widen moat: loyalty, ecosystem, switching costs" },
              { quad: "Challenger", desc: "Strong product, lower share. Aggressive differentiation needed.",                       action: "Attack leader's weaknesses, claim specific niche" },
              { quad: "Follower",   desc: "Similar product to leaders, lower share. Risk of commoditisation.",                    action: "Specialise or risk being squeezed out" },
              { quad: "Nicher",     desc: "Focused on an underserved segment. High relevance in your niche.",                     action: "Deepen niche ownership; resist growth via dilution" },
            ].map(({ quad, desc, action }) => (
              <div key={quad} style={S.row}>
                <span style={{ background: "#1e1b4b", color: "#818cf8", borderRadius: 5, padding: "2px 10px", fontSize: 11, fontWeight: 700, minWidth: 70, textAlign: "center", flexShrink: 0 }}>{quad}</span>
                <div>
                  <div style={{ fontSize: 12, color: "#a1a1aa" }}>{desc}</div>
                  <div style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600, marginTop: 2 }}>Strategy: {action}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
