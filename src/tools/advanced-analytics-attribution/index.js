"use strict";

const {
  analyzeAttribution,
  ingestData,
  summarizePerformance,
} = require("./analyticsAttributionService");

module.exports = {
  meta: {
    id: "advanced-analytics-attribution",
    name: "Advanced Analytics Attribution",
    category: "Analytics",
  },
  /**
   * Main entrypoint for the tool. Handles attribution queries and model selection.
   * @param {Object} input - { query, model, events, options }
   * @param {Object} ctx - request context
   */
  async run(input = {}, ctx = {}) {
    const { query, model, events, options, shopifyOrders, adEvents, offlineEvents } = input;

    // Ingest external sources into normalized events
    let unifiedEvents = Array.isArray(events) ? [...events] : [];
    if (shopifyOrders || adEvents || offlineEvents) {
      unifiedEvents = unifiedEvents.concat(
        ingestData({ shopifyOrders, adEvents, offlineEvents })
      );
    }
    // If a query is provided, use the OpenAI-powered assistant for smart analysis
    if (query) {
      const perf = summarizePerformance(unifiedEvents);
      const insights = await analyzeAttribution(query, { performance: perf, model });
      return { ok: true, insights, performance: perf };
    }
    // If events and a model are provided, run the attribution model
    if (Array.isArray(unifiedEvents) && unifiedEvents.length && model) {
      const models = require("./models");
      let result;
      switch (model) {
        case "first-touch":
          result = models.firstTouch(unifiedEvents);
          break;
        case "last-touch":
          result = models.lastTouch(unifiedEvents);
          break;
        case "linear":
          result = models.linearAttribution(unifiedEvents);
          break;
        case "time-decay":
          result = models.timeDecayAttribution(unifiedEvents, options?.halfLife);
          break;
        case "position-based":
          result = models.positionBasedAttribution(unifiedEvents);
          break;
        default:
          return { ok: false, error: `Unknown model: ${model}` };
      }
      const perf = summarizePerformance(unifiedEvents);
      return { ok: true, model, result, performance: perf };
    }
    return {
      ok: false,
      error: "No query or events/model provided."
    };
  },
};
