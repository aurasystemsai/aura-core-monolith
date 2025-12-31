// Webhook management for Returns/RMA Automation
let webhooks = [];
module.exports = {
  registerWebhook({ url, event, secret }) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const hook = { id, url, event, secret };
    webhooks.push(hook);
    return hook;
  },
  listWebhooks({ event } = {}) {
    return event ? webhooks.filter(w => w.event === event) : webhooks;
  },
  deleteWebhook(id) {
    const idx = webhooks.findIndex(w => w.id === id);
    if (idx === -1) return false;
    webhooks.splice(idx, 1);
    return true;
  },
};
