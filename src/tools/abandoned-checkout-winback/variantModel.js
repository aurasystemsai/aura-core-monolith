// A/B Variant data model for Abandoned Checkout Winback
// In-memory for now; replace with DB integration later.

const variants = [];

function createVariant(data) {
  const variant = { id: Date.now().toString(), ...data, createdAt: new Date().toISOString() };
  variants.push(variant);
  return variant;
}

function listVariants() {
  return variants;
}

function getVariant(id) {
  return variants.find(v => v.id === id);
}

function updateVariant(id, data) {
  const idx = variants.findIndex(v => v.id === id);
  if (idx === -1) return null;
  variants[idx] = { ...variants[idx], ...data };
  return variants[idx];
}

function deleteVariant(id) {
  const idx = variants.findIndex(v => v.id === id);
  if (idx === -1) return false;
  variants.splice(idx, 1);
  return true;
}

module.exports = { createVariant, listVariants, getVariant, updateVariant, deleteVariant };
