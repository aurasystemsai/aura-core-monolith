// Validate that every registered tool module loads and exposes the registry contract.
const { toolsById, listTools, getTool } = require('./core/tools-registry.cjs');

const tools = listTools();
const failures = [];

for (const { id, name } of tools) {
  try {
    const tool = getTool(id);
    if (tool.meta.id !== id || typeof tool.run !== 'function') {
      failures.push(`${id} (${name}): expected matching meta.id and run(input, ctx)`);
    }
  } catch (error) {
    failures.push(`${id} (${name}): ${error.message}`);
  }
}

for (const [id, tool] of Object.entries(toolsById)) {
  if (!tool?.meta?.id || id !== tool.meta.id) {
    failures.push(`${id}: invalid registry entry`);
  }
}

console.log(`Registered tools: ${tools.length}`);
if (failures.length) {
  console.error(`Invalid tools: ${failures.length}`);
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('All registered tools loaded with valid metadata and run functions.');
}
