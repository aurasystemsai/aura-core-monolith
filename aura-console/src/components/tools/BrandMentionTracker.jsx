import React, { useState, useCallback, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/brand-mention-tracker";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, background: c === "pos" ? "#052e16" : c === "neg" ? "#3f1315" : c === "neu" ? "#27272a" : c === "warn" ? "#3d2a0a" : "#1e1b4b", color: c === "pos" ? "#4ade80" : c === "neg" ? "#f87171" : c === "neu" ? "#a1a1aa" : c === "warn" ? "#fbbf24" : "#818cf8" }),
};

const TABS = [
  { id: "monitor",     label: "Monitor" },
  { id: "sentiment",   label: "Sentiment" },
  { id: "competitors", label: "Competitors" },
  { id: "alerts",      label: "Alert Strategy" },
  { id: "guide",       label: "Best Practices" },
];

export default function BrandMentionTracker() {
  const [tab, setTab]         = useState("monitor");
  const [brand, setBrand]     = useState("");
  const [context, setContext] = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [compBrand, setCompBrand] = useState("");
  const [compResult, setCompResult] = useState(null);
  const [compLoading, setCompLoading] = useState(false);

  const analyze = async () => {
    if (!brand.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `Analyse brand mentions and sentiment for "${brand}". Context: ${context || "Shopify e-commerce store"}. Provide: mention sources, sentiment breakdown (positive/negative/neutral counts and %, key positive themes, key negative themes, notable mentions, reputation score 0-100, urgent issues to address, opportunities to amplify positive mentions). Return as structured JSON with fields: reputationScore, totalMentions, positive, negative, neutral, positiveThemes, negativeThemes, notableMentions, urgentIssues, opportunities, platforms, overallSentiment.` }),
      });
      if (!r.ok) throw new Error(r.error || "Analysis failed");
      // Parse JSON from result if it's a string
      let parsed = r.result;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed.match(/\{[\s\S]*\}/)?.[0] || "{}"); } catch { parsed = { rawResult: r.result }; }
      }
      setResult(parsed);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const analyzeCompetitor = async () => {
    if (!compBrand.trim()) return;
    setCompLoading(true); setCompResult(null);
    try {
      const r = await apiFetchJSON(`${API}/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `Compare brand mention presence and sentiment for "${brand}" vs "${compBrand}". Provide: share of voice %, sentiment scores for each, where each brand is mentioned more, key differentiators in public perception, competitive advantages/disadvantages. Return as JSON with: shareOfVoice (object with both brands), sentimentScores, competitiveAdvantages, competitiveWeaknesses, recommendation.` }),
      });
      if (!r.ok) throw new Error(r.error || "Failed");
      let parsed = r.result;
      if (typeof parsed === "string") {
        try { parsed = JSON.parse(parsed.match(/\{[\s\S]*\}/)?.[0] || "{}"); } catch { parsed = { rawResult: r.result }; }
      }
      setCompResult(parsed);
    } catch (e) { setCompResult({ error: e.message }); }
    setCompLoading(false);
  };

  const sentimentColor = (s) => s === "positive" ? "pos" : s === "negative" ? "neg" : "neu";

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Brand Mention Tracker</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Monitor your brand reputation across the web — track mentions, analyse sentiment, identify urgent issues, spot opportunities and benchmark against competitors.</p>
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <input style={S.input} value={brand} onChange={e => setBrand(e.target.value)} onKeyDown={e => e.key === "Enter" && analyze()} placeholder="Your brand name (e.g. NovaSkin, Aura Beauty)" />
          <button style={S.btn("primary")} onClick={analyze} disabled={loading || !brand.trim()}>{loading ? "Analysing…" : "Track Mentions"}</button>
        </div>
        <input style={{ ...S.input, width: "100%", marginBottom: 0 }} value={context} onChange={e => setContext(e.target.value)} placeholder="Optional context: industry, products, target audience…" />
      </div>

      <ErrorBox message={error} />
      {loading && <div style={{ textAlign: "center", padding: 40 }}><Spinner size={36} /><div style={{ color: "#71717a", marginTop: 12, fontSize: 13 }}>Scanning for brand mentions and sentiment…</div></div>}

      {result && !loading && (
        <>
          {/* Score banner */}
          <div style={{ ...S.card, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, color: (result.reputationScore || 0) >= 70 ? "#4ade80" : (result.reputationScore || 0) >= 40 ? "#fbbf24" : "#f87171" }}>{result.reputationScore ?? "—"}</div>
              <div style={{ fontSize: 11, color: "#52525b", textTransform: "uppercase", letterSpacing: 1 }}>Reputation Score</div>
            </div>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: 10 }}>
              {[
                { label: "Positive",  value: result.positive ?? "—",  color: "#4ade80" },
                { label: "Negative",  value: result.negative ?? "—",  color: "#f87171" },
                { label: "Neutral",   value: result.neutral ?? "—",   color: "#a1a1aa" },
                { label: "Total",     value: result.totalMentions ?? "—", color: "#4f46e5" },
              ].map(m => (
                <div key={m.label} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase" }}>{m.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>

          <MozTabs tabs={TABS} active={tab} onChange={setTab} />

          {/* MONITOR */}
          {tab === "monitor" && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                {(result.notableMentions || []).length > 0 && (
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Notable Mentions</div>
                    {result.notableMentions.map((m, i) => (
                      <div key={i} style={S.row}>
                        <span style={{ color: "#4f46e5", fontSize: 14 }}>📌</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.5 }}>{typeof m === "string" ? m : m.text || JSON.stringify(m)}</div>
                          {m.platform && <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{m.platform}</div>}
                        </div>
                        {m.sentiment && <span style={S.badge(sentimentColor(m.sentiment))}>{m.sentiment}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {(result.platforms || []).length > 0 && (
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Mention Sources</div>
                    {result.platforms.map((p, i) => (
                      <div key={i} style={{ ...S.row, alignItems: "center" }}>
                        <span style={{ flex: 1, fontSize: 13, color: "#e4e4e7" }}>{typeof p === "string" ? p : p.name}</span>
                        {typeof p === "object" && p.count && <span style={{ fontWeight: 700, color: "#4f46e5" }}>{p.count}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {(result.urgentIssues || []).length > 0 && (
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Urgent Issues ⚠️</div>
                    {result.urgentIssues.map((issue, i) => (
                      <div key={i} style={{ ...S.row, background: "#3f1315", borderRadius: 8, margin: "4px 0", padding: "8px 12px" }}>
                        <span style={{ color: "#f87171", fontSize: 14 }}>🚨</span>
                        <span style={{ fontSize: 13, color: "#fca5a5" }}>{issue}</span>
                      </div>
                    ))}
                  </div>
                )}
                {(result.opportunities || []).length > 0 && (
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Amplify Opportunities 🚀</div>
                    {result.opportunities.map((opp, i) => (
                      <div key={i} style={S.row}>
                        <span style={{ color: "#4ade80", fontSize: 14 }}>✓</span>
                        <span style={{ fontSize: 13, color: "#e4e4e7" }}>{opp}</span>
                      </div>
                    ))}
                  </div>
                )}
                {result.rawResult && (
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Analysis</div>
                    <pre style={S.pre}>{result.rawResult}</pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SENTIMENT */}
          {tab === "sentiment" && (
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                <div style={S.card}>
                  <div style={S.sectionTitle}>Sentiment Breakdown</div>
                  {[
                    { label: "Positive", value: result.positive, total: result.totalMentions, color: "#4ade80" },
                    { label: "Neutral",  value: result.neutral,  total: result.totalMentions, color: "#a1a1aa" },
                    { label: "Negative", value: result.negative, total: result.totalMentions, color: "#f87171" },
                  ].map(({ label, value, total, color }) => {
                    const pct = total && value ? Math.round((Number(value) / Number(total)) * 100) : 0;
                    return (
                      <div key={label} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: "#a1a1aa" }}>{label}</span>
                          <span style={{ fontWeight: 700, color }}>{value ?? "—"} ({pct}%)</span>
                        </div>
                        <div style={{ background: "#27272a", borderRadius: 4, height: 8 }}>
                          <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 8, fontSize: 13, color: "#71717a" }}>Overall: <strong style={{ color: "#fafafa" }}>{result.overallSentiment || "—"}</strong></div>
                </div>
                <div>
                  {(result.positiveThemes || []).length > 0 && (
                    <div style={S.card}>
                      <div style={S.sectionTitle}>Positive Themes</div>
                      {result.positiveThemes.map((t, i) => <div key={i} style={S.row}><span style={{ color: "#4ade80" }}>+</span><span style={{ fontSize: 13, color: "#e4e4e7" }}>{t}</span></div>)}
                    </div>
                  )}
                  {(result.negativeThemes || []).length > 0 && (
                    <div style={S.card}>
                      <div style={S.sectionTitle}>Negative Themes</div>
                      {result.negativeThemes.map((t, i) => <div key={i} style={S.row}><span style={{ color: "#f87171" }}>−</span><span style={{ fontSize: 13, color: "#e4e4e7" }}>{t}</span></div>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* COMPETITORS */}
          {tab === "competitors" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Competitor Mention Comparison</div>
                <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                  <input style={S.input} value={compBrand} onChange={e => setCompBrand(e.target.value)} onKeyDown={e => e.key === "Enter" && analyzeCompetitor()} placeholder="Competitor brand name" />
                  <button style={S.btn("primary")} onClick={analyzeCompetitor} disabled={compLoading || !compBrand.trim() || !brand.trim()}>{compLoading ? "Comparing…" : "Compare"}</button>
                </div>
                {compLoading && <div style={{ textAlign: "center", padding: 20 }}><Spinner /></div>}
                {compResult && !compLoading && (
                  compResult.error ? <ErrorBox message={compResult.error} /> : (
                    <div>
                      {compResult.shareOfVoice && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={S.sectionTitle}>Share of Voice</div>
                          {Object.entries(compResult.shareOfVoice).map(([b, pct]) => (
                            <div key={b} style={{ marginBottom: 8 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                                <span style={{ color: "#e4e4e7", fontWeight: 600 }}>{b}</span>
                                <span style={{ color: "#4f46e5", fontWeight: 700 }}>{pct}</span>
                              </div>
                              <div style={{ background: "#27272a", borderRadius: 4, height: 8 }}>
                                <div style={{ width: typeof pct === "string" ? pct : `${pct}%`, background: "#4f46e5", height: "100%", borderRadius: 4 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {compResult.recommendation && <div style={{ padding: "10px 14px", background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, fontSize: 13, color: "#c7d2fe", lineHeight: 1.6 }}>{compResult.recommendation}</div>}
                      {compResult.rawResult && <pre style={S.pre}>{compResult.rawResult}</pre>}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* ALERTS */}
          {tab === "alerts" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Alert & Response Strategy</div>
                {[
                  { urgency: "Immediate (< 1 hour)", trigger: "Negative review mentioning specific product defect or safety concern", action: "Personally respond, offer replacement, investigate with ops team" },
                  { urgency: "Same day", trigger: "Multiple negative mentions about shipping/delivery", action: "Check fulfilment status, proactively message affected customers" },
                  { urgency: "Within 24 hours", trigger: "Influencer or high-reach account mentions your brand negatively", action: "Reach out directly, offer resolution, prevent amplification" },
                  { urgency: "Weekly review", trigger: "Gradual sentiment score decline over multiple weeks", action: "Root cause analysis, customer survey, product/service audit" },
                  { urgency: "Amplify immediately", trigger: "High-reach positive mention or viral UGC", action: "Share on social, thank creator, request permission to repurpose" },
                ].map(({ urgency, trigger, action }) => (
                  <div key={urgency} style={{ ...S.row, flexDirection: "column", alignItems: "flex-start" }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: urgency.includes("Immediate") ? "#f87171" : urgency.includes("day") ? "#fbbf24" : urgency.includes("Amplify") ? "#4ade80" : "#a1a1aa", marginBottom: 4 }}>{urgency}</span>
                    <div style={{ fontSize: 13, color: "#e4e4e7", marginBottom: 2 }}><strong>Trigger:</strong> {trigger}</div>
                    <div style={{ fontSize: 12, color: "#71717a" }}><strong>Action:</strong> {action}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GUIDE */}
          {tab === "guide" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Brand Reputation Best Practices</div>
                {[
                  { t: "Respond to every review within 24 hours", d: "Businesses that respond to reviews get 45% more engagement. Even negative reviews turned positive through good responses boost trust." },
                  { t: "Set up Google Alerts for your brand name", d: "Monitor yourstore.com, your brand name, and key product names. Catch issues before they escalate." },
                  { t: "Track social mentions with brand keywords + misspellings", d: "Set up monitoring for common typos of your brand. Unhappy customers rarely spell correctly when venting." },
                  { t: "Build a review response library", d: "Create 10-15 templates for common review types — positive, shipping complaint, product issue, refund request — so responses are fast and consistent." },
                  { t: "Amplify UGC immediately", d: "When customers post positive content about your brand, reshare within 2 hours. The momentum effect compounds reach." },
                  { t: "Monitor competitor sentiment for opportunities", d: "When competitors get negative mentions for issues you excel at, create targeted content or ads positioning your strength." },
                ].map(({ t, d }) => (
                  <div key={t} style={S.row}>
                    <span style={{ color: "#4f46e5", fontSize: 15 }}>💡</span>
                    <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !result && !error && (
        <EmptyState icon="🔍" title="Enter your brand name to start monitoring" description="AI analysis of brand mentions, sentiment, urgent issues, and amplification opportunities across the web." />
      )}
    </div>
  );
}
