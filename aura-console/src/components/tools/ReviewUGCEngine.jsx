import React, { useState } from "react";
// Import additional libraries for media, notifications, QR, etc. as needed
export default function ReviewUGCEngine() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState(null);
  const [media, setMedia] = useState([]); // For photo/video UGC
  const [status, setStatus] = useState("");
  const [summary, setSummary] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [qrInvite, setQrInvite] = useState("");
  const [invitationStatus, setInvitationStatus] = useState("");
  const [rewardStatus, setRewardStatus] = useState("");
  const [qa, setQA] = useState([]);
  const [reply, setReply] = useState("");
  const [notification, setNotification] = useState("");
  const [trustBadge, setTrustBadge] = useState(false);
  const [bulkUpload, setBulkUpload] = useState(null);
  const [channels, setChannels] = useState({ web: true, mobile: false, app: false });
  const [aiModel, setAiModel] = useState("gpt-4");
  const [collaborators, setCollaborators] = useState("");
  const [accessLevel, setAccessLevel] = useState("writer");
  const [privacy, setPrivacy] = useState("private");
  const [compliance, setCompliance] = useState({ gdpr: true, ccpa: false });
  const [reportUrl, setReportUrl] = useState("");
  const [education, setEducation] = useState("");

  const handleRun = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    setSummary(null);
    setAnalytics(null);
    setSuggestions([]);
    setStatus("Analyzing...");
    let reviewText = input;
    if (file) {
      try {
        const text = await file.text();
        reviewText = text;
      } catch (err) {
        setError("Failed to read file");
        setLoading(false);
        setStatus("");
        return;
      }
    }
    // Handle media uploads (images/videos)
    // ...existing code...
    try {
      const res = await fetch("/api/review-ugc-engine/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review: reviewText,
          media,
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
      setResponse(data.analysis || "No analysis generated");
      setSummary(data.summary || null);
      setAnalytics(data.analytics || null);
      setSuggestions(data.suggestions || []);
      setStatus("Analysis complete");
      setHistory(prev => [{
        input: reviewText,
        analysis: data.analysis || "No analysis generated",
        summary: data.summary || null,
        analytics: data.analytics || null,
        suggestions: data.suggestions || [],
        media: media,
        bulkUpload,
        channels,
        aiModel,
        collaborators,
        accessLevel,
        privacy,
        compliance,
        education
      }, ...prev].slice(0, 10));
      setShareUrl(window.location.origin + window.location.pathname + "?ugc=" + encodeURIComponent(reviewText));
      setNotification("Analysis complete and saved.");
      setTrustBadge(data.verified || false);
    } catch (err) {
      setError(err.message);
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  // Multi-channel review invitation (email/SMS/QR)
  const handleInvite = async (type, target) => {
    setInvitationStatus("Sending invitation...");
    try {
      await fetch("/api/review-ugc-engine/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, target })
      });
      setInvitationStatus("Invitation sent!");
    } catch {
      setInvitationStatus("Failed to send invitation.");
    }
  };

  // QR code generation for review invite
  const handleGenerateQR = () => {
    setQrInvite(window.location.origin + window.location.pathname + "?invite=review");
  };

  // Loyalty/reward logic
  const handleReward = async () => {
    setRewardStatus("Processing reward...");
    try {
      await fetch("/api/review-ugc-engine/reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review: input })
      });
      setRewardStatus("Reward granted!");
    } catch {
      setRewardStatus("Failed to grant reward.");
    }
  };

  // Q&A logic
  const handleAsk = async (question) => {
    try {
      const res = await fetch("/api/review-ugc-engine/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setQA(prev => [{ question, answer: data.answer }, ...prev]);
    } catch {}
  };

  // AI-powered reply logic
  const handleReply = async () => {
    try {
      const res = await fetch("/api/review-ugc-engine/ai/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review: input })
      });
      const data = await res.json();
      setReply(data.reply || "");
    } catch {}
  };

  // Notification logic
  const handleNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleReset = () => {
    setInput("");
    setResponse("");
    setFile(null);
    setStatus("");
    setError("");
    setSummary(null);
    setAnalytics(null);
    setSuggestions([]);
    setShareUrl("");
  };

  const handleExport = () => {
    if (!response) return;
    const blob = new Blob([response], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ugc-analysis.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setStatus("Share link copied!");
    setTimeout(() => setStatus("Analysis complete"), 2000);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    setStatus("Sending feedback...");
    try {
      await fetch("/api/review-ugc-engine/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setStatus("Feedback sent. Thank you!");
      setFeedback("");
    } catch {
      setStatus("Failed to send feedback");
    }
  };
  return (
    <div>
      <div
        style={{
          maxWidth: 600,
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
          <h2 style={{ fontWeight: 700, fontSize: 28, marginBottom: 12 }}>Review UGC Engine</h2>
          {trustBadge && (
            <span style={{ background: "#22c55e", color: "#fff", borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 15, marginRight: 12 }}>Verified Buyer</span>
          )}
          <button
            aria-label="Toggle dark mode"
            onClick={() => setDarkMode(d => !d)}
            style={{ background: darkMode ? "#f3f4f6" : "#23263a", color: darkMode ? "#23263a" : "#f3f4f6", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          >
            {darkMode ? "Light" : "Dark"}
          </button>
        </div>
        <p style={{ color: darkMode ? "#e0e7ff" : "#444", marginBottom: 18 }}>
          Paste a review or UGC below. The AI will analyze and provide insights. <span style={{ fontWeight: 600 }}>All features are fully accessible.</span>
        </p>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          rows={5}
          style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 18, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#f3f4f6" : "#23263a" }}
          placeholder="Paste your review or UGC here..."
          aria-label="Review or UGC input"
        />
        <div style={{ marginBottom: 18 }}>
          <input
            type="file"
            accept=".txt,.md,.csv"
            onChange={e => setFile(e.target.files[0])}
            style={{ marginTop: 8 }}
            aria-label="Upload UGC file"
          />
          <input
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={e => setMedia(Array.from(e.target.files))}
            style={{ marginLeft: 12, marginTop: 8 }}
            aria-label="Upload media UGC"
          />
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={e => setBulkUpload(e.target.files[0])}
            style={{ marginLeft: 12, marginTop: 8 }}
            aria-label="Bulk upload UGC"
          />
          <span style={{ marginLeft: 12, color: darkMode ? "#e0e7ff" : "#888" }}>
            (Optional: upload UGC file, media, or bulk CSV/XLSX)
          </span>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600, marginRight: 12 }}>Channels:</label>
          {Object.keys(channels).map((ch, i) => (
            <label key={ch} style={{ marginLeft: i === 0 ? 0 : 12 }}><input type="checkbox" checked={channels[ch]} onChange={e => setChannels(c => ({ ...c, [ch]: e.target.checked }))} /> {ch.charAt(0).toUpperCase() + ch.slice(1)}</label>
          ))}
          <label style={{ fontWeight: 600, marginLeft: 18 }}>AI Model:</label>
          <select value={aiModel} onChange={e => setAiModel(e.target.value)} style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginLeft: 8 }}>
            <option value="gpt-4">GPT-4</option>
            <option value="claude">Claude</option>
            <option value="gemini">Gemini</option>
            <option value="custom">Custom</option>
          </select>
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
          <label style={{ fontWeight: 600, marginRight: 12 }}>Education:</label>
          <input type="text" value={education} onChange={e => setEducation(e.target.value)} placeholder="UGC topic or question" style={{ fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc" }} />
        </div>
        {media.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Media Preview:</div>
            <div style={{ display: "flex", gap: 12 }}>
              {media.map((m, i) => m.type.startsWith("image") ? (
                <img key={i} src={URL.createObjectURL(m)} alt="UGC Media" style={{ maxWidth: 80, maxHeight: 80, borderRadius: 8 }} />
              ) : (
                <video key={i} src={URL.createObjectURL(m)} controls style={{ maxWidth: 120, maxHeight: 80, borderRadius: 8 }} />
              ))}
            </div>
          </div>
        )}
        <button
          onClick={handleRun}
          disabled={loading || (!input && !file && media.length === 0)}
          style={{ background: "#7fffd4", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 32px", fontWeight: 700, fontSize: 17, cursor: "pointer", boxShadow: "0 2px 12px #22d3ee55", marginRight: 12 }}
          aria-label="Run analysis"
        >
          {loading ? "Analyzing..." : "Run Tool"}
        </button>
        <button
          onClick={handleReply}
          style={{ background: "#e0e7ff", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginRight: 12 }}
          aria-label="AI Reply"
        >
          AI Reply
        </button>
        <button
          onClick={handleReward}
          style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginRight: 12 }}
          aria-label="Reward"
        >
          Reward
        </button>
        <button
          onClick={handleGenerateQR}
          style={{ background: "#bae6fd", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginRight: 12 }}
          aria-label="Generate QR"
        >
          QR Invite
        </button>
        <button
          onClick={handleExport}
          disabled={!response}
          style={{ background: "#e0e7ff", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: response ? "pointer" : "not-allowed", marginRight: 12 }}
          aria-label="Export analysis"
        >
          Export Analysis
        </button>
        <button
          onClick={handleShare}
          disabled={!shareUrl}
          style={{ background: "#bae6fd", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: shareUrl ? "pointer" : "not-allowed", marginRight: 12 }}
          aria-label="Share analysis"
        >
          Share
        </button>
        <button
          onClick={handleReset}
          style={{ background: "#fca5a5", color: "#23263a", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          aria-label="Reset analysis"
        >
          Reset
        </button>
        {status && (
          <div style={{ color: loading ? "#0af" : status === "Error" ? "#c00" : "#22c55e", marginTop: 18, fontWeight: 600 }}>
            {status}
          </div>
        )}
        {notification && (
          <div style={{ color: "#0af", marginTop: 12, fontWeight: 600 }}>{notification}</div>
        )}
        {invitationStatus && (
          <div style={{ color: "#22c55e", marginTop: 12, fontWeight: 600 }}>{invitationStatus}</div>
        )}
        {rewardStatus && (
          <div style={{ color: "#fbbf24", marginTop: 12, fontWeight: 600 }}>{rewardStatus}</div>
        )}
        {qrInvite && (
          <div style={{ marginTop: 12 }}>
            <b>QR Invite:</b> <a href={qrInvite} target="_blank" rel="noopener noreferrer">{qrInvite}</a>
          </div>
        )}
        {error && <div style={{ color: "#c00", marginTop: 18 }}>{error}</div>}
        {summary && (
          <div style={{ marginTop: 32, background: darkMode ? "#334155" : "#f1f5f9", borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>Summary</div>
            {summary.sentiment && (
              <div style={{ marginBottom: 6 }}><b>Sentiment:</b> {summary.sentiment}</div>
            )}
            {summary.keyTopics && (
              <div style={{ marginBottom: 6 }}><b>Key Topics:</b> {summary.keyTopics.join(", ")}</div>
            )}
          </div>
        )}
        {analytics && (
          <div style={{ marginTop: 24, background: darkMode ? "#334155" : "#f3f4f6", borderRadius: 12, padding: 18 }}>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Analytics</div>
            {analytics.wordCount !== undefined && (
              <div style={{ marginBottom: 6 }}><b>Word Count:</b> {analytics.wordCount}</div>
            )}
            {analytics.readingLevel && (
              <div style={{ marginBottom: 6 }}><b>Reading Level:</b> {analytics.readingLevel}</div>
            )}
            {analytics.length && (
              <div style={{ marginBottom: 6 }}><b>Review Length:</b> {analytics.length}</div>
            )}
          </div>
        )}
        {suggestions.length > 0 && (
          <div style={{ marginTop: 32, background: darkMode ? "#334155" : "#e0e7ff", borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>AI Suggestions</div>
            <ul style={{ paddingLeft: 18 }}>
              {suggestions.map((s, i) => (
                <li key={i} style={{ marginBottom: 6 }}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        {reply && (
          <div style={{ marginTop: 32, background: darkMode ? "#e0e7ff" : "#bae6fd", borderRadius: 12, padding: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 17, marginBottom: 8 }}>AI Reply</div>
            <div style={{ fontSize: 16 }}>{reply}</div>
          </div>
        )}
        {response && (
          <div style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Analysis:</div>
            <div style={{ fontSize: 16, color: darkMode ? "#e0e7ff" : "#23263a" }}>{response}</div>
          </div>
        )}
      </div>
      {history.length > 0 && (
        <div style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Analysis History</div>
          <ul style={{ paddingLeft: 18 }}>
            {history.map((h, i) => (
              <li key={i} style={{ marginBottom: 10 }}>
                <div><b>Input:</b> {h.input.slice(0, 60)}{h.input.length > 60 ? "..." : ""}</div>
                <div><b>Sentiment:</b> {h.summary?.sentiment || "-"}</div>
                <div><b>Word Count:</b> {h.analytics?.wordCount ?? "-"}</div>
                <div><b>Analysis:</b> {h.analysis.slice(0, 60)}{h.analysis.length > 60 ? "..." : ""}</div>
                {h.media && h.media.length > 0 && (
                  <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                    {h.media.map((m, j) => m.type.startsWith("image") ? (
                      <img key={j} src={URL.createObjectURL(m)} alt="UGC Media" style={{ maxWidth: 40, maxHeight: 40, borderRadius: 6 }} />
                    ) : (
                      <video key={j} src={URL.createObjectURL(m)} controls style={{ maxWidth: 60, maxHeight: 40, borderRadius: 6 }} />
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: 32, background: darkMode ? "#23263a" : "#f8fafc", borderRadius: 12, padding: 20 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Q&A</div>
        <form onSubmit={e => { e.preventDefault(); handleAsk(e.target.elements.question.value); e.target.reset(); }}>
          <input name="question" type="text" placeholder="Ask a question about this review..." style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: darkMode ? "1px solid #555" : "1px solid #ccc", marginBottom: 12, background: darkMode ? "#23263a" : "#fff", color: darkMode ? "#f3f4f6" : "#23263a" }} />
          <button type="submit" style={{ background: "#bae6fd", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>Ask</button>
        </form>
        <ul style={{ paddingLeft: 18, marginTop: 10 }}>
          {qa.map((q, i) => (
            <li key={i} style={{ marginBottom: 8 }}>
              <div><b>Q:</b> {q.question}</div>
              <div><b>A:</b> {q.answer}</div>
            </li>
          ))}
        </ul>
      </div>
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
