const request = require('supertest');
const express = require('express');
const path = require('path');
const os = require('os');
const fs = require('fs/promises');

// Use temp files so tests are isolated and do not touch real data
const flowsPath = path.join(os.tmpdir(), 'klaviyo-flows-test.json');
const approvalsPath = path.join(os.tmpdir(), 'klaviyo-approvals-test.json');
const metricsPath = path.join(os.tmpdir(), 'klaviyo-metrics-test.json');
const tracesPath = path.join(os.tmpdir(), 'klaviyo-traces-test.json');
const presencePath = path.join(os.tmpdir(), 'klaviyo-presence-test.json');
process.env.KLAVIYO_FLOWS_PATH = flowsPath;
process.env.KLAVIYO_APPROVALS_PATH = approvalsPath;
process.env.KLAVIYO_METRICS_PATH = metricsPath;
process.env.KLAVIYO_TRACE_PATH = tracesPath;
process.env.KLAVIYO_PRESENCE_PATH = presencePath;
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

const router = require('./router');
const db = require('./db');
const approvalsStore = require('./approvalsStore');
const metricsStore = require('./metricsStore');
const traceStore = require('./traceStore');
const presenceStore = require('./presenceStore');

const app = express();
app.use(express.json());
app.use('/api/klaviyo-flow-automation', router);

async function resetStores() {
  await fs.writeFile(flowsPath, '[]', 'utf8').catch(() => {});
  await fs.writeFile(approvalsPath, '[]', 'utf8').catch(() => {});
  await fs.writeFile(metricsPath, '[]', 'utf8').catch(() => {});
  await fs.writeFile(tracesPath, '[]', 'utf8').catch(() => {});
  await fs.writeFile(presencePath, '[]', 'utf8').catch(() => {});
  db.clear();
  approvalsStore.clear();
  metricsStore.clear();
  traceStore.clear();
  presenceStore.clear();
}

describe('Klaviyo Flow Automation - publish approvals', () => {
  beforeEach(async () => {
    await resetStores();
  });

  it('requires an approved request before publish', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .set('x-user-role', 'owner')
      .send({ name: 'Flow A' });
    expect(createRes.statusCode).toBe(200);
    const flowId = createRes.body.flow.id;

    const withoutApproval = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/publish`)
      .set('x-user-role', 'owner');

    expect(withoutApproval.statusCode).toBe(412);
    expect(withoutApproval.body.ok).toBe(false);

    const approval = approvalsStore.create({ flowId, requestedBy: 'alice', reason: 'Ready to go' });
    approvalsStore.updateStatus(approval.id, 'approved', 'approver-bob');

    const publishRes = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/publish`)
      .set('x-user-role', 'owner');

    expect(publishRes.statusCode).toBe(200);
    expect(publishRes.body.ok).toBe(true);
    expect(publishRes.body.approval).toBe(approval.id);
    expect(publishRes.body.flow.status).toBe('published');
    expect(publishRes.body.flow.id).toBe(flowId);
  });

  it('rejects publish for insufficient role even when approved', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .set('x-user-role', 'owner')
      .send({ name: 'Flow B' });
    const flowId = createRes.body.flow.id;

    const approval = approvalsStore.create({ flowId, requestedBy: 'alice', reason: 'Ship it' });
    approvalsStore.updateStatus(approval.id, 'approved', 'approver-bob');

    const publishRes = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/publish`)
      .set('x-user-role', 'viewer');

    expect(publishRes.statusCode).toBe(403);
    expect(publishRes.body.ok).toBe(false);
  });

  it('requires write role to rollback a version', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .set('x-user-role', 'owner')
      .send({ name: 'Flow C', actions: [{ id: 'a1' }] });
    const flowId = createRes.body.flow.id;

    // Snapshot a version
    await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/version`)
      .set('x-user-role', 'owner');

    // Attempt rollback as viewer
    const viewerRollback = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/rollback`)
      .send({ version: 1 })
      .set('x-user-role', 'viewer');

    expect(viewerRollback.statusCode).toBe(403);

    // Rollback with write permissions
    const ownerRollback = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/rollback`)
      .send({ version: 1 })
      .set('x-user-role', 'owner');

    expect(ownerRollback.statusCode).toBe(200);
    expect(ownerRollback.body.ok).toBe(true);
    expect(ownerRollback.body.flow.id).toBe(flowId);
  });

  it('supports approval request and status transitions over HTTP', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .set('x-user-role', 'owner')
      .send({ name: 'Flow D' });
    const flowId = createRes.body.flow.id;

    const requestRes = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'alice')
      .send({ reason: 'Need review' });

    expect(requestRes.statusCode).toBe(200);
    expect(requestRes.body.ok).toBe(true);
    const approvalId = requestRes.body.approval.id;

    const statusRes = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals/${approvalId}/status`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'bob')
      .send({ status: 'approved' });

    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.body.approval.status).toBe('approved');
    expect(statusRes.body.approval.actedBy).toBe('bob');

    const listRes = await request(app)
      .get(`/api/klaviyo-flow-automation/flows/${flowId}/approvals`)
      .set('x-user-role', 'approver');

    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.approvals)).toBe(true);
    expect(listRes.body.approvals[0].id).toBe(approvalId);
    expect(listRes.body.approvals[0].status).toBe('approved');
  });

  it('rejects publish when latest approval is rejected, then allows after re-approval', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .set('x-user-role', 'owner')
      .send({ name: 'Flow E' });
    const flowId = createRes.body.flow.id;

    const requestRes = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'alice')
      .send({ reason: 'first review' });

    const approvalId = requestRes.body.approval.id;

    await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals/${approvalId}/status`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'bob')
      .send({ status: 'rejected' });

    const rejectedPublish = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/publish`)
      .set('x-user-role', 'owner');

    expect(rejectedPublish.statusCode).toBe(412);

    // Re-approve
    await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals/${approvalId}/status`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'carol')
      .send({ status: 'approved' });

    const approvedPublish = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/publish`)
      .set('x-user-role', 'owner');

    expect(approvedPublish.statusCode).toBe(200);
    expect(approvedPublish.body.flow.status).toBe('published');
  });

  it('requires the most recent approval to be approved (pending supersedes prior approvals)', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .set('x-user-role', 'owner')
      .send({ name: 'Flow Latest Approval Gate' });
    const flowId = createRes.body.flow.id;

    // First approval approved
    const firstReq = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'alice')
      .send({ reason: 'Initial review' });
    const firstApprovalId = firstReq.body.approval.id;

    await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals/${firstApprovalId}/status`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'bob')
      .send({ status: 'approved' });

    const initialPublish = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/publish`)
      .set('x-user-role', 'owner');

    expect(initialPublish.statusCode).toBe(200);

    // New approval request arrives (pending) which should block publish
    const secondReq = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'carol')
      .send({ reason: 'Second review pass' });
    const secondApprovalId = secondReq.body.approval.id;

    const blockedPublish = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/publish`)
      .set('x-user-role', 'owner');

    expect(blockedPublish.statusCode).toBe(412);

    // Once the latest request is approved, publish should succeed again
    await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals/${secondApprovalId}/status`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'dave')
      .send({ status: 'approved' });

    const finalPublish = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/publish`)
      .set('x-user-role', 'owner');

    expect(finalPublish.statusCode).toBe(200);
    expect(finalPublish.body.approval).toBe(secondApprovalId);
  });

  it('resets approval ids after clear for deterministic behavior', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .set('x-user-role', 'owner')
      .send({ name: 'Flow Approval Reset' });
    const flowId = createRes.body.flow.id;

    const firstReq = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'alice')
      .send({ reason: 'first' });

    expect(firstReq.body.approval.id).toBe(1);

    approvalsStore.clear();

    const secondReq = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/approvals`)
      .set('x-user-role', 'approver')
      .set('x-user-id', 'bob')
      .send({ reason: 'second' });

    expect(secondReq.body.approval.id).toBe(1);
  });

  it('requires metrics role to record metrics and allows listing', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .set('x-user-role', 'owner')
      .send({ name: 'Flow Metrics' });
    const flowId = createRes.body.flow.id;

    const forbidden = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/metrics/record`)
      .send({ name: 'ctr', value: 0.12 });
    expect(forbidden.statusCode).toBe(403);

    const targetRes = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/metrics/targets`)
      .set('x-user-role', 'owner')
      .send({ name: 'ctr', target: 0.15 });
    if (targetRes.statusCode !== 200) console.error('targetRes', targetRes.body);
    expect(targetRes.statusCode).toBe(200);

    const recordRes = await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/metrics/record`)
      .set('x-user-role', 'owner')
      .send({ name: 'ctr', value: 0.1 });
    if (recordRes.statusCode !== 200) console.error('recordRes', recordRes.body);
    expect(recordRes.statusCode).toBe(200);

    const listRes = await request(app)
      .get(`/api/klaviyo-flow-automation/flows/${flowId}/metrics`)
      .set('x-user-role', 'owner');
    if (listRes.statusCode !== 200) console.error('listRes', listRes.body);
    expect(listRes.statusCode).toBe(200);
    expect(Array.isArray(listRes.body.metrics)).toBe(true);
    expect(listRes.body.summary.ctr).toBeDefined();
    expect(Array.isArray(listRes.body.rollup)).toBe(true);
  });

  it('returns traces for a flow run', async () => {
    const createRes = await request(app)
      .post('/api/klaviyo-flow-automation/flows')
      .set('x-user-role', 'owner')
      .send({ name: 'Flow Trace', nodes: [{ label: 'Send', type: 'action' }] });
    const flowId = createRes.body.flow.id;

    await request(app)
      .post(`/api/klaviyo-flow-automation/flows/${flowId}/test-run`)
      .set('x-user-role', 'owner');

    const tracesRes = await request(app)
      .get(`/api/klaviyo-flow-automation/flows/${flowId}/traces`)
      .query({ from: Date.now() - 60 * 1000 })
      .set('x-user-role', 'viewer');
    if (tracesRes.statusCode !== 200) console.error('tracesRes', tracesRes.body);

    expect(tracesRes.statusCode).toBe(200);
    expect(Array.isArray(tracesRes.body.traces)).toBe(true);
    expect(tracesRes.body.traces.length).toBeGreaterThan(0);
  });

  it('upserts and lists presence with RBAC', async () => {
    const resUpsert = await request(app)
      .post('/api/klaviyo-flow-automation/presence')
      .set('x-user-role', 'viewer')
      .set('x-user-id', 'user-1')
      .send({ flowId: 123, status: 'viewing', locale: 'fr' });

    expect(resUpsert.statusCode).toBe(200);
    expect(resUpsert.body.presence.user).toBe('user-1');
    expect(resUpsert.body.presence.flowId).toBe(123);

    const resList = await request(app)
      .get('/api/klaviyo-flow-automation/presence')
      .set('x-user-role', 'viewer');

    expect(resList.statusCode).toBe(200);
    expect(Array.isArray(resList.body.presence)).toBe(true);
    expect(resList.body.presence[0].user).toBe('user-1');
  });
});
