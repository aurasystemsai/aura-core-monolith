const path = require('path');
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, '../../data/link-intersect-outreach.sqlite'));
db.exec(`CREATE TABLE IF NOT EXISTS lio_i18n (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lang TEXT,
  key TEXT,
  value TEXT
)`);
// Seed defaults if empty
const count = db.prepare('SELECT COUNT(*) as c FROM lio_i18n').get().c;
if (count === 0) {
  const defaults = [
    ['en','campaign','Campaign'],['en','analyze','Analyze'],['en','outreach','Outreach'],['en','export','Export'],['en','import','Import'],
    ['es','campaign','Campaña'],['es','analyze','Analizar'],['es','outreach','Alcance'],['es','export','Exportar'],['es','import','Importar'],
    ['fr','campaign','Campagne'],['fr','analyze','Analyser'],['fr','outreach','Sensibilisation'],['fr','export','Exporter'],['fr','import','Importer'],
    ['de','campaign','Kampagne'],['de','analyze','Analysieren'],['de','outreach','Öffentlichkeitsarbeit'],['de','export','Exportieren'],['de','import','Importieren'],
  ];
  const stmt = db.prepare('INSERT INTO lio_i18n (lang, key, value) VALUES (?, ?, ?)');
  defaults.forEach(([lang, key, value]) => stmt.run(lang, key, value));
}
module.exports = {
  getStrings: (lang) => {
    const rows = db.prepare('SELECT key, value FROM lio_i18n WHERE lang = ?').all(lang);
    if (!rows.length) return db.prepare('SELECT key, value FROM lio_i18n WHERE lang = ?').all('en').reduce((a, r) => { a[r.key] = r.value; return a; }, {});
    return rows.reduce((a, r) => { a[r.key] = r.value; return a; }, {});
  },
  setString: (lang, key, value) => {
    const existing = db.prepare('SELECT id FROM lio_i18n WHERE lang = ? AND key = ?').get(lang, key);
    if (existing) db.prepare('UPDATE lio_i18n SET value = ? WHERE lang = ? AND key = ?').run(value, lang, key);
    else db.prepare('INSERT INTO lio_i18n (lang, key, value) VALUES (?, ?, ?)').run(lang, key, value);
    return { lang, key, value };
  },
  getSupportedLangs: () => db.prepare('SELECT DISTINCT lang FROM lio_i18n').all().map(r => r.lang),
};
