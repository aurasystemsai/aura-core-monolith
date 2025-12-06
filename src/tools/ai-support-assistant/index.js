// src/tools/ai-support-assistant/index.js
// ---------------------------------------
// Suggest canned responses and macros (no AI)
// ---------------------------------------

function safe(val) {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

module.exports = {
  key: "ai-support-assistant",
  name: "AURA Support Assistant",

  async run(input = {}, ctx = {}) {
    const store = safe(input.store_name || input.brand);
    const customer = safe(input.customer_name);
    const issue = safe(input.issue_type || "general");
    const orderId = safe(input.order_id || input.order_number);
    const language = safe(input.lang || "en-GB");

    const baseGreeting = customer ? `Hi ${customer},` : "Hi there,";

    const templates = {
      shipping_delay: [
        `${baseGreeting}\n\nThanks for reaching out. I’ve checked your order ${orderId ||
          ""} and can see it’s still in transit. We’re really sorry for the delay.\n\nWe’ve nudged the carrier and expect an update within 24–48 hours. As soon as there’s movement, you’ll receive a tracking email automatically.\n\nBest,\n${store || "Support Team"}`,
      ],
      refund_request: [
        `${baseGreeting}\n\nThanks for your message. I’ve requested a refund for order ${orderId ||
          ""}. Depending on your bank, funds usually appear back in your account within 3–7 business days.\n\nIf there’s anything else we can do to help, just reply to this email.\n\nBest,\n${store || "Support Team"}`,
      ],
      product_question: [
        `${baseGreeting}\n\nThanks for your question about our product. Here are a few quick details:\n- Waterproof: yes – suitable for daily wear.\n- Hypoallergenic: nickel-free, safe for sensitive skin.\n- Warranty: 1-year guarantee against defects.\n\nIf you’d like help choosing the right option, reply with how you plan to use it and we’ll recommend our best pick.\n\nBest,\n${store || "Support Team"}`,
      ],
      general: [
        `${baseGreeting}\n\nThanks for contacting ${store || "our store"}. We’ve received your message and will get back to you within 24 business hours.\n\nBest,\n${store || "Support Team"}`,
      ],
    };

    const key = templates[issue] ? issue : "general";

    return {
      ok: true,
      tool: "ai-support-assistant",
      issue_type: key,
      language,
      suggestions: templates[key],
      meta: {
        store_name: store || null,
        customer_name: customer || null,
        order_id: orderId || null,
      },
    };
  },
};
