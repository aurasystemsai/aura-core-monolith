// Plugin/extension system for Returns/RMA Automation
let plugins = [];
function registerPlugin(plugin) {
  plugins.push(plugin);
}
function listPlugins() {
  return plugins;
}
function runPlugins(hook, data) {
  for (const plugin of plugins) {
    if (typeof plugin[hook] === 'function') plugin[hook](data);
  }
}
module.exports = { registerPlugin, listPlugins, runPlugins };
