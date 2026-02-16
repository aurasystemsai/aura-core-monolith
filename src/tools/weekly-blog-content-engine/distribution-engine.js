const crypto = require('crypto');

const plans = new Map();

function id(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function createPlan(payload = {}) {
  const planId = payload.planId || id('plan');
  const channels = payload.channels || defaultChannels();
  const plan = {
    planId,
    briefId: payload.briefId || id('brief'),
    topic: payload.topic || 'Weekly blog drop',
    channels,
    status: payload.status || 'draft',
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  plans.set(planId, plan);
  return plan;
}

function defaultChannels() {
  return [
    { channel: 'Blog', status: 'ready', owner: 'Content' },
    { channel: 'Email', status: 'in QA', owner: 'Lifecycle' },
    { channel: 'LinkedIn', status: 'queued', owner: 'Social' },
    { channel: 'Partners', status: 'draft', owner: 'Alliances' },
    { channel: 'Ads', status: 'pending', owner: 'Growth' },
  ];
}

function getPlan(id) {
  if (!plans.has(id)) throw new Error('Plan not found');
  return plans.get(id);
}

function listPlans() {
  return Array.from(plans.values());
}

function activateChannel(planId, channelName) {
  const plan = getPlan(planId);
  const channels = plan.channels.map((c) => (c.channel === channelName ? { ...c, status: 'ready', activatedAt: new Date().toISOString() } : c));
  const updated = { ...plan, channels, updatedAt: new Date().toISOString() };
  plans.set(planId, updated);
  return updated;
}

function readinessScore(plan) {
  const total = plan.channels.length;
  const ready = plan.channels.filter((c) => c.status === 'ready').length;
  const pct = total ? Math.round((ready / total) * 100) : 0;
  return { planId: plan.planId, readyPercent: pct, ready, total };
}

function scheduleWindow(planId, window = 'next_7_days') {
  const plan = getPlan(planId);
  return { planId, window, slots: plan.channels.map((c, idx) => ({ channel: c.channel, slot: `Day ${idx + 1}` })) };
}

function getStats() {
  return {
    totalPlans: plans.size,
    readyPlans: Array.from(plans.values()).filter((p) => readinessScore(p).readyPercent >= 80).length,
  };
}

module.exports = {
  createPlan,
  getPlan,
  listPlans,
  activateChannel,
  readinessScore,
  scheduleWindow,
  getStats,
};
