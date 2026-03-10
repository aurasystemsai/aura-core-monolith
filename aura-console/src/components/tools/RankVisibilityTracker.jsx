import React, { useState, useCallback, useEffect } from "react";
import { ToolHeader, MozTabs, MozCard, MetricRow, ErrorBox, EmptyState, Spinner, SortableTable } from "../MozUI";

const TABS = ["Track", "History"];

const S = {
  page: { background: '#09090b', minHeight: '100vh', padding: '24px', color: '#fafafa' },
  card: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '20px', marginBottom: '16px' },
  pre: { background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '16px', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '13px', color: '#e4e4e7', overflowX: 'auto' },
};

export default function RankVisibilityTracker() {
  const [tab, setTab] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const handleTrack = useCallback(async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    setReport(null);
    setAnalytics(null);
    try {
      const res = await fetch("/api/rank-visibility-tracker/ai/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), channels: { google: true }, aiModel: "gpt-4o-mini" }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Track failed");
      setReport(data.rankReport || "No report generated");
      setAnalytics(data.analytics || null);
      setHistory(prev => [{ keyword: keyword.trim(), report: data.rankReport, analytics: data.analytics, ts: new Date().toLocaleString() }, ...prev].slice(0, 20));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  const historyColumns = [
    { key: "keyword", label: "Keyword" },
    { key: "ts", label: "Date" },
  ];

  return (
    <div style={S.page}>
      <ToolHeader
        title="Rank Visibility Tracker"
        description="Track keyword rankings and visibility across search channels with AI analysis."
        inputValue={keyword}
        onInputChange={setKeyword}
        onSubmit={handleTrack}
        loading={loading}
        placeholder="Enter keyword or URL to track..."
        buttonLabel="Track Rankings"
      />

      <MozTabs tabs={TABS} active={tab} onChange={setTab} style={{ marginBottom: '20px' }} />

      {tab === 0 && (
        <>
          {loading && <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div>}
          {error && <ErrorBox message={error} />}
          {!loading && !report && !error && (
            <EmptyState icon="📊" title="Enter a keyword above to start tracking" message="We'll check your position across Google and other channels and give you an AI-powered visibility report." />
          )}
          {report && (
            <>
              {analytics && (
                <MetricRow metrics={[
                  { label: "Position", value: analytics.position ?? "—", color: "#3b9eff" },
                  { label: "Visibility", value: analytics.visibility ? `${analytics.visibility}%` : "—", color: "#1fbb7a" },
                  { label: "Search Volume", value: analytics.searchVolume ?? "—", color: "#f5c842" },
                  { label: "Difficulty", value: analytics.difficulty ?? "—", color: "#e95d1e" },
                ]} />
              )}
              <MozCard title="Rank Report" onCopy={() => navigator.clipboard?.writeText(report)}>
                <pre style={S.pre}>{report}</pre>
              </MozCard>
            </>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          {history.length === 0
            ? <EmptyState icon="🕑" title="No history yet" message="Your tracking history will appear here." />
            : <SortableTable columns={historyColumns} rows={history} />
          }
        </>
      )}
    </div>
  );
}
