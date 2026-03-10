import React, { useState, useCallback } from "react";
import { apiFetch } from "../../api";
import {
  ScoreRing, MetricRow, SortableTable, FilterBar, ToolHeader,
  MozTabs, MozCard, EmptyState, ErrorBox, Spinner,
  AuthorityBadge, LinkTypeBadge, SpamBar, ScoreBar,
} from "../MozUI";

const TABS = [
  { id: "overview",  label: "Overview" },
  { id: "inbound",   label: "Inbound Links" },
  { id: "domains",   label: "Linking Domains" },
  { id: "anchors",   label: "Anchor Text" },
  { id: "top-pages", label: "Top Pages" },
  { id: "spam",      label: "Spam Analysis" },
];

const INBOUND_COLS = [
  { key: "url",     label: "Page",            render: v => <a href={v} target="_blank" rel="noreferrer" style={{ color: "#818cf8", fontSize: 12, wordBreak: "break-all" }}>{v}</a> },
  { key: "da",      label: "DA",              render: v => <AuthorityBadge score={v} label="DA" /> },
  { key: "pa",      label: "PA",              render: v => <AuthorityBadge score={v} label="PA" /> },
  { key: "type",    label: "Link Type",       render: v => <LinkTypeBadge type={v} /> },
  { key: "anchor",  label: "Anchor Text",     render: v => <span style={{ fontSize: 12, color: "#a1a1aa" }}>{v || "�"}</span> },
  { key: "spam",    label: "Spam Score",      render: v => <span style={{ color: Number(v) > 8 ? "#f87171" : Number(v) > 4 ? "#f5c842" : "#1fbb7a", fontWeight: 700, fontSize: 12 }}>{v ?? "�"}/17</span> },
];

const DOMAIN_COLS = [
  { key: "domain",  label: "Domain",          render: v => <span style={{ color: "#fafafa", fontWeight: 600, fontSize: 13 }}>{v}</span> },
  { key: "da",      label: "DA",              render: v => <AuthorityBadge score={v} label="DA" /> },
  { key: "links",   label: "Backlinks",       render: v => <span style={{ fontWeight: 700, color: "#4f46e5" }}>{(v||0).toLocaleString()}</span> },
  { key: "spam",    label: "Spam Score",      render: v => <span style={{ color: Number(v) > 8 ? "#f87171" : Number(v) > 4 ? "#f5c842" : "#1fbb7a", fontWeight: 700, fontSize: 12 }}>{v ?? "�"}/17</span> },
  { key: "type",    label: "Link Type",       render: v => <LinkTypeBadge type={v} /> },
];

const ANCHOR_COLS = [
  { key: "anchor",  label: "Anchor Text",     render: v => <span style={{ color: "#fafafa", fontSize: 13 }}>{v || "(none)"}</span> },
  { key: "links",   label: "Links",           render: v => <span style={{ fontWeight: 700, color: "#4f46e5" }}>{(v||0).toLocaleString()}</span> },
  { key: "domains", label: "Domains",         render: v => <span style={{ fontWeight: 600, color: "#a1a1aa" }}>{(v||0).toLocaleString()}</span> },
  {
    key: "pct",     label: "Share",           render: (v, row) => (
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 100 }}>
        <div style={{ flex: 1, background: "#27272a", borderRadius: 4, height: 6 }}>
          <div style={{ width: `${Math.min(100, v || 0)}%`, height: "100%", background: "#4f46e5", borderRadius: 4 }} />
        </div>
        <span style={{ fontSize: 11, color: "#71717a" }}>{v || 0}%</span>
      </div>
    ),
  },
];

const TOP_PAGES_COLS = [
  { key: "url",     label: "Page",            render: v => <a href={v} target="_blank" rel="noreferrer" style={{ color: "#818cf8", fontSize: 12, wordBreak: "break-all" }}>{v}</a> },
  { key: "pa",      label: "PA",              render: v => <AuthorityBadge score={v} label="PA" /> },
  { key: "links",   label: "Inbound Links",   render: v => <span style={{ fontWeight: 700, color: "#4f46e5" }}>{(v||0).toLocaleString()}</span> },
  { key: "domains", label: "Linking Domains", render: v => <span style={{ fontWeight: 600, color: "#a1a1aa" }}>{(v||0).toLocaleString()}</span> },
];

export default function BacklinkExplorer() {
  const [domain, setDomain]     = useState("");
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [tab, setTab]           = useState("overview");
  const [search, setSearch]     = useState("");
  const [linkFilter, setLinkFilter] = useState("all");

  const analyze = useCallback(async () => {
    if (!domain.trim()) return;
    setLoading(true); setError(""); setData(null); setTab("overview");
    try {
      const res = await apiFetch("/api/backlink-explorer/analyze", {
        method: "POST",
        body: JSON.stringify({ domain: domain.trim() }),
      });
      if (!res.ok) throw new Error(res.error || "Analysis failed");
      setData(res.result || res);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }, [domain]);

  // -- derived display data --------------------------------------------------
  const da  = data?.domainAuthority ?? data?.da ?? 0;
  const pa  = data?.pageAuthority   ?? data?.pa ?? 0;
  const spam = data?.spamScore      ?? data?.spam ?? 0;

  const inboundLinks   = data?.inboundLinks   || data?.backlinks   || [];
  const linkingDomains = data?.linkingDomains || data?.domains     || [];
  const anchorText     = data?.anchorText     || data?.anchors     || [];
  const topPages       = data?.topPages       || data?.pages       || [];

  const filteredInbound = inboundLinks
    .filter(r => linkFilter === "all" || (r.type || "follow").toLowerCase() === linkFilter)
    .filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  const filteredDomains = linkingDomains
    .filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));

  const metrics = [
    { label: "Domain Authority", value: loading ? null : da,                         color: "#4f46e5" },
    { label: "Linking Domains",  value: loading ? null : ((data?.linkingDomainsCount ?? linkingDomains.length) || "—"), color: "#fafafa" },
    { label: "Inbound Links",    value: loading ? null : ((data?.inboundLinksCount   ?? inboundLinks.length)   || "—"), color: "#fafafa" },
    { label: "Ranking Keywords", value: loading ? null : (data?.rankingKeywords      ?? "�"),                         color: "#fafafa" },
    { label: "Spam Score",       value: loading ? null : `${spam}/17`,
      color: spam > 8 ? "#f87171" : spam > 4 ? "#f5c842" : "#1fbb7a" },
  ];

  return (
    <div style={{ background: "#09090b", minHeight: "100vh", padding: "28px 32px", fontFamily: "'Inter',system-ui,sans-serif" }}>
      <ToolHeader
        title="Link Explorer"
        description="Research backlinks, Domain Authority, and link building opportunities for any site."
        inputValue={domain}
        onInputChange={setDomain}
        onRun={analyze}
        loading={loading}
        inputPlaceholder="Enter a domain, e.g. example.com"
        buttonLabel={loading ? "Analyzing..." : "Analyze"}
      />

      <ErrorBox message={error} />

      {loading && (
        <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: 40, textAlign: "center", marginBottom: 24 }}>
          <Spinner size={36} />
          <div style={{ color: "#71717a", marginTop: 16, fontSize: 14 }}>Analyzing backlink profile for <strong style={{ color: "#fafafa" }}>{domain}</strong>...</div>
        </div>
      )}

      {!loading && !data && !error && (
        <EmptyState
          icon="link"
          title="Enter a domain to explore backlinks"
          description="Get Domain Authority, Page Authority, referring domain counts, anchor text distribution, and more."
        />
      )}

      {data && !loading && (
        <>
          {/* -- Score overview bar -------------------------------------- */}
          <div style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "24px 28px", marginBottom: 24, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
            <ScoreRing score={da} label="Domain Authority" size={100} />
            <ScoreRing score={pa} label="Page Authority" size={80} />
            <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 12 }}>
              {metrics.slice(2).map((m, i) => (
                <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "14px 18px", minWidth: 120, flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#71717a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{m.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: m.color, lineHeight: 1 }}>{m.value ?? "�"}</div>
                </div>
              ))}
            </div>
          </div>

          <MozTabs tabs={TABS} active={tab} onChange={t => { setTab(t); setSearch(""); }} />

          {/* -- OVERVIEW ------------------------------------------------ */}
          {tab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
              <MozCard title="Spam Score Analysis">
                <SpamBar score={spam} />
                <div style={{ marginTop: 16, fontSize: 13, color: "#71717a", lineHeight: 1.6 }}>
                  Moz Spam Score identifies potentially spammy sites based on {17} features correlated with penalized sites. A score above 8/17 warrants review.
                </div>
              </MozCard>
              <MozCard title="Domain Authority Over Time">
                <div style={{ color: "#52525b", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Historical DA chart � connect to Moz API for trend data</div>
              </MozCard>
              <MozCard title="Link Type Distribution">
                {["follow", "nofollow", "sponsored", "ugc"].map((type, i) => {
                  const count = inboundLinks.filter(l => (l.type || "follow").toLowerCase() === type).length;
                  const pct = inboundLinks.length ? Math.round((count / inboundLinks.length) * 100) : 0;
                  return (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{ width: 72, fontSize: 11, fontWeight: 600, color: "#a1a1aa", textTransform: "capitalize" }}>{type}</div>
                      <div style={{ flex: 1, background: "#27272a", borderRadius: 4, height: 8 }}>
                        <div style={{ width: `${pct}%`, height: "100%", background: i === 0 ? "#1fbb7a" : i === 1 ? "#f87171" : i === 2 ? "#f5c842" : "#818cf8", borderRadius: 4 }} />
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
                )) : <div style={{ color: "#52525b", fontSize: 13 }}>No anchor data available</div>}
              </MozCard>
            </div>
          )}

          {/* -- INBOUND LINKS ------------------------------------------- */}
          {tab === "inbound" && (
            <MozCard title={`Inbound Links (${filteredInbound.length})`} noPad>
              <div style={{ padding: "14px 20px 0" }}>
                <FilterBar search={search} onSearch={setSearch} placeholder="Filter by URL, anchor..." count={filteredInbound.length}>
                  <select value={linkFilter} onChange={e => setLinkFilter(e.target.value)}
                    style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 8, color: "#fafafa", fontSize: 12, padding: "8px 12px" }}>
                    <option value="all">All link types</option>
                    <option value="follow">Follow</option>
                    <option value="nofollow">Nofollow</option>
                    <option value="sponsored">Sponsored</option>
                    <option value="ugc">UGC</option>
                  </select>
                </FilterBar>
              </div>
              <SortableTable columns={INBOUND_COLS} rows={filteredInbound}
                emptyText="No inbound links found. Run an analysis to see results."
                loading={loading} />
            </MozCard>
          )}

          {/* -- LINKING DOMAINS ----------------------------------------- */}
          {tab === "domains" && (
            <MozCard title={`Linking Domains (${filteredDomains.length})`} noPad>
              <div style={{ padding: "14px 20px 0" }}>
                <FilterBar search={search} onSearch={setSearch} placeholder="Filter by domain..." count={filteredDomains.length} />
              </div>
              <SortableTable columns={DOMAIN_COLS} rows={filteredDomains}
                emptyText="No linking domains found." loading={loading} />
            </MozCard>
          )}

          {/* -- ANCHOR TEXT --------------------------------------------- */}
          {tab === "anchors" && (
            <MozCard title="Anchor Text Distribution" noPad>
              <SortableTable columns={ANCHOR_COLS} rows={anchorText.filter(r => !search || (r.anchor || "").toLowerCase().includes(search.toLowerCase()))}
                emptyText="No anchor text data." loading={loading} />
            </MozCard>
          )}

          {/* -- TOP PAGES ----------------------------------------------- */}
          {tab === "top-pages" && (
            <MozCard title="Top Pages by Inbound Links" noPad>
              <SortableTable columns={TOP_PAGES_COLS} rows={topPages}
                emptyText="No page data available." loading={loading} />
            </MozCard>
          )}

          {/* -- SPAM ANALYSIS ------------------------------------------- */}
          {tab === "spam" && (
            <MozCard title="Spam Score Breakdown">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
                {(data?.spamSignals || [
                  { label: "Low-quality links", score: spam > 12 ? 5 : spam > 8 ? 3 : 1 },
                  { label: "Thin content signals", score: spam > 10 ? 4 : 2 },
                  { label: "Link diversity",       score: spam > 6 ? 3 : 1 },
                  { label: "Anchor text diversity", score: spam > 8 ? 4 : 1 },
                ]).map((sig, i) => (
                  <div key={i} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 10, padding: "14px 16px" }}>
                    <div style={{ fontSize: 12, color: "#71717a", marginBottom: 8 }}>{sig.label}</div>
                    <ScoreBar score={((sig.score || 0) / 17) * 100} />
                    <div style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>{sig.score || 0}/17 flags</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0d1117", border: "1px solid #1e3a5f", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#71717a", lineHeight: 1.7 }}>
                <strong style={{ color: "#3b9eff" }}>What is Spam Score?</strong> Moz's Spam Score is a metric that represents the percentage of sites with similar features that have been penalized or banned by Google. A high Spam Score means the site shares characteristics with those that have been penalized.
              </div>
            </MozCard>
          )}
        </>
      )}
    </div>
  );
}
