import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/automation-templates";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "capitalize", background: c === "retention" ? "#1a1a2e" : c === "email" ? "#052e16" : c === "seo" ? "#3d2a0a" : c === "custom" ? "#1c1917" : "#27272a", color: c === "retention" ? "#818cf8" : c === "email" ? "#4ade80" : c === "seo" ? "#fbbf24" : c === "custom" ? "#d6d3d1" : "#a1a1aa" }),
};

const TABS = [
  { id: "browse",  label: "Template Gallery" },
  { id: "custom",  label: "AI Builder" },
  { id: "saved",   label: "My Templates" },
  { id: "guide",   label: "Automation Guide" },
];

const GALLERY = [
  { name: "Welcome Series — 5-Email Onboarding", category: "email", trigger: "New customer signs up", description: "5-email sequence over 14 days: Welcome → Product Education → Social Proof → First Purchase Nudge → Loyalty Invite", steps: 5, avgResult: "12% conversion", tags: ["email", "onboarding"] },
  { name: "Abandoned Cart Recovery",              category: "retention", trigger: "Cart abandoned for 1 hour", description: "3-touch recovery: Email (1hr) → SMS reminder (24hr) → Final offer (72hr). Average 15% cart recovery rate.", steps: 3, avgResult: "15% recovery", tags: ["cart", "sms"] },
  { name: "Post-Purchase Review Request",          category: "email", trigger: "Order delivered + 5 days", description: "Automated review request 5 days post-delivery with photo prompt. Conditional follow-up if no review in 7 days.", steps: 2, avgResult: "8% review rate", tags: ["reviews", "ugc"] },
  { name: "VIP Customer Loyalty Programme",        category: "retention", trigger: "Customer reaches $500 LTV", description: "Automatic VIP tier upgrade with personalised rewards, early access to new products, and birthday treat.", steps: 4, avgResult: "67% retention", tags: ["vip", "loyalty"] },
  { name: "Browse Abandonment Re-engagement",      category: "retention", trigger: "Viewed product, no add-to-cart in 24hr", description: "Triggered personalised email showing browsed products with 'We noticed you were interested' messaging + social proof.", steps: 2, avgResult: "6% conversion", tags: ["browse", "retargeting"] },
  { name: "Win-Back Campaign (90-day inactive)",   category: "retention", trigger: "No purchase in 90 days", description: "3-stage win-back: Personalised 'We miss you' → Best offer ever → Last chance → Sunset email.", steps: 4, avgResult: "9% win-back", tags: ["winback", "churn"] },
  { name: "Blog SEO Content Distribution",         category: "seo", trigger: "New blog post published", description: "Auto-distribute new content: social posts across 4 platforms, email newsletter teaser, internal linking check.", steps: 6, avgResult: "34% traffic lift", tags: ["seo", "content"] },
  { name: "Inventory Alert & Reorder",             category: "email", trigger: "Product stock below threshold", description: "Notify team of low stock, back-in-stock signup email to interested customers, auto-draft PO for approval.", steps: 3, avgResult: "Ops efficiency", tags: ["inventory", "ops"] },
];

const EMPTY_SAVE = { name: "", category: "email", trigger: "", description: "", steps: "", tags: "" };

export default function AutomationTemplates() {
  const [tab, setTab]           = useState("browse");
  const [query, setQuery]       = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [filter, setFilter]     = useState("all");
  const [viewTemplate, setViewTemplate] = useState(null);

  // My Templates (API-persisted)
  const [saved, setSaved]             = useState([]);
  const [saveForm, setSaveForm]       = useState(EMPTY_SAVE);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError]     = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");
  const [deleting, setDeleting]       = useState(null);

  useEffect(() => { loadSaved(); }, []);

  const loadSaved = async () => {
    try { const r = await apiFetchJSON(`${API}/saved`); if (r.ok) setSaved(r.templates || []); } catch {}
  };

  const buildWithAI = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setAiResult(null);
    try {
      const r = await apiFetchJSON(`${API}/query`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) });
      if (!r.ok) throw new Error(r.error || "Failed");
      setAiResult(r.result);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveTemplate = async (data) => {
    setSaveLoading(true); setSaveError(""); setSaveSuccess("");
    try {
      const r = await apiFetchJSON(`${API}/saved`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(r.error || "Failed to save");
      setSaveSuccess("Template saved."); setSaveForm(EMPTY_SAVE); loadSaved();
      setTimeout(() => setSaveSuccess(""), 3000);
    } catch (e) { setSaveError(e.message); }
    setSaveLoading(false);
  };

  const deleteSaved = async (id) => {
    setDeleting(id);
    try { await apiFetchJSON(`${API}/saved/${id}`, { method: "DELETE" }); setSaved(p => p.filter(t => t.id !== id)); } catch {}
    setDeleting(null);
  };

  const saveAiResult = () => {
    if (!aiResult) return;
    saveTemplate({ name: query.slice(0, 60), category: "custom", trigger: "Custom", description: typeof aiResult === "string" ? aiResult.slice(0, 200) : "AI-generated workflow", steps: "3", tags: "custom" });
  };

  const importFromGallery = (tpl) => {
    saveTemplate({ name: tpl.name, category: tpl.category, trigger: tpl.trigger, description: tpl.description, steps: String(tpl.steps), tags: tpl.tags.join(", ") });
  };

  const categories = ["all", ...Array.from(new Set(GALLERY.map(t => t.category)))];
  const filtered   = filter === "all" ? GALLERY : GALLERY.filter(t => t.category === filter);

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Automation Templates</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Browse battle-tested automation workflows, save your favourites, or use AI to build a custom workflow from scratch. Every template is based on real e-commerce results.</p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { label: "Gallery Templates", value: GALLERY.length, color: "#4f46e5" },
          { label: "My Templates",      value: saved.length,   color: "#4ade80" },
          { label: "Categories",        value: categories.length - 1, color: "#818cf8" },
          { label: "AI Builds",         value: aiResult ? 1 : 0, color: "#fbbf24" },
        ].map(s => (
          <div key={s.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color, marginTop: 2 }}>{s.value}</div>
          </div>
        ))}
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* BROWSE */}
      {tab === "browse" && !viewTemplate && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {categories.map(cat => (
              <button key={cat} style={{ ...S.btn(cat === filter ? "primary" : null), fontSize: 11, padding: "5px 10px", textTransform: "capitalize" }} onClick={() => setFilter(cat)}>{cat}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
            {filtered.map((tpl, i) => (
              <div key={i} style={{ ...S.card, cursor: "pointer", marginBottom: 0 }} onClick={() => setViewTemplate(tpl)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <span style={S.badge(tpl.category)}>{tpl.category}</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#4ade80" }}>{tpl.avgResult}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 4 }}>{tpl.name}</div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 10, lineHeight: 1.5 }}>{tpl.description.slice(0, 90)}…</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {tpl.tags.slice(0, 2).map(tag => (
                      <span key={tag} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#71717a" }}>#{tag}</span>
                    ))}
                  </div>
                  <button style={{ ...S.btn("green"), fontSize: 11, padding: "4px 10px" }} onClick={e => { e.stopPropagation(); importFromGallery(tpl); setTab("saved"); }}>
                    {saved.find(s => s.name === tpl.name) ? "✓ Saved" : "Save"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "browse" && viewTemplate && (
        <div style={{ marginTop: 20 }}>
          <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px", marginBottom: 16 }} onClick={() => setViewTemplate(null)}>← Back to Gallery</button>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div>
                <span style={{ ...S.badge(viewTemplate.category), marginBottom: 8, display: "inline-block" }}>{viewTemplate.category}</span>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "#fafafa", margin: "6px 0" }}>{viewTemplate.name}</h2>
                <div style={{ fontSize: 13, color: "#71717a" }}>Trigger: {viewTemplate.trigger}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#4ade80" }}>{viewTemplate.avgResult}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 16 }}>{viewTemplate.description}</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[{ label: "Steps", value: viewTemplate.steps }, { label: "Category", value: viewTemplate.category }, { label: "Trigger", value: viewTemplate.trigger }].map(f => (
                <div key={f.label} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: "#e4e4e7", fontWeight: 600 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("green")} onClick={() => { importFromGallery(viewTemplate); setViewTemplate(null); setTab("saved"); }}>
                {saved.find(s => s.name === viewTemplate.name) ? "Already Saved" : "Save Template"}
              </button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setQuery(`Customise this template: ${viewTemplate.name}. ${viewTemplate.description}`); setTab("custom"); }}>Customise with AI</button>
            </div>
          </div>
        </div>
      )}

      {/* AI BUILDER */}
      {tab === "custom" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Describe Your Automation</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>Describe the workflow you want to build. Include the trigger, the goal, your audience, and any specific steps you have in mind.</p>
            <textarea style={{ ...S.ta, minHeight: 130 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. 'Build an automation for customers who buy running shoes but haven't bought accessories within 30 days. Include email with personalised recommendations and a 10% discount, then an SMS follow-up 48 hours later.'" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={buildWithAI} disabled={loading || !query.trim()}>{loading ? "Building…" : "Build with AI"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setQuery("")}>Clear</button>
            </div>
          </div>
          <ErrorBox message={error} />
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}
          {aiResult && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>AI-Generated Automation Blueprint</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof aiResult === "string" ? aiResult : JSON.stringify(aiResult, null, 2))}>Copy</button>
                  <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={saveAiResult} disabled={saveLoading}>Save to My Templates</button>
                </div>
              </div>
              {saveSuccess && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 8 }}>{saveSuccess}</div>}
              <pre style={S.pre}>{typeof aiResult === "string" ? aiResult : JSON.stringify(aiResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* MY TEMPLATES */}
      {tab === "saved" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Save New Template</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
              {[
                { key: "name",    label: "Template Name *", placeholder: "My Welcome Series" },
                { key: "trigger", label: "Trigger",         placeholder: "New customer signs up" },
                { key: "steps",   label: "Number of Steps", placeholder: "5" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>{f.label}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={saveForm[f.key]} onChange={e => setSaveForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Category</label>
                <select style={{ ...S.input, width: "100%" }} value={saveForm.category} onChange={e => setSaveForm(p => ({ ...p, category: e.target.value }))}>
                  {["email", "retention", "seo", "custom", "ops"].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Tags (comma-separated)</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={saveForm.tags} onChange={e => setSaveForm(p => ({ ...p, tags: e.target.value }))} placeholder="email, onboarding, welcome" />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 3 }}>Description</label>
              <textarea style={{ ...S.ta, minHeight: 70 }} value={saveForm.description} onChange={e => setSaveForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe what this automation does…" />
            </div>
            <ErrorBox message={saveError} />
            {saveSuccess && <div style={{ color: "#4ade80", fontSize: 13, marginBottom: 8 }}>{saveSuccess}</div>}
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={() => saveTemplate(saveForm)} disabled={saveLoading || !saveForm.name}>{saveLoading ? "Saving…" : "Save Template"}</button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setSaveForm(EMPTY_SAVE)}>Clear</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{saved.length} saved templates</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadSaved}>Refresh</button>
          </div>

          {saved.length === 0 ? (
            <EmptyState icon="⚙️" title="No templates saved yet" description="Browse the Template Gallery and save templates, or use AI Builder to create custom ones." />
          ) : (
            saved.map(tpl => (
              <div key={tpl.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                      <span style={S.badge(tpl.category)}>{tpl.category}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{tpl.name}</span>
                    </div>
                    {tpl.trigger && <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>Trigger: {tpl.trigger}</div>}
                    {tpl.description && <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{tpl.description.slice(0, 140)}{tpl.description.length > 140 ? "…" : ""}</div>}
                    {tpl.tags && <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>Tags: {tpl.tags}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(`Customise this automation: ${tpl.name}. ${tpl.description}`); setTab("custom"); }}>Customise</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteSaved(tpl.id)} disabled={deleting === tpl.id}>{deleting === tpl.id ? "…" : "Delete"}</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Automation ROI Framework</div>
            {[
              { t: "Start with revenue-generating automations",  d: "Abandoned cart recovery and win-back campaigns have immediate, measurable ROI. Deploy these first before optimisation workflows." },
              { t: "The 3-7-30 follow-up sequence",             d: "Best practice timing: first touch within 1-3 hours, second touch at 24-48 hours, final touch at 7 days. After 30 days, shift to win-back." },
              { t: "Test one variable at a time",               d: "When A/B testing sequences, change only the subject line, timing, or CTA — never multiple variables. Run each test for 500+ recipients." },
              { t: "Map triggers to customer intent",           d: "Browse abandonment = curiosity signal. Cart abandonment = strong purchase intent. Both need different urgency levels in messaging." },
              { t: "Unsubscribe is data, not defeat",           d: "Track unsubscribes by automation and look for patterns. High unsubscribe in Step 2 means Step 1 over-promised. Adjust expectations." },
              { t: "Segment before automating at scale",        d: "Run any new automation on 10% of eligible audience first. Measure engagement before scaling. Protect your sender reputation." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>⚙️</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Automation Performance Benchmarks</div>
            {[
              { type: "Welcome Series",           metric: "Open rate",    benchmark: "45-60%", note: "First email is always the highest performer" },
              { type: "Abandoned Cart",           metric: "Recovery rate", benchmark: "10-20%", note: "3-touch sequence outperforms single email by 3×" },
              { type: "Win-Back (90d)",           metric: "Re-activation", benchmark: "5-12%",  note: "Offer-led wins; timing matters more than discount size" },
              { type: "Post-Purchase Review",     metric: "Review rate",   benchmark: "5-15%",  note: "Photo prompt increases UGC submissions by 40%" },
              { type: "Browse Abandonment",       metric: "Click rate",    benchmark: "3-8%",   note: "Personalised product image drives engagement" },
            ].map(r => (
              <div key={r.type} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 2fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12 }}>
                <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{r.type}</span>
                <span style={{ color: "#52525b" }}>{r.metric}</span>
                <span style={{ color: "#4ade80", fontWeight: 700 }}>{r.benchmark}</span>
                <span style={{ color: "#71717a" }}>{r.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
