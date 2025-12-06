// src/tools/ltv-churn-predictor/index.js
// --------------------------------------
// Very simple LTV & churn banding
// --------------------------------------

module.exports = {
  key: "ltv-churn-predictor",
  name: "LTV & Churn Predictor",

  async run(input = {}, ctx = {}) {
    const customers = Array.isArray(input.customers) ? input.customers : [];

    const scored = customers.map((c) => {
      const orders = Number(c.orders || 0);
      const ltv = Number(c.ltv || c.total_spent || 0);
      let tier = "new";

      if (orders >= 3 && ltv > 200) tier = "vip";
      else if (orders >= 2) tier = "repeat";
      else if (orders === 1) tier = "one-time";

      return { ...c, orders, ltv, tier };
    });

    return {
      ok: true,
      tool: "ltv-churn-predictor",
      customers: scored,
    };
  },
};
