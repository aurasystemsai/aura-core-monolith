module.exports = {
  key: "ltv-churn-predictor",
  meta: {
    id: 'ltv-churn-predictor',
    name: 'LTV/Churn Predictor',
    description: 'AI-powered customer lifetime value prediction and churn risk analysis.',
  },

  async run(input = {}, ctx = {}) {
    const env = (ctx.env && ctx.env.NODE_ENV) || "development";
    const orders = Number(input.orders || 0);
    const avgOrderValue = Number(input.avgOrderValue || 0);
    const daysSinceLastOrder = Number(input.daysSinceLastOrder || 0);
    const supportTickets = Number(input.supportTickets || 0);
    const emailEngagement = Number(input.emailEngagement || 0); // 0-100
    const nps = Number(input.nps || 0);

    // Simple weighted risk model
    const riskRaw =
      (daysSinceLastOrder / 90) * 0.35 +
      (supportTickets * 0.05) +
      (orders < 2 ? 0.15 : 0) +
      ((50 - Math.min(emailEngagement, 50)) / 50) * 0.2 +
      ((30 - Math.min(nps, 30)) / 30) * 0.1;

    const probability = Math.max(0, Math.min(riskRaw, 1));
    const segment = probability > 0.6 ? "high-risk" : probability > 0.35 ? "medium-risk" : "low-risk";

    return {
      ok: true,
      tool: "ltv-churn-predictor",
      message: "Churn risk calculated.",
      environment: env,
      input,
      output: {
        churnProbability: Number((probability * 100).toFixed(1)),
        segment,
        signals: {
          orders,
          avgOrderValue,
          daysSinceLastOrder,
          supportTickets,
          emailEngagement,
          nps,
        },
      },
    };
  },
};
