const crypto = require('crypto');

const calendars = new Map();

function id(prefix) {
  return `${prefix}-${crypto.randomBytes(4).toString('hex')}`;
}

function createCalendar(payload = {}) {
  const calendarId = payload.calendarId || id('cal');
  const weeks = payload.weeks || buildWeeks(payload.start || 'Week 1');
  const record = {
    calendarId,
    name: payload.name || 'Weekly Blog Calendar',
    start: payload.start || 'Week 1',
    cadence: payload.cadence || 'weekly',
    weeks,
    owner: payload.owner || 'Content Lead',
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  calendars.set(calendarId, record);
  return record;
}

function buildWeeks(startLabel = 'Week 1') {
  return Array.from({ length: 4 }).map((_, idx) => ({
    label: `${startLabel.replace(/Week\s*/i, 'Week ')}${idx + 1}`,
    posts: [
      { title: `Post ${idx + 1}A`, status: 'draft' },
      { title: `Post ${idx + 1}B`, status: 'planned' },
    ],
  }));
}

function getCalendar(id) {
  if (!calendars.has(id)) throw new Error('Calendar not found');
  return calendars.get(id);
}

function listCalendars() {
  return Array.from(calendars.values());
}

function updateWeek(id, weekLabel, updates = {}) {
  const cal = getCalendar(id);
  const weeks = cal.weeks.map((w) => (w.label === weekLabel ? { ...w, ...updates, updatedAt: new Date().toISOString() } : w));
  const updated = { ...cal, weeks, updatedAt: new Date().toISOString() };
  calendars.set(id, updated);
  return updated;
}

function readinessScore(id) {
  const cal = getCalendar(id);
  const totalPosts = cal.weeks.reduce((acc, w) => acc + (w.posts?.length || 0), 0);
  const ready = cal.weeks.reduce((acc, w) => acc + (w.posts || []).filter((p) => p.status === 'ready').length, 0);
  const pct = totalPosts ? Math.round((ready / totalPosts) * 100) : 0;
  return { calendarId: id, readyPercent: pct, totalPosts, ready }; // simple readiness
}

function getStats() {
  return {
    calendars: calendars.size,
    avgWeeks: calendars.size
      ? Math.round(Array.from(calendars.values()).reduce((acc, c) => acc + (c.weeks?.length || 0), 0) / calendars.size)
      : 0,
  };
}

module.exports = {
  createCalendar,
  getCalendar,
  listCalendars,
  updateWeek,
  readinessScore,
  getStats,
};
