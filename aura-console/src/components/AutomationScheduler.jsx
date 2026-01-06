import React, { useState, useEffect } from 'react';

// Placeholder for automation scheduling UI

export default function AutomationScheduler() {
  const [schedules, setSchedules] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'one-time',
    date: '',
    time: '',
    recurrence: 'daily',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [csrfToken, setCsrfToken] = useState('');

  // Load CSRF token
  useEffect(() => {
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => setCsrfToken(data.csrfToken || ''));
  }, []);

  // Load schedules from backend
  useEffect(() => {
    setLoading(true);
    fetch('/api/automation')
      .then(res => res.json())
      .then(data => {
        if (data.ok) setSchedules(data.schedules || []);
        else setError('Failed to load schedules');
      })
      .catch(() => setError('Failed to load schedules'))
      .finally(() => setLoading(false));
  }, []);

  function handleInput(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    fetch('/api/automation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'csrf-token': csrfToken
      },
      body: JSON.stringify(form),
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.schedule) {
          setSchedules(s => [...s, data.schedule]);
          setShowForm(false);
          setForm({ name: '', type: 'one-time', date: '', time: '', recurrence: 'daily' });
        } else {
          setError(data.error || 'Failed to save schedule');
        }
      })
      .catch(() => setError('Failed to save schedule'))
      .finally(() => setLoading(false));
  }

  function handleDelete(id) {
    setLoading(true);
    setError('');
    fetch(`/api/automation/${id}`, { method: 'DELETE', headers: { 'csrf-token': csrfToken } })
      .then(res => res.json())
      .then(data => {
        if (data.ok) setSchedules(s => s.filter(sch => sch.id !== id));
        else setError('Failed to delete schedule');
      })
      .catch(() => setError('Failed to delete schedule'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="automation-scheduler" style={{ background: 'var(--background-secondary)', color: 'var(--text-primary)', borderRadius: 16, padding: 32, maxWidth: 600, margin: '40px auto' }}>
      <h2 style={{ marginBottom: 24 }}>Automation Scheduling</h2>
      <button onClick={() => setShowForm(true)} style={{ marginBottom: 24, background: 'var(--button-primary-bg)', color: 'var(--button-primary-text)', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }} disabled={loading}>+ New Schedule</button>
      {error && <div style={{ color: '#ff4d4f', marginBottom: 16 }}>{error}</div>}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginBottom: 32, background: '#181f2a', padding: 24, borderRadius: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <label>Name: <input name="name" value={form.name} onChange={handleInput} required style={{ marginLeft: 8 }} /></label>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Type: 
              <select name="type" value={form.type} onChange={handleInput} style={{ marginLeft: 8 }}>
                <option value="one-time">One-time</option>
                <option value="recurring">Recurring</option>
              </select>
            </label>
          </div>
          {form.type === 'one-time' ? (
            <>
              <div style={{ marginBottom: 12 }}>
                <label>Date: <input type="date" name="date" value={form.date} onChange={handleInput} required /></label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Time: <input type="time" name="time" value={form.time} onChange={handleInput} required /></label>
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 12 }}>
                <label>Recurrence: 
                  <select name="recurrence" value={form.recurrence} onChange={handleInput}>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Time: <input type="time" name="time" value={form.time} onChange={handleInput} required /></label>
              </div>
            </>
          )}
          <button type="submit" style={{ background: 'var(--button-secondary-bg)', color: 'var(--button-secondary-text)', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }} disabled={loading}>Save</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: 12, background: 'var(--button-tertiary-bg)', color: 'var(--button-tertiary-text)', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }} disabled={loading}>Cancel</button>
        </form>
      )}
      <div>
        <h3>Scheduled Automations</h3>
        {loading ? (
          <div style={{ color: '#9ca3c7' }}>Loading…</div>
        ) : schedules.length === 0 ? (
          <div style={{ color: '#9ca3c7' }}>No automations scheduled yet.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {schedules.map(s => (
              <li key={s.id} style={{ background: '#181f2a', marginBottom: 12, borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span><b>{s.name}</b> — {s.type === 'one-time' ? `One-time on ${s.date} at ${s.time}` : `Recurring: ${s.recurrence} at ${s.time}`}</span>
                <button onClick={() => handleDelete(s.id)} style={{ background: 'var(--button-danger-bg)', color: 'var(--button-danger-text)', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 700, cursor: 'pointer', marginLeft: 16 }} disabled={loading}>Delete</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
