// In-memory store for winback segments
const segments = [];

function createSegment(data) {
  const segment = { id: Date.now().toString(), ...data };
  segments.push(segment);
  return segment;
}

function listSegments() {
  return segments;
}

function getSegment(id) {
  return segments.find(s => s.id === id);
}

function updateSegment(id, data) {
  const idx = segments.findIndex(s => s.id === id);
  if (idx === -1) return null;
  segments[idx] = { ...segments[idx], ...data };
  return segments[idx];
}

function deleteSegment(id) {
  const idx = segments.findIndex(s => s.id === id);
  if (idx === -1) return false;
  segments.splice(idx, 1);
  return true;
}

module.exports = {
  createSegment,
  listSegments,
  getSegment,
  updateSegment,
  deleteSegment,
};
