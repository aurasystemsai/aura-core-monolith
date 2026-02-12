// Lightweight rule validation (stub)
const REQUIRED_FIELDS = ['name', 'scope', 'actions'];

const validateRule = (rule = {}) => {
  const errors = [];

  REQUIRED_FIELDS.forEach((field) => {
    if (rule[field] == null) errors.push(`${field} is required`);
  });

  if (rule.actions && !Array.isArray(rule.actions) && !rule.action) {
    errors.push('actions must be an array or provide action');
  }

  if (Array.isArray(rule.actions)) {
    rule.actions.forEach((action, idx) => {
      if (!action || !action.type) errors.push(`actions[${idx}].type is required`);
    });
  }

  return { valid: errors.length === 0, errors };
};

module.exports = { validateRule };
