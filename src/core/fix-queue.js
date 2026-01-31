// src/core/fix-queue.js
// -------------------------------------
// AURA Fix Queue Core
// Stores actionable SEO issues queued from Content Health.
// Adds: audit trail + bulk auto-fix jobs (server-side throttled),
//       job history listing, and "apply suggestion" via webhook (Framer-friendly).
// -------------------------------------

const crypto = require("crypto");
const db = require("./db");
const isPg = db.type === 'postgres';
const { fetchPageMeta } = require("./fetchPageMeta");

// ---------------------------
// Helpers
// ---------------------------

function nowIso() {
  return new Date().toISOString();
}

function normaliseString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function clampText(value, maxLen) {
  const s = normaliseString(value);
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
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
    const single = normaliseString(text);
    return single ? safeIssues([single]) : [];
  }
}

function issueUnion(a, b) {
  return Array.from(
    new Set([...(safeIssues(a) || []), ...(safeIssues(b) || [])])
  );
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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeJobId() {
  return `job_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function tableExists(name) {
  if (isPg) return false;
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`)
    .get(name);
  return !!row;
}

function getTableColumns(name) {
  if (isPg) return new Set();
  try {
    const cols = db.prepare(`PRAGMA table_info(${name})`).all();
    return new Set(cols.map((c) => c.name));
  } catch {
    return new Set();
  }
}

function safeExec(sql) {
  try {
    db.exec(sql);
  } catch (e) {
    console.warn("[FixQueue] schema exec warning:", e?.message || e);
  }
}

function jitter(ms, pct = 0.2) {
  const delta = ms * pct;
  const rand = (Math.random() * 2 - 1) * delta;
  return Math.max(0, Math.round(ms + rand));
}

function coerceNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// ---------------------------
// Schema + Migration
// ---------------------------

function ensureFixQueueSchema() {
  // ---- fix_queue main table ----
  safeExec(`
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
  `);

  safeExec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_fix_queue_project_url
      ON fix_queue(projectId, url);

    CREATE INDEX IF NOT EXISTS idx_fix_queue_project_status
      ON fix_queue(projectId, status);

    CREATE INDEX IF NOT EXISTS idx_fix_queue_project_updated
      ON fix_queue(projectId, updatedAt);
  `);

  // ---- fix_queue_audit ----
  if (!isPg) {
    if (!tableExists("fix_queue_audit")) {
      safeExec(`
        CREATE TABLE IF NOT EXISTS fix_queue_audit (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          projectId TEXT NOT NULL,
          itemId INTEGER,
          actionType TEXT NOT NULL,
          updatedBy TEXT,
          meta TEXT, -- JSON
          createdAt TEXT NOT NULL
        );
      `);
    } else {
      const cols = getTableColumns("fix_queue_audit");
      if (!cols.has("itemId")) {
        const tmp = `fix_queue_audit_legacy_${Date.now()}`;
        safeExec(`ALTER TABLE fix_queue_audit RENAME TO ${tmp};`);

        safeExec(`
          CREATE TABLE IF NOT EXISTS fix_queue_audit (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            projectId TEXT NOT NULL,
            itemId INTEGER,
            actionType TEXT NOT NULL,
            updatedBy TEXT,
            meta TEXT, -- JSON
            createdAt TEXT NOT NULL
          );
        `);

        const legacyCols = getTableColumns(tmp);
        const itemExpr = legacyCols.has("fixQueueId")
          ? "fixQueueId"
          : legacyCols.has("queueId")
          ? "queueId"
          : legacyCols.has("fix_queue_id")
          ? "fix_queue_id"
          : "NULL";

        const actionExpr = legacyCols.has("actionType") ? "actionType" : "'legacy'";
        const byExpr = legacyCols.has("updatedBy") ? "updatedBy" : "NULL";
        const metaExpr = legacyCols.has("meta") ? "meta" : "NULL";
        const createdExpr = legacyCols.has("createdAt")
          ? "createdAt"
          : `'${nowIso()}'`;

        safeExec(`
          INSERT INTO fix_queue_audit (projectId, itemId, actionType, updatedBy, meta, createdAt)
          SELECT
            projectId,
            ${itemExpr},
            ${actionExpr},
            ${byExpr},
            ${metaExpr},
            ${createdExpr}
          FROM ${tmp};
        `);

        safeExec(`DROP TABLE IF EXISTS ${tmp};`);
      }
    }
  }

  safeExec(`
    CREATE INDEX IF NOT EXISTS idx_fix_queue_audit_project_item
      ON fix_queue_audit(projectId, itemId);

    CREATE INDEX IF NOT EXISTS idx_fix_queue_audit_project_time
      ON fix_queue_audit(projectId, createdAt);
  `);

  // ---- Bulk jobs tables ----
  safeExec(`
    CREATE TABLE IF NOT EXISTS fix_queue_jobs (
      jobId TEXT PRIMARY KEY,
      projectId TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'bulk-auto-fix',
      status TEXT NOT NULL DEFAULT 'queued', -- queued | running | done | failed | cancelled

      total INTEGER NOT NULL DEFAULT 0,
      processed INTEGER NOT NULL DEFAULT 0,
      okCount INTEGER NOT NULL DEFAULT 0,
      failCount INTEGER NOT NULL DEFAULT 0,

      options TEXT, -- JSON
      ids TEXT,     -- JSON array

      lastError TEXT,

      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      startedAt TEXT,
      finishedAt TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_fix_queue_jobs_project_time
      ON fix_queue_jobs(projectId, createdAt);
  `);

  safeExec(`
    CREATE TABLE IF NOT EXISTS fix_queue_job_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jobId TEXT NOT NULL,
      projectId TEXT NOT NULL,
      itemId INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'queued', -- queued | running | done | failed
      error TEXT,
      startedAt TEXT,
      finishedAt TEXT,

      suggestedTitle TEXT,
      suggestedMetaDescription TEXT,
      suggestedH1 TEXT,

      UNIQUE(jobId, itemId)
    );

    CREATE INDEX IF NOT EXISTS idx_fix_queue_job_items_job
      ON fix_queue_job_items(jobId);

    CREATE INDEX IF NOT EXISTS idx_fix_queue_job_items_status
      ON fix_queue_job_items(jobId, status);
  `);

  // Postgres: skip legacy SQLite migrations (PRAGMA, ALTER TABLE rename)
  if (isPg) {
    return;
  }

  // ---- Legacy migration safety for fix_queue ----
  try {
    const cols = getTableColumns("fix_queue");

    if (cols.has("issue") || !cols.has("updatedAt")) {
      const tmp = `fix_queue_legacy_${Date.now()}`;
      safeExec(`ALTER TABLE fix_queue RENAME TO ${tmp};`);

      safeExec(`
        CREATE TABLE IF NOT EXISTS fix_queue (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          projectId TEXT NOT NULL,
          url TEXT NOT NULL,
          issues TEXT,
          status TEXT NOT NULL DEFAULT 'open',
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
      `);

      safeExec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_fix_queue_project_url
          ON fix_queue(projectId, url);
      `);

      const legacyCols = getTableColumns(tmp);
      const hasIssues = legacyCols.has("issues");
      const hasIssue = legacyCols.has("issue");

      const issuesExpr = hasIssues
        ? `
          CASE
            WHEN issues IS NOT NULL AND trim(issues) != '' THEN
              CASE WHEN substr(trim(issues), 1, 1) = '[' THEN issues ELSE json_array(upper(trim(issues))) END
            ELSE '[]'
          END
        `
        : hasIssue
        ? `
          CASE
            WHEN issue IS NOT NULL AND trim(issue) != '' THEN json_array(upper(trim(issue)))
            ELSE '[]'
          END
        `
        : `'[]'`;

      const createdExpr = legacyCols.has("createdAt") ? "createdAt" : `'${nowIso()}'`;
      const updatedExpr = legacyCols.has("updatedAt") ? "updatedAt" : createdExpr;

      safeExec(`
        INSERT OR IGNORE INTO fix_queue (
          projectId, url, issues, status, owner, notes,
          suggestedTitle, suggestedMetaDescription, suggestedH1, lastSuggestedAt,
          createdAt, updatedAt, doneAt
        )
        SELECT
          projectId,
          url,
          ${issuesExpr},
          COALESCE(status, 'open') AS status,
          ${legacyCols.has("owner") ? "owner" : "NULL"} AS owner,
          ${legacyCols.has("notes") ? "notes" : "NULL"} AS notes,
          ${legacyCols.has("suggestedTitle") ? "suggestedTitle" : "NULL"} AS suggestedTitle,
          ${
            legacyCols.has("suggestedMetaDescription")
              ? "suggestedMetaDescription"
              : "NULL"
          } AS suggestedMetaDescription,
          ${legacyCols.has("suggestedH1") ? "suggestedH1" : "NULL"} AS suggestedH1,
          ${legacyCols.has("lastSuggestedAt") ? "lastSuggestedAt" : "NULL"} AS lastSuggestedAt,
          ${createdExpr} AS createdAt,
          COALESCE(${updatedExpr}, ${createdExpr}) AS updatedAt,
          ${legacyCols.has("doneAt") ? "doneAt" : "NULL"} AS doneAt
        FROM ${tmp}
        ORDER BY datetime(COALESCE(${updatedExpr}, ${createdExpr})) DESC;
      `);

      safeExec(`
        CREATE INDEX IF NOT EXISTS idx_fix_queue_project_status
          ON fix_queue(projectId, status);

        CREATE INDEX IF NOT EXISTS idx_fix_queue_project_updated
          ON fix_queue(projectId, updatedAt);
      `);

      safeExec(`DROP TABLE IF EXISTS ${tmp};`);
    }
  } catch (e) {
    console.warn("[FixQueue] schema migration warning (continuing):", e?.message || e);
  }
}

ensureFixQueueSchema();

// ---------------------------
// Audit
// ---------------------------

function logAudit(projectId, itemId, actionType, updatedBy, meta) {
  const at = nowIso();
  const by = clampText(updatedBy, 120);
  const metaJson = meta ? JSON.stringify(meta) : null;

  db.prepare(
    `
    INSERT INTO fix_queue_audit (projectId, itemId, actionType, updatedBy, meta, createdAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `
  ).run(projectId, itemId || null, actionType, by, metaJson, at);

  return { ok: true };
}

function listAudit(projectId, itemId, { limit = 200 } = {}) {
  const safeLimit = Math.min(Math.max(coerceNumber(limit, 200), 1), 500);

  const rows = db
    .prepare(
      `
      SELECT id, projectId, itemId, actionType, updatedBy, meta, createdAt
      FROM fix_queue_audit
      WHERE projectId = ? AND itemId = ?
      ORDER BY datetime(createdAt) DESC
      LIMIT ${safeLimit}
    `
    )
    .all(projectId, Number(itemId));

  return rows.map((r) => ({
    id: r.id,
    projectId: r.projectId,
    itemId: r.itemId,
    actionType: r.actionType,
    updatedBy: r.updatedBy || null,
    meta: r.meta ? safeJsonParse(r.meta) : null,
    createdAt: r.createdAt,
  }));
}

// ---------------------------
// Counts + list
// ---------------------------

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
  const safeLimit = Math.min(Math.max(coerceNumber(limit, 200), 1), 1000);

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
        datetime(updatedAt) DESC
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

    suggestedAt: r.lastSuggestedAt || null,
    lastSuggestedAt: r.lastSuggestedAt || null,

    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    doneAt: r.doneAt || null,
  }));

  return { items, counts: getCounts(projectId) };
}

// ---------------------------
// Add / Update / Bulk Done / Dedupe
// ---------------------------

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

      const inserted = db
        .prepare(`SELECT id FROM fix_queue WHERE projectId = ? AND url = ?`)
        .get(projectId, u);

      if (inserted?.id) {
        logAudit(projectId, inserted.id, "create", null, { url: u, issues: nextIssues });
      }

      return { created: true, updated: false };
    }

    const mergedIssues = issueUnion(parseIssues(existing.issues), nextIssues);
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
    ).run(
      JSON.stringify(mergedIssues),
      nextStatus,
      now,
      nextStatus,
      existing.id
    );

    logAudit(projectId, existing.id, "upsert", null, {
      url: u,
      issues: mergedIssues,
      status: nextStatus,
    });

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

  const nextOwner = patch.owner !== undefined ? clampText(patch.owner, 120) : null;
  const nextNotes = patch.notes !== undefined ? clampText(patch.notes, 5000) : null;

  let nextStatus = patch.status !== undefined ? normaliseString(patch.status) : null;
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

  const setSuggestedAt = patch.lastSuggestedAt === true;

  db.prepare(
    `
    UPDATE fix_queue
    SET
      owner = CASE WHEN ? IS NULL THEN owner ELSE ? END,
      notes = CASE WHEN ? IS NULL THEN notes ELSE ? END,

      status = CASE WHEN ? IS NULL THEN status ELSE ? END,
      doneAt = CASE
        WHEN (CASE WHEN ? IS NULL THEN status ELSE ? END) = 'done' THEN COALESCE(doneAt, ?)
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
        WHEN ? = 1 THEN ?
        ELSE lastSuggestedAt
      END,

      updatedAt = ?
    WHERE projectId = ? AND id = ?
  `
  ).run(
    nextOwner === null ? null : "set",
    nextOwner,

    nextNotes === null ? null : "set",
    nextNotes,

    nextStatus === null ? null : "set",
    nextStatus,

    nextStatus === null ? null : "set",
    nextStatus,
    now,

    nextIssues === null ? null : "set",
    nextIssues === null ? null : JSON.stringify(nextIssues),

    nextSuggestedTitle === null ? null : "set",
    nextSuggestedTitle,

    nextSuggestedMeta === null ? null : "set",
    nextSuggestedMeta,

    nextSuggestedH1 === null ? null : "set",
    nextSuggestedH1,

    setSuggestedAt ? 1 : 0,
    now,

    now,
    projectId,
    itemId
  );

  const meta = {};
  if (patch.owner !== undefined) meta.owner = nextOwner;
  if (patch.notes !== undefined) meta.notes = nextNotes;
  if (patch.status !== undefined) meta.status = nextStatus;
  if (patch.issues !== undefined) meta.issues = nextIssues;
  if (patch.suggestedTitle !== undefined) meta.suggestedTitle = nextSuggestedTitle;
  if (patch.suggestedMetaDescription !== undefined)
    meta.suggestedMetaDescription = nextSuggestedMeta;
  if (patch.suggestedH1 !== undefined) meta.suggestedH1 = nextSuggestedH1;
  if (setSuggestedAt) meta.suggestedAt = now;

  logAudit(projectId, itemId, "patch", updatedBy || null, meta);

  return { ok: true };
}

function bulkMarkDone(projectId, ids = [], { updatedBy } = {}) {
  const clean = (Array.isArray(ids) ? ids : [])
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n));
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
      if ((res.changes || 0) > 0) {
        updated += res.changes || 0;
        logAudit(projectId, id, "done", updatedBy || null, { via: "bulk" });
      }
    }
    return updated;
  });

  const updated = tx();
  return { ok: true, updated };
}

function dedupeFixQueue(projectId) {
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

  if (!toDelete.length) return { ok: true, deleted: 0 };

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
  return { ok: true, deleted };
}

// ---------------------------
// OpenAI JSON helper (safe throughput: retries/backoff)
// ---------------------------

async function fetchWithRetry(url, options, retryOpts = {}) {
  const maxRetries = Math.min(Math.max(coerceNumber(retryOpts.maxRetries, 3), 0), 8);
  const baseDelayMs = Math.min(Math.max(coerceNumber(retryOpts.baseDelayMs, 750), 0), 10000);
  const maxDelayMs = Math.min(Math.max(coerceNumber(retryOpts.maxDelayMs, 8000), 0), 30000);

  let attempt = 0;
  let lastErr = null;

  while (attempt <= maxRetries) {
    try {
      const res = await fetch(url, options);

      // Retry on rate limit or transient server errors
      if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
        const retryAfter = res.headers.get("retry-after");
        let waitMs = 0;

        if (retryAfter) {
          const asNum = Number(retryAfter);
          if (Number.isFinite(asNum)) waitMs = Math.round(asNum * 1000);
        }

        if (!waitMs) {
          const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
          waitMs = jitter(exp, 0.25);
        }

        const text = await res.text().catch(() => "");
        lastErr = new Error(`HTTP ${res.status}: ${text || res.statusText}`);

        if (attempt === maxRetries) return { ok: false, res, error: lastErr };
        await sleep(waitMs);
        attempt += 1;
        continue;
      }

      return { ok: true, res };
    } catch (e) {
      lastErr = e;
      if (attempt === maxRetries) return { ok: false, res: null, error: lastErr };
      const exp = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      await sleep(jitter(exp, 0.25));
      attempt += 1;
    }
  }

  return { ok: false, res: null, error: lastErr || new Error("fetch failed") };
}

async function openAiJson({ prompt, model, retry } = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, error: "OPENAI_API_KEY not set" };

  const chosenModel = model || process.env.OPENAI_MODEL || "gpt-4o-mini";

  const payload = {
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
  };

  const resWrap = await fetchWithRetry(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    },
    retry || {}
  );

  if (!resWrap.ok) {
    const msg = resWrap?.error?.message || "OpenAI request failed";
    return { ok: false, error: msg };
  }

  const res = resWrap.res;
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

// ---------------------------
// Auto-fix (single item)
// ---------------------------

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

  const ai = await openAiJson({
    prompt,
    retry: {
      maxRetries: coerceNumber(process.env.AURA_OPENAI_MAX_RETRIES, 3),
      baseDelayMs: coerceNumber(process.env.AURA_OPENAI_BASE_DELAY_MS, 750),
      maxDelayMs: coerceNumber(process.env.AURA_OPENAI_MAX_DELAY_MS, 8000),
    },
  });

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

  logAudit(projectId, itemId, "auto-fix", updatedBy || null, {
    url,
    usedAi: !!(ai.ok && ai.json),
    suggestedTitle,
    suggestedMetaDescription,
    suggestedH1,
  });

  return {
    ok: true,
    id: itemId,
    url,
    suggestedTitle,
    suggestedMetaDescription,
    suggestedH1,
    suggestedAt: now,
    usedAi: !!(ai.ok && ai.json),
  };
}

// ---------------------------
// Export CSV
// ---------------------------

function exportFixQueueCsv(projectId, { status = "open" } = {}) {
  let where = "projectId = ?";
  const params = [projectId];

  if (status && status !== "all") {
    where += " AND status = ?";
    params.push(status);
  }

  const rows = db
    .prepare(
      `
      SELECT id, url, issues, status, owner, notes,
             suggestedTitle, suggestedMetaDescription, suggestedH1, lastSuggestedAt,
             createdAt, updatedAt, doneAt
      FROM fix_queue
      WHERE ${where}
      ORDER BY datetime(updatedAt) DESC
    `
    )
    .all(...params);

  const header = [
    "id",
    "url",
    "issues",
    "status",
    "owner",
    "notes",
    "suggestedTitle",
    "suggestedMetaDescription",
    "suggestedH1",
    "suggestedAt",
    "createdAt",
    "updatedAt",
    "doneAt",
  ];

  const esc = (v) => {
    const s = v === undefined || v === null ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const lines = [header.join(",")];

  for (const r of rows) {
    const issuesArr = parseIssues(r.issues);
    lines.push(
      [
        r.id,
        r.url,
        JSON.stringify(issuesArr),
        r.status,
        r.owner || "",
        r.notes || "",
        r.suggestedTitle || "",
        r.suggestedMetaDescription || "",
        r.suggestedH1 || "",
        r.lastSuggestedAt || "",
        r.createdAt || "",
        r.updatedAt || "",
        r.doneAt || "",
      ]
        .map(esc)
        .join(",")
    );
  }

  return lines.join("\n");
}

// ---------------------------
// Bulk Auto-Fix Jobs (server-side)
// ---------------------------

function getJob(projectId, jobId) {
  const row = db
    .prepare(
      `
      SELECT *
      FROM fix_queue_jobs
      WHERE projectId = ? AND jobId = ?
    `
    )
    .get(projectId, jobId);

  if (!row) return null;

  return {
    jobId: row.jobId,
    projectId: row.projectId,
    type: row.type,
    status: row.status,
    total: row.total,
    processed: row.processed,
    okCount: row.okCount,
    failCount: row.failCount,
    options: row.options ? safeJsonParse(row.options) : null,
    ids: row.ids ? safeJsonParse(row.ids) : null,
    lastError: row.lastError || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    startedAt: row.startedAt || null,
    finishedAt: row.finishedAt || null,
  };
}

function listJobs(projectId, { limit = 20 } = {}) {
  const safeLimit = Math.min(Math.max(coerceNumber(limit, 20), 1), 100);

  const rows = db
    .prepare(
      `
      SELECT jobId, projectId, type, status, total, processed, okCount, failCount, lastError,
             createdAt, updatedAt, startedAt, finishedAt
      FROM fix_queue_jobs
      WHERE projectId = ?
      ORDER BY datetime(createdAt) DESC
      LIMIT ${safeLimit}
    `
    )
    .all(projectId);

  return rows.map((r) => ({
    jobId: r.jobId,
    projectId: r.projectId,
    type: r.type,
    status: r.status,
    total: r.total,
    processed: r.processed,
    okCount: r.okCount,
    failCount: r.failCount,
    lastError: r.lastError || null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    startedAt: r.startedAt || null,
    finishedAt: r.finishedAt || null,
  }));
}

function listJobItems(projectId, jobId, { limit = 200 } = {}) {
  const safeLimit = Math.min(Math.max(coerceNumber(limit, 200), 1), 500);

  const rows = db
    .prepare(
      `
      SELECT itemId, status, error, startedAt, finishedAt,
             suggestedTitle, suggestedMetaDescription, suggestedH1
      FROM fix_queue_job_items
      WHERE projectId = ? AND jobId = ?
      ORDER BY id ASC
      LIMIT ${safeLimit}
    `
    )
    .all(projectId, jobId);

  return rows.map((r) => ({
    itemId: r.itemId,
    status: r.status,
    error: r.error || null,
    startedAt: r.startedAt || null,
    finishedAt: r.finishedAt || null,
    suggestedTitle: r.suggestedTitle || null,
    suggestedMetaDescription: r.suggestedMetaDescription || null,
    suggestedH1: r.suggestedH1 || null,
  }));
}

function cancelJob(projectId, jobId) {
  const now = nowIso();
  const res = db
    .prepare(
      `
      UPDATE fix_queue_jobs
      SET status = 'cancelled', updatedAt = ?, finishedAt = COALESCE(finishedAt, ?)
      WHERE projectId = ? AND jobId = ? AND status IN ('queued', 'running')
    `
    )
    .run(now, now, projectId, jobId);

  return { ok: true, cancelled: (res.changes || 0) > 0 };
}

function createBulkAutoFixJob(projectId, ids = [], options = {}) {
  const cleanIds = (Array.isArray(ids) ? ids : [])
    .map((x) => Number(x))
    .filter((n) => Number.isFinite(n));

  if (!cleanIds.length) throw new Error("ids is required");

  const jobId = makeJobId();
  const now = nowIso();

  const opts = {
    brand: normaliseString(options.brand) || null,
    tone: normaliseString(options.tone) || null,
    market: normaliseString(options.market) || null,
    updatedBy: normaliseString(options.updatedBy) || null,

    // concurrency: keep low to protect OpenAI + your Render CPU
    concurrency: Math.min(Math.max(coerceNumber(options.concurrency, 1), 1), 3),
    delayMs: Math.min(Math.max(coerceNumber(options.delayMs, 750), 0), 5000),
  };

  db.transaction(() => {
    db.prepare(
      `
      INSERT INTO fix_queue_jobs (
        jobId, projectId, type, status,
        total, processed, okCount, failCount,
        options, ids,
        lastError,
        createdAt, updatedAt, startedAt, finishedAt
      ) VALUES (
        ?, ?, 'bulk-auto-fix', 'queued',
        ?, 0, 0, 0,
        ?, ?,
        NULL,
        ?, ?, NULL, NULL
      )
    `
    ).run(
      jobId,
      projectId,
      cleanIds.length,
      JSON.stringify(opts),
      JSON.stringify(cleanIds),
      now,
      now
    );

    const stmt = db.prepare(
      `
      INSERT OR IGNORE INTO fix_queue_job_items (
        jobId, projectId, itemId, status, error, startedAt, finishedAt,
        suggestedTitle, suggestedMetaDescription, suggestedH1
      ) VALUES (
        ?, ?, ?, 'queued', NULL, NULL, NULL,
        NULL, NULL, NULL
      )
    `
    );

    for (const itemId of cleanIds) {
      stmt.run(jobId, projectId, itemId);
    }
  })();

  setImmediate(() => {
    runBulkAutoFixJob(projectId, jobId).catch((e) => {
      console.error("[FixQueue] bulk job fatal error:", e);
    });
  });

  logAudit(projectId, null, "bulk-auto-fix:create", opts.updatedBy || null, {
    jobId,
    total: cleanIds.length,
    concurrency: opts.concurrency,
    delayMs: opts.delayMs,
  });

  return { ok: true, jobId, total: cleanIds.length, status: "queued" };
}

async function runBulkAutoFixJob(projectId, jobId) {
  const job = getJob(projectId, jobId);
  if (!job) return;
  if (!["queued"].includes(job.status)) return;

  const now = nowIso();
  db.prepare(
    `
    UPDATE fix_queue_jobs
    SET status = 'running', startedAt = ?, updatedAt = ?
    WHERE projectId = ? AND jobId = ? AND status = 'queued'
  `
  ).run(now, now, projectId, jobId);

  const refreshed = getJob(projectId, jobId);
  const ids = Array.isArray(refreshed?.ids) ? refreshed.ids : [];
  const opts = refreshed?.options || {};
  const concurrency = Math.max(1, Math.min(Number(opts.concurrency || 1), 3));
  const delayMs = Math.max(0, Math.min(Number(opts.delayMs || 0), 5000));

  let processed = 0;
  let okCount = 0;
  let failCount = 0;

  let cancelled = false;
  let fatalError = null;
  let idx = 0;

  const updateJobProgress = () => {
    const t = nowIso();
    db.prepare(
      `
      UPDATE fix_queue_jobs
      SET
        processed = ?,
        okCount = ?,
        failCount = ?,
        updatedAt = ?,
        lastError = ?
      WHERE projectId = ? AND jobId = ?
    `
    ).run(
      processed,
      okCount,
      failCount,
      t,
      fatalError ? String(fatalError) : null,
      projectId,
      jobId
    );
  };

  const markItem = (itemId, status, fields = {}) => {
    const t = nowIso();
    db.prepare(
      `
      UPDATE fix_queue_job_items
      SET
        status = ?,
        error = ?,
        startedAt = COALESCE(startedAt, ?),
        finishedAt = CASE WHEN ? IN ('done','failed') THEN ? ELSE finishedAt END,
        suggestedTitle = COALESCE(?, suggestedTitle),
        suggestedMetaDescription = COALESCE(?, suggestedMetaDescription),
        suggestedH1 = COALESCE(?, suggestedH1)
      WHERE projectId = ? AND jobId = ? AND itemId = ?
    `
    ).run(
      status,
      fields.error || null,
      t,
      status,
      t,
      fields.suggestedTitle || null,
      fields.suggestedMetaDescription || null,
      fields.suggestedH1 || null,
      projectId,
      jobId,
      itemId
    );
  };

  const shouldCancel = () => {
    const j = getJob(projectId, jobId);
    return j && j.status === "cancelled";
  };

  const worker = async () => {
    while (true) {
      if (shouldCancel()) {
        cancelled = true;
        return;
      }

      const itemId = ids[idx];
      idx += 1;
      if (itemId === undefined) return;

      try {
        markItem(itemId, "running");

        const result = await autoFixItem(projectId, itemId, {
          brand: opts.brand,
          tone: opts.tone,
          market: opts.market,
          updatedBy: opts.updatedBy,
        });

        markItem(itemId, "done", {
          suggestedTitle: result.suggestedTitle,
          suggestedMetaDescription: result.suggestedMetaDescription,
          suggestedH1: result.suggestedH1,
        });

        okCount += 1;
      } catch (e) {
        failCount += 1;
        markItem(itemId, "failed", { error: e?.message || "auto-fix failed" });
      } finally {
        processed += 1;
        updateJobProgress();
        if (delayMs > 0) await sleep(delayMs);
      }
    }
  };

  try {
    const workers = Array.from(
      { length: Math.max(1, Math.min(concurrency, 3)) },
      () => worker()
    );
    await Promise.all(workers);
  } catch (e) {
    fatalError = e?.message || String(e);
  }

  const finishAt = nowIso();

  if (cancelled) {
    db.prepare(
      `
      UPDATE fix_queue_jobs
      SET status = 'cancelled', updatedAt = ?, finishedAt = COALESCE(finishedAt, ?)
      WHERE projectId = ? AND jobId = ?
    `
    ).run(finishAt, finishAt, projectId, jobId);

    logAudit(projectId, null, "bulk-auto-fix:cancelled", opts.updatedBy || null, {
      jobId,
      processed,
      okCount,
      failCount,
    });

    return;
  }

  if (fatalError) {
    db.prepare(
      `
      UPDATE fix_queue_jobs
      SET status = 'failed', updatedAt = ?, finishedAt = ?, lastError = ?
      WHERE projectId = ? AND jobId = ?
    `
    ).run(finishAt, finishAt, String(fatalError), projectId, jobId);

    logAudit(projectId, null, "bulk-auto-fix:failed", opts.updatedBy || null, {
      jobId,
      processed,
      okCount,
      failCount,
      error: fatalError,
    });

    return;
  }

  db.prepare(
    `
    UPDATE fix_queue_jobs
    SET status = 'done', updatedAt = ?, finishedAt = ?
    WHERE projectId = ? AND jobId = ?
  `
  ).run(finishAt, finishAt, projectId, jobId);

  logAudit(projectId, null, "bulk-auto-fix:done", opts.updatedBy || null, {
    jobId,
    processed,
    okCount,
    failCount,
  });
}

// ---------------------------
// Apply suggestion (Framer-friendly via webhook)
// ---------------------------
//
// This function posts:
// {
//   projectId, itemId, url,
//   field: "title" | "metaDescription" | "h1",
//   value: "...",
//   suggestedTitle, suggestedMetaDescription, suggestedH1,
//   updatedBy,
//   at
// }
//
// Supported env vars (priority order):
//   1) MAKE_APPLY_FIX_QUEUE_WEBHOOK_URL   (recommended)
//   2) MAKE_APPLY_FIX_QUEUE_WEBHOOK       (legacy in your Render screenshot)
//   3) AURA_APPLY_WEBHOOK_URL             (older name used by earlier builds)
//

function getApplyWebhookUrl() {
  return (
    normaliseString(process.env.MAKE_APPLY_FIX_QUEUE_WEBHOOK_URL) ||
    normaliseString(process.env.MAKE_APPLY_FIX_QUEUE_WEBHOOK) ||
    normaliseString(process.env.AURA_APPLY_WEBHOOK_URL)
  );
}

async function applySuggestion(projectId, itemId, { field, updatedBy } = {}) {
  const id = Number(itemId);
  if (!Number.isFinite(id)) throw new Error("invalid id");

  const fieldNorm = normaliseString(field);
  if (!fieldNorm) throw new Error("field is required");

  const allowed = new Set(["title", "metaDescription", "h1"]);
  if (!allowed.has(fieldNorm)) throw new Error("field must be title|metaDescription|h1");

  const hook = getApplyWebhookUrl();
  if (!hook) {
    throw new Error(
      "Apply webhook URL not set. Configure one of: MAKE_APPLY_FIX_QUEUE_WEBHOOK_URL, MAKE_APPLY_FIX_QUEUE_WEBHOOK, AURA_APPLY_WEBHOOK_URL"
    );
  }

  const row = db
    .prepare(`SELECT * FROM fix_queue WHERE projectId = ? AND id = ?`)
    .get(projectId, id);

  if (!row) throw new Error("fix queue item not found");

  const suggestedTitle = row.suggestedTitle || "";
  const suggestedMetaDescription = row.suggestedMetaDescription || "";
  const suggestedH1 = row.suggestedH1 || "";

  let value = "";
  if (fieldNorm === "title") value = suggestedTitle;
  if (fieldNorm === "metaDescription") value = suggestedMetaDescription;
  if (fieldNorm === "h1") value = suggestedH1;

  if (!value) throw new Error(`No suggested value available for ${fieldNorm}`);

  const payload = {
    projectId,
    itemId: id,
    url: row.url,
    field: fieldNorm,
    value,
    suggestedTitle,
    suggestedMetaDescription,
    suggestedH1,
    updatedBy: normaliseString(updatedBy) || null,
    at: nowIso(),
  };

  const resWrap = await fetchWithRetry(
    hook,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { maxRetries: 2, baseDelayMs: 500, maxDelayMs: 2000 }
  );

  if (!resWrap.ok) {
    const msg = resWrap?.error?.message || "apply webhook failed";
    throw new Error(msg);
  }

  const res = resWrap.res;
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`apply webhook error ${res.status}: ${t || res.statusText}`);
  }

  logAudit(projectId, id, "apply", updatedBy || null, {
    field: fieldNorm,
    valueLen: value.length,
    hookHost: (() => {
      try {
        return new URL(hook).host;
      } catch {
        return null;
      }
    })(),
  });

  return { ok: true, projectId, id, field: fieldNorm, value };
}

// ---------------------------
// Exports
// ---------------------------

module.exports = {
  // fix queue
  listFixQueue,
  addFixQueueItem,
  updateFixQueueItem,
  bulkMarkDone,
  dedupeFixQueue,
  autoFixItem,
  exportFixQueueCsv,

  // audit
  listAudit,
  logAudit,

  // jobs
  createBulkAutoFixJob,
  getJob,
  listJobs,
  listJobItems,
  cancelJob,

  // apply
  applySuggestion,
};
