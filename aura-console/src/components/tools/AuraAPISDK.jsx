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
