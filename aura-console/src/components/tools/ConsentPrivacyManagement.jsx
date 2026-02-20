import React, { useState, useRef, useEffect } from "react";
import BackButton from "./BackButton";
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
    <div style={{ padding: 24, background: '#232336', borderRadius: 12, marginBottom: 18, color: '#f0f0f0' }}>
      <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Consent & Privacy Management</h3>
      <ul style={{ margin: '16px 0 0 18px', color: '#333333', fontSize: 16 }}>
        <li>Manage user consents, privacy requests, and compliance reports</li>
        <li>Import/export data, analyze compliance</li>
        <li>Accessible, secure, and fully compliant</li>
      </ul>
      <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Get Started</button>
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
      try {
        setConsents(JSON.parse(evt.target.result));
        setImported(file.name);
      } catch { setError("Invalid JSON file"); }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(consents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    setExported(url);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const handleFeedback = async () => {
    if (!feedback) return;
    try {
      await apiFetch("/api/consent-privacy-management/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedback })
      });
      setFeedback("");
    } catch (err) { setError(err.message); }
  };

  useEffect(() => {
    fetchConsents();
    fetchPrivacyRequests();
    fetchComplianceReports();
  }, []);

  return (
    <div style={{ background: '#18181b', borderRadius: 18, boxShadow: '0 2px 24px #0008', padding: 36, fontFamily: 'Inter, sans-serif', color: '#f0f0f0' }}>
      <BackButton />
      <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Consent & Privacy Management</h2>
      <button onClick={() => setShowOnboarding(v => !v)} style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: 16 }}>{showOnboarding ? "Hide" : "Show"} Onboarding</button>
      {showOnboarding && onboardingContent}
      {/* Consents */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#7fffd4' }}>Consents <span style={{ background: '#1e3a2f', color: '#7fffd4', borderRadius: 12, padding: '2px 10px', fontSize: 12, marginLeft: 6 }}>{consents.length}</span></div>
        {consents.length === 0 ? <div style={{ color: '#444444', fontSize: 14 }}>No consents recorded yet.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {consents.map((c, i) => <div key={i} style={{ background: '#0a0a0a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e2e8f0', border: '1px solid #2f3a50' }}>{typeof c === 'string' ? c : (c.type || c.user || JSON.stringify(c).slice(0, 120))}</div>)}
          </div>
        )}
      </div>
      {/* Privacy Requests */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#7fffd4' }}>Privacy Requests <span style={{ background: '#1e3a2f', color: '#7fffd4', borderRadius: 12, padding: '2px 10px', fontSize: 12, marginLeft: 6 }}>{privacyRequests.length}</span></div>
        {privacyRequests.length === 0 ? <div style={{ color: '#444444', fontSize: 14 }}>No privacy requests yet.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {privacyRequests.map((r, i) => <div key={i} style={{ background: '#0a0a0a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e2e8f0', border: '1px solid #2f3a50' }}>{r.type || r.user || JSON.stringify(r).slice(0, 120)}</div>)}
          </div>
        )}
      </div>
      {/* Compliance Reports */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: '#7fffd4' }}>Compliance Reports <span style={{ background: '#1e3a2f', color: '#7fffd4', borderRadius: 12, padding: '2px 10px', fontSize: 12, marginLeft: 6 }}>{complianceReports.length}</span></div>
        {complianceReports.length === 0 ? <div style={{ color: '#444444', fontSize: 14 }}>No compliance reports yet.</div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {complianceReports.map((r, i) => <div key={i} style={{ background: '#0a0a0a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#e2e8f0', border: '1px solid #2f3a50' }}>{r.title || r.type || JSON.stringify(r).slice(0, 120)}</div>)}
          </div>
        )}
      </div>
      {/* Import/Export */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input type="file" accept="application/json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileInputRef.current.click()} style={{ background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Import Consents</button>
        <button onClick={handleExport} disabled={!consents.length} style={{ background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: consents.length ? 1 : 0.5 }}>Export Consents</button>
        {imported && <span style={{ alignSelf: 'center', color: '#22c55e', fontSize: 13 }}>✓ Imported: {imported}</span>}
        {exported && <a href={exported} download="consents.json" style={{ alignSelf: 'center', color: '#22c55e', fontSize: 13 }}>⬇ Download</a>}
      </div>
      {error && <div style={{ color: '#ef4444', marginBottom: 12, fontSize: 14 }}>⚠ {error}</div>}
    </div>
  );
}

