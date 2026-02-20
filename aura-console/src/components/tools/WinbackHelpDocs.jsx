
import React, { useState, useRef } from "react";

const helpTopics = [
  { title: "Campaign Builder", content: "Step-by-step wizard to create, configure, and launch winback campaigns. Supports multi-channel (email, SMS, push), A/B testing, and scheduling." },
  { title: "Template Editor", content: "Rich editor for email/SMS templates with OpenAI-powered suggestions, dynamic variables, and real-time preview." },
  { title: "A/B Testing", content: "Create and manage message variants, track performance, and auto-optimize for best results." },
  { title: "Segmentation", content: "Target specific customer groups (VIPs, new, high-value, etc.) for personalized winback flows." },
  { title: "Scheduling & Automation", content: "Set up triggers, delays, and throttling for campaign sends. Supports recurring and one-time schedules." },
  { title: "Analytics Dashboard", content: "Visualize open, click, recovery rates, revenue impact, and A/B test results with charts and tables." },
  { title: "Activity Log", content: "View a detailed log of all campaign actions, sends, edits, and results for compliance and troubleshooting." },
  { title: "Notification Center", content: "Get real-time alerts for campaign status, errors, and results." },
  { title: "Shopify Integration", content: "Connects to your store to fetch real abandoned checkout data and personalize messages." },
  { title: "Compliance", content: "GDPR/CCPA tools for data export, deletion, and audit logging. CAN-SPAM and deliverability best practices built-in." },
  { title: "Security", content: "API keys, OAuth, CSRF, XSS, and rate limiting for safe operation." },
  { title: "AI Personalization", content: "Use OpenAI to generate dynamic, high-converting winback messages in any language and tone." },
  { title: "Extensibility", content: "Modular design for easy extension to new channels, triggers, and integrations." },
];

const onboardingChecklist = [
  "Connect your Shopify store",
  "Import abandoned checkouts",
  "Create your first winback campaign",
  "Customize templates with AI",
  "Set up A/B tests",
  "Schedule and launch",
  "Monitor analytics and optimize",
];

export default function WinbackHelpDocs() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklist, setChecklist] = useState(Array(onboardingChecklist.length).fill(false));
  const [darkMode, setDarkMode] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const inputRef = useRef();

  // Accessibility: focus input on open
  React.useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 200); }, [open]);

  // Filtered topics
  const filteredTopics = helpTopics.filter(t => t.title.toLowerCase().includes(search.toLowerCase()) || t.content.toLowerCase().includes(search.toLowerCase()));

  // AI Help
  const handleAIHelp = async () => {
    setLoading(true);
    setAiResponse("");
    try {
      const res = await fetch("/api/abandoned-checkout-winback/ai/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: aiInput })
      });
      const data = await res.json();
      setAiResponse(data.answer || "No answer found.");
    } catch {
      setAiResponse("Sorry, something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Feedback
  const handleFeedback = async () => {
    if (!feedback) return;
    setLoading(true);
    try {
      await fetch("/api/abandoned-checkout-winback/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
      alert("Thank you for your feedback!");
    } catch {
      alert("Failed to send feedback.");
    } finally {
      setLoading(false);
    }
  };

  // Toggle checklist item
  const toggleChecklist = idx => setChecklist(c => c.map((v, i) => i === idx ? !v : v));

  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          // removed card constraints for full-width
          color: darkMode ? "#a3e635" : "#4f46e5",
          border: "none",
          fontWeight: 700,
          fontSize: 18,
          cursor: "pointer",
        }}
        aria-label="Help & Documentation"
      >
        {open ? "Close Help" : "? Help & Docs"}
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 0,
            width: 440,
            maxHeight: 650,
            overflowY: "auto",
            // removed card constraints for full-width
            color: darkMode ? "#a3e635" : "#0a0b0f",
            zIndex: 10000,
            fontFamily: 'Inter, sans-serif',
            transition: "background 0.3s, color 0.3s"
          }}
          aria-modal="true"
          role="dialog"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h2 style={{ color: darkMode ? "#a3e635" : "#0a0b0f", fontWeight: 900, fontSize: 22, margin: 0 }}>Abandoned Checkout Winback: Help & Docs</h2>
            <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode" style={{ background: "none", color: darkMode ? "#a3e635" : "#0a0b0f", border: "none", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>{darkMode ? "️" : ""}</button>
          </div>
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search help topics..."
            style={{ width: "100%", fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #333" : "1px solid #ccc", marginBottom: 14, background: darkMode ? "#0a0b0f" : "#fff", color: darkMode ? "#a3e635" : "#0a0b0f" }}
            aria-label="Search help topics"
          />
          <div style={{ marginBottom: 18 }}>
            <button onClick={() => setShowChecklist(c => !c)} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginRight: 8 }}>{showChecklist ? "Hide" : "Show"} Onboarding Checklist</button>
            <a href="https://docs.aurasystems.ai/winback" target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600, marginRight: 8 }}>Full Docs</a>
            <a href="https://www.youtube.com/@aurasystems" target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600, marginRight: 8 }}>Video Tutorials</a>
            <a href="mailto:support@aura-core.ai" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", fontWeight: 600 }}>Contact Support</a>
          </div>
          {showChecklist && (
            <div>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Onboarding Checklist</div>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {onboardingChecklist.map((item, idx) => (
                  <li key={item} style={{ marginBottom: 6 }}>
                    <label style={{ cursor: "pointer" }}>
                      <input type="checkbox" checked={checklist[idx]} onChange={() => toggleChecklist(idx)} style={{ marginRight: 8 }} />
                      {item}
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Help Topics</div>
          <ul style={{ fontSize: 16, lineHeight: 1.7, margin: "12px 0 0 0", padding: 0, listStyle: "none" }}>
            {filteredTopics.length === 0 && <li style={{ color: darkMode ? "#a3e635" : "#888" }}>No topics found.</li>}
            {filteredTopics.map(t => (
              <li key={t.title} style={{ marginBottom: 10 }}>
                <b>{t.title}:</b> {t.content}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: 18, marginBottom: 8, fontWeight: 700, fontSize: 17 }}>AI Help</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              placeholder="Ask a question..."
              style={{ flex: 1, fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #333" : "1px solid #ccc", background: darkMode ? "#0a0b0f" : "#fff", color: darkMode ? "#a3e635" : "#0a0b0f" }}
              aria-label="Ask a question"
            />
            <button onClick={handleAIHelp} disabled={loading || !aiInput} style={{ background: "#a3e635", color: "#0a0b0f", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>{loading ? "Thinking..." : "Ask"}</button>
          </div>
          {aiResponse && <div style={{ color: darkMode ? "#a3e635" : "#0a0b0f" }}>{aiResponse}</div>}
          <div style={{ marginTop: 18, fontWeight: 700, fontSize: 17 }}>Feedback</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              placeholder="Share feedback or suggestions..."
              style={{ flex: 1, fontSize: 15, padding: 8, borderRadius: 8, border: darkMode ? "1px solid #333" : "1px solid #ccc", background: darkMode ? "#0a0b0f" : "#fff", color: darkMode ? "#a3e635" : "#0a0b0f" }}
              aria-label="Feedback input"
            />
            <button onClick={handleFeedback} disabled={loading || !feedback} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>Send</button>
          </div>
          <div style={{ fontSize: 13, color: darkMode ? "#a3e635" : "#64748b", marginTop: 18, textAlign: "center" }}>
            <span>Best-in-class SaaS help. <a href="https://docs.aurasystems.ai/winback" target="_blank" rel="noopener noreferrer" style={{ color: darkMode ? "#a3e635" : "#0ea5e9", textDecoration: "underline" }}>Full Documentation</a></span>
          </div>
        </div>
      )}
    </div>
  );
}
