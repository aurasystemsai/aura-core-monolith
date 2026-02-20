import React, { useEffect, useState } from "react";
import "./IntegrationHealthPanel.css";
import { apiFetch } from "../api";

// Only show Shopify integration for health check
const INTEGRATIONS = [
  { id: "shopify", name: "Shopify", api: "/api/integration/shopify/status" },
];

function IntegrationHealthPanel() {
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchStatuses() {
      setLoading(true);
      const results = {};
      await Promise.all(
        INTEGRATIONS.map(async (integration) => {
          try {
            const res = await apiFetch(integration.api, { credentials: "include" });
            const data = await res.json();
            results[integration.id] = data.status || "unknown";
          } catch {
            results[integration.id] = "error";
          }
        })
      );
      if (isMounted) {
        setStatuses(results);
        setLoading(false);
      }
    }
    fetchStatuses();
    return () => { isMounted = false; };
  }, []);

  return (
    <section className="integration-health-card" style={{ marginTop: 18, background: '#18181b', borderRadius: 18, boxShadow: '0 4px 24px #0004', padding: '32px 36px', maxWidth: 540, marginLeft: 'auto', marginRight: 'auto' }}>
      <div className="card-header" style={{ marginBottom: 18 }}>
        <h2 className="card-title" style={{ fontSize: 22, fontWeight: 900, color: '#4f46e5', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 26, verticalAlign: 'middle' }}></span>Integration Health
          <span style={{ display: 'inline-block', marginLeft: 8, fontSize: 18, color: '#4f46e5', cursor: 'help' }} title="This panel shows if your Shopify integration is working. If green, all is well."></span>
        </h2>
        <p className="card-subtitle" style={{ color: '#b3c2e0', fontWeight: 500, fontSize: 15, marginTop: 6 }}>
          Shopify connection status for your app. If this is <span style={{color:'#4f46e5',fontWeight:700}}>green</span>, your automations and analytics will work. If <span style={{color:'#ff4d4f',fontWeight:700}}>red</span>, check your app setup.
        </p>
      </div>
      <div className="integration-health-grid" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: 18 }}>
        {INTEGRATIONS.map((integration) => {
          const status = statuses[integration.id] || (loading ? "checking" : "unknown");
          let statusClass = "integration-health-chip ";
          let icon = null;
          if (status === "ok") {
            statusClass += "integration-health-chip--ok";
            icon = <span style={{ color: '#4f46e5', fontSize: 28, marginRight: 12 }}>️</span>;
          } else if (status === "checking") {
            statusClass += "integration-health-chip--loading";
            icon = <span style={{ color: '#ffe066', fontSize: 28, marginRight: 12 }}></span>;
          } else {
            statusClass += "integration-health-chip--error";
            icon = <span style={{ color: '#ff4d4f', fontSize: 28, marginRight: 12 }}></span>;
          }
          return (
            <div key={integration.id} className={statusClass} title={integration.name} style={{ minWidth: 260, display: 'flex', alignItems: 'center', background: '#18181b', borderRadius: 16, padding: '18px 28px', fontWeight: 700, fontSize: 18, color: status === 'ok' ? '#4f46e5' : status === 'checking' ? '#ffe066' : '#ff4d4f', boxShadow: '0 2px 12px #0002', margin: 0 }}>
              {icon}
              <span className="integration-health-text" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.01em' }}>{integration.name}</span>
              <span style={{ marginLeft: 18, fontWeight: 700, fontSize: 16, color: status === 'ok' ? '#4f46e5' : status === 'checking' ? '#ffe066' : '#ff4d4f' }}>
                {status === "ok" ? "Connected" : status === "checking" ? "Checking…" : "Not Connected"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default IntegrationHealthPanel;

