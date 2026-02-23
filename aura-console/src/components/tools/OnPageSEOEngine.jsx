import React, { useState, useCallback, useMemo } from 'react';

const API = '/api/on-page-seo-engine';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

/* ── Dark-theme styles ─────────────────────────────────────────────────────── */
const S = {
  page: { background: '#09090b', minHeight: '100vh', padding: '24px', color: '#fafafa' },
  card: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '20px', marginBottom: '16px' },
  elevated: { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px' },
  input: { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', color: '#fafafa', width: '100%', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  textarea: { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', color: '#fafafa', width: '100%', outline: 'none', fontSize: '14px', resize: 'vertical', boxSizing: 'border-box', minHeight: '80px' },
  select: { background: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 12px', color: '#fafafa', width: '100%', outline: 'none', fontSize: '14px', boxSizing: 'border-box' },
  btn: { background: '#4f46e5', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 500 },
  btnSm: { background: '#4f46e5', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  btnGhost: { background: 'transparent', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px' },
  btnDanger: { background: '#ef4444', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  btnSuccess: { background: '#22c55e', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: 500 },
  btnAI: { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 },
  label: { display: 'block', color: '#a1a1aa', fontSize: '13px', marginBottom: '6px', fontWeight: 500 },
  title: { fontSize: '22px', fontWeight: 700, color: '#fafafa', margin: 0 },
  subtitle: { fontSize: '14px', color: '#a1a1aa', margin: '4px 0 0' },
  h2: { fontSize: '16px', fontWeight: 600, color: '#fafafa', marginBottom: '14px' },
  muted: { color: '#71717a', fontSize: '13px' },
  badge: (color) => ({ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: 600, display: 'inline-block' }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' },
  grid4: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' },
  row: { display: 'flex', gap: '8px', alignItems: 'center' },
  rowSpread: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  stat: { background: '#18181b', border: '1px solid #3f3f46', borderRadius: '10px', padding: '16px', textAlign: 'center' },
  statNum: { fontSize: '28px', fontWeight: 700, color: '#fafafa' },
  statLabel: { fontSize: '13px', color: '#a1a1aa', marginTop: '4px' },
  formGroup: { marginBottom: '14px' },
  divider: { borderColor: '#3f3f46', margin: '16px 0' },
  progressBar: (pct, color = '#4f46e5') => ({ width: '100%', height: '8px', background: '#27272a', borderRadius: '4px', overflow: 'hidden', position: 'relative' }),
  progressFill: (pct, color = '#4f46e5') => ({ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', background: color, borderRadius: '4px', transition: 'width 0.4s ease' }),
};

const TABS = ['Analyzer', 'AI Deep Analysis', 'Content Score', 'AI Rewrite', 'Competitor Compare', 'History', 'AI Assistant', 'Bulk Scan', 'Link Health', 'Accessibility'];

function scoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f97316';
  return '#ef4444';
}

function sevColor(sev) {
  if (sev === 'high') return '#ef4444';
  if (sev === 'medium') return '#f97316';
  return '#eab308';
}

function ProgressBar({ pct, color }) {
  const c = color || scoreColor(pct);
  return (
    <div style={S.progressBar(pct, c)}>
      <div style={S.progressFill(pct, c)} />
    </div>
  );
}

function StatCard({ label, value, color = '#4f46e5' }) {
  return (
    <div style={S.stat}>
      <div style={{ ...S.statNum, color }}>{value ?? '--'}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
export default function OnPageSEOEngine() {
  const [tab, setTab] = useState(0);

  /* ── Analyzer state ──────────────────────────────────────────────────────── */
  const [url, setUrl] = useState('');
  const [keywords, setKeywords] = useState('');
  const [crawlLoading, setCrawlLoading] = useState(false);
  const [crawlData, setCrawlData] = useState(null);
  const [crawlError, setCrawlError] = useState('');

  /* ── AI Analysis state ───────────────────────────────────────────────────── */
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState('');

  /* ── Content Score state ─────────────────────────────────────────────────── */
  const [csLoading, setCsLoading] = useState(false);
  const [csResult, setCsResult] = useState(null);
  const [csError, setCsError] = useState('');

  /* ── AI Rewrite state ────────────────────────────────────────────────────── */
  const [rewriteField, setRewriteField] = useState('title');
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [rewriteResult, setRewriteResult] = useState('');
  const [rewriteError, setRewriteError] = useState('');

  /* ── History state ───────────────────────────────────────────────────────── */
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  /* ── AI Assistant state ──────────────────────────────────────────────────── */
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  /* ── Competitor Compare state ────────────────────────────────────────────── */
  const [compareUrls, setCompareUrls] = useState(['', '']);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareResults, setCompareResults] = useState(null);
  const [compareError, setCompareError] = useState('');

  /* ── AI Fix Code state ───────────────────────────────────────────────────── */
  const [fixLoading, setFixLoading] = useState({});
  const [fixResults, setFixResults] = useState({});

  /* ── Bulk Scan state ─────────────────────────────────────────────────────── */
  const [bulkUrls, setBulkUrls] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);
  const [bulkError, setBulkError] = useState('');
  const [sitemapDomain, setSitemapDomain] = useState('');
  const [sitemapLoading, setSitemapLoading] = useState(false);
  const [sitemapUrls, setSitemapUrls] = useState(null);

  /* ── Link Health state ───────────────────────────────────────────────────── */
  const [linkCheckLoading, setLinkCheckLoading] = useState(false);
  const [linkCheckResults, setLinkCheckResults] = useState(null);
  const [linkCheckError, setLinkCheckError] = useState('');
  const [redirectChainUrl, setRedirectChainUrl] = useState('');
  const [redirectChainLoading, setRedirectChainLoading] = useState(false);
  const [redirectChainResult, setRedirectChainResult] = useState(null);
  const [robotsLoading, setRobotsLoading] = useState(false);
  const [robotsResult, setRobotsResult] = useState(null);
  const [resourcesLoading, setResourcesLoading] = useState(false);
  const [resourcesResult, setResourcesResult] = useState(null);

  /* ── Analyzer: crawl a URL ───────────────────────────────────────────────── */
  const crawlPage = useCallback(async () => {
    if (!url.trim()) return;
    setCrawlLoading(true);
    setCrawlError('');
    setCrawlData(null);
    setAiAnalysis(null);
    setCsResult(null);
    setRewriteResult('');
    try {
      const data = await apiFetch('/fetch-page', { method: 'POST', body: JSON.stringify({ url: url.trim(), keywords: keywords || undefined }) });
      if (!data.ok) throw new Error(data.error || 'Crawl failed');
      setCrawlData(data);
      // save to history
      try { await apiFetch('/items', { method: 'POST', body: JSON.stringify({ url: data.url, title: data.title, score: data.scored?.overall, ts: new Date().toISOString() }) }); } catch {}
    } catch (err) {
      setCrawlError(err.message);
    } finally {
      setCrawlLoading(false);
    }
  }, [url]);

  /* ── AI: Deep analysis ───────────────────────────────────────────────────── */
  const runAiAnalysis = useCallback(async () => {
    if (!crawlData) return;
    setAiLoading(true);
    setAiError('');
    try {
      const payload = { ...crawlData, keywords: keywords || undefined };
      const data = await apiFetch('/ai/analyze', { method: 'POST', body: JSON.stringify(payload) });
      if (!data.ok) throw new Error(data.error || 'AI analysis failed');
      setAiAnalysis(data.structured || data.analysis);
    } catch (err) {
      setAiError(err.message);
    } finally {
      setAiLoading(false);
    }
  }, [crawlData, keywords]);

  /* ── AI: Content score ───────────────────────────────────────────────────── */
  const runContentScore = useCallback(async () => {
    if (!crawlData) return;
    setCsLoading(true);
    setCsError('');
    try {
      const payload = { title: crawlData.title, h1: crawlData.h1, url: crawlData.url, keywords: keywords || undefined, firstWords: crawlData.firstWords, wordCount: crawlData.wordCount };
      const data = await apiFetch('/ai/content-score', { method: 'POST', body: JSON.stringify(payload) });
      if (!data.ok) throw new Error(data.error || 'Content scoring failed');
      setCsResult(data.structured || data.raw);
    } catch (err) {
      setCsError(err.message);
    } finally {
      setCsLoading(false);
    }
  }, [crawlData, keywords]);

  /* ── AI: Rewrite field ───────────────────────────────────────────────────── */
  const runRewrite = useCallback(async () => {
    if (!crawlData) return;
    setRewriteLoading(true);
    setRewriteError('');
    try {
      const payload = { field: rewriteField, current: crawlData[rewriteField] || crawlData.title, url: crawlData.url, h1: crawlData.h1, keywords: keywords || undefined };
      const data = await apiFetch('/ai/rewrite', { method: 'POST', body: JSON.stringify(payload) });
      if (!data.ok) throw new Error(data.error || 'Rewrite failed');
      setRewriteResult(data.suggestions || '');
    } catch (err) {
      setRewriteError(err.message);
    } finally {
      setRewriteLoading(false);
    }
  }, [crawlData, rewriteField, keywords]);

  /* ── History: load items ─────────────────────────────────────────────────── */
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await apiFetch('/items');
      if (data.ok) setHistory(data.items || []);
    } catch {}
    setHistoryLoading(false);
  }, []);

  /* ── AI Assistant: chat ──────────────────────────────────────────────────── */
  const sendChat = useCallback(async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    const msgs = [...chatMessages, userMsg];
    setChatMessages(msgs);
    setChatInput('');
    setChatLoading(true);
    try {
      const systemMsg = { role: 'system', content: 'You are an expert on-page SEO consultant for Shopify stores. Give specific, actionable SEO advice with examples. The user may reference page data they have already analyzed.' };
      const data = await apiFetch('/ai/generate', { method: 'POST', body: JSON.stringify({ messages: [systemMsg, ...msgs] }) });
      if (data.ok && data.reply) {
        setChatMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch {}
    setChatLoading(false);
  }, [chatInput, chatMessages]);

  /* ── Competitor Compare ──────────────────────────────────────────────────── */
  const runCompare = useCallback(async () => {
    const validUrls = compareUrls.filter(u => u.trim());
    if (validUrls.length < 2) return;
    setCompareLoading(true);
    setCompareError('');
    setCompareResults(null);
    try {
      const data = await apiFetch('/compare', { method: 'POST', body: JSON.stringify({ urls: validUrls, keywords: keywords || undefined }) });
      if (!data.ok) throw new Error(data.error || 'Compare failed');
      setCompareResults(data.results);
    } catch (err) {
      setCompareError(err.message);
    } finally {
      setCompareLoading(false);
    }
  }, [compareUrls, keywords]);

  /* ── AI Fix Code Generator ───────────────────────────────────────────────── */
  const generateFix = useCallback(async (issueMsg, issueIdx) => {
    setFixLoading(prev => ({ ...prev, [issueIdx]: true }));
    try {
      const data = await apiFetch('/ai/fix-code', {
        method: 'POST',
        body: JSON.stringify({
          issue: issueMsg,
          url: crawlData?.url,
          pageContext: crawlData ? { title: crawlData.title, h1: crawlData.h1 } : undefined,
        }),
      });
      if (data.ok && data.fix) {
        setFixResults(prev => ({ ...prev, [issueIdx]: data.fix }));
      }
    } catch {}
    setFixLoading(prev => ({ ...prev, [issueIdx]: false }));
  }, [crawlData]);

  /* ── Bulk Scan ───────────────────────────────────────────────────────────── */
  const runBulkScan = useCallback(async () => {
    const lines = bulkUrls.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 1) return;
    setBulkLoading(true);
    setBulkError('');
    setBulkResults(null);
    try {
      const data = await apiFetch('/bulk-scan', { method: 'POST', body: JSON.stringify({ urls: lines.slice(0, 20), keywords: keywords || undefined }) });
      if (!data.ok) throw new Error(data.error || 'Bulk scan failed');
      setBulkResults(data);
    } catch (err) {
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  }, [bulkUrls, keywords]);

  /* ── Sitemap Discovery ───────────────────────────────────────────────────── */
  const discoverSitemap = useCallback(async () => {
    if (!sitemapDomain.trim()) return;
    setSitemapLoading(true);
    setSitemapUrls(null);
    try {
      const data = await apiFetch('/sitemap', { method: 'POST', body: JSON.stringify({ domain: sitemapDomain.trim() }) });
      if (!data.ok) throw new Error(data.error || 'Sitemap not found');
      setSitemapUrls(data);
    } catch (err) {
      setBulkError(err.message);
    } finally {
      setSitemapLoading(false);
    }
  }, [sitemapDomain]);

  /* ── Link Health: Check broken links ─────────────────────────────────────── */
  const checkBrokenLinks = useCallback(async () => {
    if (!crawlData?.allExternalUrls?.length) return;
    setLinkCheckLoading(true);
    setLinkCheckError('');
    setLinkCheckResults(null);
    try {
      const data = await apiFetch('/check-links', { method: 'POST', body: JSON.stringify({ links: crawlData.allExternalUrls }) });
      if (!data.ok) throw new Error(data.error || 'Link check failed');
      setLinkCheckResults(data);
    } catch (err) {
      setLinkCheckError(err.message);
    } finally {
      setLinkCheckLoading(false);
    }
  }, [crawlData]);

  /* ── Link Health: Redirect chain ─────────────────────────────────────────── */
  const checkRedirectChain = useCallback(async () => {
    const checkUrl = redirectChainUrl.trim() || url.trim();
    if (!checkUrl) return;
    setRedirectChainLoading(true);
    setRedirectChainResult(null);
    try {
      const data = await apiFetch('/redirect-chain', { method: 'POST', body: JSON.stringify({ url: checkUrl }) });
      if (!data.ok) throw new Error(data.error || 'Redirect check failed');
      setRedirectChainResult(data);
    } catch (err) {
      setLinkCheckError(err.message);
    } finally {
      setRedirectChainLoading(false);
    }
  }, [redirectChainUrl, url]);

  /* ── Robots.txt Analyzer ─────────────────────────────────────────────────── */
  const analyzeRobots = useCallback(async () => {
    if (!crawlData?.url) return;
    setRobotsLoading(true);
    setRobotsResult(null);
    try {
      const domain = new URL(crawlData.url).hostname;
      const data = await apiFetch('/robots-txt', { method: 'POST', body: JSON.stringify({ domain }) });
      if (!data.ok) throw new Error(data.error || 'Robots.txt fetch failed');
      setRobotsResult(data);
    } catch (err) {
      setLinkCheckError(err.message);
    } finally {
      setRobotsLoading(false);
    }
  }, [crawlData]);

  /* ── Page Resources Analyzer ─────────────────────────────────────────────── */
  const analyzeResources = useCallback(async () => {
    if (!crawlData?.url) return;
    setResourcesLoading(true);
    setResourcesResult(null);
    try {
      const data = await apiFetch('/page-resources', { method: 'POST', body: JSON.stringify({ url: crawlData.url }) });
      if (!data.ok) throw new Error(data.error || 'Resource analysis failed');
      setResourcesResult(data);
    } catch (err) {
      setLinkCheckError(err.message);
    } finally {
      setResourcesLoading(false);
    }
  }, [crawlData]);

  /* ══════════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={S.title}>On-Page SEO Engine</h1>
        <p style={S.subtitle}>Crawl any page, get category-weighted SEO scores, AI-powered analysis, content scoring, and rewrite suggestions — all in one place.</p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => { setTab(i); if (i === 5) loadHistory(); }}
            style={{ ...S.btnGhost, ...(tab === i ? { background: '#4f46e5', color: '#fafafa', borderColor: '#4f46e5' } : {}) }}>
            {t}
          </button>
        ))}
      </div>

      {/* URL Input Bar — always visible */}
      <div style={{ ...S.card, marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input style={{ ...S.input, flex: 2, minWidth: '240px' }} placeholder="Enter page URL (e.g. https://mystore.com/products/example)" value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === 'Enter' && crawlPage()} />
          <input style={{ ...S.input, flex: 1, minWidth: '160px' }} placeholder="Target keywords (optional, comma-separated)" value={keywords} onChange={e => setKeywords(e.target.value)} />
          <button style={S.btn} onClick={crawlPage} disabled={crawlLoading || !url.trim()}>
            {crawlLoading ? 'Crawling…' : '🔍 Analyze Page'}
          </button>
        </div>
        {crawlError && <p style={{ color: '#ef4444', margin: '8px 0 0', fontSize: '13px' }}>{crawlError}</p>}
      </div>

      {/* Tab Content */}
      {tab === 0 && <AnalyzerTab data={crawlData} keywords={keywords} fixLoading={fixLoading} fixResults={fixResults} onGenerateFix={generateFix} />}
      {tab === 1 && <AIAnalysisTab data={crawlData} analysis={aiAnalysis} loading={aiLoading} error={aiError} onRun={runAiAnalysis} />}
      {tab === 2 && <ContentScoreTab data={crawlData} result={csResult} loading={csLoading} error={csError} onRun={runContentScore} />}
      {tab === 3 && <AIRewriteTab data={crawlData} field={rewriteField} setField={setRewriteField} result={rewriteResult} loading={rewriteLoading} error={rewriteError} onRun={runRewrite} />}
      {tab === 4 && <CompetitorCompareTab urls={compareUrls} setUrls={setCompareUrls} results={compareResults} loading={compareLoading} error={compareError} onRun={runCompare} pageUrl={url} />}
      {tab === 5 && <HistoryTab items={history} loading={historyLoading} onRefresh={loadHistory} onSelect={u => { setUrl(u); setTab(0); }} />}
      {tab === 6 && <AIAssistantTab messages={chatMessages} input={chatInput} setInput={setChatInput} loading={chatLoading} onSend={sendChat} />}
      {tab === 7 && <BulkScanTab bulkUrls={bulkUrls} setBulkUrls={setBulkUrls} bulkResults={bulkResults} bulkLoading={bulkLoading} bulkError={bulkError} onRun={runBulkScan}
        sitemapDomain={sitemapDomain} setSitemapDomain={setSitemapDomain} sitemapUrls={sitemapUrls} sitemapLoading={sitemapLoading} onDiscoverSitemap={discoverSitemap}
        onSelectUrl={u => { setUrl(u); setTab(0); }} />}
      {tab === 8 && <LinkHealthTab data={crawlData} linkCheckResults={linkCheckResults} linkCheckLoading={linkCheckLoading} linkCheckError={linkCheckError} onCheckLinks={checkBrokenLinks}
        redirectChainUrl={redirectChainUrl} setRedirectChainUrl={setRedirectChainUrl} redirectChainResult={redirectChainResult} redirectChainLoading={redirectChainLoading} onCheckRedirect={checkRedirectChain}
        robotsResult={robotsResult} robotsLoading={robotsLoading} onAnalyzeRobots={analyzeRobots}
        resourcesResult={resourcesResult} resourcesLoading={resourcesLoading} onAnalyzeResources={analyzeResources} />}
      {tab === 9 && <AccessibilityTab data={crawlData} />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ANALYZER TAB — crawled page results + weighted scoring
   ══════════════════════════════════════════════════════════════════════════════ */
function AnalyzerTab({ data, keywords, fixLoading, fixResults, onGenerateFix }) {
  if (!data) return (
    <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
      <div style={{ fontSize: '16px', color: '#a1a1aa' }}>Enter a URL above and click <strong>Analyze Page</strong> to get started</div>
      <div style={S.muted}>We'll crawl the page, extract SEO signals, and give you a category-weighted score with actionable recommendations.</div>
    </div>
  );

  const { scored } = data;
  const cats = scored?.categories || {};
  const catOrder = [
    { key: 'metaTags', label: 'Meta Tags', icon: '🏷️', weight: '30%' },
    { key: 'content', label: 'Content Quality', icon: '📝', weight: '25%' },
    { key: 'technical', label: 'Technical SEO', icon: '⚙️', weight: '20%' },
    { key: 'linksImages', label: 'Links & Images', icon: '🔗', weight: '15%' },
    { key: 'keywords', label: 'Keywords', icon: '🎯', weight: '10%' },
  ];
  const issues = scored?.issues || [];

  return (
    <>
      {/* Overall Score */}
      <div style={S.card}>
        <div style={S.rowSpread}>
          <div>
            <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '4px' }}>Overall SEO Score</div>
            <div style={{ fontSize: '56px', fontWeight: 800, color: scoreColor(scored?.overall || 0) }}>{scored?.overall ?? '--'}<span style={{ fontSize: '20px', color: '#71717a' }}>/100</span></div>
          </div>
          <div style={{ textAlign: 'right', maxWidth: '50%' }}>
            <div style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '4px' }}>Page</div>
            <div style={{ fontSize: '14px', color: '#fafafa', wordBreak: 'break-all' }}>{data.url}</div>
            {data.title && <div style={{ fontSize: '13px', color: '#71717a', marginTop: '4px' }}>{data.title}</div>}
          </div>
        </div>
        <div style={{ marginTop: '12px' }}>
          <ProgressBar pct={scored?.overall || 0} />
        </div>
      </div>

      {/* Category Breakdown */}
      <div style={S.card}>
        <h2 style={S.h2}>Category Breakdown</h2>
        <div style={S.grid2}>
          {catOrder.map(c => {
            const cat = cats[c.key] || { score: 0 };
            return (
              <div key={c.key} style={S.elevated}>
                <div style={S.rowSpread}>
                  <span style={{ fontSize: '14px' }}>{c.icon} {c.label}</span>
                  <span style={{ fontSize: '13px', color: '#71717a' }}>{c.weight}</span>
                </div>
                <div style={{ fontSize: '28px', fontWeight: 700, color: scoreColor(cat.score), margin: '6px 0' }}>{cat.score}</div>
                <ProgressBar pct={cat.score} />
              </div>
            );
          })}
        </div>
      </div>

      {/* SEO Checklist */}
      <SEOChecklist data={data} />

      {/* Quick Stats */}
      <div style={S.card}>
        <h2 style={S.h2}>Page Signals</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          <StatCard label="Word Count" value={data.wordCount || 0} color={data.wordCount >= 300 ? '#22c55e' : '#f97316'} />
          <StatCard label="Internal Links" value={data.internalLinks || 0} color="#4f46e5" />
          <StatCard label="Images" value={`${data.imagesWithAlt || 0}/${data.imageCount || 0}`} color="#eab308" />
          <StatCard label="Page Size" value={`${data.pageSizeKB || '?'}KB`} color={data.pageSizeKB < 200 ? '#22c55e' : '#f97316'} />
          <StatCard label="Text Ratio" value={`${data.codeToTextRatio || 0}%`} color={data.codeToTextRatio >= 25 ? '#22c55e' : data.codeToTextRatio >= 10 ? '#eab308' : '#ef4444'} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginTop: '10px' }}>
          <StatCard label="Total Links" value={data.totalLinks || ((data.internalLinks || 0) + (data.externalLinks || 0))} color={(data.totalLinks || 0) > 200 ? '#ef4444' : (data.totalLinks || 0) > 100 ? '#eab308' : '#22c55e'} />
          <StatCard label="External Links" value={data.externalLinks || 0} color="#4f46e5" />
          <StatCard label="Followed Ext." value={data.followedExternalCount ?? '?'} color={(data.followedExternalCount || 0) > 0 ? '#22c55e' : '#f97316'} />
          <StatCard label="Nofollow Ext." value={data.nofollowExternalCount ?? 0} color="#a1a1aa" />
          <StatCard label="H1 Tags" value={data.h1Count ?? 1} color={(data.h1Count || 1) === 1 ? '#22c55e' : '#ef4444'} />
        </div>
        {/* Round 7: third row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginTop: '10px' }}>
          <StatCard label="HTTP Status" value={data.httpStatusCode || '?'} color={data.httpStatusCode === 200 ? '#22c55e' : '#f97316'} />
          <StatCard label="Response Time" value={data.responseTimeMs ? `${data.responseTimeMs}ms` : '?'} color={(data.responseTimeMs || 0) < 1000 ? '#22c55e' : '#f97316'} />
          <StatCard label="Reading Time" value={data.readingTimeMinutes ? `${data.readingTimeMinutes} min` : '?'} color="#4f46e5" />
          <StatCard label="Sentences" value={data.sentenceLengthStats?.total || '?'} color="#4f46e5" />
          <StatCard label="Modern Images" value={data.modernImageRatio != null ? `${data.modernImageRatio}%` : 'N/A'} color={(data.modernImageRatio || 0) >= 50 ? '#22c55e' : '#f97316'} />
        </div>
      </div>

      {/* SERP Preview — Desktop + Mobile Toggle */}
      <SERPPreview data={data} />

      {/* Social / OG Preview */}
      {(data.ogTitle || data.ogDescription || data.ogImage) && (
        <div style={S.card}>
          <h2 style={S.h2}>Social Share Preview (Open Graph)</h2>
          <div style={{ ...S.elevated, maxWidth: '500px' }}>
            {data.ogImage && <div style={{ background: '#27272a', borderRadius: '6px 6px 0 0', height: '160px', overflow: 'hidden' }}><img src={data.ogImage} alt="OG" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /></div>}
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>{data.ogTitle || data.title || 'Untitled'}</div>
              <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>{data.ogDescription || data.metaDescription || ''}</div>
            </div>
          </div>
        </div>
      )}

      {/* Twitter / X Card Preview */}
      {(data.twitterCard || data.twitterTitle) && (
        <div style={S.card}>
          <h2 style={S.h2}>Twitter / X Card Preview</h2>
          <div style={{ ...S.elevated, maxWidth: '500px' }}>
            {data.twitterImage && <div style={{ background: '#27272a', borderRadius: '6px 6px 0 0', height: '160px', overflow: 'hidden' }}><img src={data.twitterImage} alt="Twitter" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /></div>}
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#fafafa' }}>{data.twitterTitle || data.title || 'Untitled'}</div>
              <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>{data.twitterDescription || data.metaDescription || ''}</div>
              <div style={{ fontSize: '12px', color: '#71717a', marginTop: '4px' }}>Card type: {data.twitterCard || 'Not set'}</div>
            </div>
          </div>
          {!data.twitterCard && <div style={{ ...S.muted, color: '#f97316', marginTop: '8px' }}>⚠️ No twitter:card meta tag — Twitter may not display a rich preview when shared.</div>}
        </div>
      )}

      {/* Heading Hierarchy */}
      {data.headingHierarchy && data.headingHierarchy.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>Heading Hierarchy ({data.headingHierarchy.length} headings)</h2>
          <div style={S.elevated}>
            {data.headingHierarchy.map((h, i) => {
              const indent = (h.level - 1) * 18;
              const isH1 = h.level === 1;
              const color = isH1 ? '#fafafa' : h.level <= 3 ? '#d4d4d8' : '#a1a1aa';
              return (
                <div key={i} style={{ paddingLeft: `${indent}px`, padding: `4px 4px 4px ${indent}px`, borderBottom: i < data.headingHierarchy.length - 1 ? '1px solid #27272a' : 'none', display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace', flexShrink: 0, width: '24px' }}>H{h.level}</span>
                  <span style={{ fontSize: isH1 ? '15px' : '13px', fontWeight: isH1 ? 700 : 400, color }}>{h.text}</span>
                </div>
              );
            })}
          </div>
          {data.headingHierarchy.filter(h => h.level === 1).length > 1 && <div style={{ ...S.muted, color: '#ef4444', marginTop: '8px' }}>⚠️ Multiple H1 tags found — pages should have exactly one H1.</div>}
          {data.headingSkips && data.headingSkips.length > 0 && <div style={{ ...S.muted, color: '#f97316', marginTop: '4px' }}>⚠️ Non-sequential heading levels: {data.headingSkips.join(', ')} — don't skip heading levels.</div>}
          {(!data.headingSkips || data.headingSkips.length === 0) && data.headingHierarchy.length > 0 && data.headingHierarchy.some((h, i) => i > 0 && h.level > data.headingHierarchy[i-1].level + 1) && <div style={{ ...S.muted, color: '#f97316', marginTop: '4px' }}>⚠️ Heading hierarchy has gaps (e.g. H2 → H4 with no H3) — keep heading levels sequential.</div>}
        </div>
      )}

      {/* Schema Types */}
      {data.schemaTypes && data.schemaTypes.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>Structured Data (Schema.org)</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {data.schemaTypes.map((t, i) => <span key={i} style={S.badge('#22c55e')}>{t}</span>)}
          </div>
          <div style={{ ...S.muted, marginTop: '8px' }}>Schema markup helps search engines display rich results (star ratings, prices, FAQs) and helps AI assistants interpret your content.</div>
        </div>
      )}

      {/* Schema Markup Visualizer */}
      <SchemaVisualizer data={data} />

      {/* Readability */}
      {data.readability && data.readability.score > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>Readability Analysis</h2>
          <div style={S.grid4}>
            <StatCard label="Flesch Score" value={data.readability.score} color={scoreColor(data.readability.score)} />
            <StatCard label="Grade" value={data.readability.grade} color="#a78bfa" />
            <StatCard label="Avg Sentence" value={`${data.readability.avgSentenceLen} words`} color={data.readability.avgSentenceLen <= 20 ? '#22c55e' : '#f97316'} />
            <StatCard label="Paragraphs" value={data.paragraphCount || 0} color="#38bdf8" />
          </div>
        </div>
      )}

      {/* URL Structure */}
      {data.urlAnalysis && (
        <div style={S.card}>
          <h2 style={S.h2}>URL Structure Analysis</h2>
          <div style={S.grid3}>
            <StatCard label="URL Score" value={data.urlAnalysis.score} color={scoreColor(data.urlAnalysis.score)} />
            <StatCard label="Slug Length" value={`${data.urlAnalysis.length} chars`} color={data.urlAnalysis.length <= 75 ? '#22c55e' : '#ef4444'} />
            <StatCard label="HTTPS" value={data.urlAnalysis.isHttps ? '✅ Yes' : '❌ No'} color={data.urlAnalysis.isHttps ? '#22c55e' : '#ef4444'} />
          </div>
          {data.urlAnalysis.issues.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              {data.urlAnalysis.issues.map((iss, i) => <div key={i} style={{ ...S.muted, color: '#f97316', marginBottom: '4px' }}>⚠️ {iss}</div>)}
            </div>
          )}
        </div>
      )}

      {/* Technical Signals */}
      <div style={S.card}>
        <h2 style={S.h2}>Technical Signals</h2>
        <div style={S.grid3}>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Canonical URL</span><div style={{ fontSize: '13px', color: data.canonicalUrl ? '#22c55e' : '#ef4444', marginTop: '4px' }}>{data.canonicalUrl ? '✅ Set' : '❌ Missing'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Schema Markup</span><div style={{ fontSize: '13px', color: data.schemaMarkup ? '#22c55e' : '#ef4444', marginTop: '4px' }}>{data.schemaMarkup ? '✅ Present' : '❌ Missing'}{data.schemaTypes?.length > 0 ? ` (${data.schemaTypes.join(', ')})` : ''}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Viewport Meta</span><div style={{ fontSize: '13px', color: data.viewportMeta ? '#22c55e' : '#ef4444', marginTop: '4px' }}>{data.viewportMeta ? '✅ Mobile-ready' : '❌ Missing'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Language Tag</span><div style={{ fontSize: '13px', color: data.langTag ? '#22c55e' : '#f97316', marginTop: '4px' }}>{data.langTag || '⚠️ Missing'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Headings</span><div style={{ fontSize: '13px', color: '#fafafa', marginTop: '4px' }}>H1: {data.h1 ? '1' : '0'} · H2: {data.h2Count} · H3: {data.h3Count} · H4: {data.h4Count || 0}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Robots Meta</span><div style={{ fontSize: '13px', color: data.robotsMeta && /noindex/i.test(data.robotsMeta) ? '#ef4444' : '#22c55e', marginTop: '4px' }}>{data.robotsMeta || 'None (indexable)'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Hreflang</span><div style={{ fontSize: '13px', color: data.hreflangTags?.length > 0 ? '#22c55e' : '#71717a', marginTop: '4px' }}>{data.hreflangTags?.length > 0 ? `${data.hreflangTags.length} language${data.hreflangTags.length > 1 ? 's' : ''}` : 'None'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Content Freshness</span><div style={{ fontSize: '13px', color: data.datePublished || data.dateModified ? '#22c55e' : '#71717a', marginTop: '4px' }}>{data.dateModified ? `Updated: ${new Date(data.dateModified).toLocaleDateString()}` : data.datePublished ? `Published: ${new Date(data.datePublished).toLocaleDateString()}` : 'No dates found'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Author (E-E-A-T)</span><div style={{ fontSize: '13px', color: data.authorMeta ? '#22c55e' : '#f97316', marginTop: '4px' }}>{data.authorMeta || '⚠️ No author meta'}</div></div>
          {/* Round 7: new technical signals */}
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Favicon</span><div style={{ fontSize: '13px', color: data.hasFavicon ? '#22c55e' : '#f97316', marginTop: '4px' }}>{data.hasFavicon ? '✅ Found' : '⚠️ Missing'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Charset</span><div style={{ fontSize: '13px', color: data.hasCharset ? '#22c55e' : '#ef4444', marginTop: '4px' }}>{data.hasCharset ? '✅ Declared' : '❌ Missing'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Doctype</span><div style={{ fontSize: '13px', color: data.hasDoctype ? '#22c55e' : '#ef4444', marginTop: '4px' }}>{data.hasDoctype ? '✅ Present' : '❌ Missing'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>HTTP Status</span><div style={{ fontSize: '13px', color: data.httpStatusCode === 200 ? '#22c55e' : '#f97316', marginTop: '4px' }}>{data.httpStatusCode || '?'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Response Time</span><div style={{ fontSize: '13px', color: (data.responseTimeMs || 0) < 1000 ? '#22c55e' : (data.responseTimeMs || 0) < 3000 ? '#eab308' : '#ef4444', marginTop: '4px' }}>{data.responseTimeMs ? `${data.responseTimeMs}ms` : '?'}</div></div>
          <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Reading Time</span><div style={{ fontSize: '13px', color: '#fafafa', marginTop: '4px' }}>{data.readingTimeMinutes ? `~${data.readingTimeMinutes} min` : '?'}</div></div>
          {data.titleCount > 1 && <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Title Tags</span><div style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px' }}>❌ {data.titleCount} titles (only 1 allowed)</div></div>}
          {data.metaDescriptionCount > 1 && <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Meta Desc Tags</span><div style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px' }}>❌ {data.metaDescriptionCount} meta descriptions (only 1 allowed)</div></div>}
          {data.viewportZoomDisabled && <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Zoom Access</span><div style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px' }}>❌ Zoom disabled</div></div>}
          {data.hasLoremIpsum && <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Placeholder Text</span><div style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px' }}>❌ Lorem Ipsum found</div></div>}
          {data.titleEqualsDescription && <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Title vs Desc</span><div style={{ fontSize: '13px', color: '#f97316', marginTop: '4px' }}>⚠️ Identical</div></div>}
          {data.titleEqualsH1 && <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Title vs H1</span><div style={{ fontSize: '13px', color: '#f97316', marginTop: '4px' }}>⚠️ Same text</div></div>}
          {data.hasMetaRefresh && <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Meta Refresh</span><div style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px' }}>❌ Auto-refresh detected</div></div>}
          {data.pluginElements > 0 && <div style={S.elevated}><span style={{ fontSize: '13px', color: '#a1a1aa' }}>Plugin embeds</span><div style={{ fontSize: '13px', color: '#ef4444', marginTop: '4px' }}>❌ {data.pluginElements} plugin(s)</div></div>}
        </div>
        {data.selfLinks > 0 && <div style={{ ...S.muted, color: '#f97316', marginTop: '8px' }}>⚠️ {data.selfLinks} self-referencing link{data.selfLinks > 1 ? 's' : ''} detected — this page links to itself.</div>}
        {data.localhostLinks && data.localhostLinks.length > 0 && <div style={{ ...S.muted, color: '#ef4444', marginTop: '8px' }}>❌ {data.localhostLinks.length} link{data.localhostLinks.length > 1 ? 's' : ''} point to localhost/127.0.0.1 — development links left in production code.</div>}
        {data.genericLinkCount > 0 && <div style={{ ...S.muted, color: '#f97316', marginTop: '8px' }}>⚠️ {data.genericLinkCount} link{data.genericLinkCount > 1 ? 's' : ''} use generic anchor text ({data.genericLinkAnchors?.slice(0, 5).map(a => `"${a}"`).join(', ')}) — use descriptive text instead.</div>}
        {data.deprecatedTagsFound && data.deprecatedTagsFound.length > 0 && <div style={{ ...S.muted, color: '#ef4444', marginTop: '8px' }}>❌ Deprecated HTML tags found: {'<' + data.deprecatedTagsFound.join('>, <') + '>'} — replace with modern HTML5/CSS.</div>}
        {data.unsafeCrossOriginLinks > 0 && <div style={{ ...S.muted, color: '#f97316', marginTop: '8px' }}>⚠️ {data.unsafeCrossOriginLinks} external link{data.unsafeCrossOriginLinks > 1 ? 's' : ''} with target="_blank" missing rel="noopener" — security risk.</div>}
        {data.hasMixedContent && <div style={{ ...S.muted, color: '#ef4444', marginTop: '8px' }}>❌ Mixed content: {data.mixedContentItems?.length} HTTP resource{data.mixedContentItems?.length > 1 ? 's' : ''} loaded on HTTPS page. Browsers may block these.</div>}
        {data.plaintextEmails && data.plaintextEmails.length > 0 && <div style={{ ...S.muted, color: '#f97316', marginTop: '8px' }}>⚠️ {data.plaintextEmails.length} plaintext email{data.plaintextEmails.length > 1 ? 's' : ''} exposed: {data.plaintextEmails.slice(0, 3).join(', ')}. Use contact forms to prevent spam harvesting.</div>}
      </div>

      {/* Internal Link Anchor Texts (Sitechecker feature) */}
      {data.internalLinkDetails && data.internalLinkDetails.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>Internal Link Details ({data.internalLinkDetails.length})</h2>
          <div style={S.muted}>Anchor text tells search engines what the linked page is about. Avoid generic anchors like "click here" or empty anchor text.</div>
          <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {data.internalLinkDetails.map((link, i) => {
              const isGeneric = /^(click here|read more|learn more|here|link|more|\(empty\))$/i.test(link.anchor);
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < data.internalLinkDetails.length - 1 ? '1px solid #27272a' : 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '13px', color: isGeneric ? '#f97316' : '#fafafa', fontWeight: 500 }}>{link.anchor}</span>
                    {isGeneric && <span style={{ fontSize: '11px', color: '#f97316', marginLeft: '6px' }}>⚠️ generic</span>}
                  </div>
                  <span style={{ fontSize: '12px', color: '#71717a', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.href}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* External Link Details (Rank Math / Yoast / WooRank) */}
      {data.externalLinkDetails && data.externalLinkDetails.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>External Link Details ({data.externalLinkDetails.length})</h2>
          <div style={S.muted}>Outbound links to authoritative sources build credibility. Have at least one followed (dofollow) external link to a trusted site.</div>
          <div style={{ ...S.grid3, marginTop: '12px' }}>
            <StatCard label="Total External" value={data.externalLinks || data.externalLinkDetails.length} color="#38bdf8" />
            <StatCard label="Followed" value={data.followedExternalCount ?? data.externalLinkDetails.filter(l => !l.nofollow).length} color="#22c55e" />
            <StatCard label="Nofollow" value={data.nofollowExternalCount ?? data.externalLinkDetails.filter(l => l.nofollow).length} color="#a1a1aa" />
          </div>
          <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
            {data.externalLinkDetails.map((link, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < data.externalLinkDetails.length - 1 ? '1px solid #27272a' : 'none' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '13px', color: '#fafafa', fontWeight: 500 }}>{link.anchor}</span>
                  {link.nofollow && <span style={{ fontSize: '10px', background: '#3f3f46', color: '#a1a1aa', borderRadius: '4px', padding: '1px 5px', marginLeft: '6px' }}>nofollow</span>}
                  {!link.nofollow && <span style={{ fontSize: '10px', background: '#14532d', color: '#22c55e', borderRadius: '4px', padding: '1px 5px', marginLeft: '6px' }}>followed</span>}
                </div>
                <span style={{ fontSize: '12px', color: '#71717a', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{link.href}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Quality Signals (Yoast / Rank Math) */}
      {(data.subheadingDistribution || data.longParagraphs || data.sentenceLengthStats) && (
        <div style={S.card}>
          <h2 style={S.h2}>Content Quality Signals</h2>
          <div style={S.muted}>Long text blocks without subheadings and overlong paragraphs hurt readability and SEO. Break content into scannable sections.</div>
          <div style={{ ...S.grid3, marginTop: '12px' }}>
            {data.subheadingDistribution && <StatCard label="Long Blocks (no H2/H3)" value={data.subheadingDistribution.longBlocksWithoutHeadings} color={data.subheadingDistribution.longBlocksWithoutHeadings === 0 ? '#22c55e' : '#f97316'} />}
            {data.longParagraphs && <StatCard label="Paragraphs >120 words" value={data.longParagraphs.overLength} color={data.longParagraphs.overLength === 0 ? '#22c55e' : '#f97316'} />}
            {data.longParagraphs && <StatCard label="Longest Paragraph" value={`${data.longParagraphs.longestWords} words`} color={data.longParagraphs.longestWords <= 120 ? '#22c55e' : data.longParagraphs.longestWords <= 200 ? '#eab308' : '#ef4444'} />}
          </div>
          {/* Sentence Length Distribution (Yoast) */}
          {data.sentenceLengthStats && data.sentenceLengthStats.total > 0 && (
            <div style={{ marginTop: '14px' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>Sentence Length Analysis (Yoast)</div>
              <div style={S.grid4}>
                <StatCard label="Total Sentences" value={data.sentenceLengthStats.total} color="#4f46e5" />
                <StatCard label="Avg Length" value={`${data.sentenceLengthStats.avgLength} words`} color={data.sentenceLengthStats.avgLength <= 20 ? '#22c55e' : '#f97316'} />
                <StatCard label="Long (>20 words)" value={data.sentenceLengthStats.longCount} color={data.sentenceLengthStats.longCount === 0 ? '#22c55e' : '#f97316'} />
                <StatCard label="Long %" value={`${data.sentenceLengthStats.longPercent}%`} color={data.sentenceLengthStats.longPercent <= 20 ? '#22c55e' : data.sentenceLengthStats.longPercent <= 30 ? '#eab308' : '#ef4444'} />
              </div>
              {data.sentenceLengthStats.longPercent > 20 && (
                <div style={{ ...S.elevated, marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <div style={{ fontSize: '13px', color: '#f97316' }}>
                    {data.sentenceLengthStats.longPercent}% of sentences are over 20 words. Yoast recommends keeping this under 20% for better readability. Shorten complex sentences.
                  </div>
                </div>
              )}
            </div>
          )}
          {data.subheadingDistribution && data.subheadingDistribution.longBlocksWithoutHeadings > 0 && (
            <div style={{ ...S.elevated, marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <div style={{ fontSize: '13px', color: '#f97316' }}>
                {data.subheadingDistribution.longBlocksWithoutHeadings} section(s) have 300+ words with no subheadings (longest: {data.subheadingDistribution.longestBlockWords} words). Add H2/H3 tags to improve scannability and SEO structure.
              </div>
            </div>
          )}
          {data.longParagraphs && data.longParagraphs.overLength > 0 && (
            <div style={{ ...S.elevated, marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <div style={{ fontSize: '13px', color: '#f97316' }}>
                {data.longParagraphs.overLength} paragraph(s) exceed 120 words. Short paragraphs (2-4 sentences) improve readability and reduce bounce rate.
              </div>
            </div>
          )}
          {data.consecutiveSentences && data.consecutiveSentences.count >= 3 && (
            <div style={{ ...S.elevated, marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px' }}>⚠️</span>
              <div style={{ fontSize: '13px', color: '#f97316' }}>
                {data.consecutiveSentences.count} consecutive sentences start with "{data.consecutiveSentences.word}". Vary your sentence openings for better readability (Yoast).
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image Filename Analysis (Ahrefs / Backlinko / Semrush) */}
      {data.imageFilenames && data.imageFilenames.total > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>Image Filename SEO</h2>
          <div style={S.muted}>Descriptive filenames (e.g. "blue-running-shoes.jpg") help Google Images understand your content. Avoid generic names like "IMG_5497.jpg" or random hashes.</div>
          <div style={{ ...S.grid3, marginTop: '12px' }}>
            <StatCard label="Total Images" value={data.imageFilenames.total} color="#38bdf8" />
            <StatCard label="Descriptive Names" value={data.imageFilenames.descriptive} color="#22c55e" />
            <StatCard label="Generic Names" value={data.imageFilenames.generic} color={data.imageFilenames.generic > 0 ? '#f97316' : '#22c55e'} />
          </div>
          {(data.imagesMissingDimensions > 0 || data.imagesMissingDimensions === 0) && data.imageCount > 0 && (
            <div style={{ ...S.elevated, marginTop: '10px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '16px' }}>{data.imagesMissingDimensions === 0 ? '✅' : '⚠️'}</span>
              <div style={{ fontSize: '13px', color: data.imagesMissingDimensions === 0 ? '#22c55e' : '#f97316' }}>
                {data.imagesMissingDimensions === 0
                  ? 'All images have width/height attributes — good for CLS (Core Web Vitals).'
                  : `${data.imagesMissingDimensions} of ${data.imageCount} images missing width/height attributes — causes Cumulative Layout Shift (CLS). Set explicit dimensions to prevent layout jumps.`}
              </div>
            </div>
          )}
          {data.imageFilenames.details && data.imageFilenames.details.length > 0 && (
            <div style={{ marginTop: '12px', maxHeight: '200px', overflowY: 'auto' }}>
              {data.imageFilenames.details.slice(0, 20).map((img, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid #27272a' }}>
                  <span style={{ fontSize: '12px', color: img.descriptive ? '#22c55e' : '#f97316', fontWeight: 500 }}>{img.descriptive ? '✅' : '⚠️'} {img.filename}</span>
                  <span style={{ fontSize: '11px', color: '#71717a', maxWidth: '50%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{img.src}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modern Image Formats (SEO Site Checkup) */}
      {data.imageCount > 0 && data.modernImageRatio != null && (
        <div style={S.card}>
          <h2 style={S.h2}>Image Format Analysis</h2>
          <div style={S.muted}>Modern formats (WebP, AVIF) provide 25-50% smaller files than JPEG/PNG, improving page speed and Core Web Vitals.</div>
          <div style={{ ...S.grid3, marginTop: '12px' }}>
            <StatCard label="Modern (WebP/AVIF)" value={data.modernFormats || 0} color="#22c55e" />
            <StatCard label="Legacy (JPEG/PNG/GIF)" value={data.legacyFormats || 0} color={data.legacyFormats > 0 && data.modernFormats === 0 ? '#f97316' : '#a1a1aa'} />
            <StatCard label="Modern Ratio" value={`${data.modernImageRatio}%`} color={data.modernImageRatio >= 50 ? '#22c55e' : data.modernImageRatio > 0 ? '#eab308' : '#f97316'} />
          </div>
        </div>
      )}

      {/* Keyword in Image Alt Text (Yoast) */}
      {data.keywordInAltText && data.keywordInAltText.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>Keyword in Image Alt Text (Yoast)</h2>
          <div style={S.muted}>Including your target keyword in at least one image alt attribute helps search engines connect images to your page topic.</div>
          <div style={{ marginTop: '10px' }}>
            {data.keywordInAltText.map((ki, i) => (
              <div key={i} style={{ ...S.elevated, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#fafafa' }}>"{ki.keyword}"</span>
                <div>
                  {ki.found
                    ? <span style={S.badge('#22c55e')}>✅ Found in {ki.imagesWithKeyword} image{ki.imagesWithKeyword > 1 ? 's' : ''}</span>
                    : <span style={S.badge('#ef4444')}>❌ Not found in any alt text</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OG Tag Completeness */}
      {(data.ogTitle || data.ogType || data.ogUrl || data.ogSiteName) && (
        <div style={S.card}>
          <h2 style={S.h2}>Open Graph Completeness</h2>
          <div style={S.muted}>Complete OG tags ensure rich, branded previews when your page is shared on social platforms.</div>
          <div style={{ ...S.grid3, marginTop: '10px' }}>
            {[
              { label: 'og:title', val: data.ogTitle },
              { label: 'og:description', val: data.ogDescription },
              { label: 'og:image', val: data.ogImage },
              { label: 'og:type', val: data.ogType },
              { label: 'og:url', val: data.ogUrl },
              { label: 'og:site_name', val: data.ogSiteName },
            ].map((tag, i) => (
              <div key={i} style={S.elevated}>
                <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{tag.label}</span>
                <div style={{ fontSize: '13px', color: tag.val ? '#22c55e' : '#f97316', marginTop: '4px' }}>{tag.val ? '✅ Set' : '⚠️ Missing'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Snippet Readiness (Ahrefs / Backlinko / Semrush 2026) */}
      {data.snippetReadiness && (
        <div style={S.card}>
          <h2 style={S.h2}>🎯 Featured Snippet Readiness</h2>
          <div style={S.muted}>Featured snippets earn position zero in Google. These signals increase your chances of winning paragraph, list, and table snippets.</div>
          <div style={{ ...S.row, marginTop: '12px', marginBottom: '12px' }}>
            <div style={{ ...S.stat, flex: '0 0 120px' }}>
              <div style={{ ...S.statNum, color: scoreColor(data.snippetReadiness.score) }}>{data.snippetReadiness.score}%</div>
              <div style={S.statLabel}>Readiness Score</div>
            </div>
            <div style={{ flex: 1 }}>
              <ProgressBar pct={data.snippetReadiness.score} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {data.snippetReadiness.signals.map((sig, i) => (
              <div key={i} style={{ ...S.elevated, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '16px', flexShrink: 0 }}>{sig.present ? '✅' : '❌'}</span>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: sig.present ? '#22c55e' : '#f97316' }}>{sig.signal}</div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>{sig.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyword Placement (if keywords provided) */}
      {keywords && (
        <div style={S.card}>
          <h2 style={S.h2}>Keyword Placement Check</h2>
          {keywords.split(',').map(kw => kw.trim()).filter(Boolean).map(kw => {
            const kwLower = kw.toLowerCase();
            const placements = {
              'Title': data.title && data.title.toLowerCase().includes(kwLower),
              'Meta Description': data.metaDescription && data.metaDescription.toLowerCase().includes(kwLower),
              'H1': data.h1 && data.h1.toLowerCase().includes(kwLower),
              'URL': data.url && data.url.toLowerCase().includes(kwLower),
              'First 200 Words': data.firstWords && data.firstWords.toLowerCase().includes(kwLower),
            };
            const found = Object.values(placements).filter(Boolean).length;
            return (
              <div key={kw} style={{ ...S.elevated, marginBottom: '8px' }}>
                <div style={S.rowSpread}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>"{kw}"</span>
                  <span style={S.badge(found >= 3 ? '#22c55e' : found >= 1 ? '#eab308' : '#ef4444')}>{found}/5 placements</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {Object.entries(placements).map(([loc, present]) => (
                    <span key={loc} style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '4px', background: present ? '#22c55e22' : '#ef444422', color: present ? '#22c55e' : '#ef4444' }}>
                      {present ? '✅' : '❌'} {loc}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Keyword Density Analysis (Sitechecker / SE Ranking feature) */}
      {data.keywordDensity && data.keywordDensity.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>Keyword Density Analysis</h2>
          <div style={S.muted}>Optimal keyword density is 0.5–3%. Above 3% may indicate keyword stuffing (penalty risk).</div>
          <div style={{ marginTop: '12px' }}>
            {data.keywordDensity.map((kd, i) => {
              const statusColor = kd.status === 'optimal' ? '#22c55e' : kd.status === 'stuffing' ? '#ef4444' : kd.status === 'low' ? '#eab308' : '#71717a';
              const statusLabel = kd.status === 'optimal' ? 'Optimal' : kd.status === 'stuffing' ? '⚠️ Over-optimized' : kd.status === 'low' ? 'Low' : 'Missing';
              return (
                <div key={i} style={{ ...S.elevated, marginBottom: '8px' }}>
                  <div style={S.rowSpread}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>"{kd.keyword}"</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#a1a1aa' }}>{kd.count} occurrences</span>
                      <span style={S.badge(statusColor)}>{kd.density}% — {statusLabel}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '6px' }}>
                    <ProgressBar pct={Math.min(100, (kd.density / 5) * 100)} color={statusColor} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* E-E-A-T & AI Search Optimization */}
      <div style={S.card}>
        <h2 style={S.h2}>🏆 E-E-A-T & AI Search Readiness</h2>
        <div style={S.muted}>Google's E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals and AI search optimization checklist — from Ahrefs & Semrush best practices.</div>
        <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {[
            { label: 'Author identified', ok: !!data.authorMeta, tip: 'Add <meta name="author"> or a visible author bio for credibility.' },
            { label: 'Page date / freshness', ok: !!(data.datePublished || data.dateModified), tip: 'Add article:published_time or article:modified_time for freshness signals.' },
            { label: 'Schema markup present', ok: !!data.schemaMarkup, tip: 'Add JSON-LD schema (Product, Article, FAQ, etc.) for rich results & AI parsing.' },
            { label: 'HTTPS secure', ok: data.urlAnalysis?.isHttps, tip: 'Serve your page over HTTPS — required for trust signals.' },
            { label: 'Mobile viewport set', ok: data.viewportMeta, tip: 'Add <meta name="viewport"> — Google uses mobile-first indexing.' },
            { label: 'Content depth (300+ words)', ok: data.wordCount >= 300, tip: 'Articles under 300 words rarely rank well. Aim for 500+ for competitive queries.' },
            { label: 'OG tags for social/AI citing', ok: !!(data.ogTitle && data.ogDescription), tip: 'ChatGPT and Perplexity use title + description + snippet to select sources to cite.' },
            { label: 'Clear heading structure', ok: data.h1 && data.h2Count > 0, tip: 'Use H1 for the main topic and H2s for subtopics — helps AI understand page structure.' },
          ].map((c, i) => (
            <div key={i} style={{ ...S.elevated, display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>{c.ok ? '✅' : '❌'}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: c.ok ? '#22c55e' : '#f97316' }}>{c.label}</div>
                {!c.ok && <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>{c.tip}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Web Vitals Estimator */}
      <CWVEstimator data={data} />

      {/* Content Depth Analysis */}
      <ContentDepthPanel data={data} />

      {/* Social Media & OG Tags */}
      <SocialMediaPanel data={data} />

      {/* Hreflang / International SEO */}
      <HreflangPanel data={data} />

      {/* Mobile Usability */}
      <MobileUsabilityPanel data={data} />

      {/* HTML Validation */}
      <HTMLValidationPanel data={data} />

      {/* Crawlability & Indexing */}
      <PaginationPanel data={data} />

      {/* Security & Performance Headers Dashboard */}
      <SecurityHeadersDashboard data={data} />

      {/* Issues List — Filterable by Category, Severity, Searchable, with AI Fix Code */}
      {issues.length > 0 && (
        <IssuesPanel issues={issues} data={data} fixLoading={fixLoading} fixResults={fixResults} onGenerateFix={onGenerateFix} />
      )}

      {/* Export Audit */}
      <div style={S.card}>
        <div style={S.rowSpread}>
          <h2 style={{ ...S.h2, margin: 0 }}>Export Audit Report</h2>
          <button style={S.btnSm} onClick={() => {
            const report = {
              url: data.url, analyzedAt: new Date().toISOString(),
              score: scored?.overall, categories: scored?.categories,
              title: data.title, titleLength: (data.title || '').length,
              metaDescription: data.metaDescription, metaLength: (data.metaDescription || '').length,
              h1: data.h1, wordCount: data.wordCount, readability: data.readability, urlAnalysis: data.urlAnalysis,
              internalLinks: data.internalLinks, externalLinks: data.externalLinks,
              imageCount: data.imageCount, imagesWithAlt: data.imagesWithAlt,
              imagesMissingDimensions: data.imagesMissingDimensions,
              schemaMarkup: data.schemaMarkup, schemaTypes: data.schemaTypes,
              canonicalUrl: data.canonicalUrl, robotsMeta: data.robotsMeta,
              pageSizeKB: data.pageSizeKB, headingHierarchy: data.headingHierarchy,
              hreflangTags: data.hreflangTags, authorMeta: data.authorMeta,
              datePublished: data.datePublished, dateModified: data.dateModified,
              codeToTextRatio: data.codeToTextRatio, selfLinks: data.selfLinks,
              keywordDensity: data.keywordDensity, internalLinkDetails: data.internalLinkDetails,
              externalLinkDetails: data.externalLinkDetails,
              followedExternalCount: data.followedExternalCount,
              nofollowExternalCount: data.nofollowExternalCount,
              totalLinks: data.totalLinks,
              imageFilenames: data.imageFilenames, snippetReadiness: data.snippetReadiness,
              subheadingDistribution: data.subheadingDistribution,
              longParagraphs: data.longParagraphs,
              titleCount: data.titleCount,
              viewportZoomDisabled: data.viewportZoomDisabled,
              hasLoremIpsum: data.hasLoremIpsum,
              titleEqualsDescription: data.titleEqualsDescription,
              titleEqualsH1: data.titleEqualsH1,
              localhostLinks: data.localhostLinks,
              genericLinkCount: data.genericLinkCount,
              genericLinkAnchors: data.genericLinkAnchors,
              headingSkips: data.headingSkips,
              metaDescriptionCount: data.metaDescriptionCount,
              // Round 7 fields
              httpStatusCode: data.httpStatusCode,
              responseTimeMs: data.responseTimeMs,
              readingTimeMinutes: data.readingTimeMinutes,
              hasFavicon: data.hasFavicon,
              hasCharset: data.hasCharset,
              hasDoctype: data.hasDoctype,
              deprecatedTagsFound: data.deprecatedTagsFound,
              hasMetaRefresh: data.hasMetaRefresh,
              plaintextEmails: data.plaintextEmails,
              unsafeCrossOriginLinks: data.unsafeCrossOriginLinks,
              hasMixedContent: data.hasMixedContent,
              mixedContentItems: data.mixedContentItems,
              modernImageRatio: data.modernImageRatio,
              modernFormats: data.modernFormats,
              legacyFormats: data.legacyFormats,
              sentenceLengthStats: data.sentenceLengthStats,
              keywordInAltText: data.keywordInAltText,
              ogType: data.ogType,
              ogUrl: data.ogUrl,
              ogSiteName: data.ogSiteName,
              pluginElements: data.pluginElements,
              consecutiveSentences: data.consecutiveSentences,
              issues: scored?.issues,
            };
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `seo-audit-${new URL(data.url).hostname}-${Date.now()}.json`;
            a.click();
          }}>📥 Download JSON</button>
          <button style={{ ...S.btnSm, marginLeft: '6px', background: '#22c55e' }} onClick={() => {
            const issues = scored?.issues || [];
            const csvHeaders = ['Category', 'Severity', 'Impact', 'Message'];
            const csvRows = issues.map(iss => [iss.cat, iss.sev, iss.impact || 0, iss.msg].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            const metaRows = [
              ['URL', data.url], ['Score', scored?.overall || 0], ['Title', data.title || ''],
              ['Meta Description', data.metaDescription || ''], ['H1', data.h1 || ''],
              ['Word Count', data.wordCount || 0], ['Page Size KB', data.pageSizeKB || 0],
              ['Response Time ms', data.responseTimeMs || ''], ['Internal Links', data.internalLinks || 0],
              ['External Links', data.externalLinks || 0], ['Images', data.imageCount || 0],
              ['Images with Alt', data.imagesWithAlt || 0], ['Schema Types', (data.schemaTypes || []).join('; ')],
            ].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            const csv = ['SEO AUDIT REPORT', '', 'Field,Value', ...metaRows, '', `ISSUES (${issues.length})`, csvHeaders.join(','), ...csvRows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `seo-audit-${new URL(data.url).hostname}-${Date.now()}.csv`; a.click();
          }}>📊 Download CSV</button>
        </div>
        <div style={S.muted}>Export the full audit data as JSON or CSV for reporting, client presentations, or tracking changes over time.</div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   AI DEEP ANALYSIS TAB
   ══════════════════════════════════════════════════════════════════════════════ */
function AIAnalysisTab({ data, analysis, loading, error, onRun }) {
  if (!data) return (
    <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤖</div>
      <div style={{ fontSize: '16px', color: '#a1a1aa' }}>Analyze a page first (Analyzer tab), then come here for AI-powered deep insights.</div>
    </div>
  );

  const isObj = analysis && typeof analysis === 'object';

  return (
    <>
      <div style={{ ...S.card, textAlign: 'center' }}>
        <div style={S.muted}>AI will analyze your crawled page data and return structured SEO recommendations. Costs 1 credit.</div>
        <button style={{ ...S.btnAI, marginTop: '12px' }} onClick={onRun} disabled={loading}>
          {loading ? '⏳ Analyzing with AI…' : '✨ Run AI Deep Analysis'}
        </button>
        {error && <p style={{ color: '#ef4444', marginTop: '8px', fontSize: '13px' }}>{error}</p>}
      </div>

      {analysis && !isObj && (
        <div style={S.card}>
          <h2 style={S.h2}>AI Analysis</h2>
          <pre style={{ ...S.elevated, whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.6', color: '#e4e4e7' }}>{typeof analysis === 'string' ? analysis : JSON.stringify(analysis, null, 2)}</pre>
        </div>
      )}

      {isObj && (
        <>
          {/* Assessment */}
          {analysis.assessment && (
            <div style={S.card}>
              <h2 style={S.h2}>📋 Overall Assessment</h2>
              <p style={{ fontSize: '14px', color: '#e4e4e7', lineHeight: '1.6', margin: 0 }}>{analysis.assessment}</p>
            </div>
          )}

          {/* Critical Issues */}
          {analysis.criticalIssues?.length > 0 && (
            <div style={S.card}>
              <h2 style={S.h2}>🚨 Critical Issues</h2>
              {analysis.criticalIssues.map((item, i) => (
                <div key={i} style={{ ...S.elevated, marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>{item.issue}</div>
                  <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>Fix: {item.fix}</div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Wins */}
          {analysis.quickWins?.length > 0 && (
            <div style={S.card}>
              <h2 style={S.h2}>⚡ Quick Wins</h2>
              {analysis.quickWins.map((item, i) => (
                <div key={i} style={{ ...S.elevated, marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#e4e4e7' }}>{item.action}</span>
                  <span style={S.badge(item.impact === 'high' ? '#22c55e' : item.impact === 'medium' ? '#eab308' : '#71717a')}>{item.impact}</span>
                </div>
              ))}
            </div>
          )}

          {/* Content Recommendations */}
          {analysis.contentRecs?.length > 0 && (
            <div style={S.card}>
              <h2 style={S.h2}>📝 Content Recommendations</h2>
              {analysis.contentRecs.map((item, i) => (
                <div key={i} style={{ ...S.elevated, marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>{item.rec}</div>
                  <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>{item.detail}</div>
                </div>
              ))}
            </div>
          )}

          {/* Technical Recommendations */}
          {analysis.technicalRecs?.length > 0 && (
            <div style={S.card}>
              <h2 style={S.h2}>⚙️ Technical Recommendations</h2>
              {analysis.technicalRecs.map((item, i) => (
                <div key={i} style={{ ...S.elevated, marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa' }}>{item.rec}</div>
                  <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>{item.detail}</div>
                </div>
              ))}
            </div>
          )}

          {/* Keyword Suggestions */}
          {analysis.keywordSuggestions?.length > 0 && (
            <div style={S.card}>
              <h2 style={S.h2}>🎯 Suggested Keywords</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {analysis.keywordSuggestions.map((kw, i) => (
                  <span key={i} style={S.badge('#8b5cf6')}>{kw}</span>
                ))}
              </div>
            </div>
          )}

          {/* Competitor Tips */}
          {analysis.competitorTips && (
            <div style={S.card}>
              <h2 style={S.h2}>🏆 Competitor Insight</h2>
              <p style={{ fontSize: '14px', color: '#e4e4e7', lineHeight: '1.6', margin: 0 }}>{analysis.competitorTips}</p>
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CONTENT SCORE TAB — NLP-powered content analysis
   ══════════════════════════════════════════════════════════════════════════════ */
function ContentScoreTab({ data, result, loading, error, onRun }) {
  if (!data) return (
    <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
      <div style={{ fontSize: '16px', color: '#a1a1aa' }}>Analyze a page first, then get an AI-powered content quality score with NLP insights.</div>
    </div>
  );

  const isObj = result && typeof result === 'object';

  return (
    <>
      <div style={{ ...S.card, textAlign: 'center' }}>
        <div style={S.muted}>AI evaluates topic coverage, content depth, search intent match, and suggests missing subtopics. Costs 1 credit.</div>
        <button style={{ ...S.btnAI, marginTop: '12px' }} onClick={onRun} disabled={loading}>
          {loading ? '⏳ Scoring Content…' : '✨ Run AI Content Score'}
        </button>
        {error && <p style={{ color: '#ef4444', marginTop: '8px', fontSize: '13px' }}>{error}</p>}
      </div>

      {result && !isObj && (
        <div style={S.card}>
          <h2 style={S.h2}>Content Score Result</h2>
          <pre style={{ ...S.elevated, whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.6', color: '#e4e4e7' }}>{typeof result === 'string' ? result : JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {isObj && (
        <>
          {/* Score Cards */}
          <div style={S.card}>
            <h2 style={S.h2}>Scores</h2>
            <div style={S.grid4}>
              <div style={S.stat}>
                <div style={{ ...S.statNum, color: scoreColor(result.contentScore || 0) }}>{result.contentScore ?? '--'}</div>
                <div style={S.statLabel}>Content Score</div>
                <ProgressBar pct={result.contentScore || 0} />
              </div>
              <div style={S.stat}>
                <div style={{ ...S.statNum, color: scoreColor(result.topicCoverage || 0) }}>{result.topicCoverage ?? '--'}</div>
                <div style={S.statLabel}>Topic Coverage</div>
                <ProgressBar pct={result.topicCoverage || 0} />
              </div>
              <StatCard label="Search Intent" value={result.searchIntentMatch || '--'} color="#38bdf8" />
              <StatCard label="Tone" value={result.toneAnalysis || '--'} color="#a78bfa" />
            </div>
          </div>

          {/* Missing Topics */}
          {result.missingTopics?.length > 0 && (
            <div style={S.card}>
              <h2 style={S.h2}>🔍 Missing Topics</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {result.missingTopics.map((t, i) => <span key={i} style={S.badge('#f97316')}>{t}</span>)}
              </div>
            </div>
          )}

          {/* NLP Keywords */}
          {result.nlpKeywords?.length > 0 && (
            <div style={S.card}>
              <h2 style={S.h2}>🧠 NLP Keyword Analysis</h2>
              {result.nlpKeywords.map((kw, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < result.nlpKeywords.length - 1 ? '1px solid #27272a' : 'none' }}>
                  <span style={{ fontSize: '14px', color: '#fafafa' }}>{kw.term}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={S.badge(kw.relevance === 'high' ? '#22c55e' : '#eab308')}>{kw.relevance}</span>
                    <span style={S.badge(kw.found ? '#22c55e' : '#ef4444')}>{kw.found ? 'Found' : 'Missing'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Content Gaps */}
          {result.contentGaps?.length > 0 && (
            <div style={S.card}>
              <h2 style={S.h2}>📝 Content Gaps</h2>
              {result.contentGaps.map((g, i) => (
                <div key={i} style={{ ...S.elevated, marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f97316' }}>{g.gap}</div>
                  <div style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>{g.suggestion}</div>
                </div>
              ))}
            </div>
          )}

          {/* Improvement Plan */}
          {result.improvementPlan?.length > 0 && (
            <div style={S.card}>
              <h2 style={S.h2}>📋 Improvement Plan</h2>
              {result.improvementPlan.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '8px 0', borderBottom: i < result.improvementPlan.length - 1 ? '1px solid #27272a' : 'none' }}>
                  <span style={{ ...S.badge('#4f46e5'), flexShrink: 0 }}>{i + 1}</span>
                  <span style={{ fontSize: '14px', color: '#e4e4e7' }}>{step}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   AI REWRITE TAB — generate optimized title / meta / H1 variants
   ══════════════════════════════════════════════════════════════════════════════ */
function AIRewriteTab({ data, field, setField, result, loading, error, onRun }) {
  if (!data) return (
    <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
      <div style={{ fontSize: '48px', marginBottom: '12px' }}>✏️</div>
      <div style={{ fontSize: '16px', color: '#a1a1aa' }}>Analyze a page first, then generate AI-optimized rewrites for your title, meta description, and H1.</div>
    </div>
  );

  const fieldLabels = { title: 'SEO Title', metaDescription: 'Meta Description', h1: 'H1 Heading' };
  const currentValue = data[field] || 'Not set';
  const charLimits = { title: '45-65 chars', metaDescription: '130-165 chars', h1: '20-70 chars' };

  return (
    <>
      {/* Current Values */}
      <div style={S.card}>
        <h2 style={S.h2}>Current Page Elements</h2>
        <div style={S.grid3}>
          <div style={S.elevated}>
            <div style={S.label}>Title ({(data.title || '').length} chars)</div>
            <div style={{ fontSize: '13px', color: '#fafafa' }}>{data.title || '❌ Not set'}</div>
          </div>
          <div style={S.elevated}>
            <div style={S.label}>Meta Description ({(data.metaDescription || '').length} chars)</div>
            <div style={{ fontSize: '13px', color: '#fafafa' }}>{data.metaDescription || '❌ Not set'}</div>
          </div>
          <div style={S.elevated}>
            <div style={S.label}>H1 ({(data.h1 || '').length} chars)</div>
            <div style={{ fontSize: '13px', color: '#fafafa' }}>{data.h1 || '❌ Not set'}</div>
          </div>
        </div>
      </div>

      {/* Rewrite Controls */}
      <div style={S.card}>
        <h2 style={S.h2}>Generate AI Rewrites</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={S.label}>Rewrite:</span>
          {Object.entries(fieldLabels).map(([key, label]) => (
            <button key={key} onClick={() => setField(key)}
              style={{ ...S.btnGhost, ...(field === key ? { background: '#4f46e5', color: '#fafafa', borderColor: '#4f46e5' } : {}) }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: '12px' }}>
          <div style={S.muted}>Current {fieldLabels[field]}: "{currentValue}" · Ideal: {charLimits[field]}</div>
        </div>
        <button style={{ ...S.btnAI, marginTop: '12px' }} onClick={onRun} disabled={loading}>
          {loading ? '⏳ Generating…' : `✨ Generate ${fieldLabels[field]} Variants`}
        </button>
        {error && <p style={{ color: '#ef4444', marginTop: '8px', fontSize: '13px' }}>{error}</p>}
      </div>

      {/* Results */}
      {result && (
        <div style={S.card}>
          <h2 style={S.h2}>AI-Generated {fieldLabels[field]} Variants</h2>
          <pre style={{ ...S.elevated, whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.8', color: '#e4e4e7' }}>{result}</pre>
          <div style={{ ...S.muted, marginTop: '8px' }}>Copy the one you prefer and update your page's {fieldLabels[field].toLowerCase()} in Shopify.</div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HISTORY TAB — past analyses
   ══════════════════════════════════════════════════════════════════════════════ */
function HistoryTab({ items, loading, onRefresh, onSelect }) {
  // Group by URL to show score trends
  const urlGroups = useMemo(() => {
    const groups = {};
    for (const item of items) {
      const key = item.url || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    // Sort each group by timestamp
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => new Date(a.ts || 0) - new Date(b.ts || 0));
    }
    return groups;
  }, [items]);

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'trends'

  return (
    <>
      <div style={{ ...S.card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ ...S.h2, margin: 0 }}>Analysis History ({items.length})</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setViewMode('list')} style={{ ...S.btnGhost, fontSize: '12px', ...(viewMode === 'list' ? { background: '#4f46e5', color: '#fafafa', borderColor: '#4f46e5' } : {}) }}>📋 List</button>
          <button onClick={() => setViewMode('trends')} style={{ ...S.btnGhost, fontSize: '12px', ...(viewMode === 'trends' ? { background: '#4f46e5', color: '#fafafa', borderColor: '#4f46e5' } : {}) }}>📈 Trends</button>
          <button style={S.btnSm} onClick={onRefresh} disabled={loading}>{loading ? 'Loading…' : '🔄 Refresh'}</button>
        </div>
      </div>

      {items.length === 0 && !loading && (
        <div style={{ ...S.card, textAlign: 'center', padding: '48px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
          <div style={{ fontSize: '16px', color: '#a1a1aa' }}>No analyses yet. Crawl a URL to get started.</div>
        </div>
      )}

      {/* Score Trends View */}
      {viewMode === 'trends' && items.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>Score Trends by URL</h2>
          <div style={S.muted}>Track how your pages' SEO scores change over time. Re-analyze the same URL to see progress.</div>
          {Object.entries(urlGroups).map(([url, analyses]) => {
            const latest = analyses[analyses.length - 1];
            const first = analyses[0];
            const scoreDelta = (latest.score ?? 0) - (first.score ?? 0);
            const hasMultiple = analyses.length > 1;

            return (
              <div key={url} style={{ ...S.elevated, marginTop: '12px' }}>
                <div style={S.rowSpread}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: '#fafafa', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latest.title || url}</div>
                    <div style={S.muted}>{url}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                    {latest.score != null && <span style={S.badge(scoreColor(latest.score))}>{latest.score}/100</span>}
                    {hasMultiple && scoreDelta !== 0 && (
                      <span style={S.badge(scoreDelta > 0 ? '#22c55e' : '#ef4444')}>
                        {scoreDelta > 0 ? '↑' : '↓'} {Math.abs(scoreDelta)} pts
                      </span>
                    )}
                    <button style={S.btnSm} onClick={() => onSelect(url)}>Re-analyze</button>
                  </div>
                </div>

                {/* Mini score timeline */}
                {hasMultiple && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '40px' }}>
                      {analyses.map((a, i) => {
                        const score = a.score ?? 0;
                        return (
                          <div key={i} title={`${new Date(a.ts).toLocaleDateString()}: ${score}/100`}
                            style={{ flex: 1, maxWidth: '40px', height: `${Math.max(4, score * 0.4)}px`, background: scoreColor(score), borderRadius: '2px 2px 0 0', cursor: 'pointer', transition: 'height 0.3s' }}
                          />
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', color: '#71717a' }}>{analyses[0].ts ? new Date(analyses[0].ts).toLocaleDateString() : '—'}</span>
                      <span style={{ fontSize: '11px', color: '#71717a' }}>{analyses.length} analyses</span>
                      <span style={{ fontSize: '11px', color: '#71717a' }}>{latest.ts ? new Date(latest.ts).toLocaleDateString() : '—'}</span>
                    </div>
                  </div>
                )}

                {!hasMultiple && (
                  <div style={{ ...S.muted, marginTop: '6px', fontSize: '12px' }}>
                    Analyzed once on {latest.ts ? new Date(latest.ts).toLocaleString() : 'unknown date'}. Re-analyze to track progress.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && items.length > 0 && (
        <div style={S.card}>
          {items.slice().reverse().map((item, i) => (
            <div key={item.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < items.length - 1 ? '1px solid #27272a' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title || item.url || 'Untitled'}</div>
                <div style={S.muted}>{item.url || ''}</div>
                {item.ts && <div style={{ ...S.muted, fontSize: '12px' }}>{new Date(item.ts).toLocaleString()}</div>}
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                {item.score != null && <span style={S.badge(scoreColor(item.score))}>{item.score}/100</span>}
                {item.url && <button style={S.btnSm} onClick={() => onSelect(item.url)}>Re-analyze</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   AI ASSISTANT TAB — chat interface for SEO questions
   ══════════════════════════════════════════════════════════════════════════════ */
function AIAssistantTab({ messages, input, setInput, loading, onSend }) {
  return (
    <>
      <div style={S.card}>
        <h2 style={S.h2}>🤖 SEO AI Assistant</h2>
        <div style={S.muted}>Ask any on-page SEO question. The assistant knows about Shopify stores and e-commerce best practices. Each message costs 1 credit.</div>
      </div>

      {/* Chat Messages */}
      <div style={{ ...S.card, maxHeight: '400px', overflowY: 'auto', padding: '12px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
            <div style={S.muted}>No messages yet. Ask a question below!</div>
            <div style={{ ...S.muted, marginTop: '8px' }}>
              Try: "How do I optimize my product page for 'organic cotton t-shirt'?" or "What schema markup should I add to my collection page?"
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: '12px', display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', lineHeight: '1.5',
              background: m.role === 'user' ? '#4f46e5' : '#27272a',
              color: '#fafafa',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{ background: '#27272a', padding: '10px 14px', borderRadius: '10px', fontSize: '14px', color: '#a1a1aa' }}>Thinking…</div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ ...S.card, display: 'flex', gap: '8px' }}>
        <input style={{ ...S.input, flex: 1 }} placeholder="Ask an SEO question…" value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }} />
        <button style={S.btn} onClick={onSend} disabled={loading || !input.trim()}>
          {loading ? '⏳' : 'Send'}
        </button>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SERP PREVIEW — Desktop + Mobile Toggle
   ══════════════════════════════════════════════════════════════════════════════ */
function SERPPreview({ data }) {
  const [mode, setMode] = useState('desktop');
  const title = data.title || 'No Title';
  const desc = data.metaDescription || 'No meta description set. Google will auto-generate a snippet from your page content.';
  const titleLen = (data.title || '').length;
  const descLen = (data.metaDescription || '').length;
  const truncTitle = mode === 'mobile' && title.length > 55 ? title.slice(0, 55) + '…' : title.length > 60 ? title.slice(0, 60) + '…' : title;
  const truncDesc = mode === 'mobile' && desc.length > 120 ? desc.slice(0, 120) + '…' : desc.length > 160 ? desc.slice(0, 160) + '…' : desc;

  return (
    <div style={S.card}>
      <div style={S.rowSpread}>
        <h2 style={S.h2}>Google SERP Preview</h2>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button onClick={() => setMode('desktop')} style={{ ...S.btnGhost, fontSize: '12px', ...(mode === 'desktop' ? { background: '#4f46e5', color: '#fafafa', borderColor: '#4f46e5' } : {}) }}>🖥️ Desktop</button>
          <button onClick={() => setMode('mobile')} style={{ ...S.btnGhost, fontSize: '12px', ...(mode === 'mobile' ? { background: '#4f46e5', color: '#fafafa', borderColor: '#4f46e5' } : {}) }}>📱 Mobile</button>
        </div>
      </div>
      <div style={{ ...S.elevated, maxWidth: mode === 'mobile' ? '360px' : '600px', transition: 'max-width 0.3s' }}>
        {mode === 'mobile' && <div style={{ fontSize: '11px', color: '#71717a', marginBottom: '6px' }}>Mobile preview (55 char title / 120 char desc limit)</div>}
        <div style={{ fontSize: mode === 'mobile' ? '16px' : '18px', color: '#8ab4f8', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncTitle}</div>
        <div style={{ fontSize: mode === 'mobile' ? '12px' : '13px', color: '#bdc1c6', marginBottom: '4px' }}>{data.url}</div>
        <div style={{ fontSize: mode === 'mobile' ? '13px' : '14px', color: '#969ba1', lineHeight: '1.4' }}>{truncDesc}</div>
      </div>
      <div style={{ ...S.muted, marginTop: '8px' }}>
        Title: {titleLen} chars {titleLen > 60 ? '⚠️ may truncate' : titleLen < 30 ? '⚠️ too short' : '✅'} · Description: {descLen} chars {descLen > 160 ? '⚠️ may truncate' : descLen < 120 ? '⚠️ too short' : '✅'}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SECURITY & PERFORMANCE HEADERS DASHBOARD
   ══════════════════════════════════════════════════════════════════════════════ */
function SecurityHeadersDashboard({ data }) {
  if (!data) return null;
  const headers = [
    { name: 'HTTPS', ok: data.urlAnalysis?.isHttps, tip: 'Serve over HTTPS' },
    { name: 'HSTS', ok: data.hasHSTS, tip: 'Strict-Transport-Security header' },
    { name: 'CSP', ok: data.hasCSP, tip: 'Content-Security-Policy header' },
    { name: 'X-Content-Type-Options', ok: data.hasXContentTypeOptions, tip: 'Prevent MIME sniffing' },
    { name: 'X-Frame-Options', ok: data.hasXFrameOptions, tip: 'Prevent clickjacking' },
    { name: 'Referrer-Policy', ok: data.hasReferrerPolicy, tip: 'Control referrer info' },
    { name: 'Permissions-Policy', ok: data.hasPermissionsPolicy, tip: 'Control browser features' },
    { name: 'COOP', ok: data.hasCOOP, tip: 'Cross-Origin-Opener-Policy' },
    { name: 'COEP', ok: data.hasCOEP, tip: 'Cross-Origin-Embedder-Policy' },
  ];
  const passed = headers.filter(h => h.ok).length;
  const grade = passed >= 8 ? 'A+' : passed >= 6 ? 'A' : passed >= 4 ? 'B' : passed >= 2 ? 'C' : 'F';
  const gradeColor = passed >= 6 ? '#22c55e' : passed >= 4 ? '#eab308' : '#ef4444';

  const perfSignals = [
    { name: 'Compression', ok: data.hasCompression, tip: 'Gzip/Brotli compression enabled' },
    { name: 'Cache-Control', ok: data.cacheControl && !/no-store/i.test(data.cacheControl), tip: 'Proper caching configured' },
    { name: 'No Server Leak', ok: !data.serverHeaderLeak, tip: 'Server header doesn\'t expose software version' },
    { name: 'No X-Powered-By', ok: !data.xPoweredBy, tip: 'X-Powered-By header hidden' },
    { name: 'Response <1s', ok: (data.responseTimeMs || 9999) < 1000, tip: `Response time: ${data.responseTimeMs || '?'}ms` },
    { name: 'Page <200KB', ok: (data.pageSizeKB || 9999) < 200, tip: `Page size: ${data.pageSizeKB || '?'}KB` },
  ];
  const perfPassed = perfSignals.filter(p => p.ok).length;

  return (
    <div style={S.card}>
      <h2 style={S.h2}>🛡️ Security & Performance Headers</h2>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ ...S.stat, flex: '0 0 100px' }}>
          <div style={{ fontSize: '36px', fontWeight: 800, color: gradeColor }}>{grade}</div>
          <div style={S.statLabel}>Security Grade</div>
        </div>
        <div style={{ ...S.stat, flex: '0 0 100px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#4f46e5' }}>{passed}/{headers.length}</div>
          <div style={S.statLabel}>Headers Set</div>
        </div>
        <div style={{ ...S.stat, flex: '0 0 100px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, color: perfPassed >= 4 ? '#22c55e' : '#f97316' }}>{perfPassed}/{perfSignals.length}</div>
          <div style={S.statLabel}>Perf Signals</div>
        </div>
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Security Headers</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '14px' }}>
        {headers.map((h, i) => (
          <div key={i} style={{ ...S.elevated, padding: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>{h.ok ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: h.ok ? '#22c55e' : '#ef4444' }}>{h.name}</div>
              {!h.ok && <div style={{ fontSize: '11px', color: '#71717a' }}>{h.tip}</div>}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Performance</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
        {perfSignals.map((p, i) => (
          <div key={i} style={{ ...S.elevated, padding: '8px', display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '14px' }}>{p.ok ? '✅' : '⚠️'}</span>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: p.ok ? '#22c55e' : '#f97316' }}>{p.name}</div>
              <div style={{ fontSize: '11px', color: '#71717a' }}>{p.tip}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ISSUES PANEL — Filterable, Searchable, with AI Fix Code Generator
   ══════════════════════════════════════════════════════════════════════════════ */
function IssuesPanel({ issues, data, fixLoading, fixResults, onGenerateFix }) {
  const [catFilter, setCatFilter] = useState('all');
  const [sevFilter, setSevFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFix, setExpandedFix] = useState(null);

  const catCounts = useMemo(() => {
    const counts = { all: issues.length };
    for (const iss of issues) {
      counts[iss.cat] = (counts[iss.cat] || 0) + 1;
    }
    return counts;
  }, [issues]);

  const sevCounts = useMemo(() => {
    const counts = { all: issues.length, high: 0, medium: 0, low: 0, info: 0 };
    for (const iss of issues) counts[iss.sev] = (counts[iss.sev] || 0) + 1;
    return counts;
  }, [issues]);

  const filtered = useMemo(() => {
    let result = [...issues];
    if (catFilter !== 'all') result = result.filter(i => i.cat === catFilter);
    if (sevFilter !== 'all') result = result.filter(i => i.sev === sevFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(i => i.msg.toLowerCase().includes(term));
    }
    result.sort((a, b) => {
      const o = { high: 0, medium: 1, low: 2, info: 3 };
      return (o[a.sev] ?? 9) - (o[b.sev] ?? 9);
    });
    return result;
  }, [issues, catFilter, sevFilter, searchTerm]);

  const totalImpact = useMemo(() => filtered.reduce((sum, i) => sum + (i.impact || 0), 0), [filtered]);

  const catLabels = { metaTags: '🏷️ Meta Tags', content: '📝 Content', technical: '⚙️ Technical', linksImages: '🔗 Links/Images', keywords: '🎯 Keywords' };

  return (
    <div style={S.card}>
      <div style={S.rowSpread}>
        <h2 style={S.h2}>All Issues ({issues.length})</h2>
        <span style={S.badge('#4f46e5')}>+{totalImpact} pts potential</span>
      </div>

      {/* Search Bar */}
      <input style={{ ...S.input, marginBottom: '12px' }} placeholder="🔍 Search issues…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

      {/* Category Filter Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', flexWrap: 'wrap' }}>
        {['all', 'metaTags', 'content', 'technical', 'linksImages', 'keywords'].map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)}
            style={{ ...S.btnGhost, fontSize: '12px', ...(catFilter === cat ? { background: '#4f46e5', color: '#fafafa', borderColor: '#4f46e5' } : {}) }}>
            {cat === 'all' ? `All (${catCounts.all})` : `${catLabels[cat] || cat} (${catCounts[cat] || 0})`}
          </button>
        ))}
      </div>

      {/* Severity Filter */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '14px' }}>
        {[
          { key: 'all', label: 'All', color: '#a1a1aa' },
          { key: 'high', label: '🔴 High', color: '#ef4444' },
          { key: 'medium', label: '🟠 Medium', color: '#f97316' },
          { key: 'low', label: '🟡 Low', color: '#eab308' },
          { key: 'info', label: 'ℹ️ Info', color: '#71717a' },
        ].map(s => (
          <button key={s.key} onClick={() => setSevFilter(s.key)}
            style={{ ...S.btnGhost, fontSize: '12px', ...(sevFilter === s.key ? { background: s.color + '33', color: s.color, borderColor: s.color } : {}) }}>
            {s.label} ({sevCounts[s.key] || 0})
          </button>
        ))}
      </div>

      {/* Filtered Results Count */}
      <div style={{ ...S.muted, marginBottom: '10px' }}>
        Showing {filtered.length} of {issues.length} issues{catFilter !== 'all' || sevFilter !== 'all' || searchTerm ? ' (filtered)' : ''}.
        {filtered.length > 0 && ` Fix ${sevFilter === 'all' ? 'high-severity' : sevFilter} issues first for maximum score improvement.`}
      </div>

      {/* Issues List */}
      <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {filtered.map((iss, i) => {
          const globalIdx = issues.indexOf(iss);
          const fix = fixResults[globalIdx];
          const isFixLoading = fixLoading[globalIdx];
          const isExpanded = expandedFix === globalIdx;

          return (
            <div key={i} style={{ padding: '10px 0', borderBottom: i < filtered.length - 1 ? '1px solid #27272a' : 'none' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={S.badge(sevColor(iss.sev))}>{iss.sev}</span>
                <span style={{ fontSize: '13px', color: '#e4e4e7', flex: 1, lineHeight: '1.5' }}>{iss.msg}</span>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  {iss.impact != null && <span style={{ ...S.badge('#4f46e5'), flexShrink: 0 }}>+{iss.impact}</span>}
                  <button
                    style={{ ...S.btnGhost, fontSize: '11px', padding: '2px 8px' }}
                    onClick={() => {
                      if (fix) { setExpandedFix(isExpanded ? null : globalIdx); }
                      else { onGenerateFix(iss.msg, globalIdx); setExpandedFix(globalIdx); }
                    }}
                    disabled={isFixLoading}
                  >
                    {isFixLoading ? '⏳' : fix ? (isExpanded ? '▼ Hide Fix' : '▶ Show Fix') : '🔧 Get Fix'}
                  </button>
                </div>
              </div>

              {/* Expanded Fix Code */}
              {isExpanded && fix && (
                <div style={{ ...S.elevated, marginTop: '8px', marginLeft: '54px' }}>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={S.badge(fix.priority === 'critical' ? '#ef4444' : fix.priority === 'recommended' ? '#eab308' : '#71717a')}>{fix.priority}</span>
                    <span style={S.badge('#4f46e5')}>{fix.fixType}</span>
                    <span style={{ fontSize: '12px', color: '#a1a1aa' }}>📍 {fix.location}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#d4d4d8', marginBottom: '8px' }}>{fix.explanation}</div>
                  <div style={{ position: 'relative' }}>
                    <pre style={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: '6px', padding: '12px', fontSize: '12px', color: '#22c55e', overflow: 'auto', maxHeight: '200px', whiteSpace: 'pre-wrap', margin: 0 }}>{fix.code}</pre>
                    <button
                      style={{ position: 'absolute', top: '6px', right: '6px', ...S.btnGhost, fontSize: '11px', padding: '2px 8px' }}
                      onClick={() => { navigator.clipboard.writeText(fix.code); }}
                    >📋 Copy</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px', color: '#71717a' }}>
          {searchTerm ? `No issues matching "${searchTerm}"` : 'No issues in this category/severity'}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   COMPETITOR COMPARE TAB
   ══════════════════════════════════════════════════════════════════════════════ */
function CompetitorCompareTab({ urls, setUrls, results, loading, error, onRun, pageUrl }) {
  const addUrl = () => { if (urls.length < 5) setUrls([...urls, '']); };
  const removeUrl = (idx) => { if (urls.length > 2) setUrls(urls.filter((_, i) => i !== idx)); };
  const updateUrl = (idx, val) => { const next = [...urls]; next[idx] = val; setUrls(next); };

  // Pre-fill first URL with current page if available
  React.useEffect(() => {
    if (pageUrl && !urls[0]) { const next = [...urls]; next[0] = pageUrl; setUrls(next); }
  }, [pageUrl]);

  const metrics = [
    { key: 'score', label: 'Overall Score', format: v => v ?? '—', best: 'max' },
    { key: 'wordCount', label: 'Word Count', format: v => v?.toLocaleString() ?? '—', best: 'max' },
    { key: 'responseTimeMs', label: 'Response Time', format: v => v ? `${v}ms` : '—', best: 'min' },
    { key: 'pageSizeKB', label: 'Page Size', format: v => v ? `${v}KB` : '—', best: 'min' },
    { key: 'imageCount', label: 'Images', format: v => v ?? '—', best: null },
    { key: 'imagesWithAlt', label: 'Images w/ Alt', format: v => v ?? '—', best: 'max' },
    { key: 'internalLinks', label: 'Internal Links', format: v => v ?? '—', best: 'max' },
    { key: 'externalLinks', label: 'External Links', format: v => v ?? '—', best: null },
    { key: 'h2Count', label: 'H2 Tags', format: v => v ?? '—', best: null },
    { key: 'h3Count', label: 'H3 Tags', format: v => v ?? '—', best: null },
    { key: 'issueCount', label: 'Total Issues', format: v => v ?? '—', best: 'min' },
    { key: 'highIssues', label: 'High Issues', format: v => v ?? '—', best: 'min' },
    { key: 'hasSchema', label: 'Schema', format: v => v ? '✅' : '❌', best: null },
    { key: 'hasCanonical', label: 'Canonical', format: v => v ? '✅' : '❌', best: null },
    { key: 'hasHSTS', label: 'HSTS', format: v => v ? '✅' : '❌', best: null },
    { key: 'hasCSP', label: 'CSP', format: v => v ? '✅' : '❌', best: null },
  ];

  const getBestIdx = (metric) => {
    if (!results || !metric.best) return -1;
    let bestIdx = 0;
    for (let i = 1; i < results.length; i++) {
      if (results[i].error) continue;
      const curr = results[i][metric.key];
      const best = results[bestIdx][metric.key];
      if (metric.best === 'max' && curr > best) bestIdx = i;
      if (metric.best === 'min' && curr < best) bestIdx = i;
    }
    return bestIdx;
  };

  return (
    <>
      <div style={S.card}>
        <h2 style={S.h2}>🏆 Competitor Comparison</h2>
        <div style={S.muted}>Compare your page against competitors. Add 2-5 URLs to see a side-by-side SEO analysis with scoring.</div>

        {/* URL Inputs */}
        <div style={{ marginTop: '14px' }}>
          {urls.map((u, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#71717a', width: '60px', flexShrink: 0 }}>{i === 0 ? 'Your page' : `Rival ${i}`}</span>
              <input style={{ ...S.input, flex: 1 }} placeholder={`https://example${i + 1}.com/page`} value={u} onChange={e => updateUrl(i, e.target.value)} />
              {urls.length > 2 && <button style={{ ...S.btnGhost, padding: '4px 8px', fontSize: '12px' }} onClick={() => removeUrl(i)}>✕</button>}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          {urls.length < 5 && <button style={S.btnGhost} onClick={addUrl}>+ Add URL</button>}
          <button style={S.btn} onClick={onRun} disabled={loading || urls.filter(u => u.trim()).length < 2}>
            {loading ? '⏳ Analyzing…' : '🔍 Compare Pages'}
          </button>
        </div>
        {error && <p style={{ color: '#ef4444', marginTop: '8px', fontSize: '13px' }}>{error}</p>}
      </div>

      {/* Results Table */}
      {results && results.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>Comparison Results</h2>

          {/* Score Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${results.length}, 1fr)`, gap: '12px', marginBottom: '16px' }}>
            {results.map((r, i) => (
              <div key={i} style={{ ...S.stat, border: i === 0 ? '2px solid #4f46e5' : '1px solid #3f3f46' }}>
                <div style={{ fontSize: '12px', color: i === 0 ? '#818cf8' : '#71717a', marginBottom: '4px' }}>{i === 0 ? '⭐ Your Page' : `Rival ${i}`}</div>
                <div style={{ fontSize: '32px', fontWeight: 800, color: r.error ? '#ef4444' : scoreColor(r.score || 0) }}>
                  {r.error ? '❌' : r.score ?? '—'}
                </div>
                <div style={{ fontSize: '11px', color: '#71717a', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.error ? r.error.slice(0, 40) : (r.title || r.url || '').slice(0, 40)}
                </div>
              </div>
            ))}
          </div>

          {/* Category Score Breakdown */}
          {results.some(r => r.categories) && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Category Scores</div>
              {['metaTags', 'content', 'technical', 'linksImages', 'keywords'].map(cat => (
                <div key={cat} style={{ display: 'grid', gridTemplateColumns: `120px repeat(${results.length}, 1fr)`, gap: '8px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #27272a' }}>
                  <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{cat === 'metaTags' ? '🏷️ Meta' : cat === 'content' ? '📝 Content' : cat === 'technical' ? '⚙️ Technical' : cat === 'linksImages' ? '🔗 Links' : '🎯 Keywords'}</span>
                  {results.map((r, i) => {
                    const score = r.categories?.[cat]?.score ?? 0;
                    const isBest = !r.error && results.every((other, j) => j === i || other.error || (other.categories?.[cat]?.score ?? 0) <= score);
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ flex: 1 }}><ProgressBar pct={score} /></div>
                        <span style={{ fontSize: '13px', fontWeight: isBest ? 700 : 400, color: isBest ? '#22c55e' : scoreColor(score), minWidth: '28px' }}>{score}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Detailed Metrics Table */}
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Detailed Metrics</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #3f3f46' }}>
                  <th style={{ textAlign: 'left', padding: '8px', color: '#a1a1aa', fontWeight: 600 }}>Metric</th>
                  {results.map((r, i) => (
                    <th key={i} style={{ textAlign: 'center', padding: '8px', color: i === 0 ? '#818cf8' : '#a1a1aa', fontWeight: 600 }}>
                      {i === 0 ? 'You' : `Rival ${i}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {metrics.map(m => {
                  const bestIdx = getBestIdx(m);
                  return (
                    <tr key={m.key} style={{ borderBottom: '1px solid #27272a' }}>
                      <td style={{ padding: '8px', color: '#d4d4d8' }}>{m.label}</td>
                      {results.map((r, i) => (
                        <td key={i} style={{ textAlign: 'center', padding: '8px', fontWeight: bestIdx === i ? 700 : 400, color: r.error ? '#ef4444' : bestIdx === i ? '#22c55e' : '#d4d4d8' }}>
                          {r.error ? '—' : m.format(r[m.key])}
                          {bestIdx === i && !r.error && m.best && ' 🏆'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   BULK SCAN TAB — scan multiple URLs at once with sitemap discovery
   ══════════════════════════════════════════════════════════════════════════════ */
function BulkScanTab({ bulkUrls, setBulkUrls, bulkResults, bulkLoading, bulkError, onRun, sitemapDomain, setSitemapDomain, sitemapUrls, sitemapLoading, onDiscoverSitemap, onSelectUrl }) {
  const [sortCol, setSortCol] = useState('score');
  const [sortDir, setSortDir] = useState('desc');

  const sortedResults = useMemo(() => {
    if (!bulkResults?.results) return [];
    return [...bulkResults.results].sort((a, b) => {
      const aVal = a[sortCol] ?? 0;
      const bVal = b[sortCol] ?? 0;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [bulkResults, sortCol, sortDir]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  return (
    <>
      {/* Sitemap Discovery */}
      <div style={S.card}>
        <h2 style={S.h2}>🗺️ Sitemap Discovery</h2>
        <div style={S.muted}>Auto-discover pages from your sitemap.xml. Enter a domain to find URLs, then add them to the bulk scanner.</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input style={{ ...S.input, flex: 1 }} placeholder="example.com or https://example.com/sitemap.xml" value={sitemapDomain} onChange={e => setSitemapDomain(e.target.value)} onKeyDown={e => e.key === 'Enter' && onDiscoverSitemap()} />
          <button style={S.btn} onClick={onDiscoverSitemap} disabled={sitemapLoading || !sitemapDomain.trim()}>
            {sitemapLoading ? '⏳ Discovering…' : '🔍 Find Pages'}
          </button>
        </div>

        {sitemapUrls && (
          <div style={{ marginTop: '14px' }}>
            <div style={S.rowSpread}>
              <span style={{ fontSize: '13px', color: '#22c55e' }}>✅ Found {sitemapUrls.total} URLs from {sitemapUrls.sitemapUrl}</span>
              <button style={S.btnSm} onClick={() => {
                const selected = sitemapUrls.urls.slice(0, 20).join('\n');
                setBulkUrls(prev => prev ? prev + '\n' + selected : selected);
              }}>📥 Add top {Math.min(20, sitemapUrls.urls.length)} to scanner</button>
            </div>
            <div style={{ marginTop: '8px', maxHeight: '150px', overflowY: 'auto' }}>
              {sitemapUrls.urls.slice(0, 50).map((u, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', borderBottom: '1px solid #27272a' }}>
                  <span style={{ fontSize: '12px', color: '#a1a1aa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{u}</span>
                  <button style={{ ...S.btnGhost, fontSize: '11px', padding: '1px 6px', flexShrink: 0 }} onClick={() => setBulkUrls(prev => prev ? prev + '\n' + u : u)}>+ Add</button>
                </div>
              ))}
              {sitemapUrls.total > 50 && <div style={{ ...S.muted, marginTop: '4px' }}>…and {sitemapUrls.total - 50} more</div>}
            </div>
          </div>
        )}
      </div>

      {/* Bulk URL Input */}
      <div style={S.card}>
        <h2 style={S.h2}>📋 Bulk URL Scanner</h2>
        <div style={S.muted}>Paste one URL per line (max 20). Each URL will be crawled and scored. Use sitemap discovery above to auto-fill.</div>
        <textarea style={{ ...S.textarea, marginTop: '12px', minHeight: '120px', fontFamily: 'monospace', fontSize: '12px' }}
          placeholder={'https://mystore.com/\nhttps://mystore.com/products/item-1\nhttps://mystore.com/collections/all'}
          value={bulkUrls} onChange={e => setBulkUrls(e.target.value)} />
        <div style={{ ...S.rowSpread, marginTop: '10px' }}>
          <span style={S.muted}>{bulkUrls.split('\n').filter(l => l.trim()).length} URLs queued</span>
          <button style={S.btn} onClick={onRun} disabled={bulkLoading || !bulkUrls.trim()}>
            {bulkLoading ? '⏳ Scanning…' : `🚀 Scan ${Math.min(20, bulkUrls.split('\n').filter(l => l.trim()).length)} URLs`}
          </button>
        </div>
        {bulkError && <p style={{ color: '#ef4444', marginTop: '8px', fontSize: '13px' }}>{bulkError}</p>}
      </div>

      {/* Summary Cards */}
      {bulkResults?.summary && (
        <div style={{ ...S.card }}>
          <h2 style={S.h2}>Scan Summary</h2>
          <div style={S.grid4}>
            <StatCard label="Avg Score" value={bulkResults.summary.avgScore} color={scoreColor(bulkResults.summary.avgScore)} />
            <StatCard label="Total Issues" value={bulkResults.summary.totalIssues} color={bulkResults.summary.totalIssues > 50 ? '#ef4444' : '#eab308'} />
            <StatCard label="High Issues" value={bulkResults.summary.totalHighIssues} color={bulkResults.summary.totalHighIssues > 0 ? '#ef4444' : '#22c55e'} />
            <StatCard label="Scanned" value={`${bulkResults.summary.scanned}/${bulkResults.summary.scanned + bulkResults.summary.failed}`} color="#4f46e5" />
          </div>

          {/* Score Distribution */}
          <div style={{ marginTop: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Score Distribution</div>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '80px' }}>
              {sortedResults.filter(r => r.status === 'ok').map((r, i) => (
                <div key={i} title={`${r.title || r.url}: ${r.score}/100`}
                  style={{ flex: 1, maxWidth: '60px', height: `${Math.max(4, (r.score || 0) * 0.8)}px`, background: scoreColor(r.score || 0), borderRadius: '3px 3px 0 0', cursor: 'pointer', transition: 'height 0.3s' }}
                  onClick={() => onSelectUrl(r.url)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {sortedResults.length > 0 && (
        <div style={S.card}>
          <h2 style={S.h2}>Detailed Results</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #3f3f46' }}>
                  {[
                    { key: 'url', label: 'Page' },
                    { key: 'score', label: 'Score' },
                    { key: 'wordCount', label: 'Words' },
                    { key: 'issueCount', label: 'Issues' },
                    { key: 'highIssues', label: 'High' },
                    { key: 'responseTimeMs', label: 'Speed' },
                    { key: 'pageSizeKB', label: 'Size' },
                  ].map(col => (
                    <th key={col.key} onClick={() => toggleSort(col.key)}
                      style={{ textAlign: col.key === 'url' ? 'left' : 'center', padding: '8px', color: '#a1a1aa', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                      {col.label} {sortCol === col.key ? (sortDir === 'desc' ? '↓' : '↑') : ''}
                    </th>
                  ))}
                  <th style={{ padding: '8px', color: '#a1a1aa', fontWeight: 600 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #27272a' }}>
                    <td style={{ padding: '8px', maxWidth: '250px' }}>
                      {r.error ? (
                        <span style={{ color: '#ef4444', fontSize: '12px' }}>❌ {r.url}</span>
                      ) : (
                        <div>
                          <div style={{ fontSize: '13px', color: '#fafafa', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title || 'Untitled'}</div>
                          <div style={{ fontSize: '11px', color: '#71717a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</div>
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>
                      {r.error ? '—' : <span style={{ ...S.badge(scoreColor(r.score || 0)), fontWeight: 700 }}>{r.score}</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px', color: '#d4d4d8' }}>{r.wordCount?.toLocaleString() ?? '—'}</td>
                    <td style={{ textAlign: 'center', padding: '8px', color: '#d4d4d8' }}>{r.issueCount ?? '—'}</td>
                    <td style={{ textAlign: 'center', padding: '8px', color: (r.highIssues || 0) > 0 ? '#ef4444' : '#22c55e' }}>{r.highIssues ?? '—'}</td>
                    <td style={{ textAlign: 'center', padding: '8px', color: '#d4d4d8' }}>{r.responseTimeMs ? `${r.responseTimeMs}ms` : '—'}</td>
                    <td style={{ textAlign: 'center', padding: '8px', color: '#d4d4d8' }}>{r.pageSizeKB ? `${r.pageSizeKB}KB` : '—'}</td>
                    <td style={{ textAlign: 'center', padding: '8px' }}>
                      {!r.error && <button style={{ ...S.btnSm, fontSize: '11px' }} onClick={() => onSelectUrl(r.url)}>Deep Scan →</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CSV Export */}
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <button style={S.btnGhost} onClick={() => {
              const headers = ['URL', 'Title', 'Score', 'Words', 'Issues', 'High Issues', 'Medium Issues', 'Low Issues', 'Response Time (ms)', 'Page Size (KB)'];
              const rows = sortedResults.map(r => [r.url, r.title || '', r.score ?? '', r.wordCount ?? '', r.issueCount ?? '', r.highIssues ?? '', r.mediumIssues ?? '', r.lowIssues ?? '', r.responseTimeMs ?? '', r.pageSizeKB ?? ''].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
              const csv = [headers.join(','), ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `bulk-seo-scan-${Date.now()}.csv`; a.click();
            }}>📥 Export CSV</button>
          </div>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SEO CHECKLIST — auto-generated actionable pass/fail/todo list
   ══════════════════════════════════════════════════════════════════════════════ */
function SEOChecklist({ data }) {
  if (!data) return null;
  const scored = data.scored;
  const [collapsed, setCollapsed] = useState(false);

  const checks = [
    { category: 'Meta Tags', items: [
      { label: 'Page has a title tag', pass: !!data.title, tip: 'Add a <title> tag with your primary keyword.' },
      { label: 'Title is 30-65 characters', pass: (data.title || '').length >= 30 && (data.title || '').length <= 65, tip: `Current: ${(data.title || '').length} chars. Aim for 30-65.` },
      { label: 'Meta description exists', pass: !!data.metaDescription, tip: 'Add a meta description summarizing the page.' },
      { label: 'Meta description is 120-165 chars', pass: (data.metaDescription || '').length >= 120 && (data.metaDescription || '').length <= 165, tip: `Current: ${(data.metaDescription || '').length} chars.` },
      { label: 'H1 tag present', pass: !!data.h1, tip: 'Add a single H1 tag as the main page heading.' },
      { label: 'Only one H1 tag', pass: (data.h1Count || 0) === 1, tip: `Found ${data.h1Count || 0} H1 tags. Use exactly one.` },
      { label: 'Canonical URL set', pass: !!data.canonicalUrl, tip: 'Add <link rel="canonical"> to prevent duplicate content.' },
      { label: 'Open Graph tags complete', pass: !!(data.ogTitle && data.ogDescription && data.ogImage), tip: 'Set og:title, og:description, og:image for social sharing.' },
    ]},
    { category: 'Content', items: [
      { label: 'Content has 300+ words', pass: (data.wordCount || 0) >= 300, tip: `Current: ${data.wordCount || 0} words. Aim for 300+.` },
      { label: 'Uses H2 subheadings', pass: (data.h2Count || 0) >= 1, tip: 'Add H2 tags to structure your content.' },
      { label: 'Readability score ≥ 50', pass: (data.readability?.score ?? 0) >= 50, tip: 'Simplify your writing for better readability.' },
      { label: 'No long paragraphs (>120 words)', pass: !(data.longParagraphs?.overLength > 0), tip: 'Break up paragraphs longer than 120 words.' },
      { label: 'Author identified', pass: !!data.authorMeta, tip: 'Add <meta name="author"> for E-E-A-T.' },
      { label: 'Date published/modified set', pass: !!(data.datePublished || data.dateModified), tip: 'Add article:published_time for freshness signals.' },
    ]},
    { category: 'Technical', items: [
      { label: 'HTTPS enabled', pass: data.urlAnalysis?.isHttps, tip: 'Serve your page over HTTPS.' },
      { label: 'Mobile viewport meta', pass: !!data.viewportMeta, tip: 'Add <meta name="viewport"> for mobile-first indexing.' },
      { label: 'Schema markup (JSON-LD)', pass: !!data.schemaMarkup, tip: 'Add structured data for rich results.' },
      { label: 'Language tag set', pass: !!data.langTag, tip: 'Add lang="en" to your <html> tag.' },
      { label: 'Favicon present', pass: !!data.hasFavicon, tip: 'Add a favicon for browser tabs and bookmarks.' },
      { label: 'Page loads under 1 second', pass: (data.responseTimeMs || 9999) < 1000, tip: `Current: ${data.responseTimeMs || '?'}ms.` },
      { label: 'Page size under 200KB', pass: (data.pageSizeKB || 9999) < 200, tip: `Current: ${data.pageSizeKB || '?'}KB.` },
    ]},
    { category: 'Images & Links', items: [
      { label: 'All images have alt text', pass: (data.imageCount || 0) > 0 && data.imagesWithAlt === data.imageCount, tip: `${data.imageCount - (data.imagesWithAlt || 0)} images missing alt text.` },
      { label: 'Image dimensions set', pass: !(data.imagesMissingDimensions > 0), tip: 'Set width/height on images to prevent CLS.' },
      { label: 'Has internal links', pass: (data.internalLinks || 0) >= 1, tip: 'Add internal links to other pages on your site.' },
      { label: 'Has external links', pass: (data.externalLinks || 0) >= 1, tip: 'Link to authoritative external sources.' },
      { label: 'No broken anchor text', pass: !(data.genericLinkCount > 0), tip: `${data.genericLinkCount || 0} "click here" style links found.` },
    ]},
  ];

  const allItems = checks.flatMap(c => c.items);
  const passCount = allItems.filter(i => i.pass).length;

  return (
    <div style={S.card}>
      <div style={S.rowSpread}>
        <h2 style={S.h2}>✅ SEO Checklist ({passCount}/{allItems.length})</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ProgressBar pct={Math.round(passCount / allItems.length * 100)} />
          <span style={{ fontSize: '13px', color: scoreColor(Math.round(passCount / allItems.length * 100)), fontWeight: 700, minWidth: '40px' }}>
            {Math.round(passCount / allItems.length * 100)}%
          </span>
          <button style={S.btnGhost} onClick={() => setCollapsed(!collapsed)}>{collapsed ? '▶ Show' : '▼ Hide'}</button>
        </div>
      </div>

      {!collapsed && checks.map((group, gi) => {
        const groupPassed = group.items.filter(i => i.pass).length;
        return (
          <div key={gi} style={{ marginTop: gi > 0 ? '14px' : '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
              {group.category} ({groupPassed}/{group.items.length})
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {group.items.map((item, ii) => (
                <div key={ii} style={{ ...S.elevated, padding: '8px 10px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '14px', flexShrink: 0 }}>{item.pass ? '✅' : '❌'}</span>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: item.pass ? '#22c55e' : '#f97316' }}>{item.label}</div>
                    {!item.pass && <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>{item.tip}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SCHEMA MARKUP VISUALIZER — parse and display JSON-LD with validation
   ══════════════════════════════════════════════════════════════════════════════ */
function SchemaVisualizer({ data }) {
  if (!data?.schemaTypes || data.schemaTypes.length === 0) return null;
  const [expanded, setExpanded] = useState(false);

  // Required fields per schema type
  const schemaRequirements = {
    'Product': ['name', 'image', 'offers', 'description', 'brand'],
    'Article': ['headline', 'author', 'datePublished', 'image', 'publisher'],
    'FAQPage': ['mainEntity'],
    'BreadcrumbList': ['itemListElement'],
    'Organization': ['name', 'url', 'logo'],
    'LocalBusiness': ['name', 'address', 'telephone'],
    'WebSite': ['name', 'url'],
    'WebPage': ['name'],
    'Review': ['reviewRating', 'author', 'itemReviewed'],
    'HowTo': ['name', 'step'],
    'Recipe': ['name', 'image', 'author', 'recipeIngredient', 'recipeInstructions'],
    'Event': ['name', 'startDate', 'location'],
    'VideoObject': ['name', 'description', 'thumbnailUrl', 'uploadDate'],
  };

  const typeIcons = {
    'Product': '🛍️', 'Article': '📰', 'FAQPage': '❓', 'BreadcrumbList': '🔗', 'Organization': '🏢',
    'LocalBusiness': '📍', 'WebSite': '🌐', 'WebPage': '📄', 'Review': '⭐', 'HowTo': '📋',
    'Recipe': '🍳', 'Event': '📅', 'VideoObject': '🎬',
  };

  // Parse raw schema data if available
  const rawSchemas = data.schemaRawData || [];
  const hasRaw = rawSchemas.length > 0;

  const validateSchema = (schema, type) => {
    const required = schemaRequirements[type] || [];
    return required.map(field => ({
      field,
      present: schema && (schema[field] !== undefined && schema[field] !== null && schema[field] !== ''),
    }));
  };

  return (
    <div style={S.card}>
      <div style={S.rowSpread}>
        <h2 style={S.h2}>🔧 Schema Markup Visualizer</h2>
        <button style={S.btnGhost} onClick={() => setExpanded(!expanded)}>{expanded ? '▼ Collapse' : '▶ Expand Details'}</button>
      </div>
      <div style={S.muted}>Found {data.schemaTypes.length} schema type(s). Structured data helps Google display rich results for your page.</div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
        {data.schemaTypes.map((type, i) => (
          <span key={i} style={S.badge('#8b5cf6')}>{typeIcons[type] || '📦'} {type}</span>
        ))}
      </div>

      {expanded && (
        <div style={{ marginTop: '14px' }}>
          {data.schemaTypes.map((type, ti) => {
            const rawSchema = hasRaw ? rawSchemas[ti] : null;
            const validation = validateSchema(rawSchema, type);
            const hasReqs = validation.length > 0;

            return (
              <div key={ti} style={{ ...S.elevated, marginBottom: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>
                  {typeIcons[type] || '📦'} {type}
                </div>

                {hasReqs && (
                  <div>
                    <div style={{ fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>Required/Recommended Fields:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      {validation.map((v, vi) => (
                        <div key={vi} style={{ fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <span>{v.present ? '✅' : '❌'}</span>
                          <span style={{ color: v.present ? '#22c55e' : '#f97316' }}>{v.field}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!hasReqs && (
                  <div style={{ fontSize: '12px', color: '#71717a' }}>Custom schema type — no standard validation available.</div>
                )}

                {/* Snippet of raw data if available */}
                {rawSchema && (
                  <details style={{ marginTop: '8px' }}>
                    <summary style={{ fontSize: '12px', color: '#71717a', cursor: 'pointer' }}>View raw JSON-LD</summary>
                    <pre style={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: '4px', padding: '8px', fontSize: '11px', color: '#a1a1aa', overflow: 'auto', maxHeight: '150px', marginTop: '6px' }}>
                      {JSON.stringify(rawSchema, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            );
          })}

          {/* Schema Tips */}
          <div style={{ ...S.elevated, marginTop: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>💡 Schema Tips</div>
            <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#d4d4d8', lineHeight: '1.8' }}>
              <li>Test your schema at <span style={{ color: '#818cf8' }}>search.google.com/test/rich-results</span></li>
              <li>Product pages should have Product + Offer schema for price/availability rich results</li>
              <li>Blog posts benefit from Article schema with author, date, and publisher</li>
              <li>FAQ schema can win "People Also Ask" featured snippets</li>
              <li>Multiple schema types on one page is perfectly fine and recommended</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CORE WEB VITALS ESTIMATOR — estimate CWV from available signals
   ══════════════════════════════════════════════════════════════════════════════ */
function CWVEstimator({ data }) {
  if (!data) return null;

  // Estimate CWV from available data
  const estimates = [
    {
      metric: 'LCP',
      fullName: 'Largest Contentful Paint',
      value: (() => {
        // Estimate from response time + page size
        const base = data.responseTimeMs || 500;
        const sizeImpact = (data.pageSizeKB || 100) * 2;
        const imgImpact = (data.imageCount || 0) * 50;
        return Math.round(base + sizeImpact + imgImpact);
      })(),
      unit: 'ms',
      good: 2500,
      needsImprovement: 4000,
      tips: ['Optimize largest image (use WebP/AVIF)', 'Enable compression (gzip/brotli)', 'Minimize server response time', 'Preload hero image'],
    },
    {
      metric: 'CLS',
      fullName: 'Cumulative Layout Shift',
      value: (() => {
        let cls = 0;
        if (data.imagesMissingDimensions > 0) cls += data.imagesMissingDimensions * 0.05;
        if (!data.hasFavicon) cls += 0.01;
        if (data.hasAdSense) cls += 0.1;
        return Math.round(cls * 100) / 100;
      })(),
      unit: '',
      good: 0.1,
      needsImprovement: 0.25,
      tips: ['Set width/height on all images', 'Avoid injecting content above the fold', 'Use CSS aspect-ratio for media', 'Reserve space for ads/embeds'],
    },
    {
      metric: 'FID',
      fullName: 'First Input Delay',
      value: (() => {
        const base = 50;
        const scriptImpact = (data.pageSizeKB || 100) > 300 ? 100 : 0;
        return base + scriptImpact;
      })(),
      unit: 'ms',
      good: 100,
      needsImprovement: 300,
      tips: ['Minimize JavaScript execution', 'Break up long tasks', 'Use web workers for heavy computation', 'Defer non-critical scripts'],
    },
    {
      metric: 'TTFB',
      fullName: 'Time to First Byte',
      value: data.responseTimeMs || null,
      unit: 'ms',
      good: 800,
      needsImprovement: 1800,
      tips: ['Use a CDN', 'Optimize server-side rendering', 'Enable caching', 'Upgrade hosting if needed'],
    },
  ];

  const getStatus = (est) => {
    if (est.value === null) return { label: 'Unknown', color: '#71717a' };
    if (est.value <= est.good) return { label: 'Good', color: '#22c55e' };
    if (est.value <= est.needsImprovement) return { label: 'Needs Work', color: '#eab308' };
    return { label: 'Poor', color: '#ef4444' };
  };

  const goodCount = estimates.filter(e => e.value !== null && e.value <= e.good).length;
  const measuredCount = estimates.filter(e => e.value !== null).length;

  return (
    <div style={S.card}>
      <h2 style={S.h2}>⚡ Core Web Vitals Estimate</h2>
      <div style={S.muted}>Estimated from crawl data — for accurate CWV, use Google PageSpeed Insights or Chrome DevTools.</div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '14px' }}>
        <span style={S.badge(goodCount >= 3 ? '#22c55e' : goodCount >= 2 ? '#eab308' : '#ef4444')}>
          {goodCount}/{measuredCount} passing
        </span>
        <span style={{ fontSize: '12px', color: '#71717a' }}>These are rough estimates based on page metadata, not real user metrics.</span>
      </div>

      <div style={S.grid4}>
        {estimates.map((est, i) => {
          const status = getStatus(est);
          return (
            <div key={i} style={{ ...S.stat, borderColor: status.color }}>
              <div style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 600, marginBottom: '4px' }}>{est.metric}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: status.color }}>
                {est.value !== null ? `${est.value}${est.unit}` : '—'}
              </div>
              <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>{est.fullName}</div>
              <span style={{ ...S.badge(status.color), marginTop: '6px', fontSize: '11px' }}>{status.label}</span>
            </div>
          );
        })}
      </div>

      {/* Tips for failing metrics */}
      {estimates.filter(e => e.value !== null && e.value > e.good).length > 0 && (
        <div style={{ marginTop: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>Optimization Tips</div>
          {estimates.filter(e => e.value !== null && e.value > e.good).map((est, i) => (
            <div key={i} style={{ ...S.elevated, marginBottom: '8px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: getStatus(est).color, marginBottom: '6px' }}>{est.metric}: {est.value}{est.unit} (target: &lt;{est.good}{est.unit})</div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', color: '#d4d4d8', lineHeight: '1.6' }}>
                {est.tips.map((tip, ti) => <li key={ti}>{tip}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   LINK HEALTH TAB — broken link checker, redirect chain, robots.txt, resources
   ══════════════════════════════════════════════════════════════════════════════ */
function LinkHealthTab({ data, linkCheckResults, linkCheckLoading, linkCheckError, onCheckLinks,
  redirectChainUrl, setRedirectChainUrl, redirectChainResult, redirectChainLoading, onCheckRedirect,
  robotsResult, robotsLoading, onAnalyzeRobots, resourcesResult, resourcesLoading, onAnalyzeResources }) {

  if (!data) return <div style={S.card}><p style={S.muted}>Crawl a page first to use Link Health tools.</p></div>;

  return (
    <>
      {/* Broken Link Checker */}
      <div style={S.card}>
        <div style={S.rowSpread}>
          <h2 style={S.h2}>🔗 Broken Link Checker</h2>
          <button style={S.btn} onClick={onCheckLinks} disabled={linkCheckLoading || !data.allExternalUrls?.length}>
            {linkCheckLoading ? 'Checking…' : `Check ${data.allExternalUrls?.length || 0} External Links`}
          </button>
        </div>
        <div style={S.muted}>HEAD-request every outbound link to find broken ones (404s, timeouts, DNS failures). Max 50 links checked.</div>
        {linkCheckError && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '8px' }}>{linkCheckError}</p>}
        {linkCheckResults && (
          <div style={{ marginTop: '14px' }}>
            <div style={S.grid3}>
              <StatCard label="Total Checked" value={linkCheckResults.total} color="#4f46e5" />
              <StatCard label="Healthy" value={linkCheckResults.healthy} color="#22c55e" />
              <StatCard label="Broken" value={linkCheckResults.broken} color="#ef4444" />
            </div>
            {linkCheckResults.results?.length > 0 && (
              <div style={{ marginTop: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                {linkCheckResults.results.map((r, i) => (
                  <div key={i} style={{ ...S.elevated, marginBottom: '6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{r.ok ? '✅' : '❌'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', color: r.ok ? '#22c55e' : '#ef4444', fontWeight: 500, wordBreak: 'break-all' }}>{r.url}</div>
                      <div style={{ fontSize: '12px', color: '#71717a' }}>HTTP {r.status || 'N/A'} {r.error ? `— ${r.error}` : ''}</div>
                    </div>
                    <span style={S.badge(r.ok ? '#22c55e' : '#ef4444')}>{r.status || 'ERR'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Redirect Chain Analyzer */}
      <div style={S.card}>
        <h2 style={S.h2}>🔀 Redirect Chain Analyzer</h2>
        <div style={S.muted}>Follow a URL through all redirects to detect chains, loops, and unnecessary hops. Screaming Frog equivalent.</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <input style={{ ...S.input, flex: 1 }} placeholder={data.url || 'Enter URL to check redirects'}
            value={redirectChainUrl} onChange={e => setRedirectChainUrl(e.target.value)} />
          <button style={S.btn} onClick={onCheckRedirect} disabled={redirectChainLoading}>
            {redirectChainLoading ? 'Following…' : '🔀 Check Redirects'}
          </button>
        </div>
        {redirectChainResult && (
          <div style={{ marginTop: '14px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <span style={S.badge(redirectChainResult.hops === 0 ? '#22c55e' : redirectChainResult.hops <= 2 ? '#eab308' : '#ef4444')}>
                {redirectChainResult.hops} redirect(s)
              </span>
              {redirectChainResult.hasLoop && <span style={S.badge('#ef4444')}>⚠ Redirect Loop Detected</span>}
              {redirectChainResult.isChain && <span style={S.badge('#f97316')}>⚠ Redirect Chain (3+ hops)</span>}
              {redirectChainResult.hops === 0 && <span style={S.badge('#22c55e')}>No Redirects — Direct</span>}
            </div>
            <div style={{ borderLeft: '3px solid #3f3f46', paddingLeft: '16px' }}>
              {redirectChainResult.chain?.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: step.status >= 200 && step.status < 300 ? '#22c55e' : step.status >= 300 && step.status < 400 ? '#eab308' : '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#fafafa', wordBreak: 'break-all' }}>{step.url}</div>
                    <div style={{ fontSize: '12px', color: '#71717a' }}>HTTP {step.status} {step.statusText}</div>
                  </div>
                  {i < redirectChainResult.chain.length - 1 && <span style={{ fontSize: '16px', color: '#71717a' }}>→</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Robots.txt Analyzer */}
      <div style={S.card}>
        <div style={S.rowSpread}>
          <h2 style={S.h2}>🤖 Robots.txt Analyzer</h2>
          <button style={S.btn} onClick={onAnalyzeRobots} disabled={robotsLoading}>
            {robotsLoading ? 'Fetching…' : '🤖 Analyze Robots.txt'}
          </button>
        </div>
        <div style={S.muted}>Fetch and analyze the robots.txt file — check for blocked paths, missing sitemaps, and crawl restrictions.</div>
        {robotsResult && (
          <div style={{ marginTop: '14px' }}>
            {!robotsResult.found ? (
              <div style={{ ...S.elevated, color: '#f97316' }}>⚠ No robots.txt found (HTTP {robotsResult.status})</div>
            ) : (
              <>
                <div style={S.grid4}>
                  <StatCard label="Total Rules" value={robotsResult.totalRules} color="#4f46e5" />
                  <StatCard label="User-Agents" value={robotsResult.agents?.length || 0} color="#8b5cf6" />
                  <StatCard label="Sitemaps" value={robotsResult.sitemaps?.length || 0} color="#22c55e" />
                  <StatCard label="Issues" value={robotsResult.issues?.length || 0} color={robotsResult.issues?.length > 0 ? '#ef4444' : '#22c55e'} />
                </div>
                {robotsResult.issues?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    {robotsResult.issues.map((iss, i) => (
                      <div key={i} style={{ ...S.elevated, marginBottom: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={S.badge(sevColor(iss.severity))}>{iss.severity}</span>
                        <span style={{ fontSize: '13px', color: '#fafafa' }}>{iss.message}</span>
                      </div>
                    ))}
                  </div>
                )}
                {robotsResult.rules?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Crawl Rules</div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {robotsResult.rules.slice(0, 30).map((rule, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', fontSize: '12px', padding: '4px 0', borderBottom: '1px solid #27272a' }}>
                          <span style={{ color: '#71717a', minWidth: '80px' }}>{rule.agent}</span>
                          <span style={{ color: rule.type === 'Disallow' ? '#ef4444' : rule.type === 'Allow' ? '#22c55e' : '#eab308', minWidth: '70px', fontWeight: 600 }}>{rule.type}</span>
                          <span style={{ color: '#d4d4d8', fontFamily: 'monospace' }}>{rule.path}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {robotsResult.sitemaps?.length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Sitemaps Declared</div>
                    {robotsResult.sitemaps.map((sm, i) => (
                      <div key={i} style={{ fontSize: '12px', color: '#818cf8', fontFamily: 'monospace', marginBottom: '4px' }}>{sm}</div>
                    ))}
                  </div>
                )}
                <details style={{ marginTop: '12px' }}>
                  <summary style={{ fontSize: '12px', color: '#71717a', cursor: 'pointer' }}>View raw robots.txt</summary>
                  <pre style={{ background: '#09090b', border: '1px solid #3f3f46', borderRadius: '4px', padding: '8px', fontSize: '11px', color: '#a1a1aa', overflow: 'auto', maxHeight: '200px', marginTop: '6px', whiteSpace: 'pre-wrap' }}>{robotsResult.raw}</pre>
                </details>
              </>
            )}
          </div>
        )}
      </div>

      {/* Page Resources */}
      <div style={S.card}>
        <div style={S.rowSpread}>
          <h2 style={S.h2}>📦 Page Resources Breakdown</h2>
          <button style={S.btn} onClick={onAnalyzeResources} disabled={resourcesLoading}>
            {resourcesLoading ? 'Analyzing…' : '📦 Analyze Resources'}
          </button>
        </div>
        <div style={S.muted}>Break down all CSS, JS, images, fonts, and resource hints on the page — identify third-party bloat and optimization opportunities.</div>
        {resourcesResult && (
          <div style={{ marginTop: '14px' }}>
            <div style={S.grid4}>
              <StatCard label="Total Resources" value={resourcesResult.summary?.totalResources} color="#4f46e5" />
              <StatCard label="Third-Party" value={resourcesResult.summary?.totalThirdParty} color="#f97316" />
              <StatCard label="CSS Files" value={resourcesResult.css?.external} color="#8b5cf6" />
              <StatCard label="JS Files" value={resourcesResult.js?.external} color="#eab308" />
            </div>
            <div style={{ ...S.grid3, marginTop: '12px' }}>
              <div style={S.elevated}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6', marginBottom: '6px' }}>🎨 CSS</div>
                <div style={{ fontSize: '12px', color: '#d4d4d8' }}>
                  <div>External: {resourcesResult.css?.external} ({resourcesResult.css?.thirdParty} third-party)</div>
                  <div>Inline blocks: {resourcesResult.css?.inlineBlocks} ({resourcesResult.css?.inlineSize})</div>
                </div>
                {resourcesResult.css?.urls?.length > 0 && (
                  <details style={{ marginTop: '6px' }}>
                    <summary style={{ fontSize: '11px', color: '#71717a', cursor: 'pointer' }}>View URLs</summary>
                    {resourcesResult.css.urls.map((u, i) => <div key={i} style={{ fontSize: '11px', color: '#a1a1aa', wordBreak: 'break-all', marginTop: '2px' }}>{u}</div>)}
                  </details>
                )}
              </div>
              <div style={S.elevated}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#eab308', marginBottom: '6px' }}>⚡ JavaScript</div>
                <div style={{ fontSize: '12px', color: '#d4d4d8' }}>
                  <div>External: {resourcesResult.js?.external} ({resourcesResult.js?.thirdParty} third-party)</div>
                  <div>Inline blocks: {resourcesResult.js?.inlineBlocks} ({resourcesResult.js?.inlineSize})</div>
                </div>
                {resourcesResult.js?.urls?.length > 0 && (
                  <details style={{ marginTop: '6px' }}>
                    <summary style={{ fontSize: '11px', color: '#71717a', cursor: 'pointer' }}>View URLs</summary>
                    {resourcesResult.js.urls.map((u, i) => <div key={i} style={{ fontSize: '11px', color: '#a1a1aa', wordBreak: 'break-all', marginTop: '2px' }}>{u}</div>)}
                  </details>
                )}
              </div>
              <div style={S.elevated}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e', marginBottom: '6px' }}>🖼️ Images</div>
                <div style={{ fontSize: '12px', color: '#d4d4d8' }}>
                  <div>Total: {resourcesResult.images?.total} ({resourcesResult.images?.thirdParty} third-party)</div>
                  <div>With alt: {resourcesResult.images?.withAlt} | With dimensions: {resourcesResult.images?.withDimensions}</div>
                  <div>Lazy-loaded: {resourcesResult.images?.withLazy}</div>
                </div>
              </div>
            </div>
            <div style={{ ...S.grid2, marginTop: '12px' }}>
              <div style={S.elevated}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#f97316', marginBottom: '4px' }}>🔤 Fonts: {resourcesResult.fonts?.total}</div>
                {resourcesResult.fonts?.urls?.map((u, i) => <div key={i} style={{ fontSize: '11px', color: '#a1a1aa', wordBreak: 'break-all', marginTop: '2px' }}>{u}</div>)}
              </div>
              <div style={S.elevated}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#4f46e5', marginBottom: '4px' }}>⚡ Resource Hints</div>
                <div style={{ fontSize: '12px', color: '#d4d4d8' }}>
                  <div>Preloads: {resourcesResult.hints?.preloads}</div>
                  <div>Preconnects: {resourcesResult.hints?.preconnects}</div>
                  <div>DNS Prefetch: {resourcesResult.hints?.dnsPrefetch}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Link Analysis Summary from crawl data */}
      <div style={S.card}>
        <h2 style={S.h2}>📊 Link Analysis Summary</h2>
        <div style={S.grid4}>
          <StatCard label="Internal Links" value={data.internalLinks || 0} color="#4f46e5" />
          <StatCard label="External Links" value={data.externalLinks || 0} color="#8b5cf6" />
          <StatCard label="Followed External" value={data.followedExternalCount || 0} color="#22c55e" />
          <StatCard label="Nofollow External" value={data.nofollowExternalCount || 0} color="#f97316" />
        </div>
        <div style={{ ...S.grid3, marginTop: '12px' }}>
          <StatCard label="Self-Referencing" value={data.selfLinks || 0} color={data.selfLinks > 0 ? '#eab308' : '#22c55e'} />
          <StatCard label="Generic Anchors" value={data.genericLinkCount || 0} color={data.genericLinkCount > 0 ? '#f97316' : '#22c55e'} />
          <StatCard label="Total Links" value={data.totalLinks || 0} color="#4f46e5" />
        </div>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   ACCESSIBILITY TAB — dedicated accessibility audit dashboard
   ══════════════════════════════════════════════════════════════════════════════ */
function AccessibilityTab({ data }) {
  if (!data) return <div style={S.card}><p style={S.muted}>Crawl a page first to view accessibility audit.</p></div>;

  const checks = [
    { cat: 'Images & Media', items: [
      { label: 'All images have alt text', pass: data.imageCount === 0 || data.imagesWithAlt === data.imageCount, detail: `${data.imagesWithAlt || 0}/${data.imageCount || 0} with alt` },
      { label: 'No images missing alt attribute', pass: !data.imagesMissingAltAttribute || data.imagesMissingAltAttribute === 0, detail: `${data.imagesMissingAltAttribute || 0} missing` },
      { label: 'Image links have alt text', pass: !data.imageLinksWithoutAlt || data.imageLinksWithoutAlt === 0, detail: `${data.imageLinksWithoutAlt || 0} missing` },
      { label: 'Videos have captions/tracks', pass: !data.videoWithoutCaptions || data.videoWithoutCaptions === 0, detail: `${data.videoWithoutCaptions || 0} without` },
      { label: 'Videos have poster images', pass: !data.videoWithoutPoster || data.videoWithoutPoster === 0, detail: `${data.videoWithoutPoster || 0} without` },
      { label: 'SVGs have accessible names', pass: !data.svgWithoutTitle || data.svgWithoutTitle === 0, detail: `${data.svgWithoutTitle || 0} missing` },
      { label: 'Input images have alt', pass: !data.inputImageWithoutAlt || data.inputImageWithoutAlt === 0, detail: `${data.inputImageWithoutAlt || 0} missing` },
      { label: 'No role="img" without alt', pass: !data.roleImgWithoutAlt || data.roleImgWithoutAlt === 0, detail: `${data.roleImgWithoutAlt || 0} found` },
      { label: 'No server-side image maps', pass: !data.serverSideImageMap || data.serverSideImageMap === 0, detail: `${data.serverSideImageMap || 0} found` },
      { label: 'Area elements have alt', pass: !data.areaWithoutAlt || data.areaWithoutAlt === 0, detail: `${data.areaWithoutAlt || 0} missing` },
    ]},
    { cat: 'Forms & Inputs', items: [
      { label: 'All inputs have labels', pass: !data.formWithoutLabels || data.formWithoutLabels === 0, detail: `${data.formWithoutLabels || 0} unlabeled` },
      { label: 'No select/textarea without labels', pass: !data.selectWithoutLabel || data.selectWithoutLabel === 0, detail: `${data.selectWithoutLabel || 0} unlabeled` },
      { label: 'No multiple labels per field', pass: !data.formFieldMultipleLabels || data.formFieldMultipleLabels === 0, detail: `${data.formFieldMultipleLabels || 0} found` },
      { label: 'No paste prevention', pass: !data.pastePrevented || data.pastePrevented === 0, detail: `${data.pastePrevented || 0} fields` },
      { label: 'Valid autocomplete values', pass: !data.autocompleteInvalid || data.autocompleteInvalid === 0, detail: `${data.autocompleteInvalid || 0} invalid` },
      { label: 'No autofocus misuse', pass: !data.autofocusElements || data.autofocusElements === 0, detail: `${data.autofocusElements || 0} elements` },
    ]},
    { cat: 'Navigation & Focus', items: [
      { label: 'Skip navigation link', pass: data.hasSkipLink !== false, detail: data.hasSkipLink ? 'Present' : 'Missing' },
      { label: 'No positive tabindex', pass: !data.tabindexPositive || data.tabindexPositive === 0, detail: `${data.tabindexPositive || 0} elements` },
      { label: 'Buttons have accessible text', pass: !data.emptyButtons || data.emptyButtons === 0, detail: `${data.emptyButtons || 0} empty` },
      { label: 'No focusable inside aria-hidden', pass: !data.focusableAriaHidden || data.focusableAriaHidden === 0, detail: `${data.focusableAriaHidden || 0} found` },
      { label: 'No nested interactive elements', pass: !data.nestedInteractive || data.nestedInteractive === 0, detail: `${data.nestedInteractive || 0} found` },
      { label: 'No hash-only link buttons', pass: !data.hashOnlyAnchors || data.hashOnlyAnchors === 0, detail: `${data.hashOnlyAnchors || 0} found` },
      { label: 'Links have href attribute', pass: !data.linksMissingHref || data.linksMissingHref === 0, detail: `${data.linksMissingHref || 0} missing` },
    ]},
    { cat: 'ARIA & Landmarks', items: [
      { label: 'No aria-hidden on body', pass: !data.ariaHiddenOnBody, detail: data.ariaHiddenOnBody ? 'CRITICAL' : 'OK' },
      { label: 'Valid ARIA roles', pass: !data.invalidAriaRoles || data.invalidAriaRoles === 0, detail: `${data.invalidAriaRoles || 0} invalid` },
      { label: 'No prohibited ARIA attrs', pass: !data.ariaProhibitedAttrs || data.ariaProhibitedAttrs === 0, detail: `${data.ariaProhibitedAttrs || 0} found` },
      { label: 'Main landmark present', pass: !data.noMainLandmark, detail: data.noMainLandmark ? 'Missing' : 'Present' },
      { label: 'Navs have unique labels', pass: !data.multipleNavWithoutLabel || data.multipleNavWithoutLabel === 0, detail: `${data.multipleNavWithoutLabel || 0} unlabeled` },
      { label: 'No duplicate banner landmarks', pass: !data.duplicateBannerLandmark, detail: data.duplicateBannerLandmark ? 'Duplicate' : 'OK' },
      { label: 'No duplicate contentinfo', pass: !data.duplicateContentinfoLandmark, detail: data.duplicateContentinfoLandmark ? 'Duplicate' : 'OK' },
    ]},
    { cat: 'Content & Structure', items: [
      { label: 'Lang attribute set', pass: !!data.langTag, detail: data.langTag || 'Missing' },
      { label: 'Valid lang code', pass: !data.htmlLangInvalid, detail: data.htmlLangInvalid ? 'Invalid' : 'OK' },
      { label: 'No duplicate IDs', pass: !data.duplicateIds || data.duplicateIds === 0, detail: `${data.duplicateIds || 0} duplicates` },
      { label: 'Tables have headers', pass: !data.tablesWithoutHeaders || data.tablesWithoutHeaders === 0, detail: `${data.tablesWithoutHeaders || 0} without` },
      { label: 'Tables have captions', pass: !data.missingTableCaption || data.missingTableCaption === 0, detail: `${data.missingTableCaption || 0} missing` },
      { label: 'Valid list structure', pass: !data.invalidListStructure || data.invalidListStructure === 0, detail: `${data.invalidListStructure || 0} invalid` },
      { label: 'No p-as-heading abuse', pass: !data.pAsHeading || data.pAsHeading === 0, detail: `${data.pAsHeading || 0} found` },
      { label: 'No audio autoplay', pass: !data.audioAutoplay || data.audioAutoplay === 0, detail: `${data.audioAutoplay || 0} found` },
      { label: 'Iframes have titles', pass: !data.iframesWithoutTitle || data.iframesWithoutTitle === 0, detail: `${data.iframesWithoutTitle || 0} missing` },
      { label: 'Viewport allows zoom', pass: !data.viewportZoomDisabled, detail: data.viewportZoomDisabled ? 'Blocked' : 'Allowed' },
    ]},
  ];

  const totalChecks = checks.reduce((sum, g) => sum + g.items.length, 0);
  const passingChecks = checks.reduce((sum, g) => sum + g.items.filter(i => i.pass).length, 0);
  const score = Math.round((passingChecks / totalChecks) * 100);

  return (
    <div>
      <div style={S.card}>
        <div style={S.rowSpread}>
          <div>
            <h2 style={S.h2}>♿ Accessibility Audit Dashboard</h2>
            <div style={S.muted}>WCAG 2.2 / axe-core 4.10 checks — ensuring the page is accessible to all users and compliant with accessibility standards.</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '40px', fontWeight: 700, color: scoreColor(score) }}>{score}</div>
            <div style={{ fontSize: '12px', color: '#a1a1aa' }}>{passingChecks}/{totalChecks} passing</div>
          </div>
        </div>
        <div style={{ marginTop: '8px' }}>
          <ProgressBar pct={score} />
        </div>
      </div>

      {checks.map((group, gi) => {
        const gPassed = group.items.filter(i => i.pass).length;
        const gTotal = group.items.length;
        const gScore = Math.round((gPassed / gTotal) * 100);
        return (
          <div key={gi} style={S.card}>
            <div style={S.rowSpread}>
              <h2 style={{ ...S.h2, margin: 0 }}>{group.cat}</h2>
              <span style={S.badge(scoreColor(gScore))}>{gPassed}/{gTotal} passing</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
              {group.items.map((item, ii) => (
                <div key={ii} style={{ ...S.elevated, display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 10px' }}>
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{item.pass ? '✅' : '❌'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: item.pass ? '#22c55e' : '#f97316' }}>{item.label}</div>
                    <div style={{ fontSize: '11px', color: '#71717a' }}>{item.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HREFLANG / INTERNATIONAL SEO PANEL (sub-component for AnalyzerTab)
   ══════════════════════════════════════════════════════════════════════════════ */
function HreflangPanel({ data }) {
  if (!data?.hreflangTags?.length) return null;

  const langNames = { 'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian', 'pt': 'Portuguese', 'nl': 'Dutch', 'ja': 'Japanese', 'ko': 'Korean', 'zh': 'Chinese', 'ru': 'Russian', 'ar': 'Arabic', 'hi': 'Hindi', 'x-default': 'Default' };
  const hasSelf = data.hreflangMissingSelf === false;
  const hasXDefault = data.hreflangMissingXDefault === false;
  const hasInvalidCodes = data.invalidHreflangCodes?.length > 0;

  return (
    <div style={S.card}>
      <h2 style={S.h2}>🌍 International SEO / Hreflang</h2>
      <div style={S.muted}>Hreflang tells search engines which language/region version of a page to show users. {data.hreflangTags.length} hreflang tag(s) found.</div>
      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
        <span style={S.badge(hasSelf ? '#22c55e' : '#ef4444')}>{hasSelf ? '✅' : '❌'} Self-reference</span>
        <span style={S.badge(hasXDefault ? '#22c55e' : '#f97316')}>{hasXDefault ? '✅' : '⚠'} x-default</span>
        {hasInvalidCodes && <span style={S.badge('#ef4444')}>❌ Invalid codes: {data.invalidHreflangCodes.join(', ')}</span>}
      </div>
      <div style={{ marginTop: '12px' }}>
        {data.hreflangTags.map((tag, i) => (
          <div key={i} style={{ ...S.elevated, marginBottom: '6px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <span style={{ fontSize: '20px' }}>🏳️</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#818cf8' }}>{tag.lang} — {langNames[tag.lang?.split('-')[0]?.toLowerCase()] || tag.lang}</div>
              <div style={{ fontSize: '12px', color: '#a1a1aa', wordBreak: 'break-all' }}>{tag.href}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   MOBILE USABILITY PANEL (sub-component for AnalyzerTab)
   ══════════════════════════════════════════════════════════════════════════════ */
function MobileUsabilityPanel({ data }) {
  if (!data) return null;

  const checks = [
    { label: 'Viewport meta tag', pass: !!data.viewportMeta, tip: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for responsive layout.' },
    { label: 'Zoom not disabled', pass: !data.viewportZoomDisabled, tip: 'Do not use user-scalable=no or maximum-scale<5 — users must be able to zoom.' },
    { label: 'No plugin elements', pass: !data.pluginElements || data.pluginElements === 0, tip: `${data.pluginElements || 0} <embed>/<object>/<applet> found — not supported on mobile.` },
    { label: 'Responsive images (srcset/picture)', pass: !!(data.srcsetImages > 0 || data.pictureElements > 0), tip: 'Use <picture> or srcset to serve appropriate image sizes on mobile devices.' },
    { label: 'No horizontal scroll (page width)', pass: !data.pageSizeKB || data.pageSizeKB < 1000, tip: 'Large HTML pages may cause performance issues on mobile devices.' },
    { label: 'Touch-friendly (no tiny tap targets)', pass: !data.smallTapTargets || data.smallTapTargets === 0, tip: 'Ensure buttons and links are at least 48x48px for touch devices.' },
    { label: 'Font size readable', pass: !data.smallFontSize || data.smallFontSize === 0, tip: 'Use minimum 16px font size for mobile readability.' },
    { label: 'Favicon present', pass: data.hasFavicon !== false, tip: 'Favicons show in mobile browser tabs and bookmarks.' },
    { label: 'No meta refresh redirect', pass: !data.hasMetaRefresh, tip: 'Meta refresh redirects are poor UX on mobile — use server-side redirects.' },
    { label: 'HTTPS (secure)', pass: data.urlAnalysis?.isHttps, tip: 'Google requires HTTPS for mobile-first indexing.' },
  ];

  const passing = checks.filter(c => c.pass).length;
  const score = Math.round((passing / checks.length) * 100);

  return (
    <div style={S.card}>
      <div style={S.rowSpread}>
        <h2 style={S.h2}>📱 Mobile Usability</h2>
        <span style={S.badge(scoreColor(score))}>{passing}/{checks.length} passing</span>
      </div>
      <div style={S.muted}>Google uses mobile-first indexing — these checks ensure your page works well on phones and tablets.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
        {checks.map((c, i) => (
          <div key={i} style={{ ...S.elevated, display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '8px 10px' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{c.pass ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: c.pass ? '#22c55e' : '#f97316' }}>{c.label}</div>
              {!c.pass && <div style={{ fontSize: '11px', color: '#71717a', marginTop: '2px' }}>{c.tip}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   CONTENT DEPTH ANALYSIS (sub-component for AnalyzerTab)
   ══════════════════════════════════════════════════════════════════════════════ */
function ContentDepthPanel({ data }) {
  if (!data) return null;

  const wc = data.wordCount || 0;
  const readTime = data.readingTimeMinutes || Math.ceil(wc / 200);
  const contentBenchmarks = [
    { label: 'Thin Content', threshold: 100, color: '#ef4444' },
    { label: 'Short', threshold: 300, color: '#f97316' },
    { label: 'Average', threshold: 1000, color: '#eab308' },
    { label: 'Comprehensive', threshold: 2000, color: '#22c55e' },
    { label: 'In-depth', threshold: Infinity, color: '#4f46e5' },
  ];
  const benchmark = contentBenchmarks.find(b => wc < b.threshold) || contentBenchmarks[contentBenchmarks.length - 1];

  return (
    <div style={S.card}>
      <h2 style={S.h2}>📝 Content Depth Analysis</h2>
      <div style={S.muted}>Word count, reading time, content structure metrics — compared to typical ranking pages.</div>
      <div style={{ ...S.grid4, marginTop: '12px' }}>
        <StatCard label="Word Count" value={wc.toLocaleString()} color={benchmark.color} />
        <StatCard label="Reading Time" value={`${readTime}m`} color="#4f46e5" />
        <StatCard label="Paragraphs" value={data.paragraphCount || 0} color="#8b5cf6" />
        <StatCard label="Code:Text Ratio" value={`${data.codeToTextRatio || 0}%`} color={(data.codeToTextRatio || 0) > 25 ? '#22c55e' : '#f97316'} />
      </div>
      <div style={{ ...S.grid3, marginTop: '12px' }}>
        <StatCard label="H2 Headings" value={data.h2Count || 0} color="#4f46e5" />
        <StatCard label="H3 Headings" value={data.h3Count || 0} color="#4f46e5" />
        <StatCard label="Lists (ul/ol)" value={(data.hasListElements !== false ? '✓' : '✗')} color={data.hasListElements !== false ? '#22c55e' : '#f97316'} />
      </div>
      <div style={{ marginTop: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>Content Classification</div>
        <div style={{ display: 'flex', gap: '4px', height: '32px', borderRadius: '6px', overflow: 'hidden' }}>
          {contentBenchmarks.filter(b => b.threshold !== Infinity).map((b, i) => (
            <div key={i} style={{ flex: 1, background: wc >= b.threshold ? b.color + '33' : '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: wc >= b.threshold ? b.color : '#52525b', fontWeight: 600, borderRight: '1px solid #18181b' }}>
              {b.label} ({b.threshold}+)
            </div>
          ))}
          <div style={{ flex: 1, background: wc >= 2000 ? '#4f46e5' + '33' : '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: wc >= 2000 ? '#4f46e5' : '#52525b', fontWeight: 600 }}>
            In-depth (2000+)
          </div>
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: benchmark.color, fontWeight: 600 }}>
          Your content: {benchmark.label} ({wc} words)
        </div>
      </div>
      {data.subheadingDistribution && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>Subheading Distribution</div>
          <div style={{ fontSize: '12px', color: '#d4d4d8' }}>
            {data.subheadingDistribution.longBlocksWithoutHeadings > 0
              ? <span style={{ color: '#f97316' }}>⚠ {data.subheadingDistribution.longBlocksWithoutHeadings} text block(s) over 300 words without subheadings</span>
              : <span style={{ color: '#22c55e' }}>✅ Good subheading distribution — no long blocks without headings</span>}
          </div>
        </div>
      )}
      {data.sentenceLengthStats && (
        <div style={{ marginTop: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '4px' }}>Sentence Analysis</div>
          <div style={{ fontSize: '12px', color: '#d4d4d8' }}>
            Total sentences: {data.sentenceLengthStats.total} | Over 20 words: {data.sentenceLengthStats.longCount} ({data.sentenceLengthStats.longPercent}%)
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   HTML VALIDATION PANEL (sub-component for AnalyzerTab)
   ══════════════════════════════════════════════════════════════════════════════ */
function HTMLValidationPanel({ data }) {
  if (!data) return null;

  const checks = [
    { label: 'DOCTYPE declaration', pass: data.hasDoctype !== false, detail: 'Required for standards mode' },
    { label: 'Charset declared', pass: data.hasCharset !== false, detail: 'Required within first 1024 bytes' },
    { label: 'Single <head> tag', pass: !data.multipleHeadTags, detail: data.multipleHeadTags ? 'Multiple found' : 'OK' },
    { label: 'Single <body> tag', pass: !data.multipleBodyTags, detail: data.multipleBodyTags ? 'Multiple found' : 'OK' },
    { label: 'No content before <html>', pass: !data.bodyBeforeHtml, detail: data.bodyBeforeHtml ? 'Content detected before <html>' : 'OK' },
    { label: 'No deprecated tags', pass: !data.deprecatedTagsFound?.length, detail: data.deprecatedTagsFound?.length ? `Found: <${data.deprecatedTagsFound.join('>, <')}>` : 'None found' },
    { label: 'No nested forms', pass: !data.nestedForms || data.nestedForms === 0, detail: `${data.nestedForms || 0} nested` },
    { label: 'No nested anchor tags', pass: !data.nestedAnchorTags || data.nestedAnchorTags === 0, detail: `${data.nestedAnchorTags || 0} nested` },
    { label: 'No duplicate IDs', pass: !data.duplicateIds || data.duplicateIds === 0, detail: `${data.duplicateIds || 0} duplicates` },
    { label: 'Valid list structure', pass: !data.invalidListStructure || data.invalidListStructure === 0, detail: `${data.invalidListStructure || 0} invalid` },
    { label: 'No invalid <head> elements', pass: !data.invalidHeadElements?.length, detail: data.invalidHeadElements?.length ? `Found: <${data.invalidHeadElements.join('>, <')}>` : 'OK' },
    { label: 'DOM depth < 15', pass: !data.excessiveDomDepth || data.excessiveDomDepth <= 15, detail: `Depth: ${data.excessiveDomDepth || 'N/A'}` },
    { label: 'DOM size < 1500', pass: !data.totalDomElements || data.totalDomElements <= 1500, detail: `${data.totalDomElements || 'N/A'} elements` },
    { label: 'No charset charset late', pass: !data.charsetTooLate, detail: data.charsetTooLate ? 'Charset > 1024 bytes into document' : 'OK' },
  ];

  const passing = checks.filter(c => c.pass).length;
  const score = Math.round((passing / checks.length) * 100);

  return (
    <div style={S.card}>
      <div style={S.rowSpread}>
        <h2 style={S.h2}>🏗️ HTML Validation</h2>
        <span style={S.badge(scoreColor(score))}>{passing}/{checks.length} passing</span>
      </div>
      <div style={S.muted}>Screaming Frog-style HTML validation — checks document structure, deprecated tags, and DOM metrics.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
        {checks.map((c, i) => (
          <div key={i} style={{ ...S.elevated, display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 10px' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{c.pass ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: c.pass ? '#22c55e' : '#f97316' }}>{c.label}</div>
              <div style={{ fontSize: '11px', color: '#71717a' }}>{c.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   PAGINATION & CRAWLABILITY PANEL (sub-component for AnalyzerTab)
   ══════════════════════════════════════════════════════════════════════════════ */
function PaginationPanel({ data }) {
  if (!data) return null;

  const checks = [
    { label: 'Canonical URL set', pass: !!data.canonicalUrl, detail: data.canonicalUrl || 'Missing' },
    { label: 'Canonical is absolute', pass: !data.canonicalIsRelative, detail: data.canonicalIsRelative ? 'Relative URL' : 'Absolute' },
    { label: 'No canonical fragment', pass: !data.canonicalHasFragment, detail: data.canonicalHasFragment ? 'Contains #' : 'Clean' },
    { label: 'No canonical query string', pass: !data.canonicalHasQueryString, detail: data.canonicalHasQueryString ? 'Has query params' : 'Clean' },
    { label: 'Canonical matches og:url', pass: !data.canonicalOgUrlMismatch, detail: data.canonicalOgUrlMismatch ? 'Mismatch' : 'Consistent' },
    { label: 'Single canonical tag', pass: !data.canonicalCount || data.canonicalCount <= 1, detail: `${data.canonicalCount || 1} tag(s)` },
    { label: 'Indexable (no noindex)', pass: !data.robotsMeta || !/noindex/i.test(data.robotsMeta), detail: data.robotsMeta || 'No restriction' },
    { label: 'Pagination rel=next/prev', pass: data.hasPaginationRel?.hasNext || data.hasPaginationRel?.hasPrev || false, detail: `next: ${data.hasPaginationRel?.hasNext ? '✓' : '✗'} | prev: ${data.hasPaginationRel?.hasPrev ? '✓' : '✗'}` },
    { label: 'URL depth ≤ 4', pass: !data.urlDepth || data.urlDepth <= 4, detail: `Depth: ${data.urlDepth || 'N/A'}` },
    { label: 'No hash-bang URL', pass: !data.hashBangUrl, detail: data.hashBangUrl ? 'Deprecated #!' : 'OK' },
  ];

  const passing = checks.filter(c => c.pass).length;

  return (
    <div style={S.card}>
      <div style={S.rowSpread}>
        <h2 style={S.h2}>🕷️ Crawlability & Indexing</h2>
        <span style={S.badge(scoreColor(Math.round((passing / checks.length) * 100)))}>{passing}/{checks.length} passing</span>
      </div>
      <div style={S.muted}>Canonical configuration, pagination, robots directives, and URL structure — critical for proper crawling and indexing.</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '10px' }}>
        {checks.map((c, i) => (
          <div key={i} style={{ ...S.elevated, display: 'flex', gap: '8px', alignItems: 'center', padding: '8px 10px' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{c.pass ? '✅' : '❌'}</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: c.pass ? '#22c55e' : '#f97316' }}>{c.label}</div>
              <div style={{ fontSize: '11px', color: '#71717a', wordBreak: 'break-all' }}>{c.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   SOCIAL MEDIA PREVIEW PANEL (sub-component for AnalyzerTab)
   ══════════════════════════════════════════════════════════════════════════════ */
function SocialMediaPanel({ data }) {
  if (!data) return null;

  const ogFields = [
    { label: 'og:title', value: data.ogTitle, required: true },
    { label: 'og:description', value: data.ogDescription, required: true },
    { label: 'og:image', value: data.ogImage, required: true },
    { label: 'og:type', value: data.ogType, required: false },
    { label: 'og:url', value: data.ogUrl, required: false },
    { label: 'og:site_name', value: data.ogSiteName, required: false },
  ];

  const twitterFields = [
    { label: 'twitter:card', value: data.twitterCard, required: true },
    { label: 'twitter:title', value: data.twitterTitle || data.ogTitle, required: false },
    { label: 'twitter:description', value: data.twitterDescription || data.ogDescription, required: false },
    { label: 'twitter:image', value: data.twitterImage || data.ogImage, required: false },
  ];

  const ogComplete = ogFields.filter(f => f.required).every(f => !!f.value);
  const twComplete = twitterFields.filter(f => f.required).every(f => !!f.value);

  return (
    <div style={S.card}>
      <h2 style={S.h2}>📣 Social Media & OG Tags</h2>
      <div style={S.muted}>Open Graph and Twitter Card tags control how your page appears when shared on social media, Slack, Discord, and AI tools.</div>
      <div style={{ ...S.grid2, marginTop: '12px' }}>
        <div style={S.elevated}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: ogComplete ? '#22c55e' : '#f97316', marginBottom: '8px' }}>
            {ogComplete ? '✅' : '⚠'} Open Graph {ogComplete ? 'Complete' : 'Incomplete'}
          </div>
          {ogFields.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ flexShrink: 0 }}>{f.value ? '✅' : '❌'}</span>
              <span style={{ color: '#71717a', minWidth: '90px' }}>{f.label}</span>
              <span style={{ color: f.value ? '#d4d4d8' : '#ef4444', wordBreak: 'break-all' }}>{f.value || 'Missing'}</span>
            </div>
          ))}
        </div>
        <div style={S.elevated}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: twComplete ? '#22c55e' : '#f97316', marginBottom: '8px' }}>
            {twComplete ? '✅' : '⚠'} Twitter Card {twComplete ? 'Complete' : 'Incomplete'}
          </div>
          {twitterFields.map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: '6px', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ flexShrink: 0 }}>{f.value ? '✅' : '❌'}</span>
              <span style={{ color: '#71717a', minWidth: '100px' }}>{f.label}</span>
              <span style={{ color: f.value ? '#d4d4d8' : '#ef4444', wordBreak: 'break-all' }}>{f.value || 'Missing'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* END SUB-COMPONENTS MARKER */
