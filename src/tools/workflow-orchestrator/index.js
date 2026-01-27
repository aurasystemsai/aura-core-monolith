const { randomUUID } = require("crypto");
const pluginSystem = require("./pluginSystem");
const webhookModel = require("./webhookModel");
const notificationModel = require("./notificationModel");

const key = "workflow-orchestrator";
const meta = {
  id: key,
  name: "Workflow Orchestrator",
  description: "Executes multi-step automation workflows with guardrails and notifications.",
};

async function executeStep(step, ctx) {
  const startedAt = Date.now();
  let status = "succeeded";
  let output;

  try {
    switch (step.type) {
      case "webhook":
        output = await webhookModel.handle({
          payload: step.payload || step.input || {},
          headers: step.headers || {},
          secret: step.secret || ctx.webhookSecret,
        });
        break;
      case "notify":
        output = await notificationModel.send(
          step.to || ctx.defaultNotifyTarget || "ops@aura",
          step.message || "Workflow notification",
          { type: step.notificationType || "workflow", correlationId: ctx.correlationId }
        );
        break;
      case "plugin":
        output = await pluginSystem.run(
          step.plugins || [],
          step.payload || {},
          { ...ctx, correlationId: ctx.correlationId }
        );
        break;
      default:
        output = {
          ok: true,
          echo: step.payload || step.input || {},
          note: "No-op step executed",
        };
    }
  } catch (err) {
    status = "failed";
    output = { ok: false, error: err.message };
  }

  const finishedAt = Date.now();
  return {
    id: step.id || step.name || `step-${ctx.index + 1}`,
    type: step.type || "noop",
    status,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date(finishedAt).toISOString(),
    durationMs: finishedAt - startedAt,
    output,
  };
}

async function run(input = {}, ctx = {}) {
  const env = (ctx.env && ctx.env.NODE_ENV) || process.env.NODE_ENV || "development";
  const correlationId = input.correlationId || randomUUID();
  const steps = Array.isArray(input.steps) ? input.steps : [];
  const failFast = input.failFast !== false; // default true

  const executed = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i] || {};
    const result = await executeStep(step, {
      ...ctx,
      index: i,
      correlationId,
      webhookSecret: input.webhookSecret || ctx.webhookSecret,
      defaultNotifyTarget: input.defaultNotifyTarget || ctx.defaultNotifyTarget,
    });
    executed.push(result);
    if (failFast && result.status === "failed") break;
  }

  const completed = executed.length === steps.length && executed.every((s) => s.status === "succeeded");
  const halted = executed.some((s) => s.status === "failed");

  return {
    ok: completed,
    tool: key,
    environment: env,
    correlationId,
    summary: {
      totalSteps: steps.length,
      executedSteps: executed.length,
      completed,
      halted,
      failFast,
    },
    steps: executed,
  };
}

module.exports = { key, run, meta };
