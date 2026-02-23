module.exports = {
  key: "inbox-assistant",

  async run(input = {}, ctx = {}) {
    const env = (ctx.env && ctx.env.NODE_ENV) || "development";
    const body = (input.body || input.message || "").toLowerCase();

    const intents = [
      { id: "refund", keywords: ["refund", "return", "money back"] },
      { id: "shipping", keywords: ["shipping", "delivery", "tracking"] },
      { id: "product", keywords: ["broken", "defect", "issue", "problem"] },
    ];

    const intentMatch = intents.find((intent) =>
      intent.keywords.some((kw) => body.includes(kw))
    );

    const intent = intentMatch ? intentMatch.id : "general";
    const templates = {
      refund: "I'm sorry to hear you'd like a refund. I've initiated a return—please use the attached label.",
      shipping: "Thanks for reaching out. Your order is on the way—here's your tracking link: {{tracking}}.",
      product: "Thanks for flagging this. I'm escalating to our product team and will update you shortly.",
      general: "Thanks for contacting us. We received your message and will respond within one business day.",
    };

    const priority = intent === "product" ? "high" : intent === "refund" ? "medium" : "normal";

    return {
      ok: true,
      tool: "inbox-assistant",
      message: "Inbox message triaged.",
      environment: env,
      input,
      output: {
        intent,
        priority,
        replyTemplate: templates[intent],
        slaMinutes: priority === "high" ? 30 : priority === "medium" ? 120 : 240,
      },
    };
  },
  meta: { id: "inbox-assistant", name: "Inbox Assistant", description: "AI-powered unified inbox for customer communications." },
};
