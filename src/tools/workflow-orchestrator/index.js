// src/tools/workflow-orchestrator/index.js
// ----------------------------------------
// Simple workflow definition (no real orchestration yet)
// ----------------------------------------

module.exports = {
  key: "workflow-orchestrator",
  name: "Workflow Orchestrator",

  async run(input = {}, ctx = {}) {
    const steps = Array.isArray(input.steps) ? input.steps : [];

    const normalised = steps.map((s, i) => ({
      id: s.id || `step-${i + 1}`,
      tool: s.tool || null,
      description: s.description || "",
    }));

    return {
      ok: true,
      tool: "workflow-orchestrator",
      steps: normalised,
      note:
        "This is a placeholder that normalises workflow steps. Orchestration is handled by your app logic.",
    };
  },
};
