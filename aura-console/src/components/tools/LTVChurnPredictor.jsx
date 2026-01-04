import React, { useState, useRef } from "react";
import { apiFetch } from "../../api";

export default function LTVChurnPredictor() {
  const [input, setInput] = useState("");
  const [ltv, setLtv] = useState([]);
  const [churn, setChurn] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch LTV
  const fetchLtv = async () => {
    try {
      const res = await apiFetch("/api/ltv-churn-predictor/ltv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setLtv(data.ltv || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch churn
  const fetchChurn = async () => {
    try {
      const res = await apiFetch("/api/ltv-churn-predictor/churn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setChurn(data.churn || []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Import/Export
  const handleImport = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      setInput(evt.target.result);
      setImported(file.name);
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify({ ltv, churn }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/ltv-churn-predictor/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>LTV/Churn Predictor</h2>
      <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
        <span role="img" aria-label="ltv">📈</span> Predict lifetime value and churn risk.
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
        placeholder="Paste customer data or notes here..."
        aria-label="Customer data input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={fetchLtv} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Predict LTV</button>
        <button onClick={fetchChurn} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Predict Churn</button>
      </div>
      <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>LTV</div>
          <ul style={{ paddingLeft: 18 }}>
            {ltv.map((l, idx) => (
              <li key={l.id || idx} style={{ marginBottom: 8, background: "#f1f5f9", borderRadius: 8, padding: 8 }}>{l.name}</li>
            ))}
          </ul>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Churn</div>
          <ul style={{ paddingLeft: 18 }}>
            {churn.map((c, idx) => (
              <li key={c.id || idx} style={{ marginBottom: 8, background: "#e0f2fe", borderRadius: 8, padding: 8 }}>{c.name}</li>
            ))}
          </ul>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import data" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="ltv-churn-predictor.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#f8fafc", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #ccc", marginBottom: 12, background: "#fff", color: "#23263a" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button type="submit" style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Send Feedback</button>
      </form>
    </div>
  );
}

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    setAnalytics(null);
    setNotification("");
    try {
      const res = await fetch("/api/ltv-churn-predictor/ai/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerData: input,
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
      setResponse(data.prediction || "No prediction generated");
      setAnalytics(data.analytics || null);
      setNotification("Prediction complete and saved.");
      setHistory(prev => [{
        customerData: input,
        bulkUpload,
        channels,
        aiModel,
        collaborators,
        accessLevel,
        privacy,
        compliance,
        education,
        prediction: data.prediction || "No prediction generated",
        analytics: data.analytics || null
      }, ...prev].slice(0, 10));
      setReportUrl(window.location.origin + window.location.pathname + "?prediction=" + encodeURIComponent(data.prediction || ""));
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
    a.download = "ltv-churn-prediction.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!reportUrl) return;
    navigator.clipboard.writeText(reportUrl);
    setNotification("Share link copied!");
    setTimeout(() => setNotification("Prediction complete and saved."), 2000);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    setNotification("Sending feedback...");
    try {
      await fetch("/api/ltv-churn-predictor/feedback", {
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
        maxWidth: 700,
        margin: "40px auto",
        background: darkMode ? "#23263a" : "#fff",
        color: darkMode ? "#f3f4f6" : "#23263a",
        borderRadius: 16,
        boxShadow: "0 2px 16px #0001",
        padding: 32,
        fontFamily: "Inter, Arial, sans-serif"
      }}
      aria-live="polite"
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>LTV/Churn Predictor</h2>
        <button
          aria-label="Toggle dark mode"
          onClick={() => setDarkMode(d => !d)}
          style={{ background: darkMode ? "#f3f4f6" : "#23263a", color: darkMode ? "#23263a" : "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
        >
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>
      <p style={{ color: darkMode ? "#e0e7ff" : "#444", marginBottom: 18 }}>
        Paste customer data below. The AI will predict lifetime value and churn risk. <span style={{ fontWeight: 600 }}>All features are fully accessible.</span>
      </p>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={5}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#f3f4f6" : "#23263a" }}
        placeholder="Paste customer data here..."
        aria-label="Customer data input"
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
          <option value="claude">Claude</option>
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
        <label><input type="checkbox" checked={compliance.gdpr} onChange={e => setCompliance(c => ({ ...c, gdpr: e.target.checked }))} /> GDPR</label>
        <label style={{ marginLeft: 12 }}><input type="checkbox" checked={compliance.ccpa} onChange={e => setCompliance(c => ({ ...c, ccpa: e.target.checked }))} /> CCPA</label>
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Education:</label>
        <input type="text" value={education} onChange={e => setEducation(e.target.value)} placeholder="LTV/Churn topic or question" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
      </div>
      <button
        onClick={handleRun}
        disabled={loading || !input}
        style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 2px 12px #22d3ee55", marginRight: 12 }}
        aria-label="Run prediction"
      >
        {loading ? "Predicting..." : "Run Tool"}
      </button>
      <button
        onClick={handleExport}
        disabled={!response}
        style={{ background: "#e0e7ff", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: response ? "pointer" : "not-allowed", marginRight: 12 }}
        aria-label="Export prediction"
      >
        Export
      </button>
      <button
        onClick={handleShare}
        disabled={!reportUrl}
        style={{ background: "#bae6fd", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: reportUrl ? "pointer" : "not-allowed", marginRight: 12 }}
        aria-label="Share prediction"
      >
        Share
      </button>
      <button
        onClick={() => setInput("")}
        style={{ background: "#fca5a5", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
        aria-label="Reset"
      >
        Reset
      </button>
      {notification && (
        <div style={{ color: "#0af", marginTop: 12, fontWeight: 600 }}>{notification}</div>
      )}
      {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
      {analytics && (
        <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Analytics</div>
          <div style={{ fontSize: 16 }}>{JSON.stringify(analytics)}</div>
        </div>
      )}
      {response && (
        <div style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Prediction:</div>
          <div style={{ fontSize: 16, color: darkMode ? "#e0e7ff" : "#23263a" }}>{response}</div>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Prediction History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Customer Data:</b> {h.customerData.slice(0, 60)}{h.customerData.length > 60 ? "..." : ""}</div>
                <div><b>Bulk Upload:</b> {h.bulkUpload ? h.bulkUpload.name : "-"}</div>
                <div><b>Channels:</b> {Object.keys(h.channels).filter(k => h.channels[k]).join(", ")}</div>
                <div><b>AI Model:</b> {h.aiModel}</div>
                <div><b>Collaborators:</b> {h.collaborators}</div>
                <div><b>Access Level:</b> {h.accessLevel}</div>
                <div><b>Privacy:</b> {h.privacy}</div>
                <div><b>Compliance:</b> {Object.keys(h.compliance).filter(k => h.compliance[k]).join(", ")}</div>
                <div><b>Education:</b> {h.education}</div>
                <div><b>Analytics:</b> {h.analytics ? JSON.stringify(h.analytics) : "-"}</div>
                <div><b>Prediction:</b> {h.prediction.slice(0, 60)}{h.prediction.length > 60 ? "..." : ""}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
      <form
        onSubmit={e => { e.preventDefault(); handleFeedback(); }}
        style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 20 }}
        aria-label="Send feedback"
      >
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
        <textarea
          value={feedback}
          onChange={e => setFeedback(e.target.value)}
          rows={2}
          style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 12, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#f3f4f6" : "#23263a" }}
          placeholder="Share your feedback or suggestions..."
          aria-label="Feedback input"
        />
        <button
          type="submit"
          style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
        >
          Send Feedback
        </button>
      </form>
    </div>
  );
}
