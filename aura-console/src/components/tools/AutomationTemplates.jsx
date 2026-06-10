import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/automation-templates";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "retention" ? "#1a1a2e" : c === "email" ? "#052e16" : c === "seo" ? "#3d2a0a" : "#27272a", color: c === "retention" ? "#818cf8" : c === "email" ? "#4ade80" : c === "seo" ? "#fbbf24" : "#a1a1aa" }),
};

const TABS = [
  { id: "browse",  label: "Template Gallery" },
  { id: "custom",  label: "AI Custom Builder" },
  { id: "installed", label: "My Templates" },
  { id: "guide",   label: "Automation Guide" },
];

const TEMPLATE_GALLERY = [
  {
    name: "Welcome Series — 5-Email Onboarding",
    category: "email",
    trigger: "New customer signs up",
    description: "5-email sequence over 14 days: Welcome → Product Education → Social Proof → First Purchase Nudge → Loyalty Invite",
    steps: 5,
    avgConversion: "12%",
    tags: ["email", "onboarding", "new customer"],
  },
  {
    name: "Abandoned Cart Recovery",
    category: "retention",
    trigger: "Cart abandoned for 1 hour",
    description: "3-touch recovery: Email (1hr) → SMS reminder (24hr) → Final offer (72hr). Average 15% cart recovery rate.",
    steps: 3,
    avgConversion: "15%",
    tags: ["cart", "recovery", "sms"],
  },
  {
    name: "Post-Purchase Review Request",
    category: "email",
    trigger: "Order delivered (+ 5 days)",
    description: "Automated review request 5 days post-delivery with photo prompt. Conditional follow-up if no review in 7 days.",
    steps: 2,
    avgConversion: "8%",
    tags: ["reviews", "ugc", "social proof"],
  },
  {
    name: "VIP Customer Loyalty Programme",
    category: "retention",
    trigger: "Customer reaches $500 LTV",
    description: "Automatic VIP tier upgrade with personalised rewards, early access to new products, and birthday treat.",
    steps: 4,
    avgConversion: "67% retention",
    tags: ["vip", "loyalty", "ltv"],
  },
  {
    name: "Browse Abandonment Re-engagement",
    category: "retention",
    trigger: "Viewed product, no add-to-cart in 24hr",
    description: "Triggered personalised email showing browsed products with 'We noticed you were interested' messaging + social proof.",
    steps: 2,
    avgConversion: "6%",
    tags: ["browse", "retargeting"],
  },
  {
    name: "Win-Back Campaign (90-day inactive)",
    category: "retention",
    trigger: "No purchase in 90 days",
    description: "3-stage win-back: Personalised 'We miss you' → Best offer ever → Last chance → Sunset email.",
    steps: 4,
    avgConversion: "9%",
    tags: ["winback", "churn", "inactive"],
  },
  {
    name: "Blog SEO Content Distribution",
    category: "seo",
    trigger: "New blog post published",
    description: "Auto-distribute new content: social posts across 4 platforms, email newsletter teaser, internal linking check.",
    steps: 6,
    avgConversion: "34% traffic lift",
    tags: ["seo", "content", "distribution"],
  },
  {
    name: "Inventory Alert & Reorder",
    category: "email",
    trigger: "Product stock below threshold",
    description: "Notify team of low stock, send back-in-stock signup email to interested customers, auto-draft PO for approval.",
    steps: 3,
    avgConversion: "N/A",
    tags: ["inventory", "operations"],
  },
];

export default function AutomationTemplates() {
  const [tab, setTab]           = useState("browse");
  const [query, setQuery]       = useState("");
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [installed, setInstalled] = useState([]);
  const [filter, setFilter]     = useState("all");
  const [viewTemplate, setViewTemplate] = useState(null);

  const buildWithAI = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setAiResult(null);
    try {
      const r = await apiFetchJSON(`${API}/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!r.ok) throw new Error(r.error || "Failed");
      setAiResult(r.result);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const installTemplate = (tpl) => {
    if (installed.find(t => t.name === tpl.name)) return;
    setInstalled(p => [...p, { ...tpl, installedAt: new Date().toISOString() }]);
  };

  const categories = ["all", ...Array.from(new Set(TEMPLATE_GALLERY.map(t => t.category)))];
  const filtered = filter === "all" ? TEMPLATE_GALLERY : TEMPLATE_GALLERY.filter(t => t.category === filter);

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Automation Templates</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Browse, install and customise pre-built automation workflows. Every template is battle-tested with real e-commerce results, or use AI to build a custom workflow from scratch.</p>
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
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#4ade80" }}>{tpl.avgConversion}</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 4 }}>{tpl.name}</div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 10, lineHeight: 1.5 }}>{tpl.description.slice(0, 90)}…</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {tpl.tags.slice(0, 2).map(tag => (
                      <span key={tag} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: "#71717a" }}>#{tag}</span>
                    ))}
                  </div>
                  <button style={{ ...S.btn("green"), fontSize: 11, padding: "4px 10px" }} onClick={e => { e.stopPropagation(); installTemplate(tpl); }}>
                    {installed.find(t => t.name === tpl.name) ? "✓ Installed" : "Install"}
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
                <div style={{ fontSize: 32, fontWeight: 800, color: "#4ade80" }}>{viewTemplate.avgConversion}</div>
                <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase" }}>Avg result</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6, marginBottom: 16 }}>{viewTemplate.description}</p>
            <div style={S.sectionTitle}>Template Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { label: "Steps", value: viewTemplate.steps },
                { label: "Category", value: viewTemplate.category },
                { label: "Trigger", value: viewTemplate.trigger },
              ].map(f => (
                <div key={f.label} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 13, color: "#e4e4e7", fontWeight: 600 }}>{f.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("green")} onClick={() => { installTemplate(viewTemplate); setViewTemplate(null); setTab("installed"); }}>
                {installed.find(t => t.name === viewTemplate.name) ? "Already Installed" : "Install Template"}
              </button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setQuery(`Customise this template for my store: ${viewTemplate.name}. ${viewTemplate.description}`); setTab("custom"); }}>Customise with AI</button>
            </div>
          </div>
        </div>
      )}

      {/* AI CUSTOM BUILDER */}
      {tab === "custom" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Describe Your Automation</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12 }}>Describe the workflow you want to build. Include the trigger, the goal, your audience, and any specific steps you have in mind.</p>
            <textarea style={{ ...S.ta, minHeight: 130 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. 'Build an automation for customers who buy running shoes but haven't bought accessories within 30 days. Include an email with personalised product recommendations and a 10% discount, then an SMS follow-up 48 hours later.'" />
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
                  <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={() => installTemplate({ name: query.slice(0, 50), category: "custom", trigger: "Custom", description: typeof aiResult === "string" ? aiResult.slice(0, 120) : "Custom automation", steps: 3, avgConversion: "TBD", tags: ["custom"] })}>Save to My Templates</button>
                </div>
              </div>
              <pre style={S.pre}>{typeof aiResult === "string" ? aiResult : JSON.stringify(aiResult, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* INSTALLED */}
      {tab === "installed" && (
        <div style={{ marginTop: 20 }}>
          {installed.length === 0 ? (
            <EmptyState icon="⚙️" title="No templates installed yet" description="Browse the Template Gallery and install templates to see them here." />
          ) : (
            installed.map((tpl, i) => (
              <div key={i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ ...S.badge(tpl.category), marginBottom: 6, display: "inline-block" }}>{tpl.category}</span>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{tpl.name}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 4 }}>Installed: {new Date(tpl.installedAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(`Customise this automation: ${tpl.name}. ${tpl.description}`); setTab("custom"); }}>Customise</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => setInstalled(p => p.filter((_, idx) => idx !== i))}>Remove</button>
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
              { t: "The 3-7-30 follow-up sequence",             d: "Best practice timing: first touch within 1-3 hours, second touch at 24-48 hours, final touch at 7 days. After 30 days, shift to win-back territory." },
              { t: "Test one variable at a time",               d: "When A/B testing automation sequences, change only the subject line, timing, or CTA — never multiple variables. Run each test for 500+ recipients." },
              { t: "Map triggers to customer intent",           d: "Browse abandonment = curiosity signal. Cart abandonment = strong purchase intent. Both need different urgency levels in messaging." },
              { t: "Unsubscribe is data, not defeat",           d: "Track unsubscribes by automation and look for patterns. A high unsubscribe in Step 2 means Step 1 over-promised. Adjust the expectation-setting." },
              { t: "Segment before automating at scale",        d: "Run any new automation on 10% of eligible audience first. Measure engagement before scaling to full audience. Protect your sender reputation." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>⚙️</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
