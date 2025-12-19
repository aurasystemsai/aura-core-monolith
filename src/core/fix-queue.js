// src/core/fix-queue.js
// -------------------------------------
// AURA Fix Queue Core
// Stores actionable SEO issues queued from Content Health.
// -------------------------------------

const db = require("./db");
const { fetchPageMeta } = require("./fetchPageMeta");

// Table + indexes
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
  // unique
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

function updateFixQueueItem(projectId, id, patch = {}) {
  const itemId = Number(id);
  if (!Number.isFinite(itemId)) throw new Error("invalid id");

  const now = nowIso();

  // Fetch to validate ownership + existing values
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

  // IMPORTANT:
  // We must distinguish between "field not provided" and "field provided but empty/clear".
  const ownerProvided = Object.prototype.hasOwnProperty.call(patch, "owner");
  const notesProvided = Object.prototype.hasOwnProperty.call(patch, "notes");
  const statusProvided = Object.prototype.hasOwnProperty.call(patch, "status");
  const issuesProvided = Object.prototype.hasOwnProperty.call(patch, "issues");
  const suggestedTitleProvided = Object.prototype.hasOwnProperty.call(patch, "suggestedTitle");
  const suggestedMetaProvided = Object.prototype.hasOwnProperty.call(
    patch,
    "suggestedMetaDescription"
  );
  const suggestedH1Provided = Object.prototype.hasOwnProperty.call(patch, "suggestedH1");
  const lastSuggestedProvided = Object.prototype.hasOwnProperty.call(patch, "lastSuggestedAt");

  const nextOwner = ownerProvided ? clampText(patch.owner, 120) : undefined; // can be null to clear
  const nextNotes = notesProvided ? clampText(patch.notes, 5000) : undefined; // can be null to clear

  let nextStatus = statusProvided ? normaliseString(patch.status) : undefined;
  if (nextStatus) nextStatus = nextStatus.toLowerCase();
  if (nextStatus && !["open", "done"].includes(nextStatus)) {
    throw new Error("status must be 'open' or 'done'");
  }

  const nextIssues = issuesProvided ? safeIssues(patch.issues) : undefined;

  const nextSuggestedTitle = suggestedTitleProvided
    ? clampText(patch.suggestedTitle, 120)
    : undefined;
  const nextSuggestedMeta = suggestedMetaProvided
    ? clampText(patch.suggestedMetaDescription, 220)
    : undefined;
  const nextSuggestedH1 = suggestedH1Provided ? clampText(patch.suggestedH1, 140) : undefined;

  // lastSuggestedAt:
  // if provided, we set lastSuggestedAt = now (or clear if explicitly null/empty)
  const nextLastSuggestedAt = lastSuggestedProvided
    ? normaliseString(patch.lastSuggestedAt) === null
      ? null
      : now
    : undefined;

  // For doneAt: if status becomes done, set doneAt if missing.
  const finalStatus = nextStatus !== undefined ? nextStatus : existing.status;
  const nextDoneAt = finalStatus === "done" ? existing.doneAt || now : null;

  db.prepare(
    `
    UPDATE fix_queue
    SET
      owner = CASE
        WHEN ? = 1 THEN ?
        ELSE owner
      END,

      notes = CASE
        WHEN ? = 1 THEN ?
        ELSE notes
      END,

      status = CASE
        WHEN ? = 1 THEN ?
        ELSE status
      END,

      doneAt = ?,

      issues = CASE
        WHEN ? = 1 THEN ?
        ELSE issues
      END,

      suggestedTitle = CASE
        WHEN ? = 1 THEN ?
        ELSE suggestedTitle
      END,

      suggestedMetaDescription = CASE
        WHEN ? = 1 THEN ?
        ELSE suggestedMetaDescription
      END,

      suggestedH1 = CASE
        WHEN ? = 1 THEN ?
        ELSE suggestedH1
      END,

      lastSuggestedAt = CASE
        WHEN ? = 1 THEN ?
        ELSE lastSuggestedAt
      END,

      updatedAt = ?
    WHERE projectId = ? AND id = ?
  `
  ).run(
    ownerProvided ? 1 : 0,
    nextOwner === undefined ? null : nextOwner,

    notesProvided ? 1 : 0,
    nextNotes === undefined ? null : nextNotes,

    statusProvided ? 1 : 0,
    nextStatus === undefined ? null : nextStatus,

    nextDoneAt,

    issuesProvided ? 1 : 0,
    nextIssues === undefined ? null : JSON.stringify(nextIssues),

    suggestedTitleProvided ? 1 : 0,
    nextSuggestedTitle === undefined ? null : nextSuggestedTitle,

    suggestedMetaProvided ? 1 : 0,
    nextSuggestedMeta === undefined ? null : nextSuggestedMeta,

    suggestedH1Provided ? 1 : 0,
    nextSuggestedH1 === undefined ? null : nextSuggestedH1,

    lastSuggestedProvided ? 1 : 0,
    nextLastSuggestedAt === undefined ? null : nextLastSuggestedAt,

    now,
    projectId,
    itemId
  );

  return { ok: true };
}

function bulkMarkDone(projectId, ids = []) {
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
    }
    return updated;
  });

  const updated = tx();
  return { ok: true, updated };
}

function dedupeFixQueue(projectId) {
  // If duplicates exist from older versions, keep the newest updatedAt per url.
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

  // Use Chat Completions for maximum compatibility.
  // Output must be strict JSON (no markdown).
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

  // Best-effort JSON parse
  try {
    const parsed = JSON.parse(raw);
    return { ok: true, json: parsed };
  } catch {
    // attempt to extract json object
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

async function autoFixItem(projectId, id, { brand, tone, market } = {}) {
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

  // Pull current page signals for context
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

  // Try OpenAI; fallback if unavailable
  const ai = await openAiJson({ prompt });
  if (ai.ok && ai.json) {
    suggestedTitle = clampText(ai.json.title, 120) || "";
    suggestedMetaDescription = clampText(ai.json.metaDescription, 220) || "";
    suggestedH1 = clampText(ai.json.h1, 140) || "";
  } else {
    // Deterministic fallback
    suggestedH1 = prettyName;
    suggestedTitle = trimToLen(`${prettyName} | ${b}`, 60);
    suggestedMetaDescription = trimToLen(
      `Explore ${prettyName} from ${b}. Clear details, key benefits and next steps — built for ${m}.`,
      155
    );
  }

  // Ensure not empty if issues demand them
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

  return {
    ok: true,
    id: itemId,
    url,
    suggestedTitle,
    suggestedMetaDescription,
    suggestedH1,
    usedAi: !!(ai.ok && ai.json),
  };
}

// NEW: Auto-fix many items in one go
async function autoFixMany(
  projectId,
  { ids, status = "open", limit = 200, brand, tone, market, concurrency = 3 } = {}
) {
  const safeConcurrency = Math.min(Math.max(Number(concurrency) || 3, 1), 8);

  let targetIds = Array.isArray(ids)
    ? ids.map((x) => Number(x)).filter((n) => Number.isFinite(n))
    : [];

  if (!targetIds.length) {
    const listed = listFixQueue(projectId, { status, limit });
    targetIds = (listed.items || [])
      .map((x) => Number(x.id))
      .filter((n) => Number.isFinite(n));
  }

  if (!targetIds.length) {
    return { ok: true, requested: 0, succeeded: 0, failed: 0, results: [] };
  }

  const queue = targetIds.slice();
  const results = [];
  let succeeded = 0;
  let failed = 0;

  const worker = async () => {
    while (queue.length) {
      const id = queue.shift();
      try {
        const r = await autoFixItem(projectId, id, { brand, tone, market });
        results.push({ id, ok: true, url: r.url, usedAi: r.usedAi });
        succeeded += 1;
      } catch (e) {
        results.push({ id, ok: false, error: e?.message || "auto-fix failed" });
        failed += 1;
      }
    }
  };

  const workers = Array.from({ length: safeConcurrency }, () => worker());
  await Promise.all(workers);

  return {
    ok: true,
    requested: targetIds.length,
    succeeded,
    failed,
    results,
  };
}

// NEW: Export CSV for Fix Queue
function exportFixQueueCsv(projectId, { status = "open", limit = 200 } = {}) {
  const { items } = listFixQueue(projectId, { status, limit });

  const esc = (v) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = [
    "id",
    "projectId",
    "url",
    "status",
    "issues",
    "owner",
    "notes",
    "suggestedTitle",
    "suggestedMetaDescription",
    "suggestedH1",
    "lastSuggestedAt",
    "createdAt",
    "updatedAt",
    "doneAt",
  ].join(",");

  const lines = [header];

  for (const it of items || []) {
    lines.push(
      [
        esc(it.id),
        esc(it.projectId),
        esc(it.url),
        esc(it.status),
        esc((Array.isArray(it.issues) ? it.issues : []).join("|")),
        esc(it.owner || ""),
        esc(it.notes || ""),
        esc(it.suggestedTitle || ""),
        esc(it.suggestedMetaDescription || ""),
        esc(it.suggestedH1 || ""),
        esc(it.lastSuggestedAt || ""),
        esc(it.createdAt || ""),
        esc(it.updatedAt || ""),
        esc(it.doneAt || ""),
      ].join(",")
    );
  }

  return lines.join("\n");
}

module.exports = {
  listFixQueue,
  addFixQueueItem,
  updateFixQueueItem,
  bulkMarkDone,
  dedupeFixQueue,
  autoFixItem,

  // NEW exports
  autoFixMany,
  exportFixQueueCsv,
};
