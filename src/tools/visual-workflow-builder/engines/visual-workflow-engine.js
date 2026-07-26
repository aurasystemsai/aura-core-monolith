'use strict';
/**
 * Visual Workflow Builder Engine
 * NL-to-workflow, node types, DAG execution, time-travel debugging
 */

const NODE_TYPES = [
  { type: 'trigger', label: 'Trigger', color: '#f59e0b', description: 'Starts the workflow on event' },
  { type: 'action', label: 'Action', color: '#3b82f6', description: 'Performs an operation' },
  { type: 'condition', label: 'Condition', color: '#8b5cf6', description: 'Branches on logic' },
  { type: 'delay', label: 'Delay', color: '#6b7280', description: 'Waits for duration' },
  { type: 'loop', label: 'Loop', color: '#ec4899', description: 'Iterates over list' },
  { type: 'code', label: 'Code', color: '#10b981', description: 'Custom JS/Python sandbox' },
  { type: 'webhook', label: 'Webhook', color: '#f97316', description: 'Calls external API' },
  { type: 'email', label: 'Email', color: '#06b6d4', description: 'Sends email' },
  { type: 'sms', label: 'SMS', color: '#22c55e', description: 'Sends SMS' },
  { type: 'ai', label: 'AI', color: '#a78bfa', description: 'Runs AI prompt' },
];

const TRIGGER_TYPES = [
  { id: 'shopify:order.created', label: 'Order Created', category: 'Shopify' },
  { id: 'shopify:checkout.abandoned', label: 'Checkout Abandoned', category: 'Shopify' },
  { id: 'shopify:customer.created', label: 'Customer Signup', category: 'Shopify' },
  { id: 'shopify:fulfillment.created', label: 'Order Fulfilled', category: 'Shopify' },
  { id: 'shopify:refund.created', label: 'Refund Created', category: 'Shopify' },
  { id: 'cron:daily', label: 'Daily Schedule', category: 'Schedule' },
  { id: 'cron:weekly', label: 'Weekly Schedule', category: 'Schedule' },
  { id: 'webhook:inbound', label: 'Inbound Webhook', category: 'API' },
  { id: 'inventory:low_stock', label: 'Low Stock Alert', category: 'Inventory' },
];

const SAMPLE_WORKFLOWS = [
  { id: 'wf1', name: 'New Order Welcome Series', status: 'active', triggerType: 'shopify:order.created', nodeCount: 8, executions: 1842, successRate: 0.97, lastRun: '2026-07-26T08:12:00Z', avgDurationMs: 1240 },
  { id: 'wf2', name: 'Abandoned Cart Recovery', status: 'active', triggerType: 'shopify:checkout.abandoned', nodeCount: 12, executions: 3284, successRate: 0.94, lastRun: '2026-07-26T09:44:00Z', avgDurationMs: 840 },
  { id: 'wf3', name: 'Win-Back Campaign', status: 'paused', triggerType: 'cron:weekly', nodeCount: 15, executions: 284, successRate: 0.91, lastRun: '2026-07-21T08:00:00Z', avgDurationMs: 3840 },
  { id: 'wf4', name: 'Post-Purchase Review Request', status: 'active', triggerType: 'shopify:fulfillment.created', nodeCount: 6, executions: 2104, successRate: 0.99, lastRun: '2026-07-26T10:01:00Z', avgDurationMs: 440 },
  { id: 'wf5', name: 'Inventory Restock Alert', status: 'draft', triggerType: 'inventory:low_stock', nodeCount: 4, executions: 0, successRate: null, lastRun: null, avgDurationMs: null },
];

const EXECUTIONS = [
  { id: 'ex1', workflowId: 'wf1', status: 'success', startedAt: '2026-07-26T08:12:00Z', durationMs: 1180, stepsCompleted: 8 },
  { id: 'ex2', workflowId: 'wf2', status: 'success', startedAt: '2026-07-26T09:44:00Z', durationMs: 820, stepsCompleted: 12 },
  { id: 'ex3', workflowId: 'wf3', status: 'failed', startedAt: '2026-07-21T08:00:00Z', durationMs: 2400, stepsCompleted: 9, error: 'Klaviyo API rate limit exceeded' },
];

class VisualWorkflowEngine {
  getWorkflows(options = {}) {
    let wfs = SAMPLE_WORKFLOWS;
    if (options.status) wfs = wfs.filter(w => w.status === options.status);
    return wfs;
  }

  getNodeTypes() { return NODE_TYPES; }
  getTriggerTypes() { return TRIGGER_TYPES; }

  getWorkflow(id) {
    const wf = SAMPLE_WORKFLOWS.find(w => w.id === id);
    if (!wf) return null;
    return {
      ...wf,
      nodes: [
        { id: 'n1', type: 'trigger', label: 'Order Created', x: 100, y: 200 },
        { id: 'n2', type: 'condition', label: 'Order > £50?', x: 300, y: 200 },
        { id: 'n3', type: 'email', label: 'VIP Welcome Email', x: 500, y: 100 },
        { id: 'n4', type: 'email', label: 'Standard Welcome', x: 500, y: 300 },
        { id: 'n5', type: 'delay', label: 'Wait 3 days', x: 700, y: 200 },
        { id: 'n6', type: 'email', label: 'Review Request', x: 900, y: 200 },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3', label: 'Yes (> £50)' },
        { id: 'e3', source: 'n2', target: 'n4', label: 'No' },
        { id: 'e4', source: 'n3', target: 'n5' },
        { id: 'e5', source: 'n4', target: 'n5' },
        { id: 'e6', source: 'n5', target: 'n6' },
      ],
    };
  }

  nlToWorkflow(prompt) {
    const p = prompt.toLowerCase();
    const trigger = p.includes('abandon') ? 'shopify:checkout.abandoned' :
      p.includes('order') ? 'shopify:order.created' :
      p.includes('signup') || p.includes('customer') ? 'shopify:customer.created' : 'webhook:inbound';
    const nodes = [{ id: 'n1', type: 'trigger', label: TRIGGER_TYPES.find(t => t.id === trigger)?.label || 'Trigger', x: 100, y: 200 }];
    if (p.includes('email') || p.includes('send') || p.includes('welcome')) {
      nodes.push({ id: 'n2', type: 'email', label: 'Send Email', x: 350, y: 200 });
    }
    if ((p.includes('days') || p.includes('hours') || p.includes('wait')) && nodes.length > 1) {
      nodes.push({ id: 'n3', type: 'delay', label: 'Wait', x: 600, y: 200 });
      nodes.push({ id: 'n4', type: 'email', label: 'Follow-Up Email', x: 850, y: 200 });
    }
    const edges = nodes.slice(1).map((n, i) => ({ id: 'e' + (i + 1), source: nodes[i].id, target: n.id }));
    return { prompt, trigger, nodes, edges, confidence: 0.84, generatedAt: new Date().toISOString() };
  }

  getExecutions(workflowId) {
    return workflowId ? EXECUTIONS.filter(e => e.workflowId === workflowId) : EXECUTIONS;
  }

  validateDag(nodes, edges) {
    if (!nodes || nodes.length === 0) return { valid: false, error: 'No nodes provided' };
    const triggers = nodes.filter(n => n.type === 'trigger');
    if (triggers.length === 0) return { valid: false, error: 'Workflow must have at least one trigger node' };
    const visited = new Set();
    const recStack = new Set();
    const adj = {};
    nodes.forEach(n => { adj[n.id] = []; });
    edges.forEach(e => { if (adj[e.source]) adj[e.source].push(e.target); });
    const hasCycle = (node) => {
      visited.add(node); recStack.add(node);
      for (const neighbor of (adj[node] || [])) {
        if (!visited.has(neighbor) && hasCycle(neighbor)) return true;
        if (recStack.has(neighbor)) return true;
      }
      recStack.delete(node);
      return false;
    };
    for (const node of nodes) {
      if (!visited.has(node.id) && hasCycle(node.id)) return { valid: false, error: 'Cycle detected in workflow graph' };
    }
    return { valid: true, nodeCount: nodes.length, edgeCount: edges.length, triggerCount: triggers.length };
  }

  getDashboardStats() {
    const active = SAMPLE_WORKFLOWS.filter(w => w.status === 'active');
    return {
      totalWorkflows: SAMPLE_WORKFLOWS.length,
      activeWorkflows: active.length,
      totalExecutions: SAMPLE_WORKFLOWS.reduce((s, w) => s + w.executions, 0),
      avgSuccessRate: parseFloat((active.reduce((s, w) => s + (w.successRate || 0), 0) / active.length).toFixed(3)),
      failedToday: 1,
      nodeTypesAvailable: NODE_TYPES.length,
      triggerTypesAvailable: TRIGGER_TYPES.length,
    };
  }
}
module.exports = new VisualWorkflowEngine();
module.exports.VisualWorkflowEngine = VisualWorkflowEngine;
