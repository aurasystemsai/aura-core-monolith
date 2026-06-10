import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/local-seo-toolkit";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "good" ? "#052e16" : c === "warn" ? "#3d2a0a" : c === "bad" ? "#3f1315" : "#27272a", color: c === "good" ? "#4ade80" : c === "warn" ? "#fbbf24" : c === "bad" ? "#f87171" : "#a1a1aa" }),
};

const TABS = [
  { id: "locations",  label: "Locations" },
  { id: "gmb",        label: "GMB Optimiser" },
  { id: "keywords",   label: "Local Keywords" },
  { id: "citations",  label: "Citation Guide" },
  { id: "guide",      label: "Local SEO Guide" },
];

const BUSINESS_CATEGORIES = ["Restaurant / Café", "Retail Shop", "Beauty Salon / Spa", "Medical / Dental", "Legal / Professional", "Home Services", "Fitness / Gym", "Automotive", "Education", "Hotel / Hospitality", "Other"];

const GMB_CHECKLIST = [
  { id: 1, item: "Profile claimed and verified",             points: 20, priority: "critical", tip: "Unverified profiles have significantly lower local ranking power." },
  { id: 2, item: "Business name exactly matches signage",    points: 5,  priority: "high",     tip: "Keyword-stuffed business names get penalised. Use your real business name." },
  { id: 3, item: "Primary category correctly selected",      points: 15, priority: "critical", tip: "This is the single most important category signal. Choose the most specific match." },
  { id: 4, item: "3+ secondary categories added",           points: 5,  priority: "medium",   tip: "Secondary categories help you rank for related searches." },
  { id: 5, item: "Complete address (no PO Box)",             points: 10, priority: "high",     tip: "Physical address required for local pack ranking." },
  { id: 6, item: "Phone number added and consistent with website", points: 5, priority: "high", tip: "NAP consistency is a core local ranking signal." },
  { id: 7, item: "Website URL linked",                       points: 5,  priority: "high",     tip: "Link to the most relevant page, not always the homepage." },
  { id: 8, item: "Business hours complete (including holidays)", points: 5, priority: "medium", tip: "Incomplete hours cause customers to call or leave." },
  { id: 9, item: "50+ photos uploaded (exterior, interior, products)", points: 10, priority: "high", tip: "Businesses with 100+ photos get 2,716% more direction requests." },
  { id: 10, item: "Business description written (750 chars)", points: 5, priority: "medium",   tip: "Use your primary keyword naturally in the first 250 characters." },
  { id: 11, item: "Products/services with prices added",     points: 5,  priority: "medium",   tip: "Adds content to your profile and appears in knowledge panel." },
  { id: 12, item: "Weekly Google Posts published",           points: 5,  priority: "medium",   tip: "Posts keep your profile fresh and show activity to Google." },
  { id: 13, item: "50+ Google reviews (4.5+ average)",      points: 10, priority: "high",     tip: "Reviews are a top-3 local ranking factor." },
  { id: 14, item: "Responding to all reviews (within 48h)",  points: 5,  priority: "high",     tip: "Response rate and speed are quality signals." },
  { id: 15, item: "Q&A section monitored and answered",      points: 5,  priority: "medium",   tip: "Pre-populate Q&A with common questions to control the narrative." },
];

export default function LocalSEOToolkit() {
  const [tab, setTab] = useState("locations");

  // Locations
  const [locations, setLocations]   = useState([]);
  const [locLoading, setLocLoading] = useState(false);
  const [newLoc, setNewLoc] = useState({ name: "", address: "", city: "", country: "UK", phone: "", website: "", category: "" });

  // GMB Optimiser
  const [gmbChecked, setGmbChecked] = useState({});
  const [selectedLocation, setSelectedLocation] = useState("");

  // Local Keywords
  const [kwCity, setKwCity]       = useState("");
  const [kwCategory, setKwCategory] = useState("");
  const [kwExtra, setKwExtra]     = useState("");
  const [kwResult, setKwResult]   = useState(null);
  const [kwLoading, setKwLoading] = useState(false);

  const [error, setError] = useState("");

  const fetchLocations = useCallback(async () => {
    setLocLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/locations`);
      if (r.ok) setLocations(r.locations || []);
    } catch {}
    setLocLoading(false);
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const createLocation = async () => {
    if (!newLoc.name.trim()) { setError("Business name required"); return; }
    setError("");
    try {
      await apiFetchJSON(`${API}/locations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLoc),
      });
      setNewLoc({ name: "", address: "", city: "", country: "UK", phone: "", website: "", category: "" });
      fetchLocations();
    } catch (e) { setError(e.message); }
  };

  const deleteLocation = async (id) => {
    try { await apiFetchJSON(`${API}/locations/${id}`, { method: "DELETE" }); fetchLocations(); } catch {}
  };

  const toggleGmb = (id) => setGmbChecked(p => ({ ...p, [id]: !p[id] }));
  const gmbScore = Object.entries(gmbChecked).filter(([, v]) => v).reduce((sum, [id]) => {
    const item = GMB_CHECKLIST.find(i => i.id === Number(id));
    return sum + (item ? item.points : 0);
  }, 0);
  const maxScore = GMB_CHECKLIST.reduce((s, i) => s + i.points, 0);
  const gmbPct   = Math.round((gmbScore / maxScore) * 100);
  const gmbGrade = gmbPct >= 90 ? "A" : gmbPct >= 75 ? "B" : gmbPct >= 60 ? "C" : gmbPct >= 40 ? "D" : "F";
  const gradeColor = { A: "#4ade80", B: "#86efac", C: "#fbbf24", D: "#f97316", F: "#f87171" };

  const runKeywords = async () => {
    if (!kwCity.trim() || !kwCategory.trim()) { setError("City and category are required"); return; }
    setKwLoading(true); setError(""); setKwResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: `Generate a comprehensive local SEO keyword list for a ${kwCategory} in ${kwCity}${kwExtra ? `. Additional context: ${kwExtra}` : ""}. Include: primary keywords, near-me variations, neighbourhood/district variations, service + location combos, long-tail question keywords. Format as a structured list with estimated search intent for each group.` }),
      });
      if (!r.ok) throw new Error(r.error || "Keyword generation failed");
      setKwResult(r.suggestion || r.result || "");
    } catch (e) { setError(e.message); }
    setKwLoading(false);
  };

  const napScore = (loc) => {
    let score = 0;
    if (loc.name)    score += 25;
    if (loc.address) score += 25;
    if (loc.phone)   score += 25;
    if (loc.website) score += 15;
    if (loc.city)    score += 10;
    return score;
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Local SEO Toolkit</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Dominate local search and 'near me' queries. Manage your business locations, audit Google Business Profile completeness, generate local keyword lists, and build citation authority.
        </p>
      </div>

      {locations.length > 0 && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Locations",       val: locations.length,                                              color: "#4f46e5" },
            { label: "Cities",          val: new Set(locations.map(l => l.city).filter(Boolean)).size,      color: "#818cf8" },
            { label: "GMB Score",       val: `${gmbPct}%`,                                                  color: gradeColor[gmbGrade] },
            { label: "NAP Complete",    val: locations.filter(l => napScore(l) >= 75).length,               color: "#4ade80" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
              <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
            </div>
          ))}
        </div>
      )}

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── LOCATIONS ── */}
      {tab === "locations" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Location</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 12 }}>
              {[
                ["name",    "Business Name *",  "The Coffee House"],
                ["address", "Street Address",   "12 High Street"],
                ["city",    "City",             "Manchester"],
                ["country", "Country",          "UK"],
                ["phone",   "Phone",            "+44 161 000 0000"],
                ["website", "Website URL",      "https://example.com"],
              ].map(([key, label, ph]) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>{label}</label>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newLoc[key]} onChange={e => setNewLoc(p => ({ ...p, [key]: e.target.value }))} placeholder={ph} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Business Category</label>
                <select style={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none", width: "100%" }} value={newLoc.category} onChange={e => setNewLoc(p => ({ ...p, category: e.target.value }))}>
                  <option value="">Select category…</option>
                  {BUSINESS_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button style={S.btn("primary")} onClick={createLocation}>Add Location</button>
          </div>

          {locLoading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : locations.length === 0 ? (
            <EmptyState icon="📍" title="No locations yet" description="Add your first business location above to start managing your local SEO." />
          ) : (
            locations.map((loc, i) => {
              const nap = napScore(loc);
              return (
                <div key={loc.id || i} style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{loc.name}</div>
                        {loc.category && <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{loc.category}</span>}
                        <span style={{ background: nap >= 75 ? "#052e16" : nap >= 50 ? "#3d2a0a" : "#3f1315", color: nap >= 75 ? "#4ade80" : nap >= 50 ? "#fbbf24" : "#f87171", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>NAP {nap}%</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#71717a" }}>{[loc.address, loc.city, loc.country].filter(Boolean).join(", ")}</div>
                      <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                        {loc.phone   && <span style={{ fontSize: 11, color: "#818cf8" }}>{loc.phone}</span>}
                        {loc.website && <span style={{ fontSize: 11, color: "#0ea5e9" }}>{loc.website}</span>}
                      </div>
                      {nap < 75 && (
                        <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 4 }}>
                          ⚠ Missing: {[!loc.address && "address", !loc.phone && "phone", !loc.website && "website", !loc.city && "city"].filter(Boolean).join(", ")}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 10 }}>
                      <button style={{ ...S.btn(), fontSize: 11, padding: "4px 8px" }} onClick={() => { setKwCity(loc.city || ""); setKwCategory(loc.category || ""); setTab("keywords"); }}>Keywords</button>
                      <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deleteLocation(loc.id)}>✕</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── GMB OPTIMISER ── */}
      {tab === "gmb" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
            <div style={{ textAlign: "center", background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: "16px 24px" }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: gradeColor[gmbGrade], lineHeight: 1 }}>{gmbGrade}</div>
              <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: 1 }}>GMB Grade</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: "#a1a1aa" }}>Profile completeness score</span>
                <span style={{ fontWeight: 700, color: gradeColor[gmbGrade] }}>{gmbScore} / {maxScore} pts ({gmbPct}%)</span>
              </div>
              <div style={{ background: "#27272a", borderRadius: 8, height: 12 }}>
                <div style={{ width: `${gmbPct}%`, background: gradeColor[gmbGrade], height: "100%", borderRadius: 8, transition: "width 0.4s" }} />
              </div>
              <div style={{ fontSize: 12, color: "#52525b", marginTop: 6 }}>
                {gmbPct < 60 ? "Critical gaps — address Priority items first" : gmbPct < 80 ? "Good foundation — complete High priority items to reach A grade" : "Strong profile — maintain with regular posts and review responses"}
              </div>
            </div>
          </div>

          {["critical", "high", "medium"].map(priority => {
            const items = GMB_CHECKLIST.filter(i => i.priority === priority);
            const color = priority === "critical" ? "#f87171" : priority === "high" ? "#fbbf24" : "#a1a1aa";
            const bg    = priority === "critical" ? "#3f1315" : priority === "high" ? "#3d2a0a" : "#27272a";
            return (
              <div key={priority} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ background: bg, color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{priority}</span>
                    <div style={S.sectionTitle}>{items.length} items</div>
                  </div>
                  <div style={{ fontSize: 11, color: "#52525b" }}>
                    {items.filter(i => gmbChecked[i.id]).length}/{items.length} done · {items.filter(i => gmbChecked[i.id]).reduce((s, i) => s + i.points, 0)} pts
                  </div>
                </div>
                {items.map(item => (
                  <div key={item.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid #1f1f22" }}>
                    <input type="checkbox" checked={!!gmbChecked[item.id]} onChange={() => toggleGmb(item.id)} style={{ accentColor: "#4f46e5", width: 16, height: 16, marginTop: 2, flexShrink: 0, cursor: "pointer" }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: gmbChecked[item.id] ? "#52525b" : "#e4e4e7", textDecoration: gmbChecked[item.id] ? "line-through" : "none" }}>{item.item}</div>
                      <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{item.tip}</div>
                    </div>
                    <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>+{item.points}pts</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── LOCAL KEYWORDS ── */}
      {tab === "keywords" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Local Keyword Generator</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
              Enter your city and business type. The AI generates a comprehensive local keyword list including 'near me' variations, neighbourhood modifiers, service combos, and long-tail question keywords — ready to use in your website copy, meta tags, and GMB profile.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>City / Area *</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={kwCity} onChange={e => setKwCity(e.target.value)} placeholder="e.g. Manchester, London Bridge, Leeds" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Business Type / Category *</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={kwCategory} onChange={e => setKwCategory(e.target.value)} placeholder="e.g. hair salon, coffee shop, plumber" />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Additional context (optional)</label>
              <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={kwExtra} onChange={e => setKwExtra(e.target.value)} placeholder="e.g. specialise in balayage, open 7 days, luxury market" />
            </div>
            <button style={S.btn("primary")} onClick={runKeywords} disabled={kwLoading || !kwCity.trim() || !kwCategory.trim()}>{kwLoading ? "Generating…" : "Generate Local Keywords"}</button>
          </div>

          {kwLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {kwResult && !kwLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>{kwCategory} Keywords — {kwCity}</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof kwResult === "string" ? kwResult : JSON.stringify(kwResult, null, 2))}>Copy All</button>
              </div>
              <pre style={S.pre}>{typeof kwResult === "string" ? kwResult : JSON.stringify(kwResult, null, 2)}</pre>
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Local Keyword Patterns — Examples</div>
            {[
              { type: "'Near me' variants",         ex: "hair salon near me, hairdresser near me, hair colouring near me" },
              { type: "City + service",              ex: "hair salon Manchester, Manchester hairdresser, hair salon in Manchester" },
              { type: "Neighbourhood + service",     ex: "Didsbury hair salon, Northern Quarter hairdresser, Chorlton hairstylist" },
              { type: "Service + city (reversed)",   ex: "balayage Manchester, highlights Leeds, keratin treatment London" },
              { type: "Question / intent keywords",  ex: "best hair salon Manchester, where to get balayage in Manchester" },
              { type: "Comparison keywords",         ex: "hair salon Manchester prices, affordable hairdresser Manchester" },
            ].map(({ type, ex }) => (
              <div key={type} style={S.row}>
                <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, flexShrink: 0, whiteSpace: "nowrap" }}>{type}</span>
                <div style={{ fontSize: 12, color: "#71717a", fontStyle: "italic" }}>{ex}</div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Where to Use Local Keywords</div>
            {[
              { loc: "Page Title (H1)",          imp: "Highest", ex: "Hair Salon Manchester | Balayage & Colour Specialists" },
              { loc: "Meta Description",          imp: "High",    ex: "Award-winning hair salon in Manchester. Expert balayage, highlights & cuts. Book online." },
              { loc: "GMB Business Description",  imp: "High",    ex: "Use primary keyword in first 250 characters" },
              { loc: "URL slug",                  imp: "Medium",  ex: "/hair-salon-manchester or /manchester-hairdresser" },
              { loc: "Image alt text",            imp: "Medium",  ex: "hair salon manchester interior" },
              { loc: "GMB Posts",                 imp: "Medium",  ex: "Include location + service in every weekly post" },
            ].map(({ loc, imp, ex }) => (
              <div key={loc} style={{ display: "grid", gridTemplateColumns: "160px auto 1fr", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22", fontSize: 12, alignItems: "center" }}>
                <span style={{ color: "#e4e4e7", fontWeight: 700 }}>{loc}</span>
                <span style={S.badge(imp === "Highest" ? "bad" : imp === "High" ? "warn" : "good")}>{imp}</span>
                <span style={{ color: "#71717a", fontStyle: "italic" }}>{ex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CITATION GUIDE ── */}
      {tab === "citations" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Top Citation Sources (UK & Global)</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Citations are online mentions of your business Name, Address, and Phone (NAP). Consistency across all sources is critical — even small variations hurt local rankings.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[
                ["Google Business Profile", "Priority"], ["Apple Maps", "Priority"], ["Bing Places", "Priority"],
                ["Facebook", "Priority"],                ["Yelp", "High"],           ["Foursquare", "High"],
                ["Yell.com (UK)", "High"],               ["Thomson Local (UK)", "High"], ["Yellow Pages", "High"],
                ["Trustpilot", "High"],                  ["Hotfrog", "Medium"],      ["Checkatrade (UK)", "Medium"],
                ["192.com (UK)", "Medium"],              ["Cylex", "Medium"],        ["Scoot (UK)", "Medium"],
                ["TouchLocal (UK)", "Medium"],           ["FreeIndex (UK)", "Low"],  ["Brownbook", "Low"],
              ].map(([name, pri], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                  <span style={{ color: "#e4e4e7" }}>{name}</span>
                  <span style={S.badge(pri === "Priority" ? "bad" : pri === "High" ? "warn" : "good")}>{pri}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>NAP Consistency Rules</div>
            {[
              { t: "Use exact same business name everywhere",    d: "Exact match: 'The Coffee House Ltd'. Not 'Coffee House' on one directory and 'The Coffee House Ltd' on another. Google compares these." },
              { t: "Format phone number identically",           d: "Pick one format (+44 7700 900000 or 07700 900000) and use it everywhere. Spaces and dashes must also be consistent." },
              { t: "Use your permanent business address",       d: "P.O. boxes won't rank. If you move, update all citations within 48 hours. Outdated addresses are a ranking killer." },
              { t: "Audit citations quarterly",                 d: "Use BrightLocal or Whitespark to find inconsistent or duplicate citations. Remove duplicates, correct inconsistencies proactively." },
              { t: "Match your GMB address exactly on website", d: "The address in your GMB profile and on your website Contact page must be character-for-character identical." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5" }}>📋</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── LOCAL SEO GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Local SEO Ranking Factors (by Impact)</div>
            {[
              { rank: 1, factor: "Google Business Profile completeness & activity", impact: "Highest", d: "Complete every field. Post weekly. Add photos monthly. Enable Q&A. Enable messaging." },
              { rank: 2, factor: "Proximity to searcher",                            impact: "High",    d: "Can't be fully controlled, but a genuine local address in the target city is essential. P.O. box won't rank." },
              { rank: 3, factor: "Review quantity, quality & recency",               impact: "High",    d: "Target 4.5+ stars with 100+ reviews. Respond to every review. Aim for 2+ new reviews/month." },
              { rank: 4, factor: "Local keyword signals on website",                 impact: "High",    d: "City name in page title, H1, meta description, and body. Create location-specific landing pages for each city." },
              { rank: 5, factor: "Citation consistency (NAP)",                       impact: "Medium",  d: "Consistent Name, Address, Phone across 50+ directories signals legitimacy to Google." },
              { rank: 6, factor: "Local link building",                              impact: "Medium",  d: "Links from local news sites, chambers of commerce, and local bloggers boost local authority specifically." },
              { rank: 7, factor: "Behavioural signals",                              impact: "Medium",  d: "High CTR from search results, direction requests, and calls from GMB all signal relevance." },
            ].map(({ rank, factor, impact, d }) => (
              <div key={rank} style={S.row}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#4f46e5", minWidth: 30 }}>#{rank}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{factor}</span>
                    <span style={S.badge(impact === "Highest" ? "bad" : impact === "High" ? "warn" : "good")}>{impact}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
