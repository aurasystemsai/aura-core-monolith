import { apiFetch } from '../api';

async function parseJson(resp) {
  const data = await resp.json();
  if (!resp.ok || data?.ok === false) {
    const error = data?.error || `HTTP ${resp.status}`;
    throw new Error(error);
  }
  return data;
}

export async function updateCopilotProfile(userId, profile) {
  const resp = await apiFetch('/api/advanced-ai/copilot/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, profile }),
  });
  return parseJson(resp);
}

export async function sendCopilotMessage(userId, message, context = {}) {
  const resp = await apiFetch('/api/advanced-ai/copilot/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, message, context }),
  });
  return parseJson(resp);
}

export async function fetchCopilotState(userId) {
  const params = new URLSearchParams({ userId });
  const resp = await apiFetch(`/api/advanced-ai/copilot/state?${params.toString()}`);
  return parseJson(resp);
}

export async function ingestRealtimeMetric(metric, value, meta = {}) {
  const resp = await apiFetch('/api/advanced-ai/realtime/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metric, value, meta }),
  });
  return parseJson(resp);
}

export async function fetchRealtimeStats(metric, windowMs) {
  const params = new URLSearchParams({ metric, ...(windowMs ? { windowMs } : {}) });
  const resp = await apiFetch(`/api/advanced-ai/realtime/stats?${params.toString()}`);
  return parseJson(resp);
}

export async function ingestAttributionEvent(event) {
  const resp = await apiFetch('/api/advanced-ai/attribution/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  return parseJson(resp);
}

export async function computeAttribution(params) {
  const query = new URLSearchParams(params);
  const resp = await apiFetch(`/api/advanced-ai/attribution/compute?${query.toString()}`);
  return parseJson(resp);
}

export async function logCompliance(record) {
  const resp = await apiFetch('/api/advanced-ai/compliance/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  return parseJson(resp);
}

export async function fetchComplianceReport(limit = 50) {
  const query = new URLSearchParams({ limit });
  const resp = await apiFetch(`/api/advanced-ai/compliance/report?${query.toString()}`);
  return parseJson(resp);
}

export async function createHitlTask(payload) {
  const resp = await apiFetch('/api/advanced-ai/hitl/task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return parseJson(resp);
}

export async function sendHitlFeedback(taskId, feedback) {
  const resp = await apiFetch('/api/advanced-ai/hitl/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, ...feedback }),
  });
  return parseJson(resp);
}

export async function finalizeHitlTask(taskId) {
  const resp = await apiFetch('/api/advanced-ai/hitl/finalize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId }),
  });
  return parseJson(resp);
}

export async function submitIdea(text) {
  const resp = await apiFetch('/api/advanced-ai/hitl/idea', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return parseJson(resp);
}

export async function voteIdea(id, delta = 1) {
  const resp = await apiFetch(`/api/advanced-ai/hitl/idea/${id}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ delta }),
  });
  return parseJson(resp);
}

export async function topIdeas(limit = 10) {
  const query = new URLSearchParams({ limit });
  const resp = await apiFetch(`/api/advanced-ai/hitl/ideas/top?${query.toString()}`);
  return parseJson(resp);
}

export async function registerWebhook(url, events = []) {
  const resp = await apiFetch('/api/advanced-ai/webhooks/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, events }),
  });
  return parseJson(resp);
}

export async function emitWebhook(event, payload = {}) {
  const resp = await apiFetch('/api/advanced-ai/webhooks/emit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, payload }),
  });
  return parseJson(resp);
}

export async function pollWebhookQueue(limit = 20) {
  const query = new URLSearchParams({ limit });
  const resp = await apiFetch(`/api/advanced-ai/webhooks/queue?${query.toString()}`);
  return parseJson(resp);
}
