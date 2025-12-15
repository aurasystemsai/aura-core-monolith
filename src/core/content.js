// src/core/content.js
// -------------------------------------
// AURA Content API (generic, not just shops)
// Handles any "content item": product, blog, landing page, etc.
// -------------------------------------

const db = require("./db");

// Ensure table for generic content exists
db.exec(`
  CREATE TABLE IF NOT EXISTS content_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId TEXT NOT NULL,
    type TEXT NOT NULL,               -- product | blog | landing | category | docs | other
    platform TEXT,                    -- wordpress | webflow | etsy | static | other
    externalId TEXT,                  -- CMS id / product id / slug
    url TEXT NOT NULL,                -- canonical URL of the item
    title TEXT,
    metaDescription TEXT,
    h1 TEXT,
    bodyExcerpt TEXT,
    raw TEXT,                         -- raw JSON from source (optional, truncated)
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );

  CREATE UNIQUE INDEX IF NOT EXISTS idx_content_project_url
    ON content_items(projectId, url);
`);

function normaliseString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
}

/**
 * Upsert a batch of content rows for a project.
 * Called by /projects/:projectId/content/batch
 */
function upsertContentItems(projectId, items) {
  const now = new Date().toISOString();

  const rows = (items || [])
    .map((item) => {
      const url = normaliseString(item.url);
      if (!url) return null;

      return {
        projectId,
        type: normaliseString(item.type) || "other",
        platform: normaliseString(item.platform),
        externalId: normaliseString(item.externalId),
        url,
        title: normaliseString(item.title),
        metaDescription: normaliseString(item.metaDescription),
        h1: normaliseString(item.h1),
        bodyExcerpt: normaliseString(item.bodyExcerpt),
        raw: item.raw
          ? JSON.stringify(item.raw).slice(0, 32760) // protect against huge blobs
          : null,
        createdAt: now,
        updatedAt: now,
      };
    })
    .filter(Boolean);

  if (!rows.length) {
    return { inserted: 0 };
  }

  const stmt = db.prepare(`
    INSERT INTO content_items (
      projectId,
      type,
      platform,
      externalId,
      url,
      title,
      metaDescription,
      h1,
      bodyExcerpt,
      raw,
      createdAt,
      updatedAt
    )
    VALUES (
      @projectId,
      @type,
      @platform,
      @externalId,
      @url,
      @title,
      @metaDescription,
      @h1,
      @bodyExcerpt,
      @raw,
      @createdAt,
      @updatedAt
    )
    ON CONFLICT(projectId, url) DO UPDATE SET
      type           = excluded.type,
      platform       = excluded.platform,
      externalId     = excluded.externalId,
      title          = excluded.title,
      metaDescription= excluded.metaDescription,
      h1             = excluded.h1,
      bodyExcerpt    = excluded.bodyExcerpt,
      raw            = excluded.raw,
      updatedAt      = excluded.updatedAt;
  `);

  const tx = db.transaction((batch) => {
    for (const row of batch) {
      stmt.run(row);
    }
  });

  tx(rows);

  return { inserted: rows.length };
}

/**
 * Very simple SEO scoring for now:
 * - title length band 45–60
 * - meta length band 130–155
 * - H1 present
 */
function scoreRow(row) {
  const issues = [];

  const title = row.title || "";
  const meta = row.metaDescription || "";
  const titleLen = title.length;
  const metaLen = meta.length;

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

  // H1 presence
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
  };
}

/**
 * Get "bad" content for a project.
 * Used by GET /projects/:projectId/content/health
 */
function getContentHealth({ projectId, type, maxScore = 70, limit = 100 }) {
  const params = [projectId];
  let where = "projectId = ?";

  if (type) {
    where += " AND type = ?";
    params.push(type);
  }

  const stmt = db.prepare(`
    SELECT *
    FROM content_items
    WHERE ${where}
    ORDER BY updatedAt DESC
    LIMIT ${Number(limit) || 100}
  `);

  const rows = stmt.all(...params);

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
      h1: row.h1,
      bodyExcerpt: row.bodyExcerpt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      ...scoring,
    };
  });

  // Filter worst pages (score <= maxScore)
  const numericMax = Number(maxScore);
  const filtered = Number.isFinite(numericMax)
    ? scored.filter((row) => row.score <= numericMax)
    : scored;

  // Sort by score ascending (worst first)
  filtered.sort((a, b) => a.score - b.score);

  return filtered;
}

module.exports = {
  upsertContentItems,
  getContentHealth,
};
