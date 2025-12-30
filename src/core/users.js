// src/core/users.js
// Simple user model and RBAC utilities for Aura Core

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { encrypt, decrypt } = require('./encryption');

const USERS_FILE = process.env.USERS_PATH || path.join(__dirname, '../../data/users.json');

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      // Decrypt sensitive fields
      return raw.map(u => ({
        ...u,
        email: u.email && u.email.iv ? decrypt(u.email) : u.email,
        password: u.password && u.password.iv ? decrypt(u.password) : u.password,
      }));
    }
  } catch (e) {
    console.error('[users] Failed to load users:', e);
  }
  return [];
}

function saveUsers(users) {
  try {
    // Encrypt sensitive fields
    const enc = users.map(u => ({
      ...u,
      email: typeof u.email === 'string' ? encrypt(u.email) : u.email,
      password: typeof u.password === 'string' ? encrypt(u.password) : u.password,
    }));
    fs.writeFileSync(USERS_FILE, JSON.stringify(enc, null, 2), 'utf8');
  } catch (e) {
    console.error('[users] Failed to save users:', e);
  }
}

function findUserByEmail(email) {
  const users = loadUsers();
  return users.find(u => u.email === email);
}

function createUser({ email, password, role = 'user' }) {
  if (!email || !password) throw new Error('email and password required');
  const users = loadUsers();
  if (users.find(u => u.email === email)) throw new Error('User already exists');
  const hash = bcrypt.hashSync(password, 10);
  const user = { email, password: hash, role };
  users.push(user);
  saveUsers(users);
  return user;
}

function checkPassword(user, password) {
  return bcrypt.compareSync(password, user.password);
}

function hasRole(user, role) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return user.role === role;
}

module.exports = {
  loadUsers,
  saveUsers,
  findUserByEmail,
  createUser,
  checkPassword,
  hasRole,
};
