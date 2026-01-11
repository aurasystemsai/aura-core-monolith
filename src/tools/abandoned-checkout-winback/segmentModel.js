// In-memory segment model for winback flows
const segments = {};
let nextId = 1;

function createSegment(data) {
  const id = String(nextId++);
  const segment = { id, ...data };
  segments[id] = segment;
  return segment;
}
function listSegments() {
  return Object.values(segments);
}
function getSegment(id) {
  return segments[id] || null;
}
function updateSegment(id, data) {
  if (!segments[id]) return null;
  segments[id] = { ...segments[id], ...data };
  return segments[id];
}
function deleteSegment(id) {
  if (!segments[id]) return false;
  delete segments[id];
  return true;
}

module.exports = { createSegment, listSegments, getSegment, updateSegment, deleteSegment };
