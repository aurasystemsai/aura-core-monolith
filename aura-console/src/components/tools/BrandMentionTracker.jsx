import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/brand-mention-tracker";

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
  sentBadge: (s) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: s === "positive" ? "#052e16" : s === "negative" ? "#3f1315" : "#27272a", color: s === "positive" ? "#4ade80" : s === "negative" ? "#f87171" : "#a1a1aa" }),
};

const TABS = [
  { id: "monitor",    label: "Monitor" },
  { id: "watchlist",  label: "Watch List" },
  { id: "sentiment",  label: "Sentiment" },
  { id: "competitors",label: "Competitors" },
  { id: "guide",      label: "Response Guide" },
];

const PLATFORMS = ["Twitter/X", "Instagram", "TikTok", "Facebook", "YouTube", "Reddit", "News", "Blog", "Review Site", "Other"];
const SENTIMENTS = ["positive", "neutral", "negative"];

export default function BrandMentionTracker() {
  const [tab, setTab] = useState("monitor");

  // Brand query (always at top)
  const [brand, setBrand]     = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  // Watch List
  const [mentions, setMentions]   = useState([]);
  const [mLoading, setMLoading]   = useState(false);
  const [newMention, setNewMention] = useState({ source: "", text: "", sentiment: "neutral", platform: "Twitter/X", url: "" });
  const setM = (k, v) => setNewMention(p => ({ ...p, [k]: v }));
  const [draftLoading, setDraftLoading] = useState(null);
  const [drafts, setDrafts] = useState({});

  // Competitors
  const [compBrand, setCompBrand] = useState("");
  const [compResult, setCompResult] = useState(null);
  const [compLoading, setCompLoading] = useState(false);

  const [error, setError] = useState("");

  const fetchMentions = useCallback(async () => {
    setMLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/mentions`);
      if (r.ok) setMentions(r.mentions || []);
    } catch {}
    setMLoading(false);
  }, []);

  useEffect(() => { fetchMentions(); }, [fetchMentions]);

  const runAnalysis = async () => {
    if (!brand.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: brand.trim() }),
      });
      if (!r.ok) throw new Error(r.error || "Analysis failed");
      setResult(r);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const addMention = async () => {
    if (!newMention.text.trim()) { setError("Mention text required"); return; }
    setError("");
    try {
      await apiFetchJSON(`${API}/mentions`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newMention, addedAt: new Date().toISOString() }),
      });
      setNewMention({ source: "", text: "", sentiment: "neutral", platform: "Twitter/X", url: "" });
      fetchMentions();
    } catch (e) { setError(e.message); }
  };

  const deleteMention = async (id) => {
    try { await apiFetchJSON(`${API}/mentions/${id}`, { method: "DELETE" }); } catch {}
    setMentions(p => p.filter(m => m.id !== id));
  };

  const draftResponse = async (mention) => {
    setDraftLoading(mention.id);
    try {
      const r = await apiFetchJSON(`${API}/ai/draft-response`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mention: mention.text, sentiment: mention.sentiment, platform: mention.platform, source: mention.source }),
      });
      if (r.ok) setDrafts(p => ({ ...p, [mention.id]: r.draft || r.response || "" }));
    } catch {}
    setDraftLoading(null);
  };

  const runCompAnalysis = async () => {
    if (!compBrand.trim()) return;
    setCompLoading(true); setCompResult(null);
    try {
      const r = await apiFetchJSON(`${API}/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand: compBrand.trim() }),
      });
      if (r.ok) setCompResult(r);
    } catch {}
    setCompLoading(false);
  };

  const sentPct = (val, total) => total ? Math.max(2, Math.round((Number(val) / Number(total)) * 100)) : 0;

  return (
    <div style={S.page}>
      {/* ── Brand query bar — always visible ── */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Brand Mention Tracker</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 16 }}>
          Monitor brand reputation, sentiment, and competitive share of voice. Build a watch list of key mentions with AI-powered response drafts.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} onKeyDown={e => e.key === "Enter" && runAnalysis()} placeholder="Enter brand name to analyse (e.g. NovaSkin, your brand, a competitor)…" />
          <button style={S.btn("primary")} onClick={runAnalysis} disabled={loading || !brand.trim()}>{loading ? "Analysing…" : "Analyse Brand"}</button>
          {result && <button style={{ ...S.btn(), fontSize: 11 }} onClick={() => { setResult(null); setBrand(""); }}>Clear</button>}
        </div>
        {result && (
          <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Reputation Score",  val: result.reputationScore,        color: Number(result.reputationScore) >= 70 ? "#4ade80" : Number(result.reputationScore) >= 40 ? "#fbbf24" : "#f87171" },
              { label: "Total Mentions",    val: result.mentionStats?.total,    color: "#818cf8" },
              { label: "Positive",          val: result.mentionStats?.positive, color: "#4ade80" },
              { label: "Negative",          val: result.mentionStats?.negative, color: "#f87171" },
            ].filter(s => s.val !== undefined).map(({ label, val, color }) => (
              <div key={label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "8px 16px" }}>
                <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{val}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── MONITOR ── */}
      {tab === "monitor" && (
        <div style={{ marginTop: 20 }}>
          {loading && <div style={{ textAlign: "center", padding: 40 }}><Spinner size={36} /></div>}

          {!result && !loading && (
            <EmptyState icon="🔍" title="Enter a brand name above to run an analysis" description="Get reputation scores, mention breakdowns, notable mentions, and urgent issues to address." />
          )}

          {result && !loading && (
            <>
              {result.urgentIssues?.length > 0 && (
                <div style={{ ...S.card, border: "1px solid #7f1d1d" }}>
                  <div style={S.sectionTitle}>🚨 Urgent Issues</div>
                  {result.urgentIssues.map((issue, i) => (
                    <div key={i} style={{ ...S.row, color: "#f87171", fontSize: 13, lineHeight: 1.5 }}>• {issue}</div>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {result.notableMentions?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Notable Mentions</div>
                    {result.notableMentions.map((m, i) => (
                      <div key={i} style={S.row}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: "#e4e4e7" }}>{m.text || m}</div>
                          {m.source && <div style={{ fontSize: 11, color: "#52525b" }}>{m.source}</div>}
                        </div>
                        {m.sentiment && <span style={S.sentBadge(m.sentiment)}>{m.sentiment}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {result.platforms && (
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Platform Sources</div>
                    {Object.entries(result.platforms).map(([platform, count]) => (
                      <div key={platform} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1f1f22" }}>
                        <span style={{ fontSize: 13, color: "#e4e4e7" }}>{platform}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {result.opportunities?.length > 0 && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Amplification Opportunities</div>
                  {result.opportunities.map((o, i) => (
                    <div key={i} style={{ ...S.row, color: "#4ade80", fontSize: 13 }}>• {o}</div>
                  ))}
                </div>
              )}

              {result.analysis && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Full Analysis</div>
                  <pre style={S.pre}>{typeof result.analysis === "string" ? result.analysis : JSON.stringify(result.analysis, null, 2)}</pre>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── WATCH LIST ── */}
      {tab === "watchlist" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add Mention to Watch List</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
              Manually add key mentions — reviews, social posts, news coverage — to track and respond to. Use AI to draft a response for each one.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Source (name / username)</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newMention.source} onChange={e => setM("source", e.target.value)} placeholder="@username or Site Name" />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Platform</label>
                <select style={{ ...S.select, width: "100%" }} value={newMention.platform} onChange={e => setM("platform", e.target.value)}>
                  {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Sentiment</label>
                <select style={{ ...S.select, width: "100%" }} value={newMention.sentiment} onChange={e => setM("sentiment", e.target.value)}>
                  {SENTIMENTS.map(s => <option key={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Original URL (optional)</label>
                <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newMention.url} onChange={e => setM("url", e.target.value)} placeholder="https://…" />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: "#71717a", display: "block", marginBottom: 4 }}>Mention Text *</label>
              <textarea style={{ ...S.ta, minHeight: 80 }} value={newMention.text} onChange={e => setM("text", e.target.value)} placeholder="Paste the full mention or review text here…" />
            </div>
            <button style={S.btn("primary")} onClick={addMention}>Add to Watch List</button>
          </div>

          {mLoading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : mentions.length === 0 ? (
            <EmptyState icon="👀" title="Watch list is empty" description="Add mentions manually above, or run a brand analysis and save notable mentions to track and respond to." />
          ) : (
            mentions.map((m, i) => (
              <div key={m.id || i} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                      {m.source && <span style={{ fontSize: 12, fontWeight: 700, color: "#818cf8" }}>{m.source}</span>}
                      <span style={{ background: "#27272a", color: "#a1a1aa", padding: "2px 8px", borderRadius: 4, fontSize: 11 }}>{m.platform}</span>
                      <span style={S.sentBadge(m.sentiment)}>{m.sentiment}</span>
                      {m.addedAt && <span style={{ fontSize: 11, color: "#52525b" }}>{new Date(m.addedAt).toLocaleDateString()}</span>}
                    </div>
                    <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5, marginBottom: 6 }}>{m.text}</div>
                    {m.url && <a href={m.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#4f46e5" }}>View original →</a>}
                  </div>
                  <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                    <button style={{ ...S.btn("primary"), fontSize: 11, padding: "5px 10px" }} onClick={() => draftResponse(m)} disabled={draftLoading === m.id}>{draftLoading === m.id ? "Drafting…" : "AI Draft"}</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "5px 10px" }} onClick={() => deleteMention(m.id)}>✕</button>
                  </div>
                </div>
                {drafts[m.id] && (
                  <div style={{ marginTop: 12, background: "#0f0f14", border: "1px solid #1e1b4b", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <div style={{ fontSize: 11, color: "#818cf8", fontWeight: 700, textTransform: "uppercase" }}>AI Draft Response</div>
                      <button style={{ ...S.btn(), fontSize: 11, padding: "3px 8px" }} onClick={() => navigator.clipboard?.writeText(drafts[m.id])}>Copy</button>
                    </div>
                    <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.6 }}>{drafts[m.id]}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ── SENTIMENT ── */}
      {tab === "sentiment" && (
        <div style={{ marginTop: 20 }}>
          {!result ? (
            <EmptyState icon="💬" title="Run a brand analysis first" description="Enter your brand name above and click 'Analyse Brand' to see sentiment breakdown." />
          ) : (
            <>
              <div style={S.card}>
                <div style={S.sectionTitle}>Overall Sentiment — {brand}</div>
                {[
                  { label: "Positive", pct: sentPct(result.mentionStats?.positive, result.mentionStats?.total), color: "#4ade80" },
                  { label: "Neutral",  pct: sentPct(result.mentionStats?.neutral,  result.mentionStats?.total), color: "#a1a1aa" },
                  { label: "Negative", pct: sentPct(result.mentionStats?.negative, result.mentionStats?.total), color: "#f87171" },
                ].map(({ label, pct, color }) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: "#e4e4e7" }}>{label}</span>
                      <span style={{ color }}>{pct}%</span>
                    </div>
                    <div style={{ background: "#27272a", borderRadius: 6, height: 10 }}>
                      <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 6, transition: "width 0.4s" }} />
                    </div>
                  </div>
                ))}
                {result.overallSentiment && (
                  <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700, textAlign: "center", color: result.overallSentiment === "Positive" ? "#4ade80" : result.overallSentiment === "Negative" ? "#f87171" : "#a1a1aa" }}>
                    Overall: {result.overallSentiment} Sentiment
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {result.positiveThemes?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Positive Themes</div>
                    {result.positiveThemes.map((t, i) => (
                      <div key={i} style={{ ...S.row, color: "#4ade80", fontSize: 13 }}>✓ {t}</div>
                    ))}
                  </div>
                )}
                {result.negativeThemes?.length > 0 && (
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Negative Themes</div>
                    {result.negativeThemes.map((t, i) => (
                      <div key={i} style={{ ...S.row, color: "#f87171", fontSize: 13 }}>✕ {t}</div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── COMPETITORS ── */}
      {tab === "competitors" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Competitor Share of Voice Analysis</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 12, lineHeight: 1.6 }}>
              Compare competitor brand perception and mention volume. Enter a competitor brand to run a side-by-side reputation comparison.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <input style={S.input} value={compBrand} onChange={e => setCompBrand(e.target.value)} onKeyDown={e => e.key === "Enter" && runCompAnalysis()} placeholder="Competitor brand name…" />
              <button style={S.btn("primary")} onClick={runCompAnalysis} disabled={compLoading || !compBrand.trim()}>{compLoading ? "Analysing…" : "Compare"}</button>
            </div>
          </div>

          {compLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {(result || compResult) && !compLoading && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {[
                { label: brand,    data: result,     color: "#4f46e5" },
                { label: compBrand, data: compResult, color: "#f97316" },
              ].map(({ label, data, color }) => (
                <div key={label} style={{ ...S.card, borderTop: `3px solid ${color}` }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color, marginBottom: 12 }}>{label || "(not analysed)"}</div>
                  {data ? (
                    <>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "#71717a" }}>Reputation Score</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color }}>{data.reputationScore || "—"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "#71717a" }}>Total Mentions</span>
                        <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{data.mentionStats?.total || "—"}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "#71717a" }}>Sentiment</span>
                        <span style={{ fontWeight: 700, color: "#e4e4e7" }}>{data.overallSentiment || "—"}</span>
                      </div>
                      {data.positiveThemes?.slice(0, 2).map((t, i) => <div key={i} style={{ fontSize: 12, color: "#4ade80" }}>✓ {t}</div>)}
                      {data.negativeThemes?.slice(0, 2).map((t, i) => <div key={i} style={{ fontSize: 12, color: "#f87171" }}>✕ {t}</div>)}
                    </>
                  ) : (
                    <div style={{ fontSize: 13, color: "#52525b" }}>Run analysis above to see data</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {result && compResult && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Share of Voice Comparison</div>
              {[
                { label: brand || "Your Brand",     val: result.mentionStats?.total || 0,     color: "#4f46e5" },
                { label: compBrand || "Competitor", val: compResult.mentionStats?.total || 0, color: "#f97316" },
              ].map(({ label, val, color }) => {
                const total = (result.mentionStats?.total || 0) + (compResult.mentionStats?.total || 0);
                const pct = total ? Math.round((Number(val) / total) * 100) : 50;
                return (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
                      <span style={{ color: "#e4e4e7" }}>{label}</span>
                      <span style={{ color }}>{pct}% share of voice · {val} mentions</span>
                    </div>
                    <div style={{ background: "#27272a", borderRadius: 6, height: 12 }}>
                      <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 6, transition: "width 0.4s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── RESPONSE GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Alert Urgency Matrix</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>
              Use this matrix to triage incoming brand mentions by urgency. The faster you respond to negative mentions, the higher the chance of turning them around.
            </p>
            {[
              { urgency: "Immediate (<1 hour)",  bg: "#3f1315", color: "#f87171", trigger: "Viral negative post, product safety complaint, media coverage of an incident", action: "Executive response required. Acknowledge immediately, take conversation private, issue holding statement." },
              { urgency: "Same day (2-4 hours)",  bg: "#3d2a0a", color: "#fbbf24", trigger: "Negative review with specific complaint, influencer frustration post, order dispute", action: "Assign to senior support. Personalised response, offer resolution, don't use template language." },
              { urgency: "Within 24 hours",       bg: "#052e16", color: "#4ade80", trigger: "Standard negative review, customer service complaint, general question publicly asked", action: "Respond with empathy, offer resolution channel. Thank for feedback even if negative." },
              { urgency: "Weekly review",         bg: "#1e1b4b", color: "#818cf8", trigger: "Neutral brand mention, low-engagement discussion, industry commentary mentioning brand", action: "Add to monitoring. Engage if conversation gains traction." },
              { urgency: "Amplify immediately",   bg: "#052e16", color: "#4ade80", trigger: "Positive UGC, glowing review, influencer praise, viral positive post about product", action: "Like, comment, reshare. Thank publicly. Request permission to feature in marketing." },
            ].map(({ urgency, bg, color, trigger, action }) => (
              <div key={urgency} style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color, marginBottom: 6 }}>{urgency}</div>
                <div style={{ fontSize: 12, color: "#a1a1aa", marginBottom: 4 }}><strong style={{ color: "#71717a" }}>Trigger:</strong> {trigger}</div>
                <div style={{ fontSize: 12, color: "#e4e4e7" }}><strong style={{ color }}>Action:</strong> {action}</div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Response Best Practices</div>
            {[
              { t: "Respond to every review — positive and negative",   d: "Brands that respond to all reviews earn higher trust scores. 89% of consumers read business responses to reviews before making a purchase decision." },
              { t: "Personalise every response",                         d: "Use the customer's name. Reference the specific issue. Never use copy-paste responses — they are immediately recognised and damage trust further." },
              { t: "Never argue publicly",                               d: "Acknowledge the customer's frustration even if you disagree. Move heated disputes to a private channel (DM, email, phone)." },
              { t: "Respond in platform voice, not corporate speak",     d: "Match your brand's tone to the platform. TikTok responses can be witty; LinkedIn responses should be professional; Twitter/X needs to be concise." },
              { t: "Own mistakes clearly and directly",                  d: "Vague apologies ('sorry you feel that way') inflame sentiment. Say: 'You're right, we got this wrong. Here's what we're doing to fix it.'" },
              { t: "Turn public recoveries into marketing moments",      d: "When you genuinely resolve a complaint publicly and the customer acknowledges it, that thread becomes social proof of your customer care." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", fontSize: 16, flexShrink: 0 }}>◈</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
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
