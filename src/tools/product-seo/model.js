// Product SEO Engine: Model
// This is a simple SQLite-backed model for product SEO records
const db = require('../../core/db');

const TABLE = 'product_seo';

async function init() {
  if (db.type === 'postgres') {
    await db.query(`CREATE TABLE IF NOT EXISTS ${TABLE} (
      id BIGSERIAL PRIMARY KEY,
      product_id TEXT,
      title TEXT,
      meta_description TEXT,
      slug TEXT,
      keywords TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
  } else {
    await db.query(`CREATE TABLE IF NOT EXISTS ${TABLE} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id TEXT,
      title TEXT,
      meta_description TEXT,
      slug TEXT,
      keywords TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  }
}

async function create(data) {
  await init();
  const { product_id, title, meta_description, slug, keywords } = data;
  
  if (db.type === 'postgres') {
    // PostgreSQL: use RETURNING clause
    const result = await db.query(
      `INSERT INTO ${TABLE} (product_id, title, meta_description, slug, keywords) VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [product_id, title, meta_description, slug, keywords]
    );
    return { id: result.rows[0].id, ...data };
  } else {
    // SQLite: use lastID
    const result = await db.query(
      `INSERT INTO ${TABLE} (product_id, title, meta_description, slug, keywords) VALUES (?, ?, ?, ?, ?)`,
      [product_id, title, meta_description, slug, keywords]
    );
    return { id: result.lastID, ...data };
  }
}

async function getAll() {
  await init();
  return db.queryAll(`SELECT * FROM ${TABLE} ORDER BY updated_at DESC`);
}

async function getById(id) {
  await init();
  return db.queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
}

async function update(id, data) {
  await init();
  const { title, meta_description, slug, keywords } = data;
  await db.query(
    `UPDATE ${TABLE} SET title = ?, meta_description = ?, slug = ?, keywords = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [title, meta_description, slug, keywords, id]
  );
  return getById(id);
}

async function remove(id) {
  await init();
  await db.query(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
  return true;
}


async function bulkCreate(items) {
  await init();
  const results = [];
  for (const item of items) {
    results.push(await create(item));
  }
  return results;
}

async function importFromCSV(csv) {
  const lines = csv.split('\n').filter(Boolean);
  const headers = lines[0].split(',');
  const imported = [];
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',');
    const obj = {};
    headers.forEach((h, idx) => { obj[h.trim()] = row[idx]?.trim(); });
    imported.push(await create(obj));
  }
  return imported;
}

async function exportToCSV() {
  const all = await getAll();
  if (!all.length) return '';
  const headers = Object.keys(all[0]);
  const csv = [headers.join(',')].concat(all.map(row => headers.map(h => row[h]).join(','))).join('\n');
  return csv;
}

// Analytics hook (example)
async function recordAnalytics(event) {
  // Could push to analytics module or DB
  return true;
}

module.exports = { init, create, getAll, getById, update, remove, bulkCreate, importFromCSV, exportToCSV, recordAnalytics };
