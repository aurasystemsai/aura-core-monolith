// src/tools/advanced-personalization-engine/rbac.js
// RBAC for Advanced Personalization Engine
const roles = {
  admin: ['manage_rules', 'view_analytics', 'manage_channels', 'export_audit'],
  manager: ['manage_rules', 'view_analytics'],
  viewer: ['view_analytics'],
};

function can(role, action) {
  return roles[role] && roles[role].includes(action);
}

module.exports = { can, roles };