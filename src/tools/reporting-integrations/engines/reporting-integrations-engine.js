"use strict";
/**
 * Reporting Integrations Engine
 * Google Analytics 4, Looker Studio, Tableau, Power BI, Klaviyo, Meta Ads
 */
const INTEGRATIONS = [
  { id:"ga4", name:"Google Analytics 4", category:"analytics", status:"connected", icon:"ga4", lastSync:"2026-07-26T09:00:00Z", eventsToday:28420, errorRate:0.0, authType:"oauth2" },
  { id:"looker", name:"Looker Studio", category:"bi", status:"connected", icon:"looker", lastSync:"2026-07-26T08:00:00Z", reportsPublished:12, errorRate:0.0, authType:"service_account" },
  { id:"klaviyo", name:"Klaviyo", category:"email", status:"connected", icon:"klaviyo", lastSync:"2026-07-26T10:01:00Z", profilesSynced:84290, errorRate:0.002, authType:"api_key" },
  { id:"meta", name:"Meta Ads", category:"advertising", status:"connected", icon:"meta", lastSync:"2026-07-26T09:30:00Z", adSpend:12840, errorRate:0.0, authType:"oauth2" },
  { id:"google_ads", name:"Google Ads", category:"advertising", status:"connected", icon:"google_ads", lastSync:"2026-07-26T09:30:00Z", adSpend:8420, errorRate:0.001, authType:"oauth2" },
  { id:"tableau", name:"Tableau", category:"bi", status:"disconnected", icon:"tableau", lastSync:null, errorRate:null, authType:"api_key" },
  { id:"powerbi", name:"Power BI", category:"bi", status:"pending", icon:"powerbi", lastSync:null, errorRate:null, authType:"oauth2" },
  { id:"segment", name:"Segment", category:"cdp", status:"connected", icon:"segment", lastSync:"2026-07-26T10:02:00Z", eventsToday:8420, errorRate:0.0, authType:"write_key" },
];

const REPORTS = [
  { id:"r1", name:"Weekly Revenue Dashboard", integrationId:"looker", format:"pdf", schedule:"weekly", lastGenerated:"2026-07-21T08:00:00Z", recipients:["ceo@brand.com","finance@brand.com"], status:"active" },
  { id:"r2", name:"Meta Ads Performance", integrationId:"meta", format:"csv", schedule:"daily", lastGenerated:"2026-07-26T09:00:00Z", recipients:["marketing@brand.com"], status:"active" },
  { id:"r3", name:"Klaviyo Campaign Summary", integrationId:"klaviyo", format:"pdf", schedule:"weekly", lastGenerated:"2026-07-21T09:00:00Z", recipients:["email@brand.com"], status:"active" },
];

class ReportingIntegrationsEngine {
  getIntegrations(opts={}) {
    let i = INTEGRATIONS;
    if (opts.category) i = i.filter(x => x.category === opts.category);
    if (opts.status) i = i.filter(x => x.status === opts.status);
    return i;
  }
  getIntegration(id) { return INTEGRATIONS.find(i => i.id === id) || null; }
  getReports() { return REPORTS; }
  syncIntegration(id) {
    const i = this.getIntegration(id);
    if (!i) return { error: "Integration not found" };
    return { integrationId: id, status: "syncing", startedAt: new Date().toISOString(), estimatedMs: 30000 };
  }
  getDashboardStats() {
    const connected = INTEGRATIONS.filter(i => i.status === "connected");
    return { totalIntegrations: INTEGRATIONS.length, connectedIntegrations: connected.length, scheduledReports: REPORTS.length, categoriesConnected: [...new Set(connected.map(i => i.category))].length };
  }
}
module.exports = new ReportingIntegrationsEngine();
module.exports.ReportingIntegrationsEngine = ReportingIntegrationsEngine;
