// src/tools/customer-support-ai/index.js
// --------------------------------------
// Basic triage suggestions for tickets
// --------------------------------------

module.exports = {
  key: "customer-support-ai",
  name: "Customer Support AI",

  async run(input = {}, ctx = {}) {
    const channel = input.channel || "email";
    const priority = input.priority || "normal";

    const triageRules = [
      {
        label: "Potential chargeback risk",
        match: ["fraud", "unauthorised", "didn't order"],
      },
      {
        label: "Shipping delay",
        match: ["late", "delay", "tracking", "where is my order"],
      },
      {
        label: "Return / refund",
        match: ["refund", "return", "exchange"],
      },
    ];

    const text = String(input.message || "").toLowerCase();
    const tags = [];

    triageRules.forEach((rule) => {
      if (rule.match.some((m) => text.includes(m))) {
        tags.push(rule.label);
      }
    });

    if (!tags.length) tags.push("General enquiry");

    return {
      ok: true,
      tool: "customer-support-ai",
      channel,
      priority,
      tags,
    };
  },
};
