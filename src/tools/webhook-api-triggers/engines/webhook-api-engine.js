"use strict";
/**
 * Webhook & API Triggers Engine
 * Inbound/outbound webhooks, event subscriptions, delivery tracking
 */
const WEBHOOKS = [
  { id:"wh1", name:"Klaviyo Order Sync", direction:"outbound", event:"shopify/orders/create", endpoint:"https://a.klaviyo.com/api/events", status:"active", deliveriesTotal:28420, failureRate:0.002, lastDelivery:"2026-07-26T10:01:00Z", avgLatencyMs:184 },
  { id:"wh2", name:"Slack Inventory Alert", direction:"outbound", event:"aura/inventory/low_stock", endpoint:"https://hooks.slack.com/services/XXX", status:"active", deliveriesTotal:184, failureRate:0.0, lastDelivery:"2026-07-26T09:15:00Z", avgLatencyMs:240 },
  { id:"wh3", name:"Internal Order Processor", direction:"inbound", event:"shopify/orders/paid", endpoint:"/api/webhook-api-triggers/inbound/order-paid", status:"active", deliveriesTotal:12840, failureRate:0.001, lastDelivery:"2026-07-26T10:02:00Z", avgLatencyMs:48 },
  { id:"wh4", name:"Abandoned Cart ML Scoring", direction:"outbound", event:"shopify/checkouts/update", endpoint:"https://ml.internal/score-cart", status:"paused", deliveriesTotal:8420, failureRate:0.012, lastDelivery:"2026-07-24T18:00:00Z", avgLatencyMs:2840 },
  { id:"wh5", name:"ERP Purchase Order Sync", direction:"outbound", event:"aura/purchase_order/approved", endpoint:"https://erp.brand.com/api/webhooks", status:"active", deliveriesTotal:284, failureRate:0.0, lastDelivery:"2026-07-26T09:45:00Z", avgLatencyMs:420 },
];

const DELIVERY_LOG = [
  { id:"dl1", webhookId:"wh1", status:"delivered", statusCode:200, durationMs:182, timestamp:"2026-07-26T10:01:00Z" },
  { id:"dl2", webhookId:"wh3", status:"delivered", statusCode:200, durationMs:46, timestamp:"2026-07-26T10:02:00Z" },
  { id:"dl3", webhookId:"wh1", status:"failed", statusCode:429, durationMs:84, timestamp:"2026-07-26T09:44:00Z", error:"Rate limit exceeded", retried:true },
  { id:"dl4", webhookId:"wh5", status:"delivered", statusCode:201, durationMs:418, timestamp:"2026-07-26T09:45:00Z" },
];

const SHOPIFY_EVENTS = [
  "orders/create","orders/updated","orders/paid","orders/fulfilled","orders/cancelled",
  "checkouts/create","checkouts/update","customers/create","customers/update",
  "products/create","products/update","inventory_levels/update","refunds/create",
  "app/uninstalled",
];

class WebhookApiEngine {
  getWebhooks(opts={}) {
    let w = WEBHOOKS;
    if (opts.direction) w = w.filter(x => x.direction === opts.direction);
    if (opts.status) w = w.filter(x => x.status === opts.status);
    return w;
  }
  getWebhook(id) { return WEBHOOKS.find(w => w.id === id) || null; }
  getDeliveryLog(webhookId) { return webhookId ? DELIVERY_LOG.filter(d => d.webhookId === webhookId) : DELIVERY_LOG; }
  getShopifyEvents() { return SHOPIFY_EVENTS; }
  testWebhook(webhookId) {
    const wh = this.getWebhook(webhookId);
    if (!wh) return { error: "Webhook not found" };
    const latencyMs = Math.round(50 + Math.random() * 300);
    const success = Math.random() > 0.05;
    return { webhookId, testPayloadSent: true, responseCode: success ? 200 : 500, latencyMs, success, testedAt: new Date().toISOString() };
  }
  retryDelivery(deliveryId) {
    const d = DELIVERY_LOG.find(x => x.id === deliveryId);
    if (!d) return { error: "Delivery not found" };
    return { deliveryId, retryStatus: "queued", queuedAt: new Date().toISOString() };
  }
  getDashboardStats() {
    const active = WEBHOOKS.filter(w => w.status === "active");
    return {
      totalWebhooks: WEBHOOKS.length,
      activeWebhooks: active.length,
      outboundWebhooks: WEBHOOKS.filter(w => w.direction === "outbound").length,
      inboundWebhooks: WEBHOOKS.filter(w => w.direction === "inbound").length,
      deliveriesToday: DELIVERY_LOG.length,
      failedDeliveriesToday: DELIVERY_LOG.filter(d => d.status === "failed").length,
      avgLatencyMs: Math.round(active.reduce((s, w) => s + w.avgLatencyMs, 0) / active.length),
      shopifyEventsAvailable: SHOPIFY_EVENTS.length,
    };
  }
}
module.exports = new WebhookApiEngine();
module.exports.WebhookApiEngine = WebhookApiEngine;
