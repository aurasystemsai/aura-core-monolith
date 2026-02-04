const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.AURA_PG_URL;
const pool = new Pool({
  connectionString,
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
      locale TEXT,
      safe_mode BOOLEAN,
      keywords TEXT
    );
  `);
};

const ready = ensureTables();

module.exports = {
  list: async () => {
    await ready;
    const { rows } = await pool.query('SELECT id, url, alt_text AS altText, created_at AS createdAt FROM image_alt_media_images ORDER BY id DESC');
    return rows;
  },
  get: async id => {
    await ready;
    const { rows } = await pool.query('SELECT id, url, alt_text AS altText, created_at AS createdAt FROM image_alt_media_images WHERE id = $1', [id]);
    return rows[0];
  },
  create: async data => {
    await ready;
    const url = data.url || data.imageUrl || null;
    const altText = data.altText || data.content || '';
    const { rows } = await pool.query(
      'INSERT INTO image_alt_media_images (url, alt_text) VALUES ($1, $2) RETURNING id, url, alt_text AS altText, created_at AS createdAt',
      [url, altText]
    );
    return rows[0];
  },
  update: async (id, data) => {
    await ready;
    const url = data.url || data.imageUrl || null;
    const altText = data.altText || data.content || '';
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
    const { rows } = await pool.query('SELECT id, url, alt_text AS altText, created_at AS createdAt FROM image_alt_media_images ORDER BY id DESC');
    return rows;
  },
  // Runs
  addRun: async summary => {
    await ready;
    const { rows } = await pool.query(
      `INSERT INTO image_alt_media_runs (run_id, started_at, duration_ms, total, ok, errors, chunk_size, locale, safe_mode, keywords)
       VALUES ($1, to_timestamp($2 / 1000.0), $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, run_id AS runId, started_at AS startedAt, duration_ms AS durationMs, total, ok, errors, chunk_size AS chunkSize, locale, safe_mode AS safeMode, keywords`,
      [summary.id, summary.startedAt, summary.durationMs, summary.total, summary.ok, summary.errors, summary.chunkSize, summary.locale, summary.safeMode, summary.keywords || null]
    );
    return rows[0];
  },
  listRuns: async () => {
    await ready;
    const { rows } = await pool.query('SELECT id, run_id AS runId, started_at AS startedAt, duration_ms AS durationMs, total, ok, errors, chunk_size AS chunkSize, locale, safe_mode AS safeMode, keywords FROM image_alt_media_runs ORDER BY started_at DESC LIMIT 100');
    return rows;
  },
  health: async () => {
    await pool.query('SELECT 1');
    return { ok: true };
  }
};
