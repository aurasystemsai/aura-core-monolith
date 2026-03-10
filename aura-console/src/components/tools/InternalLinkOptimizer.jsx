import React, { useState, useCallback, useEffect, useRef } from "react";
import { ToolHeader, MozTabs, MozCard, MetricRow, ErrorBox, EmptyState, Spinner, SortableTable } from "../MozUI";

const TABS = ["Generate", "Links", "Analytics"];

const S = {
  page: { background: '#09090b', minHeight: '100vh', padding: '24px', color: '#fafafa' },
  pre: { background: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '16px', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '13px', color: '#e4e4e7' },
  btnRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' },
  btn: (v) => v === 'primary' ? { background: '#4f46e5', color: '#fafafa', border: 'none', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }
             : { background: 'transparent', color: '#a1a1aa', border: '1px solid #3f3f46', borderRadius: '6px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px' },
};

export default function InternalLinkOptimizer() {
  const [tab, setTab] = useState(0);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [links, setLinks] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const fileInputRef = useRef();

  const fetchLinks = useCallback(async () => {
    try {
      const res = await fetch("/api/internal-link-optimizer/links");
      const data = await res.json();
      if (data.ok) setLinks(data.links || []);
    } catch {}
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch("/api/internal-link-optimizer/analytics");
      const data = await res.json();
      if (data.ok) setAnalytics(data.analytics || []);
    } catch {}
  }, []);

  useEffect(() => { fetchLinks(); fetchAnalytics(); }, []);

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/internal-link-optimizer/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Generation failed");
      setResult(data.result || "No links generated");
      fetchLinks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [input, fetchLinks]);

  const handleSave = useCallback(async () => {
    if (!result) return;
    try {
      await fetch("/api/internal-link-optimizer/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: result }),
      });
      fetchLinks();
    } catch {}
  }, [result, fetchLinks]);

  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        await fetch("/api/internal-link-optimizer/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result) }),
        });
        fetchLinks();
      } catch {}
    };
    reader.readAsText(file);
  };

  const linkColumns = [
    { key: "id", label: "#" },
    { key: "content", label: "Link", render: v => v ? v.slice(0, 80) + (v.length > 80 ? "…" : "") : "—" },
  ];

  return (
    <div style={S.page}>
      <ToolHeader
        title="Internal Link Optimizer"
        description="Generate AI-powered internal link suggestions and manage your link structure."
        inputPlaceholder="Describe your page content or paste text to generate internal links..."
        inputValue={input}
        onInputChange={setInput}
        onSubmit={handleGenerate}
        loading={loading}
        buttonLabel="AI Generate"
        inputType="textarea"
      />

      <MozTabs tabs={TABS} active={tab} onChange={setTab} style={{ marginBottom: '20px' }} />

      {tab === 0 && (
        <>
          {loading && <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div>}
          {error && <ErrorBox message={error} />}
          {!loading && !result && !error && (
            <EmptyState icon="🔗" title="Paste page content above to generate internal link suggestions" message="AI will analyse your content and recommend the best internal linking opportunities." />
          )}
          {result && (
            <>
              <div style={S.btnRow}>
                <button style={S.btn('primary')} onClick={handleSave}>Save Links</button>
                <button style={S.btn()} onClick={() => navigator.clipboard?.writeText(result)}>Copy</button>
              </div>
              <MozCard title="AI Link Suggestions">
                <pre style={S.pre}>{result}</pre>
              </MozCard>
            </>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <MetricRow metrics={[{ label: "Saved Links", value: links.length, color: "#4f46e5" }]} />
          <div style={S.btnRow}>
            <button style={S.btn('primary')} onClick={() => fileInputRef.current?.click()}>Import JSON</button>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
            <button style={S.btn()} onClick={() => {
              const url = URL.createObjectURL(new Blob([JSON.stringify(links, null, 2)], { type: 'application/json' }));
              const a = Object.assign(document.createElement('a'), { href: url, download: 'links.json' });
              a.click(); URL.revokeObjectURL(url);
            }}>Export JSON</button>
          </div>
          {links.length === 0
            ? <EmptyState icon="🔗" title="No saved links" message="Generate and save links in the Generate tab." />
            : <SortableTable columns={linkColumns} rows={links} />
          }
        </>
      )}

      {tab === 2 && (
        <>
          {analytics.length === 0
            ? <EmptyState icon="📈" title="No analytics yet" message="Analytics will populate as you use the tool." />
            : <SortableTable columns={[{ key: 'event', label: 'Event' }, { key: 'count', label: 'Count' }]} rows={analytics} />
          }
        </>
      )}
    </div>
  );
}
