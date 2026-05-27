import React, { useState, useCallback, useRef } from "react";
import { apiFetchJSON } from "../../api";
import {
  ScoreRing, MetricRow, SortableTable, FilterBar, ToolHeader,
  MozTabs, MozCard, EmptyState, ErrorBox, Spinner,
  AuthorityBadge, LinkTypeBadge, SpamBar, ScoreBar,
} from "../MozUI";

const S = {
  page: { background: "#09090b", minHeight: "100vh", padding: "28px 32px", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : v === "gold" ? "#78350f" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 200, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "monospace", lineHeight: 1.6 },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, background: c === "good" ? "#052e16" : c === "red" ? "#3f1315" : c === "yellow" ? "#3d2a0a" : c === "blue" ? "#1e1b4b" : "#27272a", color: c === "good" ? "#4ade80" : c === "red" ? "#f87171" : c === "yellow" ? "#fbbf24" : c === "blue" ? "#818cf8" : "#a1a1aa" }),
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
};

const TABS = [
  { id: "overview",    label: "Overview" },
  { id: "inbound",     label: "Inbound Links" },
  { id: "domains",     label: "Linking Domains" },
  { id: "anchors",     label: "Anchor Text" },
  { id: "top-pages",   label: "Top Pages" },
  { id: "spam",        label: "Spam Analysis" },
  { id: "competitor",  label: "Competitor Gap" },
  { id: "new-lost",    label: "New / Lost" },
  { id: "opps",        label: "Link Opportunities" },
  { id: "outreach",    label: "AI Outreach" },
  { id: "disavow",     label: "Disavow Builder" },
];

const INBOUND_COLS = [
  { key: "url",    label: "Page",         render: v => <a href={v} target="_blank" rel="noreferrer" style={{ color: "#818cf8", fontSize: 12, wordBreak: "break-all" }}>{v}</a> },
  { key: "da",     label: "DA",           render: v => <AuthorityBadge score={v} label="DA" /> },
  { key: "pa",     label: "PA",           render: v => <AuthorityBadge score={v} label="PA" /> },
  { key: "type",   label: "Link Type",    render: v => <LinkTypeBadge type={v} /> },
  { key: "anchor", label: "Anchor Text",  render: v => <span style={{ fontSize: 12, color: "#a1a1aa" }}>{v || "â€”"}</span> },
  { key: "spam",   label: "Spam Score",   render: v => <span style={{ color: Number(v) > 8 ? "#f87171" : Number(v) > 4 ? "#f5c842" : "#1fbb7a", fontWeight: 700, fontSize: 12 }}>{v ?? "â€”"}/17</span> },
];

const DOMAIN_COLS = [
  { key: "domain", label: "Domain",          render: v => <span style={{ color: "#fafafa", fontWeight: 600, fontSize: 13 }}>{v}</span> },
  { key: "da",     label: "DA",              render: v => <AuthorityBadge score={v} label="DA" /> },
  { key: "links",  label: "Backlinks",       render: v => <span style={{ fontWeight: 700, color: "#4f46e5" }}>{(v||0).toLocaleString()}</span> },
  { key: "spam",   label: "Spam Score",      render: v => <span style={{ color: Number(v) > 8 ? "#f87171" : Number(v) > 4 ? "#f5c842" : "#1fbb7a", fontWeight: 700, fontSize: 12 }}>{v ?? "â€”"}/17</span> },
  { key: "type",   label: "Link Type",       render: v => <LinkTypeBadge type={v} /> },
];

const ANCHOR_COLS = [
  { key: "anchor",  label: "Anchor Text", render: v => <span style={{ color: "#fafafa", fontSize: 13 }}>{v || "(none)"}</span> },
  { key: "links",   label: "Links",       render: v => <span style={{ fontWeight: 700, color: "#4f46e5" }}>{(v||0).toLocaleString()}</span> },
  { key: "domains", label: "Domains",     render: v => <span style={{ fontWeight: 600, color: "#a1a1aa" }}>{(v||0).toLocaleString()}</span> },
  { key: "pct",     label: "Share",       render: v => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, background: "#27272a", borderRadius: 4, height: 6 }}>
        <div style={{ width: `${Math.min(100, v || 0)}%`, height: "100%", background: "#4f46e5", borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 11, color: "#71717a" }}>{v || 0}%</span>
    </div>
  )},
];

const TOP_PAGES_COLS = [
  { key: "url",     label: "Page",            render: v => <a href={v} target="_blank" rel="noreferrer" style={{ color: "#818cf8", fontSize: 12, wordBreak: "break-all" }}>{v}</a> },
  { key: "pa",      label: "PA",              render: v => <AuthorityBadge score={v} label="PA" /> },
  { key: "links",   label: "Inbound Links",   render: v => <span style={{ fontWeight: 700, color: "#4f46e5" }}>{(v||0).toLocaleString()}</span> },
  { key: "domains", label: "Linking Domains", render: v => <span style={{ fontWeight: 600, color: "#a1a1aa" }}>{(v||0).toLocaleString()}</span> },
];

export default function BacklinkExplorer() {
  const [domain, setDomain]         = useState("");
  const [data, setData]             = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [tab, setTab]               = useState("overview");
  const [search, setSearch]         = useState("");
  const [linkFilter, setLinkFilter] = useState("all");

  // Competitor Gap
  const [compDomain, setCompDomain]   = useState("");
  const [compData, setCompData]       = useState(null);
  const [compLoading, setCompLoading] = useState(false);
  const [compError, setCompError]     = useState("");

  // New/Lost tracking
  const [snapshot, setSnapshot] = useState(null);
  const [snapshotDiff, setSnapshotDiff] = useState(null);

  // Outreach
  const [outreachDomain, setOutreachDomain] = useState("");
  const [outreachContext, setOutreachContext] = useState("");
  const [outreachResult, setOutreachResult] = useState(null);
  const [outreachLoading, setOutreachLoading] = useState(false);

  // Disavow
  const [disavowList, setDisavowList] = useState([]);
  const [disavowInput, setDisavowInput] = useState("");

  const analyze = useCallback(async () => {
    if (!domain.trim()) return;
    setLoading(true); setError(""); setData(null); setTab("overview");
    try {
      const r = await apiFetchJSON("/api/backlink-explorer/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      if (!r.ok) throw new Error(r.error || "Analysis failed");
      setData(r.result || r);
      // Save snapshot for New/Lost tracking
      const snap = r.result || r;
      setSnapshot({ domains: (snap.linkingDomains || snap.domains || []).map(d => d.domain || d), timestamp: new Date().toISOString() });
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [domain]);

  const analyzeCompetitor = async () => {
    if (!compDomain.trim()) return;
    setCompLoading(true); setCompError(""); setCompData(null);
    try {
      const r = await apiFetchJSON("/api/backlink-explorer/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: compDomain.trim() }),
      });
      if (!r.ok) throw new Error(r.error || "Analysis failed");
      setCompData(r.result || r);
    } catch (e) { setCompError(e.message); }
    setCompLoading(false);
  };

  const generateOutreach = async () => {
    if (!outreachDomain.trim()) return;
    setOutreachLoading(true); setOutreachResult(null);
    try {
      // Re-use analyze to get the linking domain's profile, then generate email
      const r = await apiFetchJSON("/api/backlink-explorer/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: outreachDomain.trim(), context: outreachContext, generateOutreach: true }),
      });
      setOutreachResult(r.result || r);
    } catch (e) { setOutreachResult({ error: e.message }); }
    setOutreachLoading(false);
  };

  const takeNewSnapshot = async () => {
    if (!domain.trim() || !data) return;
    const newSnap = { domains: (data.linkingDomains || data.domains || []).map(d => d.domain || d), timestamp: new Date().toISOString() };
    if (snapshot) {
      const oldSet = new Set(snapshot.domains);
      const newSet = new Set(newSnap.domains);
      setSnapshotDiff({
        newLinks: newSnap.domains.filter(d => !oldSet.has(d)),
        lostLinks: snapshot.domains.filter(d => !newSet.has(d)),
        oldTimestamp: snapshot.timestamp,
        newTimestamp: newSnap.timestamp,
      });
    }
    setSnapshot(newSnap);
  };

  const addToDisavow = (domain) => {
    if (!domain || disavowList.includes(domain)) return;
    setDisavowList(l => [...l, domain]);
  };

  const exportDisavow = () => {
    const content = disavowList.map(d => `domain:${d}`).join("\n");
    const blob = new Blob([`# Disavow file generated by AURA BacklinkExplorer\n# ${new Date().toISOString()}\n\n${content}`], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "disavow.txt"; a.click();
  };

  // Derived data
  const da = data?.domainAuthority ?? data?.da ?? 0;
  const pa = data?.pageAuthority ?? data?.pa ?? 0;
  const spam = data?.spamScore ?? data?.spam ?? 0;
  const inboundLinks = data?.inboundLinks || data?.backlinks || [];
  const linkingDomains = data?.linkingDomains || data?.domains || [];
  const anchorText = data?.anchorText || data?.anchors || [];
  const topPages = data?.topPages || data?.pages || [];

  const filteredInbound = inboundLinks
    .filter(r => linkFilter === "all" || (r.type || "follow").toLowerCase() === linkFilter)
    .filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
  const filteredDomains = linkingDomains
    .filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  // Competitor gap: domains linking to competitor but not to us
  const myDomainSet = new Set(linkingDomains.map(d => d.domain || d));
  const compLinkingDomains = compData?.linkingDomains || compData?.domains || [];
  const gapDomains = compLinkingDomains.filter(d => !myDomainSet.has(d.domain || d));

  // Link opportunities from competitor's high-DA linking domains
  const opportunities = compLinkingDomains
    .filter(d => !myDomainSet.has(d.domain || d))
    .sort((a, b) => (b.da || 0) - (a.da || 0))
    .slice(0, 20);

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Backlink Explorer</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Research Domain Authority, inbound links, referring domains, anchor distribution and competitor link gaps. Ahrefs-level backlink intelligence for Shopify stores.</p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input style={S.input} value={domain} onChange={e => setDomain(e.target.value)} onKeyDown={e => e.key === "Enter" && analyze()} placeholder="Enter a domain, e.g. mystore.com" />
        <button style={S.btn("primary")} onClick={analyze} disabled={loading}>{loading ? "Analyzingâ€¦" : "Analyze Backlinks"}</button>
      </div>

      <ErrorBox message={error} />

      {loading && (
        <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
          <Spinner size={36} />
          <div style={{ color: "#71717a", marginTop: 16, fontSize: 14 }}>Analyzing backlink profile for <strong style={{ color: "#fafafa" }}>{domain}</strong>â€¦</div>
        </div>
      )}

      {!loading && !data && !error && (
        <EmptyState icon="ðŸ”—" title="Enter a domain to explore backlinks" description="Domain Authority, referring domains, anchor text distribution, spam score, competitor gap analysis and link prospecting." />
      )}

      {(data || tab === "disavow") && !loading && (
        <>
          {data && (
            <div style={{ ...S.card, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
              <ScoreRing score={da} label="Domain Authority" size={100} />
              <ScoreRing score={pa} label="Page Authority" size={80} />
              <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 12 }}>
                {[
                  { label: "Inbound Links",    value: (data?.inboundLinksCount ?? inboundLinks.length) || "â€”", color: "#4f46e5" },
                  { label: "Linking Domains",  value: (data?.linkingDomainsCount ?? linkingDomains.length) || "â€”", color: "#818cf8" },
                  { label: "Ranking Keywords", value: data?.rankingKeywords ?? "â€”", color: "#22c55e" },
                  { label: "Spam Score",       value: `${spam}/17`, color: spam > 8 ? "#f87171" : spam > 4 ? "#f5c842" : "#1fbb7a" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "14px 18px", minWidth: 110, flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{m.label}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <MozTabs tabs={TABS} active={tab} onChange={t => { setTab(t); setSearch(""); }} />

          {/* OVERVIEW */}
          {tab === "overview" && data && (
            <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              <MozCard title="Spam Score">
                <SpamBar score={spam} />
                <div style={{ marginTop: 12, fontSize: 13, color: "#71717a", lineHeight: 1.6 }}>Spam Score of {spam}/17 â€” {spam > 8 ? "High risk. Review and disavow toxic links." : spam > 4 ? "Moderate. Monitor new links closely." : "Healthy. Continue building quality links."}</div>
              </MozCard>
              <MozCard title="Link Type Distribution">
                {["follow", "nofollow", "sponsored", "ugc"].map((type, i) => {
                  const count = inboundLinks.filter(l => (l.type || "follow").toLowerCase() === type).length;
                  const pct = inboundLinks.length ? Math.round((count / inboundLinks.length) * 100) : 0;
                  const colors = ["#1fbb7a", "#f87171", "#f5c842", "#818cf8"];
                  return (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 72, fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "capitalize" }}>{type}</div>
                      <div style={{ flex: 1, background: "#27272a", borderRadius: 4, height: 8 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: colors[i], borderRadius: 4 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "#71717a", minWidth: 32, textAlign: "right" }}>{count}</span>
                    </div>
                  );
                })}
              </MozCard>
              <MozCard title="Top Anchor Text">
                {anchorText.slice(0, 8).length > 0 ? anchorText.slice(0, 8).map((a, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1f1f22", fontSize: 13 }}>
                    <span style={{ color: "#fafafa" }}>{a.anchor || "(none)"}</span>
                    <span style={{ color: "#4f46e5", fontWeight: 700 }}>{a.links || a.count || 0}</span>
                  </div>
                )) : <div style={{ color: "#52525b", fontSize: 13 }}>No anchor data</div>}
              </MozCard>
              <MozCard title="Domain Authority Benchmarks">
                {[
                  { label: "Your Domain", score: da, color: "#4f46e5" },
                  { label: "Industry Avg (eComm)", score: 35, color: "#52525b" },
                  { label: "New Domain Baseline", score: 10, color: "#27272a" },
                ].map(b => (
                  <div key={b.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "#a1a1aa" }}>{b.label}</span>
                      <span style={{ color: b.color, fontWeight: 700 }}>{b.score}</span>
                    </div>
                    <div style={{ background: "#27272a", borderRadius: 4, height: 8 }}>
                      <div style={{ width: `${b.score}%`, background: b.color, height: "100%", borderRadius: 4 }} />
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "#52525b", marginTop: 8 }}>DA 50+ = strong. DA 30-49 = good. DA below 30 = needs link building.</div>
              </MozCard>
              {data?.rawReport && (
                <div style={{ ...S.card, gridColumn: "1 / -1" }}>
                  <div style={S.sectionTitle}>AI Analysis Report</div>
                  <div style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{data.rawReport || data.result}</div>
                </div>
              )}
            </div>
          )}

          {/* INBOUND LINKS */}
          {tab === "inbound" && data && (
            <div style={{ marginTop: 20 }}>
              <MozCard title={`Inbound Links (${filteredInbound.length})`} noPad>
                <div style={{ padding: "14px 20px 0" }}>
                  <FilterBar search={search} onSearch={setSearch} placeholder="Filter by URL, anchor..." count={filteredInbound.length}>
                    <select value={linkFilter} onChange={e => setLinkFilter(e.target.value)}
                      style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 12, padding: "8px 12px" }}>
                      <option value="all">All types</option>
                      <option value="follow">Follow</option>
                      <option value="nofollow">Nofollow</option>
                      <option value="sponsored">Sponsored</option>
                      <option value="ugc">UGC</option>
                    </select>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "6px 12px" }} onClick={() => { const spam = filteredInbound.filter(l => Number(l.spam) > 8); spam.forEach(l => { const d = new URL(l.url).hostname; addToDisavow(d); }); setTab("disavow"); }}>
                      Disavow High-Spam
                    </button>
                  </FilterBar>
                </div>
                <SortableTable columns={INBOUND_COLS} rows={filteredInbound} emptyText="No inbound links found." loading={loading} />
              </MozCard>
            </div>
          )}

          {/* LINKING DOMAINS */}
          {tab === "domains" && data && (
            <div style={{ marginTop: 20 }}>
              <MozCard title={`Linking Domains (${filteredDomains.length})`} noPad>
                <div style={{ padding: "14px 20px 0" }}>
                  <FilterBar search={search} onSearch={setSearch} placeholder="Filter by domain..." count={filteredDomains.length}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => setOutreachDomain((filteredDomains[0]?.domain || ""))}> Copy Top Domain for Outreach</button>
                  </FilterBar>
                </div>
                <SortableTable columns={[...DOMAIN_COLS, { key: "domain", label: "", render: (v) => (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button style={{ ...S.btn(), fontSize: 10, padding: "3px 8px" }} onClick={() => { setOutreachDomain(v); setTab("outreach"); }}>Outreach</button>
                    <button style={{ ...S.btn("danger"), fontSize: 10, padding: "3px 8px" }} onClick={() => addToDisavow(v)}>Disavow</button>
                  </div>
                )}]} rows={filteredDomains} emptyText="No linking domains found." loading={loading} />
              </MozCard>
            </div>
          )}

          {/* ANCHOR TEXT */}
          {tab === "anchors" && data && (
            <div style={{ marginTop: 20 }}>
              <MozCard title="Anchor Text Distribution" noPad>
                <SortableTable columns={ANCHOR_COLS} rows={anchorText.filter(r => !search || (r.anchor || "").toLowerCase().includes(search.toLowerCase()))} emptyText="No anchor text data." loading={loading} />
              </MozCard>
              <div style={S.card}>
                <div style={S.sectionTitle}>Anchor Text Health Guide</div>
                {[
                  { risk: "Exact-match anchors > 20%", impact: "High risk of Penguin filter. Google sees over-optimised anchor profiles as a manipulation signal.", fix: "Diversify to branded, partial-match, and natural anchors." },
                  { risk: "No branded anchors", impact: "Indicates an unnatural link profile â€” real mentions usually include brand names.", fix: "Prioritise link building strategies that generate branded links." },
                  { risk: "Generic anchors (click here, read more)", impact: "Low SEO value but natural. Having some is fine.", fix: "Use targeted outreach to improve anchor text on key links." },
                ].map(({ risk, impact, fix }) => (
                  <div key={risk} style={{ padding: "10px 0", borderBottom: "1px solid #1f1f22" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#f87171", marginBottom: 2 }}>{risk}</div>
                    <div style={{ fontSize: 12, color: "#71717a" }}><strong style={{ color: "#52525b" }}>Impact:</strong> {impact}</div>
                    <div style={{ fontSize: 12, color: "#818cf8" }}><strong>Fix:</strong> {fix}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TOP PAGES */}
          {tab === "top-pages" && data && (
            <div style={{ marginTop: 20 }}>
              <MozCard title="Top Pages by Inbound Links" noPad>
                <SortableTable columns={TOP_PAGES_COLS} rows={topPages} emptyText="No page data available." loading={loading} />
              </MozCard>
            </div>
          )}

          {/* SPAM ANALYSIS */}
          {tab === "spam" && data && (
            <div style={{ marginTop: 20 }}>
              <MozCard title="Spam Score Breakdown">
                <SpamBar score={spam} />
                <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {(data?.spamSignals || [
                    { label: "Toxic links count",      score: Math.min(17, Math.round(spam * 1.2)) },
                    { label: "Thin content signals",   score: Math.min(17, Math.round(spam * 0.8)) },
                    { label: "Anchor manipulation",    score: Math.min(17, Math.round(spam * 0.6)) },
                    { label: "Link velocity anomaly",  score: Math.min(17, Math.round(spam * 0.4)) },
                  ]).map((sig, i) => (
                    <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>{sig.label}</div>
                      <ScoreBar score={((sig.score || 0) / 17) * 100} />
                      <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>{sig.score || 0}/17 flags</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, background: "#0d1117", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#71717a", lineHeight: 1.7 }}>
                  <strong style={{ color: "#3b9eff" }}>What is Spam Score?</strong> Moz's Spam Score represents the percentage of sites with similar features that have been penalised or banned by Google. Score above 8/17 warrants a disavow review.
                </div>
                <div style={{ marginTop: 12 }}>
                  <button style={S.btn("danger")} onClick={() => setTab("disavow")}>Build Disavow File â†’</button>
                </div>
              </MozCard>
            </div>
          )}

          {/* COMPETITOR GAP */}
          {tab === "competitor" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Competitor Backlink Gap Analysis</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Enter a competitor's domain to discover which sites link to them but not to you. These are your highest-priority link building targets.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <input style={S.input} value={compDomain} onChange={e => setCompDomain(e.target.value)} onKeyDown={e => e.key === "Enter" && analyzeCompetitor()} placeholder="e.g. competitor.com" />
                  <button style={S.btn("primary")} onClick={analyzeCompetitor} disabled={compLoading}>{compLoading ? "Analysingâ€¦" : "Analyse Competitor"}</button>
                </div>
              </div>
              {compError && <ErrorBox message={compError} />}
              {compLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>}
              {compData && (
                <>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                    {[
                      { label: "Your DA", value: da, color: "#4f46e5" },
                      { label: `${compDomain} DA`, value: compData?.domainAuthority ?? compData?.da ?? "â€”", color: "#f59e0b" },
                      { label: "Link Gap (you're missing)", value: gapDomains.length, color: "#f87171" },
                    ].map(m => (
                      <div key={m.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "14px 18px", textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: "#71717a", marginBottom: 6 }}>{m.label}</div>
                        <div style={{ fontSize: 28, fontWeight: 900, color: m.color }}>{m.value}</div>
                      </div>
                    ))}
                  </div>
                  <MozCard title={`Domains linking to ${compDomain} but NOT ${domain || "you"} (${gapDomains.length})`} noPad>
                    <SortableTable
                      columns={[...DOMAIN_COLS, { key: "domain", label: "", render: v => (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button style={{ ...S.btn("green"), fontSize: 10, padding: "3px 8px" }} onClick={() => { setOutreachDomain(v); setTab("outreach"); }}>Target</button>
                        </div>
                      )}]}
                      rows={gapDomains} emptyText="No gap found â€” you have all the same links as this competitor!" loading={compLoading}
                    />
                  </MozCard>
                </>
              )}
              {!compData && !compLoading && (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Why Competitor Gap Analysis Matters</div>
                  {[
                    { t: "Find proven link sources", d: "If a site links to your competitor, they already accept links in your niche â€” much easier to pitch than cold outreach." },
                    { t: "Prioritise by DA", d: "Sort gap domains by Domain Authority to target the highest-impact link opportunities first." },
                    { t: "Reverse-engineer their strategy", d: "See what content or pages are attracting competitor links and create better versions." },
                    { t: "Close the authority gap faster", d: "Systematically closing your link gap is the most efficient way to outrank competitors." },
                  ].map(({ t, d }) => (
                    <div key={t} style={S.row}>
                      <span style={S.badge("blue")}>âœ“</span>
                      <div><div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a" }}>{d}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NEW / LOST */}
          {tab === "new-lost" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>New & Lost Link Tracker</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Track which linking domains have been gained or lost between analysis runs. Click "Take Snapshot" after re-analysing to compare with the previous run.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button style={S.btn("primary")} onClick={takeNewSnapshot} disabled={!data}>Take New Snapshot & Compare</button>
                </div>
                {snapshot && <div style={{ marginTop: 10, fontSize: 12, color: "#52525b" }}>Last snapshot: {new Date(snapshot.timestamp).toLocaleString()} â€” {snapshot.domains.length} domains</div>}
              </div>
              {snapshotDiff ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={S.card}>
                    <div style={S.sectionTitle}>New Links Gained ({snapshotDiff.newLinks.length})</div>
                    {snapshotDiff.newLinks.length === 0 ? <EmptyState icon="ðŸ“Š" title="No new links" description="No new linking domains since last snapshot." /> :
                      snapshotDiff.newLinks.map(d => (
                        <div key={d} style={{ ...S.row, justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13, color: "#fafafa" }}>{d}</span>
                          <span style={S.badge("good")}>+New</span>
                        </div>
                      ))
                    }
                  </div>
                  <div style={S.card}>
                    <div style={S.sectionTitle}>Lost Links ({snapshotDiff.lostLinks.length})</div>
                    {snapshotDiff.lostLinks.length === 0 ? <EmptyState icon="ðŸ“Š" title="No lost links" description="No linking domains lost since last snapshot." /> :
                      snapshotDiff.lostLinks.map(d => (
                        <div key={d} style={{ ...S.row, justifyContent: "space-between" }}>
                          <span style={{ fontSize: 13, color: "#fafafa" }}>{d}</span>
                          <span style={S.badge("red")}>Lost</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ) : (
                <div style={S.card}>
                  <div style={S.sectionTitle}>How Link Monitoring Works</div>
                  {[
                    { t: "Step 1: Analyse your domain", d: "Run a backlink analysis to capture the current linking domain profile as your baseline snapshot." },
                    { t: "Step 2: Wait and re-analyse", d: "Come back after a week or two and run another analysis. Then click 'Take New Snapshot'." },
                    { t: "Step 3: Review changes", d: "See exactly which domains are newly linking (great for validating outreach campaigns) and which are lost (needs action)." },
                    { t: "Step 4: Act on lost links", d: "For lost links, reach out to the site owner to check if the link removal was intentional. Often it's just a site migration." },
                  ].map(({ t, d }) => (
                    <div key={t} style={S.row}>
                      <span style={S.badge("blue")}>â†’</span>
                      <div><div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a" }}>{d}</div></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* LINK OPPORTUNITIES */}
          {tab === "opps" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>AI-Powered Link Opportunities</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>These are your highest-priority link building targets: high-DA domains that link to competitors but not to you. Add a competitor on the Competitor Gap tab first to populate this list.</p>
              </div>
              {opportunities.length > 0 ? (
                <MozCard title={`Top ${opportunities.length} Link Opportunities (sorted by DA)`} noPad>
                  <SortableTable
                    columns={[
                      ...DOMAIN_COLS,
                      { key: "domain", label: "Priority", render: (v, row) => {
                        const score = row.da || 0;
                        const priority = score >= 50 ? "High" : score >= 30 ? "Medium" : "Low";
                        const color = score >= 50 ? "good" : score >= 30 ? "yellow" : "";
                        return <span style={S.badge(color)}>{priority}</span>;
                      }},
                      { key: "domain", label: "", render: v => (
                        <button style={{ ...S.btn("primary"), fontSize: 10, padding: "3px 10px" }} onClick={() => { setOutreachDomain(v); setTab("outreach"); }}>Write Outreach â†’</button>
                      )},
                    ]}
                    rows={opportunities} emptyText="Add a competitor on the Competitor Gap tab to find opportunities."
                  />
                </MozCard>
              ) : (
                <div style={S.card}>
                  <EmptyState icon="ðŸŽ¯" title="No opportunities yet" description="Run a Competitor Gap analysis first. The highest-DA domains linking to your competitor will appear here as prioritised link building targets." />
                  <button style={{ ...S.btn("primary"), marginTop: 14 }} onClick={() => setTab("competitor")}>Go to Competitor Gap â†’</button>
                </div>
              )}

              {/* Prospecting strategies */}
              <div style={S.card}>
                <div style={S.sectionTitle}>Link Prospecting Strategies</div>
                {[
                  { t: "Skyscraper Technique", d: "Find competitor pages with lots of backlinks, create significantly better content, then ask linking domains to update their link to yours." },
                  { t: "Resource Page Link Building", d: "Google '[your niche] + resources' or 'intitle:resources [topic]' to find curated resource pages that might link to your products." },
                  { t: "Broken Link Building", d: "Find broken links on high-DA sites in your niche, then offer your content as a replacement. Extension: Check My Links (Chrome)." },
                  { t: "Digital PR / HARO", d: "Sign up for HARO (Help a Reporter Out) to get mentioned in press articles with high-DA links." },
                  { t: "Product Reviews & Roundups", d: "Reach out to bloggers and affiliate sites for product reviews â€” these generate both traffic and quality backlinks." },
                  { t: "Supplier / Partner Links", d: "Ask existing suppliers, partners, and distributors to add a link to your store from their websites." },
                ].map(({ t, d }) => (
                  <div key={t} style={{ padding: "10px 0", borderBottom: "1px solid #1f1f22" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#818cf8" }}>{t}</div>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 3 }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI OUTREACH */}
          {tab === "outreach" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>AI Outreach Email Generator</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Generate personalised, high-converting link building outreach emails for any target domain. The AI tailors the pitch to the target site's content and your store's value proposition.</p>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>Target Domain</div>
                    <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={outreachDomain} onChange={e => setOutreachDomain(e.target.value)} placeholder="e.g. blog.example.com" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 4 }}>Context (optional â€” describe your store / what you're offering)</div>
                    <textarea style={{ ...S.ta, height: 80 }} value={outreachContext} onChange={e => setOutreachContext(e.target.value)} placeholder="e.g. We sell handmade leather goods and want a link from their sustainable fashion gift guide..." />
                  </div>
                </div>
                <div style={{ marginTop: 12 }}>
                  <button style={S.btn("primary")} onClick={generateOutreach} disabled={outreachLoading || !outreachDomain.trim()}>{outreachLoading ? "Generatingâ€¦" : "Generate Outreach Email with AI"}</button>
                </div>
              </div>

              {outreachLoading && <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div>}
              {outreachResult && (
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={S.sectionTitle}>Generated Outreach Email</div>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof outreachResult === "string" ? outreachResult : JSON.stringify(outreachResult, null, 2))}>Copy Email</button>
                  </div>
                  <div style={{ fontSize: 13, color: "#e4e4e7", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{typeof outreachResult === "string" ? outreachResult : (outreachResult.result || outreachResult.reply || JSON.stringify(outreachResult, null, 2))}</div>
                </div>
              )}

              {/* Outreach best practices */}
              <div style={S.card}>
                <div style={S.sectionTitle}>Outreach Best Practices</div>
                {[
                  { t: "Personalise every email", d: "Reference specific content on their site. Generic emails get ignored. Mention their most recent article or a specific page." },
                  { t: "Lead with value", d: "Explain what's in it for them before asking for anything. 'I have a resource your readers would love' beats 'Can I have a link?'" },
                  { t: "Keep it short", d: "3-4 sentences max. Busy editors make quick decisions. Long emails get skimmed and deleted." },
                  { t: "Follow up once", d: "Send exactly one follow-up 5-7 days after the first email. More than that is spam." },
                  { t: "Track with UTM", d: "Add UTM parameters to your link so you can see in GA4 exactly how much traffic each placed link drives." },
                ].map(({ t, d }) => (
                  <div key={t} style={S.row}>
                    <span style={S.badge("blue")}>âœ“</span>
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a" }}>{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DISAVOW BUILDER */}
          {tab === "disavow" && (
            <div style={{ marginTop: 20 }}>
              <div style={S.card}>
                <div style={S.sectionTitle}>Google Disavow File Builder</div>
                <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Build and export a Google Disavow file to remove toxic backlinks from your profile. Only disavow links you've already tried to remove manually â€” misusing disavow can harm rankings.</p>
                <div style={{ display: "flex", gap: 10 }}>
                  <input style={S.input} value={disavowInput} onChange={e => setDisavowInput(e.target.value)} placeholder="Add domain to disavow, e.g. spamsite.com" onKeyDown={e => { if (e.key === "Enter") { addToDisavow(disavowInput.trim()); setDisavowInput(""); } }} />
                  <button style={S.btn("danger")} onClick={() => { addToDisavow(disavowInput.trim()); setDisavowInput(""); }}>Add to Disavow</button>
                </div>
                {data && inboundLinks.filter(l => Number(l.spam) > 8).length > 0 && (
                  <div style={{ marginTop: 10, fontSize: 13, color: "#71717a" }}>
                    <span style={{ color: "#f87171", fontWeight: 700 }}>{inboundLinks.filter(l => Number(l.spam) > 8).length} high-spam links detected.</span>
                    {" "}<button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => {
                      inboundLinks.filter(l => Number(l.spam) > 8).forEach(l => { try { const d = new URL(l.url).hostname; addToDisavow(d); } catch {} });
                    }}>Auto-add all high-spam domains</button>
                  </div>
                )}
              </div>

              {disavowList.length > 0 ? (
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={S.sectionTitle}>Disavow List ({disavowList.length} domains)</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ ...S.btn("primary"), fontSize: 12 }} onClick={exportDisavow}>Export disavow.txt for Google</button>
                      <button style={{ ...S.btn("danger"), fontSize: 12 }} onClick={() => setDisavowList([])}>Clear All</button>
                    </div>
                  </div>
                  {disavowList.map(d => (
                    <div key={d} style={{ ...S.row, justifyContent: "space-between" }}>
                      <span style={{ fontSize: 13, color: "#fafafa", fontFamily: "monospace" }}>domain:{d}</span>
                      <button style={{ ...S.btn("danger"), fontSize: 10, padding: "3px 8px" }} onClick={() => setDisavowList(l => l.filter(x => x !== d))}>Remove</button>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, background: "#09090b", borderRadius: 8, padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#71717a" }}>
                    <div style={{ color: "#52525b" }}># Disavow file preview</div>
                    {disavowList.map(d => <div key={d} style={{ color: "#e4e4e7" }}>domain:{d}</div>)}
                  </div>
                </div>
              ) : (
                <EmptyState icon="ðŸš«" title="Disavow list is empty" description="Add toxic domains manually or use the Auto-add button after analysing your backlinks to detect high-spam links automatically." />
              )}

              <div style={S.card}>
                <div style={S.sectionTitle}>Disavow File Guidelines (Google)</div>
                {[
                  { t: "Only use as a last resort", d: "First contact the site owner and request link removal. Only disavow if you've tried and failed to get links removed." },
                  { t: "domain: prefix disavows ALL pages", d: "'domain:spamsite.com' disavows every link from that domain. Use a full URL to disavow only specific pages." },
                  { t: "Submit via Google Search Console", d: "Upload the .txt file at search.google.com/search-console/disavow-links. Processed within weeks." },
                  { t: "Disavow takes time", d: "Google re-crawls disavowed sites before ignoring them. Allow 4â€“6 weeks to see effects in rankings." },
                  { t: "Don't disavow good links", d: "Only target clearly manipulative or paid links. Disavowing legitimate editorial links will hurt your authority." },
                ].map(({ t, d }) => (
                  <div key={t} style={S.row}>
                    <span style={S.badge("yellow")}>âš </span>
                    <div><div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a" }}>{d}</div></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
