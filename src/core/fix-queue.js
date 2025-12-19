// src/core/fix-queue.js
// -------------------------------------
// AURA Fix Queue Core
// Stores actionable SEO issues queued from Content Health.
// Adds: audit trail, bulk auto-fix, apply suggestion actions.
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

// NEW: Audit table
db.exec(`
  CREATE TABLE IF NOT EXISTS fix_queue_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    fixQueueId INTEGER NOT NULL,
    actionType TEXT NOT NULL, -- owner_update | notes_update | status_update | suggest | apply
    field TEXT,               -- owner | notes | status | title | meta | h1
    oldValue TEXT,
    newValue TEXT,
    actor TEXT,               -- optional (e.g. "Darren", "Dev", "system")
    createdAt TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_fix_queue_audit_project
    ON fix_queue_audit(projectId);

  CREATE INDEX IF NOT EXISTS idx_fix_queue_audit_item
    ON fix_queue_audit(projectId, fixQueueId);

  CREATE INDEX IF NOT EXISTS idx_fix_queue_audit_time
    ON fix_queue_audit(createdAt);
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
  return Array.from(
    new Set([...(safeIssues(a) || []), ...(safeIssues(b) || [])])
  );
}

function clampText(value, maxLen) {
  const s = normaliseString(value);
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function logAudit({
  projectId,
  fixQueueId,
  actionType,
  field,
  oldValue,
  newValue,
  actor,
}) {
  const now = nowIso();
  db.prepare(
    `
    INSERT INTO fix_queue_audit (
      projectId, fixQueueId, actionType, field,
      oldValue, newValue, actor, createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    projectId,
    Number(fixQueueId),
    String(actionType),
    field ? String(field) : null,
    oldValue !== undefined && oldValue !== null ? String(oldValue) : null,
    newValue !== undefined && newValue !== null ? String(newValue) : null,
    actor ? String(actor) : null,
    now
  );
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
  const safeLimit = Number.isFinite(lim)
    ? Math.min(Math.max(lim, 1), 1000)
    : 200;

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

function updateFixQueueItem(projectId, id, patch = {}, actor) {
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

  const nextOwner =
    patch.owner !== undefined ? clampText(patch.owner, 120) : undefined;
  const nextNotes =
    patch.notes !== undefined ? clampText(patch.notes, 5000) : undefined;

  let nextStatus =
    patch.status !== undefined ? normaliseString(patch.status) : undefined;
  if (nextStatus) nextStatus = nextStatus.toLowerCase();
  if (nextStatus && !["open", "done"].includes(nextStatus)) {
    throw new Error("status must be 'open' or 'done'");
  }

  const nextIssues =
    patch.issues !== undefined ? safeIssues(patch.issues) : undefined;

  const nextSuggestedTitle =
    patch.suggestedTitle !== undefined
      ? clampText(patch.suggestedTitle, 120)
      : undefined;
  const nextSuggestedMeta =
    patch.suggestedMetaDescription !== undefined
      ? clampText(patch.suggestedMetaDescription, 220)
      : undefined;
  const nextSuggestedH1 =
    patch.suggestedH1 !== undefined ? clampText(patch.suggestedH1, 140) : undefined;

  const setSuggestedAt =
    patch.lastSuggestedAt !== undefined ? now : undefined;

  const tx = db.transaction(() => {
    // audit diffs
    if (nextOwner !== undefined && (existing.owner || null) !== (nextOwner || null)) {
      logAudit({
        projectId,
        fixQueueId: itemId,
        actionType: "owner_update",
        field: "owner",
        oldValue: existing.owner || "",
        newValue: nextOwner || "",
        actor,
      });
    }

    if (nextNotes !== undefined && (existing.notes || null) !== (nextNotes || null)) {
      logAudit({
        projectId,
        fixQueueId: itemId,
        actionType: "notes_update",
        field: "notes",
        oldValue: existing.notes || "",
        newValue: nextNotes || "",
        actor,
      });
    }

    if (nextStatus !== undefined && existing.status !== nextStatus) {
      logAudit({
        projectId,
        fixQueueId: itemId,
        actionType: "status_update",
        field: "status",
        oldValue: existing.status,
        newValue: nextStatus,
        actor,
      });
    }

    if (nextIssues !== undefined) {
      logAudit({
        projectId,
        fixQueueId: itemId,
        actionType: "issues_update",
        field: "issues",
        oldValue: existing.issues || "[]",
        newValue: JSON.stringify(nextIssues),
        actor,
      });
    }

    if (nextSuggestedTitle !== undefined && (existing.suggestedTitle || "") !== (nextSuggestedTitle || "")) {
      logAudit({
        projectId,
        fixQueueId: itemId,
        actionType: "suggest",
        field: "title",
        oldValue: existing.suggestedTitle || "",
        newValue: nextSuggestedTitle || "",
        actor,
      });
    }

    if (nextSuggestedMeta !== undefined && (existing.suggestedMetaDescription || "") !== (nextSuggestedMeta || "")) {
      logAudit({
        projectId,
        fixQueueId: itemId,
        actionType: "suggest",
        field: "meta",
        oldValue: existing.suggestedMetaDescription || "",
        newValue: nextSuggestedMeta || "",
        actor,
      });
    }

    if (nextSuggestedH1 !== undefined && (existing.suggestedH1 || "") !== (nextSuggestedH1 || "")) {
      logAudit({
        projectId,
        fixQueueId: itemId,
        actionType: "suggest",
        field: "h1",
        oldValue: existing.suggestedH1 || "",
        newValue: nextSuggestedH1 || "",
        actor,
      });
    }

    db.prepare(
      `
      UPDATE fix_queue
      SET
        owner = CASE WHEN ? IS NULL THEN owner ELSE ? END,
        notes = CASE WHEN ? IS NULL THEN notes ELSE ? END,

        status = CASE WHEN ? IS NULL THEN status ELSE ? END,
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
      // owner
      nextOwner === undefined ? null : "set",
      nextOwner === undefined ? null : nextOwner,

      // notes
      nextNotes === undefined ? null : "set",
      nextNotes === undefined ? null : nextNotes,

      // status + doneAt
      nextStatus === undefined ? null : "set",
      nextStatus === undefined ? null : nextStatus,
      nextStatus === undefined ? null : nextStatus,
      now,

      // issues
      nextIssues === undefined ? null : "set",
      nextIssues === undefined ? null : JSON.stringify(nextIssues),

      // suggestedTitle
      nextSuggestedTitle === undefined ? null : "set",
      nextSuggestedTitle === undefined ? null : nextSuggestedTitle,

      // suggestedMeta
      nextSuggestedMeta === undefined ? null : "set",
      nextSuggestedMeta === undefined ? null : nextSuggestedMeta,

      // suggestedH1
      nextSuggestedH1 === undefined ? null : "set",
      nextSuggestedH1 === undefined ? null : nextSuggestedH1,

      // lastSuggestedAt
      setSuggestedAt === undefined ? null : "set",
      setSuggestedAt === undefined ? null : setSuggestedAt,

      now,
      projectId,
      itemId
    );
  });

  tx();
  return { ok: true };
}

function bulkMarkDone(projectId, ids = [], actor) {
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
      const before = db
        .prepare(`SELECT status FROM fix_queue WHERE projectId = ? AND id = ?`)
        .get(projectId, id);

      const res = stmt.run(now, now, projectId, id);
      updated += res.changes || 0;

      if (res.changes) {
        logAudit({
          projectId,
          fixQueueId: id,
          actionType: "status_update",
          field: "status",
          oldValue: before?.status || "open",
          newValue: "done",
          actor,
        });
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

async function autoFixItem(projectId, id, { brand, tone, market, actor } = {}) {
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

  const tx = db.transaction(() => {
    // audit suggestion changes vs previous
    if ((row.suggestedTitle || "") !== (suggestedTitle || "")) {
      logAudit({
        projectId,
        fixQueueId: itemId,
        actionType: "suggest",
        field: "title",
        oldValue: row.suggestedTitle || "",
        newValue: suggestedTitle || "",
        actor: actor || "system",
      });
    }

    if ((row.suggestedMetaDescription || "") !== (suggestedMetaDescription || "")) {
      logAudit({
        projectId,
        fixQueueId: itemId,
        actionType: "suggest",
        field: "meta",
        oldValue: row.suggestedMetaDescription || "",
        newValue: suggestedMetaDescription || "",
        actor: actor || "system",
      });
    }

    if ((row.suggestedH1 || "") !== (suggestedH1 || "")) {
      logAudit({
        projectId,
        fixQueueId: itemId,
        actionType: "suggest",
        field: "h1",
        oldValue: row.suggestedH1 || "",
        newValue: suggestedH1 || "",
        actor: actor || "system",
      });
    }

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
  });

  tx();

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

// NEW: bulk auto-fix with small concurrency
async function bulkAutoFix(projectId, ids = [], opts = {}) {
  const list = Array.isArray(ids) ? ids : [];
  const clean = list.map((x) => Number(x)).filter((n) => Number.isFinite(n));
  if (!clean.length) return { ok: true, results: [] };

  const concurrency = Number.isFinite(Number(opts.concurrency))
    ? Math.min(Math.max(Number(opts.concurrency), 1), 5)
    : 2;

  const queue = clean.slice();
  const results = [];
  const errors = [];

  const worker = async () => {
    while (queue.length) {
      const id = queue.shift();
      try {
        const r = await autoFixItem(projectId, id, {
          brand: opts.brand,
          tone: opts.tone,
          market: opts.market,
          actor: opts.actor || "system",
        });
        results.push(r);
      } catch (e) {
        errors.push({ id, error: e?.message || "auto-fix failed" });
      }
    }
  };

  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  return { ok: true, results, errors };
}

// NEW: apply a suggestion (initially applies to AURA record + audit trail).
// External platform writeback can be layered on once creds/integration exists.
function applySuggestion(projectId, id, { field, actor } = {}) {
  const itemId = Number(id);
  if (!Number.isFinite(itemId)) throw new Error("invalid id");

  const row = db
    .prepare(`SELECT * FROM fix_queue WHERE projectId = ? AND id = ?`)
    .get(projectId, itemId);

  if (!row) throw new Error("fix queue item not found");

  const f = normaliseString(field);
  if (!f || !["title", "meta", "h1"].includes(f)) {
    throw new Error("field must be one of: title, meta, h1");
  }

  const now = nowIso();

  const tx = db.transaction(() => {
    // audit the apply action
    const newValue =
      f === "title"
        ? row.suggestedTitle || ""
        : f === "meta"
        ? row.suggestedMetaDescription || ""
        : row.suggestedH1 || "";

    logAudit({
      projectId,
      fixQueueId: itemId,
      actionType: "apply",
      field: f,
      oldValue: "(not applied)",
      newValue: newValue,
      actor: actor || "system",
    });

    // For now: add an audit/notes marker so it’s “actioned”.
    const nextNotes = clampText(
      `${row.notes ? String(row.notes).trim() + "\n\n" : ""}Applied ${f} suggestion at ${now}.`,
      5000
    );

    db.prepare(
      `
      UPDATE fix_queue
      SET
        notes = ?,
        updatedAt = ?
      WHERE projectId = ? AND id = ?
    `
    ).run(nextNotes || null, now, projectId, itemId);
  });

  tx();

  const updated = db
    .prepare(`SELECT * FROM fix_queue WHERE projectId = ? AND id = ?`)
    .get(projectId, itemId);

  return {
    ok: true,
    id: itemId,
    status: updated.status,
    notes: updated.notes || null,
    updatedAt: updated.updatedAt,
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
  applySuggestion,
};
