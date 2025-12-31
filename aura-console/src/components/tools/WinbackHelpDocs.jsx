import React, { useState } from "react";

export default function WinbackHelpDocs() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          background: "#23263a",
          color: "#7fffd4",
          border: "none",
          borderRadius: 24,
          padding: "12px 24px",
          fontWeight: 700,
          fontSize: 18,
          boxShadow: "0 2px 12px #22d3ee55",
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
            width: 420,
            maxHeight: 600,
            overflowY: "auto",
            background: "#fff",
            color: "#23263a",
            borderRadius: 18,
            boxShadow: "0 8px 40px #0008",
            padding: 32,
            zIndex: 10000,
          }}
        >
          <h2 style={{ color: "#23263a", fontWeight: 900 }}>Abandoned Checkout Winback: Help & Documentation</h2>
          <ul style={{ fontSize: 16, lineHeight: 1.7, margin: "18px 0" }}>
            <li><b>Campaign Builder:</b> Step-by-step wizard to create, configure, and launch winback campaigns. Supports multi-channel (email, SMS, push), A/B testing, and scheduling.</li>
            <li><b>Template Editor:</b> Rich editor for email/SMS templates with OpenAI-powered suggestions, dynamic variables, and real-time preview.</li>
            <li><b>A/B Testing:</b> Create and manage message variants, track performance, and auto-optimize for best results.</li>
            <li><b>Segmentation:</b> Target specific customer groups (VIPs, new, high-value, etc.) for personalized winback flows.</li>
            <li><b>Scheduling & Automation:</b> Set up triggers, delays, and throttling for campaign sends. Supports recurring and one-time schedules.</li>
            <li><b>Analytics Dashboard:</b> Visualize open, click, recovery rates, revenue impact, and A/B test results with charts and tables.</li>
            <li><b>Activity Log:</b> View a detailed log of all campaign actions, sends, edits, and results for compliance and troubleshooting.</li>
            <li><b>Notification Center:</b> Get real-time alerts for campaign status, errors, and results.</li>
            <li><b>Shopify Integration:</b> Connects to your store to fetch real abandoned checkout data and personalize messages.</li>
            <li><b>Compliance:</b> GDPR/CCPA tools for data export, deletion, and audit logging. CAN-SPAM and deliverability best practices built-in.</li>
            <li><b>Security:</b> API keys, OAuth, CSRF, XSS, and rate limiting for safe operation.</li>
            <li><b>AI Personalization:</b> Use OpenAI to generate dynamic, high-converting winback messages in any language and tone.</li>
            <li><b>Extensibility:</b> Modular design for easy extension to new channels, triggers, and integrations.</li>
          </ul>
          <div style={{ fontSize: 15, color: "#888", marginTop: 18 }}>
            For detailed guides, best practices, and troubleshooting, visit our <a href="https://docs.aurasystems.ai/winback" target="_blank" rel="noopener noreferrer">full documentation</a>.
          </div>
        </div>
      )}
    </div>
  );
}
