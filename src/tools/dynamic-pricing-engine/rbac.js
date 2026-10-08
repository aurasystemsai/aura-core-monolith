const ROLE_PERMISSIONS = {
  admin: ['pricing:*', 'analytics:read', 'settings:manage', 'team:manage'],
  manager: ['pricing:read', 'pricing:write', 'analytics:read'],
  analyst: ['pricing:read', 'analytics:read'],
  viewer: ['pricing:read', 'analytics:read'],
};

module.exports = {
  getRolePermissions: role => ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer,
  check: (user, action) => {
    const permissions = ROLE_PERMISSIONS[user?.role] || ROLE_PERMISSIONS.viewer;
    return permissions.includes(action) ||
      permissions.some(permission => permission.endsWith(':*') && action.startsWith(permission.slice(0, -1)));
  },
};
