// DB model migration for AI Alt-Text Engine
// Table: alt_texts (id, image_url, alt_text, created_at, updated_at)
module.exports = {
  up: async (db) => {
    await db.run(`CREATE TABLE IF NOT EXISTS alt_texts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_url TEXT NOT NULL,
      alt_text TEXT,
      created_at TEXT,
      updated_at TEXT
    )`);
  },
  down: async (db) => {
    await db.run('DROP TABLE IF EXISTS alt_texts');
  }
};
