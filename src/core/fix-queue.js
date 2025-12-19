// src/core/fix-queue.js
// -------------------------------------
// AURA Fix Queue Core
// Stores actionable SEO issues queued from Content Health.
// -------------------------------------

const db = require("./db");
const { fetchPageMeta } = require("./fetchPageMeta");

// --------------------
// Tables + indexes
// --------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS fix_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    url TEXT NOT NULL,
    issues TEXT, -- JSON array of issue codes
    status TEXT NOT NULL DEFAULT 'open', -- open | done
    owner TEXT,
    notes TEXT,

    suggestedTitle TEXT,
    suggestedMetaDescription TEXT,
    suggestedH1 TEXT,
    lastSuggestedAt TEXT,

    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    doneAt TEXT
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_fix_queue_project_url
    ON fix_queue(projectId, url);

  CREATE INDEX IF NOT EXISTS idx_fix_queue_project_status
    ON fix_queue(projectId, status);

  CREATE INDEX IF NOT EXISTS idx_fix_queue_project_updated
    ON fix_queue(projectId, updatedAt);

  -- Audit trail for agencies
  CREATE TABLE IF NOT EXISTS fix_queue_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    fixQueueId INTEGER NOT NULL,
    actionType TEXT NOT NULL,         -- update | mark_done | auto_suggest | bulk_auto_suggest | apply_enqueue | dedupe
    updatedBy TEXT,                   -- from header x-aura-user
    actionAt TEXT NOT NULL,
    details TEXT                      -- JSON string
  );

  CREATE INDEX IF NOT EXISTS idx_fix_queue_audit_project
    ON fix_queue_audit(projectId, actionAt);

  CREATE INDEX IF NOT EXISTS idx_fix_queue_audit_item
    ON fix_queue_audit(projectId, fixQueueId, actionAt);

  -- Queue to "apply" suggestions to Framer (executed by a Framer plugin)
  CREATE TABLE IF NOT EXISTS framer_apply_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    fixQueueId INTEGER NOT NULL,
    url TEXT NOT NULL,
    field TEXT NOT NULL,              -- title | metaDescription | h1
    value TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',  -- open | applied | failed
    error TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    appliedAt TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_framer_apply_project_status
    ON framer_apply_queue(projectId, status, updatedAt);

  CREATE INDEX IF NOT EXISTS idx_framer_apply_project_url
    ON framer_apply_queue(projectId, url);
`);

function nowIso() {
  return new Date().toISOString();
}

function normaliseString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function safeIssues(value) {
  const list = Array.isArray(value) ? value : [];
  const cleaned = list
    .map((x) => normaliseString(x))
    .filter(Boolean)
    .map((x) => String(x).toUpperCase());
  return Array.from(new Set(cleaned));
}

function parseIssues(text) {
  if (!text) return [];
  try {
    const arr = JSON.parse(text);
    return safeIssues(arr);
  } catch {
    return [];
  }
}

function issueUnion(a, b) {
  return Array.from(new Set([...(safeIssues(a) || []), ...(safeIssues(b) || [])]));
}

function clampText(value, maxLen) {
  const s = normaliseString(value);
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function auditLog(projectId, fixQueueId, { actionType, updatedBy, details } = {}) {
  const now = nowIso();
  const aType = normaliseString(actionType) || "update";
  const who = normaliseString(updatedBy) || null;
  const payload = details ? JSON.stringify(details) : null;

  db.prepare(
    `
    INSERT INTO fix_queue_audit (
      projectId, fixQueueId, actionType, updatedBy, actionAt, details
    ) VALUES (?, ?, ?, ?, ?, ?)
  `
  ).run(projectId, Number(fixQueueId), aType, who, now, payload);

  return { ok: true };
}

function getCounts(projectId) {
  const rows = db
    .prepare(
      `
    SELECT status, COUNT(*) as c
    FROM fix_queue
    WHERE projectId = ?
    GROUP BY status
  `
    )
    .all(projectId);

  let open = 0;
  let done = 0;
  for (const r of rows) {
    if (r.status === "open") open = r.c || 0;
    if (r.status === "done") done = r.c || 0;
  }
  return { open, done, total: open + done };
}

function listFixQueue(projectId, { status = "open", limit = 200 } = {}) {
  const lim = Number(limit);
  const safeLimit = Number.isFinite(lim) ? Math.min(Math.max(lim, 1), 1000) : 200;

  let where = "projectId = ?";
  const params = [projectId];

  if (status && status !== "all") {
    where += " AND status = ?";
    params.push(status);
  }

  const rows = db
    .prepare(
      `
    SELECT *
    FROM fix_queue
    WHERE ${where}
    ORDER BY
      CASE status WHEN 'open' THEN 0 ELSE 1 END ASC,
      updatedAt DESC
    LIMIT ${safeLimit}
  `
    )
    .all(...params);

  const items = rows.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    url: r.url,
    issues: parseIssues(r.issues),
    status: r.status,
    owner: r.owner || null,
    notes: r.notes || null,

    suggestedTitle: r.suggestedTitle || null,
    suggestedMetaDescription: r.suggestedMetaDescription || null,
    suggestedH1: r.suggestedH1 || null,
    lastSuggestedAt: r.lastSuggestedAt || null,

    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    doneAt: r.doneAt || null,
  }));

  return { items, counts: getCounts(projectId) };
}

function addFixQueueItem(projectId, { url, issues } = {}) {
  const u = normaliseString(url);
  if (!u) throw new Error("url is required");

  const nextIssues = safeIssues(issues);
  const now = nowIso();

  const tx = db.transaction(() => {
    const existing = db
      .prepare(
        `
        SELECT id, issues, status
        FROM fix_queue
        WHERE projectId = ? AND url = ?
      `
      )
      .get(projectId, u);

    if (!existing) {
      db.prepare(
        `
        INSERT INTO fix_queue (
          projectId, url, issues, status,
          owner, notes,
          suggestedTitle, suggestedMetaDescription, suggestedH1, lastSuggestedAt,
          createdAt, updatedAt, doneAt
        ) VALUES (
          ?, ?, ?, 'open',
          NULL, NULL,
          NULL, NULL, NULL, NULL,
          ?, ?, NULL
        )
      `
      ).run(projectId, u, JSON.stringify(nextIssues), now, now);

      // no audit here (ingest can be noisy); keep clean
      return { created: true, updated: false };
    }

    const mergedIssues = issueUnion(parseIssues(existing.issues), nextIssues);

    // If it was marked done, re-open if re-queued
    const nextStatus = existing.status === "done" ? "open" : existing.status;

    db.prepare(
      `
      UPDATE fix_queue
      SET
        issues = ?,
        status = ?,
        updatedAt = ?,
        doneAt = CASE WHEN ? = 'done' THEN doneAt ELSE NULL END
      WHERE id = ?
    `
    ).run(JSON.stringify(mergedIssues), nextStatus, now, nextStatus, existing.id);

    return { created: false, updated: true };
  });

  const result = tx();
  return { ok: true, ...result };
}

function updateFixQueueItem(projectId, id, patch = {}, { updatedBy } = {}) {
  const itemId = Number(id);
  if (!Number.isFinite(itemId)) throw new Error("invalid id");

  const now = nowIso();

  const existing = db
    .prepare(
      `
      SELECT *
      FROM fix_queue
      WHERE projectId = ? AND id = ?
    `
    )
    .get(projectId, itemId);

  if (!existing) throw new Error("fix queue item not found");

  const nextOwner = clampText(patch.owner, 120);
  const nextNotes = clampText(patch.notes, 5000);

  let nextStatus = normaliseString(patch.status);
  if (nextStatus) nextStatus = nextStatus.toLowerCase();
  if (nextStatus && !["open", "done"].includes(nextStatus)) {
    throw new Error("status must be 'open' or 'done'");
  }

  const nextIssues = patch.issues !== undefined ? safeIssues(patch.issues) : null;

  const nextSuggestedTitle =
    patch.suggestedTitle !== undefined ? clampText(patch.suggestedTitle, 120) : null;
  const nextSuggestedMeta =
    patch.suggestedMetaDescription !== undefined
      ? clampText(patch.suggestedMetaDescription, 220)
      : null;
  const nextSuggestedH1 =
    patch.suggestedH1 !== undefined ? clampText(patch.suggestedH1, 140) : null;

  db.prepare(
    `
    UPDATE fix_queue
    SET
      owner = COALESCE(?, owner),
      notes = COALESCE(?, notes),

      status = COALESCE(?, status),
      doneAt = CASE
        WHEN COALESCE(?, status) = 'done' THEN COALESCE(doneAt, ?)
        ELSE NULL
      END,

      issues = CASE
        WHEN ? IS NULL THEN issues
        ELSE ?
      END,

      suggestedTitle = CASE
        WHEN ? IS NULL THEN suggestedTitle
        ELSE ?
      END,

      suggestedMetaDescription = CASE
        WHEN ? IS NULL THEN suggestedMetaDescription
        ELSE ?
      END,

      suggestedH1 = CASE
        WHEN ? IS NULL THEN suggestedH1
        ELSE ?
      END,

      lastSuggestedAt = CASE
        WHEN ? IS NULL THEN lastSuggestedAt
        ELSE ?
      END,

      updatedAt = ?
    WHERE projectId = ? AND id = ?
  `
  ).run(
    nextOwner,
    nextNotes,

    nextStatus,
    nextStatus,
    now,

    nextIssues ? "set" : null,
    nextIssues ? JSON.stringify(nextIssues) : null,

    nextSuggestedTitle ? "set" : null,
    nextSuggestedTitle,

    nextSuggestedMeta ? "set" : null,
    nextSuggestedMeta,

    nextSuggestedH1 ? "set" : null,
    nextSuggestedH1,

    patch.lastSuggestedAt !== undefined ? "set" : null,
    patch.lastSuggestedAt !== undefined ? now : null,

    now,
    projectId,
    itemId
  );

  // Audit
  const changedKeys = Object.keys(patch || {});
  if (changedKeys.length) {
    auditLog(projectId, itemId, {
      actionType: patch.status === "done" ? "mark_done" : "update",
      updatedBy,
      details: {
        changedKeys,
        patch: patch,
      },
    });
  }

  return { ok: true };
}

function bulkMarkDone(projectId, ids = [], { updatedBy } = {}) {
  const list = Array.isArray(ids) ? ids : [];
  const clean = list.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (!clean.length) return { ok: true, updated: 0 };

  const now = nowIso();

  const tx = db.transaction(() => {
    let updated = 0;
    const stmt = db.prepare(
      `
      UPDATE fix_queue
      SET status = 'done', doneAt = ?, updatedAt = ?
      WHERE projectId = ? AND id = ? AND status != 'done'
    `
    );

    for (const id of clean) {
      const res = stmt.run(now, now, projectId, id);
      updated += res.changes || 0;
      if (res.changes) {
        auditLog(projectId, id, {
          actionType: "mark_done",
          updatedBy,
          details: { via: "bulk", status: "done" },
        });
      }
    }
    return updated;
  });

  const updated = tx();
  return { ok: true, updated };
}

function dedupeFixQueue(projectId, { updatedBy } = {}) {
  const rows = db
    .prepare(
      `
      SELECT id, url, updatedAt
      FROM fix_queue
      WHERE projectId = ?
      ORDER BY datetime(updatedAt) DESC
    `
    )
    .all(projectId);

  const seen = new Set();
  const toDelete = [];

  for (const r of rows) {
    const key = String(r.url || "").trim();
    if (!key) continue;
    if (seen.has(key)) toDelete.push(r.id);
    else seen.add(key);
  }

  if (!toDelete.length) {
    return { ok: true, deleted: 0 };
  }

  const tx = db.transaction(() => {
    const stmt = db.prepare(`DELETE FROM fix_queue WHERE projectId = ? AND id = ?`);
    let deleted = 0;
    for (const id of toDelete) {
      const res = stmt.run(projectId, id);
      deleted += res.changes || 0;
    }
    return deleted;
  });

  const deleted = tx();

  auditLog(projectId, toDelete[0] || 0, {
    actionType: "dedupe",
    updatedBy,
    details: { deletedIds: toDelete, deleted },
  });

  return { ok: true, deleted };
}

function urlToPrettyName(url) {
  try {
    const u = new URL(url);
    const path = u.pathname || "/";
    const last = path.split("/").filter(Boolean).slice(-1)[0] || u.hostname;
    const name = last
      .replace(/[-_]+/g, " ")
      .replace(/\.(html|htm|php)$/i, "")
      .trim();
    return name ? name.replace(/^\w/, (c) => c.toUpperCase()) : u.hostname;
  } catch {
    return "Page";
  }
}

function trimToLen(str, max) {
  const s = String(str || "").trim();
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

async function openAiJson({ prompt, model }) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: "OPENAI_API_KEY not set" };

  const chosenModel = model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: chosenModel,
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are an SEO copywriter. Return STRICT JSON only. No markdown. Keys: title, metaDescription, h1. Title 45-60 chars. Meta 130-155 chars. Use UK English. No keyword stuffing.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return { ok: false, error: `OpenAI error ${res.status}: ${t || res.statusText}` };
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  const raw = String(text).trim();

  try {
    const parsed = JSON.parse(raw);
    return { ok: true, json: parsed };
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        const sliced = raw.slice(start, end + 1);
        const parsed = JSON.parse(sliced);
        return { ok: true, json: parsed };
      } catch {}
    }
    return { ok: false, error: "Failed to parse JSON from OpenAI" };
  }
}

async function autoFixItem(projectId, id, { brand, tone, market, updatedBy } = {}) {
  const itemId = Number(id);
  if (!Number.isFinite(itemId)) throw new Error("invalid id");

  const row = db
    .prepare(
      `
      SELECT *
      FROM fix_queue
      WHERE projectId = ? AND id = ?
    `
    )
    .get(projectId, itemId);

  if (!row) throw new Error("fix queue item not found");

  const url = row.url;
  const issues = parseIssues(row.issues);
  const prettyName = urlToPrettyName(url);

  const fetched = await fetchPageMeta(url);
  const currentTitle = fetched?.ok ? fetched.title || "" : "";
  const currentMeta = fetched?.ok ? fetched.metaDescription || "" : "";

  const b = normaliseString(brand) || "AURA Systems";
  const t = normaliseString(tone) || "Elevated, modern, UK English";
  const m = normaliseString(market) || "Worldwide";

  const prompt = [
    `URL: ${url}`,
    `Market: ${m}`,
    `Brand: ${b}`,
    `Tone: ${t}`,
    `Issues: ${issues.join(", ") || "unknown"}`,
    `Current title: ${currentTitle || "(missing)"}`,
    `Current meta: ${currentMeta || "(missing)"}`,
    "",
    "Write improved SEO fields for this page.",
    "Constraints:",
    "- Title: 45-60 chars",
    "- Meta description: 130-155 chars",
    "- H1: clear, human, matches intent",
    "- Prefer benefit-led language and clarity",
    "- Use UK English spelling",
    "",
    `If page topic is unclear, assume it is about: ${prettyName}`,
    "Return JSON only with keys title, metaDescription, h1.",
  ].join("\n");

  let suggestedTitle = "";
  let suggestedMetaDescription = "";
  let suggestedH1 = "";

  const ai = await openAiJson({ prompt });
  if (ai.ok && ai.json) {
    suggestedTitle = clampText(ai.json.title, 120) || "";
    suggestedMetaDescription = clampText(ai.json.metaDescription, 220) || "";
    suggestedH1 = clampText(ai.json.h1, 140) || "";
  } else {
    suggestedH1 = prettyName;
    suggestedTitle = trimToLen(`${prettyName} | ${b}`, 60);
    suggestedMetaDescription = trimToLen(
      `Explore ${prettyName} from ${b}. Clear details, key benefits and next steps — built for ${m}.`,
      155
    );
  }

  if (!suggestedH1) suggestedH1 = prettyName;
  if (!suggestedTitle) suggestedTitle = trimToLen(`${prettyName} | ${b}`, 60);
  if (!suggestedMetaDescription) {
    suggestedMetaDescription = trimToLen(
      `Explore ${prettyName} from ${b}. Practical details, benefits and next steps.`,
      155
    );
  }

  const now = nowIso();

  db.prepare(
    `
    UPDATE fix_queue
    SET
      suggestedTitle = ?,
      suggestedMetaDescription = ?,
      suggestedH1 = ?,
      lastSuggestedAt = ?,
      updatedAt = ?
    WHERE projectId = ? AND id = ?
  `
  ).run(
    suggestedTitle,
    suggestedMetaDescription,
    suggestedH1,
    now,
    now,
    projectId,
    itemId
  );

  auditLog(projectId, itemId, {
    actionType: "auto_suggest",
    updatedBy,
    details: {
      usedAi: !!(ai.ok && ai.json),
      market: m,
      issues,
    },
  });

  return {
    ok: true,
    id: itemId,
    url,
    suggestedTitle,
    suggestedMetaDescription,
    suggestedH1,
    lastSuggestedAt: now,
    usedAi: !!(ai.ok && ai.json),
  };
}

async function bulkAutoFix(projectId, ids = [], opts = {}) {
  const list = Array.isArray(ids) ? ids : [];
  const clean = list.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (!clean.length) return { ok: true, results: [], attempted: 0 };

  const results = [];
  for (const id of clean) {
    try {
      // mild throttle so you don’t spike meta fetch / OpenAI
      // eslint-disable-next-line no-await-in-loop
      const r = await autoFixItem(projectId, id, opts);
      results.push(r);
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 250));
    } catch (e) {
      results.push({
        ok: false,
        id,
        error: e?.message || "bulk auto-fix failed",
      });
    }
  }

  auditLog(projectId, clean[0], {
    actionType: "bulk_auto_suggest",
    updatedBy: opts.updatedBy,
    details: { ids: clean, attempted: clean.length, ok: results.filter((r) => r.ok).length },
  });

  return { ok: true, attempted: clean.length, results };
}

// --------------------
// Framer Apply Queue
// --------------------
function enqueueApplyToFramer(projectId, fixQueueId, { field, value, updatedBy } = {}) {
  const itemId = Number(fixQueueId);
  if (!Number.isFinite(itemId)) throw new Error("invalid id");

  const f = normaliseString(field);
  if (!f || !["title", "metaDescription", "h1"].includes(f)) {
    throw new Error("field must be one of: title, metaDescription, h1");
  }

  const v = clampText(value, 5000);
  if (!v) throw new Error("value is required");

  const row = db
    .prepare(
      `
      SELECT id, url
      FROM fix_queue
      WHERE projectId = ? AND id = ?
    `
    )
    .get(projectId, itemId);

  if (!row) throw new Error("fix queue item not found");

  const now = nowIso();

  db.prepare(
    `
    INSERT INTO framer_apply_queue (
      projectId, fixQueueId, url, field, value, status, error, createdAt, updatedAt, appliedAt
    ) VALUES (?, ?, ?, ?, ?, 'open', NULL, ?, ?, NULL)
  `
  ).run(projectId, itemId, row.url, f, v, now, now);

  auditLog(projectId, itemId, {
    actionType: "apply_enqueue",
    updatedBy,
    details: { target: "framer", field: f, valuePreview: v.slice(0, 140) },
  });

  return { ok: true };
}

function listApplyQueue(projectId, { status = "open", limit = 200 } = {}) {
  const lim = Number(limit);
  const safeLimit = Number.isFinite(lim) ? Math.min(Math.max(lim, 1), 1000) : 200;

  let where = "projectId = ?";
  const params = [projectId];

  if (status && status !== "all") {
    where += " AND status = ?";
    params.push(status);
  }

  const rows = db
    .prepare(
      `
      SELECT *
      FROM framer_apply_queue
      WHERE ${where}
      ORDER BY datetime(updatedAt) DESC
      LIMIT ${safeLimit}
    `
    )
    .all(...params);

  return {
    ok: true,
    items: rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      fixQueueId: r.fixQueueId,
      url: r.url,
      field: r.field,
      value: r.value,
      status: r.status,
      error: r.error || null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      appliedAt: r.appliedAt || null,
    })),
  };
}

function markApplyQueueItem(projectId, queueId, { status, error } = {}) {
  const qid = Number(queueId);
  if (!Number.isFinite(qid)) throw new Error("invalid queue id");

  const s = normaliseString(status);
  if (!s || !["applied", "failed"].includes(s)) {
    throw new Error("status must be 'applied' or 'failed'");
  }

  const now = nowIso();
  const err = clampText(error, 5000);

  const row = db
    .prepare(
      `
      SELECT *
      FROM framer_apply_queue
      WHERE projectId = ? AND id = ?
    `
    )
    .get(projectId, qid);

  if (!row) throw new Error("apply queue item not found");

  db.prepare(
    `
    UPDATE framer_apply_queue
    SET
      status = ?,
      error = ?,
      appliedAt = CASE WHEN ? = 'applied' THEN COALESCE(appliedAt, ?) ELSE appliedAt END,
      updatedAt = ?
    WHERE projectId = ? AND id = ?
  `
  ).run(s, err || null, s, now, now, projectId, qid);

  return { ok: true };
}

function getAudit(projectId, fixQueueId, { limit = 200 } = {}) {
  const itemId = Number(fixQueueId);
  if (!Number.isFinite(itemId)) throw new Error("invalid id");

  const lim = Number(limit);
  const safeLimit = Number.isFinite(lim) ? Math.min(Math.max(lim, 1), 1000) : 200;

  const rows = db
    .prepare(
      `
      SELECT *
      FROM fix_queue_audit
      WHERE projectId = ? AND fixQueueId = ?
      ORDER BY datetime(actionAt) DESC
      LIMIT ${safeLimit}
    `
    )
    .all(projectId, itemId);

  return {
    ok: true,
    items: rows.map((r) => ({
      id: r.id,
      projectId: r.projectId,
      fixQueueId: r.fixQueueId,
      actionType: r.actionType,
      updatedBy: r.updatedBy || null,
      actionAt: r.actionAt,
      details: r.details ? (() => { try { return JSON.parse(r.details); } catch { return r.details; } })() : null,
    })),
  };
}

module.exports = {
  listFixQueue,
  addFixQueueItem,
  updateFixQueueItem,
  bulkMarkDone,
  dedupeFixQueue,
  autoFixItem,
  bulkAutoFix,

  // Framer apply queue
  enqueueApplyToFramer,
  listApplyQueue,
  markApplyQueueItem,

  // Audit
  getAudit,
};
