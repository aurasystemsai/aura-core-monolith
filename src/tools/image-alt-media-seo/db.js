// Persistent DB for Image Alt Media SEO
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '../../data/image-alt-media-seo.sqlite');
const db = new Database(dbPath);
db.exec(`CREATE TABLE IF NOT EXISTS images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT,
  altText TEXT,
  createdAt INTEGER
)`);
module.exports = {
  list: () => db.prepare('SELECT * FROM images').all(),
  get: id => db.prepare('SELECT * FROM images WHERE id = ?').get(id),
  create: data => {
    const info = db.prepare('INSERT INTO images (url, altText, createdAt) VALUES (?, ?, ?)').run(data.url, data.altText, Date.now());
    return module.exports.get(info.lastInsertRowid);
  },
  update: (id, data) => {
    db.prepare('UPDATE images SET url = ?, altText = ? WHERE id = ?').run(data.url, data.altText, id);
    return module.exports.get(id);
  },
  delete: id => db.prepare('DELETE FROM images WHERE id = ?').run(id).changes > 0,
  import: arr => {
    db.prepare('DELETE FROM images').run();
    arr.forEach(i => module.exports.create(i));
  }
};
