const key = "returns-rma-automation";
const meta = { id: key, name: "Returns/RMA Automation", description: "Automates returns and RMA processes." };

function assessReturn(input) {
  const orderAgeDays = Number(input.orderAgeDays || 0);
  const condition = (input.productCondition || "new").toLowerCase();
  const value = Number(input.orderValue || input.itemValue || 0);
  const isVip = !!input.vipCustomer;
  const reason = (input.reason || "").toLowerCase();

  const withinWindow = orderAgeDays <= 30;
  const goodCondition = !["damaged", "used-heavily"].includes(condition);
  const lowValue = value <= 300;
  const nonFraud = !reason.includes("fraud");

  const autoApprove = withinWindow && goodCondition && lowValue && nonFraud;
  const needsManual = !autoApprove && (reason.includes("damage") || value > 500);

  const restockingFee = condition === "opened" ? Math.min(0.1 * value, 25) : 0;
  const resolution = autoApprove ? "auto-approved" : needsManual ? "manual-review" : "conditional-approval";
  const labelUrl = autoApprove ? `https://returns.aura.local/label/${input.orderId || "pending"}` : null;

  return {
    orderAgeDays,
    condition,
    value,
    withinWindow,
    goodCondition,
    lowValue,
    nonFraud,
    autoApprove,
    needsManual,
    restockingFee,
    resolution,
    labelUrl,
  };
}

async function run(input = {}, ctx = {}) {
  const env = (ctx.env && ctx.env.NODE_ENV) || "development";
  const assessment = assessReturn(input);

  const steps = [
    { id: "intake", status: "done", detail: "Return request received" },
    { id: "screen", status: "done", detail: assessment.autoApprove ? "Passed auto-approval checks" : "Requires review" },
    { id: "label", status: assessment.autoApprove ? "done" : "pending", detail: assessment.labelUrl ? "Label issued" : "Awaiting agent" },
  ];

  return {
    ok: true,
    tool: key,
    message: assessment.autoApprove ? "Return auto-approved" : "Return staged for review",
    environment: env,
    input,
    output: {
      assessment,
      steps,
    },
  };
}

module.exports = { key, run, meta };
