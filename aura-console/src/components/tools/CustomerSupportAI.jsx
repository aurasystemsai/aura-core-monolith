
import React, { useState, useRef } from "react";

export default function CustomerSupportAI() {
  const [input, setInput] = useState("");
  const [bulkUpload, setBulkUpload] = useState(null);
  const [channels, setChannels] = useState({ email: true, chat: false, social: false, phone: false });
  const [response, setResponse] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [collaborators, setCollaborators] = useState("");
  const [notification, setNotification] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const fileInputRef = useRef();

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    setAnalytics(null);
    setNotification("");
    try {
      let body, headers;
      if (bulkUpload) {
        body = new FormData();
        body.append("file", bulkUpload);
        if (input) body.append("prompt", input);
        Object.keys(channels).forEach(ch => body.append(`channel_${ch}`, channels[ch]));
        headers = {};
      } else {
        body = JSON.stringify({ prompt: input, channels });
        headers = { "Content-Type": "application/json" };
      }
      const res = await fetch("/api/customer-support-ai/ai/generate", {
        method: "POST",
        headers,
        body
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.reply || "No response");
      setAnalytics(data.analytics || null);
      setNotification("Response generated.");
      setHistory(prev => [{
        prompt: input,
        bulkUpload: bulkUpload ? bulkUpload.name : null,
        channels: { ...channels },
        reply: data.reply || "No response",
        analytics: data.analytics || null
      }, ...prev].slice(0, 10));
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
    a.download = "customer-support-response.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    setNotification("Sending feedback...");
    try {
      await fetch("/api/customer-support-ai/feedback", {
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

  const onboardingContent = (
    <div style={{ padding: 24, background: darkMode ? "#0a0a0a" : "#f1f5f9", borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Customer Support AI</h3>
      <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635" : "#333333", fontSize: 16 }}>
        <li>Enter a support question or upload a CSV/Excel file for bulk responses</li>
        <li>Select channels: email, chat, social, phone</li>
        <li>Get AI-powered suggestions, analytics, and sentiment</li>
        <li>Export results and review response history</li>
        <li>Collaborate and share with your team</li>
        <li>Integrate with CRM, Shopify, and support APIs</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer" }}>Get Started</button>
    </div>
  );

  return (
    <div style={{
      
      margin: "40px auto",
      background: darkMode ? "#18181b" : "#fff",
      borderRadius: 18,
      boxShadow: "0 2px 24px #0002",
      padding: 36,
      color: darkMode ? "#a3e635" : "#0a0a0a",
      fontFamily: 'Inter, sans-serif',
      transition: "background 0.3s, color 0.3s"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Customer Support AI</h2>
        <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "#0a0a0a", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>{darkMode ? "Light" : "Dark"} Mode</button>
      </div>
      <div style={{ marginBottom: 10, color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="support">🤖</span> AI-powered support for all channels, bulk upload, analytics, and collaboration.
      </div>
      <button onClick={() => setShowOnboarding(true)} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#0a0a0a" : "#fff", color: darkMode ? "#a3e635" : "#0a0a0a" }}
        placeholder="Type your support question or issue here..."
        aria-label="Support input"
      />
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Bulk Upload:</label>
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={e => setBulkUpload(e.target.files[0])} style={{ marginLeft: 8 }} aria-label="Bulk upload" />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Channels:</label>
        {Object.keys(channels).map((ch, i) => (
          <label key={ch} style={{ marginLeft: i === 0 ? 0 : 12 }}><input type="checkbox" checked={channels[ch]} onChange={e => setChannels(c => ({ ...c, [ch]: e.target.checked }))} /> {ch.charAt(0).toUpperCase() + ch.slice(1)}</label>
        ))}
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Collaborators:</label>
        <input type="text" value={collaborators} onChange={e => setCollaborators(e.target.value)} placeholder="Emails, comma separated" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={handleRun} disabled={loading || (!input && !bulkUpload)} style={{ background: "#7fffd4", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 12px #22d3ee55" }}>{loading ? "Running..." : "Run Tool"}</button>
        <button onClick={handleExport} disabled={!response} style={{ background: "#e0e7ff", color: "#0a0a0a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: response ? "pointer" : "not-allowed" }}>Export</button>
      </div>
      {notification && <div style={{ color: "#0af", marginTop: 12, fontWeight: 600 }}>{notification}</div>}
      {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
      {analytics && (
        <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
          <div style={{ background: "#1e2235", borderRadius: 10, padding: "12px 20px", border: "1px solid #1e1e1e" }}>
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Runs</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: "#7fffd4", marginTop: 2 }}>{history.length}</div>
          </div>
        </div>
      )}
      {response && (
        <div style={{ marginTop: 32, background: darkMode ? "#0a0a0a" : "#f8fafc", borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>AI Response:</div>
          <div style={{ fontSize: 16, color: darkMode ? "#a3e635" : "#0a0a0a" }}>{response}</div>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 32, background: darkMode ? "#0a0a0a" : "#f8fafc", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Response History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Prompt:</b> {h.prompt?.slice(0, 60)}{h.prompt?.length > 60 ? "..." : ""}</div>
                <div><b>Bulk Upload:</b> {h.bulkUpload || "-"}</div>
                <div><b>Channels:</b> {Object.keys(h.channels).filter(k => h.channels[k]).join(", ")}</div>
                <div><b>Reply:</b> {h.reply?.slice(0, 60)}{h.reply?.length > 60 ? "..." : ""}</div>
                <div><b>Analytics:</b> {h.analytics ? JSON.stringify(h.analytics) : "-"}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", textAlign: "center" }}>
        <span>Integrations: <b>CRM</b>, <b>Shopify</b>, <b>Support APIs</b> | Accessible, secure, and best-in-class SaaS features.</span>
      </div>
    </div>
  );
}


