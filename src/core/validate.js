// src/core/validate.js

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isPlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function asString(v) {
  return typeof v === "string" ? v : String(v ?? "");
}

function validateApplyFixQueuePayload(payload) {
  // Required:
  // {
  //   projectId: string,
  //   url: string (https://...),
  //   field: "title"|"metaDescription"|"h1",
  //   value: string,
  //   meta?: object
  // }
  const errors = [];

  if (!isPlainObject(payload)) {
    return { ok: false, errors: ["payload must be an object"] };
  }

  const projectId = asString(payload.projectId).trim();
  const url = asString(payload.url).trim();
  const field = asString(payload.field).trim();
  const value = asString(payload.value);

  if (!isNonEmptyString(projectId)) errors.push("projectId is required");
  if (!isNonEmptyString(url)) errors.push("url is required");
  if (!/^https?:\/\//i.test(url)) errors.push("url must start with http(s)://");

  const allowedFields = ["title", "metaDescription", "h1"];
  if (!allowedFields.includes(field)) {
    errors.push(`field must be one of: ${allowedFields.join(", ")}`);
  }

  if (!isNonEmptyString(value)) errors.push("value is required");

  if (payload.meta !== undefined && !isPlainObject(payload.meta)) {
    errors.push("meta must be an object if provided");
  }

  return {
    ok: errors.length === 0,
    errors,
    cleaned: {
      projectId,
      url,
      field,
      value: value.trim(),
      meta: payload.meta && isPlainObject(payload.meta) ? payload.meta : undefined,
    },
  };
}

module.exports = {
  validateApplyFixQueuePayload,
  isPlainObject,
  isNonEmptyString,
};
