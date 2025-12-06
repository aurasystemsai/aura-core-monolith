// src/tools/klaviyo-flow-automation/index.js
// ------------------------------------------
// Returns basic Klaviyo-style flow metadata
// ------------------------------------------

module.exports = {
  key: "klaviyo-flow-automation",
  name: "Klaviyo Flow Automation",

  async run(input = {}, ctx = {}) {
    const flow = input.flow || "welcome";

    const triggers = {
      welcome: "Subscribed to newsletter",
      abandoned_cart: "Started checkout but did not purchase",
      post_purchase: "Placed order",
    };

    const trigger = triggers[flow] || triggers.welcome;

    return {
      ok: true,
      tool: "klaviyo-flow-automation",
      flow,
      trigger,
      note:
        "Use this metadata to configure a Klaviyo flow – this tool does not call Klaviyo directly.",
    };
  },
};
