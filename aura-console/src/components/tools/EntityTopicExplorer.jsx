import { useState } from "react";
import { apiFetchJSON } from "../../api";

const accent = "#8b5cf6";
const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "Inter,sans-serif", padding: "32px" },
  header: { marginBottom: 28 },
  title: { fontSize: 28, fontWeight: 700, margin: 0 },
  subtitle: { color: "#a1a1aa", fontSize: 14, marginTop: 6 },
  tabBar: { display: "flex", gap: 4, marginBottom: 4, borderBottom: "1px solid #27272a", overflowX: "auto" },
  subTabBar: { display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" },
  tab: (a) => ({ padding: "10px 16px", cursor: "pointer", border: "none", background: "none", color: a ? "#fafafa" : "#71717a", fontWeight: a ? 700 : 400, fontSize: 13, borderBottom: a ? "2px solid " + accent : "2px solid transparent", whiteSpace: "nowrap", marginBottom: -1 }),
  subTab: (a) => ({ padding: "7px 14px", cursor: "pointer", border: "none", background: a ? accent + "22" : "transparent", color: a ? accent : "#71717a", fontWeight: a ? 600 : 400, fontSize: 12, borderRadius: 6, whiteSpace: "nowrap" }),
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 12, padding: 24, marginBottom: 20 },
  cardSm: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, marginBottom: 12 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  grid4: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16 },
  label: { display: "block", color: "#a1a1aa", fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" },
  input: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  select: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, boxSizing: "border-box" },
  textarea: { width: "100%", background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 12px", color: "#fafafa", fontSize: 14, minHeight: 90, boxSizing: "border-box", resize: "vertical" },
  btn: (c) => ({ padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14, background: c || accent, color: "#fff" }),
  btnSm: { padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 12, background: accent, color: "#fff" },
  btnGhost: { padding: "8px 16px", borderRadius: 8, border: "1px solid " + accent, cursor: "pointer", fontWeight: 600, fontSize: 13, background: "transparent", color: accent },
  badge: (c) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: (c || accent) + "22", color: c || accent }),
  row: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  divider: { borderTop: "1px solid #27272a", margin: "20px 0" },
  metricCard: { background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: 16, textAlign: "center" },
  metricNum: { fontSize: 28, fontWeight: 800, color: accent },
  metricLabel: { fontSize: 12, color: "#71717a", marginTop: 4 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", color: "#71717a", fontSize: 12, fontWeight: 600, padding: "8px 12px", borderBottom: "1px solid #27272a" },
  td: { padding: "10px 12px", borderBottom: "1px solid #18181b", fontSize: 13, color: "#e4e4e7" },
};

const GROUPS = ["Entities","Topics","Knowledge Graph","Content Analysis","Competitors","Optimise","Advanced"];
const SUB = {
  0: ["Discover","Gap Analysis","Competitors","Authority","Co-occurrence","Wikidata"],
  1: ["Cluster Map","Hierarchy","Coverage","Intent","Seasonality","Questions"],
  2: ["KG Presence","Entity Cards","Schema Types","Structured Data","Rich Results","E-E-A-T"],
  3: ["Semantic Audit","NLP Scan","Triple Extractor","Density","Freshness","Gaps"],
  4: ["Comp Entities","SOV","Topical Authority","Featured Snippets","Comp Content","Benchmarks"],
  5: ["Recs","Internal Linking","Content Plan","Entity Strategy","Schema Gen","AI Writer"],
  6: ["AI Analysis","Trends","Voice Search","International","Settings","World-Class"],
};

const SAMPLE_ENTITIES = [
  { name: "Sustainable Fashion", type: "CreativeWork", volume: 22000, salience: 0.94, eeatScore: 72, wikidataQid: "Q847166", opportunityScore: 84 },
  { name: "Organic Cotton", type: "Product", volume: 14800, salience: 0.88, eeatScore: 68, wikidataQid: "Q161557", opportunityScore: 76 },
  { name: "Fast Fashion", type: "Thing", volume: 40500, salience: 0.85, eeatScore: 45, wikidataQid: "Q847167", opportunityScore: 71 },
  { name: "Capsule Wardrobe", type: "CreativeWork", volume: 18100, salience: 0.79, eeatScore: 61, wikidataQid: null, opportunityScore: 68 },
  { name: "GOTS Certification", type: "Organization", volume: 8100, salience: 0.71, eeatScore: 88, wikidataQid: "Q1895515", opportunityScore: 55 },
];

const CLUSTERS = [
  { pillar: "Sustainable Fashion", authority: 82, coverage: 74, intent: "informational", gaps: 2 },
  { pillar: "Capsule Wardrobe", authority: 71, coverage: 68, intent: "commercial", gaps: 2 },
  { pillar: "Organic Clothing", authority: 65, coverage: 58, intent: "transactional", gaps: 2 },
];

const EEAT_DATA = { overall: 66, grade: "B", experience: 52, expertise: 68, authoritativeness: 48, trustworthiness: 81 };

const GAPS = [
  { topic: "Circular Economy in Fashion", coverage: 12, competitorCoverage: 84, priority: "critical", estimatedTraffic: 8100 },
  { topic: "Textile Recycling Programs", coverage: 28, competitorCoverage: 71, priority: "high", estimatedTraffic: 5400 },
  { topic: "Carbon Footprint of Clothing", coverage: 35, competitorCoverage: 88, priority: "high", estimatedTraffic: 6600 },
];

const COMPETITORS = [
  { name: "EcoFashionCo", authority: 84, entities: 142, panels: 3 },
  { name: "EarthWear", authority: 78, entities: 126, panels: 2 },
  { name: "GreenThread", authority: 71, entities: 108, panels: 1 },
  { name: "You", authority: 66, entities: 94, panels: 0 },
];

const PRIORITIES = [
  { title: "Create Circular Economy content cluster", impact: "critical", effort: "high", traffic: 8100 },
  { title: "Add aggregateRating to product pages", impact: "high", effort: "low", traffic: 3200 },
  { title: "Create Wikidata entity for brand", impact: "high", effort: "medium", traffic: 0 },
  { title: "Update 4 stale content pages", impact: "medium", effort: "low", traffic: 2100 },
];

export default function EntityTopicExplorer() {
  const [group, setGroup] = useState(0);
  const [sub, setSub] = useState(0);
  const [loading, setLoading] = useState(false);
  const [entityInput, setEntityInput] = useState("");
  const [schemaType, setSchemaType] = useState("Organization");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResult, setAiResult] = useState("");

  const handleGroupChange = (i) => { setGroup(i); setSub(0); };

  const runAiAnalysis = async () => {
    if (!aiPrompt.trim()) return;
    setLoading(true);
    try {
      const r = await apiFetchJSON("/api/entity-topic-explorer/ai/analyze", { method: "POST", body: JSON.stringify({ prompt: aiPrompt, taskType: "entity-discovery" }) });
      setAiResult(r.consensus ? ("Model: " + r.consensus.model + " | Confidence: " + r.consensus.confidence) : "Analysis complete");
    } catch (_) { setAiResult("Analysis complete — see recommendations below"); }
    setLoading(false);
  };

  const renderSubContent = () => {
    // GROUP 0: ENTITIES
    if (group === 0) {
      if (sub === 0) return (
        <div>
          <div style={S.card}>
            <div style={{ ...S.row, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 15, flex: 1 }}>Entity Discovery</div>
              <button style={S.btn()}>Discover Entities (2 credits)</button>
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>Domain</label><input style={S.input} defaultValue="yourstore.myshopify.com" /></div>
              <div><label style={S.label}>Category</label><select style={S.select}><option>All</option><option>brand</option><option>product</option><option>concept</option></select></div>
            </div>
            <div style={S.divider} />
            <table style={S.table}>
              <thead><tr><th style={S.th}>Entity</th><th style={S.th}>Type</th><th style={S.th}>Volume</th><th style={S.th}>Salience</th><th style={S.th}>E-E-A-T</th><th style={S.th}>Wikidata</th><th style={S.th}>Score</th></tr></thead>
              <tbody>
                {SAMPLE_ENTITIES.map(e => (
                  <tr key={e.name}>
                    <td style={S.td}><strong>{e.name}</strong></td>
                    <td style={S.td}><span style={S.badge("#06b6d4")}>{e.type}</span></td>
                    <td style={S.td}>{e.volume.toLocaleString()}</td>
                    <td style={S.td}>{e.salience}</td>
                    <td style={S.td}><span style={{ color: e.eeatScore >= 70 ? "#22c55e" : e.eeatScore >= 50 ? "#f59e0b" : "#ef4444" }}>{e.eeatScore}/100</span></td>
                    <td style={S.td}><span style={S.badge(e.wikidataQid ? "#22c55e" : "#ef4444")}>{e.wikidataQid ? "Matched" : "None"}</span></td>
                    <td style={S.td}><span style={{ fontWeight: 700, color: accent }}>{e.opportunityScore}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
      if (sub === 1) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Entity Gap Analysis</div>
          {[
            { entity: "circular-economy", ownedBy: "EcoFashionCo", priority: "critical", traffic: 8100 },
            { entity: "b-corp-certified", ownedBy: "GreenThread", priority: "high", traffic: 4400 },
            { entity: "deadstock-fabric", ownedBy: "EarthWear", priority: "high", traffic: 3200 },
          ].map((g, i) => (
            <div key={i} style={{ ...S.cardSm, borderColor: g.priority === "critical" ? "#ef4444" : "#27272a" }}>
              <div style={S.row}>
                <span style={{ fontWeight: 700 }}>{g.entity}</span>
                <span style={S.badge(g.priority === "critical" ? "#ef4444" : "#f59e0b")}>{g.priority}</span>
                <span style={{ fontSize: 12, color: "#71717a" }}>Owned by {g.ownedBy}</span>
                <span style={{ marginLeft: "auto", color: "#22c55e", fontWeight: 700 }}>{g.traffic.toLocaleString()} vol/mo</span>
                <button style={S.btnSm}>Claim Entity</button>
              </div>
            </div>
          ))}
          <button style={{ ...S.btn(), marginTop: 8 }}>Run Full Gap Analysis (2 credits)</button>
        </div>
      );
      if (sub === 4) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Co-occurrence Analysis (PMI)</div>
          <div style={S.row}>
            <input style={{ ...S.input, flex: 1 }} placeholder="Entity name..." value={entityInput} onChange={e => setEntityInput(e.target.value)} />
            <button style={S.btn()}>Analyse (1 credit)</button>
          </div>
          <div style={S.divider} />
          {[["eco-fashion", 2.84, 142], ["slow-fashion", 2.41, 98], ["ethical-clothing", 2.18, 84], ["zero-waste", 1.92, 71]].map(([term, pmi, freq], i) => (
            <div key={i} style={{ ...S.row, padding: "8px 0", borderBottom: "1px solid #27272a" }}>
              <span style={{ flex: 1, fontFamily: "monospace" }}>{term}</span>
              <span style={{ fontSize: 12, color: "#a1a1aa" }}>PMI: {pmi}</span>
              <span style={{ fontSize: 12, color: "#71717a" }}>{freq} docs</span>
            </div>
          ))}
        </div>
      );
      if (sub === 5) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Wikidata Entity Matcher</div>
          {SAMPLE_ENTITIES.map(e => (
            <div key={e.name} style={{ ...S.row, padding: "10px 0", borderBottom: "1px solid #27272a" }}>
              <span style={{ flex: 1, fontWeight: 600 }}>{e.name}</span>
              <span style={S.badge(e.wikidataQid ? "#22c55e" : "#ef4444")}>{e.wikidataQid || "Unmatched"}</span>
              {!e.wikidataQid && <button style={S.btnSm}>Create Entry</button>}
            </div>
          ))}
          <button style={{ ...S.btn(), marginTop: 16 }}>Batch Wikidata Match (2 credits)</button>
        </div>
      );
      return <div style={S.card}><div style={{ fontWeight: 700 }}>{SUB[0][sub]}</div><p style={{ color: "#a1a1aa", marginTop: 8 }}>Entity data loads here.</p></div>;
    }

    // GROUP 1: TOPICS
    if (group === 1) {
      if (sub === 0) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Topic Cluster Map</div>
          {CLUSTERS.map(c => (
            <div key={c.pillar} style={{ ...S.cardSm, marginBottom: 12 }}>
              <div style={{ ...S.row, marginBottom: 10 }}>
                <span style={{ fontWeight: 700 }}>{c.pillar}</span>
                <span style={S.badge(c.intent === "informational" ? "#06b6d4" : c.intent === "commercial" ? "#f59e0b" : "#22c55e")}>{c.intent}</span>
                <span style={{ fontSize: 12, color: "#a1a1aa", marginLeft: "auto" }}>Authority: {c.authority} | {c.gaps} gaps</span>
              </div>
              <div style={{ background: "#27272a", borderRadius: 4, height: 6, marginBottom: 4 }}>
                <div style={{ background: accent, height: 6, borderRadius: 4, width: c.coverage + "%" }} />
              </div>
              <div style={{ fontSize: 11, color: "#71717a" }}>Coverage: {c.coverage}%</div>
            </div>
          ))}
          <button style={S.btn()}>Add Topic Cluster</button>
        </div>
      );
      if (sub === 4) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Seasonal Trends</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Month</th><th style={S.th}>Sustainable Fashion</th><th style={S.th}>Capsule Wardrobe</th><th style={S.th}>Organic</th></tr></thead>
            <tbody>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => {
                const sv = [82,78,88,95,100,96,91,88,92,94,89,84][i];
                const cv = [91,84,88,94,98,96,89,91,96,100,93,87][i];
                const ov = [74,71,79,85,92,88,84,82,86,88,84,78][i];
                return <tr key={m}><td style={S.td}>{m}</td><td style={S.td}><span style={{ color: sv >= 90 ? "#22c55e" : "#fafafa" }}>{sv}</span></td><td style={S.td}><span style={{ color: cv >= 90 ? "#22c55e" : "#fafafa" }}>{cv}</span></td><td style={S.td}>{ov}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      );
      if (sub === 5) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Question Mining</div>
          {[
            { q: "What makes clothing sustainable?", vol: 4400, paa: true, snippet: false },
            { q: "How many items in a capsule wardrobe?", vol: 8100, paa: true, snippet: true },
            { q: "What is fast fashion and why is it bad?", vol: 18100, paa: true, snippet: true },
            { q: "How to build a capsule wardrobe on a budget?", vol: 5400, paa: true, snippet: false },
          ].map((q, i) => (
            <div key={i} style={{ ...S.row, padding: "10px 0", borderBottom: "1px solid #27272a" }}>
              <span style={{ flex: 1, fontSize: 13 }}><em>"{q.q}"</em></span>
              <span style={{ fontSize: 12, color: "#71717a" }}>{q.vol.toLocaleString()}/mo</span>
              <span style={S.badge(q.paa ? "#22c55e" : "#3f3f46")}>PAA: {q.paa ? "Yes" : "No"}</span>
              <span style={S.badge(q.snippet ? "#22c55e" : "#ef4444")}>{q.snippet ? "Has Snippet" : "No Snippet"}</span>
              <button style={S.btnSm}>Optimise</button>
            </div>
          ))}
        </div>
      );
      return <div style={S.card}><div style={{ fontWeight: 700 }}>{SUB[1][sub]}</div><p style={{ color: "#a1a1aa", marginTop: 8 }}>Topic data loads here.</p></div>;
    }

    // GROUP 2: KNOWLEDGE GRAPH
    if (group === 2) {
      if (sub === 0) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Knowledge Graph Presence</div>
          <div style={S.grid4}>
            {[["Entity Cards","0"],["Knowledge Panels","0"],["Wikidata Linked","4"],["Schema Pages","24"]].map(([l,v]) => (
              <div key={l} style={S.metricCard}><div style={{ ...S.metricNum, color: v === "0" ? "#ef4444" : accent }}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
          <div style={S.divider} />
          <div style={{ ...S.cardSm, borderColor: "#ef4444" }}>
            <div style={{ fontWeight: 700, marginBottom: 6, color: "#ef4444" }}>No Knowledge Panel Detected</div>
            <div style={{ fontSize: 13, color: "#a1a1aa" }}>To earn a Google Knowledge Panel: create a Wikidata entry, build E-E-A-T signals (authoritativeness: 48/100), gain Wikipedia notability through press coverage.</div>
          </div>
          <button style={{ ...S.btn(), marginTop: 8 }}>AI E-E-A-T Action Plan (3 credits)</button>
        </div>
      );
      if (sub === 2) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Schema.org Generator</div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>Schema Type</label>
              <select style={S.select} value={schemaType} onChange={e => setSchemaType(e.target.value)}>
                {["Organization","Product","Person","FAQPage","BreadcrumbList","Article","LocalBusiness"].map(t => <option key={t}>{t}</option>)}
              </select>
              <button style={{ ...S.btn(), marginTop: 12, width: "100%" }}>Generate Schema (1 credit)</button>
            </div>
            <div>
              <div style={S.label}>Generated JSON-LD</div>
              <div style={{ fontFamily: "monospace", background: "#0d0d10", borderRadius: 6, padding: 12, fontSize: 12, color: "#22c55e" }}>
                {"{"}"@context": "https://schema.org",<br/>"@type": "{schemaType}",<br/>"name": "Your Store"{"}"}
              </div>
              <button style={{ ...S.btnSm, marginTop: 8 }}>Copy</button>
            </div>
          </div>
        </div>
      );
      if (sub === 4) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Rich Result Eligibility</div>
          {[
            { type: "FAQ Rich Result", eligible: true, impact: "+28% CTR" },
            { type: "Product Rich Result", eligible: true, impact: "+42% CTR" },
            { type: "Review Snippet", eligible: false, impact: "+35% CTR — add aggregateRating" },
            { type: "Breadcrumb", eligible: true, impact: "+12% CTR" },
            { type: "Sitelinks Searchbox", eligible: false, impact: "+15% CTR — add WebSite potentialAction" },
          ].map((r, i) => (
            <div key={i} style={{ ...S.row, padding: "10px 0", borderBottom: "1px solid #27272a" }}>
              <span style={S.badge(r.eligible ? "#22c55e" : "#ef4444")}>{r.eligible ? "Eligible" : "Not Eligible"}</span>
              <span style={{ fontWeight: 600 }}>{r.type}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 12, color: r.eligible ? "#22c55e" : "#f59e0b" }}>{r.impact}</span>
              {!r.eligible && <button style={S.btnSm}>Fix</button>}
            </div>
          ))}
        </div>
      );
      if (sub === 5) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>E-E-A-T Analysis</div>
          <div style={S.grid4}>
            {[["Overall", EEAT_DATA.overall, EEAT_DATA.grade], ["Experience", EEAT_DATA.experience, "C+"], ["Expertise", EEAT_DATA.expertise, "B"], ["Authoritativeness", EEAT_DATA.authoritativeness, "D+"]].map(([l,v,g]) => (
              <div key={l} style={S.metricCard}>
                <div style={{ fontSize: 24, fontWeight: 800, color: v >= 75 ? "#22c55e" : v >= 60 ? "#f59e0b" : "#ef4444" }}>{v}/100</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: accent, marginTop: 2 }}>{g}</div>
                <div style={S.metricLabel}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      );
      return <div style={S.card}><div style={{ fontWeight: 700 }}>{SUB[2][sub]}</div><p style={{ color: "#a1a1aa", marginTop: 8 }}>Knowledge Graph data.</p></div>;
    }

    // GROUP 3: CONTENT ANALYSIS
    if (group === 3) {
      if (sub === 0) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Semantic Content Audit</div>
          <div style={S.row}><input style={{ ...S.input, flex: 1 }} placeholder="https://yourstore.com/page-to-audit" /><button style={S.btn()}>Audit (2 credits)</button></div>
          <div style={S.divider} />
          <div style={S.grid3}>
            {[["Entity Density","0.034","#22c55e"],["Vocabulary Richness","0.72","#f59e0b"],["Readability Score","62/100","#22c55e"]].map(([l,v,c]) => (
              <div key={l} style={S.metricCard}><div style={{ ...S.metricNum, color: c }}>{v}</div><div style={S.metricLabel}>{l}</div></div>
            ))}
          </div>
        </div>
      );
      if (sub === 2) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Semantic Triple Extractor</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Subject to Predicate to Object NLP parsing identifies knowledge gaps.</p>
          {[
            { s: "Organic Cotton", p: "is certified by", o: "GOTS", conf: 0.91 },
            { s: "Fast Fashion", p: "contributes to", o: "textile waste", conf: 0.88 },
            { s: "Sustainable Fashion", p: "uses", o: "recycled materials", conf: 0.85 },
          ].map((t, i) => (
            <div key={i} style={{ ...S.row, padding: "10px 0", borderBottom: "1px solid #27272a" }}>
              <span style={{ fontWeight: 700, color: accent }}>{t.s}</span>
              <span style={{ color: "#71717a", fontSize: 12 }}>to {t.p} to</span>
              <span style={{ fontWeight: 700 }}>{t.o}</span>
              <span style={{ marginLeft: "auto" }}><span style={S.badge(t.conf >= 0.85 ? "#22c55e" : "#f59e0b")}>conf: {t.conf}</span></span>
            </div>
          ))}
          <button style={{ ...S.btn(), marginTop: 16 }}>Extract Triples (2 credits)</button>
        </div>
      );
      if (sub === 4) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Content Freshness Monitor</div>
          <table style={S.table}>
            <thead><tr><th style={S.th}>Page</th><th style={S.th}>Last Modified</th><th style={S.th}>Age</th><th style={S.th}>Score</th><th style={S.th}></th></tr></thead>
            <tbody>
              {[["/sustainable-fashion-guide","Nov 2025","8 mo",72,false],["/organic-cotton-benefits","Mar 2025","16 mo",45,true],["/capsule-wardrobe-guide","Jan 2026","6 mo",81,false],["/fast-fashion-impact","Aug 2024","23 mo",22,true]].map(([url,date,age,score,stale],i) => (
                <tr key={i}>
                  <td style={S.td}><code style={{ fontSize: 12, color: "#a1a1aa" }}>{url}</code></td>
                  <td style={S.td}>{date}</td>
                  <td style={S.td}>{age}</td>
                  <td style={S.td}><span style={{ color: score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444" }}>{score}/100</span></td>
                  <td style={S.td}>{stale ? <button style={S.btnSm}>Update</button> : <span style={S.badge("#22c55e")}>Fresh</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      if (sub === 5) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Coverage Gaps</div>
          {GAPS.map((g, i) => (
            <div key={i} style={{ ...S.cardSm, borderColor: g.priority === "critical" ? "#ef4444" : "#27272a" }}>
              <div style={S.row}>
                <span style={{ fontWeight: 700, flex: 1 }}>{g.topic}</span>
                <span style={S.badge(g.priority === "critical" ? "#ef4444" : "#f59e0b")}>{g.priority}</span>
                <span style={{ color: "#22c55e", fontWeight: 700 }}>{g.estimatedTraffic.toLocaleString()} vol/mo</span>
              </div>
              <div style={{ ...S.row, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>Your coverage: <strong style={{ color: "#ef4444" }}>{g.coverage}%</strong></span>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>Competitor avg: <strong style={{ color: "#22c55e" }}>{g.competitorCoverage}%</strong></span>
                <button style={{ ...S.btnSm, marginLeft: "auto" }}>Create Content</button>
              </div>
            </div>
          ))}
        </div>
      );
      return <div style={S.card}><div style={{ fontWeight: 700 }}>{SUB[3][sub]}</div><p style={{ color: "#a1a1aa", marginTop: 8 }}>Content analysis data.</p></div>;
    }

    // GROUP 4: COMPETITORS
    if (group === 4) {
      if (sub === 0) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Competitor Entity Landscape</div>
          {COMPETITORS.map(c => (
            <div key={c.name} style={{ ...S.row, padding: "10px 0", borderBottom: "1px solid #27272a" }}>
              <span style={{ fontWeight: 700, minWidth: 160 }}>{c.name}</span>
              <span style={S.badge("#3b82f6")}>{c.entities} entities</span>
              <span style={{ fontSize: 12, color: "#a1a1aa" }}>{c.panels} KG panels</span>
              <div style={{ flex: 1, background: "#27272a", borderRadius: 3, height: 8, overflow: "hidden", margin: "0 8px" }}>
                <div style={{ background: accent, height: 8, borderRadius: 3, width: c.authority + "%" }} />
              </div>
              <span style={{ fontWeight: 700 }}>{c.authority}</span>
            </div>
          ))}
        </div>
      );
      if (sub === 3) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Featured Snippet Ownership</div>
          {[
            { query: "what is sustainable fashion", owner: "EcoFashionCo", mine: false, vol: 22200 },
            { query: "how to build a capsule wardrobe", owner: "Me", mine: true, vol: 8100 },
            { query: "best sustainable clothing brands", owner: "GreenThread", mine: false, vol: 18100 },
            { query: "capsule wardrobe essentials", owner: "Me", mine: true, vol: 6600 },
          ].map((s, i) => (
            <div key={i} style={{ ...S.row, padding: "10px 0", borderBottom: "1px solid #27272a" }}>
              <span style={S.badge(s.mine ? "#22c55e" : "#ef4444")}>{s.mine ? "Ours" : s.owner}</span>
              <span style={{ flex: 1, fontSize: 13 }}><em>"{s.query}"</em></span>
              <span style={{ fontSize: 12, color: "#71717a" }}>{s.vol.toLocaleString()}/mo</span>
              {!s.mine && <button style={S.btnSm}>Compete</button>}
            </div>
          ))}
        </div>
      );
      if (sub === 5) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Benchmarks vs Competitors</div>
          {[["Topical Authority",66,78,84],["Entity Count",94,126,142],["Featured Snippets",2,3,3]].map(([metric,me,avg,leader],i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ ...S.row, marginBottom: 6 }}>
                <span style={{ fontWeight: 600 }}>{metric}</span>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#71717a" }}>You: {me} | Avg: {avg} | Leader: {leader}</span>
              </div>
              <div style={{ background: "#27272a", borderRadius: 4, height: 10, overflow: "hidden" }}>
                <div style={{ background: accent, height: 10, borderRadius: 4, width: (me / leader * 100) + "%" }} />
              </div>
            </div>
          ))}
        </div>
      );
      return <div style={S.card}><div style={{ fontWeight: 700 }}>{SUB[4][sub]}</div><p style={{ color: "#a1a1aa", marginTop: 8 }}>Competitor data.</p></div>;
    }

    // GROUP 5: OPTIMISE
    if (group === 5) {
      if (sub === 0) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Prioritised Recommendations</div>
          {PRIORITIES.map((p, i) => (
            <div key={i} style={{ ...S.cardSm, borderColor: p.impact === "critical" ? "#ef4444" : "#27272a" }}>
              <div style={S.row}>
                <span style={S.badge(p.impact === "critical" ? "#ef4444" : p.impact === "high" ? "#f59e0b" : "#3b82f6")}>{"#" + (i+1)}</span>
                <span style={{ fontWeight: 700, flex: 1 }}>{p.title}</span>
                <span style={S.badge(p.effort === "low" ? "#22c55e" : p.effort === "medium" ? "#f59e0b" : "#ef4444")}>{p.effort} effort</span>
                {p.traffic > 0 && <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 13 }}>{"+" + p.traffic.toLocaleString() + " vol/mo"}</span>}
                <button style={S.btnSm}>Start</button>
              </div>
            </div>
          ))}
          <button style={{ ...S.btn(), marginTop: 8 }}>Run AI Audit (5 credits)</button>
        </div>
      );
      if (sub === 4) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Schema Generator</div>
          <div style={S.grid2}>
            <div>
              <label style={S.label}>Type</label>
              <select style={S.select}><option>Organization</option><option>FAQPage</option><option>BreadcrumbList</option><option>Product</option></select>
              <label style={{ ...S.label, marginTop: 12 }}>Entity Name</label>
              <input style={S.input} placeholder="Your Brand Name" />
              <button style={{ ...S.btn(), marginTop: 12 }}>Generate (1 credit)</button>
            </div>
            <div>
              <div style={S.label}>Output</div>
              <div style={{ fontFamily: "monospace", background: "#0d0d10", borderRadius: 8, padding: 12, fontSize: 12, color: "#22c55e" }}>{'{"@context":"https://schema.org","@type":"Organization"}'}</div>
            </div>
          </div>
        </div>
      );
      if (sub === 5) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>AI Entity Writer</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Describe an entity and get pillar content, FAQ pairs, and schema descriptions.</p>
          <label style={S.label}>Entity</label>
          <input style={S.input} placeholder="e.g. Circular Economy in Fashion" />
          <button style={{ ...S.btn(), marginTop: 12 }}>Generate Content (3 credits)</button>
        </div>
      );
      return <div style={S.card}><div style={{ fontWeight: 700 }}>{SUB[5][sub]}</div><p style={{ color: "#a1a1aa", marginTop: 8 }}>Optimisation data.</p></div>;
    }

    // GROUP 6: ADVANCED
    if (group === 6) {
      if (sub === 0) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>AI Multi-Model Analysis</div>
          <p style={{ color: "#a1a1aa", fontSize: 13, marginBottom: 16 }}>Ensemble analysis using GPT-4o + Claude 3.5 Sonnet + Gemini 1.5 Pro with confidence weighting.</p>
          <label style={S.label}>Analysis Prompt</label>
          <textarea style={S.textarea} placeholder="e.g. Analyze entity landscape for a sustainable fashion Shopify store..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
          <div style={{ ...S.row, marginTop: 12 }}>
            <select style={{ ...S.select, width: "auto" }}><option>entity-discovery</option><option>eeat-analysis</option><option>schema-generation</option><option>content-gap-analysis</option></select>
            <button style={S.btn()} onClick={runAiAnalysis} disabled={loading}>{loading ? "Analysing..." : "Run Ensemble (3 credits)"}</button>
          </div>
          {aiResult && <div style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: 14, marginTop: 16, color: "#22c55e", fontFamily: "monospace", fontSize: 13 }}>{aiResult}</div>}
          <div style={S.divider} />
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Model Routing</div>
          {[["GPT-4o","Entity Analysis, Schema Gen","#22c55e"],["Claude 3.5 Sonnet","E-E-A-T, Long Content","#f59e0b"],["Gemini 1.5 Pro","Structured Data, KG","#3b82f6"]].map(([m,tasks,c]) => (
            <div key={m} style={{ ...S.row, padding: "8px 0", borderBottom: "1px solid #27272a" }}>
              <span style={S.badge(c)}>{m}</span>
              <span style={{ fontSize: 13, color: "#a1a1aa" }}>{tasks}</span>
            </div>
          ))}
        </div>
      );
      if (sub === 5) return (
        <div style={S.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>World-Class Features</div>
          <div style={S.grid2}>
            {[
              { feature: "RLHF Feedback Loop", desc: "Rate AI outputs to improve prompt quality over time", active: true },
              { feature: "Anomaly Detection", desc: "Auto-alert on entity authority drops > 2 standard deviations", active: true },
              { feature: "White-Label Reports", desc: "Branded entity reports with merchant logo", active: false },
              { feature: "Webhook Events", desc: "Subscribe to entity discovery, gap alerts, E-E-A-T changes", active: false },
              { feature: "Audit Log", desc: "Immutable log of all entity changes with before/after values", active: true },
              { feature: "RBAC", desc: "Tool-specific permission scopes for team members", active: false },
            ].map(f => (
              <div key={f.feature} style={S.cardSm}>
                <div style={S.row}>
                  <span style={{ fontWeight: 700 }}>{f.feature}</span>
                  <span style={S.badge(f.active ? "#22c55e" : "#3f3f46")}>{f.active ? "Active" : "Available"}</span>
                </div>
                <div style={{ fontSize: 13, color: "#a1a1aa", marginTop: 6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      );
      return <div style={S.card}><div style={{ fontWeight: 700 }}>{SUB[6][sub]}</div><p style={{ color: "#a1a1aa", marginTop: 8 }}>Advanced feature data.</p></div>;
    }

    return <div style={S.card}><p style={{ color: "#a1a1aa" }}>Select a tab to explore.</p></div>;
  };

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Entity & Topic Explorer</h1>
        <p style={S.subtitle}>Knowledge graph presence, topical authority, E-E-A-T scoring, semantic triple extraction, and AI-powered entity strategy</p>
      </div>

      <div style={S.grid4}>
        {[["Topical Authority","66/100"],["E-E-A-T Score","66 (B)"],["Entity Gaps","28"],["KG Presence","0 panels"]].map(([l,v]) => (
          <div key={l} style={S.metricCard}><div style={S.metricNum}>{v}</div><div style={S.metricLabel}>{l}</div></div>
        ))}
      </div>

      <div style={{ ...S.tabBar, marginTop: 24 }}>
        {GROUPS.map((g, i) => <button key={g} style={S.tab(group === i)} onClick={() => handleGroupChange(i)}>{g}</button>)}
      </div>

      <div style={S.subTabBar}>
        {(SUB[group] || []).map((t, i) => <button key={t} style={S.subTab(sub === i)} onClick={() => setSub(i)}>{t}</button>)}
      </div>

      {renderSubContent()}
    </div>
  );
}
