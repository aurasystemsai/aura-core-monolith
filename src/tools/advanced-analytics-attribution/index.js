"use strict";

const { analyzeAttribution } = require("./analyticsAttributionService");

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
    const { query, model, events, options } = input;
    // If a query is provided, use the OpenAI-powered assistant for smart analysis
    if (query) {
      const insights = await analyzeAttribution(query);
      return { ok: true, insights };
    }
    // If events and a model are provided, run the attribution model
    if (Array.isArray(events) && model) {
      const models = require("./models");
      let result;
      switch (model) {
        case "first-touch":
          result = models.firstTouch(events);
          break;
        case "last-touch":
          result = models.lastTouch(events);
          break;
        case "linear":
          result = models.linearAttribution(events);
          break;
        case "time-decay":
          result = models.timeDecayAttribution(events, options?.halfLife);
          break;
        case "position-based":
          result = models.positionBasedAttribution(events);
          break;
        default:
          return { ok: false, error: `Unknown model: ${model}` };
      }
      return { ok: true, model, result };
    }
    return {
      ok: false,
      error: "No query or events/model provided."
    };
  },
};
