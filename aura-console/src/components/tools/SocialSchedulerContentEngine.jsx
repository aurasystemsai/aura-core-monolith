import React, { useState } from "react";
// Import additional libraries for multi-channel, analytics, accessibility, integrations, etc. as needed
import React, { useState, useRef, useEffect } from "react";
import { apiFetch } from "../../api";

export default function SocialSchedulerContentEngine() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const fileInputRef = useRef();

  // Fetch history
  const fetchHistory = async () => {
    try {
      const res = await apiFetch("/api/social-scheduler-content-engine/history");
      const data = await res.json();
      if (data.ok) setHistory(data.history || []);
    } catch {}
  };
  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const res = await apiFetch("/api/social-scheduler-content-engine/analytics");
      const data = await res.json();
      if (data.ok) setAnalytics(data.analytics || []);
    } catch {}
  };

  // AI Generate
  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    try {
      const res = await apiFetch("/api/social-scheduler-content-engine/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.scheduledContent || "No content scheduled");
      // Save to history
      await apiFetch("/api/social-scheduler-content-engine/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input, scheduled: data.scheduledContent })
      });
      fetchHistory();
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
        const res = await apiFetch("/api/social-scheduler-content-engine/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: JSON.parse(evt.target.result) })
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error || "Unknown error");
        setImported(file.name);
        fetchHistory();
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
  };
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setError("");
    try {
      await apiFetch("/api/social-scheduler-content-engine/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchAnalytics();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", background: "#fff", borderRadius: 18, boxShadow: "0 2px 24px #0002", padding: 36, fontFamily: 'Inter, sans-serif' }}>
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 8 }}>Social Scheduler Content Engine</h2>
      <div style={{ marginBottom: 10, color: "#0ea5e9", fontWeight: 600 }}>
        <span role="img" aria-label="sparkles">✨</span> Schedule, manage, and analyze social content with AI and analytics.
      </div>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={4}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
        placeholder="Type your social content or prompt here..."
        aria-label="Social content input"
      />
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={handleRun} disabled={loading || !input} style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{loading ? "Scheduling..." : "AI Schedule"}</button>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import history" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="social-scheduler-history.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
      </div>
      {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
      {response && (
        <div style={{ background: "#f1f5f9", borderRadius: 10, padding: 16, marginBottom: 12, color: "#23263a" }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Scheduled Content:</div>
          <div>{response}</div>
        </div>
      )}
      {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
      <div style={{ marginTop: 24, background: "#f3f4f6", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>History</div>
        <ul style={{ paddingLeft: 18 }}>
          {history.map(h => (
            <li key={h.id} style={{ marginBottom: 10 }}>
              <div><b>ID:</b> {h.id}</div>
              <div><b>Content:</b> {h.content}</div>
              <div><b>Scheduled:</b> {h.scheduled}</div>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ marginTop: 24, background: "#f3f4f6", borderRadius: 12, padding: 18 }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
        <div style={{ fontSize: 15, color: "#23263a" }}>
          {analytics.length ? (
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", background: "none", padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
          ) : (
            <span>No analytics yet. Generate or import history to see results.</span>
          )}
        </div>
      </div>
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
    setTrendAnalysis(null);
    setNotification("");
    try {
      const res = await fetch("/api/social-scheduler-content-engine/ai/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: input,
          channels,
          schedule,
          aiModel,
          imageGen,
          videoGen,
          hashtags,
          caption,
          sentiment,
          bulkUpload,
          assetLibrary,
          collaborators,
          accessLevel,
          privacy,
          compliance,
          altText,
          influencer,
          adCampaign,
          crisisMonitor
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setResponse(data.schedule || "No schedule generated");
      setAnalytics(data.analytics || null);
      setTrendAnalysis(data.trendAnalysis || null);
      setNotification("Schedule generated and saved.");
      setHistory(prev => [{
        content: input,
        schedule: data.schedule || "No schedule generated",
        channels,
        aiModel,
        imageGen,
        videoGen,
        hashtags,
        caption,
        sentiment,
        bulkUpload,
        assetLibrary,
        collaborators,
        accessLevel,
        privacy,
        compliance,
        altText,
        influencer,
        adCampaign,
        crisisMonitor,
        analytics: data.analytics || null,
        trendAnalysis: data.trendAnalysis || null
      }, ...prev].slice(0, 10));
      setExportUrl(window.location.origin + window.location.pathname + "?schedule=" + encodeURIComponent(data.schedule || ""));
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
    a.download = "social-schedule.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!exportUrl) return;
    navigator.clipboard.writeText(exportUrl);
    setNotification("Share link copied!");
    setTimeout(() => setNotification("Schedule generated and saved."), 2000);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    setNotification("Sending feedback...");
    try {
      await fetch("/api/social-scheduler-content-engine/feedback", {
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
        <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Social Scheduler Content Engine</h2>
        <button
          aria-label="Toggle dark mode"
          onClick={() => setDarkMode(d => !d)}
          style={{ background: darkMode ? "#f3f4f6" : "#23263a", color: darkMode ? "#23263a" : "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
        >
          {darkMode ? "Light" : "Dark"}
        </button>
      </div>
      <p style={{ color: darkMode ? "#e0e7ff" : "#444", marginBottom: 18 }}>
        Paste social content or campaign details below. The AI will generate a posting schedule and optimize for all channels. <span style={{ fontWeight: 600 }}>All features are fully accessible.</span>
      </p>
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        rows={5}
        style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#f3f4f6" : "#23263a" }}
        placeholder="Paste your content or campaign details here..."
        aria-label="Social content input"
      />
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Channels:</label>
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
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Image Gen:</label>
        <input type="checkbox" checked={imageGen} onChange={e => setImageGen(e.target.checked)} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Video Gen:</label>
        <input type="checkbox" checked={videoGen} onChange={e => setVideoGen(e.target.checked)} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Hashtags:</label>
        <input type="text" value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#social, #ai" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Caption:</label>
        <input type="text" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Your caption..." style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginLeft: 8 }} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Sentiment:</label>
        <input type="text" value={sentiment} onChange={e => setSentiment(e.target.value)} placeholder="Positive, Neutral, Negative" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginLeft: 8 }} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Bulk Upload:</label>
        <input type="file" accept=".csv,.xlsx" onChange={e => setBulkUpload(e.target.files[0])} style={{ marginLeft: 8 }} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Asset Library:</label>
        <input type="file" accept="image/*,video/*" multiple onChange={e => setAssetLibrary(Array.from(e.target.files))} style={{ marginLeft: 8 }} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={{ fontWeight: 600, marginRight: 12 }}>Collaborators:</label>
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
        <label style={{ fontWeight: 600, marginRight: 12 }}>Alt Text:</label>
        <input type="text" value={altText} onChange={e => setAltText(e.target.value)} placeholder="Describe images for accessibility" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Influencer:</label>
        <input type="text" value={influencer} onChange={e => setInfluencer(e.target.value)} placeholder="Influencer name or handle" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginLeft: 8 }} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Ad Campaign:</label>
        <input type="text" value={adCampaign} onChange={e => setAdCampaign(e.target.value)} placeholder="Ad campaign name" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginLeft: 8 }} />
        <label style={{ fontWeight: 600, marginLeft: 18 }}>Crisis Monitor:</label>
        <input type="checkbox" checked={crisisMonitor} onChange={e => setCrisisMonitor(e.target.checked)} />
      </div>
      <button
        onClick={handleRun}
        disabled={loading || !input}
        style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 2px 12px #22d3ee55", marginRight: 12 }}
        aria-label="Run scheduling"
      >
        {loading ? "Scheduling..." : "Run Tool"}
      </button>
      <button
        onClick={handleExport}
        disabled={!response}
        style={{ background: "#e0e7ff", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: response ? "pointer" : "not-allowed", marginRight: 12 }}
        aria-label="Export schedule"
      >
        Export
      </button>
      <button
        onClick={handleShare}
        disabled={!exportUrl}
        style={{ background: "#bae6fd", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: exportUrl ? "pointer" : "not-allowed", marginRight: 12 }}
        aria-label="Share schedule"
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
      {trendAnalysis && (
        <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#e0e7ff", borderRadius: 12, padding: 18 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Trend Analysis</div>
          <div style={{ fontSize: 16 }}>{JSON.stringify(trendAnalysis)}</div>
        </div>
      )}
      {response && (
        <div style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 24 }}>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Posting Schedule:</div>
          <div style={{ fontSize: 16, color: darkMode ? "#e0e7ff" : "#23263a" }}>{response}</div>
        </div>
      )}
      {history.length > 0 && (
        <div style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Schedule History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Content:</b> {h.content.slice(0, 60)}{h.content.length > 60 ? "..." : ""}</div>
                <div><b>Channels:</b> {Object.keys(h.channels).filter(k => h.channels[k]).join(", ")}</div>
                <div><b>AI Model:</b> {h.aiModel}</div>
                <div><b>Image Gen:</b> {h.imageGen ? "Yes" : "No"}</div>
                <div><b>Video Gen:</b> {h.videoGen ? "Yes" : "No"}</div>
                <div><b>Hashtags:</b> {h.hashtags}</div>
                <div><b>Caption:</b> {h.caption}</div>
                <div><b>Sentiment:</b> {h.sentiment}</div>
                <div><b>Bulk Upload:</b> {h.bulkUpload ? h.bulkUpload.name : "-"}</div>
                <div><b>Asset Library:</b> {h.assetLibrary && h.assetLibrary.length > 0 ? h.assetLibrary.map(a => a.name).join(", ") : "-"}</div>
                <div><b>Collaborators:</b> {h.collaborators}</div>
                <div><b>Access Level:</b> {h.accessLevel}</div>
                <div><b>Privacy:</b> {h.privacy}</div>
                <div><b>Compliance:</b> {Object.keys(h.compliance).filter(k => h.compliance[k]).join(", ")}</div>
                <div><b>Alt Text:</b> {h.altText}</div>
                <div><b>Influencer:</b> {h.influencer}</div>
                <div><b>Ad Campaign:</b> {h.adCampaign}</div>
                <div><b>Crisis Monitor:</b> {h.crisisMonitor ? "Enabled" : "Disabled"}</div>
                <div><b>Analytics:</b> {h.analytics ? JSON.stringify(h.analytics) : "-"}</div>
                <div><b>Trend Analysis:</b> {h.trendAnalysis ? JSON.stringify(h.trendAnalysis) : "-"}</div>
                <div><b>Schedule:</b> {h.schedule.slice(0, 60)}{h.schedule.length > 60 ? "..." : ""}</div>
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
