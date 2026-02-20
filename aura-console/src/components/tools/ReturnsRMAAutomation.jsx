﻿import React, { useState } from "react";
export default function ReturnsRMAAutomation() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bulkUpload, setBulkUpload] = useState(null);
  const [channels, setChannels] = useState({ web: true, mobile: false, email: false, sms: false, api: false });
  const [aiModel, setAiModel] = useState("gpt-4");
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [collaborators, setCollaborators] = useState("");
  const [accessLevel, setAccessLevel] = useState("writer");
  const [privacy, setPrivacy] = useState("private");
  const [compliance, setCompliance] = useState({ gdpr: true, ccpa: false });
  const [notification, setNotification] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [education, setEducation] = useState("");

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    setAnalytics(null);
    setNotification("");
    try {
      const res = await fetch("/api/returns-rma-automation/ai/automate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: input,
          bulkUpload,
          channels,
          aiModel,
          collaborators,
          accessLevel,
          privacy,
          compliance,
          education
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.automation || "No automation generated");
      setAnalytics(data.analytics || null);
      setNotification("Automation complete and saved.");
      setHistory(prev => [{
        request: input,
        bulkUpload,
        channels,
        aiModel,
        collaborators,
        accessLevel,
        privacy,
        compliance,
        education,
        automation: data.automation || "No automation generated",
        analytics: data.analytics || null
      }, ...prev].slice(0, 10));
      setReportUrl(window.location.origin + window.location.pathname + "?automation=" + encodeURIComponent(data.automation || ""));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!response) return;
    const blob = new Blob([response], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "returns-rma-automation.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!reportUrl) return;
    navigator.clipboard.writeText(reportUrl);
    setNotification("Share link copied!");
    setTimeout(() => setNotification("Automation complete and saved."), 2000);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    setNotification("Sending feedback...");
    try {
      await fetch("/api/returns-rma-automation/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setNotification("Feedback sent. Thank you!");
      setFeedback("");
    } catch {
      setNotification("Failed to send feedback");
    }
  };

  return (
    <div
      style={{
        
        margin: "40px auto",
        background: darkMode ? "#0d0d11" : "#fff",
        color: darkMode ? "#f3f4f6" : "#0d0d11",
        borderRadius: 16,
        boxShadow: "0 2px 16px #0001",
        padding: 32,
        fontFamily: "Inter, Arial, sans-serif"
      }}
      aria-live="polite"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Returns/RMA Automation</h2>
        <button
          aria-label="Toggle dark mode"
          onClick={() => setDarkMode(d => !d)}
          style={{ background: darkMode ? "#f3f4f6" : "#0d0d11", color: darkMode ? "#0d0d11" : "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
        >
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>
      <p style={{ color: darkMode ? "#e0e7ff" : "#444", marginBottom: 18 }}>
        Enter a return or RMA request below. The AI will automate the process and provide a report. <span style={{ fontWeight: 600 }}>All features are fully accessible.</span>
      </p>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={5}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#0d0d11" : "#fff", color: darkMode ? "#f3f4f6" : "#0d0d11" }}
        placeholder="Type your return or RMA request here..."
        aria-label="Return or RMA input"
      />
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Bulk Upload:</label>
        <input type="file" accept=".csv,.xlsx" onChange={e => setBulkUpload(e.target.files[0])} style={{ marginLeft: 8 }} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Channels:</label>
        {Object.keys(channels).map((ch, i) => (
          <label key={ch} style={{ marginLeft: i === 0 ? 0 : 12 }}><input type="checkbox" checked={channels[ch]} onChange={e => setChannels(c => ({ ...c, [ch]: e.target.checked }))} /> {ch.charAt(0).toUpperCase() + ch.slice(1)}</label>
        ))}
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>AI Model:</label>
        <select value={aiModel} onChange={e => setAiModel(e.target.value)} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }}>
          <option value="gpt-4">GPT-4</option>
          <option value="gemini">Gemini</option>
          <option value="custom">Custom</option>
        </select>
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Collaborators:</label>
        <input type="text" value={collaborators} onChange={e => setCollaborators(e.target.value)} placeholder="Emails, comma separated" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Access Level:</label>
        <select value={accessLevel} onChange={e => setAccessLevel(e.target.value)} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginLeft: 8 }}>
          <option value="writer">Writer</option>
          <option value="editor">Editor</option>
          <option value="reviewer">Reviewer</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Privacy:</label>
        <select value={privacy} onChange={e => setPrivacy(e.target.value)} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }}>
          <option value="private">Private</option>
          <option value="public">Public</option>
        </select>
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Compliance:</label>
        <label><input type="checkbox" checked={compliance.gdpr} onChange={e => setCompliance(c => ({ ...c, gdpr: e.target.checked }))} />GDPR</label>
        <label style={{ marginLeft: 12 }}><input type="checkbox" checked={compliance.ccpa} onChange={e => setCompliance(c => ({ ...c, ccpa: e.target.checked }))} />CCPA</label>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Education:</label>
        <input type="text" value={education} onChange={e => setEducation(e.target.value)} placeholder="Returns/RMA topic or question" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
      </div>
      <button
        onClick={handleRun}
        disabled={loading || !input}
        style={{ background: "#6366f1", color: "#0d0d11", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 2px 12px #22d3ee55", marginRight: 12 }}
        aria-label="Run automation"
      >
        {loading ? "Automating..." : "Run Tool"}
      </button>
      <button
        onClick={handleExport}
        disabled={!response}
        style={{ background: "#e0e7ff", color: "#0d0d11", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: response ? "pointer" : "not-allowed", marginRight: 12 }}
        aria-label="Export automation"
      >
        Export
      </button>
      <button
        onClick={handleShare}
        disabled={!reportUrl}
        style={{ background: "#bae6fd", color: "#0d0d11", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: reportUrl ? "pointer" : "not-allowed", marginRight: 12 }}
        aria-label="Share automation"
      >
        Share
      </button>
      <button
        onClick={() => setInput("")}
        style={{ background: "#fca5a5", color: "#0d0d11", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
        aria-label="Reset"
      >
        Reset
      </button>
      {notification && (
        <div style={{ color: "#0af", marginTop: 12, fontWeight: 600 }}>{notification}</div>
      )}
      {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
      {analytics && (
        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          <div style={{ background: "#222535", borderRadius: 10, padding: "12px 20px", border: "1px solid #222535" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Automations</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#6366f1", marginTop: 2 }}>{history.length}</div>
          </div>
        </div>
      )}
      {response && (
        <div style={{ marginTop: 32, background: darkMode ? "#0d0d11" : "#f8fafc", borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Automation Report:</div>
          <div style={{ fontSize: 16, color: darkMode ? "#e0e7ff" : "#0d0d11" }}>{response}</div>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 32, background: darkMode ? "#0d0d11" : "#f8fafc", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Automation History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Request:</b> {h.request.slice(0, 60)}{h.request.length > 60 ? "..." : ""}</div>
                <div><b>Bulk Upload:</b> {h.bulkUpload ? h.bulkUpload.name : "-"}</div>
                <div><b>Channels:</b> {Object.keys(h.channels).filter(k => h.channels[k]).join(", ")}</div>
                <div><b>AI Model:</b> {h.aiModel}</div>
                <div><b>Collaborators:</b> {h.collaborators}</div>
                <div><b>Access Level:</b> {h.accessLevel}</div>
                <div><b>Privacy:</b> {h.privacy}</div>
                <div><b>Compliance:</b> {Object.keys(h.compliance).filter(k => h.compliance[k]).join(", ")}</div>
                <div><b>Education:</b> {h.education}</div>
                <div><b>Analytics:</b> {h.analytics ? JSON.stringify(h.analytics) : "-"}</div>
                <div><b>Automation:</b> {h.automation.slice(0, 60)}{h.automation.length > 60 ? "..." : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}


