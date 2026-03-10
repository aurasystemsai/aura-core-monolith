import React, { useState, useEffect } from "react";
import { apiFetch, apiFetchJSON } from "../../api";
import { ToolHeader, MozTabs, MozCard, ScoreRing, MetricRow, SortableTable, ErrorBox, EmptyState, Spinner } from "../MozUI";

export default function TechnicalSEOAuditor() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [notification, setNotification] = useState("");
  const [activeTab, setActiveTab] = useState("audit");

  const fetchHistory = async () => {
    try {
      const res = await apiFetchJSON("/api/technical-seo-auditor/history");
      if (res.ok) setHistory(res.history || []);
    } catch {}
  };

  const handleRun = async () => {
    setLoading(true); setError(""); setResponse("");
    try {
      const res = await apiFetchJSON("/api/technical-seo-auditor/ai/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: input }),
      });
      if (!res.ok) throw new Error(res.error || "Unknown error");
      setResponse(res.auditReport || "No report generated");
      await apiFetch("/api/technical-seo-auditor/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: input, report: res.auditReport }),
      });
      fetchHistory();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    try {
      await apiFetch("/api/technical-seo-auditor/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback }),
      });
      setFeedback("");
      setNotification("Feedback sent � thank you!");
      setTimeout(() => setNotification(""), 3000);
    } catch (err) { setError(err.message); }
  };

  const handleShare = () => {
    if (!response) return;
    const url = `${window.location.origin}?tool=technical-seo-auditor&site=${encodeURIComponent(input)}`;
    setReportUrl(url);
    navigator.clipboard?.writeText(url);
    setNotification("Link copied to clipboard");
    setTimeout(() => setNotification(""), 3000);
  };

  function parseScore(report) {
    const m = report.match(/overall[^:]*:\s*?(\d{1,3})/i) || report.match(/score[^:]*:\s*?(\d{1,3})/i);
    return m ? Math.min(100, parseInt(m[1])) : null;
  }
  function countIssues(report, level) {
    const pattern = level === "critical" ? /critical/gi : level === "warning" ? /warning/gi : /\binfo\b/gi;
    return (report.match(pattern) || []).length;
  }

  useEffect(() => { fetchHistory(); }, []);

  const TABS = [
    { id: "audit", label: "Audit Report" },
    { id: "history", label: `History${history.length ? ` (${history.length})` : ""}` },
    { id: "feedback", label: "Feedback" },
  ];

  const histCols = [
    { key: "site", label: "Site", render: (v) => <span style={{ color: "#fafafa", fontWeight: 500 }}>{v || ""}</span> },
    { key: "auditReport", label: "Summary", render: (v) => <span style={{ color: "#a1a1aa", fontSize: 12 }}>{(v || "").slice(0, 100)}{(v || "").length > 100 ? "…" : ""}</span> },
  ];

  return (
    <div style={{ background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',sans-serif", padding: "28px 32px" }}>
      <ToolHeader
        title="Technical SEO Auditor"
        description="AI-powered technical SEO analysis — crawl issues, Core Web Vitals, structured data, and more"
        inputValue={input}
        onInputChange={setInput}
        onRun={handleRun}
        loading={loading}
        inputPlaceholder="Enter site URL (e.g. yourstore.com)"
        buttonLabel="Audit Site"
      />
      {error && <ErrorBox message={error} />}
      {notification && (
        <div style={{ background: "#1a2a1a", border: "1px solid #16a34a", borderRadius: 10, padding: "10px 16px", fontSize: 13, color: "#86efac", marginBottom: 16 }}>
          {notification}
        </div>
      )}
      {loading && <div style={{ textAlign: "center", padding: 48 }}><Spinner size={40} /></div>}
      {!loading && (
        <>
          <MozTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
          {activeTab === "audit" && (
            <div style={{ marginTop: 24 }}>
              {response ? (
                <>
                  {(() => {
                    const score = parseScore(response);
                    const critical = countIssues(response, "critical");
                    const warnings = countIssues(response, "warning");
                    const infos = countIssues(response, "info");
                    return (
                      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap", marginBottom: 24 }}>
                        {score != null && (
                          <MozCard noPad>
                            <div style={{ padding: 24, textAlign: "center" }}>
                              <ScoreRing score={score} size={100} label="SEO Score" />
                            </div>
                          </MozCard>
                        )}
                        <div style={{ flex: 1 }}>
                          <MetricRow
                            metrics={[
                              { value: critical, label: "Critical Issues", color: critical > 0 ? "#e03e40" : undefined },
                              { value: warnings, label: "Warnings", color: warnings > 0 ? "#f5c842" : undefined },
                              { value: infos, label: "Info", color: "#71717a" },
                            ]}
                          />
                        </div>
                      </div>
                    );
                  })()}
                  <MozCard
                    title="Audit Report"
                    action={
                      <button
                        onClick={handleShare}
                        style={{ background: "#27272a", border: "1px solid #3f3f46", color: "#fafafa", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                      >Share</button>
                    }
                  >
                    <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.7, color: "#e4e4e7" }}>{response}</div>
                  </MozCard>
                  {reportUrl && (
                    <div style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, padding: "10px 16px", fontSize: 12, color: "#71717a", marginTop: 12 }}>
                      Shareable link: <span style={{ color: "#818cf8" }}>{reportUrl}</span>
                    </div>
                  )}
                </>
              ) : (
                <EmptyState icon="🔍" title="Enter a site URL to audit" description="The AI will analyse technical SEO issues including crawlability, page speed, structured data, and Core Web Vitals" />
              )}
            </div>
          )}
          {activeTab === "history" && (
            <div style={{ marginTop: 24 }}>
              <MozCard title="Audit History">
                {history.length === 0 ? (
                  <EmptyState icon="📋" title="No audit history yet" description="Run your first audit to see results here" />
                ) : (
                  <SortableTable columns={histCols} rows={history} emptyText="No history" />
                )}
              </MozCard>
            </div>
          )}
          {activeTab === "feedback" && (
            <div style={{ marginTop: 24 }}>
              <MozCard title="Send Feedback">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={4}
                  style={{ width: "100%", background: "#0d0d10", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", marginBottom: 14 }}
                  placeholder="Share your feedback or suggestions..."
                />
                <button
                  onClick={handleFeedback}
                  style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, cursor: "pointer" }}
                >Send Feedback</button>
              </MozCard>
            </div>
          )}
        </>
      )}
    </div>
  );
}
