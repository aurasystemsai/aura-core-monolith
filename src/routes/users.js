

const express = require('express');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser, checkPassword, hasRole } = require('../core/users');
const { hasPermission } = require('../core/permissions');

const router = express.Router();

// GDPR-compliant user data export
router.get('/export', requireAuth, requirePermission('user:manage'), (req, res) => {
  const users = require('../core/users').loadUsers();
  // Only export non-sensitive fields
  const exportUsers = users.map(u => ({
    email: u.email,
    role: u.role,
    createdAt: u.createdAt || null
  }));
  res.json(exportUsers);
});
// List all users (requires user:manage permission)
router.get('/list', requireAuth, requirePermission('user:manage'), (req, res) => {
  const users = require('../core/users').loadUsers();
  // Do not expose password hashes
  const safeUsers = users.map(u => ({ email: u.email, role: u.role }));
  res.json({ ok: true, users: safeUsers });
});
// src/routes/users.js
// Basic user authentication and RBAC routes

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Register a new user (requires user:manage permission)
const { logAudit } = require('../core/auditLog');
router.post('/register', requireAuth, requirePermission('user:manage'), (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'email and password required' });
  // Only allow admin to create users (in production, check req.user.role)
  // For now, allow if no users exist
  const users = require('../core/users').loadUsers();
  if (users.length > 0 && (!req.user || !hasPermission(req.user, 'user:manage'))) {
    return res.status(403).json({ ok: false, error: 'Only admin can create users' });
  }
  try {
    const user = createUser({ email, password, role });
    logAudit({ action: 'user_register', user: req.user?.email || 'system', target: email, details: { role } });
    res.json({ ok: true, user: { email: user.email, role: user.role } });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'email and password required' });
  const user = findUserByEmail(email);
  if (!user || !checkPassword(user, password)) {
    logAudit({ action: 'user_login_failed', user: email, target: null, details: { reason: 'Invalid credentials' } });
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }
  const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  logAudit({ action: 'user_login', user: email, target: null });
  res.json({ ok: true, token, user: { email: user.email, role: user.role } });
});

// Middleware to require authentication
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'Missing token' });
  try {
    const decoded = jwt.verify(auth.slice(7), JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid token' });
  }
}

// Middleware to require a specific role
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || !hasRole(req.user, role)) {
      return res.status(403).json({ ok: false, error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

// Middleware to require a specific permission
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !hasPermission(req.user, permission)) {
      return res.status(403).json({ ok: false, error: 'Forbidden: insufficient permission' });
    }
    next();
  };
}

// Example protected route
router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Example admin-only route (requires user:manage permission)
router.get('/admin', requireAuth, requirePermission('user:manage'), (req, res) => {
  res.json({ ok: true, message: 'Welcome, admin!' });
});

module.exports = router;
