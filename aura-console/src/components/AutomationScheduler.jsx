import React, { useState } from 'react';

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

  function handleInput(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSchedules([...schedules, { ...form, id: Date.now() }]);
    setShowForm(false);
    setForm({ name: '', type: 'one-time', date: '', time: '', recurrence: 'daily' });
  }

  return (
    <div className="automation-scheduler" style={{ background: '#232b3b', color: '#f3f4f6', borderRadius: 16, padding: 32, maxWidth: 600, margin: '40px auto' }}>
      <h2 style={{ marginBottom: 24 }}>Automation Scheduling</h2>
      <button onClick={() => setShowForm(true)} style={{ marginBottom: 24, background: '#181f2a', color: '#f3f4f6', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, cursor: 'pointer' }}>+ New Schedule</button>
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
          <button type="submit" style={{ background: '#2d3748', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Save</button>
          <button type="button" onClick={() => setShowForm(false)} style={{ marginLeft: 12, background: '#444c5e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
        </form>
      )}
      <div>
        <h3>Scheduled Automations</h3>
        {schedules.length === 0 ? (
          <div style={{ color: '#9ca3c7' }}>No automations scheduled yet.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {schedules.map(s => (
              <li key={s.id} style={{ background: '#181f2a', marginBottom: 12, borderRadius: 8, padding: 16 }}>
                <b>{s.name}</b> — {s.type === 'one-time' ? `One-time on ${s.date} at ${s.time}` : `Recurring: ${s.recurrence} at ${s.time}`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
