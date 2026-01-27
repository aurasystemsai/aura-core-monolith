module.exports = {
  key: "customer-support-ai",

  async run(input = {}, ctx = {}) {
    const env = (ctx.env && ctx.env.NODE_ENV) || "development";
    const body = (input.body || input.message || "").toLowerCase();
    const channel = input.channel || "email";

    const intents = [
      { id: "billing", keywords: ["charge", "bill", "invoice", "payment"] },
      { id: "technical", keywords: ["error", "bug", "issue", "not working"] },
      { id: "shipping", keywords: ["shipping", "delivery", "tracking", "late"] },
      { id: "account", keywords: ["login", "password", "account"] },
    ];

    const intent =
      intents.find((i) => i.keywords.some((kw) => body.includes(kw)))?.id || "general";

    const macros = {
      billing: "I can help with billing. I've pulled up your invoice and will reverse any duplicate charges.",
      technical: "I'm sorry for the trouble. Could you share the error screenshot and steps you took? Meanwhile, I've opened an incident ticket.",
      shipping: "I've checked your order and refreshed the tracking. Here's the latest link: {{tracking}}.",
      account: "Let's get you back in. I've sent a password reset link and can also verify your account manually if needed.",
      general: "Thanks for reaching out. I'm routing this to the right team and will update you shortly.",
    };

    const priority = intent === "technical" ? "high" : intent === "billing" ? "medium" : "normal";

    return {
      ok: true,
      tool: "customer-support-ai",
      message: "Support request triaged and response suggested.",
      environment: env,
      input,
      output: {
        intent,
        priority,
        channel,
        replyTemplate: macros[intent],
        escalation: priority === "high",
      },
    };
  },
};
