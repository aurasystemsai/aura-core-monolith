import React, { useState, useCallback, useEffect, useRef } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, MozCard, EmptyState, ErrorBox, Spinner, SortableTable } from "../MozUI";

const API = "/api/internal-link-optimizer";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 220, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  badge: (c) => ({ display: "inline-block", borderRadius: 5, padding: "2px 9px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, background: c === "good" ? "#052e16" : c === "warn" ? "#3d2a0a" : c === "bad" ? "#3f1315" : "#27272a", color: c === "good" ? "#4ade80" : c === "warn" ? "#fbbf24" : c === "bad" ? "#f87171" : "#a1a1aa" }),
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "suggest",   label: "AI Suggest" },
  { id: "library",   label: "Link Library" },
  { id: "orphans",   label: "Orphan Pages" },
  { id: "anchors",   label: "Anchor Text" },
  { id: "structure", label: "Site Structure" },
  { id: "analytics", label: "Analytics" },
];

const LINK_COLS = [
  { key: "anchor",  label: "Anchor Text",    render: v => v || "—" },
  { key: "source",  label: "Source Page",    render: v => v ? <a href={v} target="_blank" rel="noopener noreferrer" style={{ color: "#818cf8", fontSize: 12 }}>{v.replace(/^https?:\/\//, "").slice(0, 50)}</a> : "—" },
  { key: "target",  label: "Target Page",    render: v => v ? <a href={v} target="_blank" rel="noopener noreferrer" style={{ color: "#4ade80", fontSize: 12 }}>{v.replace(/^https?:\/\//, "").slice(0, 50)}</a> : "—" },
  { key: "type",    label: "Type",           render: v => <span style={{ background: v === "nav" ? "#1e1b4b" : "#18181b", color: v === "nav" ? "#818cf8" : "#a1a1aa", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontWeight: 600 }}>{v || "content"}</span> },
  { key: "clicks",  label: "Clicks",         render: v => <span style={{ fontWeight: 700, color: "#4f46e5" }}>{v ?? "—"}</span> },
];

export default function InternalLinkOptimizer() {
  const [tab, setTab]             = useState("suggest");
  const [pageContent, setPageContent] = useState("");
  const [pageUrl, setPageUrl]     = useState("");
  const [suggestResult, setSuggestResult] = useState("");
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState("");
  const [parsedSuggestions, setParsedSuggestions] = useState([]);

  const [links, setLinks]         = useState([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [newLink, setNewLink]     = useState({ anchor: "", source: "", target: "", type: "content" });
  const [editId, setEditId]       = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [search, setSearch]       = useState("");
  const fileRef                   = useRef();

  const fetchLinks = useCallback(async () => {
    setLinksLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/links`);
      if (r.ok) setLinks(r.links || []);
    } catch {}
    setLinksLoading(false);
  }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const r = await apiFetchJSON(`${API}/analytics`);
      if (r.ok) setAnalytics(r);
    } catch {}
    setAnalyticsLoading(false);
  }, []);

  useEffect(() => { fetchLinks(); fetchAnalytics(); }, [fetchLinks, fetchAnalytics]);

  // AI Suggest
  const aiSuggest = async () => {
    if (!pageContent.trim() && !pageUrl.trim()) return;
    setSuggestLoading(true); setSuggestError(""); setSuggestResult(""); setParsedSuggestions([]);
    try {
      const r = await apiFetchJSON(`${API}/ai/suggest`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageContent: pageContent || `Page: ${pageUrl}`, pageUrl }),
      });
      if (!r.ok) throw new Error(r.error || "AI suggestion failed");
      setSuggestResult(r.result || "");
      // Try to parse structured suggestions from the result
      const suggestions = [];
      const lines = (r.result || "").split("\n").filter(l => l.trim());
      lines.forEach(line => {
        const anchorMatch = line.match(/anchor[: ]+["']?([^"'\n]+?)["']?[,\s]/i);
        const targetMatch = line.match(/(?:target|link|url|href)[: ]+["']?(https?:\/\/[^\s"']+|\/[^\s"']+)/i);
        if (anchorMatch || targetMatch) {
          suggestions.push({ anchor: anchorMatch?.[1]?.trim() || line.slice(0, 50), target: targetMatch?.[1]?.trim() || "" });
        }
      });
      setParsedSuggestions(suggestions);
    } catch (e) { setSuggestError(e.message); }
    setSuggestLoading(false);
  };

  const saveToLibrary = async (suggestion) => {
    try {
      await apiFetchJSON(`${API}/links`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ anchor: suggestion.anchor, source: pageUrl, target: suggestion.target, type: "content" }),
      });
      fetchLinks();
    } catch {}
  };

  // Link CRUD
  const createLink = async () => {
    if (!newLink.anchor || !newLink.target) return;
    try {
      await apiFetchJSON(`${API}/links`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLink),
      });
      setNewLink({ anchor: "", source: "", target: "", type: "content" });
      fetchLinks();
    } catch {}
  };

  const deleteLink = async (id) => {
    try {
      await apiFetchJSON(`${API}/links/${id}`, { method: "DELETE" });
      fetchLinks();
    } catch {}
  };

  const updateLink = async (id, data) => {
    try {
      await apiFetchJSON(`${API}/links/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      setEditId(null); fetchLinks();
    } catch {}
  };

  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        await apiFetchJSON(`${API}/import`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result) }),
        });
        fetchLinks();
      } catch {}
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(links, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "internal-links.json"; a.click();
  };

  // Derived
  const filteredLinks = links.filter(l =>
    !search || [l.anchor, l.source, l.target].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  );

  // Orphan page detection (pages only linked to, never as a source)
  const sources = new Set(links.map(l => l.source).filter(Boolean));
  const targets = new Set(links.map(l => l.target).filter(Boolean));
  const orphans = [...targets].filter(t => !sources.has(t));

  // Anchor text distribution
  const anchorDist = links.reduce((acc, l) => {
    if (l.anchor) acc[l.anchor] = (acc[l.anchor] || 0) + 1;
    return acc;
  }, {});
  const topAnchors = Object.entries(anchorDist).sort((a, b) => b[1] - a[1]);

  // Site structure (pages and their link count)
  const pageLinks = links.reduce((acc, l) => {
    if (l.source) acc[l.source] = (acc[l.source] || { out: 0, in: 0 });
    if (l.target) acc[l.target] = (acc[l.target] || { out: 0, in: 0 });
    if (l.source) acc[l.source].out++;
    if (l.target) acc[l.target].in++;
    return acc;
  }, {});
  const pageStructure = Object.entries(pageLinks).sort((a, b) => (b[1].in + b[1].out) - (a[1].in + a[1].out));

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Internal Link Optimizer</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>AI-powered internal link strategy — generate contextual link suggestions, build a full link library, find orphan pages, audit anchor text diversity and visualise your site's link structure.</p>
      </div>

      {/* Summary bar */}
      {links.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(100px, 1fr))", gap: 10, marginBottom: 20 }}>
          {[
            { label: "Total Links",    value: links.length,                      color: "#4f46e5" },
            { label: "Unique Sources", value: sources.size,                      color: "#818cf8" },
            { label: "Unique Targets", value: targets.size,                      color: "#22c55e" },
            { label: "Orphan Pages",   value: orphans.length,                    color: orphans.length > 0 ? "#f59e0b" : "#22c55e" },
            { label: "Anchor Variety", value: Object.keys(anchorDist).length,    color: "#0ea5e9" },
          ].map(m => (
            <div key={m.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: m.color }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* AI SUGGEST */}
      {tab === "suggest" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>AI Internal Link Suggestions</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>Paste page content or enter a page URL. The AI will identify the best internal linking opportunities — which pages to link to, what anchor text to use, and where to place the links in the content for maximum SEO impact.</p>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <input style={S.input} value={pageUrl} onChange={e => setPageUrl(e.target.value)} placeholder="Source page URL (optional, e.g. /products/running-shoes)" />
              <button style={S.btn("primary")} onClick={aiSuggest} disabled={suggestLoading || (!pageContent.trim() && !pageUrl.trim())}>
                {suggestLoading ? "Analysing…" : "AI Suggest Links"}
              </button>
            </div>
            <textarea style={{ ...S.ta, minHeight: 160 }} value={pageContent} onChange={e => setPageContent(e.target.value)} placeholder="Paste the page content here to get contextual internal link suggestions… (or just enter the URL above)" />
          </div>

          <ErrorBox message={suggestError} />

          {suggestLoading && <div style={{ textAlign: "center", padding: 40 }}><Spinner size={36} /><div style={{ color: "#71717a", marginTop: 12, fontSize: 13 }}>Analysing content for internal linking opportunities…</div></div>}

          {suggestResult && !suggestLoading && (
            <>
              {parsedSuggestions.length > 0 && (
                <div style={S.card}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={S.sectionTitle}>Suggested Links ({parsedSuggestions.length})</div>
                  </div>
                  {parsedSuggestions.map((s, i) => (
                    <div key={i} style={{ ...S.row, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{s.anchor}</div>
                        {s.target && <div style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>{s.target}</div>}
                      </div>
                      <button style={{ ...S.btn("green"), fontSize: 11, padding: "5px 10px" }} onClick={() => saveToLibrary(s)}>Save</button>
                    </div>
                  ))}
                </div>
              )}
              <div style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={S.sectionTitle}>Full AI Analysis</div>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(suggestResult)}>Copy</button>
                </div>
                <pre style={S.pre}>{suggestResult}</pre>
              </div>
            </>
          )}

          {!suggestResult && !suggestLoading && !suggestError && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Internal Linking Best Practices</div>
              {[
                { t: "Use descriptive anchor text", d: "Avoid 'click here' — use keyword-rich anchors that describe the target page's topic." },
                { t: "Link to cornerstone content", d: "Ensure your most important pages receive the most internal links to pass maximum PageRank." },
                { t: "3–5 internal links per 1,000 words", d: "Don't over-link. Add links contextually where they add value for the reader." },
                { t: "Fix orphan pages immediately", d: "Pages with zero internal links are invisible to search engines. Every page needs at least one link." },
                { t: "Vary anchor text naturally", d: "Use a mix of exact-match, partial-match, and branded anchors to avoid over-optimisation." },
                { t: "Prioritise deep pages", d: "Link from your homepage and high-authority pages to deep product/collection pages to distribute PageRank." },
              ].map(({ t, d }) => (
                <div key={t} style={S.row}>
                  <span style={{ color: "#4f46e5", fontSize: 15, flexShrink: 0 }}>🔗</span>
                  <div><div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* LINK LIBRARY */}
      {tab === "library" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Add New Link</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, marginBottom: 10 }}>
              <input style={S.input} value={newLink.anchor} onChange={e => setNewLink(p => ({ ...p, anchor: e.target.value }))} placeholder="Anchor text *" />
              <input style={S.input} value={newLink.source} onChange={e => setNewLink(p => ({ ...p, source: e.target.value }))} placeholder="Source page URL" />
              <input style={S.input} value={newLink.target} onChange={e => setNewLink(p => ({ ...p, target: e.target.value }))} placeholder="Target page URL *" />
              <select style={{ ...S.input, flex: "unset" }} value={newLink.type} onChange={e => setNewLink(p => ({ ...p, type: e.target.value }))}>
                <option value="content">Content</option>
                <option value="nav">Navigation</option>
                <option value="footer">Footer</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={S.btn("primary")} onClick={createLink}>Add Link</button>
              <button style={S.btn()} onClick={() => fileRef.current?.click()}>Import JSON</button>
              <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
              <button style={S.btn()} onClick={handleExport}>Export JSON</button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input style={S.input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search links by anchor, source or target…" />
            <div style={{ fontSize: 12, color: "#52525b", alignSelf: "center" }}>{filteredLinks.length} links</div>
          </div>

          {linksLoading ? <div style={{ textAlign: "center", padding: 30 }}><Spinner /></div> : (
            filteredLinks.length === 0 ? (
              <EmptyState icon="🔗" title="No links in library" description="Add links manually above or use AI Suggest to generate and save them." />
            ) : (
              <div style={S.card}>
                {filteredLinks.map(link => (
                  <div key={link.id} style={{ ...S.row, alignItems: "center" }}>
                    {editId === link.id ? (
                      <EditLinkRow link={link} onSave={data => updateLink(link.id, data)} onCancel={() => setEditId(null)} />
                    ) : (
                      <>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: "#e4e4e7" }}>{link.anchor || "—"}</span>
                            <span style={{ background: "#27272a", color: "#818cf8", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 600 }}>{link.type || "content"}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "#52525b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {link.source || "—"} → {link.target || "—"}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => setEditId(link.id)}>Edit</button>
                          <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => deleteLink(link.id)}>Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {/* ORPHAN PAGES */}
      {tab === "orphans" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Orphan Pages — No Incoming Internal Links</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14, lineHeight: 1.6 }}>These pages appear as targets in your link library but have no other pages linking to them as a source. Orphan pages are harder for search engines to discover and rank. Add at least 2–3 internal links to each.</p>
            {orphans.length === 0 ? (
              <div style={{ color: "#4ade80", fontSize: 13, fontWeight: 600, padding: "12px 0" }}>✓ No orphan pages found! All target pages have incoming internal links.</div>
            ) : (
              <>
                <div style={{ marginBottom: 12, padding: "8px 12px", background: "#3d2a0a", border: "1px solid #f59e0b33", borderRadius: 8 }}>
                  <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 13 }}>{orphans.length} orphan pages detected.</span>
                  <span style={{ color: "#a1a1aa", fontSize: 12, marginLeft: 8 }}>These pages need internal links pointing to them.</span>
                </div>
                {orphans.map((page, i) => (
                  <div key={i} style={{ ...S.row, alignItems: "center" }}>
                    <span style={{ color: "#f59e0b", fontSize: 14 }}>⚠️</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#e4e4e7" }}>{page}</div>
                    </div>
                    <button style={{ ...S.btn("primary"), fontSize: 11, padding: "5px 10px" }} onClick={() => { setPageUrl(page); setTab("suggest"); }}>Get AI Links →</button>
                  </div>
                ))}
              </>
            )}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Orphan Page Fix Strategy</div>
            {[
              { t: "Add 2–3 contextual links from high-traffic pages", d: "Find your most-visited pages and add relevant internal links pointing to the orphan page." },
              { t: "Add to navigation or category pages", d: "For product/collection pages, ensure they appear in at least one navigation menu or collection." },
              { t: "Use breadcrumbs", d: "Schema-enhanced breadcrumbs provide link equity and help crawlers discover orphan pages." },
              { t: "Add a 'Related Products' or 'You May Also Like' section", d: "Automated cross-linking features in Shopify themes help eliminate orphan product pages." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", fontSize: 14 }}>💡</span>
                <div><div style={{ fontSize: 13, fontWeight: 600, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANCHOR TEXT */}
      {tab === "anchors" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <div style={S.card}>
              <div style={S.sectionTitle}>Top Anchor Text ({topAnchors.length} unique)</div>
              {topAnchors.length === 0 ? (
                <EmptyState icon="🔤" title="No anchor text data yet" description="Add links to your library to see anchor text distribution." />
              ) : (
                topAnchors.slice(0, 15).map(([anchor, count], i) => {
                  const pct = Math.round((count / links.length) * 100);
                  const overUsed = pct > 25 && links.length > 5;
                  return (
                    <div key={anchor} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: overUsed ? "#fbbf24" : "#e4e4e7", fontWeight: 600 }}>{anchor}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          {overUsed && <span style={S.badge("warn")}>Overused</span>}
                          <span style={{ color: "#4f46e5", fontWeight: 700 }}>{count}× ({pct}%)</span>
                        </div>
                      </div>
                      <div style={{ background: "#27272a", borderRadius: 4, height: 6 }}>
                        <div style={{ width: `${pct}%`, background: overUsed ? "#f59e0b" : "#4f46e5", height: "100%", borderRadius: 4 }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div style={S.card}>
              <div style={S.sectionTitle}>Anchor Text Health</div>
              {links.length === 0 ? (
                <EmptyState icon="📊" title="No links yet" description="Add links to your library to analyse anchor text." />
              ) : (
                <>
                  {[
                    { label: "Exact-match keyword anchors", value: Math.round((topAnchors.filter(([a]) => a.split(" ").length <= 3).length / Math.max(topAnchors.length, 1)) * 100), target: "10–30%", good: v => v >= 10 && v <= 30 },
                    { label: "Generic anchors (click here, etc.)", value: Math.round((links.filter(l => /click here|read more|learn more/i.test(l.anchor || "")).length / links.length) * 100), target: "< 10%", good: v => v < 10 },
                    { label: "Anchor diversity (unique/total)", value: Math.round((topAnchors.length / links.length) * 100), target: "> 50%", good: v => v > 50 },
                  ].map(({ label, value, target, good }) => (
                    <div key={label} style={{ ...S.row, flexDirection: "column", alignItems: "flex-start" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                        <span style={{ fontSize: 13, color: "#a1a1aa" }}>{label}</span>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <span style={S.badge(good(value) ? "good" : "warn")}>{value}%</span>
                          <span style={{ fontSize: 11, color: "#52525b" }}>target: {target}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "#1e1b4b", borderRadius: 8, border: "1px solid #3730a3" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#818cf8", marginBottom: 6 }}>Anchor Text Best Practices</div>
                    <div style={{ fontSize: 12, color: "#c7d2fe", lineHeight: 1.6 }}>Use a natural mix of exact-match keywords, partial-match phrases, branded terms, and contextual anchors. Avoid more than 25–30% of any single anchor type to prevent over-optimisation penalties.</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SITE STRUCTURE */}
      {tab === "structure" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Internal Link Map — Pages by Link Count</div>
            {pageStructure.length === 0 ? (
              <EmptyState icon="🗺️" title="No link structure yet" description="Add internal links to your library to visualise your site's link structure." />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #3f3f46" }}>
                      {["Page URL", "Inbound", "Outbound", "Total", "Status"].map(h => (
                        <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#71717a", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pageStructure.slice(0, 50).map(([page, counts]) => {
                      const isOrphan = counts.in === 0;
                      const isHot = counts.in >= 3;
                      return (
                        <tr key={page} style={{ borderBottom: "1px solid #1f1f22" }}>
                          <td style={{ padding: "8px 12px", color: "#a1a1aa", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: isOrphan ? "#f87171" : isHot ? "#4ade80" : "#e4e4e7" }}>{counts.in}</td>
                          <td style={{ padding: "8px 12px", color: "#a1a1aa" }}>{counts.out}</td>
                          <td style={{ padding: "8px 12px", fontWeight: 700, color: "#4f46e5" }}>{counts.in + counts.out}</td>
                          <td style={{ padding: "8px 12px" }}>
                            {isOrphan ? <span style={S.badge("bad")}>Orphan</span> : isHot ? <span style={S.badge("good")}>Well-linked</span> : <span style={S.badge()}>OK</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {pageStructure.length > 50 && <div style={{ textAlign: "center", color: "#52525b", fontSize: 12, padding: "10px 0" }}>Showing top 50 of {pageStructure.length} pages</div>}
              </div>
            )}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Link Depth Guide</div>
            {[
              { depth: "Depth 1 (Homepage)", target: "5–15 outbound links", d: "Your homepage should link to key sections, categories and cornerstone content." },
              { depth: "Depth 2 (Category/Collection)", target: "10–30 outbound links", d: "Collection pages should link to every product they contain, plus related collections." },
              { depth: "Depth 3 (Product/Article)", target: "3–8 outbound links", d: "Products should link to related products, their collection, and relevant blog posts." },
              { depth: "All pages", target: "At least 2 inbound links", d: "Every page should have at least 2–3 other pages pointing to it to avoid orphan status." },
            ].map(({ depth, target, d }) => (
              <div key={depth} style={S.row}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "baseline", marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{depth}</span>
                    <span style={{ fontSize: 11, color: "#4f46e5", fontWeight: 600 }}>{target}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {tab === "analytics" && (
        <div style={{ marginTop: 20 }}>
          {analyticsLoading ? (
            <div style={{ textAlign: "center", padding: 40 }}><Spinner /></div>
          ) : analytics ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "Total Link Clicks",  value: analytics.totalClicks ?? "—",  color: "#4f46e5" },
                  { label: "Top Performing",     value: analytics.topLink?.anchor ?? "—", color: "#22c55e" },
                  { label: "Avg CTR",            value: analytics.avgCtr ? `${analytics.avgCtr}%` : "—", color: "#f59e0b" },
                  { label: "Links Added (7d)",   value: analytics.recentLinks ?? "—",  color: "#818cf8" },
                ].map(m => (
                  <div key={m.label} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#71717a", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {(analytics.events || []).length > 0 ? (
                <div style={S.card}>
                  <div style={S.sectionTitle}>Recent Events</div>
                  {analytics.events.map((ev, i) => (
                    <div key={i} style={{ ...S.row, alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#e4e4e7" }}>{ev.event || ev.type}</div>
                        {ev.url && <div style={{ fontSize: 11, color: "#52525b" }}>{ev.url}</div>}
                      </div>
                      <div style={{ fontSize: 12, color: "#52525b" }}>{ev.createdAt ? new Date(ev.createdAt).toLocaleDateString() : ""}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState icon="📈" title="No click events recorded yet" description="Analytics will populate as internal links are clicked by visitors." />
              )}
            </>
          ) : (
            <EmptyState icon="📈" title="No analytics data" description="Add links to your library to start tracking internal link performance." />
          )}
        </div>
      )}
    </div>
  );
}

function EditLinkRow({ link, onSave, onCancel }) {
  const [data, setData] = useState({ anchor: link.anchor || "", source: link.source || "", target: link.target || "", type: link.type || "content" });
  return (
    <div style={{ flex: 1, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
      <input style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 6, color: "#fafafa", fontSize: 12, padding: "5px 8px", outline: "none", flex: 1, minWidth: 100 }} value={data.anchor} onChange={e => setData(p => ({ ...p, anchor: e.target.value }))} placeholder="Anchor" />
      <input style={{ background: "#09090b", border: "1px solid #3f3f46", borderRadius: 6, color: "#fafafa", fontSize: 12, padding: "5px 8px", outline: "none", flex: 2, minWidth: 140 }} value={data.target} onChange={e => setData(p => ({ ...p, target: e.target.value }))} placeholder="Target URL" />
      <button style={{ background: "#4f46e5", color: "#fafafa", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }} onClick={() => onSave(data)}>Save</button>
      <button style={{ background: "#27272a", color: "#fafafa", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, cursor: "pointer" }} onClick={onCancel}>Cancel</button>
    </div>
  );
}
