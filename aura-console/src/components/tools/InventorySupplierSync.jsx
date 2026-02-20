﻿
import React, { useState, useRef } from "react";

function VisualInventoryTable({ data, setData, rows = [], setRows }) {
  return (
    <div style={{ border: "1px solid #e9ebf5", borderRadius: 10, padding: 18, background: "#f9fafb", marginBottom: 18 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Visual Inventory Table (CSV/Excel Import)</div>
      <div style={{ minHeight: 80, border: '1px dashed #bbb', borderRadius: 8, padding: 12, background: '#353848', marginBottom: 12, color: '#f9fafb' }}>
        {rows.length ? (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {rows.map((r, i) => (
              <li key={i} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 600, color: '#0ea5e9' }}>{r}</span>
                <button onClick={() => setRows(rows.filter((_, idx) => idx !== i))} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Remove</button>
              </li>
            ))}
          </ul>
        ) : (
          <span style={{ color: '#64748b' }}>Paste or import supplier inventory data here.</span>
        )}
      </div>
      <textarea
        value={data}
        onChange={e => setData(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 15, borderRadius: 6, border: "1px solid #ccc", padding: 8 }}
        placeholder="Paste or import supplier inventory data (CSV, Excel, JSON)"
      />
      <button onClick={() => setRows([...rows, data])} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginTop: 8 }}>Add Row</button>
    </div>
  );
}

export default function InventorySupplierSync() {
  const [data, setData] = useState("");
  const [rows, setRows] = useState([]);
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [collaborators, setCollaborators] = useState(["You"]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const fileInputRef = useRef();

  // AI Suggestion
  const handleAISuggest = async () => {
    setLoading(true);
    setError("");
    setAiSuggestion("");
    try {
      const res = await fetch("/api/inventory-supplier-sync/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierData: data })
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "Unknown error");
      setAiSuggestion(result.suggestion || "No suggestion generated");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run Sync
  const handleRun = async () => {
    setLoading(true);
    setError("");
    setAnalytics(null);
    try {
      const res = await fetch("/api/inventory-supplier-sync/ai/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierData: data })
      });
      const result = await res.json();
      if (!result.ok) throw new Error(result.error || "Unknown error");
      setAnalytics(result.analytics || { summary: "No analytics available" });
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
    reader.onload = evt => {
      setData(evt.target.result);
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() =>URL.revokeObjectURL(url), 10000);
  };

  // Collaboration
  const handleAddCollaborator = () => {
    const name = prompt("Enter collaborator name/email:");
    if (name && !collaborators.includes(name)) setCollaborators([...collaborators, name]);
  };

  // Onboarding
  const onboardingContent = (
    <div style={{ padding: 24, background: "#353848", borderRadius: 12, marginBottom: 18, color: '#f9fafb' }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Inventory Supplier Sync</h3>
      <ul style={{ margin: "16px 0 0 18px", color: "#454860", fontSize: 16 }}>
        <li>Import, map, and reconcile supplier inventory visually</li>
        <li>AI-powered discrepancy detection and suggestions</li>
        <li>Analyze sync performance with real-time analytics</li>
        <li>Collaborate and share with your team</li>
        <li>Integrate with Shopify and supplier APIs</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#0d0d11", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  // Accessibility: keyboard shortcuts
  React.useEffect(() => {
    const handler = e => {
      if (e.ctrlKey && e.key === "i") fileInputRef.current?.click();
      if (e.ctrlKey && e.key === "e") handleExport();
      if (e.ctrlKey && e.key === "d") setDarkMode(d => !d);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Main UI
  return (
    <div style={{
      
      margin: "40px auto",
      background: darkMode ? "#1a1c25" : "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: darkMode ? "#f1f5f9" : "#0d0d11",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Inventory Supplier Sync</h2>
        <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#0d0d11", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
      </div>
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="sync"></span>Import, map, and reconcile supplier inventory with AI, analytics, and team collaboration.
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 320 }}>
          {showOnboarding && onboardingContent}
          <VisualInventoryTable data={data} setData={setData} rows={rows} setRows={setRows} />
          <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
            <button onClick={handleAISuggest} disabled={loading || !data} style={{ background: "#a3e635", color: "#0d0d11", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Thinking..." : "AI Suggest"}</button>
            <button onClick={handleRun} disabled={loading || !data} style={{ background: "#6366f1", color: "#0d0d11", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Syncing..." : "Run Sync"}</button>
            <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#0d0d11", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
            <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.json,.txt" style={{ display: "none" }} onChange={handleImport} aria-label="Import inventory" />
            <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
            {exported && <a href={exported} download="inventory-data.txt" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
          </div>
          {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
          {aiSuggestion && (
            <div style={{ background: darkMode ? "#0d0d11" : "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635" : "#0d0d11" }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Suggestion:</div>
              <div>{aiSuggestion}</div>
            </div>
          )}
          {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
        </div>
        <div style={{ flex: 1, minWidth: 260, background: darkMode ? "#0d0d11" : "#f8fafc", borderRadius: 12, padding: 18, boxShadow: "0 1px 6px #0001" }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics & Collaboration</div>
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 600, marginBottom: 2 }}>Collaborators:</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {collaborators.map(c => <li key={c}>{c}</li>)}
            </ul>
            <button onClick={handleAddCollaborator} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "6px 16px", fontWeight: 600, fontSize: 14, marginTop: 6, cursor: "pointer" }}>Add Collaborator</button>
          </div>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>Sync Analytics:</div>
          <div style={{ fontSize: 15, color: darkMode ? "#a3e635" : "#0d0d11" }}>
            {analytics ? (
              <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
            ) : (
              <span>No analytics yet. Run sync to see results.</span>
            )}
          </div>
          <div style={{ marginTop: 18 }}>
            <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Show Onboarding</button>
          </div>
          <div style={{ marginTop: 18, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b" }}>
            <div>Integrations: <span style={{ fontWeight: 600 }}>Shopify</span>, <span style={{ fontWeight: 600 }}>Supplier APIs</span></div>
            <div>Accessibility: <span style={{ fontWeight: 600 }}>WCAG 2.1</span> | <span style={{ fontWeight: 600 }}>Keyboard Shortcuts</span></div>
            <div>Compliance: <span style={{ fontWeight: 600 }}>GDPR</span>, <span style={{ fontWeight: 600 }}>SOC2</span></div>
          </div>
        </div>
      </div>
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Contact Support</a></span>
      </div>
    </div>
  );
}


