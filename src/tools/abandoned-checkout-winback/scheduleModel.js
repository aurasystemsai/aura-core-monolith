// In-memory schedule model for winback flows
const schedules = {};
let nextId = 1;

function createSchedule(data) {
  const id = String(nextId++);
  const schedule = { id, ...data };
  schedules[id] = schedule;
  return schedule;
}
function listSchedules() {
  return Object.values(schedules);
}
function getSchedule(id) {
  return schedules[id] || null;
}
function updateSchedule(id, data) {
  if (!schedules[id]) return null;
  schedules[id] = { ...schedules[id], ...data };
  return schedules[id];
}
function deleteSchedule(id) {
  if (!schedules[id]) return false;
  delete schedules[id];
  return true;
}

module.exports = { createSchedule, listSchedules, getSchedule, updateSchedule, deleteSchedule };
