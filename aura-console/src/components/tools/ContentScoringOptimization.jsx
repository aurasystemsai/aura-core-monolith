import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/content-scoring-optimization";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, background: c === "good" ? "#052e16" : c === "warn" ? "#3d2a0a" : c === "bad" ? "#3f1315" : c === "info" ? "#1e1b4b" : "#27272a", color: c === "good" ? "#4ade80" : c === "warn" ? "#fbbf24" : c === "bad" ? "#f87171" : c === "info" ? "#818cf8" : "#a1a1aa" }),
};

const GRADE_COLOR = { "A+": "#4ade80", A: "#4ade80", "B+": "#a3e635", B: "#a3e635", "C+": "#fbbf24", C: "#fbbf24", D: "#f97316", F: "#f87171" };

const TABS = [
  { id: "score",    label: "Content Score" },
  { id: "entities", label: "Entity Analysis" },
  { id: "nlp",      label: "NLP Terms" },
  { id: "facts",    label: "Facts & E-E-A-T" },
  { id: "history",  label: "History" },
];

const DIM_LABELS = {
  readability: "Readability",
  keywordOptimization: "Keyword Optimization",
  depth: "Content Depth",
  structure: "Structure",
  eeat: "E-E-A-T",
  uniqueness: "Uniqueness",
  entityCoverage: "Entity Coverage",
  intentAlignment: "Intent Alignment",
};

function ScoreBar({ label, score, feedback, details }) {
  const color = score >= 80 ? "#4ade80" : score >= 60 ? "#fbbf24" : "#f87171";
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{label}</span>
        <span style={{ fontSize: 14, fontWeight: 800, color }}>{score}/100</span>
      </div>
      <div style={{ background: "#27272a", borderRadius: 6, height: 8, marginBottom: 4 }}>
        <div style={{ width: `${score}%`, background: color, height: "100%", borderRadius: 6, transition: "width 0.4s ease" }} />
      </div>
      {feedback && <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{feedback}</div>}
    </div>
  );
}

export default function ContentScoringOptimization() {
  const [tab, setTab]           = useState("score");
  const [content, setContent]   = useState("");
  const [keyword, setKeyword]   = useState("");
  const [scoreResult, setScoreResult] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);
  const [scoreError, setScoreError]     = useState("");

  const [entityResult, setEntityResult] = useState(null);
  const [entityLoading, setEntityLoading] = useState(false);

  const [nlpResult, setNlpResult] = useState(null);
  const [nlpLoading, setNlpLoading] = useState(false);

  const [factsResult, setFactsResult] = useState(null);
  const [factsLoading, setFactsLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [activeErr, setActiveErr] = useState("");

  const loadHistory = useCallback(async () => {
    try {
      const r = await apiFetchJSON(`${API}/history`);
      if (r.ok) setHistory(r.history || []);
    } catch {}
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const runScore = async () => {
    if (!content.trim()) return;
    setScoreLoading(true); setScoreError(""); setScoreResult(null); setActiveErr("");
    try {
      const r = await apiFetchJSON(`${API}/score`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, keyword }),
      });
      if (!r.ok) throw new Error(r.error || "Scoring failed");
      setScoreResult(r);
      // Save to history
      try { await apiFetchJSON(`${API}/history`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: content.slice(0, 100), report: r }) }); loadHistory(); } catch {}
    } catch (e) { setScoreError(e.message); }
    setScoreLoading(false);
  };

  const runEntityAnalysis = async () => {
    if (!content.trim()) return;
    setEntityLoading(true); setActiveErr("");
    try {
      const r = await apiFetchJSON(`${API}/entity-optimize`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, keyword }),
      });
      if (!r.ok) throw new Error(r.error || "Entity analysis failed");
      setEntityResult(r);
    } catch (e) { setActiveErr(e.message); }
    setEntityLoading(false);
  };

  const runNlp = async () => {
    if (!content.trim() || !keyword.trim()) { setActiveErr("Enter content and a target keyword first."); return; }
    setNlpLoading(true); setActiveErr("");
    try {
      const r = await apiFetchJSON(`${API}/nlp-terms`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, keyword }),
      });
      if (!r.ok) throw new Error(r.error || "NLP analysis failed");
      setNlpResult(r);
    } catch (e) { setActiveErr(e.message); }
    setNlpLoading(false);
  };

  const runFacts = async () => {
    if (!content.trim()) return;
    setFactsLoading(true); setActiveErr("");
    try {
      const r = await apiFetchJSON(`${API}/insert-facts`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, topic: keyword }),
      });
      if (!r.ok) throw new Error(r.error || "Facts analysis failed");
      setFactsResult(r);
    } catch (e) { setActiveErr(e.message); }
    setFactsLoading(false);
  };

  const analysisLoading = scoreLoading || entityLoading || nlpLoading || factsLoading;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Content Scoring & Optimization</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered content quality grading across 8 dimensions — readability, E-E-A-T, entity coverage, NLP terms, factual authority and more. Clearscope-depth analysis for Shopify merchants.</p>
      </div>

      {/* Content input */}
      <div style={S.card}>
        <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
          <input style={S.input} value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="Target keyword (e.g. 'running shoes for beginners')" />
          <button style={S.btn("primary")} onClick={runScore} disabled={analysisLoading || !content.trim()}>{scoreLoading ? "Scoring…" : "Score Content"}</button>
        </div>
        <textarea style={{ ...S.ta, minHeight: 200 }} value={content} onChange={e => setContent(e.target.value)} placeholder="Paste your content here — blog post, product description, landing page copy… The AI will grade it across 8 quality dimensions." />
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={runEntityAnalysis} disabled={analysisLoading || !content.trim()}>Entity Analysis</button>
          <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={runNlp} disabled={analysisLoading || !content.trim()}>NLP Terms</button>
          <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={runFacts} disabled={analysisLoading || !content.trim()}>Facts & E-E-A-T</button>
          <div style={{ fontSize: 12, color: "#52525b", alignSelf: "center", marginLeft: "auto" }}>{content.split(/\s+/).filter(Boolean).length} words</div>
        </div>
      </div>

      <ErrorBox message={scoreError || activeErr} />

      {analysisLoading && <div style={{ textAlign: "center", padding: 40 }}><Spinner size={36} /><div style={{ color: "#71717a", marginTop: 12, fontSize: 13 }}>AI is analysing your content…</div></div>}

      {(scoreResult || entityResult || nlpResult || factsResult) && !analysisLoading && (
        <>
          {/* Grade banner */}
          {scoreResult && (
            <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap", marginBottom: 20 }}>
              <div style={{ textAlign: "center", minWidth: 90 }}>
                <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, color: GRADE_COLOR[scoreResult.grade] || "#fafafa" }}>{scoreResult.grade}</div>
                <div style={{ fontSize: 11, color: "#52525b", fontWeight: 600, textTransform: "uppercase" }}>Grade</div>
              </div>
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
                {[
                  { label: "Overall Score", value: scoreResult.overallScore, color: GRADE_COLOR[scoreResult.grade] || "#4f46e5" },
                  { label: "Word Count",    value: scoreResult.wordCount, color: "#818cf8" },
                  { label: "Reading Level", value: scoreResult.readingLevel, color: "#0ea5e9", small: true },
                  { label: "Issues Found",  value: (scoreResult.topIssues || []).length, color: "#f87171" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: m.small ? 13 : 22, fontWeight: 900, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <MozTabs tabs={TABS} active={tab} onChange={setTab} />

          {/* CONTENT SCORE */}
          {tab === "score" && scoreResult && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                <div style={S.card}>
                  <div style={S.sectionTitle}>8-Dimension Score Breakdown</div>
                  {Object.entries(scoreResult.dimensions || {}).map(([key, dim]) => (
                    <ScoreBar key={key} label={DIM_LABELS[key] || key} score={dim.score || 0} feedback={dim.feedback} details={dim.details} />
                  ))}
                </div>
                <div>
                  {(scoreResult.topIssues || []).length > 0 && (
                    <div style={S.card}>
                      <div style={S.sectionTitle}>Top Issues to Fix</div>
                      {scoreResult.topIssues.map((issue, i) => (
                        <div key={i} style={S.row}>
                          <span style={{ color: "#f87171", fontWeight: 700, fontSize: 13, minWidth: 20 }}>{i + 1}</span>
                          <span style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {(scoreResult.quickWins || []).length > 0 && (
                    <div style={S.card}>
                      <div style={S.sectionTitle}>Quick Wins ⚡</div>
                      {scoreResult.quickWins.map((win, i) => (
                        <div key={i} style={S.row}>
                          <span style={{ color: "#4ade80", fontSize: 14 }}>✓</span>
                          <span style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{win}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === "score" && !scoreResult && (
            <div style={{ marginTop: 20 }}>
              <EmptyState icon="📊" title="Click 'Score Content' to analyse your content" description="Get an overall grade and 8-dimension breakdown in seconds." />
            </div>
          )}

          {/* ENTITY ANALYSIS */}
          {tab === "entities" && (
            <div style={{ marginTop: 20 }}>
              {!entityResult ? (
                <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>Entity analysis checks which named entities are present, missing, or under-optimised in your content.</div>
                  <button style={S.btn("primary")} onClick={runEntityAnalysis} disabled={entityLoading || !content.trim()}>Run Entity Analysis</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Entities Found ({(entityResult.entitiesFound || []).length})</div>
                    {(entityResult.entitiesFound || []).map((e, i) => (
                      <div key={i} style={{ ...S.row, alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700, fontSize: 13, color: "#e4e4e7" }}>{e.name}</span>
                          {" "}<span style={S.badge("info")}>{e.type}</span>
                          {e.prominent && <span style={{ ...S.badge("good"), marginLeft: 4 }}>Prominent</span>}
                        </div>
                        <span style={{ fontSize: 12, color: "#52525b" }}>{e.mentions}× mentions</span>
                      </div>
                    ))}
                    {entityResult.entityDensityScore != null && (
                      <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12, color: "#71717a" }}>Entity Density Score</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: "#4f46e5" }}>{entityResult.entityDensityScore}/100</span>
                      </div>
                    )}
                  </div>
                  <div>
                    {(entityResult.missingKeyEntities || []).length > 0 && (
                      <div style={S.card}>
                        <div style={S.sectionTitle}>Missing Key Entities</div>
                        {entityResult.missingKeyEntities.map((e, i) => (
                          <div key={i} style={S.row}><span style={{ color: "#f87171" }}>✗</span><span style={{ fontSize: 13, color: "#e4e4e7" }}>{e}</span></div>
                        ))}
                      </div>
                    )}
                    {(entityResult.underOptimizedEntities || []).length > 0 && (
                      <div style={S.card}>
                        <div style={S.sectionTitle}>Under-Optimised Entities</div>
                        {entityResult.underOptimizedEntities.map((e, i) => (
                          <div key={i} style={S.row}>
                            <div><div style={{ fontSize: 13, fontWeight: 600, color: "#fbbf24" }}>{e.entity}</div><div style={{ fontSize: 12, color: "#71717a" }}>{e.suggestion}</div></div>
                          </div>
                        ))}
                      </div>
                    )}
                    {entityResult.topicAuthority && (
                      <div style={S.card}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                          <div style={S.sectionTitle}>Topic Authority</div>
                          <span style={{ fontSize: 16, fontWeight: 800, color: "#4f46e5" }}>{entityResult.topicAuthority.score}/100</span>
                        </div>
                        {(entityResult.topicAuthority.strengths || []).map((s, i) => <div key={i} style={S.row}><span style={{ color: "#4ade80" }}>✓</span><span style={{ fontSize: 12, color: "#a1a1aa" }}>{s}</span></div>)}
                        {(entityResult.topicAuthority.gaps || []).map((g, i) => <div key={i} style={S.row}><span style={{ color: "#f87171" }}>✗</span><span style={{ fontSize: 12, color: "#a1a1aa" }}>{g}</span></div>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NLP TERMS */}
          {tab === "nlp" && (
            <div style={{ marginTop: 20 }}>
              {!nlpResult ? (
                <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 13, color: "#71717a", marginBottom: 8 }}>NLP/LSI term analysis compares your content against top-ranking pages for your keyword. Requires a target keyword.</div>
                  {!keyword.trim() && <div style={{ color: "#fbbf24", fontSize: 12, marginBottom: 12 }}>⚠ Enter a target keyword in the input above first</div>}
                  <button style={S.btn("primary")} onClick={runNlp} disabled={nlpLoading || !content.trim() || !keyword.trim()}>Analyse NLP Terms</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                  <div style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={S.sectionTitle}>Missing NLP Terms</div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <span style={{ fontSize: 12, color: "#71717a" }}>NLP Score</span>
                        <span style={{ fontWeight: 800, color: "#4f46e5" }}>{nlpResult.nlpScore}/100</span>
                      </div>
                    </div>
                    {(nlpResult.termsMissing || []).map((t, i) => (
                      <div key={i} style={{ ...S.row, alignItems: "center" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t.term}</div>
                          <div style={{ fontSize: 11, color: "#71717a" }}>{t.suggestedUsage}</div>
                        </div>
                        <span style={S.badge(t.importance === "high" ? "bad" : t.importance === "medium" ? "warn" : "good")}>{t.importance}</span>
                      </div>
                    ))}
                    {nlpResult.recommendation && (
                      <div style={{ marginTop: 12, padding: "10px 12px", background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, fontSize: 12, color: "#c7d2fe" }}>{nlpResult.recommendation}</div>
                    )}
                  </div>
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Semantic Clusters</div>
                    {(nlpResult.semanticClusters || []).map((cl, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{cl.cluster}</span>
                          <span style={S.badge(cl.covered ? "good" : "bad")}>{cl.covered ? "Covered" : "Missing"}</span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {(cl.terms || []).map(t => <span key={t} style={{ background: "#27272a", borderRadius: 12, padding: "2px 8px", fontSize: 11, color: "#a1a1aa" }}>{t}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* FACTS & E-E-A-T */}
          {tab === "facts" && (
            <div style={{ marginTop: 20 }}>
              {!factsResult ? (
                <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
                  <div style={{ fontSize: 13, color: "#71717a", marginBottom: 16 }}>Identify opportunities to add facts, statistics and data points that boost E-E-A-T signals.</div>
                  <button style={S.btn("primary")} onClick={runFacts} disabled={factsLoading || !content.trim()}>Analyse Facts & E-E-A-T</button>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
                  <div style={S.card}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={S.sectionTitle}>Fact Suggestions ({(factsResult.factSuggestions || []).length})</div>
                      {factsResult.authorityScore != null && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#4f46e5" }}>{factsResult.authorityScore}/100</div>
                          <div style={{ fontSize: 10, color: "#71717a" }}>Authority Score</div>
                        </div>
                      )}
                    </div>
                    {(factsResult.factSuggestions || []).map((f, i) => (
                      <div key={i} style={{ ...S.row, flexDirection: "column", alignItems: "flex-start" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                          <span style={S.badge(f.urgency === "high" ? "bad" : f.urgency === "medium" ? "warn" : "good")}>{f.urgency}</span>
                          <span style={{ fontSize: 11, color: "#52525b" }}>{f.source}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", marginBottom: 2 }}>{f.fact}</div>
                        <div style={{ fontSize: 12, color: "#71717a" }}>{f.insertionPoint}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    {(factsResult.eeatBoostTips || []).length > 0 && (
                      <div style={S.card}>
                        <div style={S.sectionTitle}>E-E-A-T Boost Tips</div>
                        {factsResult.eeatBoostTips.map((tip, i) => (
                          <div key={i} style={S.row}><span style={{ color: "#4f46e5", fontSize: 14 }}>💡</span><span style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{tip}</span></div>
                        ))}
                      </div>
                    )}
                    {(factsResult.claimsToVerify || []).length > 0 && (
                      <div style={S.card}>
                        <div style={S.sectionTitle}>Claims to Verify</div>
                        {factsResult.claimsToVerify.map((c, i) => (
                          <div key={i} style={S.row}><span style={{ color: "#fbbf24" }}>⚠</span><span style={{ fontSize: 13, color: "#a1a1aa" }}>{c}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* HISTORY */}
          {tab === "history" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Score History ({history.length} entries)</div>
                {history.length === 0 ? (
                  <EmptyState icon="📜" title="No scoring history yet" description="Score some content to build a history here." />
                ) : (
                  history.map((h, i) => (
                    <div key={i} style={{ ...S.row, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7", marginBottom: 2 }}>{h.content || `Entry #${i + 1}`}</div>
                        <div style={{ fontSize: 11, color: "#52525b" }}>{h.createdAt ? new Date(h.createdAt).toLocaleString() : "—"}</div>
                      </div>
                      {h.report?.grade && <span style={{ fontSize: 20, fontWeight: 900, color: GRADE_COLOR[h.report.grade] || "#fafafa" }}>{h.report.grade}</span>}
                      {h.report?.overallScore != null && <span style={{ fontSize: 14, fontWeight: 800, color: "#4f46e5" }}>{h.report.overallScore}/100</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {!analysisLoading && !scoreResult && !entityResult && !nlpResult && !factsResult && !scoreError && !activeErr && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>What This Tool Scores</div>
            {[
              { d: "Readability", t: "Flesch-Kincaid grade level, sentence complexity, paragraph structure" },
              { d: "Keyword Optimisation", t: "Keyword density, placement in H1/meta/intro, over-optimisation check" },
              { d: "Content Depth", t: "Topic coverage breadth, subtopic inclusion, word count vs. top-ranking pages" },
              { d: "Structure", t: "Heading hierarchy (H1→H2→H3), bullet points, scannable formatting" },
              { d: "E-E-A-T", t: "Experience, Expertise, Authoritativeness, Trustworthiness signals" },
              { d: "Uniqueness", t: "Originality of angle, differentiated perspective, fresh examples" },
              { d: "Entity Coverage", t: "Named entities, related concepts, semantic completeness" },
              { d: "Intent Alignment", t: "Search intent match — informational, transactional, or navigational" },
            ].map(({ d, t }) => (
              <div key={d} style={S.row}>
                <div style={{ minWidth: 160, fontWeight: 700, fontSize: 13, color: "#e4e4e7" }}>{d}</div>
                <div style={{ fontSize: 13, color: "#71717a", lineHeight: 1.5 }}>{t}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
