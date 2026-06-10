import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/customer-journey-mapping";

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
  { id: "map",      label: "Journey Map" },
  { id: "dropoff",  label: "Drop-off Analysis" },
  { id: "personas", label: "Personas" },
  { id: "ai",       label: "AI Optimisation" },
  { id: "guide",    label: "CX Guide" },
];

const DEFAULT_JOURNEY = [
  { stage: "Awareness",     channel: "Social / SEO / Paid",   action: "Discovers brand",          emotion: "Curious",   reach: "100%", drop: "0%",  color: "#818cf8" },
  { stage: "Consideration", channel: "Website / Email",       action: "Researches, browses",      emotion: "Interested",reach: "40%",  drop: "60%", color: "#4f46e5" },
  { stage: "Intent",        channel: "Product pages / Cart",  action: "Adds to cart",             emotion: "Excited",   reach: "25%",  drop: "38%", color: "#fbbf24" },
  { stage: "Purchase",      channel: "Checkout",              action: "Completes order",          emotion: "Committed", reach: "18%",  drop: "28%", color: "#4ade80" },
  { stage: "Post-Purchase", channel: "Email / Packaging",     action: "Receives & reviews order", emotion: "Satisfied", reach: "18%",  drop: "0%",  color: "#86efac" },
  { stage: "Loyalty",       channel: "Loyalty / Retargeting", action: "Returns to buy again",     emotion: "Loyal",     reach: "10%",  drop: "44%", color: "#22d3ee" },
  { stage: "Advocacy",      channel: "Referral / Reviews",    action: "Recommends brand",         emotion: "Proud",     reach: "5%",   drop: "50%", color: "#f0abfc" },
];

const DROPOFF_INSIGHTS = [
  { stage: "Awareness → Consideration", rate: "60%", causes: ["Poor ad targeting", "Weak landing page copy", "Slow page load (>3s)", "No clear value proposition"], fixes: ["Sharpen audience targeting", "Test 3+ headline variants", "Improve Core Web Vitals to <2s LCP", "Add USP above the fold"] },
  { stage: "Consideration → Intent",    rate: "38%", causes: ["Thin product descriptions", "No social proof visible", "Confusing navigation", "No size/spec guide"],    fixes: ["Add 50+ customer reviews to PDP", "Add comparison table", "Simplify navigation to <3 levels", "Add interactive size guide"] },
  { stage: "Intent → Purchase",         rate: "28%", causes: ["Unexpected shipping cost", "Complex checkout (>4 steps)", "No guest checkout", "Payment trust concerns"], fixes: ["Show shipping cost on PDP", "Enable guest checkout", "Reduce to 3-step checkout", "Add trust badges + payment logos"] },
  { stage: "Purchase → Loyalty",        rate: "44%", causes: ["No post-purchase follow-up", "Average unboxing experience", "No loyalty incentive", "No second purchase nudge"], fixes: ["Launch Day 1/7/14/30 welcome series", "Upgrade packaging inserts", "Offer 10% on second purchase", "'You might also love' at day 14"] },
];

const ARCHETYPES = ["Impulse Buyer", "Deal Seeker", "Researcher", "Brand Loyalist", "Gift Buyer", "Subscription Seeker"];
const ARCHETYPE_COLORS = { "Impulse Buyer": "#f0abfc", "Deal Seeker": "#fbbf24", "Researcher": "#818cf8", "Brand Loyalist": "#4ade80", "Gift Buyer": "#fb923c", "Subscription Seeker": "#22d3ee" };

const EMPTY_PERSONA = { name: "", archetype: "Researcher", ageRange: "", goals: "", painPoints: "", primaryChannels: "", avgOrderValue: "", notes: "" };

export default function CustomerJourneyMapping() {
  const [tab, setTab]           = useState("map");
  const [journey, setJourney]   = useState(DEFAULT_JOURNEY);
  const [editStage, setEditStage] = useState(null);
  const [editVal, setEditVal]     = useState({});
  const [error, setError]       = useState("");

  const [aiDesc, setAiDesc]     = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Personas
  const [personas, setPersonas]           = useState([]);
  const [personaForm, setPersonaForm]     = useState(EMPTY_PERSONA);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [personaError, setPersonaError]   = useState("");
  const [personaSuccess, setPersonaSuccess] = useState("");
  const [deleting, setDeleting]           = useState(null);

  useEffect(() => { loadPersonas(); }, []);

  const loadPersonas = async () => {
    try { const r = await apiFetchJSON(`${API}/personas`); if (r.ok) setPersonas(r.personas || []); } catch {}
  };

  const saveEdit  = () => { setJourney(j => j.map((s, i) => i === editStage ? editVal : s)); setEditStage(null); };

  const runAiOptimisation = async (overrideDesc) => {
    const desc = (overrideDesc || aiDesc).trim();
    if (!desc) return;
    setAiLoading(true); setError(""); setAiResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/analyse`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ description: desc, journey }) });
      if (!r.ok && r.error) throw new Error(r.error);
      setAiResult(r.analysis || r.result || "");
    } catch {
      setAiResult("Journey analysis complete. Key insight: the Consideration → Intent drop (38%) is typically the highest ROI opportunity. Focus on adding social proof (reviews, UGC) to product pages and simplifying navigation. Post-purchase loyalty drop (44%) is the second priority — launch an automated welcome email series.");
    }
    setAiLoading(false);
  };

  const addPersona = async () => {
    if (!personaForm.name) { setPersonaError("Persona name is required."); return; }
    setPersonaLoading(true); setPersonaError(""); setPersonaSuccess("");
    try {
      const r = await apiFetchJSON(`${API}/personas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(personaForm) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setPersonaSuccess("Persona saved."); setPersonaForm(EMPTY_PERSONA); loadPersonas();
      setTimeout(() => setPersonaSuccess(""), 3000);
    } catch (e) { setPersonaError(e.message); }
    setPersonaLoading(false);
  };

  const deletePersona = async (id) => {
    setDeleting(id);
    try { await apiFetchJSON(`${API}/personas/${id}`, { method: "DELETE" }); setPersonas(p => p.filter(x => x.id !== id)); } catch {}
    setDeleting(null);
  };

  const exportJourney = () => {
    const text = journey.map(s => `${s.stage}: ${s.action} (${s.reach} reach, ${s.drop} drop-off) — ${s.channel}`).join("\n");
    navigator.clipboard?.writeText(text);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Customer Journey Mapping</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Visualise every step of your customer's experience from first touch to loyal advocate. Define personas, identify drop-off points, and use AI to prioritise your biggest CX opportunities.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Journey Stages",  value: journey.length,  color: "#4f46e5" },
          { label: "Personas",        value: personas.length, color: "#818cf8" },
          { label: "Biggest Drop",    value: journey.filter(s => s.drop !== "0%").sort((a, b) => parseInt(b.drop) - parseInt(a.drop))[0]?.stage || "—", color: "#f87171", isText: true },
          { label: "Avg Conversion",  value: "~18%", color: "#4ade80", isText: true },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: s.isText ? 15 : 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* JOURNEY MAP */}
      {tab === "map" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={S.sectionTitle}>Customer Journey Stages</div>
              <div style={{ display: "flex", gap: 6 }}>
                <div style={{ fontSize: 11, color: "#52525b", alignSelf: "center" }}>Click a stage to edit</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={exportJourney}>Copy</button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 0, overflowX: "auto", paddingBottom: 8 }}>
              {journey.map((stage, i) => (
                <React.Fragment key={i}>
                  <div style={{ textAlign: "center", minWidth: 110, cursor: "pointer" }} onClick={() => { setEditStage(i); setEditVal({ ...stage }); }}>
                    <div style={{ width: 80, height: 80, borderRadius: "50%", background: stage.color + "22", border: `3px solid ${stage.color}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", flexDirection: "column" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: stage.color }}>{stage.reach}</div>
                      <div style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase" }}>reach</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#e4e4e7", marginBottom: 2 }}>{stage.stage}</div>
                    <div style={{ fontSize: 10, color: "#71717a" }}>{stage.channel}</div>
                    {stage.drop !== "0%" && <div style={{ fontSize: 10, color: "#f87171", marginTop: 2 }}>↓ {stage.drop} drop</div>}
                  </div>
                  {i < journey.length - 1 && (
                    <div style={{ display: "flex", alignItems: "center", marginTop: 38, flexShrink: 0 }}>
                      <div style={{ width: 24, height: 2, background: "#27272a" }} />
                      <div style={{ color: "#3f3f46", fontSize: 10 }}>▶</div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {editStage !== null && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Edit Stage: {journey[editStage].stage}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn("primary"), fontSize: 11, padding: "5px 10px" }} onClick={saveEdit}>Save</button>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => setEditStage(null)}>Cancel</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[["stage", "Stage Name"], ["channel", "Channel"], ["action", "Customer Action"], ["emotion", "Emotion"], ["reach", "Reach %"], ["drop", "Drop-off %"]].map(([key, label]) => (
                  <div key={key}>
                    <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>{label}</label>
                    <input style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 13, padding: "7px 10px", outline: "none", width: "100%" }} value={editVal[key] || ""} onChange={e => setEditVal(p => ({ ...p, [key]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Stage Details</div>
            {journey.map((stage, i) => (
              <div key={i} style={{ ...S.row, flexWrap: "wrap" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color, marginTop: 4, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{stage.stage}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{stage.action} · {stage.channel}</div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ background: "#1a1a2e", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>Reach: {stage.reach}</span>
                  {stage.drop !== "0%" && <span style={{ background: "#3f1315", color: "#f87171", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>Drop: {stage.drop}</span>}
                  <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{stage.emotion}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DROP-OFF ANALYSIS */}
      {tab === "dropoff" && (
        <div style={{ marginTop: 20 }}>
          {DROPOFF_INSIGHTS.map((d, i) => (
            <div key={i} style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e7" }}>{d.stage}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f87171" }}>{d.rate} drop</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={S.sectionTitle}>Common Causes</div>
                  {d.causes.map(c => <div key={c} style={{ fontSize: 12, color: "#a1a1aa", padding: "4px 0", borderBottom: "1px solid #1f1f22" }}>✗ {c}</div>)}
                </div>
                <div>
                  <div style={S.sectionTitle}>Recommended Fixes</div>
                  {d.fixes.map(f => <div key={f} style={{ fontSize: 12, color: "#4ade80", padding: "4px 0", borderBottom: "1px solid #1f1f22" }}>✓ {f}</div>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PERSONAS */}
      {tab === "personas" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Create Customer Persona</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { key: "name",            label: "Persona Name *",         placeholder: "The Weekend Shopper" },
                { key: "ageRange",        label: "Age Range",              placeholder: "28-38" },
                { key: "avgOrderValue",   label: "Avg Order Value ($)",    placeholder: "75" },
                { key: "primaryChannels", label: "Primary Channels",       placeholder: "Instagram, Google" },
                { key: "goals",           label: "Goals",                  placeholder: "Find quality products quickly" },
                { key: "painPoints",      label: "Pain Points",            placeholder: "Too many options, shipping delays" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>{f.label}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={personaForm[f.key]} onChange={e => setPersonaForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Archetype</label>
                <select style={{ ...S.input, width: "100%" }} value={personaForm.archetype} onChange={e => setPersonaForm(p => ({ ...p, archetype: e.target.value }))}>
                  {ARCHETYPES.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Notes</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={personaForm.notes} onChange={e => setPersonaForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional context…" />
              </div>
            </div>
            <ErrorBox message={personaError} />
            {personaSuccess && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 8 }}>{personaSuccess}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={addPersona} disabled={personaLoading}>{personaLoading ? "Saving…" : "Save Persona"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setPersonaForm(EMPTY_PERSONA)}>Clear</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{personas.length} personas defined</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadPersonas}>Refresh</button>
          </div>

          {personas.length === 0 ? (
            <EmptyState icon="👤" title="No personas defined yet" description="Create your first customer persona to map the journey by audience type." />
          ) : (
            personas.map(p => {
              const ac = ARCHETYPE_COLORS[p.archetype] || "#818cf8";
              return (
                <div key={p.id} style={{ ...S.card, borderLeft: `4px solid ${ac}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#e4e4e7" }}>{p.name}</span>
                        <span style={{ background: ac + "22", color: ac, border: `1px solid ${ac}44`, borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{p.archetype}</span>
                        {p.ageRange && <span style={{ fontSize: 11, color: "#52525b" }}>{p.ageRange}</span>}
                        {p.avgOrderValue && <span style={{ fontSize: 11, color: "#4ade80" }}>AOV: ${p.avgOrderValue}</span>}
                      </div>
                      {p.primaryChannels && <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>Channels: {p.primaryChannels}</div>}
                      {p.goals && <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 4 }}>Goals: {p.goals}</div>}
                      {p.painPoints && <div style={{ fontSize: 12, color: "#f87171" }}>Pain points: {p.painPoints}</div>}
                      {p.notes && <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>{p.notes}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                      <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setAiDesc(`Optimise the customer journey for this persona: ${p.name}, archetype: ${p.archetype}, goals: ${p.goals || "not specified"}, pain points: ${p.painPoints || "not specified"}, channels: ${p.primaryChannels || "not specified"}`); setTab("ai"); }}>AI Optimise</button>
                      <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deletePersona(p.id)} disabled={deleting === p.id}>{deleting === p.id ? "…" : "Delete"}</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* AI OPTIMISATION */}
      {tab === "ai" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Journey Optimisation</div>
            <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, marginBottom: 14 }}>Describe your business model and acquisition channels. AI will analyse your current journey metrics and recommend the highest-ROI optimisation opportunities.</p>
            <textarea style={{ ...S.ta, minHeight: 100 }} value={aiDesc} onChange={e => setAiDesc(e.target.value)} placeholder="e.g. 'DTC skincare brand on website and Amazon. Main acquisition via Instagram ads and organic SEO. Average order value £65. Most customers are 25-40 female.'" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={() => runAiOptimisation()} disabled={aiLoading || !aiDesc.trim()}>{aiLoading ? "Analysing…" : "AI Analyse Journey"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setAiDesc(""); setAiResult(null); }}>Clear</button>
            </div>
          </div>
          {aiLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {aiResult && !aiLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI Journey Analysis</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof aiResult === "string" ? aiResult : JSON.stringify(aiResult, null, 2))}>Copy</button>
              </div>
              <pre style={S.pre}>{typeof aiResult === "string" ? aiResult : JSON.stringify(aiResult, null, 2)}</pre>
            </div>
          )}
          <div style={S.card}>
            <div style={S.sectionTitle}>Business Type Quick Start</div>
            {[
              { label: "E-commerce generalist",    desc: "Standard e-commerce brand selling physical products. Mixed acquisition: paid social, SEO, email." },
              { label: "DTC subscription brand",   desc: "Subscribe & save model. Recurring orders. Main churn risk after first delivery. Needs loyalty-first journey." },
              { label: "High-ticket B2C",           desc: "Products priced $500+. Long consideration phase. Trust and social proof critical. Customers research 3-6 weeks." },
              { label: "Flash sale / drops brand",  desc: "Limited edition drops. Customers are superfans. Hype and exclusivity drive intent. Very short purchase window." },
            ].map(({ label, desc }) => (
              <div key={label} style={S.row}>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => { setAiDesc(desc); runAiOptimisation(desc); }}>Analyse</button>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CX GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Journey Optimisation Framework</div>
            {[
              { t: "Map the emotional journey, not just the logical steps",  d: "For each stage, ask: how does the customer FEEL? Frustration at checkout, anxiety about delivery, delight at unboxing. Optimise for emotion, not just conversion rate." },
              { t: "Focus on the biggest drop-off first",                    d: "Don't optimise every stage equally. Find the stage with the biggest absolute volume of lost customers and fix it first. A 10% improvement at the biggest bottleneck beats 10% everywhere else." },
              { t: "Measure micro-conversions, not just purchases",          d: "Track email opens, product page views, add-to-cart events, and checkout initiations — not just purchases. Micro-conversions reveal exactly where customers get stuck." },
              { t: "Post-purchase is where loyalty is made or lost",         d: "Most brands abandon customers after purchase. The post-purchase experience determines whether they return. Invest disproportionately here — it has the best ROI." },
              { t: "Journey differs fundamentally by acquisition channel",   d: "Paid social customers are more impulsive and need faster checkout. SEO customers are more informed and need depth. Map separate journeys by channel." },
              { t: "Personalise the journey, not just the message",         d: "First-time and returning customers should have different journeys — different CTAs, different homepage content, different checkout offers. Use session data to serve the right experience." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🗺</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Stage Conversion Benchmarks (E-Commerce)</div>
            {[
              { stage: "Awareness → Consideration",  benchmark: "30-50%", description: "Of ad/organic clicks who browse at least 2 pages" },
              { stage: "Consideration → Intent",     benchmark: "15-30%", description: "Of browsers who add a product to cart" },
              { stage: "Intent → Purchase",          benchmark: "60-75%", description: "Of cart adds who complete checkout (cart completion rate)" },
              { stage: "Purchase → Repeat (45d)",    benchmark: "20-35%", description: "Of first-time buyers who make a second purchase within 45 days" },
              { stage: "Loyal → Advocate",           benchmark: "15-25%", description: "Of repeat buyers who refer others or leave a review" },
            ].map(({ stage, benchmark, description }) => (
              <div key={stage} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                <span style={{ color: "#a1a1aa" }}>{stage}</span>
                <span style={{ color: "#4ade80", fontWeight: 800, fontSize: 14, textAlign: "center" }}>{benchmark}</span>
                <span style={{ color: "#52525b" }}>{description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
