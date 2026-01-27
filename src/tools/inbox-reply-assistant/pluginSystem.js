// Plugin system for Inbox Reply Assistant
async function run(plugins = [], payload = {}, ctx = {}) {
  const executions = [];
  let data = { ...payload };
  const startedAt = Date.now();

  for (const plugin of plugins) {
    if (!plugin) continue;
    const fn = typeof plugin === "function" ? plugin : plugin.run;
    if (typeof fn !== "function") continue;
    const start = Date.now();
    try {
      const result = await fn(data, ctx);
      if (result && result.merge) data = { ...data, ...result.merge };
      executions.push({ name: plugin.name || "plugin", status: "ok", durationMs: Date.now() - start, output: result });
    } catch (err) {
      executions.push({ name: plugin.name || "plugin", status: "error", durationMs: Date.now() - start, error: err.message });
      throw err;
    }
  }

  return { ok: true, data, executions, durationMs: Date.now() - startedAt };
}

module.exports = { run };