import React, { useState, useRef } from "react";

export default function InternalLinkOptimizer() {
 const [input, setInput] = useState("");
 const [result, setResult] = useState("");
 const [links, setLinks] = useState([]);
 const [analytics, setAnalytics] = useState([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState("");
 const [imported, setImported] = useState(null);
 const [exported, setExported] = useState(null);
 const [showOnboarding, setShowOnboarding] = useState(false);
 const [darkMode, setDarkMode] = useState(false);
 const fileInputRef = useRef();

 // Fetch links
 const fetchLinks = async () => {
 setLoading(true);
 setError("");
 try {
 const res = await fetch("/api/internal-link-optimizer/links");
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setLinks(data.links || []);
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // Fetch analytics
 const fetchAnalytics = async () => {
 setLoading(true);
 setError("");
 try {
 const res = await fetch("/api/internal-link-optimizer/analytics");
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setAnalytics(data.analytics || []);
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // AI Generate
 const handleGenerate = async () => {
 setLoading(true);
 setError("");
 setResult("");
 try {
 const res = await fetch("/api/internal-link-optimizer/ai/generate", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ input })
 });
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setResult(data.result || "No links generated");
 fetchLinks();
 } catch (err) {
 setError(err.message);
 } finally {
 setLoading(false);
 }
 };

 // CRUD
 const handleAddLink = async () => {
 setLoading(true);
 setError("");
 try {
 const res = await fetch("/api/internal-link-optimizer/links", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ content: result })
 });
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 fetchLinks();
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
 const res = await fetch("/api/internal-link-optimizer/import", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ data: JSON.parse(evt.target.result) })
 });
 const data = await res.json();
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setImported(file.name);
 fetchLinks();
 } catch (err) {
 setError(err.message);
 }
 };
 reader.readAsText(file);
 };
 const handleExport = () => {
 const blob = new Blob([JSON.stringify(links, null, 2)], { type: "application/json"});
 const url = URL.createObjectURL(blob);
 setExported(url);
 setTimeout(() =>URL.revokeObjectURL(url), 10000);
 };

 // Onboarding
 const onboardingContent = (
 <div style={{ padding: 24, background: darkMode ? "#09090b": "#f4f4f5", borderRadius: 12, marginBottom: 18 }}>
 <h3 style={{ fontWeight: 700, fontSize: 22 }}>Welcome to Internal Link Optimizer</h3>
 <ul style={{ margin: "16px 0 0 18px", color: darkMode ? "#a3e635": "#52525b", fontSize: 16 }}>
 <li>Generate, import, and manage internal links with AI</li>
 <li>Analyze performance with real-time analytics</li>
 <li>Collaborate and share with your team</li>
 <li>Accessible, secure, and fully compliant</li>
 </ul>
 <button onClick={() => setShowOnboarding(false)} style={{ marginTop: 18, background: "#09090b", color: "#fff", border: "none", borderRadius: 8, padding: "10px 28px", fontWeight: 600, fontSize: 16, cursor: "pointer"}}>Get Started</button>
 </div>
 );

 React.useEffect(() => {
 fetchLinks();
 fetchAnalytics();
 }, []);

 return (
 <div style={{
 
 margin: "40px auto",
 background: darkMode ? "#18181b": "#fff",
 borderRadius: 18,
 boxShadow: "0 2px 24px #0002",
 padding: 36,
 color: darkMode ? "#a3e635": "#09090b",
 fontFamily: 'Inter, sans-serif',
 transition: "background 0.3s, color 0.3s"}}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
 <h2 style={{ fontWeight: 800, fontSize: 32, margin: 0 }}>Internal Link Optimizer</h2>
 <button onClick={() => setDarkMode(d => !d)} aria-label="Toggle dark mode"style={{ background: "#09090b", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer"}}>{darkMode ? "Light": "Dark"} Mode</button>
 </div>
 <div style={{ marginBottom: 10, color: darkMode ? "#a3e635": "#0ea5e9", fontWeight: 600 }}>
 <span role="img"aria-label="link"></span>Generate, manage, and analyze internal links with AI and analytics.
 </div>
 <button onClick={() => setShowOnboarding(true)} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "7px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginBottom: 16 }}>{showOnboarding ? "Hide": "Show"} Onboarding</button>
 {showOnboarding && onboardingContent}
 <textarea
 value={input}
 onChange={e => setInput(e.target.value)}
 rows={4}
 style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: darkMode ? "1px solid #555": "1px solid #ccc", marginBottom: 18, background: darkMode ? "#09090b": "#fff", color: darkMode ? "#a3e635": "#09090b"}}
 placeholder="Describe your internal linking needs here..."aria-label="Internal link input"/>
 <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
 <button onClick={handleGenerate} disabled={loading || !input} style={{ background: "#a3e635", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>{loading ? "Generating...": "AI Generate"}</button>
 <button onClick={handleAddLink} disabled={!result} style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Save Link</button>
 <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Import</button>
 <input ref={fileInputRef} type="file"accept=".json"style={{ display: "none"}} onChange={handleImport} aria-label="Import links"/>
 <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Export</button>
 {exported && <a href={exported} download="links.json"style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
 </div>
 {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
 {result && (
 <div style={{ background: darkMode ? "#09090b": "#f4f4f5", borderRadius: 10, padding: 16, marginBottom: 12, color: darkMode ? "#a3e635": "#09090b"}}>
 <div style={{ fontWeight: 600, marginBottom: 4 }}>AI Link:</div>
 <div>{result}</div>
 </div>
 )}
 {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
 <div style={{ marginTop: 24, background: darkMode ? "#18181b": "#fff", borderRadius: 12, padding: 18, border: "1px solid #27272a"}}>
 <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10, color: darkMode ? "#e4e4e7": "#09090b"}}>Links</div>
 {links.map(l => (
 <div key={l.id} style={{ background: darkMode ? "#09090b": "#fafafa", borderRadius: 8, padding: "10px 14px", marginBottom: 8, border: "1px solid #27272a"}}>
 <span style={{ fontWeight: 600, color: darkMode ? "#e4e4e7": "#09090b"}}>{l.content ? l.content.slice(0, 80) + (l.content.length > 80 ? "": "") : `Link #${l.id}`}</span>
 </div>
 ))}
 </div>
 <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap"}}>
 <div style={{ background: "#27272a", borderRadius: 10, padding: "12px 20px", border: "1px solid #27272a"}}>
 <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Total Links</div>
 <div style={{ fontSize: 26, fontWeight: 800, color: "#a3e635", marginTop: 2 }}>{links.length}</div>
 </div>
 <div style={{ background: "#27272a", borderRadius: 10, padding: "12px 20px", border: "1px solid #27272a"}}>
 <div style={{ fontSize: 11, color: "#71717a", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Events</div>
 <div style={{ fontSize: 26, fontWeight: 800, color: "#a3e635", marginTop: 2 }}>{analytics.length}</div>
 </div>
 </div>
 <div style={{ marginTop: 32, fontSize: 13, color: darkMode ? "#a3e635": "#71717a", textAlign: "center"}}>
 <span>Best-in-class SaaS features. Feedback? <a href="mailto:support@aura-core.ai"style={{ color: darkMode ? "#a3e635": "#0ea5e9", textDecoration: "underline"}}>Contact Support</a></span>
 </div>
 </div>
 );
}




