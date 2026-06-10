import React, { useState } from "react";
import { MozTabs, EmptyState } from "../MozUI";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "monospace", lineHeight: 1.6 },
  input: { flex: 1, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none", fontFamily: "monospace" },
  select: { background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "10px 14px", outline: "none" },
  pre: { background: "#0d0d0f", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 12, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  badge: (m) => ({ display: "inline-block", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: m === "GET" ? "#052e16" : m === "POST" ? "#1e1b4b" : m === "PUT" ? "#3d2a0a" : "#3f1315", color: m === "GET" ? "#4ade80" : m === "POST" ? "#818cf8" : m === "PUT" ? "#fbbf24" : "#f87171" }),
};

const TABS = [
  { id: "reference", label: "API Reference" },
  { id: "console",   label: "API Console" },
  { id: "quickstart", label: "Quick Start" },
];

const API_ENDPOINTS = [
  { group: "Authentication", endpoints: [
    { method: "GET",  path: "/api/auth/session",               desc: "Get current session info" },
    { method: "POST", path: "/api/auth/verify",                desc: "Verify Shopify session token" },
  ]},
  { group: "Credits & Billing", endpoints: [
    { method: "GET",  path: "/api/billing/credits",            desc: "Get credit balance for shop" },
    { method: "GET",  path: "/api/billing/credit-costs",       desc: "Get credit costs per action type. Pass ?model=gpt-4 for model-specific pricing" },
    { method: "GET",  path: "/api/billing/credit-history",     desc: "Get credit usage history" },
  ]},
  { group: "SEO Tools", endpoints: [
    { method: "POST", path: "/api/technical-seo-auditor/audit", desc: "Run technical SEO audit on a URL" },
    { method: "POST", path: "/api/rank-visibility-tracker/track", desc: "Track keyword rankings" },
    { method: "POST", path: "/api/schema-rich-results-engine/generate", desc: "Generate schema markup" },
  ]},
  { group: "Content & Email", endpoints: [
    { method: "POST", path: "/api/weekly-blog-content-engine/generate", desc: "AI blog content generation" },
    { method: "POST", path: "/api/email-automation-builder/workflows", desc: "Create email automation workflow" },
  ]},
  { group: "Analytics", endpoints: [
    { method: "GET",  path: "/api/brand-intelligence-layer/dashboard", desc: "Brand intelligence metrics" },
    { method: "POST", path: "/api/competitive-analysis/run",          desc: "Run competitive analysis" },
  ]},
];

export default function AuraAPISDK() {
  const [tab, setTab] = useState("reference");
  const [endpoint, setEndpoint] = useState("/api/billing/credits");
  const [method, setMethod]     = useState("GET");
  const [body, setBody]         = useState("{}");
  const [response, setResponse] = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const testEndpoint = async () => {
    setLoading(true); setError(""); setResponse(null);
    try {
      const opts = { method, headers: { "Content-Type": "application/json", "X-Shopify-Shop-Domain": window?.location?.hostname || "test" } };
      if (method !== "GET" && body.trim()) opts.body = body;
      const r = await fetch(endpoint, opts);
      const data = await r.json();
      setResponse(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Aura API SDK</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Full API reference for all Aura endpoints. Explore, test, and integrate Aura's tools programmatically into your own workflows.</p>
      </div>

      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "reference" && (
        <div style={{ marginTop: 20 }}>
          {API_ENDPOINTS.map(group => (
            <div key={group.group} style={S.card}>
              <div style={S.sectionTitle}>{group.group}</div>
              {group.endpoints.map(ep => (
                <div key={ep.path} style={{ ...S.row, alignItems: "center", cursor: "pointer" }} onClick={() => { setEndpoint(ep.path); setMethod(ep.method); setTab("console"); }}>
                  <span style={S.badge(ep.method)}>{ep.method}</span>
                  <code style={{ fontSize: 12, color: "#818cf8", fontFamily: "monospace", flex: 1 }}>{ep.path}</code>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{ep.desc}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "console" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <select style={S.select} value={method} onChange={e => setMethod(e.target.value)}>
                {["GET","POST","PUT","DELETE"].map(m => <option key={m}>{m}</option>)}
              </select>
              <input style={{ ...S.input, flex: 1 }} value={endpoint} onChange={e => setEndpoint(e.target.value)} placeholder="/api/..." />
              <button style={S.btn("primary")} onClick={testEndpoint} disabled={loading}>{loading ? "Sending…" : "Send"}</button>
            </div>
            {method !== "GET" && (
              <>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Request Body (JSON)</div>
                <textarea style={{ ...S.ta, minHeight: 80 }} value={body} onChange={e => setBody(e.target.value)} />
              </>
            )}
          </div>
          {error && <div style={{ background: "#3f1315", border: "1px solid #7f1d1d", borderRadius: 10, padding: "12px 16px", color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {response && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={S.sectionTitle}>Response</div>
                <span style={{ ...S.badge(response.ok ? "GET" : "DELETE"), fontSize: 11 }}>{response.ok ? "200 OK" : "Error"}</span>
              </div>
              <pre style={S.pre}>{JSON.stringify(response, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {tab === "quickstart" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Authentication</div>
            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>All API requests require a Shopify session token (Bearer) and the shop domain header:</p>
            <pre style={S.pre}>{`fetch('/api/billing/credits', {
  headers: {
    'Authorization': 'Bearer <shopify_session_token>',
    'X-Shopify-Shop-Domain': 'your-shop.myshopify.com',
    'Content-Type': 'application/json'
  }
})`}</pre>
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Response Format</div>
            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>All responses follow a consistent format:</p>
            <pre style={S.pre}>{`// Success
{ "ok": true, "data": { ... } }

// Error
{ "ok": false, "error": "Error message" }`}</pre>
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Credit-Consuming Endpoints</div>
            <p style={{ fontSize: 13, color: "#a1a1aa", lineHeight: 1.6 }}>AI-powered endpoints deduct credits. Pass a <code style={{ color: "#818cf8" }}>model</code> field to control cost:</p>
            <pre style={S.pre}>{`fetch('/api/weekly-blog-content-engine/generate', {
  method: 'POST',
  headers: { ... },
  body: JSON.stringify({
    topic: 'Best running shoes 2025',
    model: 'gpt-4o-mini'   // cheaper
    // model: 'gpt-4'      // 3x credits, higher quality
  })
})`}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

 const [endpoint, setEndpoint] = useState("");
 const [method, setMethod] = useState("GET");
 const [body, setBody] = useState("");
 const [response, setResponse] = useState(null);
 const [docs, setDocs] = useState([]);
 const [error, setError] = useState("");
 const [imported, setImported] = useState(null);
 const [exported, setExported] = useState(null);
 const [feedback, setFeedback] = useState("");
 const fileInputRef = useRef();

 // Fetch docs
 const fetchDocs = async () => {
 try {
 const res = await apiFetchJSON("/api/aura-api-sdk/docs");
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setDocs(data.docs || []);
 } catch (err) {
 setError(err.message);
 }
 };

 // Test endpoint
 const testEndpoint = async () => {
 setError("");
 setResponse(null);
 try {
 const res = await apiFetchJSON(endpoint, {
 method,
 headers: { "Content-Type": "application/json"},
 body: method !== "GET"? body : undefined
 });
 const data = res;
 setResponse(data);
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
 setEndpoint("");
 setMethod("GET");
 setBody(evt.target.result);
 setImported(file.name);
 };
 reader.readAsText(file);
 };
 const handleExport = () => {
 const blob = new Blob([JSON.stringify({ endpoint, method, body, response }, null, 2)], { type: "application/json"});
 const url = URL.createObjectURL(blob);
 setExported(url);
 setTimeout(() =>URL.revokeObjectURL(url), 10000);
 };

 // Feedback
 const handleFeedback = async () => {
 if (!feedback) return;
 setError("");
 try {
 await apiFetch("/api/aura-api-sdk/feedback", {
 method: "POST",
 headers: { "Content-Type": "application/json"},
 body: JSON.stringify({ feedback })
 });
 setFeedback("");
 } catch (err) {
 setError(err.message);
 }
 };

 return (
 <div className="tool-main-flex"style={{ fontFamily: 'Inter, sans-serif'}}>
 <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Aura API SDK</h2>
 <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
 <span role="img"aria-label="api"></span>Explore and test Aura API endpoints.
 </div>
 <div style={{ marginBottom: 18 }}>
 <button onClick={fetchDocs} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer"}}>Load Docs</button>
 </div>
 <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
 <input
 value={endpoint}
 onChange={e => setEndpoint(e.target.value)}
 style={{ flex: 2, fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc"}}
 placeholder="API endpoint (e.g. /api/products)"aria-label="API endpoint input"/>
 <select value={method} onChange={e => setMethod(e.target.value)} style={{ flex: 1, fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc"}} aria-label="HTTP method">
 <option value="GET">GET</option>
 <option value="POST">POST</option>
 <option value="PUT">PUT</option>
 <option value="DELETE">DELETE</option>
 </select>
 <button onClick={testEndpoint} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Test</button>
 </div>
 {method !== "GET"&& (
 <textarea
 value={body}
 onChange={e => setBody(e.target.value)}
 rows={4}
 style={{ width: "100%", fontSize: 16, padding: 12, borderRadius: 8, border: "1px solid #ccc", marginBottom: 18 }}
 placeholder="Request body (JSON)"aria-label="Request body input"/>
 )}
 <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
 <button onClick={() => fileInputRef.current?.click()} style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Import</button>
 <input ref={fileInputRef} type="file"accept=".json"style={{ display: "none"}} onChange={handleImport} aria-label="Import API request"/>
 <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Export</button>
 {exported && <a href={exported} download="aura-api-sdk.json"style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
 </div>
 {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
 {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
 {response && (
 <div style={{ background: "#3f3f46", borderRadius: 10, padding: 18, marginBottom: 18, color: "#fafafa"}}>
 <b>Response:</b>
 <pre style={{ fontSize: 15 }}>{JSON.stringify(response, null, 2)}</pre>
 </div>
 )}
 {docs.length > 0 && (
 <div style={{ background: "#3f3f46", borderRadius: 12, padding: 20, marginBottom: 18, color: "#fafafa"}}>
 <b>API Docs:</b>
 <ul style={{ paddingLeft: 18 }}>
 {docs.map((doc, idx) => (
 <li key={doc.id || idx} style={{ marginBottom: 8 }}>{doc.title}</li>
 ))}
 </ul>
 </div>
 )}
 <form onSubmit={e => { e.preventDefault(); handleFeedback(); }} style={{ marginTop: 32, background: "#3f3f46", borderRadius: 12, padding: 20 }} aria-label="Send feedback">
 <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Feedback</div>
 <textarea
 value={feedback}
 onChange={e => setFeedback(e.target.value)}
 rows={2}
 style={{ width: "100%", fontSize: 15, padding: 10, borderRadius: 8, border: "1px solid #4f46e5", marginBottom: 12, background: "#18181b", color: "#fafafa"}}
 placeholder="Share your feedback or suggestions..."aria-label="Feedback input"/>
 <button type="submit"style={{ background: "#4f46e5", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, fontSize: 15, cursor: "pointer"}}>Send Feedback</button>
 </form>
 </div>
 );
}



