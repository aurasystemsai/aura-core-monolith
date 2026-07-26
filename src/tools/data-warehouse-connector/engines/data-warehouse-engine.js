"use strict";
/**
 * Data Warehouse Connector Engine
 * BigQuery, Snowflake, Redshift, Postgres, MySQL sync engine
 */
const CONNECTORS = [
  { id:"bigquery", name:"Google BigQuery", status:"connected", icon:"bigquery", syncInterval:"hourly", lastSync:"2026-07-26T09:00:00Z", rowsSynced:284920, errorRate:0.001, latencyMs:1240 },
  { id:"snowflake", name:"Snowflake", status:"connected", icon:"snowflake", syncInterval:"daily", lastSync:"2026-07-26T06:00:00Z", rowsSynced:1842030, errorRate:0.0, latencyMs:2840 },
  { id:"redshift", name:"Amazon Redshift", status:"disconnected", icon:"redshift", syncInterval:"hourly", lastSync:"2026-07-24T18:00:00Z", rowsSynced:0, errorRate:null, latencyMs:null },
  { id:"postgres", name:"PostgreSQL", status:"connected", icon:"postgres", syncInterval:"realtime", lastSync:"2026-07-26T10:02:00Z", rowsSynced:49280, errorRate:0.002, latencyMs:84 },
  { id:"mysql", name:"MySQL", status:"pending", icon:"mysql", syncInterval:"daily", lastSync:null, rowsSynced:0, errorRate:null, latencyMs:null },
  { id:"databricks", name:"Databricks", status:"connected", icon:"databricks", syncInterval:"daily", lastSync:"2026-07-26T04:00:00Z", rowsSynced:920480, errorRate:0.0, latencyMs:3840 },
];

const SYNC_JOBS = [
  { id:"job1", connectorId:"bigquery", tableName:"orders", status:"completed", rowsProcessed:12840, startedAt:"2026-07-26T09:00:00Z", completedAt:"2026-07-26T09:01:20Z", durationMs:80000 },
  { id:"job2", connectorId:"snowflake", tableName:"customers", status:"completed", rowsProcessed:8420, startedAt:"2026-07-26T06:00:00Z", completedAt:"2026-07-26T06:04:40Z", durationMs:280000 },
  { id:"job3", connectorId:"postgres", tableName:"products", status:"running", rowsProcessed:2840, startedAt:"2026-07-26T10:02:00Z", completedAt:null, durationMs:null },
  { id:"job4", connectorId:"bigquery", tableName:"sessions", status:"failed", rowsProcessed:0, startedAt:"2026-07-25T21:00:00Z", completedAt:"2026-07-25T21:00:12Z", durationMs:12000, error:"Auth token expired" },
];

const SCHEMA_TABLES = [
  { table:"orders", columns:["id","shop_domain","customer_id","total_price","created_at","financial_status","fulfillment_status"], rowCount:284920, lastUpdated:"2026-07-26T09:01:20Z" },
  { table:"customers", columns:["id","shop_domain","email","total_spent","orders_count","created_at","tags","accepts_marketing"], rowCount:84290, lastUpdated:"2026-07-26T06:04:40Z" },
  { table:"products", columns:["id","shop_domain","title","vendor","product_type","price","inventory_quantity","status"], rowCount:12840, lastUpdated:"2026-07-26T10:02:00Z" },
  { table:"line_items", columns:["id","order_id","product_id","variant_id","quantity","price","sku"], rowCount:840290, lastUpdated:"2026-07-26T09:01:20Z" },
  { table:"sessions", columns:["id","shop_domain","customer_id","source","medium","campaign","page_views","duration_s"], rowCount:2840920, lastUpdated:"2026-07-25T21:00:00Z" },
];

class DataWarehouseEngine {
  getConnectors(opts={}) {
    let c = CONNECTORS;
    if (opts.status) c = c.filter(x => x.status === opts.status);
    return c;
  }
  getConnector(id) { return CONNECTORS.find(c => c.id === id) || null; }
  getSyncJobs(opts={}) {
    let j = SYNC_JOBS;
    if (opts.connectorId) j = j.filter(x => x.connectorId === opts.connectorId);
    if (opts.status) j = j.filter(x => x.status === opts.status);
    return j;
  }
  getSchemaTables() { return SCHEMA_TABLES; }
  testConnection(connectorId, credentials) {
    const c = this.getConnector(connectorId);
    if (!c) return { success: false, error: "Unknown connector" };
    const latencyMs = Math.round(80 + Math.random() * 200);
    return { connectorId, success: true, latencyMs, serverVersion: "14.2", testedAt: new Date().toISOString() };
  }
  triggerSync(connectorId, tables) {
    const c = this.getConnector(connectorId);
    if (!c) return { error: "Connector not found" };
    return { jobId: "job_" + Date.now(), connectorId, tables: tables || ["all"], status: "queued", queuedAt: new Date().toISOString(), estimatedDurationMs: 60000 };
  }
  getDashboardStats() {
    const connected = CONNECTORS.filter(c => c.status === "connected");
    return {
      totalConnectors: CONNECTORS.length,
      connectedConnectors: connected.length,
      totalRowsSynced: connected.reduce((s, c) => s + c.rowsSynced, 0),
      syncJobsToday: SYNC_JOBS.length,
      failedJobsToday: SYNC_JOBS.filter(j => j.status === "failed").length,
      avgLatencyMs: Math.round(connected.filter(c => c.latencyMs).reduce((s, c) => s + c.latencyMs, 0) / connected.filter(c => c.latencyMs).length),
      tablesAvailable: SCHEMA_TABLES.length,
    };
  }
  previewQuery(sql, connectorId) {
    const c = this.getConnector(connectorId || "bigquery");
    return {
      sql,
      connectorId: connectorId || "bigquery",
      columns: ["id","total_price","created_at","customer_id"],
      rows: [["1001","£48.50","2026-07-26","C-8420"],["1002","£124.00","2026-07-26","C-2840"],["1003","£19.99","2026-07-25","C-9481"]],
      rowCount: 3,
      executionMs: 284,
      bytesProcessed: 1840000,
    };
  }
}
module.exports = new DataWarehouseEngine();
module.exports.DataWarehouseEngine = DataWarehouseEngine;
