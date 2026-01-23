const ROLE_PERMISSIONS = {
  owner: ['read', 'write', 'delete', 'approve', 'publish', 'run', 'metrics'],
  editor: ['read', 'write', 'run', 'metrics'],
  approver: ['read', 'approve'],
  viewer: ['read'],
};

function check(role = 'viewer', action = 'read') {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(action);
}

function assert(role, action) {
  if (!check(role, action)) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}

module.exports = { check, assert };
