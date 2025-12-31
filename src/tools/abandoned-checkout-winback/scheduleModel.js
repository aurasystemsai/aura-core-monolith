// In-memory store for winback schedules
const schedules = [];

function createSchedule(data) {
  const schedule = { id: Date.now().toString(), ...data };
  schedules.push(schedule);
  return schedule;
}

function listSchedules() {
  return schedules;
}

function getSchedule(id) {
  return schedules.find(s => s.id === id);
}

function updateSchedule(id, data) {
  const idx = schedules.findIndex(s => s.id === id);
  if (idx === -1) return null;
  schedules[idx] = { ...schedules[idx], ...data };
  return schedules[idx];
}

function deleteSchedule(id) {
  const idx = schedules.findIndex(s => s.id === id);
  if (idx === -1) return false;
  schedules.splice(idx, 1);
  return true;
}

module.exports = {
  createSchedule,
  listSchedules,
  getSchedule,
  updateSchedule,
  deleteSchedule,
};
