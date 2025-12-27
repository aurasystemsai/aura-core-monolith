import React from "react";
import { t } from "../i18n";

function DashboardHome({ setActiveSection }) {
  return (
    <div className="card dashboard-home" style={{ color: "#fff", textAlign: "center" }} role="region" aria-label={t("dashboard_overview")}> 
      <div style={{ fontWeight: 800, fontSize: 40, marginBottom: 16 }}>{t("dashboard_overview")}</div>
      <div style={{ fontSize: 20, color: "#7fffd4", marginBottom: 32 }}>
        {t("dashboard_welcome")}
      </div>
      <div className="dashboard-home-cards-row">
        <div className="card dashboard-home-card">
          <div className="dashboard-home-card-label">{t("dashboard_products")}</div>
          <div className="dashboard-home-card-value">{t("dashboard_seo")}</div>
        </div>
        <div className="card dashboard-home-card">
          <div className="dashboard-home-card-label">{t("dashboard_content_health")}</div>
          <div className="dashboard-home-card-value">{t("dashboard_audit")}</div>
        </div>
        <div className="card dashboard-home-card">
          <div className="dashboard-home-card-label">{t("dashboard_fix_queue")}</div>
          <div className="dashboard-home-card-value">{t("dashboard_issues")}</div>
        </div>
      </div>
      <div className="dashboard-home-actions">
        <button className="button dashboard-home-action" onClick={() => setActiveSection("products")}>{t("dashboard_goto_products")}</button>
        <button className="button dashboard-home-action" onClick={() => setActiveSection("content")}>{t("dashboard_goto_content")}</button>
        <button className="button dashboard-home-action" onClick={() => setActiveSection("fixqueue")}>{t("dashboard_goto_fixqueue")}</button>
      </div>
    </div>
  );
}

export default DashboardHome;
