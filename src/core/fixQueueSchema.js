// src/core/fixQueueSchema.js

const ALLOWED_FIELDS = [
  "title",
  "metaDescription",
  "h1",
  "canonical",
  "robots",
  "ogTitle",
  "ogDescription",
];

function validateFixQueueItem(input) {
  const errors = [];

  if (!input || typeof input !== "object") {
    return { ok: false, errors: ["payload must be an object"] };
  }

  const projectId = String(input.projectId || "").trim();
  const url = String(input.url || "").trim();
  const field = String(input.field || "").trim();
  const value = input.value;

  if (!projectId) errors.push("projectId is required");
  if (!url) errors.push("url is required");
  if (!field) errors.push("field is required");

  if (field && !ALLOWED_FIELDS.includes(field)) {
    errors.push(`field must be one of: ${ALLOWED_FIELDS.join(", ")}`);
  }

  if (value === undefined || value === null || String(value).trim() === "") {
    errors.push("value is required");
  }

  const priority = input.priority !== undefined ? Number(input.priority) : 3;
  if (Number.isNaN(priority) || priority < 1 || priority > 5) {
    errors.push("priority must be a number between 1 and 5");
  }

  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      projectId,
      url,
      field,
      value: String(value),
      platform: input.platform ? String(input.platform) : null,
      externalId: input.externalId ? String(input.externalId) : null,
      notes: input.notes ? String(input.notes) : null,
      requestedBy: input.requestedBy ? String(input.requestedBy) : "console",
      priority,
    },
  };
}

module.exports = {
  ALLOWED_FIELDS,
  validateFixQueueItem,
};
