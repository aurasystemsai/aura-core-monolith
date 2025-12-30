// src/core/permissions.js
// Fine-grained RBAC permissions for Aura Core

const ROLES = ['admin', 'manager', 'user', 'viewer'];

// Define permissions for each role
const PERMISSIONS = {
  admin: [
    'user:manage',
    'project:manage',
    'content:manage',
    'settings:manage',
    'view:all',
  ],
  manager: [
    'project:manage',
    'content:manage',
    'view:all',
  ],
  user: [
    'content:create',
    'content:edit',
    'content:view',
    'project:view',
  ],
  viewer: [
    'content:view',
    'project:view',
  ],
};

function getPermissions(role) {
  return PERMISSIONS[role] || [];
}

function hasPermission(user, permission) {
  if (!user || !user.role) return false;
  if (user.role === 'admin') return true;
  return getPermissions(user.role).includes(permission);
}

module.exports = {
  ROLES,
  PERMISSIONS,
  getPermissions,
  hasPermission,
};
