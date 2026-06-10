import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/aura-api-sdk";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
  methodBadge: (m) => ({ display: "inline-block", minWidth: 52, textAlign: "center", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 800, background: m === "GET" ? "#052e16" : m === "POST" ? "#1e1b4b" : m === "PUT" ? "#3d2a0a" : "#3f1315", color: m === "GET" ? "#4ade80" : m === "POST" ? "#818cf8" : m === "PUT" ? "#fbbf24" : "#f87171" }),
};

const TABS = [
  { id: "reference", label: "API Reference" },
  { id: "console",   label: "API Console" },
  { id: "snippets",  label: "Code Snippets" },
  { id: "quickstart", label: "Quick Start" },
];

const API_GROUPS = [
  {
    group: "SEO",
    endpoints: [
      { method: "POST", path: "/api/technical-seo-auditor/audit",    desc: "Run full technical SEO audit",          credits: 1, body: '{ "url": "https://shop.myshopify.com" }' },
      { method: "GET",  path: "/api/rank-visibility-tracker/ranks",  desc: "Fetch current keyword rankings",        credits: 0, body: null },
      { method: "POST", path: "/api/site-crawl",                     desc: "Start a full site crawl",              credits: 2, body: '{ "shopDomain": "yourshop.myshopify.com" }' },
      { method: "GET",  path: "/api/seo-keywords",                   desc: "Get tracked keyword list",             credits: 0, body: null },
      { method: "POST", path: "/api/schema-rich-results/generate",   desc: "Generate structured data schema",      credits: 1, body: '{ "productId": "12345", "type": "Product" }' },
    ],
  },
  {
    group: "Content",
    endpoints: [
      { method: "POST", path: "/api/weekly-blog-content-engine/generate", desc: "Generate full blog post draft",   credits: 3, body: '{ "topic": "summer skincare routines", "targetKeyword": "spf moisturiser" }' },
      { method: "POST", path: "/api/email-automation-builder/generate",   desc: "Generate email campaign copy",    credits: 2, body: '{ "type": "welcome", "brandVoice": "friendly", "product": "skincare set" }' },
      { method: "POST", path: "/api/social-scheduler-content-engine/ai/schedule", desc: "Generate platform-optimised social post", credits: 2, body: '{ "content": "New product launch: Midnight Blue jacket", "platform": "Instagram" }' },
      { method: "POST", path: "/api/creative-automation-engine/generate",  desc: "Generate creative ad copy",     credits: 2, body: '{ "brief": "Retargeting ad for cart abandoners", "platform": "Facebook" }' },
    ],
  },
  {
    group: "Customers",
    endpoints: [
      { method: "POST", path: "/api/customer-data-platform/profiles",        desc: "Create a customer profile",    credits: 0, body: '{ "email": "customer@example.com", "name": "Jane Smith" }' },
      { method: "POST", path: "/api/customer-data-platform/profiles/search", desc: "Search customer profiles",     credits: 0, body: '{ "filters": { "query": "jane" }, "options": { "limit": 20 } }' },
      { method: "POST", path: "/api/customer-data-platform/events",          desc: "Track a customer event",       credits: 0, body: '{ "profileId": "abc123", "type": "purchase", "properties": { "orderId": "ORD-001" } }' },
      { method: "POST", path: "/api/customer-data-platform/events/funnel",   desc: "Run funnel analysis",          credits: 0, body: '{ "steps": ["page_view", "add_to_cart", "purchase"] }' },
      { method: "POST", path: "/api/ltv-churn-predictor/predict",            desc: "Predict customer LTV & churn", credits: 1, body: '{ "customerId": "cust_abc123" }' },
    ],
  },
  {
    group: "Inventory & Orders",
    endpoints: [
      { method: "POST", path: "/api/inventory-forecasting/queries",   desc: "AI demand forecast query",             credits: 2, body: '{ "query": "Forecast demand for winter coats over next 30 days. Current stock: 400 units." }' },
      { method: "GET",  path: "/api/inventory-supplier-sync/suppliers", desc: "List all configured suppliers",      credits: 0, body: null },
      { method: "POST", path: "/api/returns-rma-automation/rma",      desc: "Create return/RMA request",            credits: 0, body: '{ "orderId": "ORD-001", "reason": "Wrong item", "resolution": "Replace" }' },
    ],
  },
  {
    group: "Analytics",
    endpoints: [
      { method: "GET",  path: "/api/auto-insights/insights",           desc: "Fetch latest AI-generated insights",  credits: 0, body: null },
      { method: "POST", path: "/api/auto-insights/generate",           desc: "Trigger new insights generation",     credits: 3, body: '{ "scope": "full" }' },
      { method: "GET",  path: "/api/reporting-alerts/alerts",          desc: "List configured metric alerts",       credits: 0, body: null },
      { method: "POST", path: "/api/churn-prediction-playbooks/analyse", desc: "Run churn analysis on customer cohort", credits: 3, body: '{ "cohort": "high-value", "timeframe": "90d" }' },
    ],
  },
];

const CODE_SNIPPETS = [
  {
    lang: "JavaScript (fetch)",
    code: `// Install: no dependencies required
// Authentication: pass your Shopify session token

const response = await fetch('/api/technical-seo-auditor/audit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': \`Bearer \${sessionToken}\`,
    'x-shopify-shop-domain': shopDomain,
  },
  body: JSON.stringify({ url: 'https://yourshop.myshopify.com' }),
});

const data = await response.json();
if (data.ok) {
  console.log('Audit results:', data.results);
} else {
  console.error('Error:', data.error);
}`,
  },
  {
    lang: "Python (requests)",
    code: `import requests

BASE_URL = "https://your-aura-app.onrender.com"
SESSION_TOKEN = "eyJ..."   # Shopify session token
SHOP_DOMAIN   = "yourshop.myshopify.com"

headers = {
    "Authorization": f"Bearer {SESSION_TOKEN}",
    "x-shopify-shop-domain": SHOP_DOMAIN,
    "Content-Type": "application/json",
}

# Generate blog post
response = requests.post(
    f"{BASE_URL}/api/weekly-blog-content-engine/generate",
    headers=headers,
    json={"topic": "skincare for dry skin", "targetKeyword": "moisturiser for dry skin"},
)

data = response.json()
print(data["content"] if data.get("ok") else data["error"])`,
  },
  {
    lang: "Node.js (axios)",
    code: `const axios = require('axios');

const aura = axios.create({
  baseURL: process.env.AURA_BASE_URL,
  headers: {
    'Authorization': \`Bearer \${process.env.SHOPIFY_SESSION_TOKEN}\`,
    'x-shopify-shop-domain': process.env.SHOP_DOMAIN,
  },
});

// Track a customer event
async function trackEvent(profileId, eventType, properties) {
  const { data } = await aura.post('/api/customer-data-platform/events', {
    profileId,
    type: eventType,
    properties,
    timestamp: new Date().toISOString(),
  });
  return data;
}

// Example usage
await trackEvent('cust_abc123', 'purchase', { orderId: 'ORD-001', revenue: 89.99 });`,
  },
  {
    lang: "cURL",
    code: `# Run an SEO audit
curl -X POST https://your-aura-app.onrender.com/api/technical-seo-auditor/audit \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \\
  -H "x-shopify-shop-domain: yourshop.myshopify.com" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://yourshop.myshopify.com"}'

# Get keyword rankings
curl https://your-aura-app.onrender.com/api/rank-visibility-tracker/ranks \\
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \\
  -H "x-shopify-shop-domain: yourshop.myshopify.com"`,
  },
];

export default function AuraAPISDK() {
  const [tab, setTab]           = useState("reference");
  const [docs, setDocs]         = useState(null);
  const [consoleMethod, setMethod] = useState("GET");
  const [consolePath, setPath]  = useState("/api/auto-insights/insights");
  const [consoleBody, setBody]  = useState("");
  const [consoleResult, setConsoleResult] = useState(null);
  const [consoleLoading, setConsoleLoading] = useState(false);
  const [consoleHistory, setConsoleHistory] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeSnippet, setActiveSnippet] = useState(0);
  const [error, setError]       = useState("");

  useEffect(() => {
    apiFetchJSON(`${API}/docs`).then(r => { if (r.ok !== false) setDocs(r); }).catch(() => {});
  }, []);

  const runConsole = async () => {
    setConsoleLoading(true); setError(""); setConsoleResult(null);
    try {
      const opts = { method: consoleMethod };
      if (["POST", "PUT", "PATCH"].includes(consoleMethod) && consoleBody.trim()) {
        opts.headers = { "Content-Type": "application/json" };
        opts.body = consoleBody;
      }
      const r = await apiFetchJSON(consolePath, opts);
      setConsoleResult(r);
      setConsoleHistory(h => [{ method: consoleMethod, path: consolePath, status: r.ok !== false ? 200 : 400, ts: new Date().toISOString() }, ...h].slice(0, 20));
    } catch (e) {
      setError(e.message);
    }
    setConsoleLoading(false);
  };

  const loadEndpoint = (ep) => {
    setMethod(ep.method);
    setPath(ep.path);
    setBody(ep.body || "");
    setTab("console");
  };

  const filteredGroups = selectedGroup ? API_GROUPS.filter(g => g.group === selectedGroup) : API_GROUPS;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>AURA API & SDK</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Full API reference, live console, and code snippets for every AURA endpoint. Build custom integrations, automate workflows, and connect AURA to your existing tools.
        </p>
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── REFERENCE ── */}
      {tab === "reference" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <button style={S.btn(selectedGroup === null ? "primary" : null)} onClick={() => setSelectedGroup(null)}>All</button>
            {API_GROUPS.map(g => (
              <button key={g.group} style={S.btn(selectedGroup === g.group ? "primary" : null)} onClick={() => setSelectedGroup(g.group)}>{g.group}</button>
            ))}
          </div>
          {filteredGroups.map(group => (
            <div key={group.group} style={S.card}>
              <div style={S.sectionTitle}>{group.group}</div>
              {group.endpoints.map((ep, i) => (
                <div key={i} style={S.row}>
                  <span style={S.methodBadge(ep.method)}>{ep.method}</span>
                  <div style={{ flex: 1 }}>
                    <code style={{ fontSize: 13, color: "#c7d2fe", fontFamily: "monospace" }}>{ep.path}</code>
                    <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{ep.desc}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    {ep.credits > 0 && (
                      <span style={{ background: "#3d2a0a", color: "#fbbf24", padding: "2px 7px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        {ep.credits} credit{ep.credits !== 1 ? "s" : ""}
                      </span>
                    )}
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => loadEndpoint(ep)}>Try it</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── CONSOLE ── */}
      {tab === "console" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Live Request</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              {["GET", "POST", "PUT", "DELETE"].map(m => (
                <button key={m} style={{ ...S.btn(m === consoleMethod ? "primary" : null), fontSize: 12, padding: "6px 14px" }} onClick={() => setMethod(m)}>{m}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                style={{ ...S.input, fontFamily: "monospace", fontSize: 13 }}
                value={consolePath}
                onChange={e => setPath(e.target.value)}
                placeholder="/api/tool-name/endpoint"
              />
              <button style={S.btn("primary")} onClick={runConsole} disabled={consoleLoading}>
                {consoleLoading ? <Spinner size={14} /> : "Send"}
              </button>
            </div>
            {["POST", "PUT", "PATCH"].includes(consoleMethod) && (
              <textarea
                style={{ ...S.ta, minHeight: 100, fontFamily: "monospace", fontSize: 13 }}
                value={consoleBody}
                onChange={e => setBody(e.target.value)}
                placeholder='{"key": "value"}'
              />
            )}
          </div>

          {consoleResult && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Response</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ background: "#052e16", color: "#4ade80", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>200 OK</span>
                  <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => navigator.clipboard?.writeText(JSON.stringify(consoleResult, null, 2))}>
                    Copy
                  </button>
                </div>
              </div>
              <pre style={S.pre}>{JSON.stringify(consoleResult, null, 2)}</pre>
            </div>
          )}

          {consoleHistory.length > 0 && (
            <div style={S.card}>
              <div style={S.sectionTitle}>Request History</div>
              {consoleHistory.map((h, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #1f1f22", fontSize: 12 }}>
                  <span style={S.methodBadge(h.method)}>{h.method}</span>
                  <code style={{ flex: 1, color: "#c7d2fe", fontFamily: "monospace" }}>{h.path}</code>
                  <span style={{ background: "#052e16", color: "#4ade80", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>{h.status}</span>
                  <span style={{ color: "#52525b" }}>{new Date(h.ts).toLocaleTimeString()}</span>
                  <button style={{ ...S.btn(), fontSize: 10, padding: "2px 8px" }} onClick={() => { setMethod(h.method); setPath(h.path); }}>Re-run</button>
                </div>
              ))}
            </div>
          )}

          {!consoleResult && !consoleLoading && consoleHistory.length === 0 && (
            <EmptyState icon="🚀" title="Ready to send" description="Configure your request above and click Send to test any AURA endpoint." />
          )}
        </div>
      )}

      {/* ── CODE SNIPPETS ── */}
      {tab === "snippets" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {CODE_SNIPPETS.map((s, i) => (
              <button key={s.lang} style={S.btn(i === activeSnippet ? "primary" : null)} onClick={() => setActiveSnippet(i)}>{s.lang}</button>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={S.sectionTitle}>{CODE_SNIPPETS[activeSnippet].lang}</div>
              <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(CODE_SNIPPETS[activeSnippet].code)}>
                Copy Code
              </button>
            </div>
            <pre style={S.pre}>{CODE_SNIPPETS[activeSnippet].code}</pre>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Authentication Headers</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14 }}>All AURA API requests require these two headers:</p>
            {[
              { header: "Authorization", value: "Bearer {Shopify session token}", desc: "JWT token obtained from Shopify App Bridge. Rotate with every session." },
              { header: "x-shopify-shop-domain", value: "yourshop.myshopify.com", desc: "Your Shopify store domain. Used to scope all data to your shop." },
              { header: "Content-Type", value: "application/json", desc: "Required for POST/PUT requests with a JSON body." },
            ].map(({ header, value, desc }) => (
              <div key={header} style={S.row}>
                <code style={{ fontFamily: "monospace", fontSize: 12, color: "#818cf8", minWidth: 220, flexShrink: 0 }}>{header}</code>
                <div>
                  <code style={{ fontFamily: "monospace", fontSize: 12, color: "#fbbf24" }}>{value}</code>
                  <div style={{ fontSize: 12, color: "#71717a", marginTop: 2 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Response Format</div>
            <p style={{ fontSize: 13, color: "#71717a", marginBottom: 14 }}>All AURA endpoints return a consistent JSON structure:</p>
            <pre style={S.pre}>{`// Success response
{
  "ok": true,
  "data": { ... }      // or field-specific keys like "results", "profiles", etc.
}

// Error response
{
  "ok": false,
  "error": "Human-readable error message",
  "code": "INSUFFICIENT_CREDITS"   // optional machine-readable error code
}`}</pre>
          </div>
        </div>
      )}

      {/* ── QUICK START ── */}
      {tab === "quickstart" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>5-Minute Integration Guide</div>
            {[
              { step: "1", title: "Install AURA on your Shopify store", body: "Install from the Shopify App Store. AURA will automatically configure itself with your store's data. No manual configuration required for basic features." },
              { step: "2", title: "Obtain your session token",           body: "Use Shopify App Bridge to get a session token: const token = await app.getSessionToken(). This token is passed in the Authorization header for all API calls." },
              { step: "3", title: "Make your first API call",            body: "Call GET /api/auto-insights/insights to get AI-generated insights about your store. This endpoint is free (no credits) and returns immediately from cache." },
              { step: "4", title: "Add credit-consuming features",       body: "For AI-powered endpoints, check credit balance first via GET /api/billing/credits. Each AI action costs 1-5 credits depending on complexity. Credits are deducted after a successful response." },
              { step: "5", title: "Handle errors gracefully",            body: "All errors return { ok: false, error: '...' }. For INSUFFICIENT_CREDITS errors, redirect the user to /billing to top up. For auth errors (401), refresh the session token." },
            ].map(({ step, title, body }) => (
              <div key={step} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid #1f1f22" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, flexShrink: 0 }}>{step}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7", marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Credit System Reference</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              {[
                { action: "SEO audit / rank check / alt-text",   cost: "1 credit" },
                { action: "Email generation / keyword research", cost: "2 credits" },
                { action: "Blog draft / campaign generation",    cost: "3 credits" },
                { action: "Competitive analysis",                cost: "5 credits" },
                { action: "Standard model (gpt-4o)",             cost: "2× multiplier" },
                { action: "Premium model (gpt-4)",               cost: "3× multiplier" },
              ].map(({ action, cost }) => (
                <div key={action} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: "#a1a1aa" }}>{action}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#fbbf24", flexShrink: 0 }}>{cost}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#1e1b4b", border: "1px solid #3730a3", borderRadius: 8, padding: "10px 16px", fontSize: 12, color: "#c7d2fe" }}>
              Credits are charged after a successful AI response — you never pay for failed requests. Check your balance and usage at <code style={{ fontFamily: "monospace" }}>GET /api/billing/credits</code>.
            </div>
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Rate Limits</div>
            {[
              { tier: "Free",         limits: "10 AI requests / day, 100 API calls / hour" },
              { tier: "Professional", limits: "100 AI requests / day, 1,000 API calls / hour" },
              { tier: "Enterprise",   limits: "Unlimited AI requests, 10,000 API calls / hour" },
            ].map(({ tier, limits }) => (
              <div key={tier} style={S.row}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#e4e4e7", minWidth: 100 }}>{tier}</span>
                <span style={{ fontSize: 12, color: "#71717a" }}>{limits}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
