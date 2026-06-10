import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/customer-data-platform";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 16px" },
};

const TABS = [
  { id: "profiles",  label: "Profiles" },
  { id: "segments",  label: "Segments" },
  { id: "events",    label: "Events & Funnels" },
  { id: "guide",     label: "CDP Guide" },
];

const SEGMENT_CONDITIONS = [
  "Total orders > 3",
  "Total spend > $500",
  "Last order within 30 days",
  "No purchase in 60+ days",
  "Average order value > $100",
  "First purchase in last 7 days",
  "Repeat customer",
  "High LTV (top 20%)",
];

const FUNNEL_TEMPLATES = [
  { name: "Purchase Funnel",  steps: ["page_view", "product_view", "add_to_cart", "checkout", "purchase"] },
  { name: "Email Conversion", steps: ["email_sent", "email_opened", "email_clicked", "purchase"] },
  { name: "Loyalty Funnel",   steps: ["purchase", "review_submitted", "repeat_purchase", "referral"] },
];

const PROFILE_SOURCES = ["Manual", "Shopify Import", "Email Sign-up", "Loyalty Programme", "API"];

export default function CustomerDataPlatform() {
  const [tab, setTab] = useState("profiles");

  // Profiles
  const [profiles, setProfiles]           = useState([]);
  const [profileSearch, setProfileSearch] = useState("");
  const [selectedProfile, setSelected]   = useState(null);
  const [profileTimeline, setTimeline]   = useState([]);
  const [newProfile, setNewProfile]      = useState({ email: "", name: "", source: "Manual" });
  const setNP = (k, v) => setNewProfile(p => ({ ...p, [k]: v }));

  // Segments
  const [segments, setSegments]     = useState([]);
  const [newSeg, setNewSeg]         = useState({ name: "", description: "", conditions: [] });

  // Events
  const [eventStats, setEventStats]     = useState(null);
  const [funnelTpl, setFunnelTpl]       = useState(0);
  const [funnelResult, setFunnelResult] = useState(null);
  const [funnelLoading, setFunnelLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => { loadProfiles(); loadSegments(); loadEventStats(); }, []);

  const loadProfiles = async (search) => {
    setLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/profiles/search`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters: search ? { query: search } : {}, options: { limit: 50 } }),
      });
      if (r.profiles) setProfiles(r.profiles);
      else if (Array.isArray(r)) setProfiles(r);
      else setProfiles([]);
    } catch {
      try {
        const r2 = await apiFetchJSON(`${API}/profiles`);
        setProfiles(r2.profiles || (Array.isArray(r2) ? r2 : []));
      } catch { setProfiles([]); }
    }
    setLoading(false);
  };

  const loadSegments = async () => {
    try {
      const r = await apiFetchJSON(`${API}/segments`);
      setSegments(r.segments || (Array.isArray(r) ? r : []));
    } catch {}
  };

  const loadEventStats = async () => {
    try {
      const r = await apiFetchJSON(`${API}/events/stats`);
      if (r && r.ok !== false) setEventStats(r);
    } catch {}
  };

  const loadTimeline = async (id) => {
    setTimeline([]);
    try {
      const r = await apiFetchJSON(`${API}/profiles/${id}/timeline`);
      setTimeline(r.events || r.timeline || (Array.isArray(r) ? r : []));
    } catch { setTimeline([]); }
  };

  const createProfile = async () => {
    if (!newProfile.email.trim()) { setError("Email is required"); return; }
    setError(""); setSaving(true);
    try {
      await apiFetchJSON(`${API}/profiles`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile),
      });
      setNewProfile({ email: "", name: "", source: "Manual" });
      loadProfiles(profileSearch);
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const deleteProfile = async (id) => {
    try {
      await apiFetchJSON(`${API}/profiles/${id}`, { method: "DELETE" });
      setProfiles(p => p.filter(pr => pr.id !== id));
      if (selectedProfile?.id === id) setSelected(null);
    } catch (e) { setError(e.message); }
  };

  const viewProfile = (p) => { setSelected(p); loadTimeline(p.id); };

  const createSegment = async () => {
    if (!newSeg.name.trim()) { setError("Segment name required"); return; }
    setError(""); setSaving(true);
    try {
      await apiFetchJSON(`${API}/segments`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSeg),
      });
      setNewSeg({ name: "", description: "", conditions: [] });
      loadSegments();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const deleteSegment = async (id) => {
    try {
      await apiFetchJSON(`${API}/segments/${id}`, { method: "DELETE" });
      setSegments(p => p.filter(s => s.id !== id));
    } catch {}
  };

  const toggleCondition = (c) => setNewSeg(p => ({
    ...p,
    conditions: p.conditions.includes(c) ? p.conditions.filter(x => x !== c) : [...p.conditions, c],
  }));

  const runFunnel = async () => {
    const tmpl = FUNNEL_TEMPLATES[funnelTpl];
    setFunnelLoading(true); setFunnelResult(null); setError("");
    try {
      const r = await apiFetchJSON(`${API}/events/funnel`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steps: tmpl.steps }),
      });
      setFunnelResult(r);
    } catch (e) { setError(e.message); }
    setFunnelLoading(false);
  };

  const statKeys = eventStats ? Object.entries(eventStats).filter(([k]) => k !== "ok" && typeof eventStats[k] !== "object") : [];

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Customer Data Platform</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Unified customer profiles, behavioural events, dynamic segments, and funnel analysis — the single source of truth for all customer intelligence.
        </p>
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── PROFILES ── */}
      {tab === "profiles" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Profile</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input style={{ ...S.input, flex: 2 }} value={newProfile.email} onChange={e => setNP("email", e.target.value)} placeholder="Email address *" />
              <input style={S.input}                  value={newProfile.name}  onChange={e => setNP("name",  e.target.value)} placeholder="Full name" />
              <select style={S.select} value={newProfile.source} onChange={e => setNP("source", e.target.value)}>
                {PROFILE_SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button style={S.btn("primary")} onClick={createProfile} disabled={saving}>
                {saving ? "Saving…" : "Add Profile"}
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            <input
              style={S.input}
              value={profileSearch}
              onChange={e => setProfileSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && loadProfiles(profileSearch)}
              placeholder="Search by email or name…"
            />
            <button style={S.btn()} onClick={() => loadProfiles(profileSearch)}>Search</button>
            {profileSearch && <button style={S.btn()} onClick={() => { setProfileSearch(""); loadProfiles(); }}>Clear</button>}
            <div style={{ fontSize: 13, color: "#71717a", alignSelf: "center", marginLeft: "auto" }}>
              {profiles.length} profile{profiles.length !== 1 ? "s" : ""}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spinner size={36} /></div>
          ) : selectedProfile ? (
            <div>
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#fafafa" }}>{selectedProfile.name || "Unknown"}</h2>
                    <div style={{ fontSize: 13, color: "#818cf8", marginTop: 2 }}>{selectedProfile.email}</div>
                    {selectedProfile.source && (
                      <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11, marginTop: 4, display: "inline-block" }}>
                        {selectedProfile.source}
                      </span>
                    )}
                  </div>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 12px" }} onClick={() => setSelected(null)}>← Back to Profiles</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                  {[
                    { label: "Total Orders",      val: selectedProfile.totalOrders },
                    { label: "Total Spend",        val: selectedProfile.totalSpend != null ? `$${Number(selectedProfile.totalSpend).toFixed(2)}` : null },
                    { label: "Lifetime Value",     val: selectedProfile.ltv != null ? `$${Number(selectedProfile.ltv).toFixed(2)}` : null },
                    { label: "Avg Order Value",    val: selectedProfile.avgOrderValue != null ? `$${Number(selectedProfile.avgOrderValue).toFixed(2)}` : null },
                    { label: "Days Since Order",   val: selectedProfile.daysSinceLastOrder },
                    { label: "Churn Risk",         val: selectedProfile.churnRisk },
                  ].filter(m => m.val != null).map(({ label, val }) => (
                    <div key={label} style={S.metricCard}>
                      <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#4f46e5", marginTop: 4 }}>{String(val)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={S.card}>
                <div style={S.sectionTitle}>Activity Timeline ({profileTimeline.length} events)</div>
                {profileTimeline.length === 0 ? (
                  <EmptyState icon="📋" title="No events yet" description="Events appear here as this customer interacts with your store." />
                ) : (
                  profileTimeline.slice(0, 30).map((ev, i) => (
                    <div key={i} style={S.row}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4f46e5", marginTop: 5, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{ev.type || ev.event || ev.eventType}</div>
                        {ev.properties && typeof ev.properties === "object" && (
                          <div style={{ fontSize: 11, color: "#71717a", fontFamily: "monospace" }}>
                            {JSON.stringify(ev.properties).slice(0, 100)}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#52525b", flexShrink: 0 }}>
                        {ev.timestamp ? new Date(ev.timestamp).toLocaleString() : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : profiles.length === 0 ? (
            <EmptyState icon="👤" title="No profiles found" description="Add profiles manually or they will be created automatically from Shopify orders." />
          ) : (
            profiles.map((p, i) => (
              <div key={p.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={() => viewProfile(p)}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{p.name || p.email || "Unknown"}</div>
                    {p.email && p.name && <div style={{ fontSize: 12, color: "#71717a" }}>{p.email}</div>}
                    <div style={{ display: "flex", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
                      {p.totalOrders != null && <span style={{ fontSize: 11, color: "#71717a" }}>Orders: {p.totalOrders}</span>}
                      {p.totalSpend   != null && <span style={{ fontSize: 11, color: "#71717a" }}>Spend: ${Number(p.totalSpend).toFixed(2)}</span>}
                      {p.ltv          != null && <span style={{ fontSize: 11, color: "#4ade80" }}>LTV: ${Number(p.ltv).toFixed(2)}</span>}
                      {p.source && (
                        <span style={{ background: "#27272a", color: "#a1a1aa", padding: "1px 7px", borderRadius: 4, fontSize: 11 }}>{p.source}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => viewProfile(p)}>Timeline</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteProfile(p.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── SEGMENTS ── */}
      {tab === "segments" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Create Segment</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <input style={{ ...S.input, flex: 2 }} value={newSeg.name}        onChange={e => setNewSeg(p => ({ ...p, name: e.target.value }))}        placeholder="Segment name (e.g. High-Value Champions) *" />
              <input style={S.input}                  value={newSeg.description} onChange={e => setNewSeg(p => ({ ...p, description: e.target.value }))} placeholder="Description (optional)" />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#71717a", marginBottom: 6 }}>CONDITIONS — click to toggle</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {SEGMENT_CONDITIONS.map(c => (
                  <button
                    key={c}
                    style={{ ...S.btn(newSeg.conditions.includes(c) ? "primary" : null), fontSize: 11, padding: "4px 10px" }}
                    onClick={() => toggleCondition(c)}
                  >
                    {newSeg.conditions.includes(c) ? "✓ " : ""}{c}
                  </button>
                ))}
              </div>
              {newSeg.conditions.length > 0 && (
                <div style={{ background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#c7d2fe" }}>
                  Rule: {newSeg.conditions.join(" AND ")}
                </div>
              )}
            </div>
            <button style={S.btn("primary")} onClick={createSegment} disabled={saving || !newSeg.name.trim()}>
              {saving ? "Creating…" : "Create Segment"}
            </button>
          </div>

          <div style={{ fontSize: 13, color: "#71717a", marginBottom: 14 }}>{segments.length} segment{segments.length !== 1 ? "s" : ""}</div>

          {segments.length === 0 ? (
            <div>
              <EmptyState icon="🎯" title="No segments yet" description="Create your first segment to group customers by behaviour and value." />
              <div style={{ ...S.card, marginTop: 16 }}>
                <div style={S.sectionTitle}>RFM Framework — Proven Segment Types</div>
                {[
                  { name: "Champions",           desc: "Bought recently, buy often, spend the most",     bg: "#052e16", fg: "#4ade80" },
                  { name: "Loyal Customers",     desc: "Buy regularly, responded to recent promotions",  bg: "#1e3a5f", fg: "#60a5fa" },
                  { name: "Potential Loyalists", desc: "Recent customers, bought once or twice",         bg: "#1e1b4b", fg: "#818cf8" },
                  { name: "At Risk",             desc: "Above-average customers who haven't bought recently", bg: "#3d2a0a", fg: "#fbbf24" },
                  { name: "Hibernating",         desc: "Last purchased long ago, low spend, low frequency",   bg: "#27272a", fg: "#a1a1aa" },
                  { name: "Lost",                desc: "Lowest recency, frequency, and monetary scores",      bg: "#3f1315", fg: "#f87171" },
                ].map(seg => (
                  <div key={seg.name} style={S.row}>
                    <span style={{ background: seg.bg, color: seg.fg, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0, minWidth: 130, textAlign: "center" }}>{seg.name}</span>
                    <span style={{ fontSize: 12, color: "#a1a1aa" }}>{seg.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            segments.map((seg, i) => (
              <div key={seg.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{seg.name}</div>
                    {seg.description && <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{seg.description}</div>}
                    {Array.isArray(seg.conditions) && seg.conditions.length > 0 && (
                      <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {seg.conditions.map(c => (
                          <span key={c} style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{c}</span>
                        ))}
                      </div>
                    )}
                    {seg.count != null && (
                      <div style={{ fontSize: 12, color: "#52525b", marginTop: 6 }}>{seg.count} customers in segment</div>
                    )}
                    {seg.createdAt && (
                      <div style={{ fontSize: 11, color: "#3f3f46", marginTop: 2 }}>Created {new Date(seg.createdAt).toLocaleDateString()}</div>
                    )}
                  </div>
                  <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteSegment(seg.id)}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── EVENTS & FUNNELS ── */}
      {tab === "events" && (
        <div style={{ marginTop: 20 }}>
          {statKeys.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
              {statKeys.map(([k, v]) => (
                <div key={k} style={S.metricCard}>
                  <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {k.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#4f46e5", marginTop: 4 }}>
                    {typeof v === "number" ? v.toLocaleString() : String(v)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Conversion Funnel Analysis</div>
            <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, marginBottom: 14 }}>
              Select a funnel template and run analysis to see conversion rates at every step of your customer journey.
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {FUNNEL_TEMPLATES.map((t, i) => (
                <button key={t.name} style={S.btn(i === funnelTpl ? "primary" : null)} onClick={() => setFunnelTpl(i)}>{t.name}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {FUNNEL_TEMPLATES[funnelTpl].steps.map((step, i) => (
                <React.Fragment key={step}>
                  <span style={{ background: "#1e1b4b", color: "#c7d2fe", padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                    {step}
                  </span>
                  {i < FUNNEL_TEMPLATES[funnelTpl].steps.length - 1 && (
                    <span style={{ color: "#52525b", fontSize: 16 }}>→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
            <button style={S.btn("primary")} onClick={runFunnel} disabled={funnelLoading}>
              {funnelLoading ? "Analysing…" : "Run Funnel Analysis"}
            </button>
            {funnelLoading && <div style={{ marginTop: 16 }}><Spinner size={28} /></div>}
            {funnelResult && !funnelLoading && (
              <div style={{ marginTop: 16 }}>
                {Array.isArray(funnelResult.steps || funnelResult) ? (
                  (funnelResult.steps || funnelResult).map((step, i) => {
                    const pct = step.rate ?? step.pct ?? step.conversionRate ?? 0;
                    return (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #1f1f22" }}>
                        <span style={{ minWidth: 160, fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{step.step || step.name || step.event}</span>
                        <div style={{ flex: 1, background: "#09090b", borderRadius: 4, height: 8, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "#4f46e5", borderRadius: 4 }} />
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#818cf8", minWidth: 48, textAlign: "right" }}>{pct}%</span>
                        {step.users != null && <span style={{ fontSize: 11, color: "#52525b" }}>{step.users} users</span>}
                      </div>
                    );
                  })
                ) : (
                  <pre style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 16px", fontSize: 12, color: "#e4e4e7", whiteSpace: "pre-wrap" }}>
                    {JSON.stringify(funnelResult, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Standard Event Schema</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14 }}>
              Instrument these events from your storefront and Shopify webhooks to power funnel analysis and profile timelines.
            </p>
            {[
              { type: "page_view",        props: "url, referrer, session_id",         desc: "User views any page" },
              { type: "product_view",     props: "product_id, title, price",          desc: "User views a product detail page" },
              { type: "add_to_cart",      props: "product_id, quantity, price",       desc: "Item added to cart" },
              { type: "checkout",         props: "cart_value, item_count",            desc: "Checkout initiated" },
              { type: "purchase",         props: "order_id, revenue, items[]",        desc: "Order completed successfully" },
              { type: "email_opened",     props: "campaign_id, subject",             desc: "Marketing email opened" },
              { type: "email_clicked",    props: "campaign_id, url",                 desc: "Link clicked in marketing email" },
              { type: "review_submitted", props: "product_id, rating, sentiment",    desc: "Customer review submitted" },
              { type: "repeat_purchase",  props: "order_id, days_since_first",       desc: "Customer purchases for 2nd+ time" },
            ].map(({ type, props, desc }) => (
              <div key={type} style={{ display: "grid", gridTemplateColumns: "160px 240px 1fr", gap: 8, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                <code style={{ color: "#818cf8", fontFamily: "monospace", fontWeight: 600 }}>{type}</code>
                <code style={{ color: "#71717a", fontFamily: "monospace", fontSize: 11 }}>{props}</code>
                <span style={{ color: "#a1a1aa" }}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>CDP Architecture for E-Commerce</div>
            {[
              { t: "First-party data is your moat",           d: "iOS 14+, cookie deprecation, and GDPR mean third-party data is declining in value. Your own customer data — purchase history, email engagement, site behaviour — is the key competitive differentiator for the next decade." },
              { t: "Build unified profiles from day one",     d: "A customer who emails support, browses your site, buys, and leaves a review creates data in 4 different systems. Unifying these into one profile enables true personalisation at scale." },
              { t: "RFM is the foundation of every CDP",      d: "Recency × Frequency × Monetary. These three dimensions predict 80% of customer behaviour. Segment by RFM first before building any other sophistication. Champions: high all three. At risk: declining recency." },
              { t: "Events beat surveys for predicting behaviour", d: "What customers DO (viewed product 3 times, abandoned cart twice) predicts future behaviour better than what they SAY in surveys. Instrument every key touchpoint in your customer journey." },
              { t: "Segment size vs segment depth trade-off", d: "Narrow segments (e.g. UK customers with LTV > £500 who haven't bought in 45 days) enable hyper-personalised campaigns but require large customer bases to be statistically valid. Start broad, narrow over time." },
              { t: "Data quality over data volume",           d: "1,000 clean profiles with complete purchase history are worth more than 100,000 records with 40% invalid emails. Audit your data quality quarterly — check for duplicate emails, missing order values, and stale profiles." },
              { t: "Privacy by design, not compliance checkbox", d: "Build consent tracking, data deletion (right to erasure), and portability from the start. GDPR/CCPA fines start at €20M or 4% of global revenue. Customer trust in data handling is worth far more." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>📊</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>CDP Maturity Model</div>
            {[
              { level: "Level 1 — Data Collection",     desc: "Basic profile creation from orders and email sign-ups. Shopify order data imported. Manual segmentation.", color: "#3f3f46" },
              { level: "Level 2 — Unified Profiles",    desc: "Cross-channel profile merging. Behavioural events tracked. Automatic segment refresh.", color: "#1e3a5f" },
              { level: "Level 3 — Predictive Insights", desc: "LTV prediction, churn risk scoring, next-best-action recommendations powered by ML models.", color: "#1e1b4b" },
              { level: "Level 4 — Real-Time Activation", desc: "Sub-second personalisation, live funnel analysis, automatic campaign triggering based on customer state changes.", color: "#052e16" },
            ].map(({ level, desc, color }) => (
              <div key={level} style={{ background: color, border: "1px solid #27272a", borderRadius: 8, padding: "12px 16px", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fafafa", marginBottom: 4 }}>{level}</div>
                <div style={{ fontSize: 12, color: "#a1a1aa" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
