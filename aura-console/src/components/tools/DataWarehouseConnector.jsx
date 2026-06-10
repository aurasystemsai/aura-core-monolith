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
