import React, { useState, useRef } from "react";
import { apiFetch } from "../../api";

export default function ConsentPrivacyManagement() {
  const [consents, setConsents] = useState([]);
  const [privacyRequests, setPrivacyRequests] = useState([]);
  const [complianceReports, setComplianceReports] = useState([]);
  const [error, setError] = useState("");
  const [imported, setImported] = useState(null);
  const [exported, setExported] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [analytics, setAnalytics] = useState([]);
  const fileInputRef = useRef();
  // Onboarding content
  const onboardingContent = (
    <div style={{ padding: 24, background: '#f1f5f9', borderRadius: 12, marginBottom: 18 }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Consent & Privacy Management</h3>
      <ul style={{ margin: '16px 0 0 18px', color: '#334155', fontSize: 16 }}>
        <li>Manage user consents, privacy requests, and compliance reports</li>
        <li>Import/export data, analyze compliance</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: '#23263a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Get Started</button>
    </div>
  );

  // Fetch consents
  const fetchConsents = async () => {
    try {
      const res = await apiFetch("/api/consent-privacy-management/consents");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setConsents(data.consents || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch privacy requests
  const fetchPrivacyRequests = async () => {
    try {
      const res = await apiFetch("/api/consent-privacy-management/privacy-requests");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setPrivacyRequests(data.privacyRequests || []);
    } catch (err) {
      setError(err.message);
    }
  };
  // Fetch compliance reports
  const fetchComplianceReports = async () => {
    try {
      const res = await apiFetch("/api/consent-privacy-management/compliance-reports");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Unknown error");
      setComplianceReports(data.complianceReports || []);
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
      setConsents(JSON.parse(evt.target.result));
      setImported(file.name);
    };
    return (
      <div style={{ maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 18, boxShadow: '0 2px 24px #0002', padding: 36, fontFamily: 'Inter, sans-serif' }}>
        <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Consent & Privacy Management</h2>
        <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
        {showOnboarding && onboardingContent}
        {/* Consents Table */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Consents</div>
          <div style={{ fontSize: 15, color: '#23263a' }}>
            {consents.length ? (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(consents, null, 2)}</pre>
            ) : (
              <span>No consents yet. Fetch or import to see results.</span>
            )}
          </div>
        </div>
        {/* Privacy Requests Table */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Privacy Requests</div>
          <div style={{ fontSize: 15, color: '#23263a' }}>
            {privacyRequests.length ? (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(privacyRequests, null, 2)}</pre>
            ) : (
              <span>No privacy requests yet. Fetch or import to see results.</span>
            )}
          </div>
        </div>
        {/* Compliance Reports Table */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Compliance Reports</div>
          <div style={{ fontSize: 15, color: '#23263a' }}>
            {complianceReports.length ? (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(complianceReports, null, 2)}</pre>
            ) : (
              <span>No compliance reports yet. Fetch or import to see results.</span>
            )}
          </div>
        </div>
        {/* Import/Export */}
        <div style={{ marginBottom: 24 }}>
          <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
          <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginRight: 12 }}>Import Consents</button>
          <button onClick={handleExport} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Export Consents</button>
          {imported && <span style={{ marginLeft: 12, color: '#6366f1' }}>Imported: {imported}</span>}
          {exported && <a href={exported} download="consents.json" style={{ marginLeft: 12, color: '#22c55e', textDecoration: 'underline' }}>Download Export</a>}
        </div>
        {/* Analytics Dashboard */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Analytics</div>
          <div style={{ fontSize: 15, color: '#23263a' }}>
            {analytics.length ? (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: 'none', padding: 0, margin: 0 }}>{JSON.stringify(analytics, null, 2)}</pre>
            ) : (
              <span>No analytics yet. Manage or import consents to see results.</span>
            )}
          </div>
        </div>
        {/* Feedback */}
        <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: '#f8fafc', borderRadius: 12, padding: 20 }} aria-label="Send feedback">
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
          <textarea
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            rows={3}
            style={{ width: '100%', fontSize: 16, padding: 12, borderRadius: 8, border: '1px solid #ccc', marginBottom: 12 }}
            placeholder="Share your feedback or suggestions..."
            aria-label="Feedback"
          />
          <button type="submit" style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Send Feedback</button>
          {error && <div style={{ color: '#ef4444', marginTop: 8 }}>{error}</div>}
        </form>
        {/* Accessibility & Compliance */}
        <div style={{ marginTop: 32, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          <span>Best-in-class SaaS features. Accessibility: WCAG 2.1, keyboard navigation, color contrast. Feedback? <a href="mailto:support@aura-core.ai" style={{ color: '#0ea5e9', textDecoration: 'underline' }}>Contact Support</a></span>
        </div>
      </div>
    );
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
        <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#23263a", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Import</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} aria-label="Import consents" />
        <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer" }}>Export</button>
        {exported && <a href={exported} download="consents.json" style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
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
