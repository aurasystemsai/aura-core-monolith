import React, { useState, useRef } from "react";

export default function ImageAltMediaSEO() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [images, setImages] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
      setAnalytics(data.analytics || []);
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
    try {
      const res = await fetch("/api/image-alt-media-seo/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result || "No alt text generated");
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
        body: JSON.stringify({ content: result })
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
          body: JSON.stringify({ data: JSON.parse(evt.target.result) })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Unknown error");
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
  }, []);

  return (
    <div style={{
      maxWidth: 900,
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
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#a3e635" : "#23263a" }}
        placeholder="Describe your image or alt text needs here..."
        aria-label="Image alt text input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={handleGenerate} disabled={loading || !input} style={{ background: "#a3e635", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Generating..." : "AI Generate"}</button>
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
        </div>
      )}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Images</div>
        <ul style={{ paddingLeft: 18 }}>
          {images.map(img => (
            <li key={img.id} style={{ marginBottom: 10 }}>
              <div><b>ID:</b> {img.id}</div>
              <div><b>Content:</b> {img.content || JSON.stringify(img)}</div>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
        <div style={{ fontSize: 15, color: darkMode ? "#a3e635" : "#23263a" }}>
          {analytics.length ? (
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
          ) : (
            <span>No analytics yet. Generate or import images to see results.</span>
          )}
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}
