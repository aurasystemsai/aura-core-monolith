// Product SEO Engine: RBAC module
const ROLE_PERMISSIONS = {
  admin: ["generate", "publish", "delete", "simulate"],
  editor: ["generate", "publish", "simulate"],
  viewer: ["simulate"],
};

function can(user, action) {
  const role = (user && user.role) || "viewer";
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(action);
}

module.exports = { can, ROLE_PERMISSIONS };
