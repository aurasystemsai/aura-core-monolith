import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/creative-automation-engine";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "generate", label: "Generate Creative" },
  { id: "saved",    label: "Creative Library" },
  { id: "guide",    label: "Creative Strategy" },
];

const CREATIVE_TYPES = ["Ad Copy", "Email Subject Lines", "Social Caption", "Product Description", "Video Script Hook", "Blog Title", "Landing Page Headline", "CTA Variants"];

const SAMPLE_BRIEFS = [
  "Generate 5 Facebook ad headlines for a women's running shoe. Price: $89. Target: women 25-40, fitness-focused. Emotion: empowerment. USP: designed with female biomechanics.",
  "Write a 5-subject-line A/B test for an abandoned cart email. Product: Premium coffee subscription, $45/month. Use urgency, social proof, and curiosity as triggers.",
  "Create a TikTok video script hook (first 3 seconds) for a skincare product that claims to reduce dark circles in 7 days.",
  "Write 3 product descriptions for a handmade soy candle. Scent: 'Midnight Forest'. Tone: premium, sustainable, sensory. 50-80 words each.",
];

export default function CreativeAutomationEngine() {
  const [tab, setTab]       = useState("generate");
  const [brief, setBrief]   = useState("");
  const [creativeType, setType] = useState("Ad Copy");
  const [result, setResult] = useState(null);
  const [creatives, setCreatives] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { loadCreatives(); loadAnalytics(); }, []);

  const loadCreatives = async () => {
    try {
      const r = await apiFetchJSON(`${API}/creatives`);
      if (r.ok) setCreatives(r.creatives || []);
    } catch {}
  };

  const loadAnalytics = async () => {
    try {
      const r = await apiFetchJSON(`${API}/analytics`);
      if (r.ok) setAnalytics(r.analytics);
    } catch {}
  };

  const generate = async () => {
    if (!brief.trim()) return;
    setLoading(true); setError(""); setResult(null);
    const fullBrief = `Creative Type: ${creativeType}\n\nBrief:\n${brief}`;
    try {
      const r = await apiFetchJSON(`${API}/ai/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief: fullBrief }),
      });
      if (!r.ok) throw new Error(r.error || "Generation failed");
      setResult(r.result || "");
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveCreative = async () => {
    if (!result) return;
    try {
      await apiFetchJSON(`${API}/creatives`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: result, brief, type: creativeType, createdAt: new Date().toISOString() }),
      });
      loadCreatives(); loadAnalytics();
    } catch (e) { setError(e.message); }
  };

  const deleteCreative = async (id) => {
    setDeleting(id);
    try {
      await apiFetchJSON(`${API}/creatives/${id}`, { method: "DELETE" });
      setCreatives(p => p.filter(c => c.id !== id));
    } catch {}
    setDeleting(null);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Creative Automation Engine</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered marketing creative generation — ad copy, email subjects, social captions, product descriptions, video scripts, and more. Scale your creative output without scaling your team.</p>
      </div>

      {analytics && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 20px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Saved Creatives</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#4f46e5", marginTop: 2 }}>{analytics.totalCreatives || creatives.length}</div>
          </div>
        </div>
      )}

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* GENERATE */}
      {tab === "generate" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ marginBottom: 12 }}>
              <div style={S.sectionTitle}>Creative Type</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {CREATIVE_TYPES.map(t => (
                  <button key={t} style={{ ...S.btn(t === creativeType ? "primary" : null), fontSize: 11, padding: "5px 10px" }} onClick={() => setType(t)}>{t}</button>
                ))}
              </div>
            </div>
            <div style={S.sectionTitle}>Creative Brief</div>
            <textarea style={{ ...S.ta, minHeight: 120 }} value={brief} onChange={e => setBrief(e.target.value)} placeholder="Describe your creative needs — target audience, product, emotion, USP, tone, and any specific requirements…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={generate} disabled={loading || !brief.trim()}>{loading ? "Generating…" : "Generate Creative"}</button>
              {result && <button style={{ ...S.btn("green"), fontSize: 11, padding: "6px 12px" }} onClick={saveCreative}>Save to Library</button>}
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setBrief("")}>Clear</button>
            </div>
          </div>

          {!brief && !result && !loading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Sample Briefs — Click to Load</div>
              {SAMPLE_BRIEFS.map((b, i) => (
                <div key={i} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setBrief(b)}>Load</button>
                  <div style={{ fontSize: 12, color: "#a1a1aa", lineHeight: 1.5 }}>{b}</div>
                </div>
              ))}
            </div>
          )}

          <ErrorBox message={error} />
          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Generated Creative — {creativeType}</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(result)}>Copy</button>
              </div>
              <pre style={S.pre}>{result}</pre>
            </div>
          )}
        </div>
      )}

      {/* CREATIVE LIBRARY */}
      {tab === "saved" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{creatives.length} creatives</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadCreatives}>Refresh</button>
          </div>
          {creatives.length === 0 ? (
            <EmptyState icon="🎨" title="No creatives saved yet" description="Generate creative content and save it to build your library." />
          ) : (
            creatives.map(c => (
              <div key={c.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1, marginRight: 12 }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      {c.type && <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{c.type}</span>}
                      {c.createdAt && <span style={{ fontSize: 11, color: "#52525b" }}>{new Date(c.createdAt).toLocaleDateString()}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 6 }}>{(c.brief || c.content || "").slice(0, 80)}…</div>
                    <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{(c.content || "").slice(0, 200)}{(c.content || "").length > 200 ? "…" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(c.content || "")}>Copy</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteCreative(c.id)} disabled={deleting === c.id}>{deleting === c.id ? "…" : "Delete"}</button>
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
            <div style={S.sectionTitle}>Creative Performance Principles</div>
            {[
              { t: "Lead with the outcome, not the feature",   d: "'Lose 5kg in 30 days' beats 'Contains CLA and Chromium'. Customers buy outcomes. Features are proof points, not headlines." },
              { t: "Specificity increases believability",      d: "'87% of customers saw results in 7 days' converts better than 'most customers see results quickly'. Numbers create trust." },
              { t: "Social proof in the headline",             d: "'Join 12,000 happy customers' or '★★★★★ 4.9/5 from 847 reviews' in the headline can double click-through rates." },
              { t: "Test 3-5 angles, not 3-5 words",          d: "Don't just test headline wording. Test entirely different angles: price vs emotion vs authority vs problem vs comparison." },
              { t: "The 5-second test",                        d: "Show your creative to 5 people for 5 seconds. They should be able to answer: what is it, who is it for, and what should I do next." },
              { t: "Urgency must be real",                     d: "False scarcity ('Only 3 left!' when stock is 500) destroys trust long-term. Use real urgency: limited-time offers, genuine deadlines." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🎨</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

 const [brief, setBrief] = useState("");
 const [result, setResult] = useState("");
 const [creatives, setCreatives] = useState([]);
 const [analytics, setAnalytics] = useState([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [imported, setImported] = useState(null);
 const [exported, setExported] = useState(null);
 const [showOnboarding, setShowOnboarding] = useState(false);
 const [darkMode, setDarkMode] = useState(false);
 const fileInputRef = useRef();

 // Fetch creatives
 const fetchCreatives = async () => {
 setLoading(true);
 setError("");
 try {
 const res = await apiFetchJSON("/api/creative-automation-engine/creatives");
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setCreatives(data.creatives || []);
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // Fetch analytics
 const fetchAnalytics = async () => {
 setLoading(true);
 setError("");
 try {
 const res = await apiFetchJSON("/api/creative-automation-engine/analytics");
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setAnalytics(data.analytics || []);
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // AI Generate
 const handleGenerate = async () => {
 setLoading(true);
 setError("");
 setResult("");
 try {
 const res = await apiFetchJSON("/api/creative-automation-engine/ai/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ brief })
 });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setResult(data.result || "No creative generated");
 fetchCreatives();
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // CRUD
 const handleAddCreative = async () => {
 setLoading(true);
 setError("");
 try {
 const res = await apiFetchJSON("/api/creative-automation-engine/creatives", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ content: result })
 });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 fetchCreatives();
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // Import/Export
 const handleImport = e => {
 const file = e.target.files[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = async evt => {
 try {
 const res = await apiFetchJSON("/api/creative-automation-engine/import", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ data: JSON.parse(evt.target.result) })
 });
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setImported(file.name);
 fetchCreatives();
 } catch (err) {
 setError(err.message);
 }
 };
 reader.readAsText(file);
 };
 const handleExport = () => {
 const blob = new Blob([JSON.stringify(creatives, null, 2)], { type: "application/json"});
 const url = URL.createObjectURL(blob);
 setExported(url);
 setTimeout(() =>URL.revokeObjectURL(url), 10000);
 };

 // Onboarding
 const onboardingContent = (
 <div style={{ padding: 24, background: darkMode ? "#09090b": "#f4f4f5", borderRadius: 12, marginBottom: 18 }}>
 <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Creative Automation Engine</h3>
 <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635": "#52525b", fontSize: 16 }}>
 <li>Generate, import, and manage marketing creatives with AI</li>
 <li>Analyze performance with real-time analytics</li>
 <li>Collaborate and share with your team</li>
 <li>Accessible, secure, and fully compliant</li>
 </ul>
 <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#09090b", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer"}}>Get Started</button>
 </div>
 );

 React.useEffect(() => {
 fetchCreatives();
 fetchAnalytics();
 }, []);

 return (
 <div
 style={{
 margin: "40px auto",
 background: darkMode ? "#18181b": "#fff",
 borderRadius: 18,
 boxShadow: "0 2px 24px #0002",
 padding: 36,
 color: darkMode ? "#a3e635": "#09090b",
 fontFamily: "Inter, sans-serif",
 transition: "background 0.3s, color 0.3s",
 }}
 >
 <BackButton />
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
 <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Creative Automation Engine</h2>
 <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode"style={{ background: "#09090b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer"}}>{darkMode ? "Light": "Dark"} Mode</button>
 </div>
 <div style={{ marginBottom: 10, color: darkMode ? "#a3e635": "#0ea5e9", fontWeight: 600 }}>
 <span role="img"aria-label="sparkles"></span>Generate, manage, and analyze marketing creatives with AI and analytics.
 </div>
 <button onClick={() => setShowOnboarding(true)} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide": "Show"} Onboarding</button>
 {showOnboarding && onboardingContent}
 <textarea
 value={brief}
 onChange={e => setBrief(e.target.value)}
 rows={4}
 style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555": "1px solid #ccc", marginBottom: 18, background: darkMode ? "#09090b": "#fff", color: darkMode ? "#a3e635": "#09090b"}}
 placeholder="Describe your creative brief here..."aria-label="Creative brief input"/>
 <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
 <button onClick={handleGenerate} disabled={loading || !brief} style={{ background: "#a3e635", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>{loading ? "Generating...": "AI Generate"}</button>
 <button onClick={handleAddCreative} disabled={!result} style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Save Creative</button>
 <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Import</button>
 <input ref={fileInputRef} type="file"accept=".json"style={{ display: "none"}} onChange={handleImport} aria-label="Import creatives"/>
 <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Export</button>
 {exported && <a href={exported} download="creatives.json"style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
 </div>
 {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
 {result && (
 <div style={{ background: darkMode ? "#09090b": "#f4f4f5", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635": "#09090b"}}>
 <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Creative:</div>
 <div>{result}</div>
 </div>
 )}
 {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
 <div style={{ marginTop: 24, background: darkMode ? "#18181b": "#fff", borderRadius: 12, padding: 18, border: "1px solid #27272a"}}>
 <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: darkMode ? "#e4e4e7": "#09090b"}}>Creatives</div>
 {creatives.map(c => (
 <div key={c.id} style={{ background: darkMode ? "#09090b": "#fafafa", borderRadius: 8, padding: "10px 14px", marginBottom: 8, border: "1px solid #27272a"}}>
 <span style={{ fontWeight: 600, color: darkMode ? "#e4e4e7": "#09090b"}}>{c.content ? c.content.slice(0, 80) + (c.content.length > 80 ? "": "") : `Creative #${c.id}`}</span>
 </div>
 ))}
 </div>
 <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap"}}>
 <div style={{ background: "#27272a", borderRadius: 10, padding: "12px 20px", border: "1px solid #27272a"}}>
 <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total Creatives</div>
 <div style={{ fontSize: 26, fontWeight: 800, color: "#a3e635", marginTop: 2 }}>{creatives.length}</div>
 </div>
 <div style={{ background: "#27272a", borderRadius: 10, padding: "12px 20px", border: "1px solid #27272a"}}>
 <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Events</div>
 <div style={{ fontSize: 26, fontWeight: 800, color: "#a3e635", marginTop: 2 }}>{analytics.length}</div>
 </div>
 </div>
 <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635": "#71717a", textAlign: "center"}}>
 <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai"style={{ color: darkMode ? "#a3e635": "#0ea5e9", textDecoration: "underline"}}>Contact Support</a></span>
 </div>
 </div>
 );
}





