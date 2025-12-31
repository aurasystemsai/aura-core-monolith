// Modular utility for webhooks (winback tool)
const webhooks = [];

function registerWebhook({ url, event, secret }) {
  const hook = { id: Date.now().toString(), url, event, secret, createdAt: new Date().toISOString() };
  webhooks.push(hook);
  return hook;
}

function listWebhooks({ event } = {}) {
  let hooks = webhooks;
  if (event) hooks = hooks.filter(h => h.event === event);
  return hooks;
}

function deleteWebhook(id) {
  const idx = webhooks.findIndex(h => h.id === id);
  if (idx === -1) return false;
  webhooks.splice(idx, 1);
  return true;
}

module.exports = {
  registerWebhook,
  listWebhooks,
  deleteWebhook,
};
