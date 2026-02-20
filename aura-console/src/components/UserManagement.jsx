import React, { useState, useEffect } from 'react';
import { apiFetch } from "../api";

export default function UserManagement({ coreUrl }) {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Removed local CSRF token state and effect (now handled globally)

  // Fetch users (admin only)
  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;
    fetch(`${coreUrl}/api/users/list`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) setUsers(data.users);
      })
      .catch(() => {});
  }, [coreUrl, success]);

  const handleRegister = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch(`${coreUrl}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, role })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setSuccess('User registered!');
      setEmail('');
      setPassword('');
      setRole('user');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 24, background: '#18181b', borderRadius: 12 }}>
      <h2 style={{ color: '#4f46e5' }}>User Management</h2>
      <form onSubmit={handleRegister} style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 12 }}>
          <label>Email<br />
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password<br />
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required style={{ width: '100%' }} />
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Role<br />
            <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%' }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>
        <button type="submit" style={{ width: '100%', background: '#4f46e5', color: '#18181b', fontWeight: 700, padding: 10, border: 0, borderRadius: 6 }}>Register User</button>
      </form>
      {error && <div style={{ color: 'salmon', marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ color: '#4f46e5', marginBottom: 12 }}>{success}</div>}
      <div style={{ marginTop: 32 }}>
        <h3 style={{ color: '#4f46e5', fontSize: 18 }}>All Users</h3>
        {users.length === 0 && <div style={{ color: 'var(--text-primary)', opacity: 0.7 }}>No users or not authorized.</div>}
        {users.length > 0 && (
          <table style={{ width: '100%', color: 'var(--text-primary)', background: 'var(--background-secondary)', borderRadius: 8, marginTop: 8 }}>
            <thead>
              <tr style={{ color: '#4f46e5' }}>
                <th style={{ textAlign: 'left', padding: 6 }}>Email</th>
                <th style={{ textAlign: 'left', padding: 6 }}>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.email}>
                  <td style={{ padding: 6 }}>{u.email}</td>
                  <td style={{ padding: 6 }}>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

