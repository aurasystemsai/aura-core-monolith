const { getOpenAIClient } = require("../../core/openaiClient");
const crypto = require("crypto");

// Lazy init to avoid errors if key is missing in some environments
function getClient() {
  return getOpenAIClient();
}

async function analyzeAttribution(query, facts = {}) {
  const client = getClient();
  const context = Object.entries(facts)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join("\n");

  if (!client) {
    return `AI summary unavailable (missing OPENAI_API_KEY). Context: ${context}`;
  }

  const prompt = `You are an advanced analytics and attribution assistant. Analyze the query and return actionable insights, recommended attribution models, lift drivers, and next actions.\nContext:\n${context}\nQuery: ${query}`;
  const completion = await client.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are an expert analytics and attribution assistant." },
      { role: "user", content: prompt }
    ],
    max_tokens: 600
  });
  return completion.choices?.[0]?.message?.content || "No AI response";
}

function normalizeShopifyOrder(order = {}) {
  const {
    id,
    name,
    customer,
    total_price: total,
    subtotal_price: subtotal,
    currency,
    created_at: created,
    referring_site,
    landing_site,
    source_name,
    current_total_tax: tax,
    current_total_discounts: discounts,
    current_total_price: totalWithFees,
  } = order;

  return {
    id: String(id || name || crypto.randomUUID()),
    type: "conversion",
    channel: source_name || "shopify",
    source: referring_site || "direct",
    medium: landing_site || "unknown",
    value: Number(total || subtotal || 0),
    revenue: Number(totalWithFees || total || subtotal || 0),
    tax: Number(tax || 0),
    discounts: Number(discounts || 0),
    currency: currency || "USD",
    userId: customer?.id || customer?.email || null,
    timestamp: created ? new Date(created).toISOString() : new Date().toISOString(),
    raw: order,
  };
}

function normalizeAdEvent(event = {}, source = "ads") {
  return {
    id: String(event.id || event.event_id || crypto.randomUUID()),
    type: event.type || "click",
    channel: source,
    campaign: event.campaign || event.campaign_name || null,
    adset: event.adset || event.adset_name || null,
    creative: event.creative || event.creative_name || null,
    value: Number(event.value || event.revenue || 0),
    currency: event.currency || "USD",
    userId: event.user_id || event.user || null,
    timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
    raw: event,
  };
}

function normalizeOfflineEvent(evt = {}) {
  return {
    id: String(evt.id || crypto.randomUUID()),
    type: evt.type || "offline_conversion",
    channel: evt.channel || "offline",
    source: evt.source || "offline",
    value: Number(evt.value || 0),
    currency: evt.currency || "USD",
    userId: evt.userId || null,
    timestamp: evt.timestamp ? new Date(evt.timestamp).toISOString() : new Date().toISOString(),
    raw: evt,
  };
}

function ingestData({ shopifyOrders = [], adEvents = [], offlineEvents = [] } = {}) {
  const events = [];
  shopifyOrders.forEach(o => events.push(normalizeShopifyOrder(o)));
  adEvents.forEach(e => events.push(normalizeAdEvent(e, e.source || e.platform || "ads")));
  offlineEvents.forEach(e => events.push(normalizeOfflineEvent(e)));
  return events;
}

function summarizePerformance(events = []) {
  const summary = {};
  for (const e of events) {
    const key = e.channel || "unknown";
    summary[key] = summary[key] || { revenue: 0, count: 0 };
    summary[key].revenue += Number(e.revenue || e.value || 0);
    summary[key].count += 1;
  }
  return summary;
}

function buildJourneys(events = []) {
  const byUser = new Map();
  events.forEach((e) => {
    const uid = e.userId || "anon";
    if (!byUser.has(uid)) byUser.set(uid, []);
    byUser.get(uid).push(e);
  });
  const journeys = [];
  for (const [userId, evts] of byUser.entries()) {
    const sorted = evts.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    journeys.push({ userId, events: sorted, length: sorted.length, conversion: sorted.find((x) => x.type === "conversion") || null });
  }
  return journeys;
}

function simpleCohorts(events = [], key = "channel") {
  const cohorts = {};
  events.forEach((e) => {
    const k = e[key] || "unknown";
    cohorts[k] = cohorts[k] || { revenue: 0, count: 0 };
    cohorts[k].revenue += Number(e.revenue || e.value || 0);
    cohorts[k].count += 1;
  });
  return cohorts;
}

module.exports = {
  analyzeAttribution,
  ingestData,
  summarizePerformance,
  normalizeShopifyOrder,
  normalizeAdEvent,
  normalizeOfflineEvent,
  buildJourneys,
  simpleCohorts,
};
