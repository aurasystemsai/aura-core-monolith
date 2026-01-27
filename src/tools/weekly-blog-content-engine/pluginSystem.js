// Plugin system for Weekly Blog Content Engine
// Sequentially executes plugin functions and returns merged payload

async function runPlugins(plugins = [], payload = {}, ctx = {}) {
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
      executions.push({
        name: plugin.name || plugin.id || "plugin",
        status: "ok",
        durationMs: Date.now() - start,
        output: result,
      });
    } catch (err) {
      executions.push({
        name: plugin.name || plugin.id || "plugin",
        status: "error",
        durationMs: Date.now() - start,
        error: err.message,
      });
      throw err;
    }
  }

  return {
    ok: true,
    durationMs: Date.now() - startedAt,
    data,
    executions,
  };
}

module.exports = { run: runPlugins };