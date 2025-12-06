// src/tools/finance-autopilot/index.js
// =====================================================
// AURA • Finance Autopilot
// Automates eCommerce financial insights, KPIs, and reports
// =====================================================

module.exports = {
  key: "finance-autopilot",

  async run(input = {}, ctx = {}) {
    try {
      const { store_name, revenue, expenses, period = "30d" } = input;

      // --- Basic validation ---
      if (!store_name || revenue === undefined || expenses === undefined) {
        return {
          ok: false,
          error:
            "Missing required fields: 'store_name', 'revenue', or 'expenses'.",
        };
      }

      // --- Financial logic ---
      const profit = revenue - expenses;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      // --- Mock insight generation ---
      const trend =
        profit > 0
          ? "Profitable — maintain cost discipline and scale marketing gradually."
          : "Negative margin — optimize ad spend and renegotiate supplier rates.";

      // --- Structured response ---
      return {
        ok: true,
        data: {
          store_name,
          period,
          revenue,
          expenses,
          profit,
          margin: `${margin.toFixed(2)}%`,
          insight: trend,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: err.message || "Finance Autopilot tool error",
      };
    }
  },
};
