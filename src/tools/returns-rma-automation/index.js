// src/tools/returns-rma-automation/index.js
// -----------------------------------------
// Generates a simple RMA record
// -----------------------------------------

function safe(v) {
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

module.exports = {
  key: "returns-rma-automation",
  name: "Returns & RMA Automation",

  async run(input = {}, ctx = {}) {
    const orderId = safe(input.order_id || input.order_number);
    const reason = safe(input.reason || "not specified");
    const customer = safe(input.customer_name);
    const email = safe(input.customer_email || "");

    const rmaId = `RMA-${Date.now().toString(36).toUpperCase()}`;

    return {
      ok: true,
      tool: "returns-rma-automation",
      rma_id: rmaId,
      order_id: orderId,
      customer_name: customer || null,
      customer_email: email || null,
      reason,
      status: "pending-review",
    };
  },
};
