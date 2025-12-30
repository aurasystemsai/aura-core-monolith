// src/core/content.js
// -------------------------------------
// AURA Content API (generic, not just shops)
// Handles any "content item": product, blog, landing page, etc.
// -------------------------------------

const db = require("./db");

// Ensure table for generic content exists (SQLite or Postgres)
if (db.type === 'sqlite') {
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId TEXT NOT NULL,
      type TEXT NOT NULL,
      platform TEXT,
      externalId TEXT,
      url TEXT NOT NULL,
      title TEXT,
      metaDescription TEXT,
      h1 TEXT,
      bodyExcerpt TEXT,
      manualTitle TEXT,
      manualMetaDescription TEXT,
      raw TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_content_project_url
      ON content_items(projectId, url);
  `);
  // Add columns to existing installs safely (SQLite has no IF NOT EXISTS for ALTER COLUMN)
  function ensureColumn(table, column, typeSql) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all();
      const exists = cols.some((c) => c.name === column);
      if (!exists) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeSql};`);
      }
    } catch (err) {
      console.error("[Core] ensureColumn failed", table, column, err);
    }
  }
  ensureColumn("content_items", "manualTitle", "TEXT");
  ensureColumn("content_items", "manualMetaDescription", "TEXT");
} else if (db.type === 'postgres') {
  // Postgres schema creation (run once, or use migration tool)
  db.query(`
    CREATE TABLE IF NOT EXISTS content_items (
      id SERIAL PRIMARY KEY,
      projectId TEXT NOT NULL,
      type TEXT NOT NULL,
      platform TEXT,
      externalId TEXT,
      url TEXT NOT NULL,
      title TEXT,
      metaDescription TEXT,
      h1 TEXT,
      bodyExcerpt TEXT,
      manualTitle TEXT,
      manualMetaDescription TEXT,
      raw TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_content_project_url
      ON content_items(projectId, url);
  `);
}

function normaliseString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

function normaliseType(value) {
  const t = normaliseString(value);
  return t || "other";
}

/**
 * Upsert a batch of content rows for a project.
 * Called by /projects/:projectId/content/batch
 */
async function upsertContentItems(projectId, items) {
  console.time('[DB] upsertContentItems');
  const now = new Date().toISOString();
  const rows = (items || [])
    .map((item) => {
      const url = normaliseString(item.url);
      if (!url) return null;
      const incomingTitle = normaliseString(item.title);
      const incomingMeta = normaliseString(item.metaDescription);
      return {
        projectId,
        type: normaliseType(item.type),
        platform: normaliseString(item.platform),
        externalId: normaliseString(item.externalId),
        url,
        title: incomingTitle,
        metaDescription: incomingMeta,
        h1: normaliseString(item.h1),
        bodyExcerpt: normaliseString(item.bodyExcerpt),
        manualTitle: incomingTitle,
        manualMetaDescription: incomingMeta,
        raw: item.raw ? JSON.stringify(item.raw).slice(0, 32760) : null,
        createdAt: now,
        updatedAt: now,
      };
    })
    .filter(Boolean);
  if (!rows.length) {
    return { inserted: 0 };
  }
  if (db.type === 'sqlite') {
    const stmt = db.prepare(`
      INSERT INTO content_items (
        projectId, type, platform, externalId, url, title, metaDescription, h1, bodyExcerpt, manualTitle, manualMetaDescription, raw, createdAt, updatedAt
      ) VALUES (
        @projectId, @type, @platform, @externalId, @url, @title, @metaDescription, @h1, @bodyExcerpt, @manualTitle, @manualMetaDescription, @raw, @createdAt, @updatedAt
      )
      ON CONFLICT(projectId, url) DO UPDATE SET
        type = COALESCE(excluded.type, content_items.type),
        platform = COALESCE(excluded.platform, content_items.platform),
        externalId = COALESCE(excluded.externalId, content_items.externalId),
        title = COALESCE(excluded.title, content_items.title),
        metaDescription = COALESCE(excluded.metaDescription, content_items.metaDescription),
        h1 = COALESCE(excluded.h1, content_items.h1),
        bodyExcerpt = COALESCE(excluded.bodyExcerpt, content_items.bodyExcerpt),
        manualTitle = COALESCE(excluded.manualTitle, content_items.manualTitle),
        manualMetaDescription = COALESCE(excluded.manualMetaDescription, content_items.manualMetaDescription),
        raw = COALESCE(excluded.raw, content_items.raw),
        updatedAt = excluded.updatedAt;
    `);
    const tx = db.db.transaction((batch) => {
      for (const row of batch) {
        stmt.run(row);
      }
    });
    tx(rows);
    console.timeEnd('[DB] upsertContentItems');
    return { inserted: rows.length };
  } else if (db.type === 'postgres') {
    // Postgres upsert
    const client = await db.pool.connect();
    try {
      for (const row of rows) {
        await client.query(`
          INSERT INTO content_items (
            projectId, type, platform, externalId, url, title, metaDescription, h1, bodyExcerpt, manualTitle, manualMetaDescription, raw, createdAt, updatedAt
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
          )
          ON CONFLICT (projectId, url) DO UPDATE SET
            type = COALESCE(EXCLUDED.type, content_items.type),
            platform = COALESCE(EXCLUDED.platform, content_items.platform),
            externalId = COALESCE(EXCLUDED.externalId, content_items.externalId),
            title = COALESCE(EXCLUDED.title, content_items.title),
            metaDescription = COALESCE(EXCLUDED.metaDescription, content_items.metaDescription),
            h1 = COALESCE(EXCLUDED.h1, content_items.h1),
            bodyExcerpt = COALESCE(EXCLUDED.bodyExcerpt, content_items.bodyExcerpt),
            manualTitle = COALESCE(EXCLUDED.manualTitle, content_items.manualTitle),
            manualMetaDescription = COALESCE(EXCLUDED.manualMetaDescription, content_items.manualMetaDescription),
            raw = COALESCE(EXCLUDED.raw, content_items.raw),
            updatedAt = EXCLUDED.updatedAt;
        `, [
          row.projectId, row.type, row.platform, row.externalId, row.url, row.title, row.metaDescription, row.h1, row.bodyExcerpt, row.manualTitle, row.manualMetaDescription, row.raw, row.createdAt, row.updatedAt
        ]);
      }
    } finally {
      client.release();
    }
    console.timeEnd('[DB] upsertContentItems');
    return { inserted: rows.length };
  }
}
}

async function getContentItemByUrl(projectId, url) {
  const u = normaliseString(url);
  if (!projectId || !u) return null;
  if (db.type === 'sqlite') {
    const stmt = db.prepare(`
      SELECT * FROM content_items WHERE projectId = ? AND url = ? LIMIT 1
    `);
    return stmt.get(projectId, u) || null;
  } else if (db.type === 'postgres') {
    const result = await db.query(
      `SELECT * FROM content_items WHERE projectId = $1 AND url = $2 LIMIT 1`,
      [projectId, u]
    );
    return result.rows[0] || null;
  }
}

/**
 * Very simple SEO scoring for now:
 * - title length band 45–60
 * - meta length band 130–155
 * - H1 present
 *
 * IMPORTANT: use manual overrides first so the UI never lies.
 */
function scoreRow(row) {
  const issues = [];

  const effectiveTitle = row.manualTitle || row.title || "";
  const effectiveMeta = row.manualMetaDescription || row.metaDescription || "";

  const titleLen = effectiveTitle.length;
  const metaLen = effectiveMeta.length;

  const TITLE_MIN = 45;
  const TITLE_MAX = 60;
  const META_MIN = 130;
  const META_MAX = 155;

  let score = 100;

  // Title checks
  if (!titleLen) {
    score -= 40;
    issues.push("NO_TITLE");
  } else {
    if (titleLen < TITLE_MIN) {
      score -= 15;
      issues.push("TITLE_TOO_SHORT");
    }
    if (titleLen > TITLE_MAX) {
      score -= 10;
      issues.push("TITLE_TOO_LONG");
    }
  }

  // Meta checks
  if (!metaLen) {
    score -= 35;
    issues.push("NO_META");
  } else {
    if (metaLen < META_MIN) {
      score -= 10;
      issues.push("META_TOO_SHORT");
    }
    if (metaLen > META_MAX) {
      score -= 10;
      issues.push("META_TOO_LONG");
    }
  }

  // H1 presence (use stored h1 only)
  if (!row.h1) {
    score -= 5;
    issues.push("NO_H1");
  }

  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return {
    score,
    titleLength: titleLen,
    metaLength: metaLen,
    issues,
    effectiveTitle,
    effectiveMetaDescription: effectiveMeta,
  };
}

/**
 * Get "bad" content for a project.
 * Used by GET /projects/:projectId/content/health
 */
async function getContentHealth({ projectId, type, maxScore = 70, limit = 100 }) {
  console.time('[DB] getContentHealth');
  let rows = [];
  if (db.type === 'sqlite') {
    const params = [projectId];
    let where = "projectId = ?";
    if (type) {
      where += " AND type = ?";
      params.push(type);
    }
    const stmt = db.prepare(`
      SELECT * FROM content_items WHERE ${where} ORDER BY updatedAt DESC LIMIT ${Number(limit) || 100}
    `);
    rows = stmt.all(...params);
  } else if (db.type === 'postgres') {
    const params = [projectId];
    let where = "projectId = $1";
    let paramIdx = 2;
    if (type) {
      where += ` AND type = $${paramIdx}`;
      params.push(type);
      paramIdx++;
    }
    const result = await db.query(
      `SELECT * FROM content_items WHERE ${where} ORDER BY updatedAt DESC LIMIT $${paramIdx}`,
      [...params, Number(limit) || 100]
    );
    rows = result.rows;
  }
  console.timeEnd('[DB] getContentHealth');
  const scored = rows.map((row) => {
    const scoring = scoreRow(row);
    return {
      id: row.id,
      projectId: row.projectId,
      type: row.type,
      platform: row.platform,
      externalId: row.externalId,
      url: row.url,
      title: row.title,
      metaDescription: row.metaDescription,
      manualTitle: row.manualTitle,
      manualMetaDescription: row.manualMetaDescription,
      h1: row.h1,
      bodyExcerpt: row.bodyExcerpt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ...scoring,
    };
  });
  const numericMax = Number(maxScore);
  const filtered = Number.isFinite(numericMax)
    ? scored.filter((row) => row.score <= numericMax)
    : scored;
  filtered.sort((a, b) => a.score - b.score);
  return filtered;
}

module.exports = {
  upsertContentItems,
  getContentHealth,
  getContentItemByUrl,
};
