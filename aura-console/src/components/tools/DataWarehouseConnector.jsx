import React, { useState } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/data-warehouse-connector";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 160, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  ta: { width: "100%", background: "#09090b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 13, padding: "12px 14px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "'Inter',sans-serif", lineHeight: 1.6 },
  pre: { background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "14px 16px", fontSize: 13, lineHeight: 1.7, color: "#e4e4e7", whiteSpace: "pre-wrap", fontFamily: "monospace", overflowX: "auto" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "query",       label: "AI Query" },
  { id: "connections", label: "Connections" },
  { id: "schemas",     label: "Data Schemas" },
  { id: "guide",       label: "Architecture Guide" },
];

const PLATFORMS = [
  { name: "BigQuery",        icon: "🔵", desc: "Google's serverless, scalable data warehouse. Best for Google Analytics integration and large-scale reporting.", useCase: "Marketing analytics, GA4 export" },
  { name: "Snowflake",       icon: "❄️", desc: "Cloud-native DWH with near-unlimited concurrency. Ideal for multi-team analytics with strict data governance.", useCase: "Enterprise BI, cross-team analytics" },
  { name: "Redshift",        icon: "🔴", desc: "AWS-native columnar warehouse. Cost-effective at large scale, tight integration with the AWS ecosystem.", useCase: "AWS shops, cost-optimised warehousing" },
  { name: "Databricks",      icon: "🧱", desc: "Unified data + ML platform. Best when you need both analytics and machine learning on the same data.", useCase: "LTV prediction, churn ML, experimentation" },
  { name: "Looker Studio",   icon: "📊", desc: "Google's free BI tool. Easy dashboards on top of BigQuery or Sheets. No SQL required for stakeholder reports.", useCase: "Exec dashboards, marketing reports" },
  { name: "Metabase",        icon: "📈", desc: "Self-hosted open-source BI. SQL and no-code exploration. Best for internal teams that want to query Shopify data directly.", useCase: "Internal reporting, ops metrics" },
  { name: "dbt",             icon: "🔧", desc: "SQL transformation layer that turns raw warehouse data into clean, tested analytics models. The engineering standard for DWH workflows.", useCase: "Data modelling, transformation pipelines" },
  { name: "Fivetran",        icon: "🔗", desc: "Automated ELT pipeline. Syncs Shopify orders, customers, and products to your warehouse in under 15 minutes.", useCase: "Shopify → warehouse pipeline" },
];

const SAMPLE_QUERIES = [
  { label: "Revenue trend by week",    q: "Show me weekly revenue totals for the last 90 days, broken down by product category. Identify weeks with unusual spikes or drops." },
  { label: "Customer cohort analysis", q: "Build a cohort analysis showing the repeat purchase rate for customers who first bought in Q1, Q2, Q3, and Q4." },
  { label: "Inventory turnover",       q: "Calculate inventory turnover rate for each SKU in the last 30 days. Flag any SKUs with more than 60 days of stock on hand." },
  { label: "LTV by acquisition channel", q: "Compare 12-month customer lifetime value segmented by acquisition channel: paid social, organic search, email, referral." },
  { label: "Refund analysis",          q: "Analyse refund patterns: top 10 SKUs by refund rate, most common refund reasons, and average time from purchase to refund request." },
  { label: "Geographic performance",   q: "Break down orders, revenue, and average order value by shipping country/region for the last 6 months." },
];

const SCHEMAS = [
  {
    name: "orders",
    description: "One row per order",
    columns: [
      { col: "order_id",          type: "STRING",    desc: "Shopify order ID" },
      { col: "customer_id",       type: "STRING",    desc: "Customer reference" },
      { col: "created_at",        type: "TIMESTAMP", desc: "Order creation time (UTC)" },
      { col: "total_price",       type: "FLOAT64",   desc: "Total order value including tax/shipping" },
      { col: "subtotal_price",    type: "FLOAT64",   desc: "Pre-tax, pre-shipping subtotal" },
      { col: "financial_status",  type: "STRING",    desc: "paid | refunded | partially_refunded | voided" },
      { col: "fulfillment_status", type: "STRING",   desc: "fulfilled | unfulfilled | partial | null" },
      { col: "source_name",       type: "STRING",    desc: "web | ios | android | pos | api" },
    ],
  },
  {
    name: "customers",
    description: "One row per customer",
    columns: [
      { col: "customer_id",       type: "STRING",    desc: "Shopify customer ID" },
      { col: "email",             type: "STRING",    desc: "Customer email address" },
      { col: "first_order_at",    type: "TIMESTAMP", desc: "Date of first purchase" },
      { col: "last_order_at",     type: "TIMESTAMP", desc: "Date of most recent purchase" },
      { col: "orders_count",      type: "INT64",     desc: "Lifetime order count" },
      { col: "total_spent",       type: "FLOAT64",   desc: "Lifetime revenue from this customer" },
      { col: "accepts_marketing", type: "BOOLEAN",   desc: "Email marketing opt-in status" },
    ],
  },
  {
    name: "order_line_items",
    description: "One row per line item",
    columns: [
      { col: "order_id",     type: "STRING",  desc: "Foreign key to orders" },
      { col: "product_id",   type: "STRING",  desc: "Shopify product ID" },
      { col: "variant_id",   type: "STRING",  desc: "Shopify variant ID (size/colour)" },
      { col: "title",        type: "STRING",  desc: "Product title at time of purchase" },
      { col: "quantity",     type: "INT64",   desc: "Units ordered" },
      { col: "price",        type: "FLOAT64", desc: "Unit price at time of purchase" },
      { col: "sku",          type: "STRING",  desc: "Stock keeping unit" },
      { col: "vendor",       type: "STRING",  desc: "Product vendor" },
    ],
  },
];

export default function DataWarehouseConnector() {
  const [tab, setTab]         = useState("query");
  const [query, setQuery]     = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const [connections, setConnections] = useState([
    { id: 1, platform: "BigQuery",  project: "my-shop-analytics",    status: "connected", lastSync: "2 hours ago",  tables: 14 },
    { id: 2, platform: "Looker Studio", project: "aura-dashboards",  status: "connected", lastSync: "15 min ago",   tables: 6  },
  ]);
  const [newConn, setNewConn] = useState({ platform: "BigQuery", project: "", credentials: "" });
  const setNC = (k, v) => setNewConn(p => ({ ...p, [k]: v }));
  const [addingConn, setAddingConn] = useState(false);
  const [showAddConn, setShowAddConn] = useState(false);
  const [activeSchema, setActiveSchema] = useState(0);

  const runQuery = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const r = await apiFetchJSON(`${API}/query`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!r.ok && r.error) throw new Error(r.error);
      setResult(r.result || r.data || r);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const addConnection = () => {
    if (!newConn.project.trim()) { setError("Project/database name required"); return; }
    setAddingConn(true);
    setTimeout(() => {
      setConnections(p => [...p, { id: Date.now(), ...newConn, status: "connected", lastSync: "just now", tables: 0 }]);
      setNewConn({ platform: "BigQuery", project: "", credentials: "" });
      setShowAddConn(false);
      setAddingConn(false);
    }, 800);
  };

  const removeConnection = (id) => setConnections(p => p.filter(c => c.id !== id));

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Data Warehouse Connector</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>
          Query your data warehouse with plain English, manage warehouse connections, explore schemas, and build the analytics stack your business needs to make better decisions.
        </p>
      </div>

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {/* ── AI QUERY ── */}
      {tab === "query" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Natural Language Query</div>
            <p style={{ fontSize: 13, color: "#71717a", lineHeight: 1.6, marginBottom: 14 }}>
              Describe what you want to know and the AI will translate it into a warehouse query, run it, and summarise the results.
            </p>
            <textarea style={{ ...S.ta, minHeight: 120 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. Show me weekly revenue totals for the last 90 days, broken down by product category…" />
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button style={S.btn("primary")} onClick={runQuery} disabled={loading || !query.trim()}>
                {loading ? "Querying…" : "Run AI Query"}
              </button>
              <button style={{ ...S.btn(), fontSize: 11, padding: "6px 12px" }} onClick={() => { setQuery(""); setResult(null); }}>Clear</button>
            </div>
          </div>

          {loading && <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>}

          {result && !loading && (
            <div style={S.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={S.sectionTitle}>Query Result</div>
                <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={() => navigator.clipboard?.writeText(typeof result === "string" ? result : JSON.stringify(result, null, 2))}>
                  Copy
                </button>
              </div>
              <pre style={S.pre}>{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>
            </div>
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Sample Queries — Click to Load</div>
            {SAMPLE_QUERIES.map(({ label, q }) => (
              <div key={label} style={S.row}>
                <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px", flexShrink: 0 }} onClick={() => setQuery(q)}>Load</button>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#818cf8", marginBottom: 2 }}>{label}</div>
                  <div style={{ fontSize: 12, color: "#71717a" }}>{q.slice(0, 100)}…</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CONNECTIONS ── */}
      {tab === "connections" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{connections.length} connection{connections.length !== 1 ? "s" : ""}</div>
            <button style={S.btn("primary")} onClick={() => setShowAddConn(p => !p)}>
              {showAddConn ? "Cancel" : "+ Add Connection"}
            </button>
          </div>

          {showAddConn && (
            <div style={S.card}>
              <div style={S.sectionTitle}>New Connection</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Platform</div>
                  <select style={{ ...S.input, width: "100%", minWidth: 0, background: "#09090b" }} value={newConn.platform} onChange={e => setNC("platform", e.target.value)}>
                    {PLATFORMS.map(p => <option key={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Project / Database Name</div>
                  <input style={{ ...S.input, width: "100%", boxSizing: "border-box" }} value={newConn.project} onChange={e => setNC("project", e.target.value)} placeholder="my-analytics-project" />
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: "#71717a", marginBottom: 4 }}>Service Account / Connection String</div>
                <textarea style={{ ...S.ta, minHeight: 70 }} value={newConn.credentials} onChange={e => setNC("credentials", e.target.value)} placeholder="Paste service account JSON or connection string…" />
              </div>
              <button style={S.btn("primary")} onClick={addConnection} disabled={addingConn}>
                {addingConn ? "Connecting…" : "Add Connection"}
              </button>
            </div>
          )}

          {connections.length === 0 ? (
            <EmptyState icon="🔌" title="No connections" description="Add your first warehouse connection to start querying." />
          ) : (
            connections.map(conn => (
              <div key={conn.id} style={S.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 20 }}>{PLATFORMS.find(p => p.name === conn.platform)?.icon || "📦"}</span>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#fafafa" }}>{conn.platform}</div>
                        <div style={{ fontSize: 12, color: "#818cf8" }}>{conn.project}</div>
                      </div>
                      <span style={{ background: "#052e16", color: "#4ade80", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        {conn.status}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#71717a" }}>
                      <span>Last sync: {conn.lastSync}</span>
                      {conn.tables > 0 && <span>{conn.tables} tables</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button style={{ ...S.btn(), fontSize: 11, padding: "4px 10px" }} onClick={() => setTab("query")}>Query</button>
                    <button style={{ ...S.btn("danger"), fontSize: 11, padding: "4px 10px" }} onClick={() => removeConnection(conn.id)}>Remove</button>
                  </div>
                </div>
              </div>
            ))
          )}

          <div style={S.card}>
            <div style={S.sectionTitle}>Supported Platforms</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 10 }}>
              {PLATFORMS.map(p => (
                <div key={p.name} style={{ background: "#09090b", border: "1px solid #27272a", borderRadius: 8, padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{p.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{p.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.5, marginBottom: 6 }}>{p.desc}</div>
                  <div style={{ fontSize: 11, color: "#4f46e5", fontWeight: 600 }}>Best for: {p.useCase}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEMAS ── */}
      {tab === "schemas" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {SCHEMAS.map((s, i) => (
              <button key={s.name} style={S.btn(i === activeSchema ? "primary" : null)} onClick={() => setActiveSchema(i)}>
                {s.name}
              </button>
            ))}
          </div>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fafafa" }}>{SCHEMAS[activeSchema].name}</div>
              <code style={{ fontSize: 11, color: "#71717a", fontFamily: "monospace" }}>shopify.{SCHEMAS[activeSchema].name}</code>
            </div>
            <div style={{ fontSize: 12, color: "#71717a", marginBottom: 16 }}>{SCHEMAS[activeSchema].description}</div>
            <div style={{ display: "grid", gridTemplateColumns: "180px 100px 1fr", gap: 6, padding: "6px 0", borderBottom: "1px solid #27272a", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", fontWeight: 700 }}>Column</span>
              <span style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", fontWeight: 700 }}>Type</span>
              <span style={{ fontSize: 10, color: "#52525b", textTransform: "uppercase", fontWeight: 700 }}>Description</span>
            </div>
            {SCHEMAS[activeSchema].columns.map(({ col, type, desc }) => (
              <div key={col} style={{ display: "grid", gridTemplateColumns: "180px 100px 1fr", gap: 6, padding: "8px 0", borderBottom: "1px solid #1f1f22", alignItems: "center" }}>
                <code style={{ fontSize: 13, color: "#818cf8", fontFamily: "monospace", fontWeight: 600 }}>{col}</code>
                <code style={{ fontSize: 11, color: "#fbbf24", fontFamily: "monospace" }}>{type}</code>
                <span style={{ fontSize: 12, color: "#a1a1aa" }}>{desc}</span>
              </div>
            ))}
          </div>
          <div style={S.card}>
            <div style={S.sectionTitle}>Example Query — {SCHEMAS[activeSchema].name}</div>
            <pre style={S.pre}>{
              activeSchema === 0
                ? `SELECT\n  DATE_TRUNC(created_at, WEEK) AS week,\n  SUM(total_price) AS weekly_revenue,\n  COUNT(*) AS order_count,\n  AVG(total_price) AS avg_order_value\nFROM shopify.orders\nWHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 WEEK)\n  AND financial_status = 'paid'\nGROUP BY 1\nORDER BY 1 DESC`
                : activeSchema === 1
                ? `SELECT\n  customer_id,\n  email,\n  orders_count,\n  total_spent,\n  ROUND(total_spent / NULLIF(orders_count, 0), 2) AS avg_order_value,\n  DATE_DIFF(CURRENT_DATE(), DATE(last_order_at), DAY) AS days_since_last_order\nFROM shopify.customers\nWHERE orders_count >= 2\nORDER BY total_spent DESC\nLIMIT 100`
                : `SELECT\n  product_id,\n  title,\n  SUM(quantity) AS units_sold,\n  SUM(quantity * price) AS revenue,\n  COUNT(DISTINCT order_id) AS orders\nFROM shopify.order_line_items\nJOIN shopify.orders USING (order_id)\nWHERE orders.created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)\nGROUP BY 1, 2\nORDER BY revenue DESC\nLIMIT 20`
            }</pre>
          </div>
        </div>
      )}

      {/* ── ARCHITECTURE GUIDE ── */}
      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>Modern Analytics Stack for Shopify</div>
            {[
              { t: "The ELT pattern: Extract, Load, Transform",      d: "Modern warehouses use ELT (not ETL). Load raw Shopify data into BigQuery/Snowflake first, then transform it with dbt. This keeps raw data intact for re-processing and makes transformations version-controlled and testable." },
              { t: "Shopify → Warehouse pipeline options",           d: "Fivetran: fully automated, Shopify connector in <15 min, ~$500/month at scale. Airbyte: open-source, self-hosted, free. Custom webhook listener: cheapest but requires engineering time. Choose Fivetran if budget allows — it saves 20+ hours/month." },
              { t: "The metrics layer: where dbt fits",              d: "dbt transforms raw order/customer/product tables into clean, consistent metrics models that everyone in the business agrees on. Without a metrics layer, every analyst calculates 'revenue' differently. dbt solves this." },
              { t: "When to use BigQuery vs Snowflake",              d: "BigQuery: best if you're in the Google ecosystem (GA4, Looker Studio). Pay-per-query pricing great for irregular workloads. Snowflake: better for multi-cloud teams, concurrent users, and enterprise governance. Both are excellent choices." },
              { t: "BI tool selection framework",                    d: "Looker Studio: free, great for execs, limited SQL. Metabase: self-hosted, $500/month cloud, best for SQL-comfortable ops teams. Tableau: enterprise, $840/user/year, best visualisations. Power BI: Microsoft shops, $10/user/month." },
              { t: "Warehouse cost optimisation",                    d: "Partition tables by date. Cluster by frequently-filtered columns (customer_id, product_id). Use materialised views for common aggregations. Schedule heavy queries during off-peak hours. Monitor query cost weekly — a runaway query can cost thousands." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>🏗️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div>
                  <div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={S.sectionTitle}>Reference Architecture — Shopify Analytics Stack</div>
            {[
              { layer: "Data Sources",   tools: "Shopify Admin API, Shopify Webhooks, Google Analytics 4, Meta Ads, Klaviyo",      color: "#1e3a5f" },
              { layer: "Ingestion",      tools: "Fivetran / Airbyte (ELT connectors) → BigQuery / Snowflake raw schema",          color: "#1e1b4b" },
              { layer: "Transformation", tools: "dbt Cloud (SQL models, tests, documentation) → analytics schema",                color: "#1e1b4b" },
              { layer: "Semantic Layer", tools: "dbt Metrics / Cube.js — shared metric definitions for revenue, LTV, CAC, ROAS",  color: "#1e3a5f" },
              { layer: "BI & Reporting", tools: "Looker Studio (execs) + Metabase (ops) + Streamlit (ML dashboards)",            color: "#052e16" },
              { layer: "Activation",     tools: "AURA CDP → Klaviyo, Meta Custom Audiences, Shopify Flow triggers",              color: "#3d2a0a" },
            ].map(({ layer, tools, color }) => (
              <div key={layer} style={{ background: color, border: "1px solid #27272a", borderRadius: 8, padding: "10px 16px", marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#c7d2fe", minWidth: 120, flexShrink: 0 }}>{layer}</span>
                  <span style={{ fontSize: 12, color: "#a1a1aa" }}>{tools}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
