import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/local-seo-toolkit";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "good" ? "#052e16" : c === "warn" ? "#3d2a0a" : c === "bad" ? "#3f1315" : "#27272a", color: c === "good" ? "#4ade80" : c === "warn" ? "#fbbf24" : c === "bad" ? "#f87171" : "#a1a1aa" }),
};

const TABS = [
  { id: "overview",   label: "Overview" },
  { id: "locations",  label: "Locations" },
  { id: "suggest",    label: "AI Suggest" },
  { id: "citations",  label: "Citation Guide" },
  { id: "guide",      label: "Local SEO Guide" },
];

export default function LocalSEOToolkit() {
  const [tab, setTab]               = useState("overview");
  const [locations, setLocations]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // New location form
  const [newLoc, setNewLoc] = useState({ name: "", address: "", city: "", country: "", phone: "", website: "", category: "" });
  const [editId, setEditId] = useState(null);

  // AI suggest
  const [suggestInput, setSuggestInput] = useState("");
  const [suggestion, setSuggestion]     = useState("");
  const [suggestLoading, setSuggestLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/locations`);
      if (r.ok) setLocations(r.locations || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const createLocation = async () => {
    if (!newLoc.name.trim()) return;
    try {
      await apiFetchJSON(`${API}/locations`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLoc),
      });
      setNewLoc({ name: "", address: "", city: "", country: "", phone: "", website: "", category: "" });
      fetchLocations();
    } catch (e) { setError(e.message); }
  };

  const deleteLocation = async (id) => {
    try { await apiFetchJSON(`${API}/locations/${id}`, { method: "DELETE" }); fetchLocations(); } catch {}
  };

  const runSuggest = async () => {
    if (!suggestInput.trim()) return;
    setSuggestLoading(true); setSuggestion(""); setError("");
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: suggestInput }),
      });
      if (!r.ok) throw new Error(r.error || "Suggestion failed");
      setSuggestion(r.suggestion || "");
    } catch (e) { setError(e.message); }
    setSuggestLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Local SEO Toolkit</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Manage your Google Business Profile listings, build local citations, track local rankings and dominate 'near me' searches. Essential for Shopify stores with physical locations.</p>
      </div>

      {locations.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Locations",    value: locations.length,             color: "#4f46e5" },
            { label: "Cities",       value: new Set(locations.map(l => l.city).filter(Boolean)).size, color: "#818cf8" },
            { label: "With Website", value: locations.filter(l => l.website).length, color: "#4ade80" },
            { label: "With Phone",   value: locations.filter(l => l.phone).length,   color: "#0ea5e9" },
          ].map(m => (
            <div key={m.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      <ErrorBox message={error} />

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {locations.length === 0 ? (
              <div style={S.card}>
                <EmptyState icon="📍" title="No locations added yet" description="Go to Locations tab to add your business locations, then use AI Suggest to get tailored local SEO recommendations." />
                <button style={{ ...S.btn("primary"), marginTop: 12 }} onClick={() => setTab("locations")}>Add First Location →</button>
              </div>
            ) : (
              <div style={S.card}>
                <div style={S.sectionTitle}>Your Locations</div>
                {locations.slice(0, 5).map((loc, i) => (
                  <div key={i} style={S.row}>
                    <span style={{ color: "#4f46e5", fontSize: 16 }}>📍</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{loc.name}</div>
                      <div style={{ fontSize: 11, color: "#52525b" }}>{[loc.address, loc.city, loc.country].filter(Boolean).join(", ")}</div>
                    </div>
                    {loc.category && <span style={S.badge()}>{loc.category}</span>}
                  </div>
                ))}
                {locations.length > 5 && <div style={{ fontSize: 12, color: "#52525b", textAlign: "center", marginTop: 8 }}>+{locations.length - 5} more</div>}
              </div>
            )}
            <div style={S.card}>
              <div style={S.sectionTitle}>Local SEO Quick Wins</div>
              {[
                { t: "Claim & verify Google Business Profile", s: "bad" },
                { t: "Ensure NAP consistency (Name, Address, Phone)", s: "warn" },
                { t: "Add 10+ product/service photos", s: "warn" },
                { t: "Build 50+ local citations", s: "warn" },
                { t: "Respond to all Google reviews", s: "bad" },
                { t: "Add local schema markup to website", s: "bad" },
                { t: "Post weekly on Google Business Profile", s: "warn" },
              ].map(({ t, s }, i) => (
                <div key={i} style={S.row}>
                  <span style={{ color: s === "bad" ? "#f87171" : "#fbbf24", fontSize: 13 }}>{s === "bad" ? "✗" : "△"}</span>
                  <span style={{ fontSize: 13, color: "#e4e4e7" }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LOCATIONS */}
      {tab === "locations" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Location</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 10 }}>
              <input style={S.input} value={newLoc.name} onChange={e => setNewLoc(p => ({ ...p, name: e.target.value }))} placeholder="Business name *" />
              <input style={S.input} value={newLoc.address} onChange={e => setNewLoc(p => ({ ...p, address: e.target.value }))} placeholder="Street address" />
              <input style={S.input} value={newLoc.city} onChange={e => setNewLoc(p => ({ ...p, city: e.target.value }))} placeholder="City" />
              <input style={S.input} value={newLoc.country} onChange={e => setNewLoc(p => ({ ...p, country: e.target.value }))} placeholder="Country" />
              <input style={S.input} value={newLoc.phone} onChange={e => setNewLoc(p => ({ ...p, phone: e.target.value }))} placeholder="Phone number" />
              <input style={S.input} value={newLoc.website} onChange={e => setNewLoc(p => ({ ...p, website: e.target.value }))} placeholder="Website URL" />
              <input style={S.input} value={newLoc.category} onChange={e => setNewLoc(p => ({ ...p, category: e.target.value }))} placeholder="Business category" />
            </div>
            <button style={S.btn("primary")} onClick={createLocation}>Add Location</button>
          </div>

          {loading ? <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div> : (
            locations.length === 0 ? (
              <EmptyState icon="📍" title="No locations yet" description="Add your first business location above." />
            ) : (
              <div style={S.card}>
                <div style={S.sectionTitle}>{locations.length} Location{locations.length !== 1 ? "s" : ""}</div>
                {locations.map((loc, i) => (
                  <div key={i} style={{ ...S.row, alignItems: "center" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{loc.name}</div>
                      <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{[loc.address, loc.city, loc.country].filter(Boolean).join(", ")}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                        {loc.phone && <span style={{ fontSize: 11, color: "#818cf8" }}>{loc.phone}</span>}
                        {loc.website && <a href={loc.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#0ea5e9" }}>{loc.website}</a>}
                        {loc.category && <span style={S.badge()}>{loc.category}</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setSuggestInput(`Business: ${loc.name}, ${loc.category || ""}, located in ${loc.city || ""}`); setTab("suggest"); }}>AI Tips</button>
                      <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteLocation(loc.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* AI SUGGEST */}
      {tab === "suggest" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Local SEO Suggestions</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Describe your business, location, and local SEO goals. The AI will provide tailored local SEO recommendations, keyword strategies, and Google Business Profile optimisation tips.</p>
            <textarea style={{ ...S.ta, minHeight: 140 }} value={suggestInput} onChange={e => setSuggestInput(e.target.value)} placeholder="e.g. Beauty salon in Manchester UK, targeting 'hair salon near me' searches, have 3 locations, currently ranking page 3 for local terms…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={runSuggest} disabled={suggestLoading || !suggestInput.trim()}>{suggestLoading ? "Generating…" : "Get AI Suggestions"}</button>
            </div>
          </div>
          {suggestLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>}
          {suggestion && !suggestLoading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>AI Recommendations</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(suggestion)}>Copy</button>
              </div>
              <pre style={S.pre}>{suggestion}</pre>
            </div>
          )}
        </div>
      )}

      {/* CITATION GUIDE */}
      {tab === "citations" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Top Citation Sources (UK & US)</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Citations are online mentions of your business Name, Address, and Phone (NAP). Consistency across all sources is critical — even small variations hurt local rankings.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
              {[
                ["Google Business Profile", "Priority"],
                ["Apple Maps", "Priority"],
                ["Bing Places", "Priority"],
                ["Facebook", "Priority"],
                ["Yelp", "High"],
                ["Foursquare", "High"],
                ["Yell.com (UK)", "High"],
                ["Thomson Local (UK)", "High"],
                ["Yellow Pages", "High"],
                ["Hotfrog", "Medium"],
                ["Trustpilot", "High"],
                ["Checkatrade (UK)", "Medium"],
                ["192.com (UK)", "Medium"],
                ["Cylex", "Medium"],
              ].map(([name, pri], i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                  <span style={{ color: "#e4e4e7" }}>{name}</span>
                  <span style={S.badge(pri === "Priority" ? "bad" : pri === "High" ? "warn" : "good")}>{pri}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>NAP Consistency Checklist</div>
            {[
              { t: "Use exact same business name everywhere", d: "E.g., 'The Coffee House Ltd' not 'Coffee House' on one directory and 'The Coffee House' on another." },
              { t: "Format phone number consistently", d: "Choose one format (+44 7700 900000 or 07700 900000) and use it identically everywhere." },
              { t: "Use a permanent address", d: "If you move, immediately update all citation sources. Outdated addresses are a ranking killer." },
              { t: "Audit citations quarterly", d: "Use BrightLocal or Whitespark to find inconsistent citations and correct them proactively." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5" }}>📋</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GUIDE */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Local SEO Ranking Factors (Ranked by Impact)</div>
            {[
              { rank: 1, factor: "Google Business Profile completeness & activity", impact: "Highest", d: "Complete every field. Post weekly. Add photos monthly. Enable Q&A. Enable messaging." },
              { rank: 2, factor: "Proximity to searcher", impact: "High", d: "You can't fully control this, but having a genuine local address (not P.O. box) in the target city is essential." },
              { rank: 3, factor: "Review quantity, quality & recency", impact: "High", d: "Aim for 4.5+ stars with 100+ reviews. Respond to every review. Recency matters — aim for 2+ new reviews/month." },
              { rank: 4, factor: "Local keyword signals on website", impact: "High", d: "Include city name in page title, H1, meta description, and body copy. Create location-specific landing pages." },
              { rank: 5, factor: "Citation consistency (NAP)", impact: "Medium", d: "Consistent Name, Address, Phone across 50+ directories signals legitimacy to Google." },
              { rank: 6, factor: "Local link building", impact: "Medium", d: "Links from local news sites, chambers of commerce, and local bloggers boost local authority." },
              { rank: 7, factor: "Behavioural signals", impact: "Medium", d: "High click-through rate from search results, directions requests, and calls from Google Business Profile." },
            ].map(({ rank, factor, impact, d }) => (
              <div key={rank} style={S.row}>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#4f46e5", minWidth: 30 }}>#{rank}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 2 }}>
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

