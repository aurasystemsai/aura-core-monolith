import React, { useState, useRef } from "react";

export default function ImageAltMediaSEO() {
  const [input, setInput] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [attributes, setAttributes] = useState("");
  const [shotType, setShotType] = useState("front");
  const [variant, setVariant] = useState("");
  const [focus, setFocus] = useState("product");
  const [scene, setScene] = useState("");
  const [locale, setLocale] = useState("en-US");
  const [result, setResult] = useState("");
  const [lint, setLint] = useState(null);
  const [grade, setGrade] = useState(null);
  const [sanitized, setSanitized] = useState("");
  const [batchInput, setBatchInput] = useState("[]");
  const [batchResults, setBatchResults] = useState([]);
  const [runs, setRuns] = useState([]);
  const [images, setImages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [safeMode, setSafeMode] = useState(true);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const fileInputRef = useRef();

  // Fetch images
  const fetchImages = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/image-alt-media-seo/images");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setImages(data.images || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/image-alt-media-seo/analytics");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setAnalytics(data.analytics || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGenerate = async () => {
    setLoading(true);
    setError("");
    setBatchResults([]);
    try {
      let items;
      try {
        items = JSON.parse(batchInput);
      } catch (parseErr) {
        throw new Error("Batch input must be valid JSON array");
      }
      if (!Array.isArray(items) || !items.length) throw new Error("Provide at least one item");
      const res = await fetch("/api/image-alt-media-seo/ai/batch-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, locale, safeMode })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Batch failed");
      setBatchResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBatchItem = async item => {
    if (!item?.result) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/image-alt-media-seo/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.meta?.url, altText: item.result })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Save failed");
      fetchImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // AI Generate
  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setResult("");
    setLint(null);
    setGrade(null);
    setSanitized("");
    try {
      const res = await fetch("/api/image-alt-media-seo/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, url: imageUrl, keywords, locale, safeMode, productTitle, attributes, shotType, variant, focus, scene })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result || "No alt text generated");
      setLint(data.lint || null);
      setGrade(data.grade || null);
      setSanitized(data.sanitized || "");
      fetchImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // CRUD
  const handleAddImage = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/image-alt-media-seo/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imageUrl, altText: result })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      fetchImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async evt => {
      try {
        const res = await fetch("/api/image-alt-media-seo/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result), dryRun: true })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || (data.errors && data.errors.map(e => `Row ${e.index}: ${e.error}`).join(', ')) || "Unknown error");
        // apply for real after dry-run passes
        const resApply = await fetch("/api/image-alt-media-seo/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result) })
        });
        const dataApply = await resApply.json();
        if (!dataApply.ok) throw new Error(dataApply.error || "Unknown error");
        setImported(file.name);
        fetchImages();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(images, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Onboarding
  const onboardingContent = (
    <div style={{ padding: 24, background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Image Alt Media SEO</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#334155", fontSize: 16 }}>
        <li>Generate, import, and manage image alt text with AI</li>
        <li>Analyze performance with real-time analytics</li>
        <li>Collaborate and share with your team</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  React.useEffect(() => {
    fetchImages();
    fetchAnalytics();
    fetch("/api/image-alt-media-seo/runs").then(r => r.json()).then(d => { if (d.ok) setRuns(d.runs || []); }).catch(() => {});
  }, []);

  return (
    <div style={{
      
      margin: "40px auto",
      background: darkMode ? "#18181b" : "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: darkMode ? "#a3e635" : "#23263a",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Image Alt Media SEO</h2>
        <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#23263a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
      </div>
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="image">🖼️</span> Generate, manage, and analyze image alt text with AI and analytics.
      </div>
      <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <input
          value={imageUrl}
          onChange={e => setImageUrl(e.target.value)}
          placeholder="Image URL (optional but recommended)"
          aria-label="Image URL"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        />
        <input
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="Target keywords (comma separated)"
          aria-label="Target keywords"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <input
          value={productTitle}
          onChange={e => setProductTitle(e.target.value)}
          placeholder="Product title"
          aria-label="Product title"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        />
        <input
          value={variant}
          onChange={e => setVariant(e.target.value)}
          placeholder="Variant (e.g., red / size M)"
          aria-label="Variant"
          style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Shot type</span>
          <select value={shotType} onChange={e => setShotType(e.target.value)} aria-label="Shot type" style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
            <option value="front">front</option>
            <option value="back">back</option>
            <option value="side">side</option>
            <option value="detail">detail close-up</option>
            <option value="lifestyle">lifestyle scene</option>
            <option value="packaging">packaging</option>
          </select>
        </label>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Focus</span>
          <select value={focus} onChange={e => setFocus(e.target.value)} aria-label="Focus" style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
            <option value="product">product</option>
            <option value="scene">scene</option>
            <option value="detail">detail</option>
          </select>
        </label>
      </div>
      <textarea
        value={attributes}
        onChange={e => setAttributes(e.target.value)}
        rows={3}
        style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 12, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        placeholder="Attributes (comma or JSON: color, material, style, use-case)"
        aria-label="Attributes"
      />
      <input
        value={scene}
        onChange={e => setScene(e.target.value)}
        placeholder="Scene (e.g., studio on white, outdoor cafe)"
        aria-label="Scene"
        style={{ width: "100%", fontSize: 15, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 12, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600 }}>Locale</span>
          <select value={locale} onChange={e => setLocale(e.target.value)} aria-label="Locale" style={{ padding: "8px 10px", borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}>
            <option value="en-US">en-US</option>
            <option value="en-GB">en-GB</option>
            <option value="de">de</option>
            <option value="fr">fr</option>
            <option value="es">es</option>
            <option value="ja">ja</option>
            <option value="ko">ko</option>
            <option value="zh">zh</option>
          </select>
        </label>
        <label style={{ fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <input type="checkbox" checked={safeMode} onChange={e => setSafeMode(e.target.checked)} />
          <span>Safe mode (PII/promo sanitization)</span>
        </label>
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        placeholder="Describe your image or alt text needs here..."
        aria-label="Image alt text input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={handleGenerate} disabled={loading || (!input && !imageUrl)} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Generating..." : "AI Generate"}</button>
        <button onClick={handleAddImage} disabled={!result} style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Save Alt Text</button>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import images" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="images.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {result && (
        <div style={{ background: darkMode ? "#23263a" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635" : "#23263a" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Alt Text:</div>
          <div>{result}</div>
          {lint && (
            <div style={{ marginTop: 8, fontSize: 14 }}>
              <span style={{ fontWeight: 600 }}>Lint:</span> {lint.withinRange ? "Length OK" : `Length ${lint.length}`}
              {lint.issues?.length ? <ul style={{ margin: "6px 0 0 18px" }}>{lint.issues.map(issue => <li key={issue}>{issue}</li>)}</ul> : <span style={{ marginLeft: 8 }}>No issues detected</span>}
              {lint.redactedAlt && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontWeight: 600 }}>Redacted suggestion:</span> {lint.redactedAlt}
                  <button onClick={() => setResult(lint.redactedAlt)} style={{ marginLeft: 8, background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>Apply</button>
                </div>
              )}
              {sanitized && sanitized !== result && (
                <div style={{ marginTop: 6 }}>
                  <span style={{ fontWeight: 600 }}>Sanitized:</span> {sanitized}
                  <button onClick={() => setResult(sanitized)} style={{ marginLeft: 8, background: "#a3e635", color: "#23263a", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13 }}>Use sanitized</button>
                </div>
              )}
            </div>
          )}
          {grade && (
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 700 }}>Grade:</span>
              <span style={{ padding: "4px 10px", borderRadius: 8, background: grade.grade === 'A' ? '#22c55e' : grade.grade === 'B' ? '#84cc16' : grade.grade === 'C' ? '#fbbf24' : '#ef4444', color: '#0b0b0b', fontWeight: 800 }}>{grade.grade} ({grade.score})</span>
            </div>
          )}
        </div>
      )}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}

      <div style={{ marginTop: 24, background: darkMode ? "#1f2937" : "#eef2ff", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Batch Generate (JSON array)</div>
        <textarea
          value={batchInput}
          onChange={e => setBatchInput(e.target.value)}
          rows={6}
          style={{ width: "100%", fontSize: 14, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a", fontFamily: 'Menlo, Consolas, monospace' }}
          aria-label="Batch JSON"
          placeholder='[
  { "input": "red leather tote on white", "url": "https://...", "keywords": "leather tote" }
]'
        />
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <button onClick={handleBatchGenerate} disabled={loading} style={{ background: "#10b981", color: "#0b0b0b", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{loading ? "Working..." : "Run Batch"}</button>
          <span style={{ fontSize: 13, color: darkMode ? "#a3e635" : "#475569" }}>Sends to /ai/batch-generate; locale and safe mode are applied.</span>
        </div>
        {batchResults?.length ? (
          <ul style={{ marginTop: 12, paddingLeft: 18 }}>
            {batchResults.map((r, idx) => (
              <li key={idx} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 600 }}>Item {idx + 1}: {r.ok ? "OK" : "Error"}</div>
                {r.error && <div style={{ color: "#ef4444" }}>{r.error}</div>}
                {r.result && <div><b>Alt:</b> {r.result}</div>}
                {r.meta?.url && <div><b>URL:</b> {r.meta.url}</div>}
                {r.grade && <div><b>Grade:</b> {r.grade.grade} ({r.grade.score})</div>}
                {r.lint?.issues?.length ? <div><b>Issues:</b> {r.lint.issues.join('; ')}</div> : null}
                {r.result && <button onClick={() => handleSaveBatchItem(r)} style={{ marginTop: 6, background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>Save to library</button>}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {runs?.length ? (
        <div style={{ marginTop: 18, background: darkMode ? "#111827" : "#e0f2fe", borderRadius: 12, padding: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Recent Batch Runs</div>
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {runs.slice(-5).reverse().map(run => (
              <li key={run.id} style={{ marginBottom: 6, fontSize: 13 }}>
                <b>{run.total} items</b> · ok {run.ok} / err {run.errors} · {run.durationMs}ms · locale {run.locale} · safe {String(run.safeMode)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Images</div>
        <ul style={{ paddingLeft: 18 }}>
          {images.map(img => (
            <li key={img.id} style={{ marginBottom: 10 }}>
              <div><b>ID:</b> {img.id}</div>
              <div><b>URL:</b> {img.url || "(none)"}</div>
              <div><b>Alt:</b> {img.altText || img.content || JSON.stringify(img)}</div>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
        <div style={{ fontSize: 15, color: darkMode ? "#a3e635" : "#23263a" }}>
          {analytics ? (
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
              <div><b>Total:</b> {analytics.totalImages ?? 0}</div>
              <div><b>Avg length:</b> {analytics.avgLength ?? 0}</div>
              <div><b>Missing URL:</b> {analytics.missingUrl ?? 0}</div>
              <div><b>Missing alt:</b> {analytics.missingAlt ?? 0}</div>
              <div><b>Duplicate alts:</b> {analytics.duplicateAlts ?? 0}</div>
              <div><b>Unique alts:</b> {analytics.uniqueAlts ?? 0}</div>
              <div><b>Coverage %:</b> {analytics.coveragePct ?? 0}%</div>
            </div>
          ) : <span>No analytics yet. Generate or import images to see results.</span>}
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
