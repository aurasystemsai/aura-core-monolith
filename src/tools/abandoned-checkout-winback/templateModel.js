// Template data model for Abandoned Checkout Winback
// In-memory for now; replace with DB integration later.

const templates = [];

function createTemplate(data) {
  const template = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
  templates.push(template);
  return template;
}

function listTemplates() {
  return templates;
}

function getTemplate(id) {
  return templates.find(t => t.id === id);
}

function updateTemplate(id, data) {
  const idx = templates.findIndex(t => t.id === id);
  if (idx === -1) return null;
  templates[idx] = { ...templates[idx], ...data };
  return templates[idx];
}

function deleteTemplate(id) {
  const idx = templates.findIndex(t => t.id === id);
  if (idx === -1) return false;
  templates.splice(idx, 1);
  return true;
}

module.exports = { createTemplate, listTemplates, getTemplate, updateTemplate, deleteTemplate };
