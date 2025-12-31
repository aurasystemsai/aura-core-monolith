// RBAC for winback tool
const roles = {
  admin: ['manage_campaigns', 'view_analytics', 'manage_templates', 'manage_segments', 'manage_schedules', 'manage_webhooks', 'export_audit'],
  manager: ['manage_campaigns', 'view_analytics', 'manage_templates'],
  viewer: ['view_analytics'],
};

function can(role, action) {
  return roles[role] && roles[role].includes(action);
}

module.exports = { can, roles };
