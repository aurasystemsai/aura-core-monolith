﻿import React, { useState, useRef } from "react";
import BackButton from "./BackButton";
import { apiFetch } from "../../api";

export default function CreativeAutomationEngine() {
  const [brief, setBrief] = useState("");
  const [result, setResult] = useState("");
  const [creatives, setCreatives] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const fileInputRef = useRef();

  // Fetch creatives
  const fetchCreatives = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/creative-automation-engine/creatives");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setCreatives(data.creatives || []);
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
      const res = await apiFetch("/api/creative-automation-engine/analytics");
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
      const res = await apiFetch("/api/creative-automation-engine/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResult(data.result || "No creative generated");
      fetchCreatives();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // CRUD
  const handleAddCreative = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/api/creative-automation-engine/creatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: result })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      fetchCreatives();
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
        const res = await apiFetch("/api/creative-automation-engine/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result) })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Unknown error");
        setImported(file.name);
        fetchCreatives();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(creatives, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
  };

  // Onboarding
  const onboardingContent = (
    <div style={{ padding: 24, background: darkMode ? "#141414" : "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Creative Automation Engine</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#4a4a4a", fontSize: 16 }}>
        <li>Generate, import, and manage marketing creatives with AI</li>
        <li>Analyze performance with real-time analytics</li>
        <li>Collaborate and share with your team</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#141414", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  React.useEffect(() => {
    fetchCreatives();
    fetchAnalytics();
  }, []);

  return (
    <div
      style={{
        margin: "40px auto",
        background: darkMode ? "#18181b" : "#fff",
        borderRadius: 18,
        boxShadow: "0 2px 24px #0002",
        padding: 36,
        color: darkMode ? "#a3e635" : "#141414",
        fontFamily: "Inter, sans-serif",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <BackButton />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Creative Automation Engine</h2>
        <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#141414", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
      </div>
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="sparkles"></span>Generate, manage, and analyze marketing creatives with AI and analytics.
      </div>
      <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <textarea
        value={brief}
        onChange={e => setBrief(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#141414" : "#fff", color: darkMode ? "#a3e635" : "#141414" }}
        placeholder="Describe your creative brief here..."
        aria-label="Creative brief input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={handleGenerate} disabled={loading || !brief} style={{ background: "#a3e635", color: "#141414", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Generating..." : "AI Generate"}</button>
        <button onClick={handleAddCreative} disabled={!result} style={{ background: "#7fffd4", color: "#141414", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Save Creative</button>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#141414", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import creatives" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="creatives.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {result && (
        <div style={{ background: darkMode ? "#141414" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635" : "#141414" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Creative:</div>
          <div>{result}</div>
        </div>
      )}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <div style={{ marginTop: 24, background: darkMode ? "#282828" : "#fff", borderRadius: 12, padding: 18, border: "1px solid #2e2e2e" }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: darkMode ? "#e2e8f0" : "#141414" }}>Creatives</div>
        {creatives.map(c => (
          <div key={c.id} style={{ background: darkMode ? "#141414" : "#f8fafc", borderRadius: 8, padding: "10px 14px", marginBottom: 8, border: "1px solid #2e2e2e" }}>
            <span style={{ fontWeight: 600, color: darkMode ? "#e2e8f0" : "#141414" }}>{c.content ? c.content.slice(0, 80) + (c.content.length > 80 ? "…" : "") : `Creative #${c.id}`}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <div style={{ background: "#2e2e2e", borderRadius: 10, padding: "12px 20px", border: "1px solid #2e2e2e" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total Creatives</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#a3e635", marginTop: 2 }}>{creatives.length}</div>
        </div>
        <div style={{ background: "#2e2e2e", borderRadius: 10, padding: "12px 20px", border: "1px solid #2e2e2e" }}>
          <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Events</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "#a3e635", marginTop: 2 }}>{analytics.length}</div>
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}




