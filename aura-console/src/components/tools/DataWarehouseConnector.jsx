import React, { useState, useEffect } from "react";
import { apiFetchJSON } from "../../api";
import { MozTabs, EmptyState, ErrorBox, Spinner } from "../MozUI";

const API = "/api/data-warehouse-connector";

const S = {
  page: { background: "#09090b", minHeight: "100vh", color: "#fafafa", fontFamily: "'Inter',system-ui,sans-serif", padding: "28px 32px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: 14, padding: "20px 24px", marginBottom: 16 },
  btn: (v) => ({ background: v === "primary" ? "#4f46e5" : v === "green" ? "#166534" : v === "danger" ? "#7f1d1d" : "#27272a", color: "#fafafa", border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }),
  input: { flex: 1, minWidth: 200, background: "#18181b", border: "1px solid #3f3f46", borderRadius: 10, color: "#fafafa", fontSize: 14, padding: "11px 16px", outline: "none" },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: "#52525b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: "1px solid #1f1f22" },
};

const TABS = [
  { id: "sources",    label: "Data Sources" },
  { id: "dashboards", label: "Dashboards" },
  { id: "guide",      label: "BI Guide" },
];

const PLATFORMS = [
  { name: "BigQuery", desc: "Google's serverless data warehouse — ideal for large-scale analytics", logo: "🟦" },
  { name: "Snowflake", desc: "Cloud data platform with near-unlimited scale and performance", logo: "❄️" },
  { name: "Redshift", desc: "AWS managed data warehouse, tight integration with S3 and Glue", logo: "🔴" },
  { name: "Looker Studio", desc: "Free Google BI tool, connects to GA4, BigQuery, Sheets", logo: "📊" },
  { name: "Metabase", desc: "Open-source BI tool, easy SQL queries, embeddable dashboards", logo: "📉" },
  { name: "dbt Cloud", desc: "Transform raw data in your warehouse with version-controlled SQL", logo: "⚙️" },
];

export default function DataWarehouseConnector() {
  const [tab, setTab]             = useState("sources");
  const [sources, setSources]     = useState([]);
  const [dashboards, setDashboards] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, dRes, aRes] = await Promise.all([
        apiFetchJSON(`${API}/data-sources`),
        apiFetchJSON(`${API}/dashboards`),
        apiFetchJSON(`${API}/analytics`),
      ]);
      if (sRes.ok) setSources(sRes.dataSources || []);
      if (dRes.ok) setDashboards(dRes.dashboards || []);
      if (aRes.ok) setAnalytics(aRes.analytics);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fafafa", margin: 0 }}>Data Warehouse / BI Connector</h1>
        <p style={{ fontSize: 14, color: "#71717a", marginTop: 4, marginBottom: 0 }}>Connect your Shopify data to BigQuery, Snowflake, Redshift, Looker Studio, and other BI platforms. Build dashboards that go beyond native Shopify analytics.</p>
      </div>

      {analytics && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          {Object.entries(analytics).filter(([, v]) => typeof v === "number" || typeof v === "string").map(([k, v]) => (
            <div key={k} style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 10, padding: "10px 18px", minWidth: 100 }}>
              <div style={{ fontSize: 10, color: "#71717a", fontWeight: 700, textTransform: "uppercase" }}>{k.replace(/([A-Z])/g, " $1").trim()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#4f46e5" }}>{v}</div>
            </div>
          ))}
        </div>
      )}

      <ErrorBox message={error} />
      <MozTabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === "sources" && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: "#71717a" }}>{sources.length} connected sources</div>
            <button style={{ ...S.btn(), fontSize: 11, padding: "5px 10px" }} onClick={loadAll}>Refresh</button>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : sources.length === 0 ? (
            <>
              <EmptyState icon="🔌" title="No data sources connected" description="Connect a warehouse to start syncing Shopify data." />
              <div style={{ marginTop: 16 }}>
                <div style={S.sectionTitle}>Supported Platforms</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                  {PLATFORMS.map(p => (
                    <div key={p.name} style={{ ...S.card, marginBottom: 0 }}>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span style={{ fontSize: 24 }}>{p.logo}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#fafafa" }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: "#71717a" }}>{p.desc}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            sources.map((s, i) => (
              <div key={s.id || i} style={S.card}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{s.name || s.type}</div>
                <div style={{ fontSize: 12, color: "#71717a" }}>{s.description || s.host || ""}</div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "dashboards" && (
        <div style={{ marginTop: 20 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: 30 }}><Spinner size={36} /></div>
          ) : dashboards.length === 0 ? (
            <EmptyState icon="📊" title="No dashboards yet" description="Connect a BI tool to see your dashboards here." />
          ) : (
            dashboards.map((d, i) => (
              <div key={d.id || i} style={S.card}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#e4e4e7" }}>{d.name}</div>
                {d.url && <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: "#818cf8" }}>{d.url}</a>}
              </div>
            ))
          )}
        </div>
      )}

      {tab === "guide" && (
        <div style={{ marginTop: 20 }}>
          <div style={S.card}>
            <div style={S.sectionTitle}>E-commerce Data Warehouse Architecture</div>
            {[
              { t: "Why move beyond Shopify Analytics?",     d: "Shopify's native analytics is limited to 90-day windows, basic metrics, and no cross-channel data. A warehouse unlocks unlimited history, custom metrics, and multi-source joins (Shopify + ad platforms + email)." },
              { t: "Recommended stack for <£2M/yr",          d: "Shopify → Fivetran/Airbyte → BigQuery → Looker Studio. Free BigQuery sandbox + free Looker Studio gets you 80% there at near-zero cost." },
              { t: "Key tables to sync from Shopify",        d: "orders, order_line_items, customers, products, variants, inventory_levels, sessions, events. Prioritise orders + customers for 80% of insights." },
              { t: "Must-have dashboards for e-commerce",    d: "1) Revenue & orders (daily/weekly trends), 2) Customer cohorts (LTV by acquisition month), 3) Product performance (revenue, margin, return rate), 4) Marketing attribution (cost per acquisition by channel)." },
              { t: "Data freshness vs cost trade-off",       d: "Real-time sync is expensive. For most reports, hourly is sufficient. Daily syncs work for cohort and LTV analysis. Match your sync frequency to your decision-making cadence." },
            ].map(({ t, d }) => (
              <div key={t} style={S.row}>
                <span style={{ color: "#4f46e5", flexShrink: 0 }}>📊</span>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: "#e4e4e7" }}>{t}</div><div style={{ fontSize: 12, color: "#71717a", lineHeight: 1.6 }}>{d}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

 const [dataSources, setDataSources] = useState([]);
 const [dashboards, setDashboards] = useState([]);
 const [analytics, setAnalytics] = useState([]);
 const [error, setError] = useState("");
 const [imported, setImported] = useState(null);
 const [exported, setExported] = useState(null);
 const [feedback, setFeedback] = useState("");
 const fileInputRef = useRef();

 // Fetch data sources
 const fetchDataSources = async () => {
 try {
 const res = await apiFetchJSON("/api/data-warehouse-connector/data-sources");
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setDataSources(data.dataSources || []);
 } catch (err) {
 setError(err.message);
 }
 };
 // Fetch dashboards
 const fetchDashboards = async () => {
 try {
 const res = await apiFetchJSON("/api/data-warehouse-connector/dashboards");
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setDashboards(data.dashboards || []);
 } catch (err) {
 setError(err.message);
 }
 };
 // Fetch analytics
 const fetchAnalytics = async () => {
 try {
 const res = await apiFetchJSON("/api/data-warehouse-connector/analytics");
 const data = res;
 if (!data.ok) throw new Error(data.error || "Unknown error");
 setAnalytics(data.analytics || []);
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
 setDataSources(JSON.parse(evt.target.result));
 setImported(file.name);
 };
 reader.readAsText(file);
 };
 const handleExport = () => {
 const blob = new Blob([JSON.stringify(dataSources, null, 2)], { type: "application/json"});
 const url = URL.createObjectURL(blob);
 setExported(url);
 setTimeout(() =>URL.revokeObjectURL(url), 10000);
 };

 // Feedback
 const handleFeedback = async () => {
 if (!feedback) return;
 setError("");
 try {
 await apiFetch("/api/data-warehouse-connector/feedback", {
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
 <div style={{ background: "#18181b", borderRadius: 18, boxShadow: "0 2px 24px #0008", padding: 36, fontFamily: 'Inter, sans-serif', color: '#fafafa'}}>
 <h2 style={{ fontWeight: 800, fontSize: 32, marginBottom: 18 }}>Data Warehouse/BI Connector</h2>
 <div style={{ color: "#0ea5e9", fontWeight: 600, marginBottom: 18 }}>
 <span role="img"aria-label="warehouse"></span>Integrate with BigQuery, Snowflake, Looker, and more.
 </div>
 <div style={{ marginBottom: 18 }}>
 <button onClick={fetchDataSources} style={{ background: "#4f46e5", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer"}}>Load Data Sources</button>
 <button onClick={fetchDashboards} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Load Dashboards</button>
 <button onClick={fetchAnalytics} style={{ background: "#22c55e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", marginLeft: 12 }}>Load Analytics</button>
 </div>
 <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 600, marginBottom: 8 }}>Data Sources</div>
 <ul style={{ paddingLeft: 18 }}>
 {dataSources.map((ds, idx) => (
 <li key={ds.id || idx} style={{ marginBottom: 8, background: "#3f3f46", borderRadius: 8, padding: 8, color: '#fafafa'}}>{ds.name}</li>
 ))}
 </ul>
 </div>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 600, marginBottom: 8 }}>Dashboards</div>
 <ul style={{ paddingLeft: 18 }}>
 {dashboards.map((db, idx) => (
 <li key={db.id || idx} style={{ marginBottom: 8, background: "#18181b", borderRadius: 8, padding: 8, color: '#4f46e5'}}>{db.name}</li>
 ))}
 </ul>
 </div>
 <div style={{ flex: 1 }}>
 <div style={{ fontWeight: 600, marginBottom: 8 }}>Analytics</div>
 <ul style={{ paddingLeft: 18 }}>
 {analytics.map((a, idx) => (
 <li key={a.id || idx} style={{ marginBottom: 8, background: "#3f3f46", borderRadius: 8, padding: 8, color: '#fafafa'}}>{a.name}</li>
 ))}
 </ul>
 </div>
 </div>
 <div style={{ display: "flex", gap: 12, marginBottom: 18 }}>
 <button onClick={() => fileInputRef.current?.click()} style={{ background: "#fbbf24", color: "#09090b", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Import</button>
 <input ref={fileInputRef} type="file"accept=".json"style={{ display: "none"}} onChange={handleImport} aria-label="Import data sources"/>
 <button onClick={handleExport} style={{ background: "#0ea5e9", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 700, fontSize: 16, cursor: "pointer"}}>Export</button>
 {exported && <a href={exported} download="data-sources.json"style={{ marginLeft: 8, color: "#0ea5e9", fontWeight: 600 }}>Download</a>}
 </div>
 {imported && <div style={{ color: "#22c55e", marginBottom: 8 }}>Imported: {imported}</div>}
 {error && <div style={{ color: "#ef4444", marginBottom: 10 }}>{error}</div>}
 <div style={{ marginTop: 20, fontSize: 13, color: "#71717a", textAlign: "center"}}>Questions? <a href="mailto:support@aura-core.ai"style={{ color: "#0ea5e9", textDecoration: "underline"}}>Contact Support</a></div>
 </div>
 );
}



