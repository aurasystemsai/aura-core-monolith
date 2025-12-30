
const express = require('express');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser, checkPassword, hasRole } = require('../core/users');

const router = express.Router();
// List all users (admin only)
router.get('/list', requireAuth, requireRole('admin'), (req, res) => {
  const users = require('../core/users').loadUsers();
  // Do not expose password hashes
  const safeUsers = users.map(u => ({ email: u.email, role: u.role }));
  res.json({ ok: true, users: safeUsers });
});
// src/routes/users.js
// Basic user authentication and RBAC routes

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Register a new user (admin only)
router.post('/register', (req, res) => {
  const { email, password, role } = req.body || {};
  if (!email || !password) return res.status(400).json({ ok: false, error: 'email and password required' });
  // Only allow admin to create users (in production, check req.user.role)
  // For now, allow if no users exist
  const users = require('../core/users').loadUsers();
  if (users.length > 0 && (!req.user || req.user.role !== 'admin')) {
    return res.status(403).json({ ok: false, error: 'Only admin can create users' });
  }
  try {
    const user = createUser({ email, password, role });
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
    return res.status(401).json({ ok: false, error: 'Invalid credentials' });
  }
  const token = jwt.sign({ email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
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

// Example protected route
router.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

// Example admin-only route
router.get('/admin', requireAuth, requireRole('admin'), (req, res) => {
  res.json({ ok: true, message: 'Welcome, admin!' });
});

module.exports = router;
