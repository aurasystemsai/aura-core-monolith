// GDPR/CCPA compliance utilities for winback tool
const requests = [];

function requestDataExport(userId) {
  const req = { id: Date.now().toString(), userId, type: 'export', status: 'pending', timestamp: new Date().toISOString() };
  requests.push(req);
  return req;
}

function requestDataDelete(userId) {
  const req = { id: Date.now().toString(), userId, type: 'delete', status: 'pending', timestamp: new Date().toISOString() };
  requests.push(req);
  return req;
}

function listRequests({ userId, type } = {}) {
  let reqs = requests;
  if (userId) reqs = reqs.filter(r => r.userId === userId);
  if (type) reqs = reqs.filter(r => r.type === type);
  return reqs;
}

function updateRequestStatus(id, status) {
  const idx = requests.findIndex(r => r.id === id);
  if (idx === -1) return null;
  requests[idx].status = status;
  return requests[idx];
}

module.exports = {
  requestDataExport,
  requestDataDelete,
  listRequests,
  updateRequestStatus,
};
