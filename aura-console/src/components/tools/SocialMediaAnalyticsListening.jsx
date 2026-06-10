import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/social-media-analytics-listening";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: c === "pos" ? "#052e16" : c === "neg" ? "#3f1315" : c === "neu" ? "#27272a" : "#1e1b4b", color: c === "pos" ? "#4ade80" : c === "neg" ? "#f87171" : c === "neu" ? "#a1a1aa" : "#818cf8" }),
};

const TABS = [
  { id: "listen",    label: "AI Analysis" },
  { id: "jobs",      label: "Listening Jobs" },
  { id: "saved",     label: "Saved Analyses" },
  { id: "platforms", label: "Platform Guide" },
  { id: "strategy",  label: "Content Strategy" },
];

const PLATFORMS_LIST = ["All Platforms", "Instagram", "TikTok", "Twitter/X", "Facebook", "YouTube", "LinkedIn", "Reddit", "Pinterest"];
const FREQUENCIES    = ["Real-time", "Hourly", "Daily", "Weekly"];

const SUGGESTED_QUERIES = [
  { label: "Instagram engagement trends", q: "Analyse Instagram engagement trends for beauty brands — what content formats and posting times are outperforming in 2026?" },
  { label: "TikTok e-commerce content",   q: "What are the best-performing TikTok content types for e-commerce stores selling fitness products? Include hooks, durations, and trending formats." },
  { label: "Organic vs paid benchmarks",  q: "Compare organic vs paid social performance benchmarks for Shopify stores. What ROAS and engagement rates should we target by platform?" },
  { label: "Small brand hashtag strategy",q: "What hashtag strategies are working for small fashion brands on Instagram? Mix of niche, mid, and large hashtags with example ranges." },
  { label: "Pinterest for DTC",           q: "How should a Shopify home decor brand use Pinterest to drive organic traffic? Pinning strategy, board structure, and Rich Pin setup." },
  { label: "Social share of voice",       q: "How do I measure and grow social share of voice for a small DTC brand competing against larger players? Tactical steps." },
];

export default function SocialMediaAnalyticsListening() {
  const [tab, setTab]         = useState("listen");

  // AI Analysis
  const [query, setQuery]     = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Listening Jobs
  const [jobs, setJobs]             = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobForm, setJobForm] = useState({ name: "", keywords: "", platforms: "All Platforms", frequency: "Daily", alertEmail: "" });
  const setJ = (k, v) => setJobForm(p => ({ ...p, [k]: v }));

  // Saved
  const [analyses, setAnalyses]   = useState([]);

  const [error, setError] = useState("");

  const fetchAnalyses = useCallback(async () => {
    try {
      const r = await apiFetchJSON(`${API}/analyses`);
      if (r.ok) setAnalyses(r.analyses || []);
    } catch {}
  }, []);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/jobs`);
      if (r.ok) setJobs(r.jobs || []);
    } catch {}
    setJobsLoading(false);
  }, []);

  useEffect(() => { fetchAnalyses(); fetchJobs(); }, [fetchAnalyses, fetchJobs]);

  const analyze = async (override) => {
    const q = (override || query).trim();
    if (!q) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/ai/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      if (!r.ok) throw new Error(r.error || "Analysis failed");
      const res = r.analysis || r.result || "";
      setResult(res);
      setHistory(p => [{ query: q, result: res, ts: new Date().toISOString() }, ...p].slice(0, 8));
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const saveAnalysis = async () => {
    if (!result || !query) return;
    try {
      await apiFetchJSON(`${API}/analyses`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, result, createdAt: new Date().toISOString() }),
      });
      fetchAnalyses();
    } catch {}
  };

  const deleteAnalysis = async (id) => {
    try { await apiFetchJSON(`${API}/analyses/${id}`, { method: "DELETE" }); fetchAnalyses(); } catch {}
  };

  const createJob = async () => {
    if (!jobForm.name.trim() || !jobForm.keywords.trim()) { setError("Job name and keywords are required"); return; }
    setError("");
    try {
      const r = await apiFetchJSON(`${API}/jobs`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...jobForm, active: true, createdAt: new Date().toISOString(), lastRun: null }),
      });
      if (r.ok) { setJobs(p => [r.job || { ...jobForm, id: Date.now(), active: true }, ...p]); setJobForm({ name: "", keywords: "", platforms: "All Platforms", frequency: "Daily", alertEmail: "" }); }
    } catch (e) { setError(e.message); }
  };

  const toggleJob = async (id) => {
    try { await apiFetchJSON(`${API}/jobs/${id}/toggle`, { method: "PATCH" }); } catch {}
    setJobs(p => p.map(j => j.id === id ? { ...j, active: !j.active } : j));
  };

  const deleteJob = async (id) => {
    try { await apiFetchJSON(`${API}/jobs/${id}`, { method: "DELETE" }); } catch {}
    setJobs(p => p.filter(j => j.id !== id));
  };

  const sentPct = (val, total) => total ? Math.max(2, Math.round((Number(val) / Number(total)) * 100)) : 0;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Social Media Analytics & Listening</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          AI-powered social intelligence — analyse engagement trends, configure automated keyword monitoring jobs, benchmark platform performance, and build your content strategy across every major social platform.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Active Jobs",      val: jobs.filter(j => j.active).length, color: "#4f46e5" },
          { label: "Saved Analyses",   val: analyses.length,                   color: "#818cf8" },
          { label: "Recent Queries",   val: history.length,                    color: "#71717a" },
        ].map(({ label, val, color }) => (
          <div key={label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px" }}>
            <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
          </div>
        ))}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── AI ANALYSIS ── */}
      {tab === "listen" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Social Intelligence Query</div>
            <textarea style={{ ...S.ta, minHeight: 100, marginBottom: 10 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask about engagement trends, platform benchmarks, content performance, competitor activity, hashtag strategy, or audience insights…" />
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={() => analyze()} disabled={loading || !query.trim()}>{loading ? "Analysing…" : "Analyse"}</button>
              {result && <button style={{ ...S.btn("green"), fontSize: 11, padding: "6px 12px" }} onClick={saveAnalysis}>Save</button>}
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setQuery(""); setResult(null); }}>Clear</button>
            </div>
          </div>

          {!result && !loading && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Quick Intelligence Queries</div>
              {SUGGESTED_QUERIES.map(({ label, q }) => (
                <div key={label} style={S.row}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => { setQuery(q); analyze(q); }}>Ask</button>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12, color: "#71717a" }}>{q.slice(0, 90)}…</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {loading && <div style={{ textAlign: "center", padding: 40 }}><Spinner size={36} /><div style={{ color: "#71717a", marginTop: 12, fontSize: 13 }}>Analysing social media data…</div></div>}

          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={S.sectionTitle}>Analysis Result</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof result === "string" ? result : JSON.stringify(result, null, 2))}>Copy</button>
                  <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={saveAnalysis}>Save</button>
                </div>
              </div>
              <pre style={S.pre}>{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          {history.length > 0 && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Session History</div>
              {history.map((h, i) => (
                <div key={i} style={S.row}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#e4e4e7" }}>{h.query.slice(0, 100)}{h.query.length > 100 ? "…" : ""}</div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>{new Date(h.ts).toLocaleString()}</div>
                  </div>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(h.query); setResult(h.result); }}>Load</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LISTENING JOBS ── */}
      {tab === "jobs" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Create Listening Job</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
              Configure an automated monitoring job to track mentions of keywords, your brand, competitors, or hashtags across social platforms. Get alerted when volume spikes or sentiment shifts.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Job Name *</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={jobForm.name} onChange={e => setJ("name", e.target.value)} placeholder="e.g. Brand Mentions — NovaSkin" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Keywords / Hashtags * (comma-separated)</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={jobForm.keywords} onChange={e => setJ("keywords", e.target.value)} placeholder="novaskin, #NovaSkin, nova skin, NovaSkin review" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Platforms</label>
                <select style={{ ...S.select, width: "100%" }} value={jobForm.platforms} onChange={e => setJ("platforms", e.target.value)}>
                  {PLATFORMS_LIST.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Frequency</label>
                <select style={{ ...S.select, width: "100%" }} value={jobForm.frequency} onChange={e => setJ("frequency", e.target.value)}>
                  {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Alert Email (optional)</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={jobForm.alertEmail} onChange={e => setJ("alertEmail", e.target.value)} placeholder="alerts@company.com" />
              </div>
            </div>
            <button style={S.btn("primary")} onClick={createJob}>Create Listening Job</button>
          </div>

          {jobsLoading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : jobs.length === 0 ? (
            <EmptyState icon="👂" title="No listening jobs configured" description="Create your first job to start automated keyword and mention monitoring." />
          ) : (
            jobs.map((job, i) => (
              <div key={job.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{job.name}</div>
                      <span style={{ background: job.active ? "#052e16" : "#27272a", color: job.active ? "#4ade80" : "#71717a", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>{job.active ? "ACTIVE" : "PAUSED"}</span>
                      <span style={{ background: "#1e1b4b", color: "#818cf8", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{job.frequency}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 2 }}>
                      Keywords: <span style={{ color: "#a1a1aa" }}>{job.keywords}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>
                      {job.platforms}{job.alertEmail ? ` · Alert: ${job.alertEmail}` : ""}
                      {job.lastRun ? ` · Last run: ${new Date(job.lastRun).toLocaleDateString()}` : " · Never run"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0, marginLeft: 12 }}>
                    <button style={{ ...S.btn(job.active ? null : "green"), fontSize: 11, padding: "4px 8px" }} onClick={() => toggleJob(job.id)}>{job.active ? "Pause" : "Enable"}</button>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 8px" }} onClick={() => { setQuery(`Analyse recent social mentions for: ${job.keywords}`); setTab("listen"); }}>Analyse</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 8px" }} onClick={() => deleteJob(job.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Listening Job Templates</div>
            {[
              { name: "Brand Reputation Monitor",    keywords: "[brand], #[brand], [brand] review", platforms: "All Platforms",  freq: "Daily",   purpose: "Catch brand mentions, complaints, and reviews as they happen" },
              { name: "Competitor Intelligence",     keywords: "[competitor1], [competitor2]",       platforms: "Instagram, TikTok", freq: "Weekly",  purpose: "Track competitor content performance and audience response" },
              { name: "Product Launch Buzz",         keywords: "[product name], #[launch hashtag]", platforms: "All Platforms",  freq: "Hourly",  purpose: "Monitor launch momentum in real-time during the first 72 hours" },
              { name: "Industry Trend Listening",    keywords: "[category] trend, [niche] tips",    platforms: "TikTok, Pinterest", freq: "Daily",  purpose: "Surface emerging trends in your product category before they peak" },
              { name: "Customer UGC Discovery",      keywords: "@[handle], #[ugc-hashtag]",          platforms: "Instagram, TikTok", freq: "Daily",  purpose: "Find customer-generated content to reshare and amplify" },
            ].map(({ name, keywords, platforms, freq, purpose }) => (
              <div key={name} style={S.row}>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setJobForm(p => ({ ...p, name, keywords, platforms, frequency: freq }))}>Apply</button>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8" }}>{name}</div>
                  <div style={{ fontSize: 11, color: "#52525b" }}>{keywords} · {platforms} · {freq}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{purpose}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SAVED ANALYSES ── */}
      {tab === "saved" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{analyses.length} saved</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={fetchAnalyses}>Refresh</button>
          </div>
          {analyses.length === 0 ? (
            <EmptyState icon="💾" title="No saved analyses yet" description="Run an analysis and click Save to build your intelligence library." />
          ) : (
            analyses.map((a, i) => (
              <div key={a.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", marginBottom: 2 }}>{(a.query || "").slice(0, 80) || `Analysis #${i + 1}`}</div>
                    <div style={{ fontSize: 11, color: "#52525b" }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ""}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 4, lineHeight: 1.5 }}>{String(a.result || "").slice(0, 160)}{String(a.result || "").length > 160 ? "…" : ""}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 10 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => { setQuery(a.query || ""); setResult(a.result); setTab("listen"); }}>View</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteAnalysis(a.id)}>✕</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── PLATFORM GUIDE ── */}
      {tab === "platforms" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { platform: "Instagram", icon: "📸", bestFor: "Visual products, lifestyle, fashion, beauty", topFormats: ["Reels (highest reach)", "Stories (engagement)", "Carousels (saves)"], postFreq: "4-7× per week", bestTime: "Tue-Fri 9am-11am local", engBenchmark: "1-5% (Reels 10%+)" },
              { platform: "TikTok",    icon: "🎵", bestFor: "Viral reach, Gen Z/Millennial, demos, unboxing", topFormats: ["Short tutorials 15-60s", "Behind the scenes", "Trending sounds + duets"], postFreq: "1-3× per day", bestTime: "6-10pm local", engBenchmark: "3-9% average" },
              { platform: "Pinterest", icon: "📌", bestFor: "Home decor, fashion, food, DIY, evergreen content", topFormats: ["Idea Pins", "Rich Pins with product data", "Infographics (tall)"], postFreq: "15-25 pins/day", bestTime: "8-11pm local", engBenchmark: "Impressions → saves → clicks" },
              { platform: "Facebook",  icon: "👥", bestFor: "35+ demographic, community building, local ads", topFormats: ["Native video", "Facebook Live", "Groups", "Reels"], postFreq: "1-2× per day", bestTime: "1-4pm Wed/Thu", engBenchmark: "0.5-2% organic" },
              { platform: "Twitter/X", icon: "🐦", bestFor: "Brand voice, real-time CS, trending topics", topFormats: ["Threads", "Polls", "Real-time commentary"], postFreq: "3-5× per day", bestTime: "Weekdays 8am-4pm", engBenchmark: "0.02-0.09%" },
              { platform: "YouTube",   icon: "▶️", bestFor: "Long-form education, product reviews, brand authority", topFormats: ["How-to (10+ min)", "Product reviews/comparisons", "Shorts (60s)"], postFreq: "1-2× per week", bestTime: "Thu/Fri afternoons", engBenchmark: "4-6% likes to views" },
            ].map(({ platform, icon, bestFor, topFormats, postFreq, bestTime, engBenchmark }) => (
              <div key={platform} style={S.card}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{icon}</span>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fafafa" }}>{platform}</div>
                </div>
                <div style={{ fontSize: 12, color: "#71717a", marginBottom: 10 }}><strong style={{ color: "#a1a1aa" }}>Best for:</strong> {bestFor}</div>
                <div style={{ marginBottom: 10 }}>
                  <div style={S.sectionTitle}>Top Formats</div>
                  {topFormats.map(f => <div key={f} style={{ fontSize: 12, color: "#e4e4e7", padding: "3px 0" }}>• {f}</div>)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div style={{ background: "#09090b", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase" }}>Frequency</div>
                    <div style={{ fontSize: 12, color: "#4f46e5", fontWeight: 700 }}>{postFreq}</div>
                  </div>
                  <div style={{ background: "#09090b", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase" }}>Eng. Rate</div>
                    <div style={{ fontSize: 12, color: "#4ade80", fontWeight: 700 }}>{engBenchmark}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONTENT STRATEGY ── */}
      {tab === "strategy" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Social Content Pillars for E-Commerce</div>
            {[
              { pillar: "Education (30%)", d: "How-to videos, product guides, tips. Builds authority, drives saves and shares. E.g. '5 ways to style our linen shirt'." },
              { pillar: "Inspiration (25%)", d: "Lifestyle imagery, aspirational content. High engagement, drives desire. E.g. beautiful product-in-context photography." },
              { pillar: "Entertainment (20%)", d: "Trending formats, relatable content, brand personality. Drives new followers. E.g. joining relevant TikTok trends." },
              { pillar: "Social Proof (15%)", d: "Customer reviews, UGC reposts, before/after. Builds trust and drives conversions. E.g. resharing tagged customer posts." },
              { pillar: "Promotion (10%)", d: "Product launches, sales, discounts. Keep to max 10% to avoid audience fatigue." },
            ].map(({ pillar, d }) => (
              <div key={pillar} style={S.row}>
                <div style={{ minWidth: 160, fontWeight: 700, fontSize: 13, color: "#e4e4e7" }}>{pillar}</div>
                <div style={{ fontSize: 13, color: "#71717a", lineHeight: 1.5 }}>{d}</div>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Social Listening KPIs — Track Weekly</div>
            {[
              ["Brand mention volume",  "Total mentions across all platforms", "#4f46e5"],
              ["Net Sentiment Score",   "% positive − % negative mentions",   "#4ade80"],
              ["Share of Voice",        "Your mentions ÷ industry total × 100", "#818cf8"],
              ["Engagement Rate",       "Interactions ÷ reach × 100",          "#0ea5e9"],
              ["Response Time",         "Avg time to respond to mentions",     "#fbbf24"],
              ["Virality Rate",         "Shares ÷ impressions × 100",          "#f87171"],
              ["Follower Growth Rate",  "(New − Lost) ÷ Total × 100 per week", "#a3e635"],
            ].map(([kpi, def, color]) => (
              <div key={kpi} style={{ ...S.row, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{kpi}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{def}</div>
                </div>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
