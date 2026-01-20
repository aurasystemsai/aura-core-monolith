import React, { useEffect, useState } from "react";
import "./IntegrationHealthPanel.css";

// Example integrations to check
const INTEGRATIONS = [
  { id: "shopify", name: "Shopify", api: "/api/integration/shopify/status" },
  { id: "klaviyo", name: "Klaviyo", api: "/api/integration/klaviyo/status" },
  { id: "google-analytics", name: "Google Analytics", api: "/api/integration/google-analytics/status" },
  { id: "slack", name: "Slack", api: "/api/integration/slack/status" },
  { id: "segment", name: "Segment", api: "/api/integration/segment/status" },
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
            const res = await fetch(integration.api, { credentials: "include" });
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
    <section className="integration-health-card" style={{ marginTop: 10 }}>
      <div className="card-header">
        <h2 className="card-title" title="Check if your integrations are connected and healthy">Integration Health
          <span style={{ display: 'inline-block', marginLeft: 8, fontSize: 18, color: '#7fffd4', cursor: 'help' }} title="This panel shows if your integrations (Shopify, Klaviyo, etc) are working. If green, all is well.">ⓘ</span>
        </h2>
        <p className="card-subtitle">
          Status of your key integrations. If these are green, your automations and analytics will work.
          <span style={{color:'#7fffd4',marginLeft:8,cursor:'help'}} title="If not green, check your integration settings.">?</span>
        </p>
      </div>
      <div className="integration-health-grid">
        {INTEGRATIONS.map((integration) => {
          const status = statuses[integration.id] || (loading ? "checking" : "unknown");
          let statusClass = "integration-health-chip ";
          if (status === "ok") statusClass += "integration-health-chip--ok";
          else if (status === "checking") statusClass += "integration-health-chip--loading";
          else if (status === "error" || status === "unknown") statusClass += "integration-health-chip--error";
          return (
            <div key={integration.id} className={statusClass} title={integration.name}>
              <span className="integration-health-dot" />
              <span className="integration-health-text">{integration.name}: {status === "ok" ? "Connected" : status === "checking" ? "Checking…" : "Not Connected"}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default IntegrationHealthPanel;
