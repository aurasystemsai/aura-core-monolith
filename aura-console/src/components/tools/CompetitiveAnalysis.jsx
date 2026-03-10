

import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { ToolHeader, MozCard, MozTabs, ScoreRing, MetricRow, SortableTable, AuthorityBadge, ErrorBox, EmptyState, Spinner, scoreColor } from "../MozUI";

const API = "/api/competitive-analysis";

export default function CompetitiveAnalysis() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  async function analyze() {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await apiFetchJSON(`${API}/analyze`, {
        method: "POST",
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok) throw new Error(res.error || "Analysis failed");
      setResult(res.result);
      setActiveTab("overview");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  const competitors = result?.competitors || result?.topCompetitors || [];
  const gaps = result?.featureGaps || result?.gaps || [];
  const recs = result?.recommendations || result?.aiRecommendations || [];
  const benchmarkScore = result?.benchmarkScore ?? result?.overallScore ?? null;

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "competitors", label: `Competitors${competitors.length ? ` (${competitors.length})` : ""}` },
    { id: "gaps", label: "Feature Gaps" },
    { id: "recommendations", label: "AI Recommendations" },
  ];

  const compCols = [
    { key: "name", label: "Competitor", render: (v) => <span style={{ fontWeight: 600, color: "#fafafa" }}>{v || ""}</span> },
    { key: "domainAuthority", label: "DA", render: (v) => v != null ? <AuthorityBadge score={v} label="DA" /> : "" },
    { key: "marketShare", label: "Market Share", render: (v) => v != null ? <span style={{ color: "#4f46e5", fontWeight: 700 }}>{v}%</span> : "" },
    { key: "strengths", label: "Key Strength", render: (v) => <span style={{ color: "#a1a1aa", fontSize: 12 }}>{Array.isArray(v) ? v[0] : v || ""}</span> },
    { key: "weaknesses", label: "Weakness", render: (v) => <span style={{ color: "#71717a", fontSize: 12 }}>{Array.isArray(v) ? v[0] : v || ""}</span> },
  ];

  return (
    <div style={{ background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',sans-serif", padding: "28px 32px" }}>
      <ToolHeader
        title="Competitive Analysis"
        description="AI-powered competitor insights, feature gap analysis, and benchmarking"
        inputValue={query}
        onInputChange={setQuery}
        onRun={analyze}
        loading={loading}
        inputPlaceholder="Enter your domain or product (e.g. yourstore.com)"
        buttonLabel="Analyse Competitors"
      />
      {error && <ErrorBox message={error} />}
      {loading && <div style={{ textAlign: "center", padding: 48 }}><Spinner size={40} /></div>}
      {!loading && result && (
        <>
          {/* Score overview */}
          <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 24 }}>
            {benchmarkScore != null && (
              <MozCard noPad>
                <div style={{ padding: "24px 28px", textAlign: "center" }}>
                  <ScoreRing score={benchmarkScore} size={100} label="Benchmark Score" />
                  <div style={{ fontSize: 12, color: "#71717a", marginTop: 8 }}>
                    {benchmarkScore >= 80 ? "Market Leader" : benchmarkScore >= 60 ? "Strong Competitor" : benchmarkScore >= 40 ? "Competitive" : "Needs Work"}
                  </div>
                </div>
              </MozCard>
            )}
            <div style={{ flex: 1 }}>
              <MetricRow
                metrics={[
                  { value: competitors.length, label: "Competitors Found", color: "#3b9eff" },
                  { value: gaps.length, label: "Feature Gaps", color: gaps.length > 5 ? "#f5c842" : "#1fbb7a" },
                  { value: recs.length, label: "AI Recommendations", color: "#4f46e5" },
                ]}
              />
            </div>
          </div>
          <MozTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
          {activeTab === "overview" && (
            <div style={{ marginTop: 20 }}>
              {result.summary && (
                <MozCard title="Executive Summary">
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "#e4e4e7", margin: 0 }}>{result.summary}</p>
                </MozCard>
              )}
              {result.marketPosition && (
                <MozCard title="Market Position">
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: "#e4e4e7", margin: 0 }}>{result.marketPosition}</p>
                </MozCard>
              )}
              {!result.summary && !result.marketPosition && (
                <MozCard title="Analysis Result">
                  <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, color: "#e4e4e7" }}>
                    {typeof result === "string" ? result : JSON.stringify(result, null, 2)}
                  </div>
                </MozCard>
              )}
            </div>
          )}
          {activeTab === "competitors" && (
            <div style={{ marginTop: 20 }}>
              <MozCard title="Competitor Breakdown" noPad>
                {competitors.length === 0 ? (
                  <EmptyState icon="??" title="No competitor data" description="The analysis did not return structured competitor data" />
                ) : (
                  <SortableTable columns={compCols} rows={competitors} emptyText="No competitors found" />
                )}
              </MozCard>
            </div>
          )}
          {activeTab === "gaps" && (
            <div style={{ marginTop: 20 }}>
              <MozCard title="Feature Gap Analysis">
                {gaps.length === 0 ? (
                  <EmptyState icon="??" title="No feature gaps identified" />
                ) : (
                  <div>
                    {gaps.map((gap, i) => (
                      <div key={i} style={{ padding: "12px 0", borderBottom: "1px solid #1f1f22" }}>
                        <div style={{ fontWeight: 600, color: "#fafafa", fontSize: 14, marginBottom: 4 }}>
                          {gap.feature || gap.gap || gap}
                        </div>
                        {gap.description && <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{gap.description}</div>}
                        {gap.priority && (
                          <span style={{ display: "inline-block", marginTop: 6, padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                            background: gap.priority === "high" ? "#2d0a0a" : gap.priority === "medium" ? "#2d1e00" : "#1a2d1a",
                            color: gap.priority === "high" ? "#f87171" : gap.priority === "medium" ? "#fbbf24" : "#4ade80",
                            border: "1px solid " + (gap.priority === "high" ? "#7f1d1d" : gap.priority === "medium" ? "#78350f" : "#14532d")
                          }}>
                            {gap.priority} priority
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </MozCard>
            </div>
          )}
          {activeTab === "recommendations" && (
            <div style={{ marginTop: 20 }}>
              <MozCard title="AI Strategic Recommendations">
                {recs.length === 0 ? (
                  <EmptyState icon="??" title="No recommendations yet" />
                ) : (
                  <div>
                    {recs.map((rec, i) => (
                      <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid #1f1f22" }}>
                        <div style={{ fontSize: 20, minWidth: 32, textAlign: "center" }}>{i + 1}</div>
                        <div>
                          <div style={{ fontWeight: 600, color: "#fafafa", fontSize: 14, marginBottom: 4 }}>
                            {rec.title || rec.recommendation || rec}
                          </div>
                          {rec.description && <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.5 }}>{rec.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </MozCard>
            </div>
          )}
        </>
      )}
      {!loading && !result && (
        <EmptyState icon="??" title="Enter a domain to analyse competitors" description="The AI will identify your top competitors, feature gaps, and strategic recommendations" />
      )}
    </div>
  );
}
