// src/tools/email-automation-builder/index.js
// -------------------------------------------
// Simple flow blueprint generator
// -------------------------------------------

function safe(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

module.exports = {
  key: "email-automation-builder",
  name: "Email Automation Builder",

  async run(input = {}, ctx = {}) {
    const flowType = safe(input.flow_type || input.type || "welcome");
    const brand = safe(input.brand || input.store_name || "Brand");

    const flows = {
      welcome: [
        "Email 1: Welcome + brand story + key offer.",
        "Email 2: Social proof and bestsellers.",
        "Email 3: Objection handling and FAQ.",
        "Email 4: Last chance to use welcome discount.",
      ],
      abandoned_cart: [
        "Email 1: Friendly reminder with cart contents.",
        "Email 2: Social proof and urgency.",
        "Email 3: Final reminder + small incentive.",
      ],
      post_purchase: [
        "Email 1: Order confirmation and what to expect.",
        "Email 2: How to get the most from the product.",
        "Email 3: Review request.",
        "Email 4: Cross-sell or next-step offer.",
      ],
    };

    const key = flows[flowType] ? flowType : "welcome";

    return {
      ok: true,
      tool: "email-automation-builder",
      flow_type: key,
      brand,
      sequence: flows[key],
    };
  },
};
