// Product SEO Engine: Model
// This is a simple SQLite-backed model for product SEO records
const db = require('../../core/db');

const TABLE = 'product_seo';

async function init() {
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

async function create(data) {
  await init();
  const { product_id, title, meta_description, slug, keywords } = data;
  const result = await db.query(
    `INSERT INTO ${TABLE} (product_id, title, meta_description, slug, keywords) VALUES (?, ?, ?, ?, ?)`,
    [product_id, title, meta_description, slug, keywords]
  );
  return { id: result.lastID, ...data };
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

module.exports = { init, create, getAll, getById, update, remove };
