const { Pool } = require('pg');

const isTest = process.env.NODE_ENV === 'test' || process.env.IMAGE_ALT_MEDIA_SEO_INMEMORY === 'true';
const connectionString = process.env.DATABASE_URL || process.env.AURA_PG_URL;

if (!connectionString && !isTest) {
  throw new Error('DATABASE_URL or AURA_PG_URL must be set for Image Alt Media SEO');
}

// In-memory fallback for test runs or when explicitly requested.
if (isTest || !connectionString) {
  let images = [];
  let runs = [];
  let nextId = 1;
  let nextRunId = 1;
  const stamp = () => new Date().toISOString();
  const clone = obj => JSON.parse(JSON.stringify(obj));
  const filterBySearch = (arr, search = '') => {
    const term = (search || '').toLowerCase();
    if (!term) return arr;
    return arr.filter(i => (i.url || '').toLowerCase().includes(term) || (i.altText || '').toLowerCase().includes(term));
  };
  const paginate = (arr, offset = 0, limit = 50) => arr.slice(offset, offset + limit);

  module.exports = {
    list: async () => clone([...images].sort((a, b) => b.id - a.id)),
    listPaged: async ({ offset = 0, limit = 50, search = '' } = {}) => {
      const sorted = [...images].sort((a, b) => b.id - a.id);
      const filtered = filterBySearch(sorted, search);
      const items = paginate(filtered, offset, limit);
      return { items: clone(items), total: filtered.length };
    },
    get: async id => clone(images.find(i => i.id === Number(id)) || null),
    findByUrl: async url => {
      if (!url) return null;
      const lower = url.toLowerCase();
      return clone(images.find(i => (i.url || '').toLowerCase() === lower) || null);
    },
    create: async data => {
      const url = data.url || data.imageUrl || null;
      const altText = data.altText || data.content || '';
      const productTitle = data.productTitle || null;
      const productHandle = data.productHandle || null;
      const productId = data.productId || null;
      const imageId = data.imageId || null;
      const row = { id: nextId++, url, altText, productTitle, productHandle, productId, imageId, createdAt: stamp() };
      images.push(row);
      return clone(row);
    },
    upsertByUrl: async data => {
      const url = data.url || data.imageUrl || null;
      const altText = data.altText || data.content || '';
      const productTitle = data.productTitle || null;
      const productHandle = data.productHandle || null;
      const productId = data.productId || null;
      const imageId = data.imageId || null;
      if (!url) return null;
      const existingIdx = images.findIndex(i => (i.url || '').toLowerCase() === url.toLowerCase());
      if (existingIdx !== -1) {
        images[existingIdx] = { ...images[existingIdx], altText, productTitle, productHandle, productId, imageId, updatedAt: stamp() };
        return clone(images[existingIdx]);
      }
      const row = { id: nextId++, url, altText, productTitle, productHandle, productId, imageId, createdAt: stamp() };
      images.push(row);
      return clone(row);
    },
    update: async (id, data) => {
      const idx = images.findIndex(i => i.id === Number(id));
      if (idx === -1) return null;
      const current = images[idx];
      const hasUrl = Object.prototype.hasOwnProperty.call(data, 'url') || Object.prototype.hasOwnProperty.call(data, 'imageUrl');
      const hasAlt = Object.prototype.hasOwnProperty.call(data, 'altText') || Object.prototype.hasOwnProperty.call(data, 'content');
      const url = hasUrl ? (data.url || data.imageUrl || null) : current.url;
      const altText = hasAlt ? (data.altText || data.content || '') : current.altText;
      images[idx] = { ...current, url, altText, updatedAt: stamp() };
      return clone(images[idx]);
    },
    delete: async id => {
      const idx = images.findIndex(i => i.id === Number(id));
      if (idx === -1) return false;
      images.splice(idx, 1);
      return true;
    },
    import: async arr => {
      images = arr.map(item => ({
        id: nextId++,
        url: item.url || item.imageUrl || null,
        altText: item.altText || item.content || '',
        productTitle: item.productTitle || null,
        productHandle: item.productHandle || null,
        productId: item.productId || null,
        imageId: item.imageId || null,
        createdAt: stamp(),
      }));
    },
    exportAll: async () => clone([...images].sort((a, b) => b.id - a.id)),
    addRun: async summary => {
      const row = {
        id: nextRunId++,
        runId: summary.id,
        startedAt: new Date(summary.startedAt).toISOString(),
        durationMs: summary.durationMs,
        total: summary.total,
        ok: summary.ok,
        errors: summary.errors,
        chunkSize: summary.chunkSize,
        paceMs: typeof summary.paceMs === 'number' ? summary.paceMs : null,
        locale: summary.locale,
        safeMode: summary.safeMode,
        keywords: summary.keywords || null,
        brandTerms: summary.brandTerms || null,
        tone: summary.tone || null,
        verbosity: summary.verbosity || null,
      };
      runs.unshift(row);
      // Keep last 100 to mirror Postgres query
      runs = runs.slice(0, 100);
      return clone(row);
    },
    listRuns: async () => clone([...runs]),
    health: async () => ({ ok: true, mode: 'memory' }),
  };
} else {
  const pool = new Pool({
    connectionString,
    // Default to SSL for hosted Postgres; allow explicit opt-out via PGSSL=false.
    ssl: process.env.PGSSL === 'false' ? false : { rejectUnauthorized: false },
  });

  const ensureTables = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS image_alt_media_images (
        id SERIAL PRIMARY KEY,
        url TEXT,
        alt_text TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS image_alt_media_runs (
        id SERIAL PRIMARY KEY,
        run_id TEXT,
        started_at TIMESTAMPTZ,
        duration_ms INT,
        total INT,
        ok INT,
        errors INT,
        chunk_size INT,
        pace_ms INT,
        locale TEXT,
        safe_mode BOOLEAN,
        keywords TEXT,
        brand_terms TEXT,
        tone TEXT,
        verbosity TEXT
      );
      ALTER TABLE image_alt_media_runs ADD COLUMN IF NOT EXISTS pace_ms INT;
      ALTER TABLE image_alt_media_runs ADD COLUMN IF NOT EXISTS brand_terms TEXT;
      ALTER TABLE image_alt_media_runs ADD COLUMN IF NOT EXISTS tone TEXT;
      ALTER TABLE image_alt_media_runs ADD COLUMN IF NOT EXISTS verbosity TEXT;
      ALTER TABLE image_alt_media_images ADD COLUMN IF NOT EXISTS product_title TEXT;
      ALTER TABLE image_alt_media_images ADD COLUMN IF NOT EXISTS product_handle TEXT;
      ALTER TABLE image_alt_media_images ADD COLUMN IF NOT EXISTS product_id TEXT;
      ALTER TABLE image_alt_media_images ADD COLUMN IF NOT EXISTS image_id TEXT;
      CREATE INDEX IF NOT EXISTS idx_image_alt_media_images_url_lower ON image_alt_media_images (lower(url));
      CREATE INDEX IF NOT EXISTS idx_image_alt_media_images_alt_lower ON image_alt_media_images (lower(alt_text));
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_trgm') THEN
          CREATE EXTENSION pg_trgm;
        END IF;
      END $$;
      CREATE INDEX IF NOT EXISTS idx_image_alt_media_images_alt_trgm ON image_alt_media_images USING gin (alt_text gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_image_alt_media_images_url_trgm ON image_alt_media_images USING gin (url gin_trgm_ops);
    `);
  };

  const ready = ensureTables();

  const findByUrl = async url => {
    await ready;
    if (!url) return null;
    const { rows } = await pool.query('SELECT id, url, alt_text AS altText, created_at AS createdAt, product_title AS productTitle, product_handle AS productHandle, product_id AS productId, image_id AS imageId FROM image_alt_media_images WHERE lower(url) = lower($1) LIMIT 1', [url]);
    return rows[0] || null;
  };

  const upsertByUrl = async data => {
    await ready;
    const url = data.url || data.imageUrl || null;
    const altText = data.altText || data.content || '';
    const productTitle = data.productTitle || null;
    const productHandle = data.productHandle || null;
    const productId = data.productId || null;
    const imageId = data.imageId || null;
    if (!url) return null;
    const existing = await findByUrl(url);
    if (existing?.id) {
      const { rows } = await pool.query(
        'UPDATE image_alt_media_images SET alt_text = $1, product_title = $2, product_handle = $3, product_id = $4, image_id = $5 WHERE id = $6 RETURNING id, url, alt_text AS altText, created_at AS createdAt, product_title AS productTitle, product_handle AS productHandle, product_id AS productId, image_id AS imageId',
        [altText, productTitle, productHandle, productId, imageId, existing.id]
      );
      return rows[0] || null;
    }
    const { rows } = await pool.query(
      'INSERT INTO image_alt_media_images (url, alt_text, product_title, product_handle, product_id, image_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, url, alt_text AS altText, created_at AS createdAt, product_title AS productTitle, product_handle AS productHandle, product_id AS productId, image_id AS imageId',
      [url, altText, productTitle, productHandle, productId, imageId]
    );
    return rows[0] || null;
  };

  module.exports = {
    list: async () => {
      await ready;
      const { rows } = await pool.query('SELECT id, url, alt_text AS altText, created_at AS createdAt, product_title AS productTitle, product_handle AS productHandle, product_id AS productId, image_id AS imageId FROM image_alt_media_images ORDER BY id DESC');
      return rows;
    },
    findByUrl,
    listPaged: async ({ offset = 0, limit = 50, search = '' } = {}) => {
      await ready;
      const safeLimit = Math.min(Math.max(Number(limit) || 1, 1), 200);
      const safeOffset = Math.max(Number(offset) || 0, 0);
      const term = (search || '').trim();
      const searchParam = term ? `%${term}%` : null;
      const where = searchParam ? 'WHERE url ILIKE $1 OR alt_text ILIKE $1 OR product_title ILIKE $1' : '';
      const params = searchParam ? [searchParam, safeLimit, safeOffset] : [safeLimit, safeOffset];
      const listQuery = `SELECT id, url, alt_text AS altText, created_at AS createdAt, product_title AS productTitle, product_handle AS productHandle, product_id AS productId, image_id AS imageId FROM image_alt_media_images ${where} ORDER BY id DESC LIMIT $${searchParam ? 2 : 1} OFFSET $${searchParam ? 3 : 2}`;
      const countQuery = `SELECT COUNT(*) AS count FROM image_alt_media_images ${where}`;
      const [{ rows: itemsRows }, { rows: countRows }] = await Promise.all([
        pool.query(listQuery, params),
        pool.query(countQuery, searchParam ? [searchParam] : []),
      ]);
      return { items: itemsRows, total: Number(countRows[0]?.count || 0) };
    },
    get: async id => {
      await ready;
      const { rows } = await pool.query('SELECT id, url, alt_text AS altText, created_at AS createdAt, product_title AS productTitle, product_handle AS productHandle, product_id AS productId, image_id AS imageId FROM image_alt_media_images WHERE id = $1', [id]);
      return rows[0];
    },
    create: async data => {
      await ready;
      const url = data.url || data.imageUrl || null;
      const altText = data.altText || data.content || '';
      const productTitle = data.productTitle || null;
      const productHandle = data.productHandle || null;
      const productId = data.productId || null;
      const { rows } = await pool.query(
        'INSERT INTO image_alt_media_images (url, alt_text, product_title, product_handle, product_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, url, alt_text AS altText, created_at AS createdAt, product_title AS productTitle, product_handle AS productHandle, product_id AS productId',
        [url, altText, productTitle, productHandle, productId]
      );
      return rows[0];
    },
    upsertByUrl,
    update: async (id, data) => {
      await ready;
      const { rows: existingRows } = await pool.query('SELECT id, url, alt_text AS altText FROM image_alt_media_images WHERE id = $1', [id]);
      const current = existingRows[0];
      if (!current) return null;
      const hasUrl = Object.prototype.hasOwnProperty.call(data, 'url') || Object.prototype.hasOwnProperty.call(data, 'imageUrl');
      const hasAlt = Object.prototype.hasOwnProperty.call(data, 'altText') || Object.prototype.hasOwnProperty.call(data, 'content');
      const url = hasUrl ? (data.url || data.imageUrl || null) : current.url;
      const altText = hasAlt ? (data.altText || data.content || '') : current.altText;
      const { rows } = await pool.query(
        'UPDATE image_alt_media_images SET url = $1, alt_text = $2 WHERE id = $3 RETURNING id, url, alt_text AS altText, created_at AS createdAt',
        [url, altText, id]
      );
      return rows[0];
    },
    delete: async id => {
      await ready;
      const { rowCount } = await pool.query('DELETE FROM image_alt_media_images WHERE id = $1', [id]);
      return rowCount > 0;
    },
    import: async arr => {
      await ready;
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM image_alt_media_images');
        for (const item of arr) {
          const url = item.url || item.imageUrl || null;
          const altText = item.altText || item.content || '';
          await client.query('INSERT INTO image_alt_media_images (url, alt_text) VALUES ($1, $2)', [url, altText]);
        }
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    },
    exportAll: async () => {
      await ready;
      const { rows } = await pool.query('SELECT id, url, alt_text AS altText, created_at AS createdAt, product_title AS productTitle, product_handle AS productHandle, product_id AS productId, image_id AS imageId FROM image_alt_media_images ORDER BY id DESC');
      return rows;
    },
    // Runs
    addRun: async summary => {
      await ready;
      const { rows } = await pool.query(
        `INSERT INTO image_alt_media_runs (run_id, started_at, duration_ms, total, ok, errors, chunk_size, pace_ms, locale, safe_mode, keywords, brand_terms, tone, verbosity)
         VALUES ($1, to_timestamp($2 / 1000.0), $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id, run_id AS runId, started_at AS startedAt, duration_ms AS durationMs, total, ok, errors, chunk_size AS chunkSize, pace_ms AS paceMs, locale, safe_mode AS safeMode, keywords, brand_terms AS brandTerms, tone, verbosity`,
        [
          summary.id,
          summary.startedAt,
          summary.durationMs,
          summary.total,
          summary.ok,
          summary.errors,
          summary.chunkSize,
          typeof summary.paceMs === 'number' ? summary.paceMs : null,
          summary.locale,
          summary.safeMode,
          summary.keywords || null,
          summary.brandTerms || null,
          summary.tone || null,
          summary.verbosity || null,
        ]
      );
      return rows[0];
    },
    listRuns: async () => {
      await ready;
      const { rows } = await pool.query('SELECT id, run_id AS runId, started_at AS startedAt, duration_ms AS durationMs, total, ok, errors, chunk_size AS chunkSize, pace_ms AS paceMs, locale, safe_mode AS safeMode, keywords, brand_terms AS brandTerms, tone, verbosity FROM image_alt_media_runs ORDER BY started_at DESC LIMIT 100');
      return rows;
    },
    health: async () => {
      await pool.query('SELECT 1');
      return { ok: true };
    }
  };
}
